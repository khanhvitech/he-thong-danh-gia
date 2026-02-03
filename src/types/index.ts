export type QuestionType = 
  | 'rating-5' 
  | 'rating-10' 
  | 'text' 
  | 'single-choice' 
  | 'multiple-choice' 
  | 'slider' 
  | 'yes-no'
  | 'yesno'
  | 'rating'
  | 'scale'
  | 'ranking'
  | 'person-select'; // Chọn người từ danh sách

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  description?: string;
  required: boolean;
  minChars?: number;
  options?: string[];
  allowOther?: boolean; // Cho phép điền "Khác"
  // Các trường cho loại person-select
  personList?: string[]; // Danh sách người để chọn (dùng khi personSource='manual')
  minPersons?: number; // Số người tối thiểu phải chọn
  maxPersons?: number; // Số người tối đa được chọn (không giới hạn nếu không set)
  personSource?: 'manual' | 'subjects' | 'departments' | 'all-employees'; // Nguồn danh sách người
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
  slug?: string;
  type?: 'bld' | 'nhan-vien' | 'chung' | 'other'; // Loại template
  description: string;
  roles: string[];
  questions: Question[]; // Câu hỏi chung
  subjects?: SubjectInTemplate[]; // Danh sách người cần đánh giá
  subjectQuestions?: SubjectQuestions[]; // Câu hỏi riêng cho từng người
  templateQuestions?: Question[]; // Câu hỏi mẫu với biến {name}
  selectionQuestion?: string; // Câu hỏi chọn người (tùy chỉnh cho mỗi template)
  minSelections?: number; // Số người tối thiểu phải chọn
  isActive?: boolean; // Trạng thái bật/tắt đánh giá
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // Người tạo bộ câu hỏi
  lastModifiedBy?: string; // Người chỉnh sửa lần cuối
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
