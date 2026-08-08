import { useState } from 'react';
import type { JourneyMilestone } from '../../data/journeyMilestones';
import { useReveal } from '../../hooks/useReveal';

export function TimelineItem({ milestone }: { milestone: JourneyMilestone }) {
  const item = useReveal<HTMLDivElement>();
  const [index, setIndex] = useState(0);
  const total = milestone.images.length;

  function goTo(i: number) {
    setIndex(((i % total) + total) % total);
  }

  return (
    <div ref={item.ref} className={`${item.className} timeline-item`}>
      <div className="timeline-dot"></div>
      <div className="timeline-content">
        <span className="timeline-date">{milestone.date}</span>
        <h3>{milestone.title}</h3>
        <p>{milestone.description}</p>
        <div className={`timeline-gallery${total <= 1 ? ' single' : ''}`}>
          <div className="timeline-gallery-track" style={{ transform: `translateX(-${index * 100}%)` }}>
            {milestone.images.map((img) => (
              <img key={img.src} src={img.src} alt={img.alt} />
            ))}
          </div>
          {total > 1 && (
            <>
              <button className="gallery-arrow prev" type="button" aria-label="Previous" onClick={() => goTo(index - 1)}>‹</button>
              <button className="gallery-arrow next" type="button" aria-label="Next" onClick={() => goTo(index + 1)}>›</button>
              <div className="gallery-counter"><span className="gallery-current">{index + 1}</span> / <span className="gallery-total">{total}</span></div>
              <div className="gallery-dots">
                {milestone.images.map((img, i) => (
                  <div key={img.src} className={`gallery-dot${i === index ? ' active' : ''}`} onClick={() => goTo(i)}></div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
