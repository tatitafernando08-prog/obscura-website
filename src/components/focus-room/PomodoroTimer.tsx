import { useEffect, useReducer, useRef, useState } from 'react';

const FOCUS_LEN = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

interface TimerState {
  secondsLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  sessionCount: number;
  completedAt: number;
}

type TimerAction = { type: 'tick' } | { type: 'toggleRun' } | { type: 'skip' };

const initialState: TimerState = {
  secondsLeft: FOCUS_LEN,
  isRunning: false,
  isBreak: false,
  sessionCount: 0,
  completedAt: 0,
};

function playChime(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Web Audio unsupported or blocked — silently skip the chime.
  }
}

function notify(title: string, body: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body });
  } catch {
    // Notification construction can fail (e.g. unsupported context) — non-critical.
  }
}

function advance(state: TimerState): TimerState {
  if (!state.isBreak) {
    const sessionCount = state.sessionCount + 1;
    return {
      ...state,
      isBreak: true,
      sessionCount,
      secondsLeft: sessionCount % 4 === 0 ? LONG_BREAK : SHORT_BREAK,
    };
  }
  return { ...state, isBreak: false, secondsLeft: FOCUS_LEN };
}

function reducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'tick':
      return state.secondsLeft <= 0
        ? { ...advance(state), isRunning: false, completedAt: state.completedAt + 1 }
        : { ...state, secondsLeft: state.secondsLeft - 1 };
    case 'toggleRun':
      return { ...state, isRunning: !state.isRunning };
    case 'skip':
      return advance(state);
    default:
      return state;
  }
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function PomodoroTimer() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const lastCompletedAt = useRef(state.completedAt);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!state.isRunning || showSkipConfirm) return;
    const id = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(id);
  }, [state.isRunning, showSkipConfirm]);

  useEffect(() => {
    if (state.completedAt === lastCompletedAt.current) return;
    lastCompletedAt.current = state.completedAt;
    playChime(audioCtxRef.current);
    notify(
      state.isBreak ? 'Focus session complete' : 'Break’s over',
      state.isBreak ? 'Time for a break.' : 'Back to focus when you’re ready.'
    );
  }, [state.completedAt, state.isBreak]);

  const label = state.isBreak
    ? (state.sessionCount % 4 === 0 ? 'Long Break' : 'Short Break')
    : 'Focus Session';

  function handleToggleRun() {
    if (!state.isRunning) {
      if (!audioCtxRef.current) {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        try {
          audioCtxRef.current = new Ctx();
        } catch {
          // Web Audio unsupported — chime will be skipped later.
        }
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
    dispatch({ type: 'toggleRun' });
  }

  function confirmSkip() {
    dispatch({ type: 'skip' });
    setShowSkipConfirm(false);
  }

  return (
    <div className="focus-timer-card">
      <div className="focus-timer-label">{label}</div>
      <div className="focus-timer-clock">{formatTime(state.secondsLeft)}</div>
      <div className="focus-timer-controls">
        <button type="button" className="focus-btn primary" onClick={handleToggleRun}>
          {state.isRunning ? 'Pause' : 'Start'}
        </button>
        <button type="button" className="focus-btn secondary" onClick={() => setShowSkipConfirm(true)}>
          Skip
        </button>
      </div>

      {showSkipConfirm && (
        <div
          className="skip-confirm-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSkipConfirm(false); }}
        >
          <div className="skip-confirm-card">
            <p>Skip this {state.isBreak ? 'break' : 'focus session'}?</p>
            <div className="skip-confirm-actions">
              <button type="button" className="focus-btn secondary" onClick={() => setShowSkipConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="focus-btn primary" onClick={confirmSkip}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
