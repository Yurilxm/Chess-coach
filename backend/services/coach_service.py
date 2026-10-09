import chess
from google import genai
from config.settings import GEMINI_API_KEY, GEMINI_MODEL

gemini_client = genai.Client(api_key=GEMINI_API_KEY)


def get_coach_explanation(fen: str, move: str, evaluation: dict = None):
    try:
        # Validacao segura do FEN. chess.Board(fen) levanta ValueError
        # para strings malformadas. .is_valid() cobre posicoes
        # semanticamente invalidas (sem reis, pecas a mais, etc).
        # Antes, FEN malformado explodia e caia no except externo com
        # a mensagem enganosa 'Erro no Gemini'.
        board = None
        if fen and isinstance(fen, str):
            try:
                _b = chess.Board(fen)
                if _b.is_valid():
                    board = _b
            except (ValueError, TypeError):
                pass
        if board is None:
            return None

        move_san = move
        try:
            chess_move = chess.Move.from_uci(move)
            if chess_move in board.legal_moves:
                move_san = board.san(chess_move)
        except (ValueError, TypeError):
            pass
        
        eval_text = ""
        if evaluation:
            if evaluation.get("type") == "mate":
                eval_text = f"Mate em {evaluation['value']} lances"
            else:
                cp = evaluation.get("value", 0)
                if cp > 0:
                    eval_text = f"Vantagem das brancas: +{cp/100:.2f}"
                elif cp < 0:
                    eval_text = f"Vantagem das pretas: {cp/100:.2f}"
                else:
                    eval_text = "Posição equilibrada"
        
        prompt = f"""Você é um treinador de xadrez paciente e didático. Explique o lance {move_san} (UCI: {move}) para um aluno.

Posição: {fen}
Avaliação do motor: {eval_text}

Formato da resposta:
Objetivo: [1 frase dizendo o que este lance conquista]
Desenvolvimento: [1 frase sobre peças desenvolvidas ou ameaçadas]
Plano: [1 frase sobre a ideia estratégica]
Atenção: [1 frase sobre riscos ou oportunidades]

Regras:
- Use linguagem simples, como se falasse com um amigo.
- NÃO use linguagem excessivamente técnica.
- Termine com uma dica prática para os próximos lances.
- Texto puro, sem markdown, sem asteriscos."""

        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        print(f"Erro ao gerar explicacao: {e}")
        return None