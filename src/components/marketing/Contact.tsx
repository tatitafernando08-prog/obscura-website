import { useReveal } from '../../hooks/useReveal';

export function Contact() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const sub = useReveal<HTMLParagraphElement>();
  const links = useReveal<HTMLDivElement>();

  return (
    <section className="contact-section" id="contact">
      <div ref={label.ref} className={label.className}>Contact</div>
      <h2 ref={title.ref} className={title.className}>Get in touch.</h2>
      <p ref={sub.ref} className={`${sub.className} section-sub`}>Questions, feedback, or just want to say hi to the fox? We'd love to hear from you.</p>
      <div ref={links.ref} className={`${links.className} contact-links`}>
        <a href="mailto:obscurabytechlume@gmail.com" className="contact-link">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" stroke="currentColor" strokeWidth={1.8} />
            <path d="M3.5 6L12 13L20.5 6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          obscurabytechlume@gmail.com
        </a>
        <a href="https://www.instagram.com/obscura.edux/" target="_blank" rel="noreferrer" className="contact-link">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth={1.8} />
            <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth={1.8} />
            <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
          </svg>
          Instagram
        </a>
        <a href="https://x.com/Obscuraedux" target="_blank" rel="noreferrer" className="contact-link">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4L20 20M20 4L4 20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
          </svg>
          Twitter
        </a>
      </div>
    </section>
  );
}
