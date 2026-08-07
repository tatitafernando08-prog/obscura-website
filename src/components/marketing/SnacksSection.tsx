import { useReveal } from '../../hooks/useReveal';

export function SnacksSection() {
  const label = useReveal<HTMLDivElement>();
  const quote = useReveal<HTMLParagraphElement>();
  const body = useReveal<HTMLParagraphElement>();
  const btns = useReveal<HTMLDivElement>();
  const small = useReveal<HTMLParagraphElement>();
  const image = useReveal<HTMLDivElement>();

  return (
    <section className="snacks-section" id="snacks">
      <div className="snacks-inner">
        <div className="snacks-text">
          <div ref={label.ref} className={label.className}>NESH Needs Fuel</div>
          <p ref={quote.ref} className={`${quote.className} snacks-quote`}>" Help me stay sharp and snappy! "</p>
          <p ref={body.ref} className={`${body.className} snacks-body`}><strong>This app will always be free to use.</strong> But if you'd like to support our mission, feel free to feed the fox. Any amount helps!</p>
          <div ref={btns.ref} className={`${btns.className} snacks-btns`}>
            <a href="#" onClick={(e) => e.preventDefault()} aria-disabled="true" title="Coming soon" className="snacks-btn coffee">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16 }}>
                <path d="M5 9h12v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
                <path d="M17 10.5h1.5a2.2 2.2 0 0 1 0 4.4H17" stroke="currentColor" strokeWidth={1.6} />
                <path d="M8.5 6c0-1 .8-1 .8-2M12 6c0-1 .8-1 .8-2" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
              </svg>
              Buy NESH a Coffee (coming soon)
            </a>
            <a href="#" onClick={(e) => e.preventDefault()} aria-disabled="true" title="Coming soon" className="snacks-btn paypal">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16 }}>
                <path d="M8 5.5h6.2c2.3 0 3.8 1.4 3.4 3.6-.5 2.7-2.4 4-4.9 4H10l-1 5.4" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
                <path d="M9.5 9.5H15c2.1 0 3.4 1.3 3 3.4-.4 2.4-2.2 3.6-4.5 3.6h-2.3l-.9 4.9" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" opacity={0.55} />
              </svg>
              PayPal (coming soon)
            </a>
          </div>
          <p ref={small.ref} className={`${small.className} snacks-small`}>Every contribution helps us keep improving and maintaining this free service for everyone.</p>
        </div>
        <div ref={image.ref} className={`${image.className} snacks-image`}>
          <img src="/assets/mascot_sad.png" alt="NESH needs fuel" className="snacks-mascot-big" />
        </div>
      </div>
    </section>
  );
}
