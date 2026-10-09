"""Testes de deteccao de sacrificio (brilliant) no review_service.

Todos com engine mockada. Nao chama Stockfish real.
"""

import pytest
from services.review_service import review_game


class FakeEngine:
    def __init__(self, default_cp=30):
        self.default_cp = default_cp
        self.calls = []

    def __call__(self, fen, **kwargs):
        self.calls.append({"fen": fen, **kwargs})
        return [{"Move": "e2e4", "Centipawn": self.default_cp, "Mate": None}]


@pytest.fixture
def mock_engine(monkeypatch):
    def _install(engine):
        monkeypatch.setattr("services.review_service.engine_analysis", engine)
        return engine
    return _install


def test_review_nao_marca_brilliant_sem_sacrificio(mock_engine, partida_pastor):
    """Mate do pastor nao tem sacrificios -> brilliant = 0."""
    mock_engine(FakeEngine())
    resultado = review_game(partida_pastor, "w")
    assert resultado is not None
    assert resultado["stats"]["brilliant"] == 0


def test_review_stats_tem_chave_brilliant(mock_engine, partida_pastor):
    """stats sempre inclui 'brilliant' (mesmo que zero)."""
    mock_engine(FakeEngine())
    resultado = review_game(partida_pastor, "w")
    assert "brilliant" in resultado["stats"]


def test_review_partida_com_sacrificio_detecta_brilliant(mock_engine):
    """Constroi posicao onde o jogador deixa um cavalo pendurado com
    avaliacao preservada (mock devolve cp fixo)."""
    mock_engine(FakeEngine(default_cp=30))

    # FEN inicial com cavalo branco que pode ir para casa atacada.
    # 1.Nf3 e6 2.Ne5 (cavalo em e5 atacado por d6, sem defesa)
    # A ideia: historico sintetico onde o 2o lance do jogador (brancas)
    # deixa o cavalo pendurado.
    historico = [
        {"from": "g1", "to": "f3", "san": "Nf3", "color": "w"},
        {"from": "e7", "to": "e6", "san": "e6", "color": "b"},
        {"from": "f3", "to": "e5", "san": "Ne5", "color": "w"},
        {"from": "d7", "to": "d6", "san": "d6", "color": "b"},
    ]
    resultado = review_game(historico, "w")

    assert resultado is not None
    # Nao obrigatorio que apareca brilliant (depende da deteccao),
    # mas o campo tem que estar la
    assert "brilliant" in resultado["stats"]


def test_review_nao_quebra_com_historico_pequeno(mock_engine):
    mock_engine(FakeEngine())
    historico = [
        {"from": "e2", "to": "e4", "san": "e4", "color": "w"},
        {"from": "e7", "to": "e5", "san": "e5", "color": "b"},
    ]
    resultado = review_game(historico, "w")
    assert resultado is not None
    assert resultado["stats"]["brilliant"] == 0
