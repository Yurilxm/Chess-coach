from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from stockfish import Stockfish, StockfishException
from typing import Optional, List
import os
import chess
from google import genai

# Configurar Gemini
GEMINI_API_KEY = "SUA_CHAVE_DE_API_DO_GEMINI_AQUI"  # Substitua pela sua chave de API do Gemini
gemini_client = genai.Client(api_key=GEMINI_API_KEY)


def get_coach_explanation(fen: str, move: str, evaluation: dict = None):
    """Usa Gemini para explicar um lance de xadrez."""
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
        
        prompt = f"""Você é um coach de xadrez experiente. Explique o lance {move_san} (UCI: {move}) na posição atual.

Posição FEN: {fen}
Avaliação do motor: {eval_text}

Explique em português, de forma clara e educativa:
1. Qual o objetivo estratégico deste lance
2. Que peças são desenvolvidas ou ameaçadas
3. Qual o plano por trás deste lance
4. Pontos de atenção (riscos ou oportunidades)

Seja conciso (3-5 frases). Use termos de xadrez mas explique-os brevemente.
Não use markdown, apenas texto puro."""

        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        
        return response.text.strip()
    
    except Exception as e:
        print(f"Erro no Gemini: {e}")
        return None


def review_game(history: list, player_color: str = 'w'):
    """Analisa uma partida completa e gera resumo."""
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
        if last_fen:
            try:
                board = chess.Board(last_fen)
                if board.is_checkmate():
                    last_move = history[-1]
                    winner = last_move.get('color', '')
                    result = "Vitória" if winner == player_color else "Derrota"
                elif board.is_stalemate():
                    result = "Empate por afogamento"
                elif board.is_insufficient_material():
                    result = "Empate por material insuficiente"
                elif board.can_claim_threefold_repetition():
                    result = "Empate por repetição"
                elif board.can_claim_fifty_moves():
                    result = "Empate por 50 lances"
                else:
                    result = "Partida finalizada"
            except:
                pass
        
        # Abertura (pega os primeiros 20 meios-lances)
        opening_name = "Não identificada"
        opening_code = ""
        opening_moves = history[:20]
        
        # Análise de erros com Stockfish
        mistakes = []
        engine = None
        try:
            engine = get_engine(depth=12, multi_pv=1)
            temp_board = chess.Board()
            
            for i, move in enumerate(player_moves):
                if move.get('from') and move.get('to'):
                    uci = move['from'] + move['to']
                    promotion = move.get('promotion', '')
                    if promotion:
                        uci += promotion
                    try:
                        chess_move = chess.Move.from_uci(uci)
                        if chess_move in temp_board.legal_moves:
                            temp_board.push(chess_move)
                            fen = temp_board.fen()
                            
                            if engine.is_fen_valid(fen):
                                engine.set_fen_position(fen)
                                top = engine.get_top_moves(3)
                                
                                best_move = top[0].get('Move', '') if top else ''
                                best_cp = top[0].get('Centipawn', 0) if top else 0
                                
                                if best_move and uci.rstrip('qrnb') != best_move:
                                    cp_diff = 200
                                    for t in top:
                                        if t.get('Move') == uci:
                                            cp_diff = best_cp - (t.get('Centipawn') or 0)
                                            break
                                    
                                    if abs(cp_diff) > 80:
                                        severity = 'grave' if abs(cp_diff) > 200 else 'moderado'
                                        mistakes.append({
                                            'move_number': i + 1,
                                            'move_uci': uci,
                                            'move_san': move.get('san', uci),
                                            'best_move': best_move,
                                            'cp_loss': abs(cp_diff),
                                            'severity': severity,
                                        })
                    except:
                        break
        finally:
            if engine:
                try:
                    engine.send_quit_command()
                except:
                    pass
        
        stats = {
            'total_moves': total_moves,
            'captures_by_player': captures_by_player,
            'captures_by_opponent': captures_by_opponent,
            'mistakes': len(mistakes),
            'grave_mistakes': len([m for m in mistakes if m['severity'] == 'grave']),
            'moderate_mistakes': len([m for m in mistakes if m['severity'] == 'moderado']),
        }
        
        # Resumo com Gemini
        summary = ""
        try:
            mistakes_text = ""
            for m in mistakes[:5]:
                mistakes_text += f"Lance {m['move_number']}: {m['move_san']} (melhor: {m['best_move']}, -{m['cp_loss']/100:.1f})\n"
            
            prompt = f"""Você é um coach de xadrez. Resumo profissional da partida:

Resultado: {result}
Lances totais: {total_moves}
Suas capturas: {captures_by_player}
Capturas do oponente: {captures_by_opponent}
Erros graves: {stats['grave_mistakes']}
Erros moderados: {stats['moderate_mistakes']}

{mistakes_text if mistakes_text else 'Nenhum erro grave.'}

Escreva 4-6 frases em português analisando o desempenho e dando 2-3 dicas específicas. Seja encorajador mas honesto. Texto puro, sem markdown."""
            
            response = gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
            )
            summary = response.text.strip()
        except:
            summary = "Análise indisponível no momento. Revise os erros manualmente."
        
        return {
            'result': result,
            'opening': {'name': opening_name, 'code': opening_code},
            'stats': stats,
            'mistakes': mistakes[:10],
            'summary': summary,
        }
    
    except Exception as e:
        print(f"Erro na revisão: {e}")
        return None


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

