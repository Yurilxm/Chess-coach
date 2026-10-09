"""
Testes de borda do review_service.

Cobrem:
- Engine devolvendo Mate (Centipawn=None) — bug do None - int
- Regressao: engine_analysis deve ser chamada com depth=6
- Lance ilegal no historico — deve ser ignorado
- UCI malformado — deve ser ignorado

Todos usam engine mockada. NAO chama Stockfish real.
"""

import pytest
from services.review_service import review_game


class FakeEngine:
    """Engine fake. Registra chamadas e devolve respostas por FEN."""

    def __init__(self, top_moves_by_fen=None, default_top=None):
        self.top_moves_by_fen = top_moves_by_fen or {}
        self.default_top = default_top or [
            {"Move": "e2e4", "Centipawn": 30, "Mate": None}
        ]
        self.calls = []

    def __call__(self, fen, **kwargs):
        self.calls.append({"fen": fen, **kwargs})
        return self.top_moves_by_fen.get(fen, self.default_top)


@pytest.fixture
def mock_engine(monkeypatch):
    def _install(engine):
        monkeypatch.setattr("services.review_service.engine_analysis", engine)
        return engine
    return _install


# ============================================================
# Mate em Centipawn=None
# ============================================================

def test_review_engine_com_mate_nao_estoura(mock_engine, partida_pastor):
    """Quando a engine devolve Mate (Centipawn=None), nao pode estourar None - int."""
    engine = FakeEngine(default_top=[
        {"Move": "d1h5", "Centipawn": None, "Mate": 3}
    ])
    mock_engine(engine)

    resultado = review_game(partida_pastor, "w")

    assert resultado is not None
    assert "stats" in resultado
    assert "all_moves" in resultado


def test_review_centipawn_chave_ausente_nao_estoura(mock_engine, partida_pastor):
    """Se a engine devolve dict SEM chave Centipawn, nao estoura."""
    engine = FakeEngine(default_top=[{"Move": "e2e4", "Mate": 2}])
    mock_engine(engine)

    resultado = review_game(partida_pastor, "w")
    assert resultado is not None


def test_review_alternando_mate_e_cp(mock_engine, partida_pastor):
    """Alterna entre mate (Centipawn=None) e cp normal durante a partida."""

    class AlternatingEngine:
        def __init__(self):
            self.calls = []

        def __call__(self, fen, **kwargs):
            self.calls.append({"fen": fen, **kwargs})
            # Se a vez e das pretas, devolve mate (testando o caminho None)
            turn = fen.split(" ")[1]
            if turn == "b":
                return [{"Move": "e7e5", "Centipawn": None, "Mate": -2}]
            return [{"Move": "e2e4", "Centipawn": 30, "Mate": None}]

    mock_engine(AlternatingEngine())

    resultado = review_game(partida_pastor, "w")
    assert resultado is not None
    assert "stats" in resultado


def test_review_cp_before_e_cp_after_ambos_none(mock_engine, partida_pastor):
    """Todos os lances com Centipawn=None: cp_loss vira 0 sem estourar."""
    engine = FakeEngine(default_top=[
        {"Move": "e2e4", "Centipawn": None, "Mate": 1}
    ])
    mock_engine(engine)

    resultado = review_game(partida_pastor, "w")

    assert resultado is not None
    # Todos os cp_loss devem ser 0 (nem best_move nem cp_loss explodem)
    for m in resultado["all_moves"]:
        assert m["cp_loss"] >= 0


# ============================================================
# Regressao: depth=6 (Fase 3.A fez review cair no depth default 16)
# ============================================================

def test_review_chama_engine_com_depth_6(mock_engine, partida_pastor):
    """Todas as chamadas ao engine_analysis no review devem usar depth=6.

    Isso previne a regressao onde o review voltou a usar o depth default
    (ANALYSIS_DEPTH=16), tornando-o 30-50x mais lento.
    """
    engine = FakeEngine()
    mock_engine(engine)

    review_game(partida_pastor, "w")

    assert len(engine.calls) >= 2, "deve ter chamado a engine pelo menos 2 vezes"

    for call in engine.calls:
        assert call.get("depth") == 6, (
            f"chamada sem depth=6 (regressao!): {call}"
        )


# ============================================================
# Lances invalidos no historico
# ============================================================

def test_review_ignora_lance_ilegal(mock_engine):
    """Lance que nao e legal na posicao deve ser ignorado, nao analisado."""
    engine = FakeEngine()
    mock_engine(engine)

    # a1a8 e ilegal na posicao inicial (torre bloqueada por a2 e a7)
    historico = [
        {"from": "e2", "to": "e4", "san": "e4", "color": "w"},
        {"from": "a1", "to": "a8", "san": "??", "color": "b"},
        {"from": "e7", "to": "e5", "san": "e5", "color": "b"},
    ]

    resultado = review_game(historico, "w")

    assert resultado is not None
    ucis = [m["move_uci"] for m in resultado["all_moves"]]
    assert "a1a8" not in ucis


def test_review_ignora_uci_malformado(mock_engine):
    """UCI invalido deve ser ignorado sem estourar."""
    engine = FakeEngine()
    mock_engine(engine)

    historico = [
        {"from": "e2", "to": "e4", "san": "e4", "color": "w"},
        {"from": "xyz", "to": "abc", "san": "??", "color": "b"},
        {"from": "e7", "to": "e5", "san": "e5", "color": "b"},
    ]

    resultado = review_game(historico, "w")

    assert resultado is not None
    ucis = [m["move_uci"] for m in resultado["all_moves"]]
    assert not any("xyz" in u or "abc" in u for u in ucis)


def test_review_historico_com_lance_sem_from_to(mock_engine):
    """Entradas sem from/to devem ser ignoradas silenciosamente."""
    engine = FakeEngine()
    mock_engine(engine)

    historico = [
        {"from": "e2", "to": "e4", "san": "e4", "color": "w"},
        {"san": "sem_from_to", "color": "b"},  # sem from/to
        {"from": "e7", "to": "e5", "san": "e5", "color": "b"},
    ]

    resultado = review_game(historico, "w")
    assert resultado is not None


# ============================================================
# Sanidade: nada de loop extra quando lances sao invalidos
# ============================================================

def test_review_lances_invalidos_nao_chamam_engine(mock_engine):
    """Lance ilegal nao deve consumir chamada de engine."""
    engine = FakeEngine()
    mock_engine(engine)

    # Historico so com lances invalidos
    historico = [
        {"from": "a1", "to": "a8", "san": "??", "color": "w"},
        {"from": "xyz", "to": "abc", "san": "??", "color": "b"},
    ]

    review_game(historico, "w")

    # Nenhuma chamada de engine deve ter acontecido
    assert len(engine.calls) == 0
