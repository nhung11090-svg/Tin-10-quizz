import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  Home, 
  ListFilter, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  BookOpen, 
  Code2,
  Share2,
  Check
} from 'lucide-react';
import { Question, StudentAttempt } from '../types/quiz.js';

interface QuizResultViewProps {
  attempt: StudentAttempt;
  questions: Question[];
  onRetryWrong: (wrongIds: string[]) => void;
  onNewQuiz: () => void;
  onGoHome: () => void;
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({
  attempt,
  questions,
  onRetryWrong,
  onNewQuiz,
  onGoHome
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'wrong' | 'correct'>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  // Trigger confetti on high score
  useEffect(() => {
    if (attempt.scoreScale10 >= 7) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // Safe fallback
      }
    }
  }, [attempt.scoreScale10]);

  const toggleExpand = (id: string) => {
    setExpandedQuestions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const questionMap = new Map(questions.map(q => [q.id, q]));
  const wrongIds = attempt.questionResults.filter(r => !r.isCorrect).map(r => r.questionId);

  // Filter results
  const filteredResults = attempt.questionResults.filter(r => {
    if (filterMode === 'wrong') return !r.isCorrect;
    if (filterMode === 'correct') return r.isCorrect;
    return true;
  });

  // Calculate topic performance breakdown
  const topicStats: Record<string, { total: number; correct: number }> = {};
  for (const r of attempt.questionResults) {
    const t = r.topic || 'Tin học 10';
    if (!topicStats[t]) topicStats[t] = { total: 0, correct: 0 };
    topicStats[t].total++;
    if (r.isCorrect) topicStats[t].correct++;
  }

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} phút ${s.toString().padStart(2, '0')} giây`;
  };

  const handleShare = () => {
    const shareText = `Tớ vừa đạt ${attempt.scoreScale10}/10 điểm môn Tin học 10 trên TIN 10 - SMART QUIZ!`;
    navigator.clipboard.writeText(shareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Result Card Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 p-8 sm:p-10 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-lg shadow-indigo-500/20">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 inline-block mb-3">
            KẾT QUẢ ÔN TẬP TIN HỌC 10
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            {attempt.scoreScale10 >= 9 
              ? 'Xuất Sắc! Điểm Tuyệt Đối!' 
              : attempt.scoreScale10 >= 7 
              ? 'Rất Tốt! Em Đã Nắm Vững Kiến Thức' 
              : attempt.scoreScale10 >= 5 
              ? 'Khá Tốt! Cần Củng Cố Thêm Một Chút' 
              : 'Cần Ôn Tập Lại Các Chủ Đề Yếu'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            Học sinh: <span className="font-semibold text-white">{attempt.studentName}</span> • Lớp: <span className="font-semibold text-indigo-300">{attempt.className}</span>
          </p>
        </div>

        {/* Score & Gauge */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="text-6xl sm:text-7xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            {attempt.scoreScale10}
            <span className="text-2xl sm:text-3xl font-semibold text-slate-400 ml-1">/10</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Đúng {attempt.correctCount}/{attempt.totalQuestions} câu • Tỷ lệ chính xác {Math.round((attempt.correctCount / attempt.totalQuestions) * 100)}%
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Câu đúng</span>
            </div>
            <div className="text-lg font-bold text-emerald-400 mt-1">{attempt.correctCount} câu</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Câu sai</span>
            </div>
            <div className="text-lg font-bold text-rose-400 mt-1">{attempt.wrongCount} câu</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Thời gian</span>
            </div>
            <div className="text-xs font-bold text-slate-200 mt-2 truncate">
              {formatTime(attempt.timeSpentSeconds)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-xs text-slate-400">Hình thức</div>
            <div className="text-xs font-bold text-indigo-300 mt-2">
              {attempt.quizMode === 'exam' ? 'Thi thử' : attempt.quizMode === 'topic' ? 'Theo bài' : attempt.quizMode === 'retry_wrong' ? 'Luyện câu sai' : 'Ngẫu nhiên'}
            </div>
          </div>
        </div>

        {/* AI Pedagogical Feedback Box */}
        {attempt.aiFeedbackSummary && (
          <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 max-w-2xl mx-auto text-left flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-1">
                Nhận xét học tập từ AI
              </h4>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                "{attempt.aiFeedbackSummary}"
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {wrongIds.length > 0 && (
            <button
              onClick={() => onRetryWrong(wrongIds)}
              className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Luyện lại {wrongIds.length} câu sai</span>
            </button>
          )}

          <button
            onClick={onNewQuiz}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Làm bộ đề mới</span>
          </button>

          <button
            onClick={onGoHome}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Về trang chủ</span>
          </button>

          <button
            onClick={handleShare}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="Sao chép kết quả"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Đã chép' : 'Chia sẻ'}</span>
          </button>
        </div>
      </div>

      {/* Topic Performance Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>Phân tích năng lực theo chủ đề</span>
        </h3>

        <div className="space-y-3">
          {Object.entries(topicStats).map(([topic, stats]) => {
            const pct = Math.round((stats.correct / stats.total) * 100);
            return (
              <div key={topic} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">{topic}</span>
                  <span className={pct >= 80 ? 'text-emerald-400 font-bold' : pct >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                    {stats.correct}/{stats.total} đúng ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Question Review List */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-white">Xem lại chi tiết từng câu hỏi</h3>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                filterMode === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({attempt.questionResults.length})
            </button>
            <button
              onClick={() => setFilterMode('wrong')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                filterMode === 'wrong' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Câu sai ({attempt.wrongCount})
            </button>
            <button
              onClick={() => setFilterMode('correct')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                filterMode === 'correct' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Câu đúng ({attempt.correctCount})
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredResults.map((result, idx) => {
            const q = questionMap.get(result.questionId);
            if (!q) return null;
            const isExpanded = !!expandedQuestions[q.id];

            return (
              <div 
                key={q.id}
                className={`rounded-2xl border transition-all ${
                  result.isCorrect 
                    ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/30' 
                    : 'bg-slate-900/90 border-rose-950/80 hover:border-rose-500/40 ring-1 ring-rose-500/20'
                }`}
              >
                {/* Header Row */}
                <div 
                  onClick={() => toggleExpand(q.id)}
                  className="p-5 flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {result.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-slate-400">Câu {idx + 1}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {q.topic}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed line-clamp-2">
                        {q.text}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right text-xs">
                      <span className="text-slate-400 block text-[11px]">Đã chọn</span>
                      <span className={`font-bold ${result.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {result.selectedAnswer || 'Bỏ qua'} (Đ/a: {q.correctAnswer})
                      </span>
                    </div>
                    <button className="p-1 rounded-lg text-slate-400 hover:text-white">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details & AI Explanation */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800 space-y-4">
                    {/* Code snippet if present */}
                    {q.codeSnippet && (
                      <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto">
                        <code>{q.codeSnippet}</code>
                      </pre>
                    )}

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {(['A', 'B', 'C', 'D'] as const).map(k => {
                        const opt = q.options[k];
                        if (!opt) return null;
                        const isChosen = result.selectedAnswer === k;
                        const isRight = q.correctAnswer === k;

                        return (
                          <div 
                            key={k}
                            className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                              isRight
                                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                                : isChosen
                                ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span className="font-bold shrink-0">{k}.</span>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* AI Explanation Box */}
                    {q.explanation && (
                      <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/20 space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>AI Giải Thích Kiến Thức SGK</span>
                        </div>

                        <div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            <span className="font-bold text-emerald-400">Vì sao đúng: </span>
                            {q.explanation.whyCorrect}
                          </p>
                        </div>

                        {q.explanation.keyTakeaway && (
                          <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200">
                            <span className="font-bold">Ghi nhớ: </span>
                            {q.explanation.keyTakeaway}
                          </div>
                        )}

                        {q.explanation.textbookReference && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Nguồn: {q.explanation.textbookReference}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
