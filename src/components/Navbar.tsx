import React, { useState } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  ShieldCheck, 
  Sparkles, 
  LogOut, 
  Lock, 
  Upload, 
  FileCheck2, 
  BookMarked, 
  CheckCircle2,
  Menu,
  X,
  FileText
} from 'lucide-react';
import { verifyTeacherPin } from '../services/api.js';

export type AppNavView = 'student' | 'import' | 'extracted_docs' | 'reference' | 'teacher';

interface NavbarProps {
  currentView: AppNavView;
  onViewChange: (view: AppNavView) => void;
  studentName?: string;
  className?: string;
  questionCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  studentName,
  className,
  questionCount
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTeacherClick = () => {
    if (currentView === 'teacher') return;
    const isTeacherAuthed = sessionStorage.getItem('tin10_teacher_authed') === 'true';
    if (isTeacherAuthed) {
      onViewChange('teacher');
    } else {
      setPinInput('');
      setPinError('');
      setShowPinModal(true);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setIsVerifying(true);
    setPinError('');

    try {
      const ok = await verifyTeacherPin(pinInput.trim());
      if (ok) {
        sessionStorage.setItem('tin10_teacher_authed', 'true');
        setShowPinModal(false);
        onViewChange('teacher');
      } else {
        setPinError('Mã PIN chưa chính xác (Mặc định: giaovien123)');
      }
    } catch (err: any) {
      setPinError('Lỗi xác thực, vui lòng thử lại');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQuickFillPin = () => {
    setPinInput('giaovien123');
  };

  const handleLogoutTeacher = () => {
    sessionStorage.removeItem('tin10_teacher_authed');
    onViewChange('student');
  };

  const navItems = [
    {
      id: 'student' as AppNavView,
      label: 'Luyện tập',
      icon: GraduationCap,
      color: 'text-indigo-400',
      activeColor: 'bg-indigo-600 text-white'
    },
    {
      id: 'import' as AppNavView,
      label: 'Import ngân hàng câu hỏi',
      icon: Upload,
      color: 'text-purple-400',
      badge: 'AI Trích xuất',
      activeColor: 'bg-purple-600 text-white'
    },
    {
      id: 'extracted_docs' as AppNavView,
      label: 'Tài liệu trích xuất',
      icon: FileCheck2,
      color: 'text-emerald-400',
      activeColor: 'bg-emerald-600 text-white'
    },
    {
      id: 'reference' as AppNavView,
      label: 'Tài liệu tham khảo SGK',
      icon: BookMarked,
      color: 'text-cyan-400',
      badge: '3 Bộ SGK',
      activeColor: 'bg-cyan-600 text-white'
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div 
            onClick={() => {
              onViewChange('student');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  TIN 10
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  SMART QUIZ
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Ôn tập trắc nghiệm & AI giải thích theo SGK</p>
            </div>
          </div>

          {/* Center Navigation Links - Desktop */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/70 p-1 rounded-2xl border border-slate-800/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? `${item.activeColor} shadow-md` 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.color}`} />
                  <span>{item.label}</span>
                  {item.badge && !isActive && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {currentView === 'student' && studentName && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-300 font-medium truncate max-w-[120px]">{studentName}</span>
                {className && (
                  <span className="text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50 font-bold">
                    {className}
                  </span>
                )}
              </div>
            )}

            {/* Teacher Area Switch */}
            {currentView !== 'teacher' ? (
              <button
                onClick={handleTeacherClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500/50 text-slate-200 hover:text-white text-xs font-semibold transition cursor-pointer shadow-sm"
                title="Quản trị ngân hàng & Phân tích lớp học"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Quản trị Giáo viên</span>
                <span className="sm:hidden">Giáo viên</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/70 border border-purple-800/50 text-xs text-purple-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span className="hidden sm:inline">Khu vực Giáo viên</span>
                </div>
                <button
                  onClick={handleLogoutTeacher}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-800 text-slate-300 hover:text-rose-300 text-xs font-medium transition cursor-pointer"
                  title="Thoát quản trị về giao diện học sinh"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Về học sinh</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    isActive 
                      ? `${item.activeColor}` 
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Teacher Authentication PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4 text-purple-400 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-white mb-1">Xác thực Giáo viên</h3>
            <p className="text-xs text-center text-slate-400 mb-5 leading-relaxed">
              Nhập mã PIN để truy cập trang quản trị ngân hàng câu hỏi, kiểm duyệt và phân tích kết quả học tập.
            </p>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Nhập mã PIN (Mặc định: giaovien123)"
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white text-sm outline-none transition text-center tracking-widest placeholder:tracking-normal placeholder:text-slate-500"
                />
                {pinError && (
                  <p className="text-rose-400 text-xs mt-2 text-center font-medium">{pinError}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition disabled:opacity-50 cursor-pointer"
                >
                  {isVerifying ? 'Đang kiểm tra...' : 'Vào quản trị'}
                </button>
              </div>

              <div className="pt-2 text-center border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleQuickFillPin}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
                >
                  ⚡ Nhấn vào đây để điền nhanh mã mẫu (<code className="font-mono">giaovien123</code>)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
