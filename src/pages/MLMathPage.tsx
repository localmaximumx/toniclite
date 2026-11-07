import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Code2,
  GraduationCap,
  Layers,
  Timer,
  Network,
  FlaskConical,
  Newspaper,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Circle,
  Menu,
  X,
  StickyNote,
  Sparkles,
} from 'lucide-react';
import {
  ThemeBridgeContext,
  NavigationBridgeContext,
  getTurbopackComponent,
  renderRscNode,
  initTurbopackRuntime,
} from '../runtime/turbopackRuntime';
import { ALL_TOPICS } from '../data/mlMathCurriculum';
import { PracticeSandboxModal } from '../components/PracticeSandboxModal';
import { QuickSearchModal } from '../components/QuickSearchModal';

const STORAGE_COMPLETED_KEY = 'tt_ml_math_completed_v1';
const STORAGE_NOTES_KEY = 'tt_ml_math_notes_v1';

const SIDEBAR_PRIMARY = [
  { name: 'ML Math Hub', href: '/ml-math', icon: Newspaper },
  { name: 'Statistics (15)', href: '/ml-math?module=1', icon: BookOpen, moduleId: 1 },
  { name: 'Probability (10)', href: '/ml-math?module=2', icon: Layers, moduleId: 2 },
  { name: 'Linear Algebra (11)', href: '/ml-math?module=3', icon: Code2, moduleId: 3 },
  { name: 'Calculus (9)', href: '/ml-math?module=4', icon: Timer, moduleId: 4 },
  { name: 'Optimization (9)', href: '/ml-math?module=5', icon: FlaskConical, moduleId: 5 },
  { name: 'Graph Theory (6)', href: '/ml-math?module=6', icon: Network, moduleId: 6 },
  { name: 'Information Theory (7)', href: '/ml-math?module=7', icon: GraduationCap, moduleId: 7 },
];

