
"""
Teste de integracao REAL com o binario do Stockfish.

Este teste so roda se o binario existir no caminho configurado.
Caso contrario, e pulado automaticamente (skip).

Nao usa mock nenhum. Chama o Stockfish de verdade.
"""

import os
import pytest

from config.settings import STOCKFISH_PATH
from services.stockfish_service import analyze_position


pytestmark = pytest.mark.skipif(
    not os.path.exists(STOCKFISH_PATH),
    reason=f"Stockfish nao encontrado em {STOCKFISH_PATH}",
)


def test_analise_real_posicao_inicial(fen_start):
    """Analise real da posicao inicial. Deve retornar um lance plausivel."""
    resultado = analyze_position(fen_start, depth=8, multi_pv=2)

    assert resultado["best_move"] is not None
    assert len(resultado["best_move"]) >= 4
    assert resultado["evaluation"]["type"] in ("cp", "mate")
    assert len(resultado["lines"]) >= 1


def test_analise_real_xeque_mate(fen_checkmate):
    """Mate: funcao retorna antecipadamente, sem chamar engine."""
    resultado = analyze_position(fen_checkmate)
    assert resultado["best_move"] is None
    assert "Xeque-mate!" in resultado["warnings"]
