
"""
Testes para services/review_service.py — funcao review_game.

Usa mock completo da engine. NAO chama Stockfish real.

O review_game e bem intensivo (chama engine a cada lance). Por isso
os testes usam partidas curtas e uma engine fake que devolve respostas
previsiveis.
"""

import pytest
from services.review_service import review_game


class FakeStockfishEngine:
    def __init__(self, default_move="e2e4", default_cp=30, valid_fens=None):
        self.default_move = default_move
        self.default_cp = default_cp
        self.valid_fens = valid_fens
        self.current_fen = None

    def set_turn_perspective(self, val):
        pass

    def is_fen_valid(self, fen):
        if self.valid_fens is None:
            return True
        return fen in self.valid_fens

    def set_fen_position(self, fen):
        self.current_fen = fen

    def get_top_moves(self, n):
        return [{"Move": self.default_move, "Centipawn": self.default_cp, "Mate": None}]

    def set_depth(self, d):
        pass

    def update_engine_parameters(self, params):
        pass

    def send_quit_command(self):
        pass


@pytest.fixture
def mock_engine(monkeypatch):
    def _install(engine):
        monkeypatch.setattr(
            "services.stockfish_service._get_or_create_engine",
            lambda **kwargs: engine,
        )
        return engine
    return _install


# ------------------------------------------------------------
# Casos de borda
# ------------------------------------------------------------

def test_historico_vazio_retorna_none(mock_engine):
    mock_engine(FakeStockfishEngine())
    assert review_game([], "w") is None


def test_historico_curto_retorna_none(mock_engine):
    """Menos de 2 lances: retorna None."""
    mock_engine(FakeStockfishEngine())
    historico = [{"from": "e2", "to": "e4", "color": "w", "after": ""}]
    assert review_game(historico, "w") is None


# ------------------------------------------------------------
# Revisao basica
# ------------------------------------------------------------

def test_revisao_partida_curta(mock_engine, partida_pastor):
    """Revisao do mate do pastor com engine fake."""
    mock_engine(FakeStockfishEngine())

    resultado = review_game(partida_pastor, "w")

    assert resultado is not None

    # Chaves obrigatorias
    chaves_obrigatorias = {"result", "result_reason", "stats", "mistakes", "summary", "all_moves"}
    assert chaves_obrigatorias.issubset(resultado.keys())

    # Resultado esperado: vitoria das brancas (mate do pastor)
    assert resultado["result"] == "Vitória"
    assert resultado["result_reason"] == "Xeque-mate"

    # Stats
    stats = resultado["stats"]
    assert "accuracy" in stats
    assert stats["total_moves"] == len(partida_pastor)
    assert "brilliant" in stats
    assert "best_moves" in stats
    assert "blunders" in stats


def test_revisao_jogador_pretas(mock_engine, partida_pastor):
    """Se o jogador for pretas no mate do pastor, resultado e 'Derrota'."""
    mock_engine(FakeStockfishEngine())
    resultado = review_game(partida_pastor, "b")
    assert resultado is not None
    assert resultado["result"] == "Derrota"
    assert resultado["result_reason"] == "Xeque-mate"


def test_revisao_all_moves_contem_cada_lance(mock_engine, partida_pastor):
    """all_moves deve ter uma entrada por lance do historico."""
    mock_engine(FakeStockfishEngine())
    resultado = review_game(partida_pastor, "w")
    assert len(resultado["all_moves"]) == len(partida_pastor)


def test_revisao_stats_soma_categorias(mock_engine, partida_pastor):
    """A soma das categorias deve bater com o total de lances do jogador."""
    mock_engine(FakeStockfishEngine())
    resultado = review_game(partida_pastor, "w")
    stats = resultado["stats"]

    # Jogador brancas jogou 4 lances no mate do pastor
    # (e4, Bc4, Qh5, Qxf7#)
    soma = (
        stats["brilliant"] + stats["best_moves"] + stats["excellent"]
        + stats["good"] + stats["inaccuracies"] + stats["mistakes"]
        + stats["blunders"]
    )
    assert soma == 4
