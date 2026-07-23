import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollToHash(): void {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth' });
  }, [location.hash]);
}
