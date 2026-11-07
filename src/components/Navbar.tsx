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

      <nav className="text-foreground sticky top-0 z-50 w-full border-b border-border bg-card/95 dark:border-border/60 dark:bg-background/95 backdrop-blur-2xl flex-shrink-0">
        <div className="w-full h-14 flex items-center justify-between px-4 sm:px-6 relative">
            
            {/* Left: Mobile Hamburger, Brand logo & Nav links */}
            <div className="flex items-center gap-2 md:gap-8 flex-shrink-0">
              {/* Mobile Hamburger Button (Left corner before logo) */}
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setIsMobileMenuOpen((prev) => !prev);
                }}
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
                className="lg:hidden inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all shrink-0"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
              </button>

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
                    aria-label="User account menu"
                    title={currentUser.displayName || currentUser.username}
                    className="relative flex items-center justify-center rounded-full p-0.5 hover:ring-2 hover:ring-brand-accent/60 focus:outline-none transition-all shrink-0"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-black shadow-xs shrink-0 select-none ring-1 ring-border/60"
                      style={{ backgroundColor: currentUser.avatarColor || '#93C572' }}
                    >
                      {getInitials(currentUser.displayName || currentUser.username)}
                    </div>
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
                          <span>Account Settings & Appearance</span>
                        </Link>

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

            </div>

          </div>
      </nav>

      {/* Mobile Navigation Drawer Overlay (Outside <nav> to prevent backdrop-blur / sticky clipping) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col pointer-events-auto">
          {/* Top backdrop behind the navbar height */}
          <div className="h-14 w-full bg-card/95 dark:bg-background/95 border-b border-border/60 flex items-center justify-start gap-2 px-4 sm:px-6 flex-shrink-0 shadow-sm">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all shrink-0"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>

            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 shrink-0 hover:opacity-85 transition-opacity"
            >
              <img
                alt="TonicLite"
                width={28}
                height={28}
                className="h-7 w-auto flex-shrink-0"
                src="/images/logos/toniclite.svg"
              />
              <span className="text-foreground font-black text-base sm:text-lg tracking-tight font-sans inline">
                Tonic<span className="text-[#93C572]">Lite</span>
              </span>
            </Link>
          </div>

          {/* Dimmed backdrop area (tap outside to close) */}
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm flex flex-col justify-start overflow-hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {/* Scrollable Menu Content Card */}
            <div
              className="bg-card dark:bg-[#0c120e] border-b border-border/80 dark:border-border/60 shadow-2xl p-4 space-y-3 max-h-[calc(100dvh-4.5rem)] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Primary Links */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                  Navigation
                </div>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    (link.path === '/interview' && (location.pathname.startsWith('/interview') || location.search.includes('assessment='))) ||
                    (link.path === '/research' && location.pathname.startsWith('/research')) ||
                    (link.path === '/problems' && location.pathname.startsWith('/problems') && !location.search.includes('assessment=')) ||
                    (link.path === '/ml-math' && location.pathname.startsWith('/ml-math'));

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-[#93C572]/15 text-[#93C572] border border-[#93C572]/30 shadow-xs'
                          : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#93C572]" />}
                    </Link>
                  );
                })}
              </div>

              {/* User Account / Profile */}
              <div className="pt-2 border-t border-border/60">
                {currentUser ? (
                  <div className="space-y-2">
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 dark:bg-card/60 border border-border/60 hover:border-border transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black shrink-0 ring-2 ring-white/10"
                          style={{ backgroundColor: currentUser.avatarColor || '#93C572' }}
                        >
                          {getInitials(currentUser.displayName || currentUser.username)}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-foreground text-xs truncate">
                            {currentUser.displayName || currentUser.username}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono truncate">
                            @{currentUser.username}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold font-mono">
                          <Flame className="w-3 h-3 fill-amber-500" />
                          <span>{streakData.currentStreak}d</span>
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
                      </div>
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-secondary/50 hover:bg-secondary text-foreground transition-colors border border-border/60"
                      >
                        <User className="w-3.5 h-3.5 text-[#93C572]" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/profile?tab=settings"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-secondary/50 hover:bg-secondary text-foreground transition-colors border border-border/60"
                      >
                        <Settings className="w-3.5 h-3.5 text-sky-400" />
                        <span>Settings</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#93C572] hover:bg-[#A4D287] text-black text-xs font-bold transition-colors shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In to TonicLite</span>
                  </button>
                )}
              </div>

              {/* Theme Toggle */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between px-2">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                  {isDark ? <Moon className="w-3.5 h-3.5 text-[#93C572]" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                  <span>Appearance</span>
                </span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary hover:bg-secondary/80 border border-border/60 transition-colors"
                >
                  {isDark ? (
                    <>
                      <Sun className="w-3 h-3 text-amber-400" />
                      <span>Switch to Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3 h-3 text-[#93C572]" />
                      <span>Switch to Dark</span>
                    </>
                  )}
                </button>
              </div>

              {/* Solved Progress Counter */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between px-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#93C572]" />
                  <span>Solved Problems</span>
                </span>
                <span className="font-mono font-bold text-foreground">{solvedCount} / 790</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
