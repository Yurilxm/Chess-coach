from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from stockfish import Stockfish, StockfishException
from typing import Optional, List
import os
import chess
import random
from google import genai

# Configurar Gemini
GEMINI_API_KEY = "SUA_CHAVE_DE_API_DO_GEMINI_AQUI"
gemini_client = genai.Client(api_key=GEMINI_API_KEY)


# ============================================================
# LIVRO DE ABERTURAS (linhas completas com pesos)
# ============================================================

OPENING_LINES = {
    "italiana": {
        "name": "Abertura Italiana",
        "moves": ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4"],
        "weight": 30,
    },
    "ruy_lopez": {
        "name": "Ruy López",
        "moves": ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"],
        "weight": 20,
    },
    "escocesa": {
        "name": "Abertura Escocesa",
        "moves": ["e2e4", "e7e5", "g1f3", "b8c6", "d2d4"],
        "weight": 10,
    },
    "siciliana": {
        "name": "Defesa Siciliana",
        "moves": ["e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4", "f3d4", "g8f6", "b1c3"],
        "weight": 25,
    },
    "francesa": {
        "name": "Defesa Francesa",
        "moves": ["e2e4", "e7e6", "d2d4", "d7d5"],
        "weight": 15,
    },
    "caro_kann": {
        "name": "Defesa Caro-Kann",
        "moves": ["e2e4", "c7c6", "d2d4", "d7d5"],
        "weight": 10,
    },
    "pirc": {
        "name": "Defesa Pirc",
        "moves": ["e2e4", "d7d6", "d2d4", "g8f6", "b1c3", "g7g6"],
        "weight": 5,
    },
    "gambito_dama": {
        "name": "Gambito da Dama",
        "moves": ["d2d4", "d7d5", "c2c4", "e7e6", "b1c3", "g8f6"],
        "weight": 20,
    },
    "eslava": {
        "name": "Defesa Eslava",
        "moves": ["d2d4", "d7d5", "c2c4", "c7c6"],
        "weight": 15,
    },
    "india_rei": {
        "name": "Índia do Rei",
        "moves": ["d2d4", "g8f6", "c2c4", "g7g6", "b1c3", "f8g7"],
        "weight": 15,
    },
    "nimzo_india": {
        "name": "Nimzo-Índia",
        "moves": ["d2d4", "g8f6", "c2c4", "e7e6", "b1c3", "f8b4"],
        "weight": 10,
    },
    "inglesa": {
        "name": "Abertura Inglesa",
        "moves": ["c2c4", "e7e5", "b1c3", "g8f6", "g1f3", "b8c6"],
        "weight": 10,
    },
    "londres": {
        "name": "Sistema Londres",
        "moves": ["d2d4", "d7d5", "g1f3", "g8f6", "c1f4"],
        "weight": 10,
    },
}

OPENING_LEVELS = {
    200:  ["italiana", "londres"],
    400:  ["italiana", "londres", "gambito_dama"],
    600:  ["italiana", "escocesa", "gambito_dama", "londres"],
    800:  ["italiana", "ruy_lopez", "siciliana", "gambito_dama", "eslava"],
    1000: ["italiana", "ruy_lopez", "siciliana", "francesa", "gambito_dama", "eslava", "india_rei"],
    1200: ["italiana", "ruy_lopez", "siciliana", "francesa", "caro_kann", "gambito_dama", "eslava", "india_rei", "nimzo_india", "inglesa", "londres"],
    1400: ["italiana", "ruy_lopez", "siciliana", "francesa", "caro_kann", "pirc", "gambito_dama", "eslava", "india_rei", "nimzo_india", "inglesa", "londres"],
}

START_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

# Histórico da abertura atual
current_opening_line = None
current_opening_index = 0


def get_opening_line(difficulty: int):
    """Escolhe uma linha de abertura completa baseada no nível, com pesos."""
    allowed = OPENING_LEVELS.get(difficulty, OPENING_LEVELS[1000])
    if difficulty >= 1400:
        allowed = OPENING_LEVELS[1400]
    elif difficulty >= 1000:
        allowed = OPENING_LEVELS[1000]
    
    available = {k: v for k, v in OPENING_LINES.items() if k in allowed}
    if not available:
        return None
    
    names = list(available.keys())
    weights = [available[n]["weight"] for n in names]
    chosen_key = random.choices(names, weights=weights, k=1)[0]
    return available[chosen_key]


