import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Search, 
  CheckCircle2, 
  Circle, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { ProblemSummary, Difficulty, ResearchPaper } from '../types';

interface ProblemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlug?: string;
  problems: ProblemSummary[];
  solvedSet: Set<string>;
  paperId?: string;
  currentPaper?: ResearchPaper | null;
  assessmentId?: string;
  currentAssessment?: any | null;
}

export const ProblemDrawer: React.FC<ProblemDrawerProps> = ({
  isOpen,
  onClose,
  currentSlug,
  problems,
  solvedSet,
  paperId,
  currentPaper,
  currentAssessment
}) => {
  const navigate = useNavigate();

  // Problems mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All Tags');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Solved' | 'Unsolved'>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 30;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    problems.forEach((p) => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach((t) => tagsSet.add(t));
      }
      if (p.category) {
        tagsSet.add(p.category.toUpperCase());
      }
    });
    return ['All Tags', ...Array.from(tagsSet).sort()];
  }, [problems]);

  // Filter problems for catalog mode
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      // Tag filter
      if (selectedTag !== 'All Tags') {
        const matchesTag = p.tags?.some(t => t.toLowerCase() === selectedTag.toLowerCase());
        const matchesCat = p.category?.toLowerCase() === selectedTag.toLowerCase();
        if (!matchesTag && !matchesCat) return false;
      }
      // Difficulty filter
      if (selectedDifficulty !== 'All' && p.difficulty !== selectedDifficulty) {
        return false;
      }
      // Status filter
      const isSolved = solvedSet.has(p.slug);
      if (selectedStatus === 'Solved' && !isSolved) return false;
      if (selectedStatus === 'Unsolved' && isSolved) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesSlug = p.slug.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSlug) return false;
      }
      return true;
    });
  }, [problems, selectedTag, selectedDifficulty, selectedStatus, searchQuery, solvedSet]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / pageSize));
  
  const currentItemRef = useRef<HTMLButtonElement>(null);

  // Sync page to current problem's page when drawer opens or currentSlug changes
  useEffect(() => {
    if (!isOpen || !currentSlug || filteredProblems.length === 0) return;
    const idx = filteredProblems.findIndex(p => p.slug === currentSlug);
    if (idx !== -1) {
      const targetPage = Math.floor(idx / pageSize) + 1;
      setCurrentPage(targetPage);
    }
  }, [isOpen, currentSlug, filteredProblems, pageSize]);

  // When filters or search change, if currentSlug is still in filtered results, jump to its page; otherwise reset to 1
  useEffect(() => {
    if (currentSlug && filteredProblems.length > 0) {
      const idx = filteredProblems.findIndex(p => p.slug === currentSlug);
      if (idx !== -1) {
        const targetPage = Math.floor(idx / pageSize) + 1;
        setCurrentPage(targetPage);
        return;
      }
    }
    setCurrentPage(1);
  }, [searchQuery, selectedTag, selectedDifficulty, selectedStatus]);

  // Auto-scroll to current active problem when page or drawer opens
  useEffect(() => {
    if (isOpen && currentItemRef.current) {
      setTimeout(() => {
        currentItemRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 50);
    }
  }, [isOpen, currentPage]);

  // Current page items
  const paginatedProblems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProblems.slice(start, start + pageSize);
  }, [filteredProblems, currentPage, pageSize]);

  const cleanTitle = (raw: string) => {
    return raw.replace(/^#\s*/, '').replace(/<[^>]+>/g, '').trim();
  };

  const getDifficultyColor = (diff?: Difficulty | string) => {
    switch (diff) {
      case 'Easy':
        return 'text-emerald-400';
      case 'Medium':
        return 'text-amber-400';
      case 'Hard':
        return 'text-rose-400';
      default:
        return 'text-muted-foreground';
    }
  };

  if (!isOpen) return null;

  const isResearchMode = Boolean(paperId && currentPaper);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content */}
      <div className="relative w-full sm:w-[320px] md:w-[340px] bg-[#0c0c0c] border-r border-[#262626] shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-left duration-200 ease-out select-none">
        
        {/* ========================================================================= */}
        {/* MODE 1: RESEARCH SIDEBAR (Template: research_sidebar_template.png)         */}
        {/* ========================================================================= */}
        {isResearchMode ? (
          <>
            {/* Header: Paper Title & Close Button */}
            <div className="px-4 py-3.5 border-b border-[#262626] flex items-center justify-between">
              <h2 className="text-sm font-bold text-white truncate max-w-[250px]" title={currentPaper?.title}>
                {currentPaper?.title || 'Paper Curriculum'}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded text-[#888888] hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Problems / Steps in the Paper */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
              {(currentPaper?.topics || []).map((topic, idx) => {
                const targetSlug = topic.problemId || topic.id;
                const isCurrent = targetSlug === currentSlug || topic.id === currentSlug;
                const isSolved = solvedSet.has(targetSlug) || solvedSet.has(topic.id);
                const stepNum = String(idx + 1).padStart(2, '0');

                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      navigate(`/research/${paperId || currentPaper?.id}/${targetSlug}`);
                      onClose();
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                      isCurrent
                        ? 'bg-[#2a2a2a] text-white font-bold'
                        : 'hover:bg-[#1a1a1a] text-[#9ca3af] hover:text-white font-normal'
                    }`}
                  >
                    {/* Circle / Solved Icon */}
                    <div className="shrink-0 flex items-center justify-center w-4 h-4">
                      {isSolved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-[#555555]'}`} />
                      )}
                    </div>

                    {/* Step Number in Monospace */}
                    <span className={`text-xs font-mono shrink-0 ${isCurrent ? 'text-white font-bold' : 'text-[#6b7280]'}`}>
                      {stepNum}
                    </span>

                    {/* Topic Name */}
                    <span className="text-xs truncate flex-1">
                      {topic.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Link to return to Research Paper landing page */}
            <div className="p-3 border-t border-[#262626] bg-[#080808] flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  navigate(`/research?paper=${paperId || currentPaper?.id}`);
                  onClose();
                }}
                className="text-[11px] text-[#93C572] hover:underline flex items-center gap-1.5"
              >
                <span>Paper Architecture Overview</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </>
        ) : currentAssessment ? (
          /* ========================================================================= */
          /* MODE 2: ASSESSMENT SIDEBAR                                                */
          /* ========================================================================= */
          <>
            {/* Header: Assessment Title & Close Button */}
            <div className="px-4 py-3.5 border-b border-[#262626] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#93C572]">Interview Track</span>
                <h2 className="text-sm font-bold text-white truncate max-w-[240px]" title={currentAssessment.name}>
                  {currentAssessment.name}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded text-[#888888] hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Question Sets Breakdown */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
              {(currentAssessment.sets || []).map((set: any, sIdx: number) => (
                <div key={set.id || sIdx} className="space-y-1">
                  <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>{set.name}</span>
                    <span className="text-[10px] font-mono text-[#93C572]">{set.problems?.length || 0} Qs</span>
                  </div>
                  <div className="space-y-0.5">
                    {(set.problems || []).map((prob: any, pIdx: number) => {
                      const isCurrent = prob.slug === currentSlug;
                      const isSolved = solvedSet.has(prob.slug);

                      return (
                        <button
                          key={prob.slug || pIdx}
                          onClick={() => {
                            navigate(`/interview/solve/${prob.slug}?assessment=${currentAssessment.id}`);
                            onClose();
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-2 transition-colors ${
                            isCurrent
                              ? 'bg-[#2a2a2a] text-white font-bold border border-[#93C572]/40'
                              : 'hover:bg-[#181818] text-[#9ca3af] hover:text-white font-normal'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className="shrink-0 flex items-center justify-center w-3.5 h-3.5">
                              {isSolved ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Circle className={`w-3 h-3 ${isCurrent ? 'text-white' : 'text-[#555555]'}`} />
                              )}
                            </div>
                            <span className="text-xs truncate">{prob.title?.replace(/<[^>]*>?/gm, '')}</span>
                          </div>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                            prob.difficulty?.toLowerCase() === 'easy' ? 'text-emerald-400 bg-emerald-500/10' :
                            prob.difficulty?.toLowerCase() === 'hard' ? 'text-red-400 bg-red-500/10' :
                            'text-yellow-400 bg-yellow-500/10'
                          }`}>
                            {prob.difficulty}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Link to return to Interview page */}
            <div className="p-3 border-t border-[#262626] bg-[#080808] flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  navigate('/interview');
                  onClose();
                }}
                className="text-[11px] text-[#93C572] hover:underline flex items-center gap-1.5"
              >
                <span>← All Interview Tracks</span>
              </button>
            </div>
          </>
        ) : (
          /* ========================================================================= */
          /* MODE 3: PROBLEMS SIDEBAR (Template: problems_sidebar_template.png)         */
          /* ========================================================================= */
          <>
            {/* Header: "Problems" & Close Button */}
            <div className="px-4 py-3.5 border-b border-[#262626] flex items-center justify-between">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Problems
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded text-[#888888] hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter controls */}
            <div className="p-3.5 space-y-2.5 border-b border-[#262626] bg-[#0c0c0c]">
              {/* Search problems... */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search problems..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-md px-3 py-1.5 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-[#93C572]/60 transition-colors"
                />
              </div>

              {/* Two Dropdowns: All Tags & All Difficulty */}
              <div className="grid grid-cols-2 gap-2">
                {/* Tags Dropdown */}
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-md px-2.5 py-1.5 text-xs text-[#d1d5db] focus:outline-none focus:border-[#93C572]/60 cursor-pointer transition-colors"
                >
                  {allTags.map((t) => (
                    <option key={t} value={t} className="bg-[#141414] text-white">
                      {t}
                    </option>
                  ))}
                </select>

                {/* Difficulty Dropdown */}
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-md px-2.5 py-1.5 text-xs text-[#d1d5db] focus:outline-none focus:border-[#93C572]/60 cursor-pointer transition-colors"
                >
                  <option value="All" className="bg-[#141414] text-white">All</option>
                  <option value="Easy" className="bg-[#141414] text-white">Easy</option>
                  <option value="Medium" className="bg-[#141414] text-white">Medium</option>
                  <option value="Hard" className="bg-[#141414] text-white">Hard</option>
                </select>
              </div>

              {/* Segmented Control: All | Solved | Unsolved */}
              <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[#181818] border border-[#2a2a2a]">
                {(['All', 'Solved', 'Unsolved'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`py-1 text-xs font-medium rounded transition-colors text-center ${
                      selectedStatus === st
                        ? 'bg-white text-black font-semibold shadow-xs'
                        : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Problems List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
              {paginatedProblems.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#6b7280]">
                  No problems found.
                </div>
              ) : (
                paginatedProblems.map((p) => {
                  const isCurrent = p.slug === currentSlug;
                  const isSolved = solvedSet.has(p.slug);

                  return (
                    <button
                      key={p.slug}
                      ref={isCurrent ? currentItemRef : undefined}
                      onClick={() => {
                        navigate(`/problems/${p.slug}`);
                        onClose();
                      }}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2.5 transition-colors ${
                        isCurrent
                          ? 'bg-[#2a2a2a] text-white font-bold'
                          : 'hover:bg-[#181818] text-[#a0a0a0] hover:text-white font-normal'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Status Circle */}
                        <div className="shrink-0 flex items-center justify-center w-4 h-4">
                          {isSolved ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-[#4b5563]'}`} />
                          )}
                        </div>

                        {/* Problem Title */}
                        <span className={`text-xs truncate ${isCurrent ? 'text-white font-bold' : ''}`}>
                          {cleanTitle(p.title)}
                        </span>
                      </div>

                      {/* Difficulty string */}
                      <span className={`text-xs shrink-0 font-medium ${getDifficultyColor(p.difficulty)}`}>
                        {p.difficulty || 'Medium'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Pagination Controls Footer: < 1 / 27 > */}
            <div className="p-2.5 border-t border-[#262626] bg-[#0c0c0c] flex items-center justify-between text-xs text-[#888888] px-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded hover:bg-[#1f1f1f] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-mono text-xs text-[#d1d5db]">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded hover:bg-[#1f1f1f] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
