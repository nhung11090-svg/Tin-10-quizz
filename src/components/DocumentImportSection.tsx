import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Trash2, 
  Download, 
  Save, 
  Eye, 
  History, 
  RefreshCw, 
  Check, 
  Layers, 
  FileCheck2,
  Code2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Question, ExtractedDocument } from '../types/quiz.js';
import { 
  parseDocument, 
  commitImport, 
  matchAnswers, 
  fetchExtractedDocs, 
  deleteExtractedDoc 
} from '../services/api.js';
import { downloadSampleTemplate } from '../utils/quizUtils.js';

interface DocumentImportSectionProps {
  onImportComplete?: () => void;
  initialSubTab?: 'upload' | 'history';
  onPracticeExtractedQuestions?: (questions: Question[]) => void;
}

export const DocumentImportSection: React.FC<DocumentImportSectionProps> = ({
  onImportComplete,
  initialSubTab = 'upload',
  onPracticeExtractedQuestions
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'history'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  
  // Upload & Extraction State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [rawTextImport, setRawTextImport] = useState('');
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [answerKeyText, setAnswerKeyText] = useState('');
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [parseStep, setParseStep] = useState<string>('');
  const [importError, setImportError] = useState('');
  const [importNotice, setImportNotice] = useState('');
  
  // Extracted preview questions
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

  // Extracted documents history
  const [historyDocs, setHistoryDocs] = useState<ExtractedDocument[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedHistoryDoc, setSelectedHistoryDoc] = useState<ExtractedDocument | null>(null);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const docs = await fetchExtractedDocs();
      setHistoryDocs(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Handle Document Parse
  const handleStartParse = async () => {
    if (!importFile && !rawTextImport.trim()) {
      setImportError('Vui lòng chọn tệp (.docx, .pdf, .xlsx, .txt) hoặc dán nội dung văn bản câu hỏi');
      return;
    }

    setIsParsingDoc(true);
    setParseStep('1/3: Đang đọc nội dung tệp và phân tách cấu trúc...');
    setImportError('');
    setImportNotice('');
    setImportSummary(null);
    setParsedPreviewQuestions([]);

    const stepTimer = setTimeout(() => {
      setParseStep('2/3: AI đang nhận dạng câu hỏi, phương án A-B-C-D và tìm đáp án...');
    }, 1500);

    const stepTimer2 = setTimeout(() => {
      setParseStep('3/3: Kiểm tra trùng lặp với ngân hàng và gắn giải thích SGK...');
    }, 3500);

    try {
      const result = await parseDocument(importFile || undefined, rawTextImport.trim() || undefined);
      setParsedPreviewQuestions(result.questions);
      setImportSummary(result.summary);
      if (result.notice) {
        setImportNotice(result.notice);
      }
      loadHistory();
    } catch (err: any) {
      setImportError(err.message || 'Lỗi khi trích xuất tài liệu từ AI');
    } finally {
      clearTimeout(stepTimer);
      clearTimeout(stepTimer2);
      setIsParsingDoc(false);
      setParseStep('');
    }
  };

  // Handle Match Separate Answer Sheet
  const handleMatchAnswerKey = async () => {
    if (!answerKeyFile && !answerKeyText.trim()) {
      alert('Vui lòng chọn file đáp án hoặc dán chuỗi đáp án');
      return;
    }
    setIsMatchingAnswers(true);
    try {
      const answersMap = await matchAnswers(answerKeyFile || undefined, answerKeyText.trim() || undefined);
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
      alert('Đã ghép thành công bảng đáp án vào danh sách câu hỏi trích xuất!');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đọc bảng đáp án');
    } finally {
      setIsMatchingAnswers(false);
    }
  };

  // Commit imported questions to Database
  const handleCommitImport = async () => {
    if (parsedPreviewQuestions.length === 0) return;
    setIsCommittingImport(true);
    try {
      const count = await commitImport(parsedPreviewQuestions);
      alert(`Đã lưu thành công ${count} câu hỏi vào ngân hàng câu hỏi chính thức!`);
      setParsedPreviewQuestions([]);
      setImportSummary(null);
      setImportFile(null);
      setRawTextImport('');
      if (onImportComplete) onImportComplete();
      loadHistory();
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu câu hỏi');
    } finally {
      setIsCommittingImport(false);
    }
  };

  // Delete Document from History
  const handleDeleteHistoryDoc = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa tài liệu này khỏi lịch sử trích xuất?')) return;
    try {
      await deleteExtractedDoc(id);
      loadHistory();
      if (selectedHistoryDoc?.id === id) {
        setSelectedHistoryDoc(null);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa tài liệu');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Module Tự Động Hóa AI
            </span>
            <span className="text-xs text-slate-400">• Word, PDF, Excel, Text sang trắc nghiệm chuẩn</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Import Ngân Hàng Câu Hỏi & Tài Liệu Trích Xuất
          </h1>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('upload')}
            className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeSubTab === 'upload' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Tải tệp & Trích xuất AI</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('history');
              loadHistory();
            }}
            className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeSubTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch sử tài liệu ({historyDocs.length})</span>
          </button>
        </div>
      </div>

      {/* ================= SUB-TAB 1: UPLOAD & EXTRACTION ================= */}
      {activeSubTab === 'upload' && (
        <div className="space-y-8">
          {/* Main Upload Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                Tải lên tài liệu câu hỏi (Word / PDF / Excel / Text)
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                AI sẽ quét nội dung, tự động trích xuất các câu trắc nghiệm 4 phương án A-B-C-D, tìm đáp án gốc, phát hiện câu hỏi trùng lặp và gắn giải thích kiến thức theo SGK Tin học 10.
              </p>
            </div>

            {/* Drag Drop & Text Input Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Dropzone */}
              <div className="rounded-3xl border-2 border-dashed border-slate-700 hover:border-indigo-500/60 p-6 flex flex-col items-center justify-center text-center transition bg-slate-950/60 group">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Chọn tệp đề thi từ máy tính</h4>
                <p className="text-[11px] text-slate-500 mb-4 max-w-xs">
                  Hỗ trợ định dạng .docx, .pdf, .xlsx, .txt. Nhận diện cả bảng biểu và khối code Python.
                </p>
                <label className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer">
                  <span>Duyệt tệp tài liệu</span>
                  <input
                    type="file"
                    accept=".docx,.pdf,.xlsx,.xls,.txt,.md"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImportFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
                {importFile && (
                  <div className="mt-4 text-xs text-indigo-300 font-medium flex items-center gap-2 bg-indigo-950/50 px-3.5 py-1.5 rounded-xl border border-indigo-500/40">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>{importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              {/* Text Input Option */}
              <div className="space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Hoặc dán trực tiếp nội dung văn bản:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadSampleTemplate('txt')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Tải file mẫu (.txt)</span>
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRawTextImport(`Câu 1: Trong Python, để in một dòng chữ ra màn hình ta dùng hàm nào?
A. echo()
B. write()
C. print()
D. output()
Đáp án: C
Giải thích: Hàm print() là hàm tích hợp sẵn trong Python dùng để xuất dữ liệu ra màn hình chuẩn.

Câu 2: Cho đoạn mã sau:
x = 10
y = 3
print(x % y)
Kết quả in ra là gì?
A. 1
B. 3
C. 3.33
D. 0
Đáp án: A
Giải thích: Toán tử % chia lấy phần dư. 10 chia cho 3 được 3 dư 1.

Câu 3: Phát biểu nào sau đây đúng về danh sách (list) trong Python?
A. Danh sách chỉ chứa các phần tử cùng kiểu số nguyên
B. Danh sách được định nghĩa trong cặp ngoặc nhọn {}
C. Danh sách là kiểu dữ liệu có thể thay đổi (mutable), các phần tử đặt trong cặp ngoặc vuông []
D. Chỉ số của danh sách luôn bắt đầu từ 1
Đáp án: C`);
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Dán câu hỏi mẫu</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={rawTextImport}
                  onChange={(e) => setRawTextImport(e.target.value)}
                  placeholder="Dán nội dung câu hỏi trắc nghiệm tại đây...&#10;Ví dụ:&#10;Câu 1: ...&#10;A. ... B. ... C. ... D. ...&#10;Đáp án: ..."
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-xs font-mono text-white outline-none flex-1"
                />
              </div>
            </div>

            {/* Separate Answer Sheet Merging Box */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>Ghép bảng đáp án riêng (Nếu tài liệu đề thi tách riêng file đáp án)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Nếu file tài liệu chỉ có câu hỏi còn đáp án nằm ở cuối trang hoặc file khác, dán chuỗi đáp án (ví dụ: "1.A, 2.B, 3.C, 4.D...") để hệ thống tự động gắn vào câu hỏi tương ứng.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={answerKeyText}
                  onChange={(e) => setAnswerKeyText(e.target.value)}
                  placeholder="Dán chuỗi đáp án (VD: 1.A, 2.B, 3.C, 4.D, 5.A...)"
                  className="flex-1 min-w-[260px] px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleMatchAnswerKey}
                  disabled={isMatchingAnswers || parsedPreviewQuestions.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 disabled:opacity-40 text-amber-300 border border-amber-500/40 text-xs font-semibold transition cursor-pointer"
                >
                  {isMatchingAnswers ? 'Đang ghép...' : 'Ghép vào câu hỏi trích xuất'}
                </button>
              </div>
            </div>

            {/* Informational / Fallback Notice */}
            {importNotice && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-3">
                <Sparkles className="w-5 h-5 shrink-0 text-amber-400" />
                <span>{importNotice}</span>
              </div>
            )}

            {/* Error Message */}
            {importError && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-400">
                {isParsingDoc && (
                  <span className="text-indigo-400 flex items-center gap-2 font-medium">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{parseStep}</span>
                  </span>
                )}
              </div>

              <button
                onClick={handleStartParse}
                disabled={isParsingDoc || (!importFile && !rawTextImport.trim())}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isParsingDoc ? 'AI đang trích xuất câu hỏi...' : 'Bắt đầu trích xuất bằng AI'}</span>
              </button>
            </div>
          </div>

          {/* Extracted Questions Preview Section */}
          {parsedPreviewQuestions.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-emerald-400" />
                    <span>Kết Quả Trích Xuất ({parsedPreviewQuestions.length} câu hỏi)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Vui lòng kiểm duyệt nội dung và đáp án trước khi lưu vào ngân hàng câu hỏi chính thức.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {onPracticeExtractedQuestions && (
                    <button
                      onClick={() => {
                        const validQuestions = parsedPreviewQuestions.filter(q => !!q.correctAnswer);
                        if (validQuestions.length === 0) {
                          alert('Chưa có câu hỏi nào có đáp án để luyện tập. Hãy điền đáp án trước!');
                          return;
                        }
                        onPracticeExtractedQuestions(validQuestions);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold border border-indigo-500/40 shadow-md flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Luyện tập ngay ({parsedPreviewQuestions.filter(q => !!q.correctAnswer).length} câu có đáp án)</span>
                    </button>
                  )}

                  <button
                    onClick={handleCommitImport}
                    disabled={isCommittingImport}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isCommittingImport ? 'Đang lưu...' : `Lưu tất cả ${parsedPreviewQuestions.length} câu vào ngân hàng`}</span>
                  </button>
                </div>
              </div>

              {/* Extraction Metrics */}
              {importSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Tổng câu nhận diện</span>
                    <span className="text-xl font-bold text-white mt-1 block">{importSummary.totalExtracted} câu</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-emerald-400 block">Đã có đáp án</span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">{importSummary.hasAnswerCount} câu</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-amber-400 block">Cần giáo viên xác nhận</span>
                    <span className="text-xl font-bold text-amber-400 mt-1 block">{importSummary.needsReviewCount} câu</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-rose-400 block">Phát hiện trùng lặp</span>
                    <span className="text-xl font-bold text-rose-400 mt-1 block">{importSummary.duplicateCount} câu</span>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold uppercase">
                    <tr>
                      <th className="p-3.5 w-12 text-center">STT</th>
                      <th className="p-3.5 min-w-[300px]">Nội dung & 4 Phương án</th>
                      <th className="p-3.5 w-36">Đáp án đúng</th>
                      <th className="p-3.5 w-36">Chủ đề</th>
                      <th className="p-3.5 w-32">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-200">
                    {parsedPreviewQuestions.map((q, idx) => (
                      <tr key={q.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 font-mono text-slate-400 text-center">{idx + 1}</td>
                        <td className="p-3.5 space-y-1.5">
                          <p className="font-bold text-white text-xs sm:text-sm">{q.text}</p>
                          {q.codeSnippet && (
                            <pre className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto">
                              <code>{q.codeSnippet}</code>
                            </pre>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300 pt-1">
                            <div><span className="font-bold text-indigo-300">A:</span> {q.options.A}</div>
                            <div><span className="font-bold text-indigo-300">B:</span> {q.options.B}</div>
                            <div><span className="font-bold text-indigo-300">C:</span> {q.options.C}</div>
                            <div><span className="font-bold text-indigo-300">D:</span> {q.options.D}</div>
                          </div>
                          {q.isDuplicate && (
                            <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/40 text-[11px] text-rose-300 font-medium flex items-center gap-1.5 mt-1">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Cảnh báo: Câu hỏi này có nội dung tương đồng với câu đã có trong ngân hàng.</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <select
                            value={q.correctAnswer || ''}
                            onChange={(e) => {
                              const val = e.target.value as 'A' | 'B' | 'C' | 'D' | '';
                              setParsedPreviewQuestions(prev => {
                                const next = [...prev];
                                next[idx] = {
                                  ...next[idx],
                                  correctAnswer: val,
                                  status: val ? 'approved' : 'needs_review'
                                };
                                return next;
                              });
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                              q.correctAnswer
                                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                                : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                            }`}
                          >
                            <option value="">Chưa có</option>
                            <option value="A">Đáp án A</option>
                            <option value="B">Đáp án B</option>
                            <option value="C">Đáp án C</option>
                            <option value="D">Đáp án D</option>
                          </select>
                        </td>
                        <td className="p-3.5">
                          <input
                            type="text"
                            value={q.topic}
                            onChange={(e) => {
                              const val = e.target.value;
                              setParsedPreviewQuestions(prev => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], topic: val };
                                return next;
                              });
                            }}
                            className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                          />
                        </td>
                        <td className="p-3.5">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SUB-TAB 2: EXTRACTED DOCUMENTS HISTORY ================= */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Danh Sách Tài Liệu Đã Trích Xuất</h3>
                <p className="text-xs text-slate-400">
                  Lưu trữ các tệp Word, PDF, Excel đã từng tải lên và cho phép xem lại các câu hỏi đã trích xuất
                </p>
              </div>

              <button
                onClick={loadHistory}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Làm mới lịch sử"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Document List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historyDocs.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-500 text-xs">
                  Chưa có tài liệu nào trong lịch sử trích xuất.
                </div>
              ) : (
                historyDocs.map((doc) => (
                  <div 
                    key={doc.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 transition space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                          {doc.fileType === 'pdf' ? (
                            <FileText className="w-5 h-5 text-rose-400" />
                          ) : doc.fileType === 'xlsx' || doc.fileType === 'xls' ? (
                            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <FileText className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">{doc.fileName}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(doc.uploadedAt).toLocaleString('vi-VN')} • {(doc.fileSize / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteHistoryDoc(doc.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 transition cursor-pointer"
                        title="Xóa tài liệu này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-800/80">
                      <div className="p-2 rounded-xl bg-slate-900">
                        <span className="text-[10px] text-slate-400 block">Đã trích xuất</span>
                        <span className="text-xs font-bold text-white mt-0.5 block">{doc.totalExtracted} câu</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900">
                        <span className="text-[10px] text-emerald-400 block">Có đáp án</span>
                        <span className="text-xs font-bold text-emerald-400 mt-0.5 block">{doc.hasAnswerCount} câu</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900">
                        <span className="text-[10px] text-amber-400 block">Cần xác nhận</span>
                        <span className="text-xs font-bold text-amber-400 mt-0.5 block">{doc.needsReviewCount} câu</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedHistoryDoc(doc);
                        setParsedPreviewQuestions(doc.questions || []);
                        setImportSummary({
                          totalExtracted: doc.totalExtracted,
                          hasAnswerCount: doc.hasAnswerCount,
                          needsReviewCount: doc.needsReviewCount,
                          duplicateCount: doc.duplicateCount,
                          sourceFile: doc.fileName
                        });
                        setActiveSubTab('upload');
                      }}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Xem & nạp câu hỏi vào bảng duyệt</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
