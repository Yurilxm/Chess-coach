import chess

PIECE_VALUES = {
    chess.PAWN: 1,
    chess.KNIGHT: 3,
    chess.BISHOP: 3,
    chess.ROOK: 5,
    chess.QUEEN: 9,
    chess.KING: 100,
}


def is_hanging(board, square, min_value=3):
    """Retorna True se a peca em `square` esta "en prise".

    Critério: peca de valor >= min_value (default 3 = bispo/cavalo+),
    atacada pelo adversario, e o atacante mais barato vale menos que
    a peca (troca favoravel pro atacante).
    """
    piece = board.piece_at(square)
    if not piece:
        return False
    # Rei nunca conta como pendurado: e xeque, nao captura.
    if piece.piece_type == chess.KING:
        return False
    val = PIECE_VALUES.get(piece.piece_type, 0)
    if val < min_value:
        return False

    attackers = board.attackers(not piece.color, square)
    if not attackers:
        return False

    cheapest_attacker = min(
        PIECE_VALUES.get(board.piece_at(a).piece_type, 0) for a in attackers
    )
    return cheapest_attacker < val


def count_hanging_pieces(board, color, min_value=3):
    """Conta pecas de `color` com valor >= min_value que estao penduradas."""
    count = 0
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if not piece or piece.color != color:
            continue
        if is_hanging(board, square, min_value):
            count += 1
    return count


def classify_move(uci, best_move, cp_loss, is_player, is_sacrifice=False):
    """Classifica um lance em uma categoria.

    is_sacrifice: True quando o lance deixa uma peca propria pendurada
    que nao estava pendurada antes. Se combinado com cp_loss pequeno
    (posicao nao piorou), retorna 'brilliant'.
    """
    if not is_player:
        return 'opponent'

    abs_loss = abs(cp_loss)

    # Brilhante: sacrificio que mantem a avaliacao da posicao.
    if is_sacrifice and abs_loss < 30:
        return 'brilliant'

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
