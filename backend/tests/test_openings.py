
"""
Testes para chess_logic/openings.py — funcao detect_opening_from_history.

Recebe o historico (lista de dicts com 'from' e 'to') e retorna uma
tupla (nome, codigo). O codigo e a chave interna em MAIUSCULA (ex:
"ITALIANA", "RUY_LOPEZ"). Nao e codigo ECO real (C50, C60).

IMPORTANTE: o frontend tem um detector proprio com codigos ECO reais.
Este backend usa nomenclatura interna. Essa divergencia e conhecida.
"""

from chess_logic.openings import detect_opening_from_history


def _mv(frm, to):
    """Helper: cria um lance no formato esperado pela funcao."""
    return {"from": frm, "to": to}


# ------------------------------------------------------------
# Casos de borda
# ------------------------------------------------------------

def test_historico_vazio_retorna_vazio():
    nome, codigo = detect_opening_from_history([])
    assert nome == ""
    assert codigo == ""


def test_historico_sem_from_to():
    """Entradas sem 'from'/'to' sao ignoradas."""
    nome, codigo = detect_opening_from_history([{"san": "e4"}, {"san": "e5"}])
    assert nome == ""
    assert codigo == ""


def test_lance_unico_sem_match():
    """Uma abertura precisa de pelo menos 4 lances. Um lance so nao casa."""
    nome, codigo = detect_opening_from_history([_mv("e2", "e4")])
    assert nome == ""
    assert codigo == ""


# ------------------------------------------------------------
# Aberturas conhecidas
# ------------------------------------------------------------

def test_abertura_italiana():
    history = [
        _mv("e2", "e4"), _mv("e7", "e5"),
        _mv("g1", "f3"), _mv("b8", "c6"),
        _mv("f1", "c4"),
    ]
    nome, codigo = detect_opening_from_history(history)
    assert nome == "Abertura Italiana"
    assert codigo == "ITALIANA"


def test_ruy_lopez():
    history = [
        _mv("e2", "e4"), _mv("e7", "e5"),
        _mv("g1", "f3"), _mv("b8", "c6"),
        _mv("f1", "b5"),
    ]
    nome, codigo = detect_opening_from_history(history)
    assert nome == "Ruy López"
    assert codigo == "RUY_LOPEZ"


def test_prefixo_comum_nao_casa():
    """
    Italiana e Ruy Lopez compartilham os 4 primeiros lances. Com apenas
    esses 4 lances, nenhuma das duas casa (ambas exigem o 5o lance).
    """
    history = [
        _mv("e2", "e4"), _mv("e7", "e5"),
        _mv("g1", "f3"), _mv("b8", "c6"),
    ]
    nome, codigo = detect_opening_from_history(history)
    assert nome == ""
    assert codigo == ""


def test_siciliana_longa():
    """Siciliana tem 9 lances definidos. Historico com os 9 casa."""
    history = [
        _mv("e2", "e4"), _mv("c7", "c5"),
        _mv("g1", "f3"), _mv("d7", "d6"),
        _mv("d2", "d4"), _mv("c5", "d4"),
        _mv("f3", "d4"), _mv("g8", "f6"),
        _mv("b1", "c3"),
    ]
    nome, codigo = detect_opening_from_history(history)
    assert nome == "Defesa Siciliana"
    assert codigo == "SICILIANA"


# ------------------------------------------------------------
# Historico de partida real (fixture)
# ------------------------------------------------------------

def test_mate_do_pastor_nao_casa_com_abertura_conhecida(partida_pastor):
    """
    Mate do pastor: e2e4 e7e5 f1c4 b8c6 d1h5 g8f6 h5f7.
    O 3o lance e f1c4, mas a Italiana espera g1f3 antes. Nao casa.
    """
    nome, codigo = detect_opening_from_history(partida_pastor)
    assert nome == ""
    assert codigo == ""


# ------------------------------------------------------------
# Limite de 20 lances
# ------------------------------------------------------------

def test_apenas_primeiros_20_lances_sao_considerados():
    """
    A funcao so olha history[:20]. Se uma abertura valida aparece nos
    primeiros 20 lances, e detectada mesmo com historico maior.
    Italiana (5 lances) + 30 lances extras = ainda casa.
    """
    italianos = [
        _mv("e2", "e4"), _mv("e7", "e5"),
        _mv("g1", "f3"), _mv("b8", "c6"),
        _mv("f1", "c4"),
    ]
    extras = [_mv("a2", "a3") for _ in range(30)]
    history = italianos + extras

    nome, codigo = detect_opening_from_history(history)
    assert nome == "Abertura Italiana"
    assert codigo == "ITALIANA"
