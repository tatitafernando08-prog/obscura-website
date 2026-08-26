import type { StudentProfile } from '../types/profile';

export const SUBJECTS: Record<string, string[]> = {
  OL: ['Mathematics', 'Science', 'English', 'Sinhala', 'History', 'Commerce', 'Geography', 'ICT'],
  science: ['Physics', 'Chemistry', 'Biology', 'Combined Mathematics'],
  commerce: ['Business Studies', 'Accounting', 'Economics'],
  arts: ['Political Science', 'Geography', 'History', 'Logic'],
  technology: ['Engineering Technology', 'Science for Technology', 'ICT'],
};

export function subjectsForProfile(profile: StudentProfile): string[] {
  if (profile.exam_type === 'OL') return SUBJECTS.OL;
  return (profile.stream && SUBJECTS[profile.stream]) || SUBJECTS.OL;
}
