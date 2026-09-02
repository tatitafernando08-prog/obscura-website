export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  question: string;
  medium: string;
  student_id: string;
  stream?: string;
  subject?: string;
  syllabus?: string;
  chat_history?: ChatHistoryMessage[];
}

export interface ChatSource {
  past_papers: {
    subject: string;
    year: string;
  };
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}
