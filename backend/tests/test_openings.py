"""
Testes para chess_logic/openings.py.

A deteccao de abertura para display vive no frontend
(frontend/src/utils/openings.js). Este modulo backend so cuida de
escolher a linha que o BOT vai jogar.
"""

from chess_logic.openings import (
    get_opening_line,
    OPENING_LINES,
    OPENING_LEVELS,
)


def test_get_opening_line_retorna_linha_valida():
    line = get_opening_line(1000)
    assert line is not None
    assert "moves" in line
    assert "name" in line
    assert len(line["moves"]) >= 4


def test_get_opening_line_nivel_200_apenas_aberturas_basicas():
    line = get_opening_line(200)
    assert line is not None
    assert line["name"] in ("Abertura Italiana", "Sistema Londres")


def test_get_opening_line_nivel_alto_permite_mais_aberturas():
    nomes_vistos = set()
    for _ in range(50):
        line = get_opening_line(1400)
        assert line is not None
        nomes_vistos.add(line["name"])
    assert len(nomes_vistos) > 3


def test_get_opening_line_nivel_desconhecido_nao_quebra():
    line = get_opening_line(9999)
    assert line is not None


def test_openings_lines_tem_estrutura_correta():
    for key, line in OPENING_LINES.items():
        assert "name" in line, f"{key} sem name"
        assert "moves" in line, f"{key} sem moves"
        assert "weight" in line, f"{key} sem weight"
        assert isinstance(line["moves"], list)
        assert len(line["moves"]) >= 2


def test_opening_levels_apontam_para_linhas_existentes():
    for nivel, chaves in OPENING_LEVELS.items():
        for chave in chaves:
            assert chave in OPENING_LINES, f"Nivel {nivel} aponta para {chave} inexistente"
