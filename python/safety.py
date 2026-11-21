"""Deterministic crisis and elevated-distress safety screening for MindMate."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Tuple

CRISIS_RESOURCES_TEXT = (
    "You do not have to carry this alone. Free, confidential 24/7 support is available right now:\n"
    "- US & Canada: Call or text 988 (Suicide & Crisis Lifeline)\n"
    "- Crisis Text Line: Text HOME to 741741\n"
    "- International: https://findahelpline.com"
)

CRISIS_PATTERNS: List[Tuple[str, re.Pattern[str]]] = [
    (
        "suicidal ideation",
        re.compile(
            r"\b(kill\s+myself|end\s+my\s+life|want\s+to\s+die|suicid(e|al)|better\s+off\s+dead|no\s+reason\s+to\s+live)\b",
            re.I,
        ),
    ),
    (
        "self-harm intent",
        re.compile(r"\b(hurt\s+myself|harm\s+myself|cut\s+myself|self[-\s]?harm|overdose)\b", re.I),
    ),
    (
        "acute hopelessness",
        re.compile(r"\b(can'?t\s+go\s+on|give\s+up\s+on\s+life|goodbye\s+forever)\b", re.I),
    ),
]

ELEVATED_PATTERNS: List[Tuple[str, re.Pattern[str]]] = [
    (
        "panic or overwhelm",
        re.compile(r"\b(panic\s+attack|can'?t\s+breathe|spiraling|completely\s+overwhelmed|breaking\s+down)\b", re.I),
    ),
    (
        "severe exhaustion",
        re.compile(r"\b(hopeless|worthless|burned\s+out|can'?t\s+cope)\b", re.I),
    ),
]


@dataclass(frozen=True)
class SafetyAssessment:
    level: str  # "none" | "elevated" | "crisis"
    matched_signals: List[str]


def detect_crisis_signals(text: str) -> SafetyAssessment:
    """Classify user input deterministically before invoking the language model."""
    normalized = (text or "").strip()
    if not normalized:
        return SafetyAssessment(level="none", matched_signals=[])

    crisis_hits = [label for label, pattern in CRISIS_PATTERNS if pattern.search(normalized)]
    if crisis_hits:
        return SafetyAssessment(level="crisis", matched_signals=crisis_hits)

    elevated_hits = [label for label, pattern in ELEVATED_PATTERNS if pattern.search(normalized)]
    if elevated_hits:
        return SafetyAssessment(level="elevated", matched_signals=elevated_hits)

    return SafetyAssessment(level="none", matched_signals=[])
