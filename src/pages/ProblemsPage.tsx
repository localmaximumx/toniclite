import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, ChevronLeft, Check, Sparkles, TrendingUp, BookOpen, Layers, Cpu, Award } from 'lucide-react';
import { getProblemCatalog, getSolvedProblems } from '../services/dataService';
import { ProblemSummary, Difficulty, Category } from '../types';
import { ExplorePanel } from '../components/ExplorePanel';
import { DailyChallengeBanner } from '../components/DailyChallengeBanner';
import { CrackedLockIcon } from '../components/CrackedLockIcon';

export const ProblemsPage: React.FC = () => {
  const [catalog, setCatalog] = useState<{ total: number; topics: { name: string; count: number }[]; problems: ProblemSummary[] }>({
    total: 0,
    topics: [],
    problems: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [solvedSet, setSolvedSet] = useState<Set<string>>(new Set());

  const pageSize = 30;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getProblemCatalog();
      setCatalog(data);
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

  const categories = [
    { id: 'all', label: 'All', icon: null },
    { id: 'numpy', label: 'NumPy', icon: '/images/catalog-categories/numpy.svg', bg: '#17333f' },
    { id: 'pytorch', label: 'PyTorch', icon: '/images/catalog-categories/pytorch.svg', bg: '#3a2423' },
    { id: 'cuda', label: 'CUDA', icon: '/images/catalog-categories/cuda.svg', bg: '#2d3b1d' },
    { id: 'triton', label: 'Triton', icon: '/images/catalog-categories/triton.svg', bg: '#312746' },
    { id: 'sql', label: 'SQL', icon: '/images/catalog-categories/sql.svg', bg: '#3b321d' },
    { id: 'python', label: 'Python', icon: '/images/catalog-categories/python.svg', bg: '#243554' },
    { id: 'pandas', label: 'Pandas', icon: '/images/catalog-categories/pandas.svg', bg: '#40263a' }
  ];

  // Filtering
  const filteredProblems = useMemo(() => {
    return catalog.problems.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.category.toLowerCase() !== selectedCategory) {
        return false;
      }
      // Topic filter
      if (selectedTopic !== 'All' && !p.tags.includes(selectedTopic)) {
        return false;
      }
      // Difficulty filter
      if (selectedDifficulty !== 'All' && p.difficulty !== selectedDifficulty) {
        return false;
      }
      // Status filter
      const isSolved = solvedSet.has(p.slug);
      if (selectedStatus === 'Solved' && !isSolved) return false;
      if (selectedStatus === 'Unsolved' && isSolved) return false;
      if (selectedStatus === 'CrackedPro' && p.isFree !== false) return false;
      if (selectedStatus === 'Free' && p.isFree === false) return false;
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesTag = p.tags.some(t => t.toLowerCase().includes(q));
        const matchesCategory = p.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTag && !matchesCategory) return false;
      }
      return true;
    });
  }, [catalog.problems, selectedCategory, selectedTopic, selectedDifficulty, selectedStatus, searchQuery, solvedSet]);

  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / pageSize));
  const displayedProblems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProblems.slice(start, start + pageSize);
  }, [filteredProblems, currentPage]);

  // Solved Stats Breakdown
  const solvedStats = useMemo(() => {
    let easy = 0, medium = 0, hard = 0;
    for (const p of catalog.problems) {
      if (solvedSet.has(p.slug)) {
        if (p.difficulty === 'Easy') easy++;
        else if (p.difficulty === 'Medium') medium++;
        else if (p.difficulty === 'Hard') hard++;
      }
    }
    return { total: solvedSet.size, easy, medium, hard };
  }, [catalog.problems, solvedSet]);

  const getDifficultyBadge = (diff: Difficulty) => {
    switch (diff) {
      case 'Easy':
        return (
          <span
            className="inline-flex rounded-md border px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-[#10B981]"
            style={{
              background: 'linear-gradient(135deg, #10B98140, #10B98116)',
              borderColor: '#10B98180'
            }}
          >
            Easy
          </span>
        );
      case 'Medium':
        return (
          <span
            className="inline-flex rounded-md border px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-[#FACC15]"
            style={{
              background: 'linear-gradient(135deg, #FACC1540, #FACC1516)',
              borderColor: '#FACC1580'
            }}
          >
            Medium
          </span>
        );
      case 'Hard':
        return (
          <span
            className="inline-flex rounded-md border px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-[#F43F5E]"
            style={{
              background: 'linear-gradient(135deg, #F43F5E40, #F43F5E16)',
              borderColor: '#F43F5E80'
            }}
          >
            Hard
          </span>
        );
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground custom-scrollbar">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 sm:pb-8 grid grid-cols-12 gap-4 lg:gap-10 max-w-7xl">
        
        {/* Left Sidebar */}
        <aside className="col-span-12 lg:col-span-3 hidden lg:flex flex-col gap-4">
          
          {/* Explore Side Panel (Papers) */}
          <ExplorePanel />

          {/* Your Progress */}
          <div className="bg-card dark:bg-background/50 backdrop-blur-xl border border-border/70 dark:border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-emerald-600/10 rounded-lg border border-emerald-700/25 dark:border-emerald-500/15">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Your Progress</h3>
              <span className="ml-auto text-[11px] font-mono text-[#93C572] font-semibold">Active</span>
            </div>

            {/* Circular Ring Progress */}
            <div className="flex justify-center py-2">
              <div className="relative flex items-center justify-center">
                <div className="w-28 h-28 rounded-full border-2 border-border/60 flex flex-col items-center justify-center bg-card/60">
                  <span className="text-2xl font-bold font-mono text-foreground">{solvedStats.total}</span>
                  <span className="text-[10px] text-muted-foreground">solved</span>
                </div>
              </div>
            </div>

            {/* Difficulty breakdown */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/60 text-center">
              <div>
                <div className="text-[11px] text-emerald-400 font-medium">Easy</div>
                <div className="text-sm font-bold font-mono text-foreground">{solvedStats.easy}</div>
              </div>
              <div>
                <div className="text-[11px] text-amber-400 font-medium">Med</div>
                <div className="text-sm font-bold font-mono text-foreground">{solvedStats.medium}</div>
              </div>
              <div>
                <div className="text-[11px] text-rose-400 font-medium">Hard</div>
                <div className="text-sm font-bold font-mono text-foreground">{solvedStats.hard}</div>
              </div>
            </div>
          </div>

          {/* Pro Unlocked Banner */}
          <div className="bg-card dark:bg-background/50 backdrop-blur-xl border border-amber-500/20 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
              <CrackedLockIcon variant="icon" />
              <span>420 Pro Problems Cracked</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              All 790 problems—including 420 cracked Pro questions marked with the cracked lock icon—are 100% unlocked.
            </p>
          </div>

        </aside>

        {/* Main Problems Table Section */}
        <section className="col-span-12 lg:col-span-9 space-y-4">
          {/* Daily Problem of the Day Banner */}
          <DailyChallengeBanner />
          
          {/* Top Topics Filter */}
          <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 flex-nowrap sm:flex-wrap no-scrollbar">
            <button
              onClick={() => { setSelectedTopic('All'); setCurrentPage(1); }}
              className={`inline-flex h-7 shrink-0 whitespace-nowrap items-center rounded-full px-3 text-xs font-medium transition-colors ${
                selectedTopic === 'All'
                  ? 'bg-brand-soft bg-[#93C572]/15 text-[#93C572] font-semibold border border-[#93C572]/30'
                  : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              All topics
            </button>
            {catalog.topics.slice(0, 10).map((t) => (
              <button
                key={t.name}
                onClick={() => { setSelectedTopic(t.name); setCurrentPage(1); }}
                className={`inline-flex h-7 shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full px-3 text-xs transition-colors ${
                  selectedTopic === t.name
                    ? 'bg-brand-soft bg-[#93C572]/15 text-[#93C572] font-semibold border border-[#93C572]/30'
                    : 'bg-secondary/40 text-foreground/75 hover:bg-secondary hover:text-foreground'
                }`}
              >
                {t.name}
                <span className="text-[10px] tabular-nums text-muted-foreground/70">{t.count}</span>
              </button>
            ))}
          </div>

          {/* Mobile Progress Summary Card (< lg) */}
          <div className="lg:hidden mb-4 p-3.5 rounded-xl bg-card border border-border/80 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#93C572]/15 text-[#93C572] rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Your Solved Progress</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  Easy: <span className="text-emerald-400 font-semibold">{solvedStats.easy}</span> · Med: <span className="text-amber-400 font-semibold">{solvedStats.medium}</span> · Hard: <span className="text-rose-400 font-semibold">{solvedStats.hard}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-lg font-black text-[#93C572]">{solvedStats.total}</span>
              <span className="text-[11px] text-muted-foreground"> / 790</span>
            </div>
          </div>

          {/* Category Icons Row */}
          <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 flex-nowrap sm:flex-wrap no-scrollbar">
            {categories.map((c) => {
              const active = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCategory(c.id as Category); setCurrentPage(1); }}
                  className={`relative inline-flex h-9 shrink-0 whitespace-nowrap min-w-0 items-center gap-1.5 rounded-full text-[13px] font-medium transition-colors px-3 ${
                    active
                      ? 'ring-1 ring-inset bg-[#e9eee9] dark:bg-[#181d19] ring-[#879688]/40 dark:ring-[#dde5de]/30 text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  }`}
                >
                  {c.icon && (
                    <span
                      aria-hidden="true"
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: c.bg }}
                    >
                      <img src={c.icon} alt="" className="w-4 h-4" />
                    </span>
                  )}
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar + Filters */}
          <div className="flex flex-col xl:flex-row xl:items-center gap-2 mb-4">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search problems by name, topic, or category..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-card border border-border rounded-lg pl-10 pr-8 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:border-[#93C572]/50 focus:ring-2 focus:ring-[#93C572]/10 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 bg-card rounded-lg border border-border text-xs text-foreground/80 focus:outline-none cursor-pointer"
              >
                <option value="All">Status: All</option>
                <option value="Solved">Status: Solved</option>
                <option value="Unsolved">Status: Unsolved</option>
                <option value="CrackedPro">Type: Cracked Pro (420)</option>
                <option value="Free">Type: Original Free (370)</option>
              </select>

              {/* Difficulty Filter */}
              <select
                value={selectedDifficulty}
                onChange={(e) => { setSelectedDifficulty(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 bg-card rounded-lg border border-border text-xs text-foreground/80 focus:outline-none cursor-pointer"
              >
                <option value="All">Difficulty: All</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Problems Table */}
          <div className="bg-card dark:bg-background/50 backdrop-blur-xl border border-border/70 dark:border-white/[0.06] rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-[1.5rem_1fr_1.5rem] md:grid-cols-[2rem_minmax(0,1.25fr)_minmax(0,1fr)_5rem] gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-3.5 sm:py-3 bg-secondary/70 dark:bg-muted/30 border-b border-border text-xs font-semibold text-foreground/65 dark:text-muted-foreground">
              <div className="text-center">#</div>
              <div className="min-w-0">Problem</div>
              <div className="hidden md:block min-w-0">Topics</div>
              <div className="text-center md:text-left">Diff</div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                <div className="w-6 h-6 border-2 border-[#93C572] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                Loading problems...
              </div>
            ) : displayedProblems.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                No problems matched your current filters.
              </div>
            ) : (
              <div className="divide-y divide-border/80 dark:divide-border">
                {displayedProblems.map((p) => {
                  const isSolved = solvedSet.has(p.slug);
                  return (
                    <div
                      key={p.slug}
                      className="relative grid grid-cols-[1.5rem_1fr_1.5rem] md:grid-cols-[2rem_minmax(0,1.25fr)_minmax(0,1fr)_5rem] gap-2.5 sm:gap-3 px-3.5 sm:px-4 h-[60px] sm:h-14 items-center hover:bg-secondary/40 dark:hover:bg-accent/40 transition-colors group"
                    >
                      {/* Left accent bar on hover */}
                      <span className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-r-full bg-[#93C572] opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Status Icon */}
                      <div className="flex justify-center">
                        {isSolved ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <span className="text-sm text-muted-foreground/60">-</span>
                        )}
                      </div>

                      {/* Problem Number + Title */}
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="text-muted-foreground text-sm font-mono shrink-0">{p.sortOrder}.</span>
                        <Link
                          to={`/problems/${p.slug}`}
                          className="min-w-0 flex items-center gap-2 text-foreground text-sm hover:text-[#93C572] transition-colors font-medium py-1"
                          title={p.title}
                        >
                          <span className="truncate">{p.title}</span>
                          {p.isFree === false && <CrackedLockIcon variant="icon" />}
                        </Link>
                      </div>

                      {/* Topics */}
                      <div className="hidden md:block min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                          {p.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="max-w-full truncate rounded-full bg-secondary/50 px-2.5 py-0.5 text-[11px] text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                          {p.tags.length > 2 && (
                            <span className="text-[10px] text-muted-foreground/70">
                              +{p.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Difficulty: Dot on mobile, full badge on md+ */}
                      <div className="flex justify-center md:justify-start">
                        <span
                          className={`md:hidden w-2.5 h-2.5 rounded-full shrink-0 ${
                            p.difficulty === 'Easy'
                              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]'
                              : p.difficulty === 'Medium'
                              ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]'
                              : 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.7)]'
                          }`}
                          title={p.difficulty}
                        />
                        <div className="hidden md:block">
                          {getDifficultyBadge(p.difficulty)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>

            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-8 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#93C572] text-black font-semibold'
                      : 'bg-card text-muted-foreground border border-border hover:bg-muted'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

        </section>
      </div>
    </div>
  );
};
