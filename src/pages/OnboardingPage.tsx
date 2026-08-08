import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import type { StudentProfile } from '../types/profile';

type ExamType = 'OL' | 'AL';
type Syllabus = 'local' | 'edexcel' | 'cambridge';
type Stream = 'science' | 'commerce' | 'arts' | 'technology';
type Medium = 'english' | 'sinhala' | 'tamil';

interface Answers {
  exam_type: ExamType | null;
  syllabus: Syllabus | null;
  stream: Stream | null;
  medium: Medium | null;
}

function getStepOrder(examType: ExamType | null): number[] {
  return examType === 'OL' ? [1, 2, 4] : [1, 2, 3, 4];
}

export function OnboardingPage() {
  const { session, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Answers>({ exam_type: null, syllabus: null, stream: null, medium: null });
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const order = getStepOrder(answers.exam_type);
  const currentIndex = order.indexOf(currentStep);

  function select<K extends keyof Answers>(field: K, value: Answers[K]) {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  }

  function goNext() {
    const idx = order.indexOf(currentStep);
    setCurrentStep(order[idx + 1]);
  }

  function goBack() {
    const idx = order.indexOf(currentStep);
    if (idx > 0) setCurrentStep(order[idx - 1]);
  }

  async function handleFinish(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setError('');
    try {
      const payload: StudentProfile = {
        id: session.user.id,
        exam_type: answers.exam_type as ExamType,
        syllabus: answers.syllabus as Syllabus,
        stream: answers.exam_type === 'OL' ? null : (answers.stream as Stream),
        medium: answers.medium as Medium,
      };
      const { error: insertError } = await supabase.from('student_profiles').insert(payload);
      if (insertError) throw new Error(insertError.message);
      await refreshProfile();
      navigate('/app/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong saving your profile.');
      setSaving(false);
    }
  }

  const dotDone = (dotIndex: number) => dotIndex < currentIndex + 1 || (currentStep === order[order.length - 1] && dotIndex === 3);

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-logo">
          <img src="/assets/logo.png" alt="Obscura logo" />
          OBSCURA
        </div>

        <div className="onboarding-steps">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={dotDone(i) ? 'done' : ''}></span>
          ))}
        </div>

        {error && <div className="onboarding-error visible">{error}</div>}

        {currentStep === 1 && (
          <div className="onboarding-step active">
            <h2>Which exam are you preparing for?</h2>
            <p className="sub">This helps NESH tailor everything to your syllabus.</p>
            <div className="option-grid">
              {(['OL', 'AL'] as ExamType[]).map((value) => (
                <div
                  key={value}
                  className={`option-card${answers.exam_type === value ? ' selected' : ''}`}
                  onClick={() => select('exam_type', value)}
                >
                  {value === 'OL' ? 'O/L' : 'A/L'}
                </div>
              ))}
            </div>
            <div className="onboarding-nav">
              <button className="onboarding-back" disabled>Back</button>
              <button className="btn-primary onboarding-continue" disabled={!answers.exam_type} onClick={goNext}>Continue</button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="onboarding-step active">
            <h2>Which syllabus do you follow?</h2>
            <p className="sub">So NESH pulls answers from the right past papers.</p>
            <div className="option-grid">
              {([['local', 'Local'], ['edexcel', 'Edexcel'], ['cambridge', 'Cambridge']] as [Syllabus, string][]).map(([value, text]) => (
                <div
                  key={value}
                  className={`option-card${answers.syllabus === value ? ' selected' : ''}`}
                  onClick={() => select('syllabus', value)}
                >
                  {text}
                </div>
              ))}
            </div>
            <div className="onboarding-nav">
              <button className="onboarding-back visible" onClick={goBack}>Back</button>
              <button className="btn-primary onboarding-continue" disabled={!answers.syllabus} onClick={goNext}>Continue</button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="onboarding-step active">
            <h2>What's your stream?</h2>
            <p className="sub">Pick the A/L stream you're studying.</p>
            <div className="option-grid">
              {([['science', 'Science'], ['commerce', 'Commerce'], ['arts', 'Arts'], ['technology', 'Technology']] as [Stream, string][]).map(([value, text]) => (
                <div
                  key={value}
                  className={`option-card${answers.stream === value ? ' selected' : ''}`}
                  onClick={() => select('stream', value)}
                >
                  {text}
                </div>
              ))}
            </div>
            <div className="onboarding-nav">
              <button className="onboarding-back visible" onClick={goBack}>Back</button>
              <button className="btn-primary onboarding-continue" disabled={!answers.stream} onClick={goNext}>Continue</button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <form className="onboarding-step active" onSubmit={handleFinish}>
            <h2>What's your preferred medium?</h2>
            <p className="sub">NESH can explain things in whichever language is easiest for you.</p>
            <div className="option-grid">
              {([['english', 'English'], ['sinhala', 'Sinhala'], ['tamil', 'Tamil']] as [Medium, string][]).map(([value, text]) => (
                <div
                  key={value}
                  className={`option-card${answers.medium === value ? ' selected' : ''}`}
                  onClick={() => select('medium', value)}
                >
                  {text}
                </div>
              ))}
            </div>
            <div className="onboarding-nav">
              <button type="button" className="onboarding-back visible" onClick={goBack}>Back</button>
              <button type="submit" className="btn-primary onboarding-continue" disabled={!answers.medium || saving}>
                {saving ? 'Saving...' : 'Finish'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
