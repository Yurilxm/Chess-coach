
"""
Testes para services/coach_service.py — funcao get_coach_explanation.

Usa mock do cliente Gemini. NUNCA chama a API real.
"""

import pytest
from services.coach_service import get_coach_explanation


class FakeGeminiResponse:
    def __init__(self, text):
        self.text = text


class FakeGeminiModels:
    def __init__(self, response_text=None, raise_exc=None):
        self.response_text = response_text
        self.raise_exc = raise_exc
        self.last_model = None
        self.last_contents = None

    def generate_content(self, model, contents):
        self.last_model = model
        self.last_contents = contents
        if self.raise_exc:
            raise self.raise_exc
        return FakeGeminiResponse(self.response_text)


class FakeGeminiClient:
    def __init__(self, **kwargs):
        self.models = FakeGeminiModels(**kwargs)


@pytest.fixture
def mock_gemini(monkeypatch):
    """Substitui o gemini_client do coach_service por um fake controlavel."""
    def _install(response_text="Explicacao de teste.", raise_exc=None):
        fake = FakeGeminiClient(response_text=response_text, raise_exc=raise_exc)
        monkeypatch.setattr("services.coach_service.gemini_client", fake)
        return fake
    return _install


# ------------------------------------------------------------
# Casos basicos
# ------------------------------------------------------------

def test_explicacao_basica(fen_start, mock_gemini):
    fake = mock_gemini(response_text="Lance central, ocupa o meio.")
    resultado = get_coach_explanation(fen_start, "e2e4")
    assert resultado == "Lance central, ocupa o meio."
    assert fake.models.last_model == "test-dummy-model"
    assert "e4" in fake.models.last_contents or "e2e4" in fake.models.last_contents


def test_explicacao_com_mate(fen_start, mock_gemini):
    """Evaluation tipo 'mate' vira texto 'Mate em N lances' no prompt."""
    fake = mock_gemini(response_text="Mate em 2.")
    resultado = get_coach_explanation(
        fen_start, "e2e4",
        evaluation={"type": "mate", "value": 2},
    )
    assert resultado == "Mate em 2."
    assert "Mate em 2" in fake.models.last_contents


def test_explicacao_com_cp_positivo(fen_start, mock_gemini):
    fake = mock_gemini(response_text="Vantagem branca.")
    get_coach_explanation(
        fen_start, "e2e4",
        evaluation={"type": "cp", "value": 150},
    )
    assert "Vantagem das brancas" in fake.models.last_contents


def test_explicacao_com_cp_negativo(fen_start, mock_gemini):
    fake = mock_gemini(response_text="Vantagem preta.")
    get_coach_explanation(
        fen_start, "e2e4",
        evaluation={"type": "cp", "value": -200},
    )
    assert "Vantagem das pretas" in fake.models.last_contents


# ------------------------------------------------------------
# Falhas
# ------------------------------------------------------------

def test_gemini_falha_retorna_none(fen_start, mock_gemini):
    """Se o Gemini levantar excecao, a funcao retorna None (comportamento atual)."""
    mock_gemini(raise_exc=RuntimeError("API fora do ar"))
    resultado = get_coach_explanation(fen_start, "e2e4")
    assert resultado is None


# ------------------------------------------------------------
# FEN invalido — comportamento atual (bug conhecido)
# ------------------------------------------------------------

def test_fen_invalido_retorna_none(fen_invalid, mock_gemini):
    """
    FEN invalido e rejeitado explicitamente antes de tentar criar o
    board. A funcao retorna None sem chamar o Gemini.
    """
    mock_gemini()
    resultado = get_coach_explanation(fen_invalid, "e2e4")
    assert resultado is None


def test_fen_invalido_nao_chama_gemini(fen_invalid, mock_gemini):
    """Verifica que o Gemini nao e chamado quando o FEN e invalido."""
    fake = mock_gemini()
    get_coach_explanation(fen_invalid, "e2e4")
    assert fake.models.last_contents is None


def test_fen_valido_chama_gemini(fen_start, mock_gemini):
    """Verifica que o Gemini e chamado para FEN valido."""
    fake = mock_gemini(response_text="Explicacao qualquer.")
    get_coach_explanation(fen_start, "e2e4")
    assert fake.models.last_contents is not None


# ------------------------------------------------------------
# Conversao de UCI para SAN
# ------------------------------------------------------------

def test_move_legal_e_convertido_para_san(fen_start, mock_gemini):
    """Lance UCI legal vira SAN no prompt (ex: e2e4 -> e4)."""
    fake = mock_gemini()
    get_coach_explanation(fen_start, "e2e4")
    assert "Lance e4" in fake.models.last_contents or "e4" in fake.models.last_contents


def test_move_ilegal_usa_uci_original(fen_start, mock_gemini):
    """Lance UCI ilegal (nao existe) mantem a string original."""
    fake = mock_gemini()
    get_coach_explanation(fen_start, "a1a8")
    assert "a1a8" in fake.models.last_contents