export const MLMathPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize Turbopack runtime
  useMemo(() => {
    initTurbopackRuntime();
  }, []);

  // Sync theme with TonicLite theme
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('toniclite_theme') || localStorage.getItem('opentensor_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const setTheme = useCallback((next: 'dark' | 'light') => {
    setThemeState(next);
  }, []);

  // Lessons JSON bundle loaded from /lessons-bundle.json
  const [lessonsBundle, setLessonsBundle] = useState<Record<string, any> | null>(null);
  const [bundleError, setBundleError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/lessons-bundle.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setLessonsBundle(data);
      })
      .catch((err) => {
        setBundleError(err?.message || 'Failed to load lessons bundle');
      });
  }, []);

  // Completed lessons tracker
  const [completedUrls, setCompletedUrls] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_COMPLETED_KEY);
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  });

  const toggleCompleted = useCallback((url: string) => {
    setCompletedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      try {
        localStorage.setItem(STORAGE_COMPLETED_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  // Personal study notes per lesson
  const [notesMap, setNotesMap] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_NOTES_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });
  const [notesOpen, setNotesOpen] = useState(false);

  const updateNote = useCallback((url: string, text: string) => {
    setNotesMap((prev) => {
      const next = { ...prev, [url]: text };
      try {
        localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Modals state
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeProblem, setActiveProblem] = useState<{ slug: string; title?: string } | null>(null);

  // Keyboard shortcut Cmd/Ctrl + K for quick search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Navigation handler
  const handleNavigate = useCallback(
    (target: string) => {
      const clean = target.replace(/^https?:\/\/(www\.)?tensortonic\.com/, '');
      if (clean.startsWith('/ml-math?module=')) {
        const modId = clean.split('module=')[1];
        try {
          localStorage.setItem('minf_last_opened_module', modId);
        } catch {}
      }
      navigate(clean);
      setMobileMenuOpen(false);
    },
    [navigate]
  );

  const currentPath = location.pathname + location.search;
  const cleanPathname = location.pathname;
  const isHubView = cleanPathname === '/ml-math' || cleanPathname === '/ml-math/';

  // Topic metadata
  const currentTopicMeta = useMemo(
    () => ALL_TOPICS.find((t) => t.url === cleanPathname),
    [cleanPathname]
  );

  useEffect(() => {
    if (currentTopicMeta) {
      document.title = `${currentTopicMeta.name} — ${currentTopicMeta.moduleTitle} | TonicLite`;
    } else {
      document.title = 'Machine Learning Math: 67 Interactive Lessons | TonicLite';
    }
  }, [currentTopicMeta]);

  // Instantiate HubPage & ChapterLayout from Turbopack bundle
  const HubPage = useMemo(() => getTurbopackComponent(239063, 'default'), []);
  const ChapterLayout = useMemo(() => getTurbopackComponent(291252, 'ChapterLayout'), []);

  const activeLessonData = lessonsBundle ? lessonsBundle[cleanPathname] : null;
  const renderedLessonChildren = useMemo(() => {
    if (!activeLessonData) return null;
    return renderRscNode(activeLessonData.children);
  }, [activeLessonData]);

  const themeContextValue = useMemo(
    () => ({
      theme,
      resolvedTheme: theme,
      setTheme,
    }),
    [theme, setTheme]
  );

  const navContextValue = useMemo(
    () => ({
      onNavigate: handleNavigate,
      onOpenProblem: (slug: string, title?: string) => setActiveProblem({ slug, title }),
    }),
    [handleNavigate]
  );

  return (
    <ThemeBridgeContext.Provider value={themeContextValue}>
      <NavigationBridgeContext.Provider value={navContextValue}>
        <div className="flex h-full w-full flex-col overflow-hidden bg-background text-foreground">
          {/* Subheader Toolbar for ML Math Section */}
          <div className="flex-shrink-0 border-b border-border bg-card/60 backdrop-blur-xl px-4 py-2.5 z-20">
            <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
              {/* Left: Mobile Toggle & Breadcrumb */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((v) => !v)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden shrink-0"
                >
                  {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>

                <div className="flex items-center gap-2 truncate text-xs sm:text-sm">
                  <button
                    type="button"
                    onClick={() => handleNavigate('/ml-math')}
                    className="font-bold text-foreground hover:text-brand-accent transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <GraduationCap className="h-4 w-4 text-[#93C572]" />
                    <span>ML Math</span>
                  </button>
                  {currentTopicMeta && (
                    <>
                      <span className="text-muted-foreground/40">/</span>
                      <span className="text-muted-foreground font-medium truncate">
                        {currentTopicMeta.moduleTitle}
                      </span>
                      <span className="text-muted-foreground/40">/</span>
                      <span className="font-semibold text-foreground truncate">
                        {currentTopicMeta.name}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Quick actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-background/80 hover:bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-all shadow-sm"
                >
                  <Search className="h-3.5 w-3.5 text-[#93C572]" />
                  <span>Search 67 Lessons</span>
                  <kbd className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                    ⌘K
                  </kbd>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveProblem({
                      slug:
                        currentTopicMeta?.problemSlug ||
                        currentTopicMeta?.problemSlugs?.[0] ||
                        'mean-median-mode',
                      title: currentTopicMeta ? `${currentTopicMeta.name} Lab` : 'ML Math Coding Lab',
                    })
                  }
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/80 hover:bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-all"
                >
                  <Code2 className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Coding</span> Sandbox
                </button>

                <button
                  type="button"
                  onClick={() => setNotesOpen((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    notesMap[cleanPathname]
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                      : 'border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <StickyNote className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Notes</span>
                </button>
              </div>
            </div>

            {/* Mobile Dropdown Modules */}
            {mobileMenuOpen && (
              <div className="mt-2 pt-2 border-t border-border lg:hidden flex flex-col gap-1">
                {SIDEBAR_PRIMARY.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleNavigate(item.href)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-foreground/80 hover:bg-secondary text-left"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Content & Left Sidebar Container */}
          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            {/* Collapsible Left AppSidebar */}
            <aside
              className={`hidden lg:flex flex-shrink-0 flex-col overflow-y-auto py-3 transition-[width] duration-200 ease-out border-r border-border bg-card/40 dark:bg-[#0c0c0c] custom-scrollbar ${
                sidebarCollapsed ? 'w-16 items-center px-2' : 'w-[224px] px-3'
              }`}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                {!sidebarCollapsed && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Curriculum Modules
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors mx-auto"
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronLeft className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <nav aria-label="Curriculum Modules" className="flex flex-col gap-1">
                {SIDEBAR_PRIMARY.map((item) => {
                  const isActive =
                    (item.href === '/ml-math' && isHubView) ||
                    (item.moduleId && currentTopicMeta?.moduleId === item.moduleId);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleNavigate(item.href)}
                      title={sidebarCollapsed ? item.name : undefined}
                      className={`relative flex h-9 items-center rounded-xl text-xs transition-all whitespace-nowrap ${
                        sidebarCollapsed ? 'w-10 justify-center' : 'w-full gap-2.5 px-3 text-left'
                      } ${
                        isActive
                          ? 'bg-[#93C572]/15 font-semibold text-[#93C572] border border-[#93C572]/30 shadow-sm'
                          : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 flex-shrink-0 ${
                          isActive ? 'text-[#93C572]' : 'text-muted-foreground'
                        }`}
                      />
                      {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                    </button>
                  );
                })}
              </nav>

              {/* Study Progress Box in Sidebar Footer */}
              {!sidebarCollapsed && (
                <div className="mt-auto pt-4">
                  <div className="rounded-xl border border-border bg-card/60 p-3 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                      <span className="font-medium">Mastery Progress</span>
                      <span className="font-mono tabular-nums font-bold text-foreground">
                        {completedUrls.size}/{ALL_TOPICS.length}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-[#93C572] transition-all duration-300"
                        style={{
                          width: `${Math.round((completedUrls.size / ALL_TOPICS.length) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="mt-2 text-[10px] text-muted-foreground text-center">
                      {Math.round((completedUrls.size / ALL_TOPICS.length) * 100)}% of 67 lessons completed
                    </div>
                  </div>
                </div>
              )}
            </aside>

            {/* Main Interactive Content */}
            <main className="relative min-w-0 flex-1 overflow-y-auto overflow-x-clip custom-scrollbar">
              {isHubView ? (
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                  <HubPage key={currentPath} />
                </div>
              ) : !lessonsBundle ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-12 text-muted-foreground">
                  {bundleError ? (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-center">
                      <p className="text-sm text-rose-400 font-semibold">{bundleError}</p>
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-3 rounded-lg bg-secondary px-3 py-1.5 text-xs text-foreground hover:bg-secondary/80"
                      >
                        Reload Page
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-transparent border-t-[#93C572]" />
                      <p className="text-sm font-medium">Loading interactive lesson...</p>
                    </>
                  )}
                </div>
              ) : activeLessonData ? (
                <div className="relative h-full">
                  {/* Floating Lesson Study Toolbar (Top-Right) */}
                  <div className="fixed top-[4.75rem] right-4 z-40 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCompleted(cleanPathname)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition-all whitespace-nowrap ${
                        completedUrls.has(cleanPathname)
                          ? 'border-[#93C572]/40 bg-[#93C572]/15 text-[#93C572]'
                          : 'border-border bg-card/90 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {completedUrls.has(cleanPathname) ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#93C572]" />
                          <span>Completed</span>
                        </>
                      ) : (
                        <>
                          <Circle className="h-3.5 w-3.5" />
                          <span>Mark Complete</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setNotesOpen((v) => !v)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-md transition-all whitespace-nowrap ${
                        notesMap[cleanPathname]
                          ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                          : 'border-border bg-card/90 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <StickyNote className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Notes</span>
                    </button>
                  </div>

                  {/* ChapterLayout with interactive visualizations */}
                  <ChapterLayout
                    key={cleanPathname}
                    sections={activeLessonData.sections}
                    moduleInfo={activeLessonData.moduleInfo}
                    chapterTitle={activeLessonData.chapterTitle}
                    subtitle={activeLessonData.subtitle}
                    prevLink={activeLessonData.prevLink}
                    nextLink={activeLessonData.nextLink}
                    backHref="/ml-math"
                    themeAware={true}
                  >
                    {renderedLessonChildren}
                  </ChapterLayout>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-12 text-center">
                  <p className="text-base font-semibold text-foreground">
                    Lesson not found: {cleanPathname}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md">
                    The requested mathematical topic is being loaded or could not be matched.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/ml-math')}
                    className="rounded-xl bg-[#93C572] px-5 py-2.5 text-xs font-bold text-black hover:bg-[#A4D287] transition-all"
                  >
                    Back to ML Math Hub
                  </button>
                </div>
              )}
            </main>

            {/* Personal Study Notes Slide-over Panel */}
            {notesOpen && (
              <aside className="w-80 sm:w-96 border-l border-border bg-card p-5 flex flex-col gap-4 z-40 shrink-0 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Personal Study Notes</h3>
                    <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                      {currentTopicMeta ? currentTopicMeta.name : 'General ML Math Notes'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotesOpen(false)}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <textarea
                  value={notesMap[cleanPathname] || ''}
                  onChange={(e) => updateNote(cleanPathname, e.target.value)}
                  placeholder="Write down key mathematical intuition, derivations, or questions for this lesson... (Saved automatically in your browser)"
                  className="flex-1 w-full rounded-xl border border-border bg-background p-3.5 text-xs leading-relaxed text-foreground placeholder-muted-foreground focus:border-[#93C572] focus:outline-none resize-none font-mono"
                />

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-[#93C572]" />
                    Auto-saved locally
                  </span>
                  <span>{(notesMap[cleanPathname] || '').length} chars</span>
                </div>
              </aside>
            )}
          </div>

          {/* Quick Search Modal (Cmd+K) */}
          <QuickSearchModal
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            onSelectUrl={(url) => handleNavigate(url)}
            completedUrls={completedUrls}
          />

          {/* Interactive Practice Coding Sandbox Modal */}
          <PracticeSandboxModal
            problemSlug={activeProblem?.slug || null}
            problemTitle={activeProblem?.title}
            onClose={() => setActiveProblem(null)}
          />
        </div>
      </NavigationBridgeContext.Provider>
    </ThemeBridgeContext.Provider>
  );
};
