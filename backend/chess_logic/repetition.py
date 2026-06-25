import chess


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