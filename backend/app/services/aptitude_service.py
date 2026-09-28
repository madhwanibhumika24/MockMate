"""Curated topic bank for the Aptitude Assessments module.

This is feature 1 of the Assessments module: MCQ-based aptitude practice,
the same format IndiaBix/PrepInsta/GeeksforGeeks and most company placement
tests (TCS NQT, Infosys, Capgemini, etc.) use. Deliberately Quant/Reasoning/
Verbal only -- no DSA or coding questions, that's covered by the Practice
Interview module already.

Like group_discussion_service.py, this is a plain static list (no AI call,
no database table) so topic browsing is instant and free; the AI is only
used to generate the actual quiz questions (see aptitude_quiz_service.py).
"""

from typing import List, Optional, TypedDict

CATEGORIES = [
    "Quantitative Aptitude",
    "Logical Reasoning",
    "Verbal Ability",
]


class AptitudeTopic(TypedDict):
    id: str
    category: str
    title: str
    description: str


TOPICS: List[AptitudeTopic] = [
    # ---------- Quantitative Aptitude ----------
    {
        "id": "quant-percentages",
        "category": "Quantitative Aptitude",
        "title": "Percentages",
        "description": "Percentage change, increase/decrease, and percentage-based word problems.",
    },
    {
        "id": "quant-profit-loss",
        "category": "Quantitative Aptitude",
        "title": "Profit, Loss & Discount",
        "description": "Cost price, selling price, profit/loss percentage, and successive discounts.",
    },
    {
        "id": "quant-time-speed-distance",
        "category": "Quantitative Aptitude",
        "title": "Time, Speed & Distance",
        "description": "Relative speed, average speed, and problems on trains, boats, and streams.",
    },
    {
        "id": "quant-ratio-proportion",
        "category": "Quantitative Aptitude",
        "title": "Ratio & Proportion",
        "description": "Dividing quantities in a given ratio, and direct/inverse proportion problems.",
    },
    {
        "id": "quant-simple-compound-interest",
        "category": "Quantitative Aptitude",
        "title": "Simple & Compound Interest",
        "description": "Computing interest, principal, and amount under simple and compound interest.",
    },
    # ---------- Logical Reasoning ----------
    {
        "id": "reasoning-blood-relations",
        "category": "Logical Reasoning",
        "title": "Blood Relations",
        "description": "Working out family relationships from a chain of statements.",
    },
    {
        "id": "reasoning-syllogisms",
        "category": "Logical Reasoning",
        "title": "Syllogisms",
        "description": "Judging which conclusions logically follow from a set of given statements.",
    },
    {
        "id": "reasoning-coding-decoding",
        "category": "Logical Reasoning",
        "title": "Coding-Decoding",
        "description": "Spotting the pattern used to encode letters, numbers, or words.",
    },
    {
        "id": "reasoning-seating-arrangement",
        "category": "Logical Reasoning",
        "title": "Seating Arrangement",
        "description": "Placing people or items around a table or row based on given clues.",
    },
    {
        "id": "reasoning-number-series",
        "category": "Logical Reasoning",
        "title": "Number Series",
        "description": "Finding the pattern in a sequence of numbers to get the missing or next term.",
    },
    # ---------- Verbal Ability ----------
    {
        "id": "verbal-synonyms-antonyms",
        "category": "Verbal Ability",
        "title": "Synonyms & Antonyms",
        "description": "Picking the closest or opposite meaning of a given word.",
    },
    {
        "id": "verbal-sentence-correction",
        "category": "Verbal Ability",
        "title": "Sentence Correction",
        "description": "Spotting and fixing grammar, tense, and usage errors in a sentence.",
    },
    {
        "id": "verbal-reading-comprehension",
        "category": "Verbal Ability",
        "title": "Reading Comprehension",
        "description": "Answering questions based on a short passage.",
    },
    {
        "id": "verbal-para-jumbles",
        "category": "Verbal Ability",
        "title": "Para Jumbles",
        "description": "Rearranging shuffled sentences into a coherent paragraph.",
    },
    {
        "id": "verbal-one-word-substitution",
        "category": "Verbal Ability",
        "title": "One-Word Substitution",
        "description": "Picking the single word that means the same as a given phrase.",
    },
]


def list_categories() -> List[str]:
    return CATEGORIES


def list_topics(category: Optional[str] = None) -> List[AptitudeTopic]:
    """Returns the topic bank, optionally filtered to one category.

    An unrecognized category simply yields an empty list rather than
    raising -- the frontend never sends one that isn't in CATEGORIES anyway.
    """
    if category is None:
        return TOPICS
    return [topic for topic in TOPICS if topic["category"] == category]


def get_topic(topic_id: str) -> Optional[AptitudeTopic]:
    """Looks up a single topic by id, or None if it doesn't exist."""
    for topic in TOPICS:
        if topic["id"] == topic_id:
            return topic
    return None
