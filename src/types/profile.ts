export type ThemeName = 'purple' | 'pink' | 'owl' | 'green';

export interface StudentProfile {
  id: string;
  exam_type: 'OL' | 'AL';
  syllabus: 'local' | 'edexcel' | 'cambridge';
  stream: 'science' | 'commerce' | 'arts' | 'technology' | null;
  medium: 'english' | 'sinhala' | 'tamil';
  name: string | null;
  theme: ThemeName;
}

export type NewStudentProfile = Omit<StudentProfile, 'name' | 'theme'>;
