import { useRef } from 'react';
import { JOURNEY_MILESTONES } from '../data/journeyMilestones';
import { TimelineItem } from '../components/journey/TimelineItem';
import { TimelineProgressLine } from '../components/journey/TimelineProgressLine';
import { useReveal } from '../hooks/useReveal';

export function JourneyPage() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const sub = useReveal<HTMLParagraphElement>();
  const timelineRef = useRef<HTMLDivElement>(null!);

  return (
    <>
      <section className="journey-hero">
        <div ref={label.ref} className={label.className}>Our Journey</div>
        <h1 ref={title.ref} className={title.className}>Behind the scenes of Obscura</h1>
        <p ref={sub.ref} className={`${sub.className} section-sub`}>From a rough idea to a working AI study companion, here's the real, unfiltered story of how we built this, mistakes, late nights, and all.</p>
      </section>

      <section className="timeline-section">
        <div className="timeline" ref={timelineRef}>
          <TimelineProgressLine containerRef={timelineRef} />
          {JOURNEY_MILESTONES.map((milestone) => (
            <TimelineItem key={milestone.title} milestone={milestone} />
          ))}
        </div>
      </section>
    </>
  );
}
