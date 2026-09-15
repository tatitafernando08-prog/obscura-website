// src/pages/app/PastPaperDetailPage.tsx
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchPaper, fetchPaperViewUrl, PaperNotFoundError } from '../../lib/api/papers';
import type { PastPaperDetail } from '../../types/paper';

export function PastPaperDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const [paper, setPaper] = useState<PastPaperDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');

  const loadPaper = useCallback(async () => {
    if (!session || !id) return;
    setLoadError('');
    setNotFound(false);
    try {
      const data = await fetchPaper(id, session.access_token);
      setPaper(data);
    } catch (err) {
      console.error('Could not load paper', err);
      if (err instanceof PaperNotFoundError) {
        setNotFound(true);
      } else {
        setLoadError(err instanceof Error ? err.message : "Couldn't load this paper.");
      }
    }
  }, [session, id]);

  useEffect(() => {
    loadPaper();
  }, [loadPaper]);

  const handleViewPdf = useCallback(async () => {
    if (!session || !id) return;
    setViewError('');
    setViewLoading(true);
    try {
      const url = await fetchPaperViewUrl(id, session.access_token);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Could not open paper PDF', err);
      setViewError(err instanceof Error ? err.message : "Couldn't open this paper.");
    } finally {
      setViewLoading(false);
    }
  }, [session, id]);

  return (
    <div className="papers-page">
      <Link to="/app/papers" className="deck-back-link">&larr; All past papers</Link>

      {notFound && <div className="task-empty">Paper not found.</div>}
      {loadError && <div className="task-empty">{loadError}</div>}
      {!notFound && !loadError && paper === null && <div className="task-empty">Loading...</div>}
      {!notFound && !loadError && paper !== null && (
        <div className="paper-detail-card">
          <div className="paper-detail-subject">{paper.subject}</div>
          <div className="paper-detail-row"><span>Year</span><span>{paper.year ?? 'Unknown'}</span></div>
          <div className="paper-detail-row"><span>Status</span><span>{paper.status}</span></div>
          <div className="paper-detail-row"><span>Chunks indexed</span><span>{paper.chunk_count}</span></div>
          <button type="button" className="view-pdf-btn" onClick={handleViewPdf} disabled={viewLoading}>
            {viewLoading ? 'Opening...' : 'View PDF'}
          </button>
          {viewError && <div className="task-empty">{viewError}</div>}
        </div>
      )}
    </div>
  );
}
