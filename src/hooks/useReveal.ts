import { useEffect, useRef, useState, type RefObject } from 'react';

export function useReveal<T extends HTMLElement>(extraClassName = ''): { ref: RefObject<T>; className: string } {
  const ref = useRef<T>(null!);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const className = ['reveal', visible ? 'visible' : '', extraClassName].filter(Boolean).join(' ');
  return { ref, className };
}
