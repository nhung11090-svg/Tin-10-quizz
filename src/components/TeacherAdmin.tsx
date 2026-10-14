import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Download, 
  BookOpen, 
  BarChart3, 
  Search, 
  Filter, 
  Check, 
  X, 
  Layers, 
  Code2, 
  RefreshCw, 
  GraduationCap,
  Save,
  Users,
  TrendingUp,
  FileCheck2,
  History
} from 'lucide-react';
import { 
  Question, 
  TextbookTopic, 
  TeacherStats, 
  StudentAttempt, 
  AIExplanation 
} from '../types/quiz.js';
import { 
  fetchQuestions, 
  saveQuestion, 
  deleteQuestion, 
  batchApproveQuestions, 
  batchDeleteQuestions,
  parseDocument, 
  commitImport, 
  matchAnswers,
  generateAIExplanation,
  fetchTextbooks, 
  saveTextbookTopic, 
  deleteTextbookTopic,
  fetchTeacherAnalytics 
} from '../services/api.js';
import { downloadSampleTemplate } from '../utils/quizUtils.js';
import { TeacherPerformanceDashboard } from './TeacherPerformanceDashboard.js';
import { DocumentImportSection } from './DocumentImportSection.js';
import { TextbookReferenceSection } from './TextbookReferenceSection.js';

interface TeacherAdminProps {
  initialTab?: 'bank' | 'import' | 'extracted_docs' | 'textbook' | 'analytics';
}

