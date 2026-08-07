import type { MouseEvent } from 'react';
import { useReveal } from '../../hooks/useReveal';
import { useAuth } from '../../context/AuthContext';

const COMPARISON_ROWS: [string, string, string][] = [
  ['NESH AI Chat', 'Limited', '✓ Unlimited'],
  ['Past Papers', '5/month', '✓ Unlimited'],
  ['Pomodoro Timer', '✓', '✓'],
  ['Flashcards', '✓ Basic', '✓ Unlimited'],
  ['Study Planner', '✓', '✓'],
  ['AI Study Plan', '✗', '✓'],
  ['Analytics Dashboard', '✗', '✓'],
  ['RAG Smart Search', '✗', '✓'],
  ['Sinhala and Tamil support', '✓', '✓'],
  ['Priority Support', '✗', '✓'],
];

export function Plans() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const sub = useReveal<HTMLParagraphElement>();
  const grid = useReveal<HTMLDivElement>();
  const table = useReveal<HTMLDivElement>();
  const { openSignupModal } = useAuth();

  function handleSignup(e: MouseEvent) {
    e.preventDefault();
    openSignupModal();
  }

  return (
    <section className="unlock-section" id="unlock">
      <div ref={label.ref} className={`${label.className} section-label`}>Plans</div>
      <h2 ref={title.ref} className={`${title.className} section-title`}>Unlock more with Obscura</h2>
      <p ref={sub.ref} className={`${sub.className} section-sub`}>Choose what works for you, start free, upgrade when you're ready.</p>

      <div ref={grid.ref} className={`${grid.className} plans-grid`}>
        <div className="plan-card">
          <h3>Free Forever</h3>
          <p className="plan-desc">Essential tools to get started.</p>
          <div className="plan-price">Rs. 0 <span>/month</span></div>
          <ul className="plan-features">
            <li>✓ NESH AI Chat (limited)</li>
            <li>✓ 5 Past Papers per month</li>
            <li>✓ Pomodoro Timer</li>
            <li>✓ Basic Flashcards</li>
            <li className="no">✗ Unlimited Past Papers</li>
            <li className="no">✗ AI Study Plan</li>
            <li className="no">✗ Analytics Dashboard</li>
            <li className="no">✗ RAG Smart Search</li>
          </ul>
          <a href="#download" className="plan-btn outline" onClick={handleSignup}>Get Started</a>
        </div>
        <div className="plan-card featured">
          <div className="plan-badge">Most Popular</div>
          <h3>Obscura Pro</h3>
          <p className="plan-desc">Everything you need to ace exams.</p>
          <div className="plan-price">Rs. 990 <span>/month</span></div>
          <ul className="plan-features">
            <li>✓ Unlimited NESH AI Chat</li>
            <li>✓ Unlimited Past Papers</li>
            <li>✓ Pomodoro Timer</li>
            <li>✓ Unlimited Flashcards</li>
            <li>✓ AI Study Plan</li>
            <li>✓ Analytics Dashboard</li>
            <li>✓ RAG Smart Search</li>
            <li>✓ Priority Support</li>
          </ul>
          <a href="#download" className="plan-btn filled" onClick={handleSignup}>Get Started</a>
        </div>
      </div>

      <div ref={table.ref} className={`${table.className} comparison-table`}>
        <h3 className="comparison-title">Feature Comparison</h3>
        <table>
          <thead>
            <tr><th>Feature</th><th>Free</th><th>Pro</th></tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map(([feature, free, pro]) => (
              <tr key={feature}><td>{feature}</td><td>{free}</td><td>{pro}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
