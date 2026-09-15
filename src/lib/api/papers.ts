import type { PastPaper, PastPaperDetail } from '../../types/paper';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export async function fetchPapers(accessToken: string): Promise<PastPaper[]> {
  const res = await fetch(`${BACKEND_URL}/papers`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Your session expired — please sign in again.');
    throw new Error("Couldn't load past papers.");
  }

  const data = (await res.json()) as { papers: PastPaper[] };
  return data.papers;
}

export class PaperNotFoundError extends Error {}

export async function fetchPaper(id: string, accessToken: string): Promise<PastPaperDetail> {
  const res = await fetch(`${BACKEND_URL}/papers/${id}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Your session expired — please sign in again.');
    if (res.status === 404) throw new PaperNotFoundError('paper_not_found');
    throw new Error("Couldn't load this paper.");
  }

  return res.json() as Promise<PastPaperDetail>;
}

export async function fetchPaperViewUrl(id: string, accessToken: string): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/papers/${id}/view-url`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Your session expired — please sign in again.');
    if (res.status === 404) throw new PaperNotFoundError('paper_not_found');
    throw new Error("Couldn't open this paper.");
  }

  const data = (await res.json()) as { view_url: string };
  return data.view_url;
}
