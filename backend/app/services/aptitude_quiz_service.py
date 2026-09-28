"""AI-generated MCQ quizzes for the Aptitude Assessments module.

Feature 1 of the Assessments module: once a candidate picks a topic from
the curated bank (see aptitude_service.py), this generates a set of
multiple-choice questions for it and grades the candidate's submitted
answers. Stateless and one-shot, same pattern as the rest of this app: no
session is created in the database and nothing is persisted server-side.

The one meaningfully different requirement versus Ask AI / Group Discussion
is that there IS a right answer here, and it must not be readable from the
quiz-generation response -- a candidate could otherwise just open devtools
and read the correct option straight off the network tab. So each question
carries an opaque, encrypted "token" (via `cryptography`'s Fernet, already
a dependency) instead of the answer: the token is the only place the
correct index and explanation live until the candidate submits, and only
the backend holds the key needed to decrypt it. This avoids needing any new
database table or session state for grading.
"""

import base64
import hashlib
import json
from functools import lru_cache
from typing import List

from cryptography.fernet import Fernet, InvalidToken
from google import genai

from app.core.config import get_settings

DIFFICULTIES = {"easy", "medium", "hard"}
DEFAULT_DIFFICULTY = "medium"
MIN_COUNT = 3
MAX_COUNT = 10
DEFAULT_COUNT = 5

APTITUDE_QUIZ_SYSTEM_PROMPT = """\
You generate multiple-choice aptitude questions for a candidate practicing \
for placement/entrance exams, in the style of IndiaBix, GeeksforGeeks, and \
PrepInsta practice tests.

You will be given a topic, a difficulty level, and how many questions to \
generate. Generate exactly that many original multiple-choice questions on \
that topic, at that difficulty.

Rules for every question:
- Exactly 4 answer options, plausible and mutually exclusive -- distractors \
  should reflect common calculation mistakes, not random or obviously-wrong \
  values.
- Exactly one option is correct.
- Numeric questions must have a single, unambiguous correct numeric answer \
  -- work it out carefully before writing the options.
- Keep each question self-contained. For reading comprehension, include a \
  short passage inline in the question text.
- Write a brief 1-2 sentence explanation of why the correct answer is \
  right (the method or reasoning, not just restating the answer).
- Never repeat the same question twice in one set.

Respond with ONLY a JSON object (no markdown fences, no commentary) with \
exactly this shape:
{"questions": [{"question": "...", "options": ["...", "...", "...", "..."], \
"correct_index": 0, "explanation": "..."}]}
"correct_index" is the 0-based index into "options" of the correct answer.
"""


@lru_cache
def _get_client() -> genai.Client:
    settings = get_settings()
    if not settings.google_api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY is not set. Add it to backend/.env to generate a quiz."
        )
    return genai.Client(api_key=settings.google_api_key)


@lru_cache
def _get_fernet() -> Fernet:
    settings = get_settings()
    if not settings.jwt_secret_key:
        raise RuntimeError("Server is not configured correctly (missing secret key).")
    key = base64.urlsafe_b64encode(hashlib.sha256(settings.jwt_secret_key.encode("utf-8")).digest())
    return Fernet(key)


def _encrypt_answer(question: str, options: List[str], correct_index: int, explanation: str) -> str:
    payload = {
        "question": question,
        "options": options,
        "correct_index": correct_index,
        "explanation": explanation,
    }
    return _get_fernet().encrypt(json.dumps(payload).encode("utf-8")).decode("utf-8")


def _decrypt_answer(token: str) -> dict:
    try:
        raw = _get_fernet().decrypt(token.encode("utf-8"))
        return json.loads(raw.decode("utf-8"))
    except (InvalidToken, ValueError, TypeError, json.JSONDecodeError) as exc:
        raise RuntimeError("One of your answers couldn't be verified. Please retake the quiz.") from exc


def generate_quiz(topic_title: str, difficulty: str = DEFAULT_DIFFICULTY, count: int = DEFAULT_COUNT) -> dict:
    """Generates a set of MCQs for one aptitude topic.

    Returns {"topic_title", "difficulty", "questions": [{"id", "question",
    "options", "token"}, ...]} -- notice there is no correct answer or
    explanation anywhere in this return value; both live only inside each
    question's encrypted "token", read back out in grade_quiz() below.
    Raises RuntimeError on failure (missing API key, model/network error,
    an unparseable response, or too few valid questions to make a quiz).
    """
    client = _get_client()
    settings = get_settings()

    difficulty = difficulty if difficulty in DIFFICULTIES else DEFAULT_DIFFICULTY
    count = max(MIN_COUNT, min(MAX_COUNT, count))

    user_input = f"Topic: {topic_title}\nDifficulty: {difficulty}\nNumber of questions: {count}"

    try:
        interaction = client.interactions.create(
            model=settings.gemini_model,
            system_instruction=APTITUDE_QUIZ_SYSTEM_PROMPT,
            input=user_input,
            generation_config={"temperature": 0.7},
            response_format={"mime_type": "application/json"},
        )
        data = json.loads(interaction.output_text.strip())
    except Exception as exc:
        raise RuntimeError("Couldn't generate a quiz right now. Please try again.") from exc

    questions = []
    for index, item in enumerate(data.get("questions") or []):
        if not isinstance(item, dict):
            continue
        question_text = str(item.get("question") or "").strip()
        options = [str(opt).strip() for opt in (item.get("options") or []) if str(opt or "").strip()]
        correct_index = item.get("correct_index")
        explanation = str(item.get("explanation") or "").strip()

        if not question_text or len(options) != 4 or explanation is None or not explanation:
            continue
        if not isinstance(correct_index, int) or not (0 <= correct_index < 4):
            continue

        token = _encrypt_answer(question_text, options, correct_index, explanation)
        questions.append({"id": f"q{index + 1}", "question": question_text, "options": options, "token": token})

    if len(questions) < MIN_COUNT:
        raise RuntimeError("Couldn't generate a quiz right now. Please try again.")

    return {"topic_title": topic_title, "difficulty": difficulty, "questions": questions}


def grade_quiz(answers: List[dict]) -> dict:
    """Grades a submitted quiz.

    `answers` is [{"id", "token", "selected_index"}, ...] -- exactly what
    the frontend received from generate_quiz() plus the candidate's choice.
    The correct answer and explanation are decrypted from each token here,
    never trusted from anywhere else in the request. Raises RuntimeError if
    any token is missing, tampered with, or otherwise fails to decrypt.
    """
    results = []
    correct_count = 0

    for answer in answers:
        token = answer.get("token") or ""
        selected_index = answer.get("selected_index")
        payload = _decrypt_answer(token)

        correct_index = payload["correct_index"]
        is_correct = selected_index == correct_index
        if is_correct:
            correct_count += 1

        results.append(
            {
                "id": answer.get("id", ""),
                "question": payload["question"],
                "options": payload["options"],
                "selected_index": selected_index,
                "correct_index": correct_index,
                "is_correct": is_correct,
                "explanation": payload["explanation"],
            }
        )

    total = len(results)
    score = round((correct_count / total) * 100, 1) if total else 0.0
    return {"score": score, "correct_count": correct_count, "total": total, "results": results}
