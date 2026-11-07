import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Sparkles,
  ChevronRight,
  ChevronDown,
  Maximize2,
  X,
  Search,
  Check,
  BookOpen
} from 'lucide-react';
import { getResearchPapers, getSolvedProblems } from '../services/dataService';
import { ResearchPaper, Difficulty } from '../types';

// Badges mapping matching TensorTonic assets
const paperBadges: Record<string, string> = {
  transformer: '/images/badges/transformers.png',
  kimik3: '/images/badges/kimi-k3.png',
  resnet: '/images/badges/resnet.png',
  bert: '/images/badges/bert.png',
  vgg: '/images/badges/vgg.png',
  unet: '/images/badges/unet.png',
  vae: '/images/badges/vae.png',
  gan: '/images/badges/gans.png',
  vit: '/images/badges/vision-transformer.png',
  rnn: '/images/badges/rnn.png',
  lstm: '/images/badges/lstm.png',
  gru: '/images/badges/gru.png',
  alexnet: '/images/badges/alexnet.png',
  ddpm: '/images/badges/ddpm.png',
  gemma3: '/images/badges/gemma-3.png',
  deepseekv3: '/images/badges/deepseek-v3.png',
  'arcee-trinity': '/images/badges/arcee-trinity.png',
  gpt2: '/images/badges/gpt-2.png',
  llama: '/images/badges/llama.png',
  gptoss: '/images/badges/gptoss.png',
  glm45: '/images/badges/glm45.png',
  word2vec: '/images/badges/word2vec.png',
  densenet: '/images/badges/densenet.png'
};

// Architecture graphs mapping from Desktop/arch_img
const paperArchitectureImages: Record<string, string> = {
  transformer: '/images/architectures/Transformer.png',
  kimik3: '/images/architectures/Kimi K3.png',
  resnet: '/images/architectures/ResNet.png',
  word2vec: '/images/architectures/Word2Vec.png',
  densenet: '/images/architectures/DenseNet.png',
  bert: '/images/architectures/BERT.png',
  vgg: '/images/architectures/VGG.png',
  unet: '/images/architectures/U-Net.png',
  vae: '/images/architectures/VAE.png',
  gan: '/images/architectures/GAN.png',
  vit: '/images/architectures/ViT.png',
  rnn: '/images/architectures/RNN.png',
  lstm: '/images/architectures/LSTM.png',
  gru: '/images/architectures/GRU.png',
  alexnet: '/images/architectures/AlexNet.png',
  ddpm: '/images/architectures/DDPM.png',
  gemma3: '/images/architectures/Gemma 3.png',
  gpt2: '/images/architectures/GPT-2.png',
  deepseekv3: '/images/architectures/DeepSeek-V3.png',
  'arcee-trinity': '/images/architectures/Arcee Trinity.png',
  gptoss: '/images/architectures/gpt-oss.png',
  glm45: '/images/architectures/GLM-4.5.png',
  llama: '/images/architectures/LLaMA.png'
};

const paperAliases: Record<string, string> = {
  'gpt-2': 'gpt2',
  'gpt2': 'gpt2',
  'deepseek-v3': 'deepseekv3',
  'deepseekv3': 'deepseekv3',
  'deepseek': 'deepseekv3',
  'kimi-k3': 'kimik3',
  'kimik3': 'kimik3',
  'kimi': 'kimik3',
  'glm-4.5': 'glm45',
  'glm45': 'glm45',
  'glm4.5': 'glm45',
  'glm-45': 'glm45',
  'gpt-oss': 'gptoss',
  'gptoss': 'gptoss',
  'gemma-3': 'gemma3',
  'gemma3': 'gemma3',
  'arcee': 'arcee-trinity',
  'trinity': 'arcee-trinity',
  'arcee-trinity': 'arcee-trinity',
  'word-2-vec': 'word2vec',
  'dense-net': 'densenet',
  'transformers': 'transformer'
};

const normalizePaperId = (id: string | null | undefined): string => {
  if (!id) return 'transformer';
  const clean = id.toLowerCase().trim();
  if (paperAliases[clean]) return paperAliases[clean];
  const noHyphen = clean.replace(/[^a-z0-9]/g, '');
  if (paperAliases[noHyphen]) return paperAliases[noHyphen];
  return clean;
};

// Step circle colors matching explore_landing_page.png
const stepColors = [
  '#10b981', // 1: teal/green
  '#06b6d4', // 2: cyan
  '#3b82f6', // 3: blue
  '#8b5cf6', // 4: purple
  '#ec4899', // 5: pink/magenta
  '#f43f5e', // 6: rose
  '#f59e0b', // 7: amber
  '#10b981', // 8: emerald
  '#6366f1', // 9: indigo
  '#14b8a6', // 10: teal
  '#eab308'  // 11: yellow
];

// Paper display names for sidebar and dropdown
const getSidebarName = (p: ResearchPaper): string => {
  if (!p) return '';
  if (p.id === 'transformer') return 'Transformers';
  if (p.id === 'kimik3') return 'Kimi K3';
  if (p.id === 'vit') return 'Vision Transformer';
  if (p.id === 'gan') return 'GANs';
  if (p.id === 'vae') return 'VAE';
  if (p.id === 'unet') return 'U-Net';
  if (p.id === 'densenet') return 'DenseNet';
  if (p.id === 'word2vec') return 'Word2Vec';
  return (p.title || '').split(':')[0].split('(')[0].trim() || p.id;
};

export const ResearchPage: React.FC = () => {
  const { paperId: routePaperId } = useParams<{ paperId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [solvedSet, setSolvedSet] = useState<Set<string>>(new Set());
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [dropdownSearch, setDropdownSearch] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rawPaperId = routePaperId || searchParams.get('paper') || 'transformer';
  const activePaperId = normalizePaperId(rawPaperId);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getResearchPapers();
      setPapers(data);
      setSolvedSet(getSolvedProblems());
      setLoading(false);
    }
    load();

    const handleAuthOrStorage = () => {
      setSolvedSet(getSolvedProblems());
    };
    window.addEventListener('tensortonic_auth_change', handleAuthOrStorage);
    window.addEventListener('storage', handleAuthOrStorage);
    return () => {
      window.removeEventListener('tensortonic_auth_change', handleAuthOrStorage);
      window.removeEventListener('storage', handleAuthOrStorage);
    };
  }, []);

  const activePaper = useMemo(() => {
    return papers.find((p) => p.id === activePaperId || normalizePaperId(p.id) === activePaperId) || papers[0];
  }, [papers, activePaperId]);

  const filteredDropdownPapers = useMemo(() => {
    if (!dropdownSearch.trim()) return papers;
    const q = dropdownSearch.toLowerCase();
    return papers.filter(p => 
      getSidebarName(p).toLowerCase().includes(q) || 
      (p.title || '').toLowerCase().includes(q)
    );
  }, [papers, dropdownSearch]);

  const selectPaper = (id: string) => {
    setSearchParams({ paper: id });
  };

  const getDifficultyBadge = (diff: Difficulty) => {
    switch (diff) {
      case 'Easy':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            Easy
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border border-amber-500/30 bg-amber-500/10 text-amber-400">
            Medium
          </span>
        );
      case 'Hard':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border border-rose-500/30 bg-rose-500/10 text-rose-400">
            Hard
          </span>
        );
    }
  };

  if (loading || !activePaper) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-background">
        <div className="w-8 h-8 border-2 border-[#93C572] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const topics = activePaper.topics || [];
  const badgeUrl = paperBadges[activePaper.id] || paperBadges[normalizePaperId(activePaper.id)] || '/images/badges/transformers.png';
  const archImageUrl = paperArchitectureImages[activePaper.id] || paperArchitectureImages[normalizePaperId(activePaper.id)] || '/images/architectures/Transformer.png';

  return (
    <div className="h-full w-full flex overflow-hidden bg-background text-foreground font-sans selection:bg-[#93C572]/20 selection:text-[#93C572]">
      
      {/* ======================================================== */}
      {/* COLUMN 1: LEFT SIDEBAR - RESEARCH PAPERS LIST            */}
      {/* ======================================================== */}
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-border/60 flex-col h-full bg-card/40 select-none">
        <div className="px-5 py-4 border-b border-border/60">
          <h2 className="text-base font-bold text-foreground tracking-tight">
            Research Papers
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
          {papers.map((p) => {
            const isActive = p.id === activePaper.id || normalizePaperId(p.id) === activePaper.id;
            const sidebarName = getSidebarName(p);
            const topicCount = p.topics?.length || 8;

            return (
              <button
                key={p.id}
                onClick={() => selectPaper(p.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-[#93C572]/10 border border-[#93C572]/40 text-[#93C572]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold tracking-wide ${isActive ? 'text-[#93C572]' : 'text-foreground/90'}`}>
                    {sidebarName}
                  </span>
                </div>

                {/* Progress Dashes Bar */}
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: Math.min(topicCount, 8) }).map((_, dIdx) => (
                    <div
                      key={dIdx}
                      className={`h-0.5 flex-1 rounded-full transition-colors ${
                        isActive
                          ? dIdx < 2
                            ? 'bg-[#93C572]'
                            : 'bg-[#93C572]/30'
                          : 'bg-border/60 group-hover:bg-border'
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* COLUMN 2: CENTER ROADMAP - ACTIVE PAPER CURRICULUM       */}
      {/* ======================================================== */}
      <main className="flex-1 h-full overflow-y-auto px-4 sm:px-6 lg:px-10 pt-6 pb-28 sm:py-8 custom-scrollbar bg-background">
        <div className="max-w-2xl mx-auto">
          
          {/* Fancy Mobile Paper Dropdown (< md) */}
          <div className="md:hidden mb-6 relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-card/90 backdrop-blur-xl border transition-all duration-200 text-xs shadow-md select-none ${
                isDropdownOpen
                  ? 'border-[#93C572] ring-2 ring-[#93C572]/20 shadow-[0_0_20px_rgba(147,197,114,0.15)] bg-secondary/80'
                  : 'border-border/80 hover:border-[#93C572]/50 hover:bg-secondary/60'
              }`}
            >
              {/* Paper Badge thumbnail */}
              <div className="w-6 h-6 rounded-lg bg-background/80 border border-border/60 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                <img
                  src={paperBadges[activePaper.id] || paperBadges[normalizePaperId(activePaper.id)] || '/images/badges/transformers.png'}
                  alt=""
                  className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>

              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none">Paper</span>
                <span className="text-xs font-bold text-foreground truncate max-w-[130px] leading-tight mt-0.5">
                  {getSidebarName(activePaper)}
                </span>
              </div>

              <span className="text-[10px] font-mono text-[#93C572] bg-[#93C572]/10 border border-[#93C572]/20 px-1.5 py-0.5 rounded-full shrink-0">
                {topics.length} steps
              </span>

              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180 text-[#93C572]' : ''}`} />
            </button>

            {/* Fancy Popover Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-[#121614]/95 backdrop-blur-2xl border border-[#93C572]/30 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Search Bar inside Dropdown */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={dropdownSearch}
                    onChange={(e) => setDropdownSearch(e.target.value)}
                    placeholder="Search 23 papers..."
                    className="w-full bg-background/80 border border-border/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#93C572]/60 transition-colors"
                    autoFocus
                  />
                </div>

                {/* Papers List */}
                <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                  {filteredDropdownPapers.length === 0 ? (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      No papers found
                    </div>
                  ) : (
                    filteredDropdownPapers.map((p) => {
                      const isSelected = p.id === activePaper.id || normalizePaperId(p.id) === activePaper.id;
                      const pBadge = paperBadges[p.id] || paperBadges[normalizePaperId(p.id)] || '/images/badges/transformers.png';
                      const topicLen = p.topics?.length || 8;

                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            selectPaper(p.id);
                            setIsDropdownOpen(false);
                            setDropdownSearch('');
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all ${
                            isSelected
                              ? 'bg-[#93C572]/15 text-[#93C572] font-semibold border border-[#93C572]/30 shadow-xs'
                              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-background/90 border border-border/60 p-0.5 flex items-center justify-center shrink-0">
                              <img
                                src={pBadge}
                                alt=""
                                className="w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            </div>
                            <span className="truncate font-medium">{getSidebarName(p)}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-[10px] font-mono text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded border border-border/40">
                              {topicLen}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#93C572]" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Active Paper Title & Emblem Shield Badge */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {activePaper.title}
            </h1>

            {/* Emblem Shield Badge from screenshot */}
            <div className="flex-shrink-0 w-14 h-16 rounded-xl bg-card border border-border/80 shadow-md flex items-center justify-center p-2 relative group hover:border-[#93C572]/50 transition-colors">
              <img
                src={badgeUrl}
                alt={`${activePaper.title} Badge`}
                className="w-full h-full object-contain filter drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Sequential Component Pipeline (Matching explore_landing_page.png) */}
          <div className="relative">
            {/* Vertical Connecting Thread */}
            <div 
              className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-border/60 pointer-events-none" 
            />

            <div className="space-y-4 relative">
              {topics.map((topic, idx) => {
                const isSolved = solvedSet.has(topic.problemId) || solvedSet.has(topic.id);
                const stepColor = stepColors[idx % stepColors.length];
                const isHighlighted = activeHighlight === topic.id || activeHighlight === topic.problemId;

                return (
                  <div
                    key={topic.id}
                    onMouseEnter={() => setActiveHighlight(topic.id)}
                    onMouseLeave={() => setActiveHighlight(null)}
                    onClick={() => navigate(`/research/${activePaper.id}/${topic.problemId}`)}
                    className="flex items-center gap-4 group cursor-pointer"
                  >
                    {/* Number Circle Badge on the line */}
                    <div
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-transform duration-200 group-hover:scale-110 font-bold text-xs bg-background"
                      style={{
                        borderColor: stepColor,
                        color: stepColor,
                        boxShadow: isHighlighted ? `0 0 10px 1px ${stepColor}55` : 'none'
                      }}
                    >
                      {isSolved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Step Card */}
                    <div
                      className={`flex-1 px-5 py-4 rounded-xl border transition-all duration-150 flex items-center justify-between ${
                        isHighlighted
                          ? 'bg-secondary/70 border-foreground/30 shadow-md -translate-y-0.5'
                          : 'bg-card border-border/70 hover:bg-secondary/40 hover:border-border'
                      }`}
                    >
                      <div className="pr-4">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-[#93C572] transition-colors">
                          {topic.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {topic.description}
                        </p>
                      </div>

                      <div className="flex-shrink-0">
                        {getDifficultyBadge(topic.difficulty)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      {/* ======================================================== */}
      {/* COLUMN 3: RIGHT PANEL - ARCHITECTURE DIAGRAM            */}
      {/* ======================================================== */}
      <aside className="w-[460px] lg:w-[490px] xl:w-[560px] 2xl:w-[640px] flex-shrink-0 border-l border-border/60 h-full overflow-y-auto p-5 bg-card/40 custom-scrollbar hidden lg:flex flex-col gap-4">
        
        {/* AUTHENTIC ARCHITECTURE DIAGRAM CARD */}
        <div className="flex-1 rounded-2xl bg-card border border-border/80 shadow-xs overflow-hidden flex flex-col relative group">
          
          {/* Zoom / Fullscreen Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/80 backdrop-blur-xs transition-colors shadow-xs"
            title="View full resolution architecture graph"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Architecture Image Container */}
          <div className="w-full flex-1 flex items-center justify-center bg-[#0d0f14] p-3 overflow-hidden">
            <img
              key={archImageUrl}
              src={archImageUrl}
              alt={`${activePaper.title} Architecture Graph`}
              className="w-full h-auto max-h-[760px] 2xl:max-h-[860px] object-contain rounded-lg filter drop-shadow-md select-none transition-all duration-300 animate-fadeIn"
              onError={(e) => {
                // Fallback to Transformer diagram if specific image not found
                (e.target as HTMLImageElement).src = '/images/architectures/Transformer.png';
              }}
            />
          </div>
        </div>

      </aside>

      {/* ======================================================== */}
      {/* FULLSCREEN LIGHTBOX MODAL FOR ARCHITECTURE GRAPH        */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative max-w-6xl w-full max-h-[94vh] bg-[#0d0f14] border border-border/80 rounded-2xl p-5 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#93C572]" />
                <h3 className="text-base font-bold text-foreground">
                  {activePaper.title} — High-Resolution Architecture Graph
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Close lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center custom-scrollbar p-2">
              <img
                src={archImageUrl}
                alt={`${activePaper.title} Full Architecture`}
                className="max-h-[84vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
