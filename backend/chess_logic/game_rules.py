import chess


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