def get_opening_moves(fen: str, difficulty: int):
    """Segue uma linha de abertura completa."""
    global current_opening_line, current_opening_index
    
    fen_short = " ".join(fen.split(" ")[:3])
    start_short = " ".join(START_POSITION.split(" ")[:3])
    
    if fen_short == start_short:
        line = get_opening_line(difficulty)
        if line:
            current_opening_line = line
            current_opening_index = 0
            return line["moves"][0]
        return None
    
    if current_opening_line and current_opening_index < len(current_opening_line["moves"]) - 1:
        current_opening_index += 1
        return current_opening_line["moves"][current_opening_index]
    
    current_opening_line = None
    current_opening_index = 0
    return None


# ============================================================
# NÍVEIS DE DIFICULDADE
# ============================================================

DIFFICULTY_LEVELS = {
    200:  {"skill": 0,  "depth": 2,  "cp_margin": 200, "error_rate": 0.50, "name": "Primeiros passos",  "desc": "Joga lances quase aleatórios. Ideal para aprender."},
    400:  {"skill": 0,  "depth": 3,  "cp_margin": 150, "error_rate": 0.40, "name": "Iniciante",          "desc": "Lances básicos, sem cálculo profundo."},
    600:  {"skill": 0,  "depth": 4,  "cp_margin": 100, "error_rate": 0.30, "name": "Aprendiz",           "desc": "Captura peças desprotegidas com frequência."},
    800:  {"skill": 2,  "depth": 5,  "cp_margin": 70,  "error_rate": 0.20, "name": "Praticante",         "desc": "Controla o centro e desenvolve peças."},
    1000: {"skill": 4,  "depth": 7,  "cp_margin": 50,  "error_rate": 0.12, "name": "Intermediário",      "desc": "Calcula táticas simples e pune erros."},
    1200: {"skill": 6,  "depth": 9,  "cp_margin": 35,  "error_rate": 0.08, "name": "Competidor",         "desc": "Boa visão tática. Aproveita garfos."},
    1400: {"skill": 8,  "depth": 11, "cp_margin": 25,  "error_rate": 0.05, "name": "Avançado",           "desc": "Sólido estrategicamente."},
    1600: {"skill": 10, "depth": 13, "cp_margin": 18,  "error_rate": 0.03, "name": "Especialista",       "desc": "Calcula variantes longas."},
    1800: {"skill": 12, "depth": 15, "cp_margin": 12,  "error_rate": 0.02, "name": "Mestre",             "desc": "Explora fraquezas mínimas."},
    2000: {"skill": 15, "depth": 17, "cp_margin": 8,   "error_rate": 0.01, "name": "Mestre Elite",       "desc": "Força de clube. Quase sem erros."},
    2200: {"skill": 18, "depth": 19, "cp_margin": 5,   "error_rate": 0.005,"name": "Desafiante",         "desc": "Nível de campeonato."},
    2400: {"skill": 20, "depth": 21, "cp_margin": 3,   "error_rate": 0.002,"name": "Grão-Mestre",        "desc": "Força de torneio internacional."},
    2600: {"skill": 20, "depth": 23, "cp_margin": 0,   "error_rate": 0.0,  "name": "Lenda",              "desc": "Nível de elite mundial."},
    3000: {"skill": 20, "depth": 26, "cp_margin": 0,   "error_rate": 0.0,  "name": "Stockfish Máximo",   "desc": "Força total. O desafio definitivo."},
}

DEFAULT_DIFFICULTY = 1000


# ============================================================
# MODELOS
# ============================================================

class PositionRequest(BaseModel):
    fen: str = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    history: Optional[List[str]] = None


class PlayRequest(BaseModel):
    fen: str = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    difficulty: int = DEFAULT_DIFFICULTY


class AnalysisResponse(BaseModel):
    fen: str
    best_move: str
    evaluation: dict
    top_moves: list
    lines: list = []
    warnings: list = []


class PlayResponse(BaseModel):
    fen: str
    move: str
    from_square: str
    to_square: str
    promotion: Optional[str] = None


class CoachRequest(BaseModel):
    fen: str
    move: str
    evaluation: Optional[dict] = None


class CoachResponse(BaseModel):
    explanation: str
    loading: bool = False


class ReviewRequest(BaseModel):
    history: list
    player_color: str = 'w'


class ReviewResponse(BaseModel):
    result: str
    result_reason: str = ""
    opening: dict
    stats: dict
    mistakes: list
    summary: str
    loading: bool = False


# ============================================================
# FUNÇÕES DO STOCKFISH
# ============================================================

def get_engine(depth=18, multi_pv=3, skill=None):
    """Cria e configura uma instância do Stockfish."""
    params = {
        "Threads": 2,
        "Hash": 256,
    }
    if multi_pv > 1:
        params["MultiPV"] = multi_pv
    if skill is not None and skill > 0:
        params["Skill Level"] = skill
    
    engine = Stockfish(path=STOCKFISH_PATH, depth=depth, parameters=params)
    engine.set_turn_perspective(False)
    return engine


def play_bot_move(fen: str, difficulty: int = DEFAULT_DIFFICULTY):
    """Estratégia de dificuldade com aberturas, cp_margin, error_rate e pesos."""
    config = DIFFICULTY_LEVELS.get(difficulty, DIFFICULTY_LEVELS[DEFAULT_DIFFICULTY])
    engine = None
    
    try:
        skill = config["skill"]
        depth = config["depth"]
        cp_margin = config.get("cp_margin", 0)
        error_rate = config.get("error_rate", 0)
        
        # Abertura
        opening_move = get_opening_moves(fen, difficulty)
        if opening_move and random.random() > error_rate:
            return {
                "move": opening_move,
                "from_square": opening_move[:2],
                "to_square": opening_move[2:4],
                "promotion": opening_move[4] if len(opening_move) > 4 else None,
            }
        
        # MultiPV baseado na margem
        if cp_margin >= 100:
            multi_pv = 15
        elif cp_margin >= 50:
            multi_pv = 10
        elif cp_margin >= 20:
            multi_pv = 8
        else:
            multi_pv = 5
        
        engine = get_engine(depth=depth, multi_pv=multi_pv, skill=skill if skill > 0 else None)
        
        if not engine.is_fen_valid(fen):
            return None
        
        engine.set_fen_position(fen)
        top_moves = engine.get_top_moves(multi_pv)
        
        if not top_moves:
            return None
        
        valid_moves = []
        for m in top_moves:
            move = m.get("Move")
            if not move or len(move) < 4:
                continue
            if m.get("Mate") is not None:
                cp = 10000 if m["Mate"] > 0 else -10000
            else:
                cp = m.get("Centipawn") or 0
            valid_moves.append({"move": move, "cp": cp})
        
        if not valid_moves:
            return None
        
        best_cp = valid_moves[0]["cp"]
        acceptable = [m for m in valid_moves if abs(m["cp"] - best_cp) <= cp_margin]
        
        if not acceptable:
            acceptable = [valid_moves[0]]
        
        # Taxa de erro com gravidade variável
        if random.random() < error_rate and len(valid_moves) > 1:
            roll = random.random()
            
            if error_rate >= 0.30:
                if roll < 0.50:
                    pool = valid_moves[1:min(4, len(valid_moves))]
                elif roll < 0.80:
                    pool = valid_moves[3:min(7, len(valid_moves))]
                else:
                    pool = valid_moves[6:min(12, len(valid_moves))]
            elif error_rate >= 0.12:
                if roll < 0.60:
                    pool = valid_moves[1:min(3, len(valid_moves))]
                elif roll < 0.90:
                    pool = valid_moves[2:min(5, len(valid_moves))]
                else:
                    pool = valid_moves[4:min(8, len(valid_moves))]
            else:
                if roll < 0.70:
                    pool = valid_moves[1:min(3, len(valid_moves))]
                else:
                    pool = valid_moves[2:min(4, len(valid_moves))]
            
            if pool and len(pool) > 0:
                chosen = random.choice(pool)
            else:
                chosen = random.choice(acceptable)
        else:
            if len(acceptable) == 1:
                chosen = acceptable[0]
            else:
                weights = [len(acceptable) - i for i in range(len(acceptable))]
                chosen = random.choices(acceptable, weights=weights, k=1)[0]
        
        best_move = chosen["move"]
        
        return {
            "move": best_move,
            "from_square": best_move[:2],
            "to_square": best_move[2:4],
            "promotion": best_move[4] if len(best_move) > 4 else None,
        }
    
    except Exception as e:
        print(f"Erro ao jogar como bot: {e}")
        return None
    finally:
        if engine:
            try:
                engine.send_quit_command()
            except:
                pass


# ============================================================
# COACH (GEMINI)
# ============================================================

def get_coach_explanation(fen: str, move: str, evaluation: dict = None):
    try:
        board = chess.Board(fen) if chess.Board(fen).is_valid() else None
        move_san = move
        if board:
            try:
                chess_move = chess.Move.from_uci(move)
                if chess_move in board.legal_moves:
                    move_san = board.san(chess_move)
            except:
                pass
        
        eval_text = ""
        if evaluation:
            if evaluation.get("type") == "mate":
                eval_text = f"Mate em {evaluation['value']} lances"
            else:
                cp = evaluation.get("value", 0)
                if cp > 0:
                    eval_text = f"Vantagem das brancas: +{cp/100:.2f}"
                elif cp < 0:
                    eval_text = f"Vantagem das pretas: {cp/100:.2f}"
                else:
                    eval_text = "Posição equilibrada"
        
        prompt = f"""Você é um treinador de xadrez paciente e didático. Explique o lance {move_san} (UCI: {move}) para um aluno.

Posição: {fen}
Avaliação do motor: {eval_text}

Formato da resposta:
Objetivo: [1 frase dizendo o que este lance conquista]
Desenvolvimento: [1 frase sobre peças desenvolvidas ou ameaçadas]
Plano: [1 frase sobre a ideia estratégica]
Atenção: [1 frase sobre riscos ou oportunidades]

Regras:
- Use linguagem simples, como se falasse com um amigo.
- NÃO use linguagem excessivamente técnica.
- Termine com uma dica prática para os próximos lances.
- Texto puro, sem markdown, sem asteriscos."""

        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        print(f"Erro no Gemini: {e}")
        return None


# ============================================================
# REVISÃO DE PARTIDA
# ============================================================

