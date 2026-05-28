"""Node for classifying user query as greeting/chitchat vs substantive."""

import re

from app.agent.state import AgentState
from app.utils.logging_config import logger

_GREETING_PATTERNS = [
    r"^(hi|hello|hey|yo|sup|howdy)(\s+there|\s+guys|\s+everyone)?\s*$",
    r"^(good\s+)?morning\s*$",
    r"^(good\s+)?afternoon\s*$",
    r"^(good\s+)?evening\s*$",
    r"^what'?s up\s*$",
    r"^how'?s it going\s*$",
    r"^how are you\s*$",
    r"^how do you do\s*$",
    r"^(nice|pleased|great)\s+to\s+(meet|see)\s+(you|u)\s*$",
    r"^(thanks|thank\s+you|thx|ty)\s*$",
    r"^(bye|goodbye|see\s+(ya|you(\s+later)?)|gotta\s+go|talk\s+(to\s+)?you\s+(later|soon)|talk\s+soon)\s*$",
    r"^(sure|ok|okay|alright|got\s+it|understood|cool|awesome|great)\s*$",
]

_GREETING_RE = re.compile(
    "|".join(f"(?:{p})" for p in _GREETING_PATTERNS),
    re.IGNORECASE,
)

# Single-word patterns that are almost certainly chitchat when alone
_SINGLE_WORD_GREETINGS = {
    "hi",
    "hello",
    "hey",
    "yo",
    "sup",
    "howdy",
    "thanks",
    "thankyou",
    "thx",
    "ty",
    "bye",
    "goodbye",
    "sure",
    "ok",
    "okay",
    "cool",
    "awesome",
    "great",
}


def _is_greeting(text: str) -> bool:
    """Check if the user query is a greeting or chitchat."""
    stripped = text.strip().strip(".!?").strip()
    if not stripped:
        return False

    # Single-word greetings
    if stripped.lower() in _SINGLE_WORD_GREETINGS:
        return True

    # Multi-word pattern match
    return bool(_GREETING_RE.fullmatch(stripped))


async def classify_query(state: AgentState) -> dict:
    """Classify the user's latest query as greeting or substantive."""
    logger.info("---NODE: CLASSIFY QUERY---")

    messages = state.get("messages", [])
    if not messages:
        return {"is_greeting": False}

    user_question = messages[-1].content

    if _is_greeting(user_question):
        logger.info(f"Query classified as greeting (len={len(user_question)})")
        return {"is_greeting": True}

    logger.debug("Query classified as substantive")
    return {"is_greeting": False}
