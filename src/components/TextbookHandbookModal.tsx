import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  X, 
  Search, 
  Bookmark, 
  Lightbulb, 
  ArrowRight, 
  Sparkles,
  Layers
} from 'lucide-react';
import { TextbookTopic } from '../types/quiz.js';
import { fetchTextbooks } from '../services/api.js';

interface TextbookHandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPracticeTopic: (topicName: string) => void;
}

export const TextbookHandbookModal: React.FC<TextbookHandbookModalProps> = ({
  isOpen,
  onClose,
  onPracticeTopic
}) => {
  const [textbooks, setTextbooks] = useState<TextbookTopic[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>('Kết nối tri thức');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTextbooks()
        .then(data => {
          setTextbooks(data);
          if (data.length > 0 && !activeLessonId) {
            setActiveLessonId(data[0].id);
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTopics = textbooks.filter(t => {
    const matchCurriculum = selectedCurriculum === 'all' || t.curriculum === selectedCurriculum;
    const matchSearch = searchQuery.trim() === '' || 
      t.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCurriculum && matchSearch;
  });

  const currentTopic = textbooks.find(t => t.id === activeLessonId) || filteredTopics[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[85vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Sổ Tay Kiến Thức SGK Tin Học 10</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Chuẩn GDPT 2018
                </span>
              </div>
              <p className="text-xs text-slate-400">Tóm tắt lý thuyết, cú pháp và ghi nhớ then chốt theo bài học</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Sidebar list + Detail reader */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: Curriculum selector + Lesson items */}
          <div className="w-full md:w-80 border-r border-slate-800 p-4 flex flex-col gap-3 bg-slate-950/40 shrink-0">
            {/* Curriculum tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
              {['Kết nối tri thức', 'Cánh diều', 'Chân trời'].map((cName) => {
                const fullName = cName === 'Chân trời' ? 'Chân trời sáng tạo' : cName;
                const isSelected = selectedCurriculum === fullName;
                return (
                  <button
                    key={cName}
                    onClick={() => setSelectedCurriculum(fullName)}
                    className={`py-1.5 px-2 rounded-lg font-medium transition cursor-pointer truncate text-center ${
                      isSelected ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cName}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài học..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            {/* Lesson List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredTopics.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Không tìm thấy bài học nào phù hợp.
                </div>
              ) : (
                filteredTopics.map((topic) => {
                  const isActive = topic.id === (currentTopic?.id || activeLessonId);
                  return (
                    <div
                      key={topic.id}
                      onClick={() => setActiveLessonId(topic.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-md'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="text-[10px] text-indigo-400 font-mono block">
                        {topic.chapter}
                      </span>
                      <h4 className="text-xs font-bold mt-0.5 line-clamp-1">{topic.lessonTitle}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{topic.summary}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Active Lesson Reader */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
            {currentTopic ? (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {currentTopic.curriculum}
                    </span>
                    <span className="text-xs text-slate-400">• {currentTopic.chapter}</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white">
                    {currentTopic.lessonTitle}
                  </h2>
                </div>

                {/* Summary Box */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Tóm tắt nội dung bài học</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {currentTopic.summary}
                  </p>
                </div>

                {/* Key Takeaways */}
                {currentTopic.keyPoints && currentTopic.keyPoints.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>Kiến thức then chốt cần ghi nhớ</span>
                    </h4>
                    <div className="space-y-2.5">
                      {currentTopic.keyPoints.map((point, idx) => (
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

                {/* Practice Now Button */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Sẵn sàng thử thách năng lực với bài này?
                  </div>
                  <button
                    onClick={() => {
                      onPracticeTopic(currentTopic.lessonTitle);
                      onClose();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>Luyện tập bài này ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
                <BookOpen className="w-12 h-12 text-slate-600 mb-2" />
                <span>Chọn một bài học từ danh sách bên trái để đọc lý thuyết.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
