import { useScrollToHash } from '../hooks/useScrollToHash';
import { Hero } from '../components/marketing/Hero';
import { About } from '../components/marketing/About';
import { Features } from '../components/marketing/Features';
import { Plans } from '../components/marketing/Plans';
import { NeshSection } from '../components/marketing/NeshSection';
import { PomodoroTryout } from '../components/marketing/PomodoroTryout';
import { RobotSection } from '../components/marketing/RobotSection';
import { SnacksSection } from '../components/marketing/SnacksSection';
import { Testimonials } from '../components/marketing/Testimonials';
import { Contact } from '../components/marketing/Contact';

export function HomePage() {
  useScrollToHash();

  return (
    <>
      <Hero />
      <About />
      <Features />
      <Plans />
      <NeshSection />
      <PomodoroTryout />
      <RobotSection />
      <SnacksSection />
      <Testimonials />
      <Contact />
    </>
  );
}
