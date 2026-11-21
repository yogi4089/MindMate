"""Unit tests for MindMate Python safety guardrails and prompt engineering modules."""

import unittest

from prompts import SUPPORT_MODES, get_support_mode
from safety import detect_crisis_signals


class MindMatePythonTests(unittest.TestCase):
    def test_detect_crisis_signals(self) -> None:
        crisis = detect_crisis_signals("I feel hopeless and want to hurt myself tonight.")
        self.assertEqual(crisis.level, "crisis")
        self.assertIn("self-harm intent", crisis.matched_signals)

        elevated = detect_crisis_signals("I am completely overwhelmed and spiraling.")
        self.assertEqual(elevated.level, "elevated")
        self.assertTrue(len(elevated.matched_signals) > 0)

        normal = detect_crisis_signals("I am preparing for my first Python developer interview.")
        self.assertEqual(normal.level, "none")
        self.assertEqual(normal.matched_signals, [])

    def test_support_modes_use_mindmate_persona(self) -> None:
        self.assertEqual(len(SUPPORT_MODES), 3)
        for mode in SUPPORT_MODES.values():
            self.assertIn("MindMate", mode.system_instruction)
            self.assertIn("988", mode.system_instruction)
        self.assertEqual(get_support_mode("cbt").id, "cbt")
        self.assertEqual(get_support_mode("unknown").id, "empathetic")


if __name__ == "__main__":
    unittest.main()