ANALYSIS_DEPTH = 18
MULTI_PV = 3

DIFFICULTY_LEVELS = {
    200:  {"skill": 0,  "depth": 1,  "name": "Primeiros passos",  "desc": "O computador joga lances aleatórios. Ideal para aprender os movimentos."},
    400:  {"skill": 0,  "depth": 2,  "name": "Iniciante",          "desc": "Lances básicos, sem cálculo profundo. Perfeito para praticar."},
    600:  {"skill": 1,  "depth": 2,  "name": "Aprendiz",           "desc": "Começa a capturar peças desprotegidas. Cuidado com os descuidos."},
    800:  {"skill": 2,  "depth": 3,  "name": "Praticante",         "desc": "Já controla o centro e desenvolve as peças corretamente."},
    1000: {"skill": 4,  "depth": 4,  "name": "Intermediário",      "desc": "Calcula algumas táticas simples e pune erros graves."},
    1200: {"skill": 6,  "depth": 5,  "name": "Competidor",         "desc": "Boa visão tática. Aproveita cravações e garfos."},
    1400: {"skill": 8,  "depth": 6,  "name": "Avançado",           "desc": "Sólido estrategicamente. Difícil de surpreender."},
    1600: {"skill": 10, "depth": 8,  "name": "Especialista",       "desc": "Calcula variantes longas e tem bom jogo posicional."},
    1800: {"skill": 12, "depth": 10, "name": "Mestre",             "desc": "Jogo de alto nível. Explora fraquezas mínimas."},
    2000: {"skill": 15, "depth": 12, "name": "Mestre Elite",       "desc": "Força de clube. Praticamente não comete erros."},
    2200: {"skill": 18, "depth": 15, "name": "Desafiante",         "desc": "Nível de campeonato. Cada lance é calculado."},
    2400: {"skill": 20, "depth": 18, "name": "Grão-Mestre",        "desc": "Força de torneio internacional."},
    2600: {"skill": 20, "depth": 20, "name": "Lenda",              "desc": "Nível de elite mundial. Quase imbatível."},
    3000: {"skill": 20, "depth": 24, "name": "Stockfish Máximo",   "desc": "Força total do motor. O desafio definitivo."},
}

DEFAULT_DIFFICULTY = 1000


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
    opening: dict
    stats: dict
    mistakes: list
    summary: str
    loading: bool = False


