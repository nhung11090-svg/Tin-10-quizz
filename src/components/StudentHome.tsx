import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Shuffle, 
  Timer, 
  RotateCcw, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Award, 
  ChevronRight,
  Brain,
  Layers,
  Flame,
  User,
  GraduationCap,
  Play,
  Trash2,
  BookMarked,
  Upload,
  FileCheck2,
  FileText
} from 'lucide-react';
import { Question, StudentAttempt } from '../types/quiz.js';
import { fetchStudentHistory } from '../services/api.js';
import { TextbookHandbookModal } from './TextbookHandbookModal.js';

interface StudentHomeProps {
  studentName: string;
  setStudentName: (name: string) => void;
  className: string;
  setClassName: (cls: string) => void;
  availableQuestions: Question[];
  onResumeSession?: (sessionData: any) => void;
  onNavigateTo?: (view: 'import' | 'extracted_docs' | 'reference' | 'teacher') => void;
  onStartQuiz: (options: {
    mode: 'topic' | 'random' | 'exam' | 'retry_wrong';
    topic?: string;
    count?: number;
    timerMinutes?: number;
    wrongQuestionIds?: string[];
  }) => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({
  studentName,
  setStudentName,
  className,
  setClassName,
  availableQuestions,
  onResumeSession,
  onNavigateTo,
  onStartQuiz
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [topicQuestionCount, setTopicQuestionCount] = useState<number>(10);
  const [randomCount, setRandomCount] = useState<number>(10);
  const [examType, setExamType] = useState<{ count: number; minutes: number }>({ count: 10, minutes: 15 });
  const [wrongQuestionIds, setWrongQuestionIds] = useState<string[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<StudentAttempt[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showNameAlert, setShowNameAlert] = useState(false);
  const [showHandbook, setShowHandbook] = useState(false);

  // Check if there is an in-progress quiz session
  const [savedSession, setSavedSession] = useState<any | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('tin10_active_quiz_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.questions && parsed.questions.length > 0) {
          setSavedSession(parsed);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Extract unique topics from available questions
  const topics = Array.from(new Set(availableQuestions.map(q => q.topic).filter(Boolean)));

  // Load student history whenever name/class changes
  useEffect(() => {
    if (studentName.trim() && className.trim()) {
      setIsLoadingHistory(true);
      fetchStudentHistory(studentName.trim(), className.trim())
        .then(data => {
          setWrongQuestionIds(data.wrongQuestionIds || []);
          setRecentAttempts(data.attempts || []);
        })
        .catch(err => console.error('Error fetching student history:', err))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [studentName, className]);

  const validateStudentInfo = (): boolean => {
    if (!studentName.trim() || !className.trim()) {
      setShowNameAlert(true);
      return false;
    }
    setShowNameAlert(false);
    return true;
  };

  const handleStartTopicMode = () => {
    if (!validateStudentInfo()) return;
    onStartQuiz({
      mode: 'topic',
      topic: selectedTopic,
      count: topicQuestionCount
    });
  };

  const handleStartRandomMode = () => {
    if (!validateStudentInfo()) return;
    onStartQuiz({
      mode: 'random',
      count: randomCount
    });
  };

  const handleStartExamMode = () => {
    if (!validateStudentInfo()) return;
    onStartQuiz({
      mode: 'exam',
      count: examType.count,
      timerMinutes: examType.minutes
    });
  };

  const handleStartRetryWrongMode = () => {
    if (!validateStudentInfo()) return;
    if (wrongQuestionIds.length === 0) return;
    onStartQuiz({
      mode: 'retry_wrong',
      wrongQuestionIds: wrongQuestionIds
    });
  };

  const handleDiscardSavedSession = () => {
    localStorage.removeItem('tin10_active_quiz_session');
    setSavedSession(null);
  };

  const handleResumeSavedSession = () => {
    if (savedSession && onResumeSession) {
      onResumeSession(savedSession);
    }
  };

  // Filter questions for the selected topic
  const filteredTopicQuestions = selectedTopic === 'all' 
    ? availableQuestions 
    : availableQuestions.filter(q => q.topic === selectedTopic);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Active Session Recovery Banner */}
      {savedSession && (
        <div className="p-4 sm:p-5 rounded-3xl bg-indigo-950/80 border border-indigo-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Play className="w-5 h-5 fill-indigo-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Tiếp tục bài ôn tập đang làm dở?</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                  Câu {savedSession.currentIndex + 1}/{savedSession.questions.length}
                </span>
              </h4>
              <p className="text-xs text-slate-300">
                Hệ thống đã tự động lưu tiến độ làm bài của em để không bị mất kết quả khi tải lại trang.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleResumeSavedSession}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              Làm tiếp ngay
            </button>
            <button
              onClick={handleDiscardSavedSession}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-800 text-slate-400 hover:text-rose-300 text-xs font-medium transition cursor-pointer"
              title="Hủy bài này"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/20 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nền tảng ôn tập thông minh THPT</span>
            </div>

            <button
              onClick={() => setShowHandbook(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer shadow-sm"
            >
              <BookMarked className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tra cứu Sổ tay SGK 10</span>
            </button>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            ÔN TẬP TIN HỌC 10 <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
              HỌC HIỂU, NHỚ LÂU
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 mb-8 max-w-2xl leading-relaxed">
            Ngân hàng câu hỏi trắc nghiệm bám sát chương trình GDPT Tin học 10. Hệ thống AI thông minh phân tích đáp án, giải thích vì sao đúng, vì sao sai và liên hệ trực tiếp nội dung sách giáo khoa.
          </p>

          {/* Student Info Card */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-5 shadow-xl max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 mb-3">
              <User className="w-4 h-4 text-indigo-400" />
              <span>Thông tin học sinh ôn tập</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Họ và tên của em</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    if (showNameAlert) setShowNameAlert(false);
                  }}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm outline-none transition placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Lớp</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => {
                    setClassName(e.target.value);
                    if (showNameAlert) setShowNameAlert(false);
                  }}
                  placeholder="Ví dụ: 10A1 hoặc 10 Tin"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm outline-none transition placeholder:text-slate-500"
                />
              </div>
            </div>

            {showNameAlert && (
              <p className="text-rose-400 text-xs mt-2.5 font-medium flex items-center gap-1.5">
                <XCircle className="w-4 h-4 shrink-0" />
                Vui lòng nhập Họ tên và Lớp trước khi chọn chế độ ôn tập!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Ngân hàng đã duyệt</span>
          </div>
          <div className="text-2xl font-bold text-white">{availableQuestions.length} <span className="text-xs font-normal text-slate-400">câu</span></div>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Chủ đề bài học</span>
          </div>
          <div className="text-2xl font-bold text-white">{topics.length} <span className="text-xs font-normal text-slate-400">chủ đề</span></div>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Đã làm gần đây</span>
          </div>
          <div className="text-2xl font-bold text-white">{recentAttempts.length} <span className="text-xs font-normal text-slate-400">lượt</span></div>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Câu sai cần ôn</span>
          </div>
          <div className="text-2xl font-bold text-rose-400">{wrongQuestionIds.length} <span className="text-xs font-normal text-slate-400">câu</span></div>
        </div>
      </div>

      {/* TRUNG TÂM TÀI LIỆU, TRÍCH XUẤT ĐỀ & KHO SGK */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Trung tâm Ngân hàng đề thi & Tài liệu tham khảo
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Tải Lên Đề Thi, Trích Xuất AI & Kho Kiến Thức SGK
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Tải tài liệu Word (.docx), PDF, Excel hoặc dán đề để hệ thống tự động nhận diện câu hỏi trắc nghiệm, ghép bảng đáp án và đối chiếu kiến thức 3 bộ SGK Tin học 10.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-[11px] px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-medium">
              ✨ Trích xuất tự động bằng AI
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Import Document */}
          <div 
            onClick={() => onNavigateTo?.('import')}
            className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/60 hover:bg-slate-900/90 transition-all cursor-pointer group flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  DOCX • PDF • XLSX
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors mb-1.5 flex items-center gap-1.5">
                <span>Import Ngân Hàng Câu Hỏi</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Tải file đề kiểm tra, AI tự động tách số câu, 4 phương án A-B-C-D, phát hiện mã Python và ghép bảng đáp án riêng.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-purple-400 group-hover:text-purple-300">
              <span>Tải file đề lên ngay</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Extracted Documents */}
          <div 
            onClick={() => onNavigateTo?.('extracted_docs')}
            className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900/90 transition-all cursor-pointer group flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Lịch sử đề đã bóc tách
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors mb-1.5 flex items-center gap-1.5">
                <span>Tài Liệu Đã Trích Xuất</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Xem danh mục các tệp đề đã tải lên, số câu đã trích xuất, số câu có đáp án, câu cần kiểm duyệt và nạp vào ôn tập.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span>Xem danh sách tài liệu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Textbook Reference */}
          <div 
            onClick={() => onNavigateTo?.('reference')}
            className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900/90 transition-all cursor-pointer group flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <BookMarked className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  3 Bộ SGK 10
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors mb-1.5 flex items-center gap-1.5">
                <span>Kho Tài Liệu Tham Khảo SGK</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Tra cứu kiến thức chuẩn SGK Kết nối tri thức, Cánh diều, Chân trời sáng tạo, cẩm nang Python và tải lên giáo án tham chiếu.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
              <span>Tra cứu kiến thức SGK</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Practice Modes */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Chọn Chế Độ Ôn Tập</h2>
            <p className="text-xs text-slate-400">Chọn 1 trong 4 hình thức luyện tập phù hợp với mục tiêu của em</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mode 1: Ôn tập theo bài */}
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 p-6 flex flex-col justify-between transition-all group shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Chế độ 1
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                Ôn tập theo bài & chủ đề
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Chọn cụ thể bài học hoặc chủ đề trong SGK Tin học 10 để ôn luyện chuyên sâu.
              </p>

              {/* Topic Selector */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Chọn chủ đề</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="all">Tất cả chủ đề ({availableQuestions.length} câu)</option>
                    {topics.map(t => {
                      const count = availableQuestions.filter(q => q.topic === t).length;
                      return (
                        <option key={t} value={t}>
                          {t} ({count} câu)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Số lượng câu luyện tập</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, filteredTopicQuestions.length].map((cnt, idx) => {
                      const label = idx === 3 ? 'Toàn bộ' : `${cnt} câu`;
                      const isSelected = topicQuestionCount === cnt;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTopicQuestionCount(cnt)}
                          className={`py-2 text-xs font-medium rounded-xl border transition cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartTopicMode}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer group-hover:scale-[1.01]"
            >
              <span>Bắt đầu ôn tập bài này</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mode 2: Luyện tập ngẫu nhiên */}
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 p-6 flex flex-col justify-between transition-all group shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Shuffle className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Chế độ 2
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                Luyện tập ngẫu nhiên
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Hệ thống tự động xáo trộn câu hỏi từ toàn bộ ngân hàng giúp em rèn luyện phản xạ tổng hợp.
              </p>

              <div className="space-y-4 mb-6">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Chọn số lượng câu</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[10, 20, 40, availableQuestions.length].map((cnt, idx) => {
                    const label = idx === 3 ? 'Toàn bộ' : `${cnt} câu`;
                    const isSelected = randomCount === cnt;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRandomCount(cnt)}
                        className={`py-3 text-xs font-medium rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500">
                  Mỗi câu trả lời sẽ được chấm ngay kèm giải thích AI chi tiết từng phương án.
                </p>
              </div>
            </div>

            <button
              onClick={handleStartRandomMode}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition cursor-pointer group-hover:scale-[1.01]"
            >
              <span>Bắt đầu luyện tập ngẫu nhiên</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mode 3: Thi thử có bấm giờ */}
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 p-6 flex flex-col justify-between transition-all group shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Timer className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Chế độ 3
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                Thi thử (Có bấm giờ)
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Mô phỏng bài kiểm tra 15 phút hoặc 45 phút. Không hiển thị đáp án trong lúc làm, chấm điểm thang 10 và giải thích sau khi nộp bài.
              </p>

              <div className="space-y-4 mb-6">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Cấu trúc đề thi thử</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExamType({ count: 10, minutes: 15 })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      examType.minutes === 15
                        ? 'bg-amber-600/20 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-amber-300">Kiểm tra 15 phút</div>
                    <div className="text-[11px] text-slate-400 mt-1">10 câu trắc nghiệm</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExamType({ count: 25, minutes: 45 })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      examType.minutes === 45
                        ? 'bg-amber-600/20 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-amber-300">Kiểm tra 1 tiết (45p)</div>
                    <div className="text-[11px] text-slate-400 mt-1">25 câu trắc nghiệm</div>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartExamMode}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/25 transition cursor-pointer group-hover:scale-[1.01]"
            >
              <span>Vào phòng thi thử</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mode 4: Luyện lại câu sai */}
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/40 p-6 flex flex-col justify-between transition-all group shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                  Chế độ 4
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-rose-300 transition-colors">
                Luyện lại các câu từng sai
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Hệ thống tự động ghi nhận những câu em chưa trả lời đúng để em luyện lại cho đến khi thực sự hiểu bản chất.
              </p>

              <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-4 mb-6">
                {wrongQuestionIds.length > 0 ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-300 font-medium">Hiện có câu hỏi cần củng cố</p>
                      <p className="text-[11px] text-slate-500">Thuộc các chủ đề đã làm sai gần đây</p>
                    </div>
                    <span className="text-xl font-bold text-rose-400 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      {wrongQuestionIds.length} câu
                    </span>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                    <p className="text-xs text-emerald-300 font-medium">Tuyệt vời! Em chưa có câu sai nào cần ôn lại.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Hãy làm thử các đề mới ở các chế độ trên.</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleStartRetryWrongMode}
              disabled={wrongQuestionIds.length === 0}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 transition cursor-pointer disabled:cursor-not-allowed group-hover:scale-[1.01]"
            >
              <span>Luyện lại {wrongQuestionIds.length} câu sai</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity / Progress */}
      {recentAttempts.length > 0 && (
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Lịch sử bài luyện tập gần đây</h3>
            </div>
            <span className="text-xs text-slate-400">{recentAttempts.length} lượt đã ghi nhận</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {recentAttempts.slice(0, 5).map((att) => (
              <div key={att.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      {att.quizMode === 'exam' ? 'Thi thử' : att.quizMode === 'topic' ? `Ôn bài: ${att.topicFilter || 'Chủ đề'}` : att.quizMode === 'retry_wrong' ? 'Luyện câu sai' : 'Luyện ngẫu nhiên'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(att.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                  {att.aiFeedbackSummary && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                      "{att.aiFeedbackSummary}"
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <div className={`text-base font-extrabold ${att.scoreScale10 >= 8 ? 'text-emerald-400' : att.scoreScale10 >= 5 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {att.scoreScale10}/10
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {att.correctCount}/{att.totalQuestions} đúng
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Textbook Handbook Modal */}
      <TextbookHandbookModal
        isOpen={showHandbook}
        onClose={() => setShowHandbook(false)}
        onPracticeTopic={(topicName) => {
          onStartQuiz({
            mode: 'topic',
            topic: topicName,
            count: 10
          });
        }}
      />
    </div>
  );
};
