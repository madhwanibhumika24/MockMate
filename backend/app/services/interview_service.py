"""Interview question generation and session flow logic."""

from functools import lru_cache
from typing import List, Optional, Tuple

from google import genai

from app.core.config import get_settings
from app.services.resume_analyzer_service import format_resume_analysis_for_prompt

# Fixed stage structure each interview type follows, one stage per question
# slot. Index 0 is always the first question asked (previous_qa is empty),
# index 1 is the second, and so on -- see generate_question()'s stage_index
# below. Kept in sync with MAX_QUESTIONS_PER_SESSION in
# app/api/routes/interview.py: if that changes, extend/trim these lists (the
# last stage repeats for any extra questions beyond what's listed here).
STAGE_SETS = {
    "technical": ["introduction", "resume_walkthrough", "fundamentals", "oop_concepts", "problem_solving"],
    "hr": ["introduction", "career_motivation", "strengths_weaknesses", "teamwork_conflict", "closing_fit"],
    "behavioral": ["introduction", "star_challenge", "star_teamwork", "star_leadership", "star_failure"],
    "project": ["introduction", "project_deep_dive", "technical_decisions", "challenges_tradeoffs", "impact_results"],
    "system_design": [
        "introduction",
        "requirements_clarification",
        "high_level_design",
        "deep_dive_component",
        "scaling_tradeoffs",
    ],
    "company": ["introduction", "technical_deep_dive", "problem_solving", "closing_fit", "closing_wrapup"],
    "mixed": ["introduction", "resume_walkthrough", "fundamentals", "behavioral_scenario", "closing_wrapup"],
}

STAGE_GUIDANCE = {
    "introduction": (
        "This is the opening icebreaker question. Ask the candidate to introduce "
        "themselves and briefly walk through their background and how they got "
        "to where they are now."
    ),
    "resume_walkthrough": (
        "Ask a specific question about one concrete thing from the candidate's "
        "resume (a project, role, or achievement) and have them elaborate on "
        "it in more depth. If no resume was provided, instead ask them to walk "
        "through the experience or project they're most proud of for this role."
    ),
    "fundamentals": (
        "Ask a core language/technology fundamentals question relevant to the "
        "role -- something a solid practitioner in this field should know cold."
    ),
    "oop_concepts": (
        "Ask an object-oriented programming concepts question (e.g. "
        "inheritance, polymorphism, encapsulation, abstraction, or a SOLID "
        "principle) as it applies to the candidate's stated skills. If the "
        "role clearly isn't a programming role, ask a core theoretical or "
        "conceptual question central to that field instead."
    ),
    "problem_solving": (
        "Ask a practical problem-solving or scenario-based question relevant "
        "to the role, calibrated to the difficulty level below."
    ),
    "career_motivation": (
        "Ask about the candidate's career goals and what's motivating them to "
        "pursue this specific role or company -- aspirations, not technical skill."
    ),
    "strengths_weaknesses": (
        "Ask the candidate to describe a genuine strength and a genuine "
        "weakness, each with a concrete example, and how they're actively "
        "working on the weakness."
    ),
    "teamwork_conflict": (
        "Ask about a specific time they worked closely with a team or "
        "navigated a disagreement with a colleague or manager -- focus on "
        "interpersonal skills, not technical content."
    ),
    "closing_fit": (
        "Ask a closing HR-style question about culture fit, working style, "
        "or what they're looking for in their next role."
    ),
    "star_challenge": (
        "Ask a behavioral question, framed for a STAR-method answer "
        "(Situation, Task, Action, Result), about a time they faced a "
        "significant challenge or a tight deadline."
    ),
    "star_teamwork": (
        "Ask a behavioral question, framed for a STAR-method answer, about "
        "collaborating with others or resolving disagreement within a team."
    ),
    "star_leadership": (
        "Ask a behavioral question, framed for a STAR-method answer, about a "
        "time they took initiative or led something, even informally."
    ),
    "star_failure": (
        "Ask a behavioral question, framed for a STAR-method answer, about a "
        "mistake or failure and what they learned from it."
    ),
    "project_deep_dive": (
        "Ask the candidate to pick one specific project from their resume or "
        "experience and describe it end-to-end, focusing on their own "
        "individual contribution."
    ),
    "technical_decisions": (
        "Ask about a specific technical or design decision made in that "
        "project, and why it was chosen over the alternatives available."
    ),
    "challenges_tradeoffs": (
        "Ask about the hardest challenge or trade-off encountered in that "
        "project, and how it was handled."
    ),
    "impact_results": (
        "Ask about the measurable outcome or impact of that project, and "
        "what they'd do differently with hindsight."
    ),
    "requirements_clarification": (
        "Pose a realistic system design prompt appropriate to the candidate's "
        "role and experience level, and ask them to start by clarifying the "
        "functional and non-functional requirements."
    ),
    "high_level_design": (
        "Ask the candidate to describe a high-level architecture or "
        "component breakdown for the system being designed."
    ),
    "deep_dive_component": (
        "Ask the candidate to go deeper into one specific component of their "
        "design (e.g. the data model, a particular service) in more detail."
    ),
    "scaling_tradeoffs": (
        "Ask about scaling, reliability, or trade-off decisions in the "
        "design (e.g. consistency vs. availability, caching, load handling)."
    ),
    "behavioral_scenario": (
        "Ask a single behavioral/interpersonal question relevant to teamwork "
        "or handling pressure -- a change of pace from the technical questions."
    ),
    "closing_wrapup": (
        "Ask a closing question that blends technical curiosity with soft-"
        "skill reflection -- e.g. what they'd want to learn next in this role."
    ),
    "technical_deep_dive": (
        "Ask a role-specific technical question in the style of a "
        "standardized technical round many companies run for this kind of "
        "role -- practical and realistic, not academic trivia."
    ),
}

