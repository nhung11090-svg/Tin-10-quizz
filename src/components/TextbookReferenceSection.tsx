import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Upload, 
  Search, 
  Sparkles, 
  Plus, 
  Trash2, 
  Layers, 
  Lightbulb, 
  FileText, 
  Check, 
  X, 
  ArrowRight, 
  Code2, 
  ShieldCheck, 
  Wifi, 
  Cpu, 
  BookMarked
} from 'lucide-react';
import { TextbookTopic } from '../types/quiz.js';
import { 
  fetchTextbooks, 
  saveTextbookTopic, 
  deleteTextbookTopic, 
  uploadReferenceDocument 
} from '../services/api.js';

interface TextbookReferenceSectionProps {
  onPracticeLesson?: (lessonTitle: string) => void;
  initialTab?: 'lessons' | 'upload_ref' | 'cheatsheet';
}

export const TextbookReferenceSection: React.FC<TextbookReferenceSectionProps> = ({
  onPracticeLesson,
  initialTab = 'lessons'
}) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'upload_ref' | 'cheatsheet'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [textbooks, setTextbooks] = useState<TextbookTopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<TextbookTopic | null>(null);

  // Upload Reference File State
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refText, setRefText] = useState('');
  const [uploadCurriculum, setUploadCurriculum] = useState('Kết nối tri thức');
  const [isUploadingRef, setIsUploadingRef] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // Manual Add Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTopic, setNewTopic] = useState<Partial<TextbookTopic>>({
    curriculum: 'Kết nối tri thức',
    chapter: 'Chủ đề 5: Lập trình cơ bản với Python',
    lessonNumber: 1,
    lessonTitle: '',
    summary: '',
    keyPoints: []
  });
  const [keyPointInput, setKeyPointInput] = useState('');

  const loadTextbooks = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTextbooks();
      setTextbooks(data);
      if (data.length > 0 && !selectedLesson) {
        setSelectedLesson(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTextbooks();
  }, []);

  const filteredTextbooks = textbooks.filter(t => {
    const matchCurriculum = selectedCurriculum === 'all' || t.curriculum === selectedCurriculum;
    const matchSearch = searchQuery.trim() === '' ||
      t.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCurriculum && matchSearch;
  });

  // Handle Upload Reference Document
  const handleUploadReference = async () => {
    if (!refFile && !refText.trim()) {
      alert('Vui lòng chọn tệp (.docx, .pdf, .txt) hoặc dán văn bản trích đoạn');
      return;
    }
    setIsUploadingRef(true);
    setUploadMessage('AI đang phân tích tài liệu và cấu trúc thành bài học SGK...');
    try {
      const createdTopic = await uploadReferenceDocument(
        refFile || undefined,
        refText.trim() || undefined,
        uploadCurriculum
      );
      setUploadMessage('Tải lên và xử lý tài liệu tham chiếu thành công!');
      setRefFile(null);
      setRefText('');
      loadTextbooks();
      setSelectedLesson(createdTopic);
      setActiveTab('lessons');
    } catch (err: any) {
      alert(err.message || 'Lỗi xử lý tài liệu');
    } finally {
      setIsUploadingRef(false);
    }
  };

  // Handle Save Manual Topic
  const handleSaveManualTopic = async () => {
    if (!newTopic.lessonTitle || !newTopic.chapter) {
      alert('Vui lòng nhập tên bài học và chủ đề');
      return;
    }
    try {
      await saveTextbookTopic(newTopic);
      setShowAddModal(false);
      setNewTopic({
        curriculum: 'Kết nối tri thức',
        chapter: 'Chủ đề 5: Lập trình cơ bản với Python',
        lessonNumber: textbooks.length + 1,
        lessonTitle: '',
        summary: '',
        keyPoints: []
      });
      loadTextbooks();
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu bài học');
    }
  };

  // Delete Topic
  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Xóa tài liệu bài học này khỏi Kho tham khảo?')) return;
    try {
      await deleteTextbookTopic(id);
      loadTextbooks();
      if (selectedLesson?.id === id) {
        setSelectedLesson(null);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa bài học');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Nguồn Tham Chiếu Chuẩn SGK
            </span>
            <span className="text-xs text-slate-400">• Kết nối tri thức, Cánh diều, Chân trời sáng tạo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Kho Kiến Thức & Tài Liệu Tham Khảo Tin Học 10
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'lessons' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bài học SGK ({textbooks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upload_ref')}
            className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'upload_ref' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Tải lên tài liệu tham chiếu</span>
          </button>

          <button
            onClick={() => setActiveTab('cheatsheet')}
            className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'cheatsheet' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>Sổ tay tra cứu nhanh</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: LESSONS & THEORY VIEWER ================= */}
      {activeTab === 'lessons' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex flex-wrap items-center gap-3">
              {/* Curriculum Selector */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
                {(['all', 'Kết nối tri thức', 'Cánh diều', 'Chân trời sáng tạo'] as const).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setSelectedCurriculum(curr)}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                      selectedCurriculum === curr 
                        ? 'bg-indigo-600 text-white shadow' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {curr === 'all' ? 'Tất cả bộ sách' : curr}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm bài học..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm bài học thủ công</span>
            </button>
          </div>

          {/* Master-Detail Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Lesson Cards List */}
            <div className="lg:col-span-5 space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {filteredTextbooks.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">
                  Không tìm thấy bài học nào phù hợp.
                </div>
              ) : (
                filteredTextbooks.map((tb) => {
                  const isSelected = selectedLesson?.id === tb.id;
                  return (
                    <div
                      key={tb.id}
                      onClick={() => setSelectedLesson(tb)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 text-left ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500'
                          : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {tb.curriculum}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTopic(tb.id);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                          title="Xóa bài học"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="text-sm font-bold text-white line-clamp-1">{tb.lessonTitle}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{tb.summary}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Detailed Lesson Viewer */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              {selectedLesson ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {selectedLesson.curriculum}
                      </span>
                      <span className="text-xs text-slate-400">• {selectedLesson.chapter}</span>
                    </div>
                    <h2 className="text-2xl font-black text-white">
                      {selectedLesson.lessonTitle}
                    </h2>
                  </div>

                  {/* Summary Box */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>Nội dung lý thuyết trọng tâm</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {selectedLesson.summary}
                    </p>
                  </div>

                  {/* Key Takeaways */}
                  {selectedLesson.keyPoints && selectedLesson.keyPoints.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        <span>Kiến thức then chốt cần ghi nhớ</span>
                      </h4>
                      <div className="space-y-2.5">
                        {selectedLesson.keyPoints.map((point, idx) => (
                          <div 
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 flex items-start gap-3"
                          >
                            <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Practice Action */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Nguồn tham chiếu được AI dùng ưu tiên khi sinh lời giải
                    </span>
                    {onPracticeLesson && (
                      <button
                        onClick={() => onPracticeLesson(selectedLesson.lessonTitle)}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
                      >
                        <span>Luyện tập câu hỏi bài này</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500 text-xs">
                  Chọn một bài học từ danh sách bên trái để đọc chi tiết.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: UPLOAD REFERENCE DOCUMENT ================= */}
      {activeTab === 'upload_ref' && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              Tải Lên Tài Liệu Tham Chiếu & Giáo Án
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tải lên tài liệu Word, PDF, giáo án hoặc trích đoạn SGK chính thống. Hệ thống AI sẽ đọc hiểu, tự động trích xuất tiêu đề bài học, chương và các ý then chốt để bổ sung vào Kho kiến thức SGK.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bộ sách giáo khoa áp dụng</label>
              <select
                value={uploadCurriculum}
                onChange={(e) => setUploadCurriculum(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none cursor-pointer"
              >
                <option value="Kết nối tri thức">Kết nối tri thức với cuộc sống</option>
                <option value="Cánh diều">Cánh diều</option>
                <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
              </select>
            </div>

            {/* File Dropzone */}
            <div className="rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500 p-6 text-center bg-slate-950/60">
              <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-white mb-1">Chọn tệp tài liệu tham chiếu</p>
              <p className="text-[11px] text-slate-500 mb-3">Hỗ trợ tệp Word (.docx), PDF (.pdf) hoặc Text (.txt)</p>
              <label className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition cursor-pointer">
                <span>Chọn tệp từ máy tính</span>
                <input
                  type="file"
                  accept=".docx,.pdf,.txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setRefFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
              {refFile && (
                <div className="mt-3 text-xs text-indigo-300 font-medium flex items-center justify-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>{refFile.name} ({(refFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            {/* Text input option */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Hoặc dán trực tiếp trích đoạn lý thuyết SGK / giáo án:
              </label>
              <textarea
                rows={5}
                value={refText}
                onChange={(e) => setRefText(e.target.value)}
                placeholder="Dán nội dung bài học hoặc ghi chú kiến thức tại đây..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none font-mono"
              />
            </div>

            {uploadMessage && (
              <p className="text-xs text-indigo-300 font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>{uploadMessage}</span>
              </p>
            )}

            <button
              onClick={handleUploadReference}
              disabled={isUploadingRef || (!refFile && !refText.trim())}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isUploadingRef ? 'AI đang phân tích & cấu trúc bài học...' : 'Trích xuất & Lưu vào Kho SGK'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 3: QUICK CHEAT-SHEET ================= */}
      {activeTab === 'cheatsheet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Python Basics */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-indigo-400">
                <Code2 className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Cú Pháp & Biến Python</h3>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li><strong className="text-indigo-300">Tên biến:</strong> Chỉ dùng chữ, số, gạch dưới. <em>Không bắt đầu bằng số</em>. Có phân biệt hoa thường.</li>
                <li><strong className="text-indigo-300">Kiểu dữ liệu:</strong> <code className="font-mono text-cyan-300">int</code> (nguyên), <code className="font-mono text-cyan-300">float</code> (thực), <code className="font-mono text-cyan-300">str</code> (xâu), <code className="font-mono text-cyan-300">bool</code> (logic).</li>
                <li><strong className="text-indigo-300">Toán tử:</strong> <code className="font-mono text-cyan-300">//</code> là chia nguyên, <code className="font-mono text-cyan-300">%</code> là chia dư, <code className="font-mono text-cyan-300">**</code> là lũy thừa.</li>
                <li><strong className="text-indigo-300">So sánh:</strong> <code className="font-mono text-cyan-300">==</code> (so sánh bằng), <code className="font-mono text-cyan-300">!=</code> (khác), <code className="font-mono text-cyan-300">=</code> (lệnh gán).</li>
              </ul>
            </div>

            {/* Card 2: Loops & Lists */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-purple-400">
                <Layers className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Vòng Lặp & Danh Sách</h3>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li><strong className="text-purple-300">range(n):</strong> 0 đến n - 1 (không bao gồm n).</li>
                <li><strong className="text-purple-300">range(a, b, step):</strong> Từ a đến trước b với bước nhảy step.</li>
                <li><strong className="text-purple-300">List indexing:</strong> Bắt đầu từ 0 (hoặc -1 cho phần tử cuối).</li>
                <li><strong className="text-purple-300">Phương thức:</strong> <code className="font-mono text-cyan-300">append(x)</code> thêm cuối, <code className="font-mono text-cyan-300">len(ds)</code> đếm số phần tử.</li>
              </ul>
            </div>

            {/* Card 3: Networks & Security */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-emerald-400">
                <Wifi className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Mạng & An Ninh Mạng</h3>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li><strong className="text-emerald-300">Router:</strong> Định tuyến giữa các mạng khác nhau (LAN đến Internet).</li>
                <li><strong className="text-emerald-300">Switch:</strong> Chuyển tiếp khung dữ liệu nội bộ mạng LAN theo MAC.</li>
                <li><strong className="text-emerald-300">Thông tin vs Dữ liệu:</strong> Dữ liệu là dạng thô; thông tin là ý nghĩa rút ra sau xử lý.</li>
                <li><strong className="text-emerald-300">Luật An ninh mạng:</strong> Cấm chia sẻ thông tin đời tư trái phép, tin sai sự thật.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Lesson Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Thêm Bài Học SGK Thủ Công</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Bộ sách</label>
                <select
                  value={newTopic.curriculum}
                  onChange={(e) => setNewTopic(prev => ({ ...prev, curriculum: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none"
                >
                  <option value="Kết nối tri thức">Kết nối tri thức</option>
                  <option value="Cánh diều">Cánh diều</option>
                  <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Chủ đề</label>
                <input
                  type="text"
                  value={newTopic.chapter}
                  onChange={(e) => setNewTopic(prev => ({ ...prev, chapter: e.target.value }))}
                  placeholder="VD: Chủ đề 5: Lập trình cơ bản với Python"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Tên bài học</label>
                <input
                  type="text"
                  value={newTopic.lessonTitle}
                  onChange={(e) => setNewTopic(prev => ({ ...prev, lessonTitle: e.target.value }))}
                  placeholder="VD: Bài 16: Ngôn ngữ lập trình bậc cao"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Tóm tắt lý thuyết</label>
                <textarea
                  rows={3}
                  value={newTopic.summary}
                  onChange={(e) => setNewTopic(prev => ({ ...prev, summary: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveManualTopic}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
              >
                Lưu bài học
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
