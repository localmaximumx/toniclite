import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  Atom, 
  Brain, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Lock, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  Circle,
  Radio,
  ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAssessments } from '../services/dataService';
import { AssessmentCategory, AssessmentItem } from '../types';

// Company logo icons
const CompanyLogo: React.FC<{ name: string }> = ({ name }) => {
  switch (name) {
    case 'meta':
      return (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#0668E1]/20 text-[#0668E1] text-[9px] font-bold" title="Meta">
          M
        </span>
      );
    case 'apple':
      return (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-white text-[9px] font-bold" title="Apple">
          
        </span>
      );
    case 'amazon':
      return (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#FF9900]/20 text-[#FF9900] text-[9px] font-bold" title="Amazon">
          a
        </span>
      );
    case 'netflix':
      return (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#E50914]/20 text-[#E50914] text-[9px] font-bold" title="Netflix">
          N
        </span>
      );
    case 'google':
      return (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#4285F4]/20 text-[#4285F4] text-[9px] font-bold" title="Google">
          G
        </span>
      );
    case 'openai':
      return (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#10A37F]/20 text-[#10A37F] text-[9px] font-bold" title="OpenAI">
          ⚡
        </span>
      );
    case 'anthropic':
      return (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#D97706]/20 text-[#D97706] text-[9px] font-bold" title="Anthropic">
          A
        </span>
      );
    default:
      return null;
  }
};

// 3D Isometric SVG Art Components matching template
const CardIllustration: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'magnifier':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 shrink-0 opacity-90 drop-shadow-md" fill="none">
          <circle cx="48" cy="48" r="28" fill="url(#magGrad)" stroke="#38BDF8" strokeWidth="3" />
          <path d="M42 36v24M48 42v18M54 48v12" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M68 68l16 16" stroke="#60A5FA" strokeWidth="6" strokeLinecap="round" />
          <defs>
            <radialGradient id="magGrad" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0369A1" stopOpacity="0.8" />
            </radialGradient>
          </defs>
        </svg>
      );
    case 'layers':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 shrink-0 opacity-90 drop-shadow-md" fill="none">
          <path d="M50 20L80 35L50 50L20 35Z" fill="#38BDF8" opacity="0.9" />
          <path d="M20 35L50 50V56L20 41Z" fill="#0284C7" />
          <path d="M80 35L50 50V56L80 41Z" fill="#0369A1" />
          
          <path d="M50 40L80 55L50 70L20 55Z" fill="#60A5FA" opacity="0.9" />
          <path d="M20 55L50 70V76L20 61Z" fill="#2563EB" />
          <path d="M80 55L50 70V76L80 61Z" fill="#1D4ED8" />

          <path d="M50 60L80 75L50 90L20 75Z" fill="#93C5FD" opacity="0.9" />
          <path d="M20 75L50 90V96L20 81Z" fill="#3B82F6" />
          <path d="M80 75L50 90V96L80 81Z" fill="#1E40AF" />
        </svg>
      );
    case 'database':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 shrink-0 opacity-90 drop-shadow-md" fill="none">
          {/* Top disc */}
          <ellipse cx="50" cy="30" rx="36" ry="12" fill="#34D399" />
          <path d="M14 30v12c0 6.6 16.1 12 36 12s36-5.4 36-12V30" fill="#059669" />
          <text x="50" y="34" fill="#064E3B" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">SQL</text>

          {/* Middle disc */}
          <ellipse cx="50" cy="52" rx="36" ry="12" fill="#10B981" />
          <path d="M14 52v12c0 6.6 16.1 12 36 12s36-5.4 36-12V52" fill="#047857" />
          <text x="32" y="60" fill="#A7F3D0" fontSize="8" fontWeight="bold">1</text>
          <text x="50" y="60" fill="#A7F3D0" fontSize="8" fontWeight="bold">2</text>
          <text x="68" y="60" fill="#A7F3D0" fontSize="8" fontWeight="bold">3</text>

          {/* Bottom disc */}
          <ellipse cx="50" cy="74" rx="36" ry="12" fill="#059669" />
          <path d="M14 74v12c0 6.6 16.1 12 36 12s36-5.4 36-12V74" fill="#065F46" />
        </svg>
      );
    case 'transformer':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 shrink-0 opacity-90 drop-shadow-md" fill="none">
          <rect x="25" y="15" width="50" height="70" rx="6" fill="#1E293B" stroke="#475569" strokeWidth="2" />
          <rect x="32" y="25" width="36" height="8" rx="2" fill="#64748B" />
          <rect x="32" y="38" width="36" height="8" rx="2" fill="#93C572" opacity="0.8" />
          <rect x="32" y="51" width="36" height="8" rx="2" fill="#64748B" />
          <rect x="32" y="64" width="36" height="8" rx="2" fill="#93C572" opacity="0.8" />
          <path d="M78 50l12-8v16z" fill="#FBBF24" />
        </svg>
      );
    case 'target':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 shrink-0 opacity-90 drop-shadow-md" fill="none">
          <ellipse cx="50" cy="50" rx="38" ry="38" fill="#EA580C" opacity="0.8" />
          <ellipse cx="50" cy="50" rx="26" ry="26" fill="#FB923C" />
          <ellipse cx="50" cy="50" rx="14" ry="14" fill="#FED7AA" />
          <ellipse cx="50" cy="50" rx="5" ry="5" fill="#C2410C" />
        </svg>
      );
    case 'infinity':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 shrink-0 opacity-90 drop-shadow-md" fill="none">
          <path 
            d="M32 35 C18 35 18 65 32 65 C44 65 56 35 68 35 C82 35 82 65 68 65 C56 65 44 35 32 35 Z" 
            stroke="#A855F7" 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 shrink-0 opacity-90 drop-shadow-md" fill="none">
          <rect x="25" y="25" width="50" height="50" rx="8" fill="#93C572" opacity="0.2" stroke="#93C572" strokeWidth="3" />
          <circle cx="50" cy="50" r="14" fill="#93C572" />
        </svg>
      );
  }
};

