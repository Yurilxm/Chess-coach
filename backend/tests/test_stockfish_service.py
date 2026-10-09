
"""
Testes para services/stockfish_service.py — funcao analyze_position.

Usa mock da engine. NAO chama o binario real do Stockfish.

O teste de integracao com a engine real fica em arquivo separado
(test_stockfish_integration.py) e e pulado se o binario nao existir.
"""

import pytest
from services.stockfish_service import analyze_position


class FakeStockfishEngine:
    """Engine fake configuravel, sem processo real."""

    def __init__(self, top_moves_by_fen=None, valid_fens=None):
        # dict: fen -> lista de dicts {"Move": str, "Centipawn": int, "Mate": int|None}
        self.top_moves_by_fen = top_moves_by_fen or {}
        self.valid_fens = valid_fens if valid_fens is not None else list(self.top_moves_by_fen.keys())
        self.current_fen = None
        self.set_fen_calls = []

    def set_turn_perspective(self, val):
        pass

    def is_fen_valid(self, fen):
        return fen in self.valid_fens

    def set_fen_position(self, fen):
        self.current_fen = fen
        self.set_fen_calls.append(fen)

    def get_top_moves(self, n):
        movimentos = self.top_moves_by_fen.get(self.current_fen, [])
        return movimentos[:n]

    def set_depth(self, d):
        pass

    def update_engine_parameters(self, params):
        pass

    def send_quit_command(self):
        pass


@pytest.fixture
def mock_engine(monkeypatch):
    """
    Substitui _get_or_create_engine por uma versao que retorna a engine fake.
    Retorna a funcao que instala a engine.
    """
    def _install(engine):
        monkeypatch.setattr(
            "services.stockfish_service._get_or_create_engine",
            lambda **kwargs: engine,
        )
        return engine
    return _install


# ------------------------------------------------------------
# Fim de jogo — retorno antecipado, sem chamar engine
# ------------------------------------------------------------

def test_xeque_mate_retorna_imediato(fen_checkmate, mock_engine):
    engine = mock_engine(FakeStockfishEngine())
    resultado = analyze_position(fen_checkmate)
    assert resultado["best_move"] is None
    assert resultado["evaluation"] == {"type": "mate", "value": 0}
    assert "Xeque-mate!" in resultado["warnings"]
    # engine nao deve ter sido usada
    assert engine.set_fen_calls == []


def test_afogamento_retorna_imediato(fen_stalemate, mock_engine):
    mock_engine(FakeStockfishEngine())
    resultado = analyze_position(fen_stalemate)
    assert resultado["best_move"] is None
    assert "Empate por afogamento." in resultado["warnings"]


def test_material_insuficiente_retorna_imediato(fen_insufficient_material, mock_engine):
    mock_engine(FakeStockfishEngine())
    resultado = analyze_position(fen_insufficient_material)
    assert resultado["best_move"] is None
    assert "Material insuficiente." in resultado["warnings"]


# ------------------------------------------------------------
# Analise normal
# ------------------------------------------------------------

def test_analise_simples(fen_start, mock_engine):
    """Engine fake retorna 2 lances; funcao ordena e devolve o melhor."""
    engine = FakeStockfishEngine(top_moves_by_fen={
        fen_start: [
            {"Move": "e2e4", "Centipawn": 30, "Mate": None},
            {"Move": "d2d4", "Centipawn": 20, "Mate": None},
        ],
    })
    mock_engine(engine)

    resultado = analyze_position(fen_start)

    assert resultado["best_move"] == "e2e4"
    assert resultado["evaluation"]["type"] == "cp"
    assert resultado["evaluation"]["value"] == 30
    assert len(resultado["lines"]) == 2
    assert resultado["warnings"] == []


def test_analise_com_mate(fen_start, mock_engine):
    """Se o melhor lance da mate, evaluation vira {'type':'mate'}."""
    engine = FakeStockfishEngine(top_moves_by_fen={
        fen_start: [
            {"Move": "d1h5", "Centipawn": None, "Mate": 3},
        ],
    })
    mock_engine(engine)

    resultado = analyze_position(fen_start)
    assert resultado["evaluation"]["type"] == "mate"
    assert resultado["evaluation"]["value"] == 3


def test_fen_invalido_retorna_warning(fen_invalid, mock_engine):
    """FEN invalido e capturado pelo except e retorna estrutura com warning."""
    mock_engine(FakeStockfishEngine())
    resultado = analyze_position(fen_invalid)
    # best_move None, warnings com a excecao
    assert resultado["best_move"] is None
    assert len(resultado["warnings"]) >= 1


def test_engine_sem_lances_retorna_vazio(fen_start, mock_engine):
    """Engine retorna lista vazia — funcao sinaliza 'Nenhum lance legal'."""
    engine = FakeStockfishEngine(top_moves_by_fen={fen_start: []})
    mock_engine(engine)

    resultado = analyze_position(fen_start)
    assert resultado["best_move"] is None
    assert "Nenhum lance legal." in resultado["warnings"]
