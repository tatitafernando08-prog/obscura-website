import { useEffect, useState } from 'react';

const QUOTES = [
  { text: "It always seems impossible until it's done.", author: 'Nelson Mandela' },
  { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
  { text: "Believe you can and you're halfway there.", author: 'Theodore Roosevelt' },
  { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
  { text: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
  { text: 'The future depends on what you do today.', author: 'Mahatma Gandhi' },
  { text: 'You are never too old to set another goal.', author: 'C.S. Lewis' },
  { text: 'Success is the sum of small efforts repeated.', author: 'Robert Collier' },
];

export function QuoteRotator() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % QUOTES.length);
        setVisible(true);
      }, 400);
    }, 20000);
    return () => clearInterval(id);
  }, []);

  const quote = QUOTES[index];

  return (
    <div className="focus-quote-wrap" style={{ opacity: visible ? 1 : 0 }}>
      <p className="focus-quote-text">&quot;{quote.text}&quot;</p>
      <p className="focus-quote-author">— {quote.author}</p>
    </div>
  );
}
