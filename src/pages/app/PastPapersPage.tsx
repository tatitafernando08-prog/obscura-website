// src/pages/app/PastPapersPage.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchPapers } from '../../lib/api/papers';
import type { PastPaper } from '../../types/paper';

const ALL = 'All';

export function PastPapersPage() {
  const { session } = useAuth();
  const [papers, setPapers] = useState<PastPaper[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [subjectFilter, setSubjectFilter] = useState(ALL);
  const [yearFilter, setYearFilter] = useState(ALL);
  const [syllabusFilter, setSyllabusFilter] = useState(ALL);

  const loadPapers = useCallback(async () => {
    if (!session) return;
    setLoadError('');
    try {
      const all = await fetchPapers(session.access_token);
      setPapers(all.filter((p) => p.status === 'ready'));
    } catch (err) {
      console.error('Could not load past papers', err);
      setPapers(null);
      setLoadError(err instanceof Error ? err.message : "Couldn't load past papers.");
    }
  }, [session]);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  const subjects = useMemo(() => [ALL, ...new Set((papers ?? []).map((p) => p.subject))].sort((a, b) => (a === ALL ? -1 : b === ALL ? 1 : a.localeCompare(b))), [papers]);
  const years = useMemo(() => [ALL, ...new Set((papers ?? []).map((p) => (p.year != null ? String(p.year) : 'Unknown')))].sort((a, b) => (a === ALL ? -1 : b === ALL ? 1 : b.localeCompare(a))), [papers]);
  const syllabuses = useMemo(() => [ALL, ...new Set((papers ?? []).map((p) => p.syllabus))].sort((a, b) => (a === ALL ? -1 : b === ALL ? 1 : a.localeCompare(b))), [papers]);

  const filtered = (papers ?? []).filter((p) => {
    if (subjectFilter !== ALL && p.subject !== subjectFilter) return false;
    if (yearFilter !== ALL && (p.year != null ? String(p.year) : 'Unknown') !== yearFilter) return false;
    if (syllabusFilter !== ALL && p.syllabus !== syllabusFilter) return false;
    return true;
  });

  return (
    <div className="papers-page">
      <div className="papers-top">
        <div>
          <div className="papers-title">Past Papers</div>
          <div className="papers-sub">Browse ingested past exam papers</div>
        </div>
      </div>

      {papers !== null && papers.length > 0 && (
        <div className="papers-filters">
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            {subjects.map((s) => <option key={s} value={s}>{s === ALL ? 'All subjects' : s}</option>)}
          </select>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
            {years.map((y) => <option key={y} value={y}>{y === ALL ? 'All years' : y}</option>)}
          </select>
          <select value={syllabusFilter} onChange={(e) => setSyllabusFilter(e.target.value)}>
            {syllabuses.map((s) => <option key={s} value={s}>{s === ALL ? 'All syllabuses' : s}</option>)}
          </select>
        </div>
      )}

      {loadError && <div className="task-empty">{loadError}</div>}
      {!loadError && papers === null && <div className="task-empty">Loading...</div>}
      {!loadError && papers !== null && papers.length === 0 && (
        <div className="task-empty">No past papers ingested yet.</div>
      )}
      {!loadError && papers !== null && papers.length > 0 && filtered.length === 0 && (
        <div className="task-empty">No papers match these filters.</div>
      )}
      {!loadError && filtered.length > 0 && (
        <div className="papers-grid">
          {filtered.map((paper) => (
            <Link key={paper.paper_id} to={`/app/papers/${paper.paper_id}`} className="paper-card">
              <div className="paper-card-subject">{paper.subject}</div>
              <div className="paper-card-meta">{paper.year ?? 'Unknown year'} · {paper.syllabus}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