export const TeacherAdmin: React.FC<TeacherAdminProps> = ({
  initialTab = 'bank'
}) => {
  const [activeTab, setActiveTab] = useState<'bank' | 'import' | 'extracted_docs' | 'textbook' | 'analytics'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // Question Bank State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'needs_review'>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  
  // Question Edit Modal State
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [rawTextImport, setRawTextImport] = useState('');
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [answerKeyText, setAnswerKeyText] = useState('');
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [importError, setImportError] = useState('');
  const [parsedPreviewQuestions, setParsedPreviewQuestions] = useState<(Question & { isDuplicate?: boolean; matchedText?: string })[]>([]);
  const [importSummary, setImportSummary] = useState<{
    totalExtracted: number;
    hasAnswerCount: number;
    needsReviewCount: number;
    duplicateCount: number;
    sourceFile: string;
  } | null>(null);
  const [isCommittingImport, setIsCommittingImport] = useState(false);
  const [isMatchingAnswers, setIsMatchingAnswers] = useState(false);

  // Textbook State
  const [textbooks, setTextbooks] = useState<TextbookTopic[]>([]);
  const [newTopic, setNewTopic] = useState<Partial<TextbookTopic>>({
    curriculum: 'Kết nối tri thức',
    chapter: 'Chủ đề 5: Lập trình cơ bản với Python',
    lessonNumber: 1,
    lessonTitle: '',
    summary: '',
    keyPoints: []
  });
  const [keyPointInput, setKeyPointInput] = useState('');

  // Analytics State
  const [analytics, setAnalytics] = useState<{
    stats: TeacherStats;
    recentAttempts: StudentAttempt[];
  } | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Load questions on mount & filters change
  const loadQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const data = await fetchQuestions({
        status: statusFilter,
        topic: topicFilter,
        search: searchQuery
      });
      setQuestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [statusFilter, topicFilter]);

  // Load textbooks
  const loadTextbooks = async () => {
    try {
      const list = await fetchTextbooks();
      setTextbooks(list);
    } catch (err) {
      console.error(err);
    }
  };

  // Load analytics
  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const data = await fetchTeacherAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'textbook') loadTextbooks();
    if (activeTab === 'analytics') loadAnalytics();
  }, [activeTab]);

  const uniqueTopics = Array.from(new Set(questions.map(q => q.topic).filter(Boolean)));

  // Handle Edit / Create Question
  const handleOpenEdit = (q?: Question) => {
    if (q) {
      setEditingQuestion({ ...q });
    } else {
      setEditingQuestion({
        id: `new-${Date.now()}`,
        text: '',
        codeSnippet: '',
        options: { A: '', B: '', C: '', D: '' },
        correctAnswer: '',
        topic: 'Lập trình Python',
        lessonName: '',
        difficulty: 'Thông hiểu',
        status: 'needs_review'
      });
    }
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion || !editingQuestion.text || !editingQuestion.options?.A) return;
    setIsSavingQuestion(true);
    try {
      const saved = await saveQuestion(editingQuestion);
      setEditingQuestion(null);
      loadQuestions();
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu câu hỏi');
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng?')) return;
    try {
      await deleteQuestion(id);
      loadQuestions();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa câu hỏi');
    }
  };

  const handleBatchApprove = async () => {
    try {
      const count = await batchApproveQuestions(selectedQuestionIds.length > 0 ? selectedQuestionIds : undefined);
      alert(`Đã duyệt thành công ${count} câu hỏi có đáp án!`);
      setSelectedQuestionIds([]);
      loadQuestions();
    } catch (err: any) {
      alert(err.message || 'Lỗi duyệt câu hỏi');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedQuestionIds.length === 0) return;
    if (!confirm(`Bạn có chắc muốn xóa ${selectedQuestionIds.length} câu đã chọn?`)) return;
    try {
      await batchDeleteQuestions(selectedQuestionIds);
      setSelectedQuestionIds([]);
      loadQuestions();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa câu hỏi');
    }
  };

  // Generate AI Explanation for editing question
  const handleAIGenerateExplanation = async () => {
    if (!editingQuestion || !editingQuestion.text || !editingQuestion.correctAnswer) {
      alert('Vui lòng chọn đáp án đúng trước khi yêu cầu AI tạo giải thích');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const expl = await generateAIExplanation({
        questionText: editingQuestion.text,
        codeSnippet: editingQuestion.codeSnippet,
        options: editingQuestion.options as any,
        correctAnswer: editingQuestion.correctAnswer as any,
        topic: editingQuestion.topic || 'Tin học 10',
        lessonName: editingQuestion.lessonName
      });
      setEditingQuestion(prev => prev ? ({ ...prev, explanation: expl }) : null);
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo giải thích AI');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Handle Document Upload & AI Parse
  const handleStartParse = async () => {
    if (!importFile && !rawTextImport.trim()) {
      setImportError('Vui lòng chọn tệp (.docx, .pdf, .xlsx, .txt) hoặc nhập nội dung văn bản');
      return;
    }

    setIsParsingDoc(true);
    setImportError('');
    setImportSummary(null);
    setParsedPreviewQuestions([]);

    try {
      const result = await parseDocument(importFile || undefined, rawTextImport.trim() || undefined);
      setParsedPreviewQuestions(result.questions);
      setImportSummary(result.summary);
    } catch (err: any) {
      setImportError(err.message || 'Lỗi trích xuất tài liệu');
    } finally {
      setIsParsingDoc(false);
    }
  };

  // Handle Match Separate Answer Key
  const handleMatchAnswerKey = async () => {
    if (!answerKeyFile && !answerKeyText.trim()) {
      alert('Vui lòng chọn file đáp án hoặc dán nội dung bảng đáp án');
      return;
    }
    setIsMatchingAnswers(true);
    try {
      const answersMap = await matchAnswers(answerKeyFile || undefined, answerKeyText.trim() || undefined);
      // Merge answers into parsed preview questions by index or questionNumber
      setParsedPreviewQuestions(prev => {
        return prev.map((q, idx) => {
          const numKey = (q.questionNumber || (idx + 1)).toString();
          const detectedAnswer = answersMap[numKey] || answersMap[idx + 1];
          if (detectedAnswer && ['A', 'B', 'C', 'D'].includes(detectedAnswer)) {
            return {
              ...q,
              correctAnswer: detectedAnswer as 'A' | 'B' | 'C' | 'D',
              status: 'approved'
            };
          }
          return q;
        });
      });
      alert('Đã ghép thành công bảng đáp án vào danh sách câu hỏi xem trước!');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đọc bảng đáp án');
    } finally {
      setIsMatchingAnswers(false);
    }
  };

  // Commit imported questions
  const handleCommitImport = async () => {
    if (parsedPreviewQuestions.length === 0) return;
    setIsCommittingImport(true);
    try {
      const count = await commitImport(parsedPreviewQuestions);
      alert(`Đã lưu thành công ${count} câu hỏi vào ngân hàng!`);
      setParsedPreviewQuestions([]);
      setImportSummary(null);
      setImportFile(null);
      setRawTextImport('');
      setActiveTab('bank');
      loadQuestions();
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu ngân hàng');
    } finally {
      setIsCommittingImport(false);
    }
  };

  // Save Textbook Topic
  const handleSaveTextbookTopic = async () => {
    if (!newTopic.lessonTitle || !newTopic.chapter) {
      alert('Vui lòng nhập tên bài học và chủ đề');
      return;
    }
    try {
      await saveTextbookTopic(newTopic);
      setNewTopic({
        curriculum: 'Kết nối tri thức',
        chapter: 'Chủ đề 5: Lập trình cơ bản với Python',
        lessonNumber: textbooks.length + 1,
        lessonTitle: '',
        summary: '',
        keyPoints: []
      });
      loadTextbooks();
      alert('Đã lưu bài học vào Kho kiến thức SGK!');
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu bài học');
    }
  };

  const handleDeleteTextbook = async (id: string) => {
    if (!confirm('Xóa tài liệu bài học này?')) return;
    try {
      await deleteTextbookTopic(id);
      loadTextbooks();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa tài liệu');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Khu vực Giáo viên
            </span>
            <span className="text-xs text-slate-400">• Quản lý & Kiểm duyệt đề Tin học 10</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Hệ Thống Quản Trị Ngân Hàng Câu Hỏi
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('bank')}
            className={`px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'bank' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Ngân hàng ({questions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'import' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Nhập tài liệu Word/PDF</span>
          </button>

          <button
            onClick={() => setActiveTab('extracted_docs')}
            className={`px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'extracted_docs' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Tài liệu trích xuất</span>
          </button>

          <button
            onClick={() => setActiveTab('textbook')}
            className={`px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'textbook' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kho kiến thức SGK</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Thống kê học sinh</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: QUESTION BANK ================= */}
      {activeTab === 'bank' && (
        <div className="space-y-6">
          {/* Filters & Actions Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadQuestions()}
                  placeholder="Tìm kiếm nội dung..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="approved">Đã kiểm duyệt</option>
                <option value="needs_review">Cần xác nhận</option>
              </select>

              {/* Topic filter */}
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none cursor-pointer"
              >
                <option value="all">Tất cả chủ đề</option>
                {uniqueTopics.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Batch & Add actions */}
            <div className="flex items-center gap-2">
              {selectedQuestionIds.length > 0 && (
                <>
                  <button
                    onClick={handleBatchApprove}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Duyệt ({selectedQuestionIds.length})</span>
                  </button>

                  <button
                    onClick={handleBatchDelete}
                    className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa ({selectedQuestionIds.length})</span>
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  const exportData = JSON.stringify(questions, null, 2);
                  const blob = new Blob([exportData], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Ngan_Hang_Cau_Hoi_Tin10_${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Tải toàn bộ ngân hàng câu hỏi dạng JSON"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Xuất ngân hàng</span>
              </button>

              <button
                onClick={() => handleOpenEdit()}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm câu hỏi mới</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedQuestionIds.length === questions.length && questions.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedQuestionIds(questions.map(q => q.id));
                          else setSelectedQuestionIds([]);
                        }}
                        className="rounded border-slate-700 bg-slate-900 cursor-pointer"
                      />
                    </th>
                    <th className="p-4 w-12">STT</th>
                    <th className="p-4 min-w-[280px]">Nội dung câu hỏi</th>
                    <th className="p-4 w-20 text-center">Đáp án</th>
                    <th className="p-4 w-36">Chủ đề</th>
                    <th className="p-4 w-28">Mức độ</th>
                    <th className="p-4 w-32">Trạng thái</th>
                    <th className="p-4 w-24 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {questions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        {isLoadingQuestions ? 'Đang tải danh sách câu hỏi...' : 'Chưa có câu hỏi nào trong ngân hàng.'}
                      </td>
                    </tr>
                  ) : (
                    questions.map((q, idx) => {
                      const isSelected = selectedQuestionIds.includes(q.id);
                      return (
                        <tr 
                          key={q.id} 
                          className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-indigo-950/20' : ''}`}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedQuestionIds(prev => [...prev, q.id]);
                                else setSelectedQuestionIds(prev => prev.filter(id => id !== q.id));
                              }}
                              className="rounded border-slate-700 bg-slate-900 cursor-pointer"
                            />
                          </td>
                          <td className="p-4 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-4 font-medium text-white max-w-md">
                            <p className="line-clamp-2">{q.text}</p>
                            {q.codeSnippet && (
                              <div className="mt-1 flex items-center gap-1 text-[11px] text-cyan-400 font-mono">
                                <Code2 className="w-3.5 h-3.5" />
                                <span>Có mã Python</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {q.correctAnswer ? (
                              <span className="font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {q.correctAnswer}
                              </span>
                            ) : (
                              <span className="text-[11px] text-rose-400 italic">Chưa có</span>
                            )}
                          </td>
                          <td className="p-4 text-slate-400 truncate max-w-[150px]">{q.topic}</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              q.difficulty === 'Nhận biết'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                : q.difficulty === 'Thông hiểu'
                                ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                            }`}>
                              {q.difficulty}
                            </span>
                          </td>
                          <td className="p-4">
                            {q.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                Đã duyệt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30">
                                <AlertCircle className="w-3 h-3" />
                                Cần xác nhận
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(q)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                title="Chỉnh sửa câu hỏi & xem giải thích"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB: EXTRACTED DOCUMENTS HISTORY ================= */}
      {activeTab === 'extracted_docs' && (
        <DocumentImportSection 
          initialSubTab="history"
          onImportComplete={loadQuestions}
        />
      )}

      {/* ================= TAB 2: IMPORT WORD / PDF ================= */}
      {activeTab === 'import' && (
        <DocumentImportSection 
          initialSubTab="upload"
          onImportComplete={() => {
            loadQuestions();
            setActiveTab('bank');
          }}
        />
      )}

      {/* ================= TAB 3: TÀI LIỆU THAM KHẢO SGK ================= */}
      {activeTab === 'textbook' && (
        <TextbookReferenceSection />
      )}

      {/* ================= TAB 4: TEACHER ANALYTICS ================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {analytics ? (
            <TeacherPerformanceDashboard
              analytics={analytics}
              onSelectTopicForReview={(topicName) => {
                setTopicFilter(topicName);
                setActiveTab('bank');
              }}
            />
          ) : (
            <div className="text-center py-12 text-slate-500">
              {isLoadingAnalytics ? 'Đang tải dữ liệu báo cáo thống kê...' : 'Chưa có dữ liệu bài làm của học sinh.'}
            </div>
          )}
        </div>
      )}

      {/* ================= EDIT / CREATE QUESTION MODAL ================= */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingQuestion.id?.startsWith('new-') ? 'Thêm câu hỏi mới' : 'Chỉnh sửa câu hỏi & Lời giải AI'}
              </h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Question Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nội dung câu hỏi *</label>
                <textarea
                  rows={3}
                  value={editingQuestion.text || ''}
                  onChange={(e) => setEditingQuestion(prev => prev ? ({ ...prev, text: e.target.value }) : null)}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Code Snippet if any */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Đoạn mã Python (nếu có)</label>
                <textarea
                  rows={3}
                  value={editingQuestion.codeSnippet || ''}
                  onChange={(e) => setEditingQuestion(prev => prev ? ({ ...prev, codeSnippet: e.target.value }) : null)}
                  placeholder="Ví dụ: for i in range(5): print(i)"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xs text-indigo-300 outline-none"
                />
              </div>

              {/* Options A, B, C, D */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['A', 'B', 'C', 'D'] as const).map(k => (
                  <div key={k}>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phương án {k} *</label>
                    <input
                      type="text"
                      value={editingQuestion.options?.[k] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingQuestion(prev => prev ? ({
                          ...prev,
                          options: { ...prev.options!, [k]: val }
                        }) : null);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>

              {/* Meta row: Answer, Topic, Difficulty, Status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Đáp án đúng *</label>
                  <select
                    value={editingQuestion.correctAnswer || ''}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setEditingQuestion(prev => prev ? ({
                        ...prev,
                        correctAnswer: val,
                        status: val ? 'approved' : 'needs_review'
                      }) : null);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-emerald-400 outline-none cursor-pointer"
                  >
                    <option value="">Chưa chọn</option>
                    <option value="A">Phương án A</option>
                    <option value="B">Phương án B</option>
                    <option value="C">Phương án C</option>
                    <option value="D">Phương án D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Chủ đề</label>
                  <input
                    type="text"
                    value={editingQuestion.topic || ''}
                    onChange={(e) => setEditingQuestion(prev => prev ? ({ ...prev, topic: e.target.value }) : null)}
                    placeholder="VD: Lập trình Python"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mức độ</label>
                  <select
                    value={editingQuestion.difficulty || 'Thông hiểu'}
                    onChange={(e) => setEditingQuestion(prev => prev ? ({ ...prev, difficulty: e.target.value as any }) : null)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="Nhận biết">Nhận biết</option>
                    <option value="Thông hiểu">Thông hiểu</option>
                    <option value="Vận dụng">Vận dụng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Trạng thái duyệt</label>
                  <select
                    value={editingQuestion.status || 'needs_review'}
                    onChange={(e) => setEditingQuestion(prev => prev ? ({ ...prev, status: e.target.value as any }) : null)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="approved">Đã kiểm duyệt</option>
                    <option value="needs_review">Cần xác nhận</option>
                  </select>
                </div>
              </div>

              {/* AI Explanation Inspector & Generator */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Nội dung giải thích theo SGK Tin học 10</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAIGenerateExplanation}
                    disabled={isGeneratingAI || !editingQuestion.correctAnswer}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-medium flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingAI ? 'AI đang tạo...' : 'AI sinh lại giải thích'}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Vì sao đáp án đúng:</label>
                  <textarea
                    rows={2}
                    value={editingQuestion.explanation?.whyCorrect || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingQuestion(prev => prev ? ({
                        ...prev,
                        explanation: { ...(prev.explanation || {}), whyCorrect: val } as any
                      }) : null);
                    }}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Kiến thức cốt lõi cần nhớ:</label>
                  <input
                    type="text"
                    value={editingQuestion.explanation?.keyTakeaway || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingQuestion(prev => prev ? ({
                        ...prev,
                        explanation: { ...(prev.explanation || {}), keyTakeaway: val } as any
                      }) : null);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveQuestion}
                disabled={isSavingQuestion}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingQuestion ? 'Đang lưu...' : 'Lưu câu hỏi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
