"""Node for generating a greeting response."""

import random

from langchain_core.messages import AIMessage

from app.agent.state import AgentState
from app.utils.logging_config import logger

_GREETING_RESPONSES = [
    "Hello! How can I help you today?",
    "Hi there! What can I do for you?",
    "Hey! How can I assist you?",
    "Hello! What brings you here today?",
    "Hi! Is there anything I can help you with?",
]

_THANKS_RESPONSES = [
    "You're welcome! Is there anything else I can help you with?",
    "Happy to help! Let me know if you need anything else.",
    "Glad I could assist! Anything else I can do for you?",
    "No problem at all! Is there anything else you'd like to know?",
]


async def generate_greeting(state: AgentState) -> dict:
    """Generate an appropriate greeting response."""
    logger.info("---NODE: GENERATE GREETING---")

    messages = state.get("messages", [])
    user_text = messages[-1].content.strip().lower().strip(",.!?;:") if messages else ""

    if user_text in ("thanks", "thank you", "thx", "ty", "thankyou"):
        response = random.choice(_THANKS_RESPONSES)
    else:
        response = random.choice(_GREETING_RESPONSES)

    logger.info(f"Greeting response: {response}")
    return {"messages": [AIMessage(content=response)]}
