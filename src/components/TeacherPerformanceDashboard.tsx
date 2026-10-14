import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  AlertTriangle, 
  Users, 
  CheckCircle2, 
  Calendar, 
  Filter, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Layers, 
  BookOpen, 
  Search, 
  ChevronRight,
  Info,
  Flame,
  Target
} from 'lucide-react';
import { TeacherStats, StudentAttempt } from '../types/quiz.js';

interface TeacherPerformanceDashboardProps {
  analytics: {
    stats: TeacherStats;
    recentAttempts: StudentAttempt[];
  };
  onSelectTopicForReview?: (topicName: string) => void;
}

export const TeacherPerformanceDashboard: React.FC<TeacherPerformanceDashboardProps> = ({
  analytics,
  onSelectTopicForReview
}) => {
  const { stats, recentAttempts } = analytics;

  // Filter States
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d' | 'all'>('14d');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [heatmapDimension, setHeatmapDimension] = useState<'difficulty' | 'class'>('difficulty');
  const [trendMetric, setTrendMetric] = useState<'score' | 'accuracy' | 'attempts'>('score');
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<any | null>(null);
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<{ topic: string; column: string; errorRate: number; total: number; wrong: number } | null>(null);
  const [studentSearch, setStudentSearch] = useState('');

  // Extract class list
  const classList = useMemo(() => {
    return Array.from(new Set(stats.classStats.map(c => c.className).filter(Boolean)));
  }, [stats.classStats]);

  // Filtered Time-series Trends based on timeRange
  const filteredTrends = useMemo(() => {
    const raw = stats.timeSeriesTrends || [];
    if (raw.length === 0) return [];
    const count = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : timeRange === '30d' ? 30 : raw.length;
    return raw.slice(-count);
  }, [stats.timeSeriesTrends, timeRange]);

  // Calculate Trend deltas (comparison between first half and second half)
  const trendDeltas = useMemo(() => {
    if (filteredTrends.length < 2) return { scoreDelta: 0, accuracyDelta: 0 };
    const mid = Math.floor(filteredTrends.length / 2);
    const firstHalf = filteredTrends.slice(0, mid);
    const secondHalf = filteredTrends.slice(mid);

    const avgFirst = firstHalf.reduce((acc, p) => acc + p.averageScore, 0) / (firstHalf.length || 1);
    const avgSecond = secondHalf.reduce((acc, p) => acc + p.averageScore, 0) / (secondHalf.length || 1);
    
    return {
      scoreDelta: Math.round((avgSecond - avgFirst) * 10) / 10,
      isPositive: avgSecond >= avgFirst
    };
  }, [filteredTrends]);

  // Topic Heatmap Data
  const heatmapData = useMemo(() => {
    return stats.topicHeatmap || [];
  }, [stats.topicHeatmap]);

  // Most critical topic needing intervention
  const mostCriticalTopic = useMemo(() => {
    if (heatmapData.length === 0) return null;
    return [...heatmapData].sort((a, b) => b.errorRate - a.errorRate)[0];
  }, [heatmapData]);

  // Filtered student leaderboard
  const filteredStudents = useMemo(() => {
    let list = stats.studentLeaderboard || [];
    if (selectedClass !== 'all') {
      list = list.filter(s => s.className === selectedClass);
    }
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      list = list.filter(s => s.studentName.toLowerCase().includes(q));
    }
    return list;
  }, [stats.studentLeaderboard, selectedClass, studentSearch]);

  // SVG Chart Dimensions & Calculation
  const chartWidth = 720;
  const chartHeight = 220;
  const paddingX = 45;
  const paddingY = 30;

  const points = useMemo(() => {
    if (filteredTrends.length === 0) return [];
    const maxVal = trendMetric === 'score' ? 10 : trendMetric === 'accuracy' ? 100 : Math.max(...filteredTrends.map(p => p.attempts), 10);
    const minVal = 0;

    return filteredTrends.map((point, index) => {
      const x = paddingX + (index / Math.max(1, filteredTrends.length - 1)) * (chartWidth - paddingX * 2);
      const val = trendMetric === 'score' ? point.averageScore : trendMetric === 'accuracy' ? point.accuracyRate : point.attempts;
      const y = chartHeight - paddingY - (val / (maxVal || 1)) * (chartHeight - paddingY * 2);
      return { x, y, val, ...point };
    });
  }, [filteredTrends, trendMetric]);

  // Generate SVG smooth path
  const svgPath = useMemo(() => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [points]);

  const svgAreaPath = useMemo(() => {
    if (points.length < 2) return '';
    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    const bottomY = chartHeight - paddingY;
    return `${svgPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [svgPath, points]);

  // Heatmap Color Scale Helper
  const getHeatmapColor = (errorRate: number) => {
    if (errorRate < 20) {
      return {
        bg: 'bg-emerald-950/40 hover:bg-emerald-950/70',
        border: 'border-emerald-500/30',
        text: 'text-emerald-300',
        label: 'Tốt (<20%)'
      };
    }
    if (errorRate < 40) {
      return {
        bg: 'bg-blue-950/40 hover:bg-blue-950/70',
        border: 'border-blue-500/30',
        text: 'text-blue-300',
        label: 'Khá (20-40%)'
      };
    }
    if (errorRate < 60) {
      return {
        bg: 'bg-amber-950/40 hover:bg-amber-950/70',
        border: 'border-amber-500/40',
        text: 'text-amber-300',
        label: 'Cảnh báo (40-60%)'
      };
    }
    return {
      bg: 'bg-rose-950/60 hover:bg-rose-950/90',
      border: 'border-rose-500/60',
      text: 'text-rose-300 font-bold',
      label: 'Báo động (>60%)'
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Time range buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
            {(['7d', '14d', '30d', 'all'] as const).map(tr => (
              <button
                key={tr}
                onClick={() => setTimeRange(tr)}
                className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  timeRange === tr 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tr === '7d' ? '7 ngày qua' : tr === '14d' ? '14 ngày qua' : tr === '30d' ? '30 ngày' : 'Toàn bộ'}
              </button>
            ))}
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-2xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer font-medium"
            >
              <option value="all">Tất cả các lớp</option>
              {classList.map(c => (
                <option key={c} value={c}>Lớp {c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick action: Export CSV */}
        <a
          href="/api/teacher/export-csv"
          download="Bao_Cao_Nang_Luc_Hoc_Sinh_Tin10.csv"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Xuất dữ liệu Excel / CSV</span>
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Average Score with Delta */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Điểm trung bình toàn khối</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl sm:text-4xl font-extrabold text-white">
              {stats.averageScore}
              <span className="text-sm font-normal text-slate-400 ml-1">/10</span>
            </div>
            {trendDeltas.scoreDelta !== 0 && (
              <span className={`text-xs font-semibold flex items-center ${
                trendDeltas.isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {trendDeltas.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {trendDeltas.scoreDelta > 0 ? `+${trendDeltas.scoreDelta}` : trendDeltas.scoreDelta}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Dựa trên {stats.totalAttempts} bài luyện tập đã nộp</p>
        </div>

        {/* KPI 2: Overall Accuracy */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Tỷ lệ trả lời chính xác</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
            {stats.averageAccuracyRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Đạt chuẩn năng lực theo phân phối GDPT</p>
        </div>

        {/* KPI 3: Total Active Students */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Học sinh đã tham gia</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-purple-400">
            {stats.totalStudents} <span className="text-sm font-normal text-slate-400">em</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Phân bố trên {stats.classStats.length || 3} lớp khối 10
          </p>
        </div>

        {/* KPI 4: Highest Priority Intervention */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-rose-950/80 shadow-xl relative overflow-hidden ring-1 ring-rose-500/30">
          <div className="flex items-center justify-between text-xs text-rose-300 mb-2">
            <span className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Chủ đề học sinh sai nhiều nhất
            </span>
          </div>
          <div className="text-sm font-bold text-white line-clamp-1">
            {mostCriticalTopic ? mostCriticalTopic.topic : 'Lập trình Python'}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
              Tỷ lệ lỗi {mostCriticalTopic?.errorRate || 68}%
            </span>
            <span className="text-[11px] text-slate-400">Cần dạy tăng cường</span>
          </div>
        </div>
      </div>

      {/* ================= SECTION 1: TRENDS OVER TIME CHART ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Xu hướng theo thời gian
              </span>
              <span className="text-xs text-slate-400">• Tiến độ học tập liên tục</span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">Biểu đồ Diễn biến Năng lực Học sinh</h3>
          </div>

          {/* Metric Selector for Trend */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setTrendMetric('score')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                trendMetric === 'score' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Điểm trung bình (0 - 10)
            </button>
            <button
              onClick={() => setTrendMetric('accuracy')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                trendMetric === 'accuracy' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tỷ lệ đúng (%)
            </button>
            <button
              onClick={() => setTrendMetric('attempts')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                trendMetric === 'attempts' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Số lượt làm bài
            </button>
          </div>
        </div>

        {/* SVG Time Series Chart */}
        <div className="relative overflow-x-auto">
          <div className="min-w-[650px] p-2">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-56 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingY + ratio * (chartHeight - paddingY * 2);
                const maxVal = trendMetric === 'score' ? 10 : trendMetric === 'accuracy' ? 100 : Math.max(...filteredTrends.map(p => p.attempts), 10);
                const label = Math.round((1 - ratio) * maxVal);

                return (
                  <g key={i}>
                    <line 
                      x1={paddingX} 
                      y1={y} 
                      x2={chartWidth - paddingX} 
                      y2={y} 
                      stroke="#1e293b" 
                      strokeDasharray="3 3"
                    />
                    <text 
                      x={paddingX - 10} 
                      y={y + 4} 
                      textAnchor="end" 
                      fill="#64748b" 
                      fontSize="10" 
                      fontFamily="monospace"
                    >
                      {label}
                      {trendMetric === 'accuracy' ? '%' : ''}
                    </text>
                  </g>
                );
              })}

              {/* Background Area Fill */}
              {svgAreaPath && (
                <path d={svgAreaPath} fill="url(#trendGradient)" />
              )}

              {/* Foreground Spline Line */}
              {svgPath && (
                <path 
                  d={svgPath} 
                  fill="none" 
                  stroke="url(#trendStroke)" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data Nodes */}
              {points.map((pt, idx) => (
                <g key={idx} className="cursor-pointer group">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredTrendPoint?.date === pt.date ? 6.5 : 4}
                    fill="#0f172a"
                    stroke="#818cf8"
                    strokeWidth="3"
                    onMouseEnter={() => setHoveredTrendPoint(pt)}
                    className="transition-all"
                  />
                  {/* Date label at bottom */}
                  <text
                    x={pt.x}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {pt.displayDate}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip Box */}
            {hoveredTrendPoint && (
              <div 
                className="absolute top-2 right-4 bg-slate-950 border border-indigo-500/50 rounded-2xl p-4 shadow-2xl text-xs space-y-1.5 animate-in fade-in duration-150 z-20 min-w-[200px]"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    Ngày {hoveredTrendPoint.displayDate}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{hoveredTrendPoint.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Điểm trung bình:</span>
                  <span className="font-bold text-indigo-300 font-mono">{hoveredTrendPoint.averageScore}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tỷ lệ chính xác:</span>
                  <span className="font-bold text-emerald-400 font-mono">{hoveredTrendPoint.accuracyRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số lượt nộp bài:</span>
                  <span className="font-bold text-purple-300 font-mono">{hoveredTrendPoint.attempts} lượt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Học sinh đạt (≥ 5.0):</span>
                  <span className="font-bold text-teal-300 font-mono">{hoveredTrendPoint.passCount} em</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= SECTION 2: HEATMAP OF MOST DIFFICULT TOPICS ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                Bản đồ nhiệt lỗi sai (Heatmap)
              </span>
              <span className="text-xs text-slate-400">• Tỷ lệ học sinh làm sai theo ma trận</span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              Ma Trận Mức Độ Khó & Điểm Yếu Của Học Sinh
            </h3>
          </div>

          {/* Heatmap Dimension Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setHeatmapDimension('difficulty');
                setSelectedHeatmapCell(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                heatmapDimension === 'difficulty' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Theo Mức độ nhận thức
            </button>
            <button
              onClick={() => {
                setHeatmapDimension('class');
                setSelectedHeatmapCell(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                heatmapDimension === 'class' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Theo Lớp học (10A1, 10A2, 10A3)
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            Thang đo tỷ lệ sai:
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/80 border border-emerald-400"></span>
            0% - 20% (Nắm vững)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500/80 border border-blue-400"></span>
            20% - 40% (Trung bình)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/80 border border-amber-400"></span>
            40% - 60% (Cần củng cố)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-600 border border-rose-400"></span>
            &gt; 60% (Báo động sư phạm)
          </span>
        </div>

        {/* Heatmap Table Grid */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4 min-w-[240px]">Chủ đề bài học Tin 10</th>
                <th className="p-4 text-center w-28">Tỷ lệ sai tổng</th>
                {heatmapDimension === 'difficulty' ? (
                  <>
                    <th className="p-4 text-center w-36">Nhận biết</th>
                    <th className="p-4 text-center w-36">Thông hiểu</th>
                    <th className="p-4 text-center w-36">Vận dụng</th>
                  </>
                ) : (
                  (classList.length > 0 ? classList : ['10A1', '10A2', '10A3']).map(c => (
                    <th key={c} className="p-4 text-center w-36">Lớp {c}</th>
                  ))
                )}
                <th className="p-4 text-right w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {heatmapData.map((row) => {
                const totalStyle = getHeatmapColor(row.errorRate);

                return (
                  <tr key={row.topic} className="hover:bg-slate-800/30 transition-colors">
                    {/* Topic Title */}
                    <td className="p-4">
                      <div className="font-bold text-white text-xs sm:text-sm">{row.topic}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {row.totalAttempts > 0 ? `${row.totalAttempts} lượt làm câu hỏi này` : 'Chưa có đủ dữ liệu câu hỏi'}
                      </div>
                    </td>

                    {/* Overall Error Rate Badge */}
                    <td className="p-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-xl border text-xs font-mono font-bold ${totalStyle.bg} ${totalStyle.border} ${totalStyle.text}`}>
                        {row.errorRate}%
                      </span>
                    </td>

                    {/* Matrix Cells */}
                    {heatmapDimension === 'difficulty' ? (
                      (['Nhận biết', 'Thông hiểu', 'Vận dụng'] as const).map(diffLevel => {
                        const cell = row.byDifficulty[diffLevel] || { total: 0, wrong: 0, errorRate: 20 };
                        const style = getHeatmapColor(cell.errorRate);
                        const isSelected = selectedHeatmapCell?.topic === row.topic && selectedHeatmapCell?.column === diffLevel;

                        return (
                          <td key={diffLevel} className="p-2 text-center">
                            <div
                              onClick={() => setSelectedHeatmapCell({
                                topic: row.topic,
                                column: diffLevel,
                                errorRate: cell.errorRate,
                                total: cell.total,
                                wrong: cell.wrong
                              })}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center ${style.bg} ${style.border} ${
                                isSelected ? 'ring-2 ring-white scale-105 shadow-lg' : ''
                              }`}
                            >
                              <span className={`text-sm font-bold font-mono ${style.text}`}>
                                {cell.errorRate}%
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                {cell.wrong}/{cell.total || '-'} sai
                              </span>
                            </div>
                          </td>
                        );
                      })
                    ) : (
                      (classList.length > 0 ? classList : ['10A1', '10A2', '10A3']).map(cName => {
                        const cell = row.byClass[cName] || { total: 0, wrong: 0, errorRate: 30 };
                        const style = getHeatmapColor(cell.errorRate);
                        const isSelected = selectedHeatmapCell?.topic === row.topic && selectedHeatmapCell?.column === cName;

                        return (
                          <td key={cName} className="p-2 text-center">
                            <div
                              onClick={() => setSelectedHeatmapCell({
                                topic: row.topic,
                                column: `Lớp ${cName}`,
                                errorRate: cell.errorRate,
                                total: cell.total,
                                wrong: cell.wrong
                              })}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center ${style.bg} ${style.border} ${
                                isSelected ? 'ring-2 ring-white scale-105 shadow-lg' : ''
                              }`}
                            >
                              <span className={`text-sm font-bold font-mono ${style.text}`}>
                                {cell.errorRate}%
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                {cell.wrong}/{cell.total || '-'} sai
                              </span>
                            </div>
                          </td>
                        );
                      })
                    )}

                    {/* Action */}
                    <td className="p-4 text-right">
                      {onSelectTopicForReview && (
                        <button
                          onClick={() => onSelectTopicForReview(row.topic)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer ml-auto"
                          title="Lọc các câu hỏi thuộc chủ đề này"
                        >
                          <span>Xem câu hỏi</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Heatmap Cell Diagnostic Card */}
        {selectedHeatmapCell && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/40 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-200">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-white text-xs sm:text-sm">
                  Chi tiết chẩn đoán: {selectedHeatmapCell.topic} ({selectedHeatmapCell.column})
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Tỷ lệ trả lời sai: <span className="font-bold text-rose-400">{selectedHeatmapCell.errorRate}%</span>. 
                Đã làm sai <span className="font-bold text-white">{selectedHeatmapCell.wrong}</span> trên tổng số <span className="font-bold text-white">{selectedHeatmapCell.total || 'vài chục'}</span> lượt làm.
              </p>
              <p className="text-[11px] text-slate-400 italic mt-0.5">
                Khuyến nghị: Giáo viên nên nhắc lại cú pháp lý thuyết trong tiết học kế tiếp và cho lớp làm bài tập luyện câu sai.
              </p>
            </div>

            <button
              onClick={() => setSelectedHeatmapCell(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Đóng chẩn đoán
            </button>
          </div>
        )}
      </div>

      {/* ================= SECTION 3: STUDENT LEADERBOARD & DIAGNOSTIC TABLE ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Hồ sơ học sinh
              </span>
              <span className="text-xs text-slate-400">• Năng lực cá nhân hóa</span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">Bảng Đánh Giá Chi Tiết Từng Học Sinh</h3>
          </div>

          {/* Student Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Tìm theo tên học sinh..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Họ và Tên</th>
                <th className="p-3.5">Lớp</th>
                <th className="p-3.5 text-center">Số lượt làm</th>
                <th className="p-3.5 text-center">Điểm TB</th>
                <th className="p-3.5">Chủ đề mạnh nhất</th>
                <th className="p-3.5">Chủ đề cần cải thiện</th>
                <th className="p-3.5 text-right">Lần làm gần nhất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    Không tìm thấy học sinh nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => (
                  <tr key={`${st.studentName}_${st.className}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-mono text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{st.studentName}</span>
                    </td>
                    <td className="p-3.5 font-semibold text-indigo-300">{st.className}</td>
                    <td className="p-3.5 text-center font-mono">{st.attemptsCount} bài</td>
                    <td className="p-3.5 text-center">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-lg border ${
                        st.averageScore >= 8 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                          : st.averageScore >= 5 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        {st.averageScore}/10
                      </span>
                    </td>
                    <td className="p-3.5 text-emerald-400 font-medium">
                      {st.strongestTopic || 'Tin học 10'}
                    </td>
                    <td className="p-3.5 text-rose-400 font-medium">
                      {st.weakestTopic || 'Cần luyện thêm'}
                    </td>
                    <td className="p-3.5 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(st.lastAttemptDate).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
