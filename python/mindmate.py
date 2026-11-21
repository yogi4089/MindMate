"""
MindMate — AI-Powered Mental Health Assistant (Python)
Supports both an interactive terminal chat and an optional Gradio web UI (--ui).

Quick start:
  pip install -r requirements.txt
  python mindmate.py         # Interactive terminal chat
  python mindmate.py --ui    # Gradio web UI on http://127.0.0.1:7860
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Dict, List, Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types

from prompts import SUPPORT_MODES, get_support_mode
from safety import CRISIS_RESOURCES_TEXT, detect_crisis_signals

# Load GEMINI_API_KEY from project root .env or local .env
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
load_dotenv()

MODELS = ["gemini-3.1-flash-lite", "gemini-4-hydrogen"]


def get_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key or api_key in {"YOUR_GEMINI_API_KEY", "MY_GEMINI_API_KEY"}:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Copy .env.example to .env and add your Gemini API key."
        )
    return genai.Client(api_key=api_key)


def ask_mindmate(
    user_message: str,
    history: Optional[List[Dict[str, str]]] = None,
    mode_id: str = "empathetic",
) -> str:
    """Send a conversation turn to MindMate with deterministic crisis safety screening."""
    history = history or []
    safety = detect_crisis_signals(user_message)
    mode = get_support_mode(mode_id)
    system_instruction = mode.system_instruction

    if safety.level == "crisis":
        system_instruction += (
            "\n\nURGENT SAFETY DIRECTIVE: The user may be in crisis. Respond with deep calm care and "
            "clearly mention 988 (US/Canada), Crisis Text Line (text HOME to 741741), and findahelpline.com."
        )
    elif safety.level == "elevated":
        system_instruction += (
            "\n\nDISTRESS AWARENESS: The user is experiencing elevated overwhelm. "
            "Prioritize gentle validation before suggesting any small step."
        )

    contents = [
        {
            "role": "model" if turn["role"] == "assistant" else "user",
            "parts": [{"text": turn["content"]}],
        }
        for turn in history[-14:]
    ]
    contents.append({"role": "user", "parts": [{"text": user_message}]})

    client = get_client()
    last_error: Optional[Exception] = None

    for model_name in MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                ),
            )
            reply = (response.text or "").strip()
            if reply:
                return f"{CRISIS_RESOURCES_TEXT}\n\n---\n\n{reply}" if safety.level == "crisis" else reply
        except Exception as err:
            last_error = err

    raise RuntimeError(f"MindMate could not reach the Gemini API: {last_error}")


def run_cli() -> None:
    print("MindMate — AI Mental Health Assistant (Python CLI)")
    print("Commands: '/mode empathetic', '/mode cbt', '/mode grounding', or 'exit' to quit.\n")
    history: List[Dict[str, str]] = []
    mode_id = "empathetic"

    while True:
        try:
            user_text = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nTake care.")
            break

        if not user_text:
            continue
        if user_text.lower() in {"exit", "quit"}:
            print("Take care. MindMate is here whenever you want to check in.")
            break
        if user_text.startswith("/mode "):
            requested = user_text.split(" ", 1)[1].strip().lower()
            if requested in SUPPORT_MODES:
                mode_id = requested
                print(f"Switched mode to: {SUPPORT_MODES[mode_id].name}\n")
            else:
                print(f"Available modes: {', '.join(SUPPORT_MODES.keys())}\n")
            continue

        try:
            reply = ask_mindmate(user_text, history=history, mode_id=mode_id)
            history.append({"role": "user", "content": user_text})
            history.append({"role": "assistant", "content": reply})
            print(f"\nMindMate: {reply}\n")
        except Exception as err:
            print(f"\n[Error] {err}\n")


def run_gradio_ui() -> None:
    import gradio as gr

    def chat_handler(message: str, history: list) -> str:
        formatted: List[Dict[str, str]] = []
        for item in history:
            if isinstance(item, dict):
                formatted.append(
                    {
                        "role": "assistant" if item.get("role") == "assistant" else "user",
                        "content": str(item.get("content", "")),
                    }
                )
            elif isinstance(item, (list, tuple)) and len(item) == 2:
                formatted.append({"role": "user", "content": str(item[0])})
                formatted.append({"role": "assistant", "content": str(item[1])})
        return ask_mindmate(message, history=formatted)

    demo = gr.ChatInterface(
        fn=chat_handler,
        title="MindMate — AI Mental Health Assistant",
        description="Empathetic wellness reflection powered by Gemini. Not a substitute for licensed therapy.",
        examples=get_support_mode("empathetic").starter_prompts,
    )
    demo.launch(server_name="0.0.0.0", server_port=7860)


if __name__ == "__main__":
    if "--ui" in sys.argv:
        run_gradio_ui()
    else:
        run_cli()
