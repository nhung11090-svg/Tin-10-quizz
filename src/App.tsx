/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, AppNavView } from './components/Navbar.js';
import { StudentHome } from './components/StudentHome.js';
import { QuizRunner } from './components/QuizRunner.js';
import { QuizResultView } from './components/QuizResultView.js';
import { TeacherAdmin } from './components/TeacherAdmin.js';
import { DocumentImportSection } from './components/DocumentImportSection.js';
import { TextbookReferenceSection } from './components/TextbookReferenceSection.js';
import { Question, StudentAttempt } from './types/quiz.js';
import { fetchStudentQuizQuestions, submitStudentQuiz } from './services/api.js';

export default function App() {
  const [currentView, setCurrentView] = useState<AppNavView>('student');
  
  // Student Profile Persistence
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem('tin10_student_name') || '';
  });
  const [className, setClassName] = useState<string>(() => {
    return localStorage.getItem('tin10_student_class') || '';
  });

  useEffect(() => {
    localStorage.setItem('tin10_student_name', studentName);
  }, [studentName]);

  useEffect(() => {
    localStorage.setItem('tin10_student_class', className);
  }, [className]);

  // Quiz Execution State
  const [quizState, setQuizState] = useState<'idle' | 'running' | 'result'>('idle');
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
  const [activeQuizMode, setActiveQuizMode] = useState<'topic' | 'random' | 'exam' | 'retry_wrong'>('random');
  const [timerMinutes, setTimerMinutes] = useState<number | undefined>(undefined);
  const [currentTopicFilter, setCurrentTopicFilter] = useState<string | undefined>(undefined);
  const [lastAttempt, setLastAttempt] = useState<StudentAttempt | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  // Load available approved questions for student overview
  const loadApprovedQuestions = async () => {
    try {
      const questions = await fetchStudentQuizQuestions({ mode: 'random', count: 1000 });
      setAvailableQuestions(questions);
    } catch (err) {
      console.error('Error loading approved questions for student:', err);
    }
  };

  useEffect(() => {
    loadApprovedQuestions();
  }, [currentView, quizState]);

  // Start Quiz Handler
  const handleStartQuiz = async (options: {
    mode: 'topic' | 'random' | 'exam' | 'retry_wrong';
    topic?: string;
    count?: number;
    timerMinutes?: number;
    wrongQuestionIds?: string[];
  }) => {
    setIsLoadingQuiz(true);
    setActiveQuizMode(options.mode);
    setTimerMinutes(options.timerMinutes);
    setCurrentTopicFilter(options.topic !== 'all' ? options.topic : undefined);

    try {
      const questions = await fetchStudentQuizQuestions({
        mode: options.mode,
        topic: options.topic !== 'all' ? options.topic : undefined,
        count: options.count,
        ids: options.wrongQuestionIds
      });

      if (questions.length === 0) {
        alert('Hiện chưa có câu hỏi nào được giáo viên duyệt cho lựa chọn này.');
        setIsLoadingQuiz(false);
        return;
      }

      setActiveQuizQuestions(questions);
      setCurrentView('student');
      setQuizState('running');
    } catch (err: any) {
      alert(err.message || 'Không thể bắt đầu bài luyện tập');
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  // Practice Extracted Questions immediately
  const handlePracticeExtracted = (extractedQuestions: Question[]) => {
    setActiveQuizQuestions(extractedQuestions);
    setActiveQuizMode('random');
    setCurrentView('student');
    setQuizState('running');
  };

  // Finish Quiz Handler
  const handleFinishQuiz = async (results: {
    questionId: string;
    selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
    correctAnswer: 'A' | 'B' | 'C' | 'D' | '';
    isCorrect: boolean;
    topic: string;
    timeSpentSeconds: number;
  }[]) => {
    const elapsedSeconds = results[0]?.timeSpentSeconds || 60;
    const attemptPayload: Partial<StudentAttempt> = {
      studentName: studentName.trim() || 'Học sinh',
      className: className.trim() || 'Lớp 10',
      quizMode: activeQuizMode,
      topicFilter: currentTopicFilter,
      startedAt: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
      timeSpentSeconds: elapsedSeconds,
      questionResults: results
    };

    try {
      const savedAttempt = await submitStudentQuiz(attemptPayload);
      setLastAttempt(savedAttempt);
      setQuizState('result');
    } catch (err) {
      console.error('Lỗi nộp bài:', err);
      // Fallback local attempt display
      const total = results.length;
      const correctCount = results.filter(r => r.isCorrect).length;
      const localAttempt: StudentAttempt = {
        id: `local-${Date.now()}`,
        studentName: studentName || 'Học sinh',
        className: className || '10A',
        quizMode: activeQuizMode,
        topicFilter: currentTopicFilter,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        timeSpentSeconds: elapsedSeconds,
        totalQuestions: total,
        correctCount,
        wrongCount: total - correctCount,
        scoreScale10: total > 0 ? Math.round(((correctCount / total) * 10) * 10) / 10 : 0,
        questionResults: results,
        aiFeedbackSummary: 'Em đã nỗ lực hoàn thành bài ôn tập. Hãy tiếp tục phát huy!'
      };
      setLastAttempt(localAttempt);
      setQuizState('result');
    }
  };

  // Retry wrong questions from results
  const handleRetryWrongQuestions = (wrongIds: string[]) => {
    handleStartQuiz({
      mode: 'retry_wrong',
      wrongQuestionIds: wrongIds
    });
  };

  const [initialSessionData, setInitialSessionData] = useState<any | undefined>(undefined);

  // Resume In-Progress Quiz Handler
  const handleResumeSession = (sessionData: any) => {
    setActiveQuizQuestions(sessionData.questions);
    setActiveQuizMode(sessionData.mode);
    setTimerMinutes(sessionData.timerMinutes);
    setInitialSessionData({
      currentIndex: sessionData.currentIndex,
      userAnswers: sessionData.userAnswers,
      checkedQuestions: sessionData.checkedQuestions,
      flaggedQuestions: sessionData.flaggedQuestions,
      secondsRemaining: sessionData.secondsRemaining
    });
    setCurrentView('student');
    setQuizState('running');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        onViewChange={(v) => {
          setCurrentView(v);
          setQuizState('idle');
        }}
        studentName={studentName}
        className={className}
        questionCount={availableQuestions.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* VIEW 1: TEACHER ADMIN */}
        {currentView === 'teacher' && (
          <TeacherAdmin />
        )}

        {/* VIEW 2: IMPORT QUESTION BANK (Word, PDF, Excel, TXT) */}
        {currentView === 'import' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Tải lên & Nhận dạng tự động
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
                  Import Ngân Hàng Câu Hỏi Tin Học 10
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Hỗ trợ định dạng Word (.docx), PDF (.pdf), Excel (.xlsx) và Text (.txt). AI tự động nhận diện câu hỏi, 4 phương án, đoạn code Python và ghép bảng đáp án.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('extracted_docs')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                >
                  Xem tài liệu đã trích xuất
                </button>
                <button
                  onClick={() => setCurrentView('student')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  Về trang luyện tập
                </button>
              </div>
            </div>

            <DocumentImportSection
              initialSubTab="upload"
              onImportComplete={loadApprovedQuestions}
              onPracticeExtractedQuestions={handlePracticeExtracted}
            />
          </div>
        )}

        {/* VIEW 3: EXTRACTED DOCUMENTS HISTORY */}
        {currentView === 'extracted_docs' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Lịch sử lưu trữ & Trích xuất
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
                  Kho Tài Liệu Đã Trích Xuất
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Xem lại danh sách tài liệu đề thi đã tải lên, số câu hỏi nhận dạng, số câu có đáp án và tình trạng kiểm duyệt.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('import')}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  + Tải thêm tài liệu mới
                </button>
                <button
                  onClick={() => setCurrentView('student')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                >
                  Về trang luyện tập
                </button>
              </div>
            </div>

            <DocumentImportSection
              initialSubTab="history"
              onImportComplete={loadApprovedQuestions}
              onPracticeExtractedQuestions={handlePracticeExtracted}
            />
          </div>
        )}

        {/* VIEW 4: TEXTBOOK REFERENCE KNOWLEDGE BASE */}
        {currentView === 'reference' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Nguồn Kiến Thức Chuẩn Mực
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
                  Kho Tài Liệu Tham Khảo & SGK Tin Học 10
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Kiến thức chuẩn 3 bộ SGK (Kết nối tri thức, Cánh diều, Chân trời sáng tạo). Tải lên giáo án tham chiếu và tra cứu cẩm nang Python lớp 10.
                </p>
              </div>

              <button
                onClick={() => setCurrentView('student')}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
              >
                Về trang luyện tập
              </button>
            </div>

            <TextbookReferenceSection
              onPracticeLesson={(lessonTitle) => {
                handleStartQuiz({
                  mode: 'topic',
                  topic: lessonTitle
                });
              }}
            />
          </div>
        )}

        {/* VIEW 5: STUDENT QUIZ EXPERIENCE */}
        {currentView === 'student' && (
          <>
            {isLoadingQuiz && (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                <p className="text-sm font-semibold text-indigo-300">Đang chuẩn bị bộ câu hỏi ôn tập...</p>
              </div>
            )}

            {!isLoadingQuiz && quizState === 'idle' && (
              <StudentHome
                studentName={studentName}
                setStudentName={setStudentName}
                className={className}
                setClassName={setClassName}
                availableQuestions={availableQuestions}
                onResumeSession={handleResumeSession}
                onNavigateTo={(view) => {
                  setCurrentView(view);
                  setQuizState('idle');
                }}
                onStartQuiz={(opts) => {
                  setInitialSessionData(undefined);
                  handleStartQuiz(opts);
                }}
              />
            )}

            {!isLoadingQuiz && quizState === 'running' && (
              <QuizRunner
                questions={activeQuizQuestions}
                mode={activeQuizMode}
                timerMinutes={timerMinutes}
                initialSessionData={initialSessionData}
                onFinishQuiz={handleFinishQuiz}
                onExit={() => {
                  if (confirm('Em có chắc chắn muốn tạm dừng bài ôn tập này? Tiến độ làm bài đã được lưu lại.')) {
                    setQuizState('idle');
                  }
                }}
              />
            )}

            {!isLoadingQuiz && quizState === 'result' && lastAttempt && (
              <QuizResultView
                attempt={lastAttempt}
                questions={activeQuizQuestions}
                onRetryWrong={handleRetryWrongQuestions}
                onNewQuiz={() => setQuizState('idle')}
                onGoHome={() => setQuizState('idle')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-400">TIN 10 – SMART QUIZ</span> • Hệ thống ôn tập Tin học 10 THPT có AI giải thích theo SGK
          </div>
          <div className="text-[11px] text-slate-400">
            Hỗ trợ SGK Kết nối tri thức, Cánh diều, Chân trời sáng tạo
          </div>
        </div>
      </footer>
    </div>
  );
}
