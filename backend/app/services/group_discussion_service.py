"""Curated topic bank for the Group Discussion module.

This is feature 1 of the Group Discussion module: a browsable bank of real
GD topics, grouped by category. It's a plain static list (no AI call, no
database table) -- fast, free, and enough to demonstrate the feature end to
end. The actual live discussion (multiple simulated AI participants
debating a chosen topic, with feedback on the candidate's contribution) is
separate, later work; see the "Coming soon" note surfaced on the frontend.
"""

from typing import List, Optional, TypedDict

CATEGORIES = [
    "Technology & AI",
    "Business & Economy",
    "Social Issues",
    "Environment & Sustainability",
    "Education & Career",
    "Ethics & Abstract",
]


class GDTopic(TypedDict):
    id: str
    category: str
    title: str
    prompt: str


TOPICS: List[GDTopic] = [
    # ---------- Technology & AI ----------
    {
        "id": "tech-ai-jobs",
        "category": "Technology & AI",
        "title": "Will AI replace more jobs than it creates?",
        "prompt": "Discuss whether AI-driven automation is a net job destroyer or job creator over the next decade.",
    },
    {
        "id": "tech-social-media-utility",
        "category": "Technology & AI",
        "title": "Should social media platforms be regulated like a public utility?",
        "prompt": "Debate whether platforms with billions of users should face utility-style regulation.",
    },
    {
        "id": "tech-remote-work",
        "category": "Technology & AI",
        "title": "Is remote work here to stay, or will offices make a comeback?",
        "prompt": "Weigh productivity, culture, and cost arguments on both sides of the return-to-office debate.",
    },
    {
        "id": "tech-smartphone-age",
        "category": "Technology & AI",
        "title": "Should there be a minimum age to own a smartphone?",
        "prompt": "Discuss the case for and against age restrictions on smartphone ownership for children.",
    },
    {
        "id": "tech-data-privacy",
        "category": "Technology & AI",
        "title": "Is data privacy a fundamental right in the digital age?",
        "prompt": "Debate whether data privacy deserves the same status as other fundamental rights.",
    },
    # ---------- Business & Economy ----------
    {
        "id": "biz-four-day-week",
        "category": "Business & Economy",
        "title": "Should a four-day work week become the standard?",
        "prompt": "Discuss whether a shorter standard work week would help or hurt productivity and the economy.",
    },
    {
        "id": "biz-unlimited-growth",
        "category": "Business & Economy",
        "title": "Is unlimited economic growth a realistic goal for any country?",
        "prompt": "Debate whether perpetual growth is sustainable, and what the alternative would look like.",
    },
    {
        "id": "biz-startup-profitability",
        "category": "Business & Economy",
        "title": "Should startups prioritize profitability over rapid growth?",
        "prompt": "Discuss the \"growth at all costs\" model versus building a profitable business from day one.",
    },
    {
        "id": "biz-outsourcing",
        "category": "Business & Economy",
        "title": "Is outsourcing good or bad for a developing economy?",
        "prompt": "Weigh the job-creation benefits of outsourcing against concerns about dependency and wages.",
    },
    {
        "id": "biz-salary-transparency",
        "category": "Business & Economy",
        "title": "Should companies be required to disclose employee salary ranges publicly?",
        "prompt": "Debate whether mandatory salary transparency helps workers or creates new problems.",
    },
    # ---------- Social Issues ----------
    {
        "id": "social-media-harm",
        "category": "Social Issues",
        "title": "Is social media doing more harm than good to society?",
        "prompt": "Discuss social media's effect on mental health, relationships, and public discourse.",
    },
    {
        "id": "social-free-college",
        "category": "Social Issues",
        "title": "Should college education be free for everyone?",
        "prompt": "Debate the funding, access, and quality trade-offs of free higher education.",
    },
    {
        "id": "social-cancel-culture",
        "category": "Social Issues",
        "title": "Is cancel culture an effective tool for accountability?",
        "prompt": "Discuss whether public callouts genuinely change behavior or just create backlash.",
    },
    {
        "id": "social-influencer-marketing",
        "category": "Social Issues",
        "title": "Should influencer marketing aimed at minors be more strictly regulated?",
        "prompt": "Debate what protections, if any, children need from influencer-driven advertising.",
    },
    {
        "id": "social-gig-economy",
        "category": "Social Issues",
        "title": "Is the gig economy empowering workers or exploiting them?",
        "prompt": "Weigh the flexibility gig work offers against concerns about job security and benefits.",
    },
    # ---------- Environment & Sustainability ----------
    {
        "id": "env-plastics-ban",
        "category": "Environment & Sustainability",
        "title": "Should single-use plastics be banned globally?",
        "prompt": "Discuss the feasibility and impact of a worldwide ban on single-use plastics.",
    },
    {
        "id": "env-nuclear-energy",
        "category": "Environment & Sustainability",
        "title": "Is nuclear energy the answer to the climate crisis?",
        "prompt": "Debate nuclear power's role in a low-carbon future against its risks and costs.",
    },
    {
        "id": "env-responsibility",
        "category": "Environment & Sustainability",
        "title": "Should individuals or corporations bear more responsibility for climate change?",
        "prompt": "Discuss where the greater share of responsibility for climate action should fall.",
    },
    {
        "id": "env-fast-fashion",
        "category": "Environment & Sustainability",
        "title": "Is fast fashion compatible with a sustainable future?",
        "prompt": "Debate whether the fast-fashion business model can ever be made truly sustainable.",
    },
    {
        "id": "env-ev-mandate",
        "category": "Environment & Sustainability",
        "title": "Should electric vehicles be mandatory within the next decade?",
        "prompt": "Discuss the practicality and fairness of mandating a full switch to electric vehicles.",
    },
    # ---------- Education & Career ----------
    {
        "id": "edu-degree-relevance",
        "category": "Education & Career",
        "title": "Are traditional degrees losing relevance compared to skill-based hiring?",
        "prompt": "Debate whether formal degrees still matter as much as demonstrated skills to employers.",
    },
    {
        "id": "edu-coding-mandatory",
        "category": "Education & Career",
        "title": "Should coding be a mandatory subject in school curricula?",
        "prompt": "Discuss whether every student should learn to code, the way they learn math or science.",
    },
    {
        "id": "edu-early-career-pressure",
        "category": "Education & Career",
        "title": "Is the pressure to choose a career early doing more harm than good?",
        "prompt": "Debate whether students should be expected to pick a career path so early in life.",
    },
    {
        "id": "edu-soft-skills-grading",
        "category": "Education & Career",
        "title": "Should soft skills be graded as formally as technical skills?",
        "prompt": "Discuss whether communication, teamwork, and leadership should carry formal grades.",
    },
    {
        "id": "edu-job-hopping",
        "category": "Education & Career",
        "title": "Is job-hopping every 1-2 years a smart career strategy today?",
        "prompt": "Weigh the growth benefits of frequent job changes against the value of staying long-term.",
    },
    # ---------- Ethics & Abstract ----------
    {
        "id": "ethics-lying-kindness",
        "category": "Ethics & Abstract",
        "title": "Is it ever ethical to lie to protect someone's feelings?",
        "prompt": "Discuss where the line falls between kindness and honesty.",
    },
    {
        "id": "ethics-success-happiness",
        "category": "Ethics & Abstract",
        "title": "Should success be measured by happiness rather than wealth?",
        "prompt": "Debate what a better measure of a successful life would actually look like.",
    },
    {
        "id": "ethics-competition-collaboration",
        "category": "Ethics & Abstract",
        "title": "Is competition healthier for growth than collaboration?",
        "prompt": "Discuss which drives better outcomes for individuals and teams: competing or collaborating.",
    },
    {
        "id": "ethics-ends-means",
        "category": "Ethics & Abstract",
        "title": "Does the end always justify the means?",
        "prompt": "Debate whether a good outcome can excuse a questionable way of getting there.",
    },
    {
        "id": "ethics-generalist-specialist",
        "category": "Ethics & Abstract",
        "title": "Is it better to be a jack of all trades or a master of one?",
        "prompt": "Discuss the trade-offs between broad versatility and deep specialization.",
    },
]


def list_categories() -> List[str]:
    return CATEGORIES


def list_topics(category: Optional[str] = None) -> List[GDTopic]:
    """Returns the topic bank, optionally filtered to one category.

    An unrecognized category simply yields an empty list rather than raising
    -- there's nothing unsafe about it, and the frontend never sends one
    that isn't in CATEGORIES anyway.
    """
    if category is None:
        return TOPICS
    return [topic for topic in TOPICS if topic["category"] == category]


def get_topic(topic_id: str) -> Optional[GDTopic]:
    """Looks up a single topic by id, or None if it doesn't exist."""
    for topic in TOPICS:
        if topic["id"] == topic_id:
            return topic
    return None
