import random
from config.settings import DEFAULT_DIFFICULTY

START_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

OPENING_LINES = {
    "italiana": {"name": "Abertura Italiana", "moves": ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4"], "weight": 30},
    "ruy_lopez": {"name": "Ruy López", "moves": ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"], "weight": 20},
    "escocesa": {"name": "Abertura Escocesa", "moves": ["e2e4", "e7e5", "g1f3", "b8c6", "d2d4"], "weight": 10},
    "siciliana": {"name": "Defesa Siciliana", "moves": ["e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4", "f3d4", "g8f6", "b1c3"], "weight": 25},
    "francesa": {"name": "Defesa Francesa", "moves": ["e2e4", "e7e6", "d2d4", "d7d5"], "weight": 15},
    "caro_kann": {"name": "Defesa Caro-Kann", "moves": ["e2e4", "c7c6", "d2d4", "d7d5"], "weight": 10},
    "pirc": {"name": "Defesa Pirc", "moves": ["e2e4", "d7d6", "d2d4", "g8f6", "b1c3", "g7g6"], "weight": 5},
    "gambito_dama": {"name": "Gambito da Dama", "moves": ["d2d4", "d7d5", "c2c4", "e7e6", "b1c3", "g8f6"], "weight": 20},
    "eslava": {"name": "Defesa Eslava", "moves": ["d2d4", "d7d5", "c2c4", "c7c6"], "weight": 15},
    "india_rei": {"name": "Índia do Rei", "moves": ["d2d4", "g8f6", "c2c4", "g7g6", "b1c3", "f8g7"], "weight": 15},
    "nimzo_india": {"name": "Nimzo-Índia", "moves": ["d2d4", "g8f6", "c2c4", "e7e6", "b1c3", "f8b4"], "weight": 10},
    "inglesa": {"name": "Abertura Inglesa", "moves": ["c2c4", "e7e5", "b1c3", "g8f6", "g1f3", "b8c6"], "weight": 10},
    "londres": {"name": "Sistema Londres", "moves": ["d2d4", "d7d5", "g1f3", "g8f6", "c1f4"], "weight": 10},
}

OPENING_LEVELS = {
    200:  ["italiana", "londres"],
    400:  ["italiana", "londres", "gambito_dama"],
    600:  ["italiana", "escocesa", "gambito_dama", "londres"],
    800:  ["italiana", "ruy_lopez", "siciliana", "gambito_dama", "eslava"],
    1000: ["italiana", "ruy_lopez", "siciliana", "francesa", "gambito_dama", "eslava", "india_rei"],
    1200: ["italiana", "ruy_lopez", "siciliana", "francesa", "caro_kann", "gambito_dama", "eslava", "india_rei", "nimzo_india", "inglesa", "londres"],
    1400: ["italiana", "ruy_lopez", "siciliana", "francesa", "caro_kann", "pirc", "gambito_dama", "eslava", "india_rei", "nimzo_india", "inglesa", "londres"],
}

current_opening_line = None
current_opening_index = 0


def get_opening_line(difficulty: int):
    allowed = OPENING_LEVELS.get(difficulty, OPENING_LEVELS[1000])
    if difficulty >= 1400:
        allowed = OPENING_LEVELS[1400]
    elif difficulty >= 1000:
        allowed = OPENING_LEVELS[1000]
    
    available = {k: v for k, v in OPENING_LINES.items() if k in allowed}
    if not available:
        return None
    
    names = list(available.keys())
    weights = [available[n]["weight"] for n in names]
    chosen_key = random.choices(names, weights=weights, k=1)[0]
    return available[chosen_key]


def get_opening_moves(fen: str, difficulty: int):
    global current_opening_line, current_opening_index
    
    fen_short = " ".join(fen.split(" ")[:3])
    start_short = " ".join(START_POSITION.split(" ")[:3])
    
    if fen_short == start_short:
        line = get_opening_line(difficulty)
        if line:
            current_opening_line = line
            current_opening_index = 0
            return line["moves"][0]
        return None
    
    if current_opening_line and current_opening_index < len(current_opening_line["moves"]) - 1:
        current_opening_index += 1
        return current_opening_line["moves"][current_opening_index]
    
    current_opening_line = None
    current_opening_index = 0
    return None


def detect_opening_from_history(history: list):
    """Detecta abertura a partir do histórico de lances."""
    opening_moves_uci = [m.get('from', '') + m.get('to', '') for m in history[:20] if m.get('from') and m.get('to')]
    if not opening_moves_uci:
        return "", ""
    
    best_match_len = 0
    best_name = ""
    best_code = ""
    
    for key, line in OPENING_LINES.items():
        moves = line["moves"]
        if len(moves) <= len(opening_moves_uci):
            match = True
            for i, m in enumerate(moves):
                if i >= len(opening_moves_uci) or opening_moves_uci[i] != m:
                    match = False
                    break
            if match and len(moves) > best_match_len:
                best_name = line["name"]
                best_code = key.upper()
                best_match_len = len(moves)
    
    return best_name, best_code