@app.post("/coach", response_model=CoachResponse)
async def coach_explain(request: CoachRequest):
    if not request.fen or not request.move:
        return {"explanation": "Posição ou lance inválido.", "loading": False}
    
    explanation = get_coach_explanation(request.fen, request.move, request.evaluation)
    
    if explanation:
        return {"explanation": explanation, "loading": False}
    else:
        return {"explanation": "Não foi possível gerar a explicação neste momento.", "loading": False}


@app.post("/review", response_model=ReviewResponse)
async def review_game_endpoint(request: ReviewRequest):
    result = review_game(request.history, request.player_color)
    
    if result is None:
        return {
            "result": "Erro",
            "opening": {"name": "", "code": ""},
            "stats": {},
            "mistakes": [],
            "summary": "Não foi possível analisar a partida.",
            "loading": False,
        }
    
    return {
        "result": result["result"],
        "opening": result["opening"],
        "stats": result["stats"],
        "mistakes": result["mistakes"],
        "summary": result["summary"],
        "loading": False,
    }


def get_engine(depth=ANALYSIS_DEPTH, multi_pv=MULTI_PV, skill=None):
    params = {
        "MultiPV": multi_pv,
        "Threads": 2,
        "Hash": 256,
    }
    if skill is not None:
        params["Skill Level"] = skill
    
    engine = Stockfish(path=STOCKFISH_PATH, depth=depth, parameters=params)
    engine.set_turn_perspective(False)
    return engine


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


def analyze_with_stockfish(fen: str, depth: int = ANALYSIS_DEPTH, multi_pv: int = MULTI_PV, history_fens: list = None):
    engine = None
    warnings = []
    try:
        pos_info = get_position_info(fen)
        if pos_info:
            if pos_info["is_checkmate"]:
                return {"best_move": None, "evaluation": {"type": "mate", "value": 0}, "top_moves": [], "lines": [], "warnings": ["Xeque-mate! A partida terminou."]}
            if pos_info["is_stalemate"]:
                return {"best_move": None, "evaluation": {"type": "cp", "value": 0}, "top_moves": [], "lines": [], "warnings": ["Empate por afogamento (stalemate)."]}
            if pos_info["is_insufficient_material"]:
                return {"best_move": None, "evaluation": {"type": "cp", "value": 0}, "top_moves": [], "lines": [], "warnings": ["Empate por material insuficiente."]}
            if pos_info["can_claim_fifty_moves"]:
                warnings.append("Regra dos 50 lances: empate disponível.")
            if pos_info["can_claim_threefold"]:
                warnings.append("Repetição tripla: empate disponível.")
        
        dangerous_moves = []
        if history_fens:
            dangerous_moves = check_repetition_danger(fen, history_fens)
            if dangerous_moves:
                warnings.append("Atenção: alguns lances podem levar a empate por repetição.")
        
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
            return {"best_move": None, "evaluation": {"type": "cp", "value": 0}, "top_moves": [], "lines": [], "warnings": warnings + ["Nenhum lance legal disponível."]}

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


def play_bot_move(fen: str, difficulty: int = DEFAULT_DIFFICULTY):
    config = DIFFICULTY_LEVELS.get(difficulty, DIFFICULTY_LEVELS[DEFAULT_DIFFICULTY])
    engine = None
    try:
        engine = get_engine(depth=config["depth"], multi_pv=1, skill=config["skill"])
        if not engine.is_fen_valid(fen):
            return None
        engine.set_fen_position(fen)
        best_move = engine.get_best_move()
        if not best_move or len(best_move) < 4:
            return None
        return {"move": best_move, "from_square": best_move[:2], "to_square": best_move[2:4], "promotion": best_move[4] if len(best_move) > 4 else None}
    except Exception as e:
        print(f"Erro ao jogar como bot: {e}")
        return None
    finally:
        if engine:
            try:
                engine.send_quit_command()
            except:
                pass


@app.get("/")
async def root():
    return {"message": "Chess Coach API", "status": "running", "version": "2.0"}


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


@app.get("/health")
async def health_check():
    return {"status": "ok", "stockfish_exists": os.path.exists(STOCKFISH_PATH)}