import { useEffect, useRef, useState } from 'react';
import { ArrowUp, HeartHandshake, RotateCcw } from 'lucide-react';
import type { ChatMessage, SupportModeId } from '../types';
import { getSupportMode, SUPPORT_MODES } from '../utils/promptEngine';
import { CrisisBanner } from './CrisisBanner';

interface AssistantViewProps {
  messages: ChatMessage[];
  modeId: SupportModeId;
  isSending: boolean;
  errorMessage: string | null;
  showCrisisHelp: boolean;
  activeCrisisSignals: string[];
  onSelectMode: (modeId: SupportModeId) => void;
  onSendMessage: (text: string) => Promise<void>;
  onClearSession: () => void;
  onDismissCrisisHelp: () => void;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function AssistantView({
  messages,
  modeId,
  isSending,
  errorMessage,
  showCrisisHelp,
  activeCrisisSignals,
  onSelectMode,
  onSendMessage,
  onClearSession,
  onDismissCrisisHelp,
}: AssistantViewProps) {
  const [input, setInput] = useState('');
  const threadContainerRef = useRef<HTMLDivElement | null>(null);
  const activeMode = getSupportMode(modeId);

  useEffect(() => {
    if (messages.length === 0 && !isSending) {
      return;
    }
    const el = threadContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, isSending]);

  const submitText = async (rawText: string) => {
    if (!rawText.trim() || isSending) {
      return;
    }
    setInput('');
    await onSendMessage(rawText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitText(input);
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-3xl min-w-0 flex-col rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-6">
        <div
          className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1"
          role="group"
          aria-label="Conversation support mode"
        >
          {SUPPORT_MODES.map((mode) => {
            const active = mode.id === modeId;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onSelectMode(mode.id)}
                aria-pressed={active}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-700 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode.shortLabel}
              </button>
            );
          })}
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={onClearSession}
            aria-label="Clear conversation"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div
        ref={threadContainerRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6"
        data-testid="chat-thread"
      >
        {showCrisisHelp && (
          <CrisisBanner
            matchedSignals={activeCrisisSignals}
            onDismiss={onDismissCrisisHelp}
          />
        )}

        {messages.length === 0 ? (
          <div className="mx-auto max-w-lg py-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <HeartHandshake className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">
              How are you feeling today?
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {activeMode.summary} Talk freely with MindMate, or tap a prompt below to begin.
            </p>

            <div className="mt-6 space-y-2.5">
              {activeMode.starterPrompts.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => void submitText(starter)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-left text-sm text-slate-800 transition-colors hover:border-teal-300 hover:bg-teal-50/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <article
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="mb-1 flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                    <span className="font-medium text-slate-700">
                      {isUser ? 'You' : 'MindMate'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatTime(msg.timestamp)}</span>
                  </div>
                  <div
                    className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-relaxed sm:max-w-[82%] ${
                      isUser
                        ? 'bg-teal-700 text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </article>
              );
            })}

            {isSending && (
              <div className="flex flex-col items-start" role="status" aria-live="polite">
                <div className="mb-1 text-xs text-slate-500">MindMate is replying...</div>
                <div className="w-full max-w-sm space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {errorMessage}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-slate-50/70 p-4 sm:px-6">
        <label htmlFor="mindmate-chat-input" className="sr-only">
          Message MindMate
        </label>
        <div className="flex items-end gap-2.5">
          <textarea
            id="mindmate-chat-input"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void submitText(input);
              }
            }}
            placeholder="Share what is on your mind..."
            className="min-h-[52px] min-w-0 flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15"
          />
          <button
            type="submit"
            disabled={isSending || input.trim().length === 0}
            aria-label="Send message"
            className="inline-flex h-[44px] items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 whitespace-nowrap shrink-0"
          >
            <span>Send</span>
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          MindMate offers supportive AI reflection, not medical diagnosis. Call 108 for emergency or visit findahelpline.com.
          <span className="mt-1 block">Created by Yogi 2026</span>
        </p>
      </form>
    </section>
  );
}
