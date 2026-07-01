import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STOCKFISH_PATH = os.path.join(BASE_DIR, "engine", "stockfish.exe")

ANALYSIS_DEPTH = 16
MULTI_PV = 3
DEFAULT_DIFFICULTY = 1000

GEMINI_API_KEY = "SUA_CHAVE_DE_API_DO_GEMINI_AQUI"

DIFFICULTY_LEVELS = {
    200:  {"skill": 0,  "depth": 1,  "cp_margin": 200, "error_rate": 0.50, "name": "Primeiros passos"},
    400:  {"skill": 0,  "depth": 2,  "cp_margin": 150, "error_rate": 0.40, "name": "Iniciante"},
    600:  {"skill": 0,  "depth": 3,  "cp_margin": 100, "error_rate": 0.30, "name": "Aprendiz"},
    800:  {"skill": 2,  "depth": 4,  "cp_margin": 70,  "error_rate": 0.20, "name": "Praticante"},
    1000: {"skill": 4,  "depth": 5,  "cp_margin": 50,  "error_rate": 0.12, "name": "Intermediário"},
    1200: {"skill": 6,  "depth": 6,  "cp_margin": 35,  "error_rate": 0.08, "name": "Competidor"},
    1400: {"skill": 8,  "depth": 7,  "cp_margin": 25,  "error_rate": 0.05, "name": "Avançado"},
    1600: {"skill": 10, "depth": 8,  "cp_margin": 18,  "error_rate": 0.03, "name": "Especialista"},
    1800: {"skill": 12, "depth": 9,  "cp_margin": 12,  "error_rate": 0.02, "name": "Mestre"},
    2000: {"skill": 15, "depth": 10, "cp_margin": 8,   "error_rate": 0.01, "name": "Mestre Elite"},
    2200: {"skill": 18, "depth": 12, "cp_margin": 5,   "error_rate": 0.005,"name": "Desafiante"},
    2400: {"skill": 20, "depth": 14, "cp_margin": 3,   "error_rate": 0.002,"name": "Grão-Mestre"},
    2600: {"skill": 20, "depth": 16, "cp_margin": 0,   "error_rate": 0.0,  "name": "Lenda"},
    3000: {"skill": 20, "depth": 18, "cp_margin": 0,   "error_rate": 0.0,  "name": "Stockfish Máximo"},
}