export const InterviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTrack, setSelectedTrack] = useState<AssessmentItem | null>(null);

  // Scroll refs for carousels
  const carouselRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getAssessments();
      setCategories(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleScroll = (catId: string, direction: 'left' | 'right') => {
    const el = carouselRefs.current[catId];
    if (el) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getIllustrationType = (slugOrTitle: string, index: number): string => {
    const s = slugOrTitle.toLowerCase();
    if (s.includes('sql') || s.includes('window') || s.includes('database')) return 'database';
    if (s.includes('vision') || s.includes('perception') || s.includes('transform')) return 'target';
    if (s.includes('optim') || s.includes('system') || s.includes('training')) return 'infinity';
    if (s.includes('research') || s.includes('architect')) return 'transformer';
    if (s.includes('machine learning engineer') || s.includes('magnifier') || s.includes('mock') || s.includes('screen')) return 'magnifier';
    if (s.includes('struct') || s.includes('layer') || s.includes('sprint')) return 'layers';
    if (s.includes('llm') || s.includes('transformer') || s.includes('internals')) return 'transformer';
    if (s.includes('align') || s.includes('target') || s.includes('post-train')) return 'target';
    if (s.includes('math') || s.includes('infinity') || s.includes('frontier')) return 'infinity';
    const fallback = ['magnifier', 'layers', 'database', 'transformer', 'target', 'infinity'];
    return fallback[index % fallback.length];
  };

  const getCardTag = (name: string, index: number) => {
    const s = name.toLowerCase();
    if (s.includes('machine learning engineer')) return { label: 'FAANG SCREENING', companies: ['meta', 'google', 'apple'] };
    if (s.includes('senior ai research')) return { label: 'FRONTIER LAB', companies: ['openai', 'anthropic', 'google'] };
    if (s.includes('optimization & training')) return { label: 'ML SYSTEMS', companies: ['meta', 'amazon'] };
    if (s.includes('computer vision')) return { label: '3D PERCEPTION', companies: ['apple', 'google'] };
    if (s.includes('mock')) return { label: 'MOCK INTERVIEW', companies: ['meta', 'google'] };
    if (s.includes('sql')) return { label: 'SQL SPRINT', companies: ['meta', 'apple', 'amazon', 'netflix', 'google'] };
    if (s.includes('python')) return { label: 'PYTHON SPRINT', companies: [] };
    if (s.includes('llm')) return { label: 'DL CODING', companies: ['meta', 'openai'] };
    if (s.includes('alignment')) return { label: 'DL CODING', companies: ['openai', 'anthropic', 'meta'] };
    if (s.includes('math')) return { label: 'ML CODING', companies: ['openai'] };
    return { label: 'TECHNICAL SPRINT', companies: ['meta', 'google'] };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#070a08]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#93C572] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-muted-foreground">Loading Interview tracks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto bg-[#070a08] text-foreground custom-scrollbar select-none">
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
        
        {/* ===================================================================== */}
        {/* HEADER SECTION (Matches interview_landingpage.png)                    */}
        {/* ===================================================================== */}
        <div className="mb-10 space-y-3">
          {/* Green Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#93C572]/15 text-[#93C572] border border-[#93C572]/30 shadow-xs">
            <Radio className="w-3.5 h-3.5 text-[#93C572]" />
            <span>Interview Preparation</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Interview Preparation
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-[#9ca3af] max-w-3xl leading-relaxed">
            Mock interviews on real conditions. Timed, scored, analyzed at the end. Built to the bar set by FAANG, frontier AI labs, fast startups, and quant.
          </p>
        </div>

        {/* ===================================================================== */}
        {/* TRACK CATEGORIES & CAROUSELS                                          */}
        {/* ===================================================================== */}
        <div className="space-y-12 pb-16">
          {categories.map((cat) => {
            const isMock = cat.id.includes('mock');
            const isDS = cat.id.includes('ds') || cat.name.toLowerCase().includes('data scientist');
            const isRE = cat.id.includes('re') || cat.name.toLowerCase().includes('research');

            return (
              <div key={cat.id} className="space-y-4">
                
                {/* Category Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-2.5">
                    {/* Category Icon */}
                    <div className="mt-0.5">
                      {isMock ? (
                        <Sparkles className="w-5 h-5 text-[#93C572]" />
                      ) : isDS ? (
                        <BarChart3 className="w-5 h-5 text-rose-400" />
                      ) : isRE ? (
                        <Atom className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Brain className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white tracking-tight">
                          {cat.name}
                        </h2>
                        {isMock && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#93C572]/15 text-[#93C572] border border-[#93C572]/30 font-bold">
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9ca3af]">
                        {cat.description || (isDS 
                          ? 'Assessments for data science interview prep: SQL, pandas, NumPy, math, and ML.' 
                          : isRE 
                          ? 'Paper deep-dives and distributed training, the frontier lab loop' 
                          : 'Production ML systems, feature pipelines, low-latency serving, and ML architecture')}
                      </p>
                    </div>
                  </div>

                  {/* Carousel Controls (< and >) */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleScroll(cat.id, 'left')}
                      className="w-7 h-7 rounded-full bg-[#141a17] hover:bg-[#1d2622] border border-[#26332b] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                      title="Scroll left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleScroll(cat.id, 'right')}
                      className="w-7 h-7 rounded-full bg-[#141a17] hover:bg-[#1d2622] border border-[#26332b] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                      title="Scroll right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Horizontal Scrollable Carousel */}
                <div
                  ref={(el) => { carouselRefs.current[cat.id] = el; }}
                  className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 pt-1 scroll-smooth snap-x"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {cat.assessments.map((item, idx) => {
                    const tagInfo = getCardTag(item.name, idx);
                    const illType = getIllustrationType(item.name, idx);
                    const totalQuestions = (item.sets || []).reduce((acc, s) => acc + (s.problems?.length || 0), 0);

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedTrack(item)}
                        className="w-[280px] sm:w-[320px] shrink-0 snap-start bg-[#141414] hover:bg-[#1a1a1a] border border-[#242424] hover:border-[#383838] rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-0.5 group relative overflow-hidden"
                      >
                        {/* Top: Tag + Company Logos + Pro Badge */}
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono tracking-wider font-bold text-[#a1a1aa] uppercase">
                              {tagInfo.label}
                            </span>
                            {tagInfo.companies.length > 0 && (
                              <div className="flex items-center gap-1 pl-1 border-l border-border/40">
                                {tagInfo.companies.map(c => (
                                  <CompanyLogo key={c} name={c} />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Green PRO Badge */}
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#93C572]/15 text-[#93C572] border border-[#93C572]/30">
                            <Lock className="w-2.5 h-2.5" />
                            <span>PRO</span>
                          </div>
                        </div>

                        {/* Middle: Title & 3D Illustration */}
                        <div className="flex items-center justify-between gap-3 my-2">
                          <div className="space-y-1">
                            <h3 className="text-base font-bold text-white group-hover:text-[#93C572] transition-colors leading-snug">
                              {item.name}
                            </h3>
                            <p className="text-[11px] text-[#71717a] font-mono">
                              {totalQuestions} questions · {item.sets?.length || 0} sets
                            </p>
                          </div>
                          
                          {/* 3D Graphic */}
                          <CardIllustration type={illType} />
                        </div>

                        {/* Bottom: Duration & Launch Arrow */}
                        <div className="pt-3 border-t border-[#222222] flex items-center justify-between text-xs text-[#a1a1aa] mt-2">
                          <span className="flex items-center gap-1.5 font-mono text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {item.durationMin || 45} min
                          </span>
                          <span className="p-1 rounded-md text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                            <ChevronRight className="w-4 h-4 text-[#93C572]" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* ===================================================================== */}
      {/* TRACK DETAIL MODAL / BREAKDOWN                                       */}
      {/* ===================================================================== */}
      {selectedTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity" 
            onClick={() => setSelectedTrack(null)}
          />

          <div className="relative w-full max-w-xl bg-[#0f1412] border border-[#243329] rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-[#243329] flex items-center justify-between bg-[#131a16]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#93C572]/20 border border-[#93C572]/40 flex items-center justify-center text-[#93C572]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedTrack.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span>{selectedTrack.durationMin || 45} mins</span>
                    <span>·</span>
                    <span className="text-[#93C572] font-semibold">{selectedTrack.sets?.reduce((a, s) => a + (s.problems?.length || 0), 0)} Questions</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTrack(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sets & Questions Breakdown */}
            <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedTrack.description}
              </p>

              <div className="space-y-3 pt-2">
                {(selectedTrack.sets || []).map((set, sIdx) => (
                  <div key={set.id || sIdx} className="bg-[#151c19] rounded-xl p-3 border border-[#26382c]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">{set.name}</span>
                      <span className="text-[10px] text-[#93C572] font-mono">{set.problems?.length || 0} questions</span>
                    </div>
                    <div className="space-y-1">
                      {(set.problems || []).map((prob, pIdx) => (
                        <Link
                          key={prob.slug || pIdx}
                          to={`/interview/solve/${prob.slug}?assessment=${selectedTrack.id}`}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1a2420] text-xs transition-colors group"
                        >
                          <span className="text-muted-foreground group-hover:text-[#93C572] truncate max-w-[340px]">
                            {prob.title?.replace(/<[^>]*>?/gm, '')}
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            prob.difficulty?.toLowerCase() === 'easy' ? 'text-emerald-400 bg-emerald-500/10' :
                            prob.difficulty?.toLowerCase() === 'hard' ? 'text-rose-400 bg-rose-500/10' :
                            'text-amber-400 bg-amber-500/10'
                          }`}>
                            {prob.difficulty}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer: Start Interview Button */}
            <div className="p-4 border-t border-[#243329] bg-[#111714] flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Pro Interview Free Unlocked
              </span>
              {selectedTrack.sets?.[0]?.problems?.[0] ? (
                <Link
                  to={`/interview/solve/${selectedTrack.sets[0].problems[0].slug}?assessment=${selectedTrack.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#93C572] hover:bg-[#A4D287] text-black text-xs font-bold transition-colors shadow-md"
                >
                  <span>Start Interview</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : null}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
