import { useRef, useState, type KeyboardEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { askNesh } from '../../lib/api/chat';
import type { ChatHistoryMessage, ChatSource } from '../../types/chat';

interface DisplayMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  status?: 'loading' | 'error';
  citations?: { subject: string; year: string }[];
}

function dedupeCitations(sources: ChatSource[]): { subject: string; year: string }[] {
  const seen = new Set<string>();
  const citations: { subject: string; year: string }[] = [];
  for (const source of sources) {
    const key = `${source.past_papers.subject}|${source.past_papers.year}`;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({ subject: source.past_papers.subject, year: source.past_papers.year });
  }
  return citations;
}

export function ChatPage() {
  const { session, profile } = useAuth();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const historyRef = useRef<ChatHistoryMessage[]>([]);
  const nextId = useRef(0);

  async function handleSend() {
    const question = input.trim();
    if (!question || !session || !profile || sending) return;

    setInput('');
    setSending(true);

    const userMessageId = nextId.current++;
    const assistantMessageId = nextId.current++;
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: 'user', content: question },
      { id: assistantMessageId, role: 'assistant', content: 'Thinking…', status: 'loading' },
    ]);

    const streamValue = profile.exam_type === 'OL' ? 'OL' : profile.stream ?? undefined;

    try {
      const response = await askNesh(
        {
          question,
          medium: profile.medium,
          student_id: session.user.id,
          stream: streamValue,
          syllabus: profile.syllabus,
          chat_history: historyRef.current,
        },
        session.access_token,
      );

      const citations = response.sources.length > 0 ? dedupeCitations(response.sources) : undefined;
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMessageId ? { ...m, content: response.answer, status: undefined, citations } : m)),
      );
      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: question },
        { role: 'assistant', content: response.answer },
      ];
    } catch (err) {
      console.error('askNesh failed', err);
      const message = err instanceof Error ? err.message : "NESH couldn't answer that just now.";
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMessageId ? { ...m, content: message, status: 'error' } : m)),
      );
    } finally {
      setSending(false);
    }
  }

  function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSend();
  }

  return (
    <div className="chat-page">
      <div className="chat-topbar">
        <div className="chat-topbar-left">
          <div className="chat-topbar-avatar">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H9l-4 4v-4H5.5C4.67 16 4 15.33 4 14.5v-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="chat-topbar-name">NESH AI</div>
            <div className="chat-topbar-status">● Online</div>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty-state">
            <img src="/assets/mascot_wave.png" alt="NESH" />
            <h3>Ask NESH anything</h3>
            <p>Ask a question about any subject and NESH will find the right material.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble-row ${m.role}`}>
            <div className={`chat-bubble ${m.role === 'user' ? 'user' : 'nesh'}${m.status === 'loading' ? ' loading' : ''}${m.status === 'error' ? ' error' : ''}`}>
              {m.content}
              {m.citations && m.citations.length > 0 && (
                <div className="chat-citations">
                  {m.citations.map((c) => (
                    <span key={`${c.subject}-${c.year}`} className="chat-citation-chip">{c.subject} · {c.year}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          type="text"
          placeholder="Ask NESH anything..."
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={sending}
        />
        <button type="button" className="chat-send-btn" aria-label="Send" onClick={handleSend} disabled={sending || !input.trim()}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
