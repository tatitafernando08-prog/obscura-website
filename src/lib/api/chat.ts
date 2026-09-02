import type { ChatRequest, ChatResponse } from '../../types/chat';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export async function askNesh(request: ChatRequest, accessToken: string): Promise<ChatResponse> {
  const res = await fetch(`${BACKEND_URL}/chat/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const data: unknown = await res.json().catch(() => ({}));
    const backendMessage = typeof data === 'object' && data !== null && 'message' in data && typeof (data as { message: unknown }).message === 'string'
      ? (data as { message: string }).message
      : undefined;

    if (res.status === 401) {
      throw new Error('Your session expired — please sign in again.');
    }
    if (res.status === 429) {
      throw new Error("You're sending messages too fast — wait a moment and try again.");
    }
    throw new Error(backendMessage ?? "NESH couldn't answer that just now.");
  }

  return res.json() as Promise<ChatResponse>;
}
