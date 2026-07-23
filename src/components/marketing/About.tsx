import { Link } from 'react-router-dom';
import { useReveal } from '../../hooks/useReveal';

export function About() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const body1 = useReveal<HTMLParagraphElement>();
  const body2 = useReveal<HTMLParagraphElement>();
  const journeyBtn = useReveal<HTMLAnchorElement>();
  const image = useReveal<HTMLDivElement>();

  return (
    <section className="about" id="about">
      <div className="about-inner">
        <div className="about-text">
          <div ref={label.ref} className={label.className}>About</div>
          <h2 ref={title.ref} className={title.className}>Built for students.<br />Powered by AI.</h2>
          <p ref={body1.ref} className={`${body1.className} about-body`}>Obscura is a project built by a passionate team of Sri Lankan students who know exactly how stressful O/L and A/L exams can be. We built the tool we wish we had.</p>
          <p ref={body2.ref} className={`${body2.className} about-body`}>NESH is our AI tutor, trained on real past papers, available in English, Sinhala, and Tamil, and designed to feel like a brilliant friend who always has time for you.</p>
          <Link ref={journeyBtn.ref} to="/journey" className={`${journeyBtn.className} plan-btn outline about-journey-btn`}>See how we built this →</Link>
        </div>
        <div ref={image.ref} className={`${image.className} about-image`}>
          <img src="/assets/mascot_wave.png" alt="NESH waving" className="about-mascot" />
        </div>
      </div>
    </section>
  );
}
