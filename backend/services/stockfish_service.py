from stockfish import Stockfish, StockfishException
from config.settings import STOCKFISH_PATH, ANALYSIS_DEPTH, MULTI_PV
from chess_logic.game_rules import get_position_info
from chess_logic.repetition import check_repetition_danger
import atexit

# Engine persistente reutilizada em todas as chamadas
_engine = None

def _get_or_create_engine(depth=ANALYSIS_DEPTH, multi_pv=MULTI_PV, skill=None):
    """Retorna uma engine persistente, reconfigurando parâmetros conforme necessário."""
    global _engine
    
    params = {"Threads": 4, "Hash": 512}
    if multi_pv > 1:
        params["MultiPV"] = multi_pv
    if skill is not None and skill > 0:
        params["Skill Level"] = skill
    
    if _engine is None:
        _engine = Stockfish(path=STOCKFISH_PATH, depth=depth, parameters=params)
        _engine.set_turn_perspective(False)
    else:
        # Atualiza parâmetros sem recriar a engine
        try:
            _engine.set_depth(depth)
            if multi_pv > 1:
                _engine.update_engine_parameters({"MultiPV": multi_pv})
            if skill is not None and skill > 0:
                _engine.update_engine_parameters({"Skill Level": skill})
        except:
            pass
    
    return _engine


def _cleanup_engine():
    """Fecha a engine ao encerrar o processo."""
    global _engine
    if _engine:
        try:
            _engine.send_quit_command()
        except:
            pass
        _engine = None


atexit.register(_cleanup_engine)


def analyze_position(fen: str, depth: int = ANALYSIS_DEPTH, multi_pv: int = MULTI_PV, history_fens: list = None):
    """Análise de posição usando engine persistente."""
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
        
        engine = _get_or_create_engine(depth=depth, multi_pv=multi_pv)
        
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