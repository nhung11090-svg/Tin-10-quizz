import { Question, TextbookTopic, StudentAttempt, TeacherStats, AIExplanation } from '../types/quiz.js';

export async function fetchQuestions(params?: { status?: string; topic?: string; search?: string }): Promise<Question[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.topic) query.set('topic', params.topic);
  if (params?.search) query.set('search', params.search);

  const res = await fetch(`/api/questions?${query.toString()}`);
  if (!res.ok) throw new Error('Không thể tải ngân hàng câu hỏi');
  const data = await res.json();
  return data.questions || [];
}

export async function saveQuestion(question: Partial<Question>): Promise<Question> {
  const isUpdate = !!question.id && !question.id.startsWith('new-');
  const url = isUpdate ? `/api/questions/${question.id}` : '/api/questions';
  const method = isUpdate ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(question)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Lỗi lưu câu hỏi');
  }
  const data = await res.json();
  return data.question;
}

export async function deleteQuestion(id: string): Promise<void> {
  const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Không thể xóa câu hỏi');
}

export async function batchApproveQuestions(questionIds?: string[]): Promise<number> {
  const res = await fetch('/api/questions/batch-approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionIds })
  });
  if (!res.ok) throw new Error('Lỗi duyệt câu hỏi');
  const data = await res.json();
  return data.count || 0;
}

export async function batchDeleteQuestions(questionIds: string[]): Promise<number> {
  const res = await fetch('/api/questions/batch-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionIds })
  });
  if (!res.ok) throw new Error('Lỗi xóa câu hỏi');
  const data = await res.json();
  return data.count || 0;
}

export async function parseDocument(file?: File, text?: string): Promise<{
  questions: (Question & { isDuplicate?: boolean; matchedText?: string })[];
  summary: {
    totalExtracted: number;
    hasAnswerCount: number;
    needsReviewCount: number;
    duplicateCount: number;
    sourceFile: string;
  };
  notice?: string;
  mode?: string;
}> {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (text) {
    formData.append('text', text);
  }

  const res = await fetch('/api/parse-document', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi trích xuất tài liệu từ AI');
  }

  return await res.json();
}

export async function commitImport(questions: Question[]): Promise<number> {
  const res = await fetch('/api/questions/commit-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions })
  });
  if (!res.ok) throw new Error('Không thể lưu câu hỏi vào cơ sở dữ liệu');
  const data = await res.json();
  return data.count;
}

export async function matchAnswers(file?: File, text?: string): Promise<Record<string, 'A' | 'B' | 'C' | 'D'>> {
  const formData = new FormData();
  if (file) formData.append('file', file);
  if (text) formData.append('text', text);

  const res = await fetch('/api/match-answers', {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi đọc bảng đáp án');
  }
  const data = await res.json();
  return data.answers || {};
}

export async function generateAIExplanation(payload: {
  questionText: string;
  codeSnippet?: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  topic: string;
  lessonName?: string;
}): Promise<AIExplanation> {
  const res = await fetch('/api/ai/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi tạo giải thích AI');
  }
  const data = await res.json();
  return data.explanation;
}

export async function fetchTextbooks(): Promise<TextbookTopic[]> {
  const res = await fetch('/api/textbooks');
  if (!res.ok) throw new Error('Không thể tải kho kiến thức SGK');
  const data = await res.json();
  return data.textbooks || [];
}

export async function saveTextbookTopic(topic: Partial<TextbookTopic>): Promise<TextbookTopic> {
  const res = await fetch('/api/textbooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(topic)
  });
  if (!res.ok) throw new Error('Không thể lưu bài học SGK');
  const data = await res.json();
  return data.topic;
}

export async function deleteTextbookTopic(id: string): Promise<void> {
  const res = await fetch(`/api/textbooks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Không thể xóa bài học SGK');
}

export async function uploadReferenceDocument(file?: File, text?: string, curriculum?: string): Promise<TextbookTopic> {
  const formData = new FormData();
  if (file) formData.append('file', file);
  if (text) formData.append('text', text);
  if (curriculum) formData.append('curriculum', curriculum);

  const res = await fetch('/api/textbooks/upload-reference', {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi tải lên tài liệu tham chiếu');
  }
  const data = await res.json();
  return data.topic;
}

export async function fetchExtractedDocs(): Promise<any[]> {
  const res = await fetch('/api/extracted-docs');
  if (!res.ok) throw new Error('Không thể tải lịch sử tài liệu trích xuất');
  const data = await res.json();
  return data.documents || [];
}

export async function deleteExtractedDoc(id: string): Promise<void> {
  const res = await fetch(`/api/extracted-docs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Không thể xóa tài liệu khỏi lịch sử');
}

export async function fetchStudentQuizQuestions(params: {
  topic?: string;
  mode: 'topic' | 'random' | 'exam' | 'retry_wrong';
  count?: number;
  ids?: string[];
}): Promise<Question[]> {
  const query = new URLSearchParams();
  if (params.topic) query.set('topic', params.topic);
  query.set('mode', params.mode);
  if (params.count) query.set('count', params.count.toString());
  if (params.ids && params.ids.length > 0) query.set('ids', params.ids.join(','));

  const res = await fetch(`/api/student/quizzes?${query.toString()}`);
  if (!res.ok) throw new Error('Không thể tải bộ câu hỏi luyện tập');
  const data = await res.json();
  return data.questions || [];
}

export async function submitStudentQuiz(attempt: Partial<StudentAttempt>): Promise<StudentAttempt> {
  const res = await fetch('/api/student/submit-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(attempt)
  });
  if (!res.ok) throw new Error('Lỗi gửi kết quả bài làm');
  const data = await res.json();
  return data.attempt;
}

export async function fetchStudentHistory(studentName?: string, className?: string): Promise<{
  attempts: StudentAttempt[];
  wrongQuestionIds: string[];
}> {
  const query = new URLSearchParams();
  if (studentName) query.set('studentName', studentName);
  if (className) query.set('className', className);

  const res = await fetch(`/api/student/history?${query.toString()}`);
  if (!res.ok) throw new Error('Không thể tải lịch sử học sinh');
  return await res.json();
}

export async function fetchTeacherAnalytics(): Promise<{
  stats: TeacherStats;
  recentAttempts: StudentAttempt[];
}> {
  const res = await fetch('/api/teacher/analytics');
  if (!res.ok) throw new Error('Không thể tải thống kê giáo viên');
  return await res.json();
}

export async function verifyTeacherPin(pin: string): Promise<boolean> {
  const res = await fetch('/api/auth/teacher-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin })
  });
  return res.ok;
}
