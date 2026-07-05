'use client';

import { useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  reportIds?: string[];
};

const SUGGESTIONS = [
  'Show open high-priority reports',
  'Summarize flooding reports in the last week',
  'Which zone has the most reports?',
];

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(question: string) {
    if (!question.trim()) return;
    setError(null);
    setBusy(true);
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setInput('');

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'AI request failed');
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: json.answer,
          reportIds: json.referencedReportIds,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card flex h-[70vh] flex-col p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Ask AI about your reports
      </h2>

      <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">
              Ask questions about reports assigned to your institution. The AI
              only sees your assigned reports.
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="btn-secondary justify-start text-left text-xs"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'ml-6 bg-brand-600 text-white'
                : 'mr-6 bg-slate-100 text-slate-800'
            }`}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
            {m.reportIds && m.reportIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {m.reportIds.map((id) => (
                  <a
                    key={id}
                    href={`/reports/${id}`}
                    className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-brand-700 underline"
                  >
                    {id.slice(0, 8)}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}

        {busy && <p className="text-sm text-slate-400">Thinking…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about assigned reports…"
          disabled={busy}
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn-primary">
          Send
        </button>
      </form>
    </div>
  );
}
