import type { ChatRequest, ChatResponse } from '../../types/chat';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export async function askNesh(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${BACKEND_URL}/chat/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? "NESH couldn't answer that just now.");
  }

  return res.json() as Promise<ChatResponse>;
}