def review_game(history: list, player_color: str = 'w'):
    """Analisa TODOS os lances da partida e classifica cada um."""
    try:
        if not history or len(history) < 2:
            return None
        
        total_moves = len(history)
        player_moves = [m for m in history if m.get('color') == player_color]
        opponent_moves = [m for m in history if m.get('color') != player_color]
        
        captures_by_player = len([m for m in player_moves if m.get('captured')])
        captures_by_opponent = len([m for m in opponent_moves if m.get('captured')])
        
        # Resultado
        last_fen = history[-1].get('after', '') if history[-1].get('after') else ''
        result = "Desconhecido"
        result_reason = ""
        if last_fen:
            try:
                board = chess.Board(last_fen)
                if board.is_checkmate():
                    last_move = history[-1]
                    winner = last_move.get('color', '')
                    result = "Vitória" if winner == player_color else "Derrota"
                    result_reason = "Xeque-mate"
                elif board.is_stalemate():
                    result = "Empate"
                    result_reason = "Afogamento (stalemate)"
                elif board.is_insufficient_material():
                    result = "Empate"
                    result_reason = "Material insuficiente"
                elif board.can_claim_threefold_repetition():
                    result = "Empate"
                    result_reason = "Repetição tripla"
                elif board.can_claim_fifty_moves():
                    result = "Empate"
                    result_reason = "Regra dos 50 lances"
                elif board.is_game_over():
                    result = "Empate"
                    result_reason = "Partida finalizada"
                else:
                    result = "Partida finalizada"
            except:
                pass
        
        # Detecta abertura
        opening_name = ""
        opening_code = ""
        try:
            opening_moves_uci = [m.get('from', '') + m.get('to', '') for m in history[:20] if m.get('from') and m.get('to')]
            if opening_moves_uci:
                best_match_len = 0
                for key, line in OPENING_LINES.items():
                    moves = line["moves"]
                    if len(moves) <= len(opening_moves_uci):
                        match = True
                        for i, m in enumerate(moves):
                            if i >= len(opening_moves_uci) or opening_moves_uci[i] != m:
                                match = False
                                break
                        if match and len(moves) > best_match_len:
                            opening_name = line["name"]
                            opening_code = key.upper()
                            best_match_len = len(moves)
        except:
            pass
        
        # Análise de todos os lances
        all_moves_analysis = []
        engine = None
        
        try:
            engine = get_engine(depth=14, multi_pv=1)
            temp_board = chess.Board()
            
            for i, move in enumerate(history):
                if not move.get('from') or not move.get('to'):
                    continue
                
                uci = move['from'] + move['to']
                promotion = move.get('promotion', '')
                if promotion:
                    uci += promotion
                
                move_color = move.get('color', '')
                is_player_move = move_color == player_color
                
                try:
                    chess_move = chess.Move.from_uci(uci)
                    if chess_move in temp_board.legal_moves:
                        fen_before = temp_board.fen()
                        temp_board.push(chess_move)
                        fen_after = temp_board.fen()
                        
                        if engine.is_fen_valid(fen_after):
                            engine.set_fen_position(fen_after)
                            top = engine.get_top_moves(3)
                            
                            if top:
                                best_move = top[0].get('Move', '')
                                best_cp = top[0].get('Centipawn', 0) or 0
                                
                                cp_after = best_cp
                                for t in top:
                                    if t.get('Move') == uci:
                                        cp_after = t.get('Centipawn', 0) or 0
                                        break
                                
                                engine.set_fen_position(fen_before)
                                top_before = engine.get_top_moves(1)
                                cp_before = top_before[0].get('Centipawn', 0) if top_before else 0
                                
                                if move_color == 'w':
                                    cp_loss = cp_before - cp_after
                                else:
                                    cp_loss = -(cp_before - cp_after)
                                
                                category = classify_move(uci, best_move, cp_loss, is_player_move)
                                
                                all_moves_analysis.append({
                                    'move_number': i + 1,
                                    'move_uci': uci,
                                    'move_san': move.get('san', uci),
                                    'best_move': best_move,
                                    'cp_loss': abs(cp_loss),
                                    'category': category,
                                    'is_player_move': is_player_move,
                                    'color': move_color,
                                })
                except Exception as e:
                    print(f"Erro analisando lance {i}: {e}")
                    try:
                        temp_board.push(chess_move)
                    except:
                        pass
        finally:
            if engine:
                try:
                    engine.send_quit_command()
                except:
                    pass
        
        # Estatísticas do jogador
        player_analysis = [m for m in all_moves_analysis if m.get('is_player_move')]
        mistakes = [m for m in player_analysis if m['category'] in ['mistake', 'blunder', 'inaccuracy']]
        
        brilliant = len([m for m in player_analysis if m['category'] == 'brilliant'])
        best_moves = len([m for m in player_analysis if m['category'] == 'best'])
        excellent = len([m for m in player_analysis if m['category'] == 'excellent'])
        good = len([m for m in player_analysis if m['category'] == 'good'])
        inaccuracies = len([m for m in player_analysis if m['category'] == 'inaccuracy'])
        mistake_count = len([m for m in player_analysis if m['category'] == 'mistake'])
        blunders = len([m for m in player_analysis if m['category'] == 'blunder'])
        
        total_player_moves = len(player_analysis)
        bad_moves = inaccuracies + mistake_count + blunders
        accuracy = round(((total_player_moves - bad_moves) / max(total_player_moves, 1)) * 100, 1)
        
        stats = {
            'total_moves': total_moves,
            'captures_by_player': captures_by_player,
            'captures_by_opponent': captures_by_opponent,
            'accuracy': accuracy,
            'brilliant': brilliant,
            'best_moves': best_moves,
            'excellent': excellent,
            'good': good,
            'inaccuracies': inaccuracies,
            'mistakes': mistake_count,
            'blunders': blunders,
            'grave_mistakes': blunders,
            'moderate_mistakes': mistake_count,
        }
        
        # Resumo
        summary = ""
        try:
            mistakes_text = ""
            for m in mistakes[:5]:
                cat_emoji = {'blunder': '🚨', 'mistake': '❌', 'inaccuracy': '⚠️'}.get(m['category'], '')
                mistakes_text += f"{cat_emoji} Lance {m['move_number']}: {m['move_san']} → {m['best_move']} (-{m['cp_loss']/100:.1f})\n"
            
            prompt = f"""Você é um coach de xadrez. Resumo profissional da partida:

Resultado: {result} ({result_reason})
Precisão: {accuracy}%
Lances: {total_moves}
💎 Brilhantes: {brilliant} | ⭐ Excelentes: {excellent} | ✅ Melhores: {best_moves}
⚠️ Imprecisões: {inaccuracies} | ❌ Erros: {mistake_count} | 🚨 Blunders: {blunders}

{mistakes_text if mistakes_text else 'Nenhum erro grave.'}

Formato da resposta:
Resumo: [1 frase sobre o resultado]
Destaque: [1 ponto positivo]
Melhoria: [1-2 dicas específicas]
Texto puro, sem markdown."""
            
            response = gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
            )
            summary = response.text.strip()
        except:
            if result == "Vitória":
                summary = f"Resumo: Você venceu com {accuracy}% de precisão! Destaque: Boa efetividade nos lances. Melhoria: Continue praticando táticas para reduzir imprecisões."
            elif result == "Derrota":
                summary = f"Resumo: Derrota com {accuracy}% de precisão. Destaque: Você teve {best_moves} melhores lances. Melhoria: Foque em evitar erros graves - você teve {blunders} blunders."
            else:
                summary = f"Resumo: Partida equilibrada com {accuracy}% de precisão. Destaque: {excellent} lances excelentes. Melhoria: Revise os erros para evoluir."
        
        return {
            'result': result,
            'result_reason': result_reason,
            'opening': {'name': opening_name, 'code': opening_code},
            'stats': stats,
            'mistakes': mistakes[:10],
            'summary': summary,
        }
    
    except Exception as e:
        print(f"Erro na revisão: {e}")
        import traceback
        traceback.print_exc()
        return None


