export type PaperStatus = 'processing' | 'ready' | 'failed';

export interface PastPaper {
  paper_id: string;
  subject: string;
  year: number | null;
  syllabus: string;
  level: string;
  medium: string;
  status: PaperStatus;
}

export interface PastPaperDetail {
  paper_id: string;
  subject: string;
  year: number | null;
  status: PaperStatus;
  chunk_count: string;
}
