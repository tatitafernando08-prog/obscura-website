import { useRef, useState } from 'react';
import { useReveal } from '../../hooks/useReveal';

type BlockType = 'focus' | 'break';
interface ScheduleBlock {
  type: BlockType;
  label: string;
  minutes: number;
}

const HOUR_OPTIONS = [1, 2, 3, 4, 6];
const FOCUS_LENGTH = 25;
const SHORT_BREAK = 5;
const LONG_BREAK = 15;

function buildSchedule(hours: number): ScheduleBlock[] {
  const totalMinutes = hours * 60;
  const schedule: ScheduleBlock[] = [];
  let usedMinutes = 0;
  let sessionCount = 0;

  while (usedMinutes + FOCUS_LENGTH <= totalMinutes) {
    sessionCount++;
    schedule.push({ type: 'focus', label: `Focus Session ${sessionCount}`, minutes: FOCUS_LENGTH });
    usedMinutes += FOCUS_LENGTH;

    if (usedMinutes + 5 > totalMinutes) break;

    const isLongBreak = sessionCount % 4 === 0;
    const breakLength = isLongBreak ? LONG_BREAK : SHORT_BREAK;

    if (usedMinutes + breakLength <= totalMinutes) {
      schedule.push({ type: 'break', label: isLongBreak ? 'Long Break' : 'Short Break', minutes: breakLength });
      usedMinutes += breakLength;
    }
  }

  return schedule;
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60).toString().padStart(2, '0');
  const secs = (safe % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export function PomodoroTryout() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const sub = useReveal<HTMLParagraphElement>();
  const box = useReveal<HTMLDivElement>();

  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [timerVisible, setTimerVisible] = useState(false);
  const [displaySchedule, setDisplaySchedule] = useState<ScheduleBlock[]>([]);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [displayBlockIndex, setDisplayBlockIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [done, setDone] = useState(false);

  const scheduleRef = useRef<ScheduleBlock[]>([]);
  const secondsRef = useRef(0);
  const blockIndexRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  function clearTimer() {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function startBlock(index: number) {
    clearTimer();
    const blocks = scheduleRef.current;
    if (index >= blocks.length) {
      setDone(true);
      setDisplaySeconds(0);
      return;
    }
    setDone(false);
    blockIndexRef.current = index;
    setDisplayBlockIndex(index);
    secondsRef.current = blocks[index].minutes * 60;
    setDisplaySeconds(secondsRef.current);
    intervalRef.current = window.setInterval(() => {
      secondsRef.current -= 1;
      if (secondsRef.current < 0) {
        startBlock(blockIndexRef.current + 1);
        return;
      }
      setDisplaySeconds(secondsRef.current);
    }, 1000);
  }

  function handleGeneratePlan() {
    if (!selectedHours) {
      alert('Please select how many hours you are studying today!');
      return;
    }
    const blocks = buildSchedule(selectedHours);
    scheduleRef.current = blocks;
    setDisplaySchedule(blocks);
    setStarted(true);
  }

  function handleStartTimer() {
    setTimerVisible(true);
    startBlock(0);
  }

  function handlePause() {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) clearTimer(); else startBlock(blockIndexRef.current);
      return next;
    });
  }

  function handleSkip() {
    startBlock(blockIndexRef.current + 1);
  }

  function handleReset() {
    clearTimer();
    setSelectedHours(null);
    setStarted(false);
    setTimerVisible(false);
    setDisplaySchedule([]);
    setDisplaySeconds(0);
    setDisplayBlockIndex(0);
    setIsPaused(false);
    setDone(false);
    scheduleRef.current = [];
    secondsRef.current = 0;
    blockIndexRef.current = 0;
  }

  const focusSessionCount = displaySchedule.filter((b) => b.type === 'focus').length;
  const currentLabel = done ? 'All done!' : displaySchedule[displayBlockIndex]?.label ?? '';

  return (
    <section className="pomodoro-section" id="pomodoro">
      <div ref={label.ref} className={label.className}>Try It Free</div>
      <h2 ref={title.ref} className={title.className}>Plan today's study session</h2>
      <p ref={sub.ref} className={sub.className}>Tell us how many hours you've got, we'll build you a focused Pomodoro schedule instantly.</p>

      <div ref={box.ref} className={`${box.className} pomodoro-box`}>
        {!started ? (
          <div className="pomodoro-input-row">
            <label htmlFor="studyHours">How many hours are you studying today?</label>
            <div className="hour-options">
              {HOUR_OPTIONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`hour-btn${selectedHours === h ? ' selected' : ''}`}
                  onClick={() => setSelectedHours(h)}
                >
                  {h} hr{h > 1 ? 's' : ''}
                </button>
              ))}
            </div>
            <button type="button" className="btn-primary" style={{ marginTop: 24 }} onClick={handleGeneratePlan}>
              Generate My Plan
            </button>
          </div>
        ) : (
          <div className="pomodoro-result">
            <div className="plan-summary">
              {focusSessionCount} focus sessions planned for your {selectedHours} hour{selectedHours && selectedHours > 1 ? 's' : ''} of study
            </div>
            <div className="plan-schedule">
              {displaySchedule.map((block, i) => (
                <div key={i} className={`schedule-block ${block.type}`}>
                  <span>{block.label}</span>
                  <span>{block.minutes} min</span>
                </div>
              ))}
            </div>

            {timerVisible && (
              <div className="timer-display">
                <div className="timer-label">{currentLabel}</div>
                <div className="timer-clock">{done ? '00:00' : formatClock(displaySeconds)}</div>
                <div className="timer-controls">
                  <button type="button" className="timer-btn" onClick={handlePause}>{isPaused ? 'Resume' : 'Pause'}</button>
                  <button type="button" className="timer-btn skip" onClick={handleSkip}>Skip</button>
                </div>
              </div>
            )}

            {!timerVisible && (
              <button type="button" className="btn-primary" style={{ marginTop: 20 }} onClick={handleStartTimer}>
                Start First Session
              </button>
            )}
            <button type="button" className="plan-reset" onClick={handleReset}>Start Over</button>
          </div>
        )}
      </div>
    </section>
  );
}
