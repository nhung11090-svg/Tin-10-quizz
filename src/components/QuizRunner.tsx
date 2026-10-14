import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  ArrowRight, 
  Flag, 
  Maximize2, 
  Minimize2, 
  Timer, 
  Sparkles, 
  HelpCircle, 
  Code2, 
  Copy, 
  Check, 
  Lightbulb, 
  BookOpen, 
  AlertTriangle,
  RotateCcw,
  Send,
  Shuffle,
  Save
} from 'lucide-react';
import { Question } from '../types/quiz.js';
import { prepareQuizQuestions, ShuffledQuestion } from '../utils/quizUtils.js';

interface QuizRunnerProps {
  questions: Question[];
  mode: 'topic' | 'random' | 'exam' | 'retry_wrong';
  timerMinutes?: number;
  initialSessionData?: {
    currentIndex?: number;
    userAnswers?: Record<number, 'A' | 'B' | 'C' | 'D' | null>;
    checkedQuestions?: Record<number, boolean>;
    flaggedQuestions?: Record<number, boolean>;
    secondsRemaining?: number;
  };
  onFinishQuiz: (results: {
    questionId: string;
    selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
    correctAnswer: 'A' | 'B' | 'C' | 'D' | '';
    isCorrect: boolean;
    topic: string;
    timeSpentSeconds: number;
  }[]) => void;
  onExit: () => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  questions: initialQuestions,
  mode,
  timerMinutes,
  initialSessionData,
  onFinishQuiz,
  onExit
}) => {
  // Shuffling options
  const [shuffleOptionsActive, setShuffleOptionsActive] = useState(false);
  const [shuffleQuestionsActive, setShuffleQuestionsActive] = useState(mode === 'random' || mode === 'exam');

  const [questions, setQuestions] = useState<ShuffledQuestion[]>(() => {
    return prepareQuizQuestions(initialQuestions, mode === 'random' || mode === 'exam', false);
  });

  const [currentIndex, setCurrentIndex] = useState(initialSessionData?.currentIndex || 0);

  // User state per question
  const [userAnswers, setUserAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D' | null>>(
    initialSessionData?.userAnswers || {}
  );
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>(
    initialSessionData?.checkedQuestions || {}
  );
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>(
    initialSessionData?.flaggedQuestions || {}
  );
  
  // Timer for exam mode or tracking
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (initialSessionData?.secondsRemaining !== undefined) return initialSessionData.secondsRemaining;
    return timerMinutes ? timerMinutes * 60 : 0;
  });
  const [startTime] = useState<number>(Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  const currentQ = questions[currentIndex] || questions[0];
  const totalQuestions = questions.length;

  // Persist session progress to localStorage on changes
  useEffect(() => {
    if (questions.length === 0) return;
    const sessionData = {
      questions,
      mode,
      timerMinutes,
      currentIndex,
      userAnswers,
      checkedQuestions,
      flaggedQuestions,
      secondsRemaining,
      updatedAt: Date.now()
    };
    try {
      localStorage.setItem('tin10_active_quiz_session', JSON.stringify(sessionData));
    } catch (e) {
      // quota or local storage disabled
    }
  }, [currentIndex, userAnswers, checkedQuestions, flaggedQuestions, secondsRemaining, questions, mode, timerMinutes]);

  // Handle Exam Countdown Timer
  useEffect(() => {
    if (mode !== 'exam' || !timerMinutes) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, timerMinutes]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSelectOption = (optionKey: 'A' | 'B' | 'C' | 'D') => {
    if (mode !== 'exam' && checkedQuestions[currentIndex]) return;

    setUserAnswers(prev => ({
      ...prev,
      [currentIndex]: optionKey
    }));
  };

  const handleCheckAnswer = () => {
    if (!userAnswers[currentIndex]) return;
    setCheckedQuestions(prev => ({
      ...prev,
      [currentIndex]: true
    }));
  };

  const toggleFlag = () => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [currentIndex]: !prev[currentIndex]
    }));
  };

  const handleCopyCode = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleFinishQuiz = () => {
    // Clear active session upon completion
    localStorage.removeItem('tin10_active_quiz_session');

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const results = questions.map((q, idx) => {
      const selectedNew = userAnswers[idx] || null;
      // Map back to original answer if options were shuffled
      const selectedOriginal = selectedNew && q.optionMapping ? q.optionMapping[selectedNew] : selectedNew;
      const isCorrect = selectedNew === q.correctAnswer;

      return {
        questionId: q.originalQuestionId || q.id,
        selectedAnswer: (selectedOriginal || null) as 'A' | 'B' | 'C' | 'D' | null,
        correctAnswer: ((q.originalCorrectAnswer || q.correctAnswer) || '') as 'A' | 'B' | 'C' | 'D' | '',
        isCorrect,
        topic: q.topic,
        timeSpentSeconds: elapsedSeconds
      };
    });

    onFinishQuiz(results);
  };

  // Re-shuffle options dynamically
  const handleToggleOptionShuffle = () => {
    const nextVal = !shuffleOptionsActive;
    setShuffleOptionsActive(nextVal);
    // Reset checked state on current question to prevent desync
    setQuestions(prev => prepareQuizQuestions(initialQuestions, shuffleQuestionsActive, nextVal));
    setUserAnswers({});
    setCheckedQuestions({});
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        handleSelectOption(key as 'A' | 'B' | 'C' | 'D');
      } else if (e.key === 'ArrowRight' && currentIndex < totalQuestions - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'Enter' && mode !== 'exam' && userAnswers[currentIndex] && !checkedQuestions[currentIndex]) {
        handleCheckAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, userAnswers, checkedQuestions, mode, totalQuestions]);

  const selectedAnswer = userAnswers[currentIndex] || null;
  const isChecked = mode !== 'exam' && !!checkedQuestions[currentIndex];
  const isCorrect = selectedAnswer === currentQ?.correctAnswer;

  // Format timer seconds
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Answered count
  const answeredCount = Object.values(userAnswers).filter(Boolean).length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  if (!currentQ) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Bar: Navigation, Timer & Tools */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-lg">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát</span>
        </button>

        {/* Center: Mode & Timer */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            {mode === 'exam' ? 'Thi thử' : mode === 'topic' ? 'Ôn theo bài' : mode === 'retry_wrong' ? 'Luyện câu sai' : 'Luyện ngẫu nhiên'}
          </div>

          {mode === 'exam' && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
              secondsRemaining < 120 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse' 
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}>
              <Timer className="w-3.5 h-3.5" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>
          )}
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* Shuffling Toggle */}
          <button
            onClick={handleToggleOptionShuffle}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
              shuffleOptionsActive 
                ? 'bg-purple-600/30 border-purple-500 text-purple-200' 
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Đảo thứ tự phương án A-B-C-D"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đảo đáp án</span>
          </button>

          <button
            onClick={() => setShowPalette(!showPalette)}
            className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition cursor-pointer font-medium"
          >
            Đề: {answeredCount}/{totalQuestions}
          </button>

          <button
            onClick={toggleFlag}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              flaggedQuestions[currentIndex]
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Đánh dấu câu hỏi này để xem lại"
          >
            <Flag className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Question Palette Drawer (Collapsible) */}
      {showPalette && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
            <span>Danh sách các câu hỏi</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Đã làm</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span> Chưa làm</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Đã đánh dấu</span>
            </div>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {questions.map((_, idx) => {
              const isAnswered = !!userAnswers[idx];
              const isFlagged = !!flaggedQuestions[idx];
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowPalette(false);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer relative ${
                    isCurrent
                      ? 'border-indigo-400 ring-2 ring-indigo-500/40 text-white'
                      : 'border-slate-800 text-slate-300'
                  } ${
                    isAnswered 
                      ? 'bg-indigo-600/30 border-indigo-500/40 text-indigo-200' 
                      : 'bg-slate-950 hover:bg-slate-800'
                  }`}
                >
                  {idx + 1}
                  {isFlagged && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">
            Câu {currentIndex + 1} / {totalQuestions}
          </span>
          <span>{progressPercent}% hoàn thành</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card with Smooth Transition Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
        >
          {/* Meta badges */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentQ.topic || 'Tin học 10'}
              </span>
              {currentQ.difficulty && (
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  currentQ.difficulty === 'Nhận biết'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : currentQ.difficulty === 'Thông hiểu'
                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                }`}>
                  {currentQ.difficulty}
                </span>
              )}
              {currentQ.lessonName && (
                <span className="text-xs text-slate-400 hidden sm:inline">
                  • {currentQ.lessonName}
                </span>
              )}
            </div>

            {flaggedQuestions[currentIndex] && (
              <span className="text-xs text-amber-400 flex items-center gap-1 font-medium">
                <Flag className="w-3.5 h-3.5 fill-amber-400" />
                Đã đánh dấu xem lại
              </span>
            )}
          </div>

          {/* Question Text */}
          <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
            {currentQ.text}
          </h2>

          {/* Python Code Snippet if present */}
          {currentQ.codeSnippet && (
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden group">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2 font-mono">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span>Python</span>
                </div>
                <button
                  onClick={() => handleCopyCode(currentQ.codeSnippet || '')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs sm:text-sm font-mono text-indigo-200 overflow-x-auto leading-relaxed">
                <code>{currentQ.codeSnippet}</code>
              </pre>
            </div>
          )}

          {/* Options A, B, C, D */}
          <div className="space-y-3 pt-2">
            {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
              const optText = currentQ.options[optKey];
              if (!optText) return null;

              const isSelected = selectedAnswer === optKey;
              const isCorrectOption = currentQ.correctAnswer === optKey;

              let cardStyle = 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800/40';
              let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';

              if (mode === 'exam') {
                if (isSelected) {
                  cardStyle = 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500';
                  badgeStyle = 'bg-indigo-600 text-white border-indigo-500';
                }
              } else if (isChecked) {
                if (isCorrectOption) {
                  cardStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-100 ring-1 ring-emerald-500';
                  badgeStyle = 'bg-emerald-600 text-white border-emerald-500';
                } else if (isSelected && !isCorrectOption) {
                  cardStyle = 'bg-rose-950/40 border-rose-500 text-rose-100 ring-1 ring-rose-500';
                  badgeStyle = 'bg-rose-600 text-white border-rose-500';
                } else {
                  cardStyle = 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60';
                  badgeStyle = 'bg-slate-900 text-slate-600 border-slate-800';
                }
              } else if (isSelected) {
                cardStyle = 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500 shadow-lg shadow-indigo-600/10';
                badgeStyle = 'bg-indigo-600 text-white border-indigo-500';
              }

              return (
                <div
                  key={optKey}
                  onClick={() => handleSelectOption(optKey)}
                  className={`w-full p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 group text-left ${cardStyle}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border transition-transform group-hover:scale-105 ${badgeStyle}`}>
                    {optKey}
                  </div>
                  <div className="flex-1 text-xs sm:text-sm pt-1 leading-relaxed font-normal">
                    {optText}
                  </div>
                  {isChecked && isCorrectOption && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 self-center" />
                  )}
                  {isChecked && isSelected && !isCorrectOption && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 self-center" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Check Button (Only in Practice Mode) */}
          {mode !== 'exam' && !isChecked && (
            <div className="pt-2">
              <button
                onClick={handleCheckAnswer}
                disabled={!selectedAnswer}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 transition cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Kiểm tra đáp án</span>
              </button>
            </div>
          )}

          {/* AI Explanation Section (In Practice Mode after Check) */}
          {isChecked && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-4"
            >
              {/* Feedback alert */}
              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                isCorrect 
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}>
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div className="text-xs sm:text-sm font-semibold">
                  {isCorrect 
                    ? 'Chính xác! Em đã nắm được kiến thức bài học.' 
                    : 'Chưa chính xác, cùng AI tìm hiểu lại để nhớ lâu hơn nhé!'}
                </div>
              </div>

              {/* Structured Explanation Card */}
              <div className="rounded-2xl bg-slate-950 border border-indigo-500/30 p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>AI Giải Thích Chi Tiết (Theo SGK Tin học 10)</span>
                  </div>
                  <div className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                    Đáp án đúng: {currentQ.correctAnswer}
                  </div>
                </div>

                {/* 1. Vì sao đúng */}
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Vì sao {currentQ.correctAnswer} đúng?
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {currentQ.explanation?.whyCorrect || 'Đáp án đã được giáo viên bộ môn xác nhận theo chuẩn kiến thức.'}
                  </p>
                </div>

                {/* 2. Vì sao các phương án khác chưa đúng */}
                {currentQ.explanation?.whyOthersWrong && Object.keys(currentQ.explanation.whyOthersWrong).length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Vì sao các phương án khác chưa đúng?
                    </h4>
                    <div className="space-y-1.5">
                      {Object.entries(currentQ.explanation.whyOthersWrong).map(([key, reason]) => {
                        if (!reason || key === currentQ.correctAnswer) return null;
                        return (
                          <div key={key} className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                            <span className="font-bold text-rose-400 mr-1.5">{key}:</span>
                            <span>{reason}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Kiến thức cần nhớ */}
                {currentQ.explanation?.keyTakeaway && (
                  <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-200 leading-relaxed">
                      <span className="font-bold text-indigo-100">Kiến thức cần nhớ: </span>
                      {currentQ.explanation.keyTakeaway}
                    </div>
                  </div>
                )}

                {/* 4. Ví dụ minh họa nếu có */}
                {currentQ.explanation?.exampleSnippet && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400">Ví dụ minh họa:</span>
                    <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
                      <code>{currentQ.explanation.exampleSnippet}</code>
                    </pre>
                  </div>
                )}

                {/* 5. Nguồn kiến thức SGK */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Nguồn: {currentQ.explanation?.textbookReference || currentQ.lessonName || 'SGK Tin học 10'}</span>
                  </span>
                  <span className="text-emerald-400 font-medium">Đã đối chiếu</span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Bar: Prev, Next & Submit */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Câu trước</span>
        </button>

        {currentIndex < totalQuestions - 1 ? (
          <button
            onClick={() => setCurrentIndex(prev => prev + 1)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer"
          >
            <span>Câu tiếp theo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinishQuiz}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer animate-bounce"
          >
            <Send className="w-4 h-4" />
            <span>Nộp bài & Xem kết quả</span>
          </button>
        )}
      </div>
    </div>
  );
};
