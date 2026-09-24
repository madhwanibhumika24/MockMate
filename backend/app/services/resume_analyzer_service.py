"""Structured extraction of resume content via Gemini.

Purpose: turn a resume's raw extracted text into structured fields (education,
skills, projects, experience, certifications) so that:
  1. Resume-based interview questions can be grounded in facts that are
     actually in the resume, instead of the LLM inventing plausible-sounding
     but fictional projects/skills.
  2. The candidate can see, on their profile, a quick summary of what was
     picked up from their resume.

This is extraction only -- the model must not add, infer, or embellish
anything beyond what the resume text actually states.
"""

import json
from functools import lru_cache
from typing import Optional

from google import genai

from app.core.config import get_settings

RESUME_ANALYSIS_SYSTEM_PROMPT = """\
You extract structured facts from a candidate's resume text. You do NOT \
invent, infer, or embellish anything -- only report what is explicitly \
present in the resume text given to you. If a section has no content in the \
resume, return an empty list for it.

Respond with ONLY a JSON object (no markdown fences, no commentary) with \
exactly these keys:
- "skills": a list of strings, each a specific skill/technology/tool named \
  in the resume (e.g. "Python", "React", "AWS")
- "education": a list of strings, each one education entry (degree, field, \
  institution, and year if present), e.g. "B.Tech in Computer Science, XYZ \
  University (2022)"
- "projects": a list of objects, each with "name" (string) and "summary" \
  (a one-sentence description drawn only from the resume's own wording)
- "experience": a list of objects, each with "role" (string), "organization" \
  (string), and "summary" (a one-sentence description drawn only from the \
  resume's own wording) -- covers jobs, internships, and similar
- "certifications": a list of strings, each a certification or credential \
  named in the resume
"""


@lru_cache
def _get_client() -> genai.Client:
    settings = get_settings()
    if not settings.google_api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY is not set. Add it to backend/.env to analyze resumes."
        )
    return genai.Client(api_key=settings.google_api_key)


_EMPTY_ANALYSIS = {
    "skills": [],
    "education": [],
    "projects": [],
    "experience": [],
    "certifications": [],
}


def analyze_resume(resume_text: Optional[str]) -> Optional[dict]:
    """Extracts structured fields from raw resume text.

    Returns None if there's no resume text to analyze. Never raises for a
    model/parsing failure -- resume analysis is an enhancement, not a
    blocker, so callers get None back on failure and can carry on without it
    (falling back to passing the raw resume text to the interview/feedback
    prompts, same as before this feature existed).
    """
    if not resume_text or not resume_text.strip():
        return None

    try:
        client = _get_client()
        settings = get_settings()

        interaction = client.interactions.create(
            model=settings.gemini_model,
            system_instruction=RESUME_ANALYSIS_SYSTEM_PROMPT,
            input=resume_text,
            generation_config={"temperature": 0.0},
            response_format={"mime_type": "application/json"},
        )
        data = json.loads(interaction.output_text.strip())
    except Exception:
        # Analysis is best-effort -- swallow model/network/parsing errors
        # rather than blocking resume upload or interview creation.
        return None

    return {
        "skills": data.get("skills") or [],
        "education": data.get("education") or [],
        "projects": data.get("projects") or [],
        "experience": data.get("experience") or [],
        "certifications": data.get("certifications") or [],
    }


def format_resume_analysis_for_prompt(analysis: Optional[dict]) -> str:
    """Renders a resume analysis dict as a compact "verified facts" block to
    embed in an LLM prompt, so resume-based questions stay grounded in facts
    that are actually in the resume rather than invented ones.
    """
    if not analysis:
        return ""

    lines = []
    if analysis.get("skills"):
        lines.append(f"Skills: {', '.join(analysis['skills'])}")
    if analysis.get("education"):
        lines.append("Education: " + "; ".join(analysis["education"]))
    if analysis.get("projects"):
        lines.append(
            "Projects: "
            + "; ".join(f"{p.get('name', 'Untitled')} -- {p.get('summary', '')}" for p in analysis["projects"])
        )
    if analysis.get("experience"):
        lines.append(
            "Experience: "
            + "; ".join(
                f"{e.get('role', '')} at {e.get('organization', '')} -- {e.get('summary', '')}"
                for e in analysis["experience"]
            )
        )
    if analysis.get("certifications"):
        lines.append(f"Certifications: {', '.join(analysis['certifications'])}")

    if not lines:
        return ""

    return (
        "Verified resume facts (only reference specific projects, skills, or "
        "experience listed here when asking resume-related questions -- do "
        "not invent any project, skill, or role not listed):\n" + "\n".join(lines)
    )
