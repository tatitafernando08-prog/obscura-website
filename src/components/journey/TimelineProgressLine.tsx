import { useEffect, useState, type RefObject } from 'react';

export function TimelineProgressLine({ containerRef }: { containerRef: RefObject<HTMLDivElement> }) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    function update() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportCenter = window.innerHeight * 0.5;
      const scrolledPast = viewportCenter - rect.top;
      const next = Math.max(0, Math.min(1, scrolledPast / rect.height));
      setPercent(next);
    }
    window.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [containerRef]);

  return (
    <>
      <div className="timeline-line-bg"></div>
      <div className="timeline-line-fill" style={{ height: `${percent * 100}%` }}></div>
    </>
  );
}
