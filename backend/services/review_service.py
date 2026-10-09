import chess
from services.stockfish_service import engine_analysis
from chess_logic.classifications import classify_move, count_hanging_pieces


def review_game(history: list, player_color: str = 'w'):
    """Analisa partida completa com engine persistente e depth reduzido."""
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
        
        
        all_moves_analysis = []
        temp_board = chess.Board()
        
        prev_best_cp = None  # cp do melhor lance na posicao apos o lance anterior

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
            except (ValueError, TypeError) as e:
                print(f"Lance com UCI invalido '{uci}': {e}")
                prev_best_cp = None
                continue

            if chess_move not in temp_board.legal_moves:
                print(f"Lance '{uci}' nao e legal na posicao atual, ignorado")
                prev_best_cp = None
                continue

            # Detecta sacrificio: quantas pecas proprias (valor >= 3)
            # ficaram penduradas APOS o lance, vs antes.
            mover_chess_color = chess.WHITE if move_color == 'w' else chess.BLACK
            hanging_before = count_hanging_pieces(temp_board, mover_chess_color)

            fen_before = temp_board.fen()
            temp_board.push(chess_move)
            fen_after = temp_board.fen()

            hanging_after = count_hanging_pieces(temp_board, mover_chess_color)
            is_sacrifice = hanging_after > hanging_before

            try:
                top = engine_analysis(fen_after, depth=6, multi_pv=3)
                if not top:
                    prev_best_cp = None
                    continue

                best_move = top[0].get('Move', '')
                best_cp = top[0].get('Centipawn') or 0

                cp_after = best_cp
                for t in top:
                    if t.get('Move') == uci:
                        cp_after = t.get('Centipawn') or 0
                        break

                # Reaproveita o best_cp da iteracao anterior. Como
                # fen_before(i) == fen_after(i-1), a avaliacao best da
                # iteracao anterior ja e o cp_before desta. So a primeira
                # iteracao precisa de uma chamada extra a engine.
                if prev_best_cp is not None:
                    cp_before = prev_best_cp
                else:
                    top_before = engine_analysis(fen_before, depth=6, multi_pv=1)
                    cp_before = (top_before[0].get('Centipawn') or 0) if top_before else 0

                if move_color == 'w':
                    cp_loss = cp_before - cp_after
                else:
                    cp_loss = -(cp_before - cp_after)

                category = classify_move(uci, best_move, cp_loss, is_player_move, is_sacrifice)

                all_moves_analysis.append({
                    'move_number': i + 1, 'move_uci': uci,
                    'move_san': move.get('san', uci), 'best_move': best_move,
                    'cp_loss': abs(cp_loss), 'category': category,
                    'is_player_move': is_player_move, 'color': move_color,
                })

                prev_best_cp = best_cp
            except Exception as e:
                print(f"Erro ao analisar lance {i} ({uci}): {e}")
                prev_best_cp = None

        # Estatísticas
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
            'total_moves': total_moves, 'captures_by_player': captures_by_player,
            'captures_by_opponent': captures_by_opponent, 'accuracy': accuracy,
            'brilliant': brilliant, 'best_moves': best_moves, 'excellent': excellent,
            'good': good, 'inaccuracies': inaccuracies, 'mistakes': mistake_count,
            'blunders': blunders, 'grave_mistakes': blunders, 'moderate_mistakes': mistake_count,
        }
        
        if result == "Vitória":
            summary = f"Resumo: Você venceu com {accuracy}% de precisão! Destaque: Boa efetividade nos lances. Melhoria: Continue praticando táticas para reduzir imprecisões."
        elif result == "Derrota":
            summary = f"Resumo: Derrota com {accuracy}% de precisão. Destaque: Você teve {best_moves} melhores lances. Melhoria: Foque em evitar erros graves - você teve {blunders} blunders."
        else:
            summary = f"Resumo: Partida equilibrada com {accuracy}% de precisão. Destaque: {excellent} lances excelentes. Melhoria: Revise os erros para evoluir."
        
        return {
            'result': result, 'result_reason': result_reason,
            'stats': stats, 'mistakes': mistakes, 'summary': summary,
            'all_moves': all_moves_analysis,  # NOVO: todos os lances para replay
        }
    
    except Exception as e:
        print(f"Erro na revisão: {e}")
        import traceback
        traceback.print_exc()
        return None