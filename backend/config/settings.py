import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STOCKFISH_PATH = os.path.join(BASE_DIR, "engine", "stockfish.exe")

ANALYSIS_DEPTH = 18
MULTI_PV = 3
DEFAULT_DIFFICULTY = 1000

GEMINI_API_KEY = "SUA_CHAVE_DE_API_DO_GEMINI_AQUI"

DIFFICULTY_LEVELS = {
    200:  {"skill": 0,  "depth": 2,  "cp_margin": 200, "error_rate": 0.50, "name": "Primeiros passos",  "desc": "Joga lances quase aleatórios. Ideal para aprender."},
    400:  {"skill": 0,  "depth": 3,  "cp_margin": 150, "error_rate": 0.40, "name": "Iniciante",          "desc": "Lances básicos, sem cálculo profundo."},
    600:  {"skill": 0,  "depth": 4,  "cp_margin": 100, "error_rate": 0.30, "name": "Aprendiz",           "desc": "Captura peças desprotegidas com frequência."},
    800:  {"skill": 2,  "depth": 5,  "cp_margin": 70,  "error_rate": 0.20, "name": "Praticante",         "desc": "Controla o centro e desenvolve peças."},
    1000: {"skill": 4,  "depth": 7,  "cp_margin": 50,  "error_rate": 0.12, "name": "Intermediário",      "desc": "Calcula táticas simples e pune erros."},
    1200: {"skill": 6,  "depth": 9,  "cp_margin": 35,  "error_rate": 0.08, "name": "Competidor",         "desc": "Boa visão tática. Aproveita garfos."},
    1400: {"skill": 8,  "depth": 11, "cp_margin": 25,  "error_rate": 0.05, "name": "Avançado",           "desc": "Sólido estrategicamente."},
    1600: {"skill": 10, "depth": 13, "cp_margin": 18,  "error_rate": 0.03, "name": "Especialista",       "desc": "Calcula variantes longas."},
    1800: {"skill": 12, "depth": 15, "cp_margin": 12,  "error_rate": 0.02, "name": "Mestre",             "desc": "Explora fraquezas mínimas."},
    2000: {"skill": 15, "depth": 17, "cp_margin": 8,   "error_rate": 0.01, "name": "Mestre Elite",       "desc": "Força de clube. Quase sem erros."},
    2200: {"skill": 18, "depth": 19, "cp_margin": 5,   "error_rate": 0.005,"name": "Desafiante",         "desc": "Nível de campeonato."},
    2400: {"skill": 20, "depth": 21, "cp_margin": 3,   "error_rate": 0.002,"name": "Grão-Mestre",        "desc": "Força de torneio internacional."},
    2600: {"skill": 20, "depth": 23, "cp_margin": 0,   "error_rate": 0.0,  "name": "Lenda",              "desc": "Nível de elite mundial."},
    3000: {"skill": 20, "depth": 26, "cp_margin": 0,   "error_rate": 0.0,  "name": "Stockfish Máximo",   "desc": "Força total. O desafio definitivo."},
}