def classify_move(uci: str, best_move: str, cp_loss: float, is_player: bool) -> str:
    """Classifica um lance no estilo chess.com."""
    if not is_player:
        return 'opponent'
    
    abs_loss = abs(cp_loss)
    
    if uci == best_move:
        return 'best'
    if abs_loss < 20:
        return 'excellent'
    elif abs_loss < 50:
        return 'good'
    elif abs_loss < 100:
        return 'inaccuracy'
    elif abs_loss < 200:
        return 'mistake'
    else:
        return 'blunder'


def get_position_info(fen: str):
    try:
        board = chess.Board(fen)
        return {
            "is_check": board.is_check(),
            "is_checkmate": board.is_checkmate(),
            "is_stalemate": board.is_stalemate(),
            "is_insufficient_material": board.is_insufficient_material(),
            "is_game_over": board.is_game_over(),
            "fullmove_number": board.fullmove_number,
            "halfmove_clock": board.halfmove_clock,
            "turn": "white" if board.turn == chess.WHITE else "black",
            "can_claim_threefold": board.can_claim_threefold_repetition(),
            "can_claim_fifty_moves": board.can_claim_fifty_moves(),
        }
    except:
        return None


def check_repetition_danger(fen: str, history_fens: list):
    if not history_fens or len(history_fens) < 4:
        return []
    try:
        board = chess.Board(fen)
        current_fen_short = " ".join(fen.split(" ")[:4])
        count = 1
        for hist_fen in history_fens:
            hist_short = " ".join(hist_fen.split(" ")[:4])
            if hist_short == current_fen_short:
                count += 1
        if count >= 2:
            dangerous_moves = []
            for move in board.legal_moves:
                board.push(move)
                future_fen = " ".join(board.fen().split(" ")[:4])
                future_count = 1
                for hist_fen in history_fens:
                    hist_short = " ".join(hist_fen.split(" ")[:4])
                    if hist_short == future_fen:
                        future_count += 1
                if future_count >= 3:
                    dangerous_moves.append(move.uci())
                board.pop()
            return dangerous_moves
        return []
    except:
        return []


