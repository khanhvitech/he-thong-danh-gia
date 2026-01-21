export type QuestionType = 
  | 'rating-5' 
  | 'rating-10' 
  | 'text' 
  | 'single-choice' 
  | 'multiple-choice' 
  | 'slider' 
  | 'yes-no'
  | 'ranking';

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  description?: string;
  required: boolean;
  minChars?: number;
  options?: string[];
}

export interface SubjectInTemplate {
  id: string;
  name: string;
  email?: string;
  position?: string;
  department?: string;
}

export interface SubjectQuestions {
  subjectId: string;
  questions: Question[];
}

export interface QuestionTemplate {
  id: string;
  name: string;
  description: string;
  roles: string[];
  questions: Question[]; // Câu hỏi chung
  subjects?: SubjectInTemplate[]; // Danh sách người cần đánh giá
  subjectQuestions?: SubjectQuestions[]; // Câu hỏi riêng cho từng người
  templateQuestions?: Question[]; // Câu hỏi mẫu với biến {name}
  isActive?: boolean; // Trạng thái bật/tắt đánh giá
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  templateId: string;
}

export interface EvaluationSession {
  id: string;
  name: string;
  description: string;
  evaluatorEmail: string;
  evaluatorName: string;
  deadline: string;
  subjects: Subject[];
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  link?: string;
  token?: string;
}

export interface Answer {
  questionId: string;
  value: string | number | string[];
}

export interface SubjectEvaluation {
  subjectId: string;
  answers: Answer[];
  completedAt?: string;
}

export interface EvaluationResponse {
  sessionId: string;
  evaluations: SubjectEvaluation[];
  submittedAt?: string;
  isDraft: boolean;
}

export interface EvaluationResult {
  session: EvaluationSession;
  response: EvaluationResponse;
  averageScore: number;
  completionRate: number;
}

// Type aliases for backward compatibility
export type Session = EvaluationSession;
export type Template = QuestionTemplate;
