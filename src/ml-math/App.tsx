import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Sun,
  Moon,
  Search,
  CheckCircle2,
  Circle,
  Menu,
  X,
  StickyNote,
} from 'lucide-react';
import {
  ThemeBridgeContext,
  NavigationBridgeContext,
  getTurbopackComponent,
  renderRscNode,
  initTurbopackRuntime,
} from './runtime/turbopackRuntime';
import { ALL_TOPICS } from './data/curriculum';
import { PracticeSandboxModal } from './components/PracticeSandboxModal';
import { QuickSearchModal } from './components/QuickSearchModal';

const STORAGE_COMPLETED_KEY = 'tt_ml_math_completed_v1';
const STORAGE_NOTES_KEY = 'tt_ml_math_notes_v1';
const STORAGE_THEME_KEY = 'tt_ml_math_theme_v1';

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

export default function App() {
  // Initialize Turbopack runtime once
  useMemo(() => {
    initTurbopackRuntime();
  }, []);

  // Theme state synced with <html class="dark">
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  const setTheme = useCallback((next: 'dark' | 'light') => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_THEME_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  // Current route state (supports browser back/forward and initial pathname)
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const p = window.location.pathname;
    if (p.startsWith('/ml-math')) return p + window.location.search;
    return '/ml-math';
  });

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
    } catch {
      // ignore
    }
    return new Set();
  });

  const toggleCompleted = useCallback((url: string) => {
    setCompletedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      try {
        localStorage.setItem(STORAGE_COMPLETED_KEY, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Personal study notes per lesson
  const [notesMap, setNotesMap] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_NOTES_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return {};
  });
  const [notesOpen, setNotesOpen] = useState(false);

  const updateNote = useCallback((url: string, text: string) => {
    setNotesMap((prev) => {
      const next = { ...prev, [url]: text };
      try {
        localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--app-sidebar-w',
      sidebarCollapsed ? '64px' : '216px'
    );
    return () => {
      document.documentElement.style.removeProperty('--app-sidebar-w');
    };
  }, [sidebarCollapsed]);

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
  const handleNavigate = useCallback((target: string) => {
    const clean = target.replace(/^https?:\/\/(www\.)?tensortonic\.com/, '');
    if (clean.startsWith('/ml-math?module=')) {
      const modId = clean.split('module=')[1];
      try {
        localStorage.setItem('minf_last_opened_module', modId);
      } catch {
        // ignore
      }
    }
    window.history.pushState({}, '', clean);
    setCurrentPath(clean);
    setMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const p = window.location.pathname + window.location.search;
      setCurrentPath(p.startsWith('/ml-math') ? p : '/ml-math');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const cleanPathname = currentPath.split('?')[0];
  const isHubView = cleanPathname === '/ml-math' || cleanPathname === '/';

  // Update document title dynamically
  const currentTopicMeta = useMemo(
    () => ALL_TOPICS.find((t) => t.url === cleanPathname),
    [cleanPathname]
  );

  useEffect(() => {
    if (currentTopicMeta) {
      document.title = `${currentTopicMeta.name} — ${currentTopicMeta.moduleTitle} | TensorTonic`;
    } else {
      document.title = 'Machine Learning Math: 67 Interactive Lessons | TensorTonic';
    }
  }, [currentTopicMeta]);

  // Instantiate HubPage & ChapterLayout from our extracted Turbopack bundle
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

  const hubRefreshKey = currentPath; // Re-mount HubPage when ?module= changes so it reads updated query/localStorage

  return (
    <ThemeBridgeContext.Provider value={themeContextValue}>
      <NavigationBridgeContext.Provider value={navContextValue}>
        <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
          {/* Top Bar */}
          <header className="relative z-50 flex-shrink-0 border-b border-border bg-card/95 backdrop-blur-2xl dark:border-[#1f1f1f] dark:bg-[#0e0e0e]">
            <div className="flex h-14 items-center justify-between gap-8 px-3 lg:px-5">
              {/* Zone 1: Brand Lockup */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((v) => !v)}
                  aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('/ml-math')}
                  className="flex items-center gap-2.5 transition-opacity hover:opacity-80 whitespace-nowrap shrink-0"
                >
                  <img
                    src="/images/logos/ttsvg.svg"
                    alt="TensorTonic"
                    width={28}
                    height={28}
                    referrerPolicy="no-referrer"
                    className="h-7 w-auto flex-shrink-0"
                  />
                  <span
                    style={{ fontFamily: "'Satoshi', sans-serif" }}
                    className="text-lg font-black tracking-tight text-foreground whitespace-nowrap shrink-0"
                  >
                    TensorTonic
                  </span>
                </button>
              </div>

              {/* Zone 2: Primary Navigation Links */}
              <nav aria-label="Main" className="hidden md:flex items-center gap-6 text-sm">
                <button
                  type="button"
                  onClick={() => handleNavigate('/ml-math')}
                  className={`transition-colors whitespace-nowrap shrink-0 ${
                    isHubView
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Curriculum
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0"
                >
                  Lesson Index ({ALL_TOPICS.length})
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
                  className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0"
                >
                  Coding Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setNotesOpen((v) => !v)}
                  className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0"
                >
                  Study Notes
                </button>
                <button
                  type="button"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0"
                >
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
              </nav>

              {/* Zone 3: Single Primary Action */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-brand-cta hover:bg-brand-cta/90 text-brand-cta-foreground font-semibold px-3.5 py-1.5 text-xs transition-colors whitespace-nowrap shrink-0"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Search Lessons</span>
                </button>
              </div>
            </div>

            {/* Mobile dropdown menu */}
            {mobileMenuOpen && (
              <div className="absolute left-3 right-3 top-[60px] z-50 max-h-[calc(100dvh-72px)] overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-xl dark:border-white/[0.08] dark:bg-[#141414] lg:hidden">
                {SIDEBAR_PRIMARY.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleNavigate(item.href)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/80 hover:bg-accent text-left"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{item.name}</span>
                  </button>
                ))}
                <div className="my-2 border-t border-border/50" />
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/80 hover:bg-accent text-left"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Moon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Theme</span>
                </button>
              </div>
            )}
          </header>

          {/* Main Workspace Container */}
          <div className="relative z-[1] flex min-h-0 flex-1">
            {/* Collapsible Left AppSidebar */}
            <div className="group/sidebar relative z-10 hidden flex-shrink-0 lg:flex">
              <aside
                className={`flex flex-shrink-0 flex-col overflow-y-auto py-4 transition-[width] duration-200 ease-out border-r border-border dark:border-[#1f1f1f] dark:bg-[#0e0e0e] ${
                  sidebarCollapsed ? 'w-16 items-center px-3' : 'w-[216px] px-2.5'
                }`}
              >
                <nav
                  aria-label="Curriculum Modules"
                  className={`flex flex-col gap-0.5 ${sidebarCollapsed ? 'items-center' : ''}`}
                >
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
                        className={`relative flex h-9 items-center rounded-lg text-sm transition-colors duration-200 ease-out whitespace-nowrap ${
                          sidebarCollapsed ? 'w-10 justify-center' : 'w-full gap-3 px-3 text-left'
                        } ${
                          isActive
                            ? 'bg-secondary font-semibold text-foreground dark:bg-[#222222]'
                            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground dark:hover:bg-[#1b1b1b]'
                        }`}
                      >
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-brand-accent"
                          />
                        )}
                        <Icon
                          className={`h-4 w-4 flex-shrink-0 ${
                            isActive ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        />
                        {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                      </button>
                    );
                  })}
                </nav>

                {/* Study Progress & Theme in Sidebar Footer */}
                <div
                  className={`mt-auto flex flex-col gap-1 pt-6 ${
                    sidebarCollapsed ? 'items-center' : ''
                  }`}
                >
                  {!sidebarCollapsed && (
                    <div className="mb-2 rounded-xl border border-border bg-card/50 p-3 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                        <span>Study Progress</span>
                        <span className="font-mono tabular-nums font-semibold text-foreground">
                          {completedUrls.size}/{ALL_TOPICS.length}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{
                            width: `${Math.round((completedUrls.size / ALL_TOPICS.length) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    title={sidebarCollapsed ? 'Toggle Theme' : undefined}
                    className={`flex h-8 items-center rounded-lg text-[13px] text-muted-foreground/80 hover:bg-secondary/60 hover:text-foreground transition-colors ${
                      sidebarCollapsed ? 'w-10 justify-center' : 'w-full gap-3 px-3'
                    }`}
                  >
                    {theme === 'dark' ? (
                      <Moon className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <Sun className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {!sidebarCollapsed && (
                      <span>{theme === 'dark' ? 'Dark Theme' : 'Light Theme'}</span>
                    )}
                  </button>
                </div>
              </aside>

              <button
                type="button"
                onClick={() => setSidebarCollapsed((v) => !v)}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground opacity-0 shadow-sm transition-[opacity,color] duration-200 hover:text-foreground focus-visible:opacity-100 group-hover/sidebar:opacity-100 dark:border-[#2a2a2a] dark:bg-[#161616]"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronLeft className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Main Content Area */}
            <main className="relative min-w-0 flex-1 overflow-y-auto overflow-x-clip custom-scrollbar">
              {isHubView ? (
                <HubPage key={hubRefreshKey} />
              ) : !lessonsBundle ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-12 text-muted-foreground">
                  {bundleError ? (
                    <p className="text-sm text-rose-400">{bundleError}</p>
                  ) : (
                    <>
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-transparent border-t-emerald-500" />
                      <p className="text-sm">Loading interactive lesson...</p>
                    </>
                  )}
                </div>
              ) : activeLessonData ? (
                <div className="relative h-full">
                  {/* Floating Lesson Study Toolbar (Top-Right) */}
                  <div className="fixed top-[4.5rem] right-4 z-40 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCompleted(cleanPathname)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-md transition-colors whitespace-nowrap ${
                        completedUrls.has(cleanPathname)
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                          : 'border-border bg-card/90 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {completedUrls.has(cleanPathname) ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
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
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-md transition-colors whitespace-nowrap ${
                        notesMap[cleanPathname]
                          ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                          : 'border-border bg-card/90 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <StickyNote className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Notes</span>
                    </button>
                  </div>

                  {/* Authentic TensorTonic ChapterLayout with all interactive visualizations */}
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
                  <p className="text-base font-medium text-foreground">
                    Lesson not found: {cleanPathname}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/ml-math')}
                    className="rounded-lg bg-brand-cta px-4 py-2 text-xs font-semibold text-brand-cta-foreground"
                  >
                    Back to ML Math Hub
                  </button>
                </div>
              )}
            </main>

            {/* Personal Study Notes Slide-over Panel */}
            {notesOpen && (
              <aside className="w-80 sm:w-96 border-l border-border bg-card p-5 flex flex-col gap-4 z-40 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Personal Study Notes</h3>
                    <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                      {currentTopicMeta ? currentTopicMeta.name : 'General ML Math Notes'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotesOpen(false)}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <textarea
                  value={notesMap[cleanPathname] || ''}
                  onChange={(e) => updateNote(cleanPathname, e.target.value)}
                  placeholder="Write down key formulas, intuition, or questions for this lesson... (Saved automatically in your browser)"
                  className="flex-1 w-full rounded-xl border border-border bg-background p-3.5 text-sm leading-relaxed text-foreground placeholder-muted-foreground focus:border-emerald-500/50 focus:outline-none resize-none"
                />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Auto-saved locally</span>
                  <span>{(notesMap[cleanPathname] || '').length} chars</span>
                </div>
              </aside>
            )}
          </div>
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
      </NavigationBridgeContext.Provider>
    </ThemeBridgeContext.Provider>
  );
}