def analyze_with_stockfish(fen: str, depth: int = 18, multi_pv: int = 3, history_fens: list = None):
    engine = None
    warnings = []
    try:
        pos_info = get_position_info(fen)
        if pos_info:
            if pos_info["is_checkmate"]:
                return {"best_move": None, "evaluation": {"type": "mate", "value": 0}, "top_moves": [], "lines": [], "warnings": ["Xeque-mate!"]}
            if pos_info["is_stalemate"]:
                return {"best_move": None, "evaluation": {"type": "cp", "value": 0}, "top_moves": [], "lines": [], "warnings": ["Empate por afogamento."]}
            if pos_info["is_insufficient_material"]:
                return {"best_move": None, "evaluation": {"type": "cp", "value": 0}, "top_moves": [], "lines": [], "warnings": ["Material insuficiente."]}
            if pos_info["can_claim_fifty_moves"]:
                warnings.append("Regra dos 50 lances disponível.")
            if pos_info["can_claim_threefold"]:
                warnings.append("Repetição tripla disponível.")
        
        dangerous_moves = []
        if history_fens:
            dangerous_moves = check_repetition_danger(fen, history_fens)
            if dangerous_moves:
                warnings.append("Alguns lances podem levar a empate por repetição.")
        
        engine = get_engine(depth=depth, multi_pv=multi_pv)
        if not engine.is_fen_valid(fen):
            return {"best_move": None, "evaluation": {"type": "cp", "value": 0}, "top_moves": [], "lines": [], "warnings": ["FEN inválido."]}

        engine.set_fen_position(fen)
        top = engine.get_top_moves(multi_pv)

        lines = []
        for entry in top:
            move = entry.get("Move")
            if not move:
                continue
            is_dangerous = move in dangerous_moves
            if entry.get("Mate") is not None:
                evaluation = {"type": "mate", "value": entry["Mate"]}
            else:
                cp_value = entry.get("Centipawn") or 0
                if is_dangerous and cp_value > -50:
                    cp_value = max(cp_value - 80, -50)
                evaluation = {"type": "cp", "value": cp_value}
            lines.append({"move": move, "evaluation": evaluation, "dangerous": is_dangerous})

        if not lines:
            return {"best_move": None, "evaluation": {"type": "cp", "value": 0}, "top_moves": [], "lines": [], "warnings": warnings + ["Nenhum lance legal."]}

        safe_lines = [l for l in lines if not l.get("dangerous")]
        dangerous_lines = [l for l in lines if l.get("dangerous")]
        sorted_lines = safe_lines + dangerous_lines
        
        return {"best_move": sorted_lines[0]["move"], "evaluation": sorted_lines[0]["evaluation"], "top_moves": [line["move"] for line in sorted_lines], "lines": [{"move": l["move"], "evaluation": l["evaluation"]} for l in sorted_lines], "warnings": warnings}
    except Exception as e:
        print(f"Erro: {e}")
        return {"best_move": None, "evaluation": {"type": "cp", "value": 0}, "top_moves": [], "lines": [], "warnings": [str(e)]}
    finally:
        if engine:
            try:
                engine.send_quit_command()
            except:
                pass


# ============================================================
# APP FASTAPI
# ============================================================

app = FastAPI(title="Chess Coach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(__file__)
STOCKFISH_PATH = os.path.join(BASE_DIR, "engine", "stockfish.exe")


@app.get("/")
async def root():
    return {"message": "Chess Coach API", "status": "running", "version": "3.0"}


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_position(request: PositionRequest):
    if not request.fen or "/" not in request.fen:
        return {"fen": request.fen, "best_move": "", "evaluation": {"type": "cp", "value": 0}, "top_moves": [], "lines": [], "warnings": ["FEN inválido."]}
    result = analyze_with_stockfish(request.fen, history_fens=request.history)
    return {"fen": request.fen, "best_move": result["best_move"] or "", "evaluation": result["evaluation"], "top_moves": result["top_moves"], "lines": result["lines"], "warnings": result.get("warnings", [])}


@app.post("/play", response_model=PlayResponse)
async def play(request: PlayRequest):
    result = play_bot_move(request.fen, request.difficulty)
    if result is None:
        return {"fen": request.fen, "move": "", "from_square": "", "to_square": "", "promotion": None}
    return {"fen": request.fen, "move": result["move"], "from_square": result["from_square"], "to_square": result["to_square"], "promotion": result["promotion"]}


@app.post("/coach", response_model=CoachResponse)
async def coach_explain(request: CoachRequest):
    if not request.fen or not request.move:
        return {"explanation": "Posição ou lance inválido.", "loading": False}
    explanation = get_coach_explanation(request.fen, request.move, request.evaluation)
    return {"explanation": explanation or "Não foi possível gerar a explicação.", "loading": False}


@app.post("/review", response_model=ReviewResponse)
async def review_game_endpoint(request: ReviewRequest):
    result = review_game(request.history, request.player_color)
    if result is None:
        return {"result": "Erro", "result_reason": "", "opening": {"name": "", "code": ""}, "stats": {}, "mistakes": [], "summary": "Não foi possível analisar.", "loading": False}
    return {
        "result": result["result"],
        "result_reason": result.get("result_reason", ""),
        "opening": result["opening"],
        "stats": result["stats"],
        "mistakes": result["mistakes"],
        "summary": result["summary"],
        "loading": False,
    }


@app.get("/health")
async def health_check():
    return {"status": "ok", "stockfish_exists": os.path.exists(STOCKFISH_PATH)}