# Stages where a chosen topic (e.g. "Python", "Java") should sharpen the
# question. Only stages that are inherently language/tech-specific are
# included here -- HR, behavioral, project, and system-design stages stay
# role-based regardless of topic.
TOPIC_AWARE_STAGES = {"fundamentals", "oop_concepts", "problem_solving"}

# Overall emphasis for the whole session based on the chosen interview type,
# layered on top of (not instead of) the per-stage guidance above.
INTERVIEW_TYPE_GUIDANCE = {
    "technical": (
        "This is a technical interview focused on coding/CS fundamentals and "
        "problem-solving ability."
    ),
    "hr": (
        "This is an HR round focused on motivation, communication, and "
        "cultural fit. Do not ask coding or technical trivia questions."
    ),
    "behavioral": (
        "This is a pure behavioral interview using the STAR method "
        "(Situation, Task, Action, Result). Every question should prompt a "
        "specific past-experience story, not hypotheticals or technical "
        "knowledge."
    ),
    "project": (
        "This is a project deep-dive interview. Every question should "
        "revolve around a specific project from the candidate's resume or "
        "stated experience, probing their individual contribution and "
        "decision-making."
    ),
    "system_design": (
        "This is a system design interview. Pose a realistic design scenario "
        "appropriate to the role and difficulty level, and ask the candidate "
        "to reason through it -- this is not a coding/trivia round."
    ),
    "company": (
        "This is a company-style interview modeled on the general format "
        "many companies use for this kind of role -- a mix of technical "
        "depth and culture/communication fit. These are AI-generated "
        "practice questions, not real questions from any specific company's "
        "actual past interview -- never imply otherwise."
    ),
    "mixed": (
        "This is a mixed-format interview blending technical fundamentals, "
        "resume-based, and behavioral questions across the session."
    ),
}

# Which personalization mode the candidate picked on the Start Interview
# page (a tab, not a form field) -- shifts the overall emphasis of the whole
# session, on top of (not instead of) the per-stage/topic/difficulty/type
# guidance above. "role" is the original default behavior, so it adds no
# extra text.
MODE_GUIDANCE = {
    "role": "",
    "resume": (
        "Personalization: the candidate chose a resume-driven interview. "
        "Wherever possible, ground questions in specific things from their "
        "resume (named projects, roles, technologies) rather than generic "
        "role questions."
    ),
    "topic": (
        "Personalization: the candidate chose a language/topic-focused "
        "interview. Even the introduction and resume walkthrough should "
        "steer toward their experience with that topic where possible, and "
        "every technical question must be about it."
    ),
    "job_description": (
        "Personalization: the candidate chose a job-description-driven "
        "interview. Tie every question, where possible, back to a specific "
        "requirement or responsibility mentioned in the job description below."
    ),
}

DIFFICULTY_GUIDANCE = {
    "easy": (
        "Keep this question approachable -- foundational concepts, clear "
        "wording, suitable for someone early in their learning."
    ),
    "medium": "Keep this question at a solid mid-level bar -- the kind a working practitioner should handle.",
    "hard": (
        "Make this question genuinely challenging -- edge cases, deeper "
        "trade-offs, or multi-part reasoning, suitable for a senior candidate."
    ),
}

QUESTION_SYSTEM_PROMPT = """\
You are an experienced interviewer conducting a mock interview for the role \
of {role}. Ask exactly ONE interview question at a time -- no preamble, no \
numbering, no "Question 1:" labels, just the question itself.

{interview_type_emphasis}

Tailor the question to the role, the job description (if provided), and the \
candidate's resume (if provided). Do not repeat or closely rephrase a \
question that's already been asked in this session (see the transcript \
below).
{mode_emphasis}
For this question specifically: {stage_guidance}

Difficulty level -- {difficulty}: {difficulty_guidance}

Job description:
{job_description}

Candidate resume:
{resume_text}
{resume_analysis_block}
"""


@lru_cache
def _get_client() -> genai.Client:
    settings = get_settings()
    if not settings.google_api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY is not set. Add it to backend/.env to generate interview questions."
        )
    return genai.Client(api_key=settings.google_api_key)


def generate_question(
    role: str,
    job_description: Optional[str],
    resume_text: Optional[str],
    previous_qa: Optional[List[Tuple[str, str]]] = None,
    difficulty: str = "medium",
    topic: Optional[str] = None,
    mode: str = "role",
    interview_type: str = "technical",
    resume_analysis: Optional[dict] = None,
) -> str:
    """Generates the next interview question.

    `previous_qa` is the session's [(question, answer), ...] history so far --
    its length also doubles as the stage index (0 for the first question, 1
    for the second, ...), so the session always follows the fixed stage
    structure for its `interview_type` (see STAGE_SETS), regardless of role.

    `topic` optionally names a specific language/technology (e.g. "Python") to
    focus the fundamentals/OOP/problem-solving stages on -- None lets the LLM
    infer the most relevant one from the role/resume/job description instead,
    same as before this parameter existed.

    `mode` is which Start Interview tab the candidate used ("role" | "resume"
    | "topic" | "job_description") -- shifts overall emphasis via
    MODE_GUIDANCE, independent of the fixed stage structure.

    `interview_type` is the interview category ("technical" | "hr" |
    "behavioral" | "project" | "system_design" | "mixed") -- picks which
    fixed 5-stage flow this session follows, via STAGE_SETS.

    `resume_analysis` is the structured extraction (see
    app.services.resume_analyzer_service) of the candidate's resume, if any
    -- when present, it's embedded as a "verified facts" block so
    resume-related questions stay grounded in what's actually in the resume
    instead of inventing plausible-sounding details.

    TODO once the vector store is set up (currently deferred, see
    requirements.txt): ground this in retrieved reference material via
    app.rag.retriever instead of relying on the model alone.
    """
    client = _get_client()
    settings = get_settings()

    interview_type = interview_type if interview_type in STAGE_SETS else "technical"
    stages = STAGE_SETS[interview_type]

    stage_index = len(previous_qa) if previous_qa else 0
    stage = stages[min(stage_index, len(stages) - 1)]
    difficulty = difficulty if difficulty in DIFFICULTY_GUIDANCE else "medium"

    stage_guidance = STAGE_GUIDANCE[stage]
    if stage in TOPIC_AWARE_STAGES:
        topic = topic.strip() if topic and topic.strip() else None
        if topic:
            stage_guidance += (
                f" Focus specifically on {topic} -- ask about {topic} itself, "
                "not a different language or generic theory."
            )
        else:
            stage_guidance += (
                " Infer the most relevant language or technology from the "
                "role, resume, and job description."
            )

    mode = mode if mode in MODE_GUIDANCE else "role"

    system_prompt = QUESTION_SYSTEM_PROMPT.format(
        role=role,
        interview_type_emphasis=INTERVIEW_TYPE_GUIDANCE[interview_type],
        mode_emphasis=f"\n{MODE_GUIDANCE[mode]}\n" if MODE_GUIDANCE[mode] else "",
        stage_guidance=stage_guidance,
        difficulty=difficulty,
        difficulty_guidance=DIFFICULTY_GUIDANCE[difficulty],
        job_description=job_description or "(not provided)",
        resume_text=resume_text or "(not provided)",
        resume_analysis_block=f"\n{format_resume_analysis_for_prompt(resume_analysis)}" if resume_analysis else "",
    )

    transcript = "(none yet -- this is the first question)"
    if previous_qa:
        transcript = "\n\n".join(f"Q: {q}\nA: {a}" for q, a in previous_qa)

    interaction = client.interactions.create(
        model=settings.gemini_model,
        system_instruction=system_prompt,
        input=f"Questions and answers so far:\n{transcript}\n\nAsk the next question.",
        generation_config={"temperature": 0.7},
    )
    return interaction.output_text.strip()
