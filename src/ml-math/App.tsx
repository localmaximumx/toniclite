import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  StickyNote,
  X,
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
import { getCurrentUser, getUserMLNotes, saveUserMLNote, UserAccount } from '../services/authService';

const STORAGE_COMPLETED_KEY = 'tt_ml_math_completed_v1';
const STORAGE_NOTES_KEY = 'tt_ml_math_notes_v1';
const STORAGE_THEME_KEY = 'toniclite_theme';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize Turbopack runtime once
  useMemo(() => {
    initTurbopackRuntime();
  }, []);

  // Theme state synced with TonicLite's dark/light mode
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THEME_KEY) || localStorage.getItem('opentensor_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const setTheme = useCallback((next: 'dark' | 'light') => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_THEME_KEY, next);
      window.dispatchEvent(new Event('toniclite_theme_change'));
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

  // Current authenticated user & notes synced with their database
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [notesMap, setNotesMap] = useState<Record<string, string>>(() => getUserMLNotes());
  const [notesOpen, setNotesOpen] = useState(false);

  // Sync notes on auth change (login, logout, account switch)
  useEffect(() => {
    const handleAuth = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
      setNotesMap(getUserMLNotes(user?.id));
    };
    window.addEventListener('tensortonic_auth_change', handleAuth);
    return () => window.removeEventListener('tensortonic_auth_change', handleAuth);
  }, []);

  const updateNote = useCallback((url: string, text: string) => {
    setNotesMap((prev) => ({ ...prev, [url]: text }));
    saveUserMLNote(url, text, currentUser?.id);
  }, [currentUser]);

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
        } catch {
          // ignore
        }
      }
      navigate(clean);
    },
    [navigate]
  );

  const currentPath = location.pathname + location.search;
  const cleanPathname = location.pathname;
  const isHubView = cleanPathname === '/ml-math' || cleanPathname === '/ml-math/';

  // Update document title dynamically
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

  // Instantiate HubPage & ChapterLayout from extracted Turbopack bundle
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

  const hubRefreshKey = currentPath;

  return (
    <ThemeBridgeContext.Provider value={themeContextValue}>
      <NavigationBridgeContext.Provider value={navContextValue}>
        <div className="h-full w-full overflow-hidden bg-background text-foreground flex flex-col">
          {/* Main Content Area */}
          <main className="relative min-w-0 flex-1 h-full overflow-hidden">
            {isHubView ? (
              <HubPage key={hubRefreshKey} />
            ) : !lessonsBundle ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-12 text-muted-foreground">
                {bundleError ? (
                  <p className="text-sm text-rose-400">{bundleError}</p>
                ) : (
                  <>
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-transparent border-t-[#93C572]" />
                    <p className="text-sm">Loading interactive lesson...</p>
                  </>
                )}
              </div>
            ) : activeLessonData ? (
              <div className="relative h-full overflow-hidden">
                {/* Floating Lesson Study Toolbar (Top-Right) */}
                <div className="fixed top-20 right-6 z-40 flex items-center gap-2">
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

                {/* ChapterLayout with interactive math visualizations */}
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
                  className="rounded-lg bg-[#93C572] hover:bg-[#82b362] px-4 py-2 text-xs font-semibold text-black transition-colors"
                >
                  Back to ML Math
                </button>
              </div>
            )}
          </main>

          {/* Personal Study Notes Slide-over Panel */}
          {notesOpen && (
            <aside className="fixed inset-y-0 right-0 w-80 sm:w-96 border-l border-border bg-card p-5 flex flex-col gap-4 z-50 shadow-2xl">
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
                <span>
                  {currentUser ? (
                    <span className="text-emerald-500 font-medium">✓ Synced to {currentUser.username}'s database</span>
                  ) : (
                    <span className="text-muted-foreground">Saved locally (sign in to sync to database)</span>
                  )}
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
      </NavigationBridgeContext.Provider>
    </ThemeBridgeContext.Provider>
  );
}
