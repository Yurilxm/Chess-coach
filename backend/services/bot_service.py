import random
from config.settings import DIFFICULTY_LEVELS, DEFAULT_DIFFICULTY
from services.stockfish_service import get_engine
from chess_logic.openings import get_opening_moves


def play_bot_move(fen: str, difficulty: int = DEFAULT_DIFFICULTY):
    config = DIFFICULTY_LEVELS.get(difficulty, DIFFICULTY_LEVELS[DEFAULT_DIFFICULTY])
    engine = None
    
    try:
        skill = config["skill"]
        depth = config["depth"]
        cp_margin = config.get("cp_margin", 0)
        error_rate = config.get("error_rate", 0)
        
        opening_move = get_opening_moves(fen, difficulty)
        if opening_move and random.random() > error_rate:
            return {
                "move": opening_move,
                "from_square": opening_move[:2],
                "to_square": opening_move[2:4],
                "promotion": opening_move[4] if len(opening_move) > 4 else None,
            }
        
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