export interface ExtractedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  totalExtracted: number;
  hasAnswerCount: number;
  needsReviewCount: number;
  duplicateCount: number;
  status: 'completed' | 'processing' | 'failed';
  questions: (Question & { isDuplicate?: boolean; matchedText?: string })[];
}

export type DifficultyLevel = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng';

export type QuestionStatus = 'approved' | 'needs_review';

export interface AIExplanation {
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  whyCorrect: string;
  whyOthersWrong: {
    [key in 'A' | 'B' | 'C' | 'D']?: string;
  };
  keyTakeaway: string;
  exampleSnippet?: string;
  textbookReference?: string;
  isVerifiedSGK: boolean;
  warningNote?: string;
}

export interface Question {
  id: string;
  questionNumber?: number;
  text: string;
  codeSnippet?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer?: 'A' | 'B' | 'C' | 'D' | '';
  topic: string;
  lessonName?: string;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  explanation?: AIExplanation;
  tags?: string[];
  createdAt: string;
  sourceFile?: string;
}

export interface TextbookTopic {
  id: string;
  curriculum: 'Kết nối tri thức' | 'Cánh diều' | 'Chân trời sáng tạo';
  chapter: string;
  lessonNumber: number;
  lessonTitle: string;
  summary: string;
  keyPoints: string[];
}

export interface StudentAttempt {
  id: string;
  studentName: string;
  className: string;
  quizMode: 'topic' | 'random' | 'exam' | 'retry_wrong';
  topicFilter?: string;
  startedAt: string;
  completedAt: string;
  timeSpentSeconds: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  scoreScale10: number;
  questionResults: {
    questionId: string;
    selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
    correctAnswer: 'A' | 'B' | 'C' | 'D' | '';
    isCorrect: boolean;
    topic: string;
  }[];
  aiFeedbackSummary?: string;
}

export interface TeacherStats {
  totalStudents: number;
  totalAttempts: number;
  averageScore: number;
  averageAccuracyRate: number;
  classStats: {
    className: string;
    studentCount: number;
    attemptCount: number;
    averageScore: number;
  }[];
  mostMissedQuestions: {
    questionId: string;
    text: string;
    topic: string;
    wrongAttemptsCount: number;
    totalAttemptsCount: number;
    wrongRate: number;
  }[];
  topicDifficultyStats: {
    topic: string;
    totalAttempted: number;
    wrongCount: number;
    accuracyRate: number;
  }[];
  timeSeriesTrends: {
    date: string;
    displayDate: string;
    attempts: number;
    averageScore: number;
    accuracyRate: number;
    passCount: number;
  }[];
  topicHeatmap: {
    topic: string;
    totalAttempts: number;
    errorRate: number;
    byDifficulty: {
      'Nhận biết': { total: number; wrong: number; errorRate: number };
      'Thông hiểu': { total: number; wrong: number; errorRate: number };
      'Vận dụng': { total: number; wrong: number; errorRate: number };
    };
    byClass: Record<string, { total: number; wrong: number; errorRate: number }>;
  }[];
  studentLeaderboard: {
    studentName: string;
    className: string;
    attemptsCount: number;
    averageScore: number;
    lastAttemptDate: string;
    weakestTopic: string;
    strongestTopic: string;
  }[];
}

