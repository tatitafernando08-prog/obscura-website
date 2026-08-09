import { useEffect, useReducer } from 'react';

const FOCUS_LEN = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

interface TimerState {
  secondsLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  sessionCount: number;
}

type TimerAction = { type: 'tick' } | { type: 'toggleRun' } | { type: 'skip' };

const initialState: TimerState = {
  secondsLeft: FOCUS_LEN,
  isRunning: false,
  isBreak: false,
  sessionCount: 0,
};

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
      return state.secondsLeft <= 0 ? advance(state) : { ...state, secondsLeft: state.secondsLeft - 1 };
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

  useEffect(() => {
    if (!state.isRunning) return;
    const id = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(id);
  }, [state.isRunning]);

  const label = state.isBreak
    ? (state.sessionCount % 4 === 0 ? 'Long Break' : 'Short Break')
    : 'Focus Session';

  return (
    <div className="focus-timer-card">
      <div className="focus-timer-label">{label}</div>
      <div className="focus-timer-clock">{formatTime(state.secondsLeft)}</div>
      <div className="focus-timer-controls">
        <button type="button" className="focus-btn primary" onClick={() => dispatch({ type: 'toggleRun' })}>
          {state.isRunning ? 'Pause' : 'Start'}
        </button>
        <button type="button" className="focus-btn secondary" onClick={() => dispatch({ type: 'skip' })}>
          Skip
        </button>
      </div>
    </div>
  );
}
