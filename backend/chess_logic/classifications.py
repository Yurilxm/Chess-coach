def classify_move(uci: str, best_move: str, cp_loss: float, is_player: bool) -> str:
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