import { useEffect, useState } from 'react';
import { Wind } from 'lucide-react';
import type { ChatMessage, SupportModeId } from './types';
import { detectCrisisSignals } from './utils/safety';
import { AssistantView } from './components/AssistantView';
import { BreathingModal } from './components/BreathingModal';

const STORAGE_KEYS = {
  messages: 'mindmate_messages_v1',
  modeId: 'mindmate_mode_v1',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [breathingOpen, setBreathingOpen] = useState(false);

  const [modeId, setModeId] = useState<SupportModeId>(() =>
    loadFromStorage<SupportModeId>(STORAGE_KEYS.modeId, 'empathetic')
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadFromStorage<ChatMessage[]>(STORAGE_KEYS.messages, [])
  );
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [showCrisisHelp, setShowCrisisHelp] = useState(false);
  const [activeCrisisSignals, setActiveCrisisSignals] = useState<string[]>([]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.modeId, JSON.stringify(modeId));
    } catch {
      // Ignore storage errors
    }
  }, [modeId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
    } catch {
      // Ignore storage errors
    }
  }, [messages]);

  const handleSendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isSending) {
      return;
    }

    setChatError(null);
    const localSafety = detectCrisisSignals(trimmed);
    if (localSafety.level === 'crisis') {
      setShowCrisisHelp(true);
      setActiveCrisisSignals(localSafety.matchedSignals);
    }

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
      modeId,
      safety: localSafety,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
          modeId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'MindMate could not reply right now.');
      }

      if (data.safety?.level === 'crisis') {
        setShowCrisisHelp(true);
        setActiveCrisisSignals(data.safety.matchedSignals ?? []);
      }

      const assistantMsg: ChatMessage = {
        id: `msg-assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        modeId,
        safety: data.safety,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setChatError(
        err instanceof Error ? err.message : 'MindMate could not reply right now.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleClearSession = () => {
    setMessages([]);
    setChatError(null);
    setActiveCrisisSignals([]);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <a
            href="#mindmate"
            className="font-display text-lg font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            MindMate
          </a>

          <button
            type="button"
            onClick={() => setBreathingOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-teal-300 hover:bg-teal-50/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 whitespace-nowrap shrink-0 sm:text-sm"
          >
            <Wind className="h-4 w-4 text-teal-700" aria-hidden="true" />
            <span>Breathing</span>
          </button>
        </div>
      </header>

      <main id="mindmate" className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <AssistantView
          messages={messages}
          modeId={modeId}
          isSending={isSending}
          errorMessage={chatError}
          showCrisisHelp={showCrisisHelp}
          activeCrisisSignals={activeCrisisSignals}
          onSelectMode={setModeId}
          onSendMessage={handleSendMessage}
          onClearSession={handleClearSession}
          onDismissCrisisHelp={() => setShowCrisisHelp(false)}
        />
      </main>

      <BreathingModal open={breathingOpen} onClose={() => setBreathingOpen(false)} />
    </div>
  );
}
