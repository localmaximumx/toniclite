import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RotateCw } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { ProblemsPage } from './pages/ProblemsPage';
import { ProblemSolverPage } from './pages/ProblemSolverPage';
import { StudyPlansPage } from './pages/StudyPlansPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ResearchPage } from './pages/ResearchPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { InterviewPage } from './pages/InterviewPage';
import { MLDesignPage } from './pages/MLDesignPage';
import { ProfilePage } from './pages/ProfilePage';
import { MLMathPage } from './pages/MLMathPage';

const PULL_THRESHOLD = 68;

function isAtScrollTop(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return window.scrollY <= 0;
  if (target.closest('.monaco-editor') || target.closest('input[type="range"]')) {
    return false;
  }
  let el: HTMLElement | null = target;
  while (el && el !== document.body && el !== document.documentElement) {
    if (el.scrollTop > 2) {
      return false;
    }
    el = el.parentElement;
  }
  return window.scrollY <= 2;
}

const AppContent: React.FC = () => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStateRef = useRef<{
    active: boolean;
    startY: number;
    startX: number;
    pulling: boolean;
    distance: number;
  }>({
    active: false,
    startY: 0,
    startX: 0,
    pulling: false,
    distance: 0,
  });

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || isRefreshing) return;
      if (!isAtScrollTop(e.target)) {
        touchStateRef.current.active = false;
        return;
      }
      const touch = e.touches[0];
      touchStateRef.current = {
        active: true,
        startY: touch.clientY,
        startX: touch.clientX,
        pulling: false,
        distance: 0,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      const state = touchStateRef.current;
      if (!state.active || e.touches.length !== 1 || isRefreshing) return;

      if (!state.pulling && !isAtScrollTop(e.target)) {
        state.active = false;
        setPullDistance(0);
        return;
      }

      const touch = e.touches[0];
      const dy = touch.clientY - state.startY;
      const dx = Math.abs(touch.clientX - state.startX);

      if (dy <= 0) {
        if (state.pulling) {
          state.pulling = false;
          state.distance = 0;
          setPullDistance(0);
        }
        return;
      }

      if (!state.pulling) {
        if (dy > 12 && dy > dx * 1.5) {
          state.pulling = true;
        } else if (dx > 15) {
          state.active = false;
          return;
        } else {
          return;
        }
      }

      const damped = Math.min(110, (dy - 12) * 0.55);
      state.distance = damped;
      setPullDistance(damped);
    };

    const handleTouchEnd = () => {
      const state = touchStateRef.current;
      if (!state.active) return;
      const finalDist = state.distance;
      state.active = false;
      state.pulling = false;
      state.distance = 0;

      if (finalDist >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        setPullDistance(PULL_THRESHOLD);
        window.location.reload();
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isRefreshing]);

  return (
    <div className="h-full w-full bg-background text-foreground flex flex-col overflow-hidden relative">
      {/* Mobile Pull-to-Refresh Indicator */}
      {(pullDistance > 8 || isRefreshing) && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[100] pointer-events-none transition-transform duration-75"
          style={{
            top: `${Math.min(72, Math.max(12, pullDistance))}px`,
          }}
        >
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border shadow-lg text-xs font-medium text-foreground">
            <RotateCw
              className={`w-4 h-4 text-[#93C572] ${isRefreshing ? 'animate-spin' : ''}`}
              style={
                !isRefreshing
                  ? { transform: `rotate(${Math.round(pullDistance * 4)}deg)` }
                  : undefined
              }
            />
            <span>
              {isRefreshing
                ? 'Reloading...'
                : pullDistance >= PULL_THRESHOLD
                ? 'Release to reload'
                : 'Pull down to reload'}
            </span>
          </div>
        </div>
      )}

      <Navbar />
      <main className="flex-1 min-h-0 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/problems" element={<ProblemsPage />} />
          <Route path="/problems/:slug" element={<ProblemSolverPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<ProfilePage />} />
          <Route path="/interview" element={<InterviewPage />} />
          <Route path="/mock-interview" element={<Navigate to="/interview" replace />} />
          <Route path="/flashcards" element={<Navigate to="/interview" replace />} />
          <Route path="/interview/solve/:slug" element={<ProblemSolverPage />} />
          <Route path="/interview/:slug" element={<ProblemSolverPage />} />
          <Route path="/assessments" element={<Navigate to="/interview" replace />} />
          <Route path="/study-plans" element={<StudyPlansPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/research/:paperId" element={<ResearchPage />} />
          <Route path="/research/:paperId/:slug" element={<ProblemSolverPage />} />
          <Route path="/ml-design" element={<MLDesignPage />} />
          <Route path="/systems" element={<MLDesignPage />} />
          <Route path="/ml-math" element={<MLMathPage />} />
          <Route path="/ml-math/*" element={<MLMathPage />} />
          <Route path="/blitz" element={<Navigate to="/ml-math" replace />} />
          <Route path="/speedrun" element={<Navigate to="/ml-math" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};
