import { useReveal } from '../../hooks/useReveal';

const CHIPS = [
  'Answers from past papers',
  'English, Sinhala and Tamil',
  'O/L and A/L focused',
  'Remembers your conversation',
  'Instant responses',
];

function NeshChip({ text }: { text: string }) {
  const chip = useReveal<HTMLSpanElement>();
  return <span ref={chip.ref} className={`${chip.className} nesh-chip`}>{text}</span>;
}

export function NeshSection() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const body = useReveal<HTMLParagraphElement>();
  const screenshot = useReveal<HTMLDivElement>();

  return (
    <section className="nesh-section" id="nesh">
      <div className="nesh-inner">
        <div className="nesh-text">
          <div ref={label.ref} className={`${label.className} section-label`}>NESH AI</div>
          <h2 ref={title.ref} className={`${title.className} section-title`}>Your personal AI tutor.<br />Available 24/7.</h2>
          <p ref={body.ref} className={`${body.className} about-body`}>NESH is trained on real past papers, so every answer is grounded, accurate, and built for your syllabus. Ask in English, Sinhala, or Tamil.</p>
          <div className="nesh-chips-vertical">
            {CHIPS.map((chip) => <NeshChip key={chip} text={chip} />)}
          </div>
        </div>
        <div ref={screenshot.ref} className={`${screenshot.className} nesh-screenshot`}>
          <div className="phone-mockup">
            <div className="phone-screen">
              <div className="chat-header-mock">
                <div className="chat-avatar-mock" style={{ overflow: 'hidden', padding: 0 }}>
                  <img src="/assets/mascot_study.png" alt="NESH" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                </div>
                <div>
                  <div className="chat-name">NESH AI</div>
                  <div className="chat-status">● Online</div>
                </div>
              </div>
              <div className="chat-messages">
                <div className="chat-bubble user-bubble">Explain the law of demand</div>
                <div className="chat-bubble nesh-bubble">The law of demand states that as price increases, quantity demanded decreases — all else equal. Your 2022 Economics paper covers this in Section B!</div>
                <div className="chat-bubble user-bubble">Give me a practice question</div>
                <div className="chat-bubble nesh-bubble">Sure! "Explain using a diagram how a rise in price affects consumer demand for rice in Sri Lanka." (4 marks)</div>
              </div>
              <div className="chat-input-mock">
                <div className="chat-input-field">Ask NESH anything...</div>
                <div className="chat-send-btn">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16 }}>
                    <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
