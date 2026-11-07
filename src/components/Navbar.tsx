import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  CheckCircle2, 
  ChevronDown, 
  User, 
  LogIn, 
  LogOut, 
  Download, 
  Users, 
  ShieldCheck,
  Menu,
  X,

  Code2,
  BookOpen,
  Radio,
  Database,
  Flame,
  Settings,
  GraduationCap
} from 'lucide-react';
import { 
  getCurrentUser, 
  logoutUser, 
  getUserSolvedProblems, 
  syncUserSession,
  exportAccountBackup, 
  getUserStorageUsage,
  getUserStreak,
  UserStreakData,
  UserStorageUsage,
  UserAccount 
} from '../services/authService';
import { AuthModal } from './AuthModal';
import { PaletteSwitcher } from './PaletteSwitcher';
import { getUserEloRating, getUserRankTier } from '../services/authService';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('toniclite_theme') || localStorage.getItem('opentensor_theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark');
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    if (typeof window === 'undefined') return 0.9;
    try {
      const saved = localStorage.getItem('toniclite_zoom');
      if (saved) return parseFloat(saved);
    } catch {
      // ignore
    }
    return 0.9;
  });

  const cycleZoom = () => {
    const nextZoom = zoomLevel === 0.9 ? 0.85 : zoomLevel === 0.85 ? 1.0 : 0.9;
    setZoomLevel(nextZoom);
    try {
      localStorage.setItem('toniclite_zoom', nextZoom.toString());
      document.documentElement.style.zoom = nextZoom.toString();
    } catch {
      // ignore
    }
  };
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [storageUsage, setStorageUsage] = useState<UserStorageUsage>(() => getUserStorageUsage());
  const [streakData, setStreakData] = useState<UserStreakData>(() => getUserStreak());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const refreshAuth = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setSolvedCount(user.solvedProblems?.length || 0);
    } else {
      setSolvedCount(0);
    }
    setStorageUsage(getUserStorageUsage(user?.id));
    setStreakData(getUserStreak(user?.id));
  };

  useEffect(() => {
    refreshAuth();
    syncUserSession().then(() => refreshAuth());

    const syncTheme = () => {
      const savedTheme = localStorage.getItem('toniclite_theme') || localStorage.getItem('opentensor_theme');
      if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
        setIsDark(false);
      } else if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        setIsDark(true);
      } else {
        const isDomDark = document.documentElement.classList.contains('dark');
        setIsDark(isDomDark);
      }
    };

    syncTheme();

    const handleAuthChange = () => refreshAuth();
    const handleThemeChange = () => syncTheme();


    window.addEventListener('tensortonic_auth_change', handleAuthChange);
    window.addEventListener('toniclite_theme_change', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);
    return () => {
      window.removeEventListener('tensortonic_auth_change', handleAuthChange);
      window.removeEventListener('toniclite_theme_change', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  // Close user dropdown on outside click & escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('toniclite_theme', 'dark');
      localStorage.setItem('opentensor_theme', 'dark');
      window.dispatchEvent(new CustomEvent('toniclite_theme_change', { detail: 'dark' }));
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('toniclite_theme', 'light');
      localStorage.setItem('opentensor_theme', 'light');
      window.dispatchEvent(new CustomEvent('toniclite_theme_change', { detail: 'light' }));
    }
  };

  const handleExportBackup = () => {
    if (!currentUser) return;
    const jsonStr = exportAccountBackup(currentUser.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toniclite_${currentUser.username}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsUserMenuOpen(false);
  };

  const navLinks = [

    { label: 'Problems', path: '/problems', icon: Code2 },
    { label: 'ML Math', path: '/ml-math', icon: GraduationCap },
    { label: 'Research', path: '/research', icon: BookOpen },
    { label: 'Interview', path: '/interview', icon: Radio }
  ];

  const getInitials = (name: string) => {
    if (!name) return 'OT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => refreshAuth()}
      />

      <nav className="text-foreground sticky top-0 z-50 w-full pt-3 pb-1 flex-shrink-0">
        <div className="container mx-auto px-4 max-w-7xl relative">
          <div className="relative z-50 h-14 flex items-center justify-between pl-5 pr-3 rounded-full border backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border-border bg-card/95 dark:border-border/60 dark:bg-background/60">
            
            {/* Left: Brand logo & Nav links */}
            <div className="flex items-center gap-2 md:gap-8 flex-shrink-0">
              <Link to="/" className="hover:opacity-85 transition-opacity flex items-center gap-2 shrink-0">
                <img
                  alt="TonicLite"
                  width={28}
                  height={28}
                  className="h-7 w-auto flex-shrink-0 drop-shadow-sm"
                  src="/images/logos/toniclite.svg"
                />
                <span className="text-foreground font-black text-base sm:text-lg tracking-tight font-sans inline">
                  Tonic<span className="text-[#93C572]">Lite</span>
                </span>
              </Link>

              <div className="hidden lg:flex items-center gap-6">
                {navLinks.map((link) => {
                  const isInterview = link.path === '/interview' && (
                    location.pathname.startsWith('/interview') ||
                    location.search.includes('assessment=')
                  );
                  const isResearch = link.path === '/research' && location.pathname.startsWith('/research');
                  const isProblems = link.path === '/problems' && (
                    location.pathname.startsWith('/problems') && !location.search.includes('assessment=')
                  );
                  const isMLMath = link.path === '/ml-math' && location.pathname.startsWith('/ml-math');
                  const isActive = isInterview || isResearch || isProblems || isMLMath;

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`text-sm transition-colors ${
                        isActive
                          ? 'text-brand-accent dark:text-[#93C572] font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right: Solved Counter, Theme Toggle, User Account */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              
              {/* Solved Progress Counter */}
              <Link
                to="/problems"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground border border-border/80 transition-colors"
                title={currentUser ? `${currentUser.username}'s solved problems` : "Total solved problems"}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#93C572]" />
                <span className="tabular-nums font-mono font-semibold">{solvedCount}</span>
                <span className="text-[11px] opacity-70">/ 790</span>
              </Link>

              {/* Daily Streak Flame Counter */}
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 transition-colors shadow-xs"
                title={`Daily Streak: ${streakData.currentStreak} day${streakData.currentStreak === 1 ? '' : 's'}`}
              >
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                <span className="tabular-nums font-mono">{streakData.currentStreak}</span>
              </Link>



              {/* Palette Switcher */}
              <PaletteSwitcher />

              {/* Display Zoom Density Toggle (90% default, cycles 90% -> 85% -> 100%) */}
              <button
                onClick={cycleZoom}
                aria-label="Toggle display zoom scale"
                className="hidden md:inline-flex items-center justify-center px-2 h-7 rounded-md text-xs font-mono font-bold text-muted-foreground hover:text-foreground hover:bg-accent border border-border/50 transition-colors"
                title={`Display Scale: ${Math.round(zoomLevel * 100)}% (Click to toggle 90% / 85% / 100%)`}
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              {/* Theme Toggle Button (Desktop visible, on mobile moved into hamburger menu) */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="hidden md:inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Account Pill / Menu */}
              {currentUser ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => {
                      const next = !isUserMenuOpen;
                      setIsUserMenuOpen(next);
                      if (next) {
                        setStorageUsage(getUserStorageUsage(currentUser.id));
                        setStreakData(getUserStreak(currentUser.id));
                      }
                    }}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/60 hover:bg-secondary border border-border/70 transition-colors text-xs font-semibold text-foreground group"
                  >
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-black shadow-xs shrink-0"
                      style={{ backgroundColor: currentUser.avatarColor || '#93C572' }}
                    >
                      {getInitials(currentUser.displayName || currentUser.username)}
                    </div>
                    <span className="max-w-[100px] truncate hidden md:inline">
                      {currentUser.displayName || currentUser.username}
                    </span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-transform" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-card dark:bg-[#111614] border border-border dark:border-[#27382d] rounded-2xl shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                      
                      {/* User Header Linking to Profile */}
                      <Link 
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-3 border-b border-border dark:border-[#27382d] hover:bg-secondary/40 dark:hover:bg-[#15201a] transition-colors"
                      >
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div 
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-black shrink-0 ring-2 ring-white/10"
                            style={{ backgroundColor: currentUser.avatarColor || '#93C572' }}
                          >
                            {getInitials(currentUser.displayName || currentUser.username)}
                          </div>
                          <div className="truncate min-w-0">
                            <div className="font-bold text-foreground dark:text-white truncate text-sm">{currentUser.displayName || currentUser.username}</div>
                            <div className="text-[11px] text-muted-foreground font-mono truncate">@{currentUser.username}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#93C572]/15 text-[#93C572] text-[10px] font-semibold">
                            <ShieldCheck className="w-3 h-3" />
                            <span>{currentUser.role}</span>
                          </div>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold font-mono">
                            <Flame className="w-3 h-3 fill-amber-500" />
                            <span>{streakData.currentStreak}d Streak</span>
                          </div>
                        </div>
                      </Link>

                      {/* Solved Stats Preview */}
                      <div className="px-4 py-2 border-b border-border dark:border-[#27382d] flex items-center justify-between text-muted-foreground font-mono text-[11px] bg-secondary/20 dark:bg-black/20">
                        <span>Solved Problems</span>
                        <span className="text-[#93C572] font-bold">{currentUser.solvedProblems?.length || 0} / 790</span>
                      </div>

                      {/* ELO Rank Tier Badge */}
                      <div className="px-4 py-2 border-b border-border dark:border-[#27382d] flex items-center justify-between text-[11px] bg-secondary/10">
                        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                          <span>{getUserRankTier(getUserEloRating(currentUser?.id)).tierIcon}</span>
                          <span className="text-foreground font-semibold">{getUserRankTier(getUserEloRating(currentUser?.id)).tierName}</span>
                        </span>
                        <span className="font-mono font-bold text-primary">
                          {getUserEloRating(currentUser?.id)} ELO
                        </span>
                      </div>

                      {/* Navigation Actions */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-[#1a241f] text-foreground/80 dark:text-gray-300 hover:text-foreground dark:hover:text-white flex items-center gap-2.5 transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-[#93C572]" />
                          <span>Profile & Activity Heatmap</span>
                        </Link>
                        <Link
                          to="/profile?tab=settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-[#1a241f] text-foreground/80 dark:text-gray-300 hover:text-foreground dark:hover:text-white flex items-center gap-2.5 transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5 text-sky-400" />
                          <span>Account Settings & Storage</span>
                        </Link>
                        <button
                          onClick={handleExportBackup}
                          className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-[#1a241f] text-foreground/80 dark:text-gray-300 hover:text-foreground dark:hover:text-white flex items-center gap-2.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-purple-400" />
                          <span>Export Account Backup (JSON)</span>
                        </button>
                        <button
                          onClick={() => { setIsUserMenuOpen(false); setIsAuthModalOpen(true); }}
                          className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-[#1a241f] text-foreground/80 dark:text-gray-300 hover:text-foreground dark:hover:text-white flex items-center gap-2.5 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 text-amber-400" />
                          <span>Switch Account / New User</span>
                        </button>
                        <button
                          onClick={() => { logoutUser(); setIsUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-2.5 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#93C572] hover:bg-[#A4D287] text-black text-xs font-bold transition-colors shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="lg:hidden inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ml-1"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5" />}
              </button>

            </div>

          </div>

          {/* Backdrop overlay when mobile menu is open (dims content below, tap to dismiss) */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Mobile Navigation Dropdown - floating overlay over page text and problems list */}
          {isMobileMenuOpen && (
            <div className="lg:hidden absolute top-[calc(100%+0.5rem)] left-4 right-4 z-50 p-3 bg-card/98 dark:bg-[#121212]/98 backdrop-blur-2xl border border-border/80 dark:border-border/60 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[calc(100dvh-5.5rem)] overflow-y-auto custom-scrollbar">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isInterview = link.path === '/interview' && (
                  location.pathname.startsWith('/interview') ||
                  location.search.includes('assessment=')
                );
                const isResearch = link.path === '/research' && location.pathname.startsWith('/research');
                const isProblems = link.path === '/problems' && (
                  location.pathname.startsWith('/problems') && !location.search.includes('assessment=')
                );
                const isMLMath = link.path === '/ml-math' && location.pathname.startsWith('/ml-math');
                const isActive = isInterview || isResearch || isProblems || isMLMath;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#93C572]/15 text-[#93C572] border border-[#93C572]/30'
                        : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#93C572]" />}
                  </Link>
                );
              })}

              {/* Profile & Streak Link in Mobile Menu */}
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  location.pathname === '/profile'
                    ? 'bg-[#93C572]/15 text-[#93C572] border border-[#93C572]/30'
                    : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                <User className="w-4 h-4 text-[#93C572]" />
                <span>Profile & Streak</span>
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-xs font-mono font-bold">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{streakData.currentStreak}d</span>
                </span>
              </Link>



              {/* Theme Toggle Button Inside Mobile Menu */}
              <div className="pt-2 mt-2 border-t border-border/60">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-foreground/90 hover:text-foreground hover:bg-secondary/60 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    {isDark ? (
                      <Moon className="w-4 h-4 text-[#93C572]" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-400" />
                    )}
                    <span>Theme</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary border border-border/60">
                    {isDark ? (
                      <>
                        <Sun className="w-3 h-3 text-amber-400" />
                        <span>Dark (Tap to switch)</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3 h-3 text-[#93C572]" />
                        <span>Light (Tap to switch)</span>
                      </>
                    )}
                  </span>
                </button>
              </div>

              {/* Mobile Palette Switcher */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between px-4 py-2">
                <span className="text-sm font-semibold text-foreground/90">Color Palette</span>
                <PaletteSwitcher />
              </div>

              {/* Mobile Display Scale */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between px-4 py-2">
                <span className="text-sm font-semibold text-foreground/90">Display Scale</span>
                <button
                  onClick={cycleZoom}
                  className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-secondary text-foreground border border-border/60 hover:bg-accent transition-colors"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
              </div>

              {/* Mobile Solved Counter */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#93C572]" />
                  <span>Your Solved Problems</span>
                </span>
                <span className="font-mono font-bold text-foreground">{solvedCount} / 790</span>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};
