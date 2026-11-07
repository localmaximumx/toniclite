import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Flame, 
  Award, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Database, 
  ShieldCheck, 
  User, 
  Lock, 
  Settings, 
  Download, 
  Upload, 
  LogOut, 
  Sparkles,
  Palette, 
  Code2, 
  ChevronRight, 
  Activity, 
  Save, 
  AlertCircle, 
  Check, 
  Users,
  HardDrive,
  BarChart3,
  Trophy,
  Zap,
  Brain,
  Target
} from 'lucide-react';
import { 
  getCurrentUser, 
  logoutUser, 
  getUserStreak, 
  getUserActivityHeatmap, 
  getUserRecentActivity, 
  getUserEloRating, 
  getUserRankTier, 
  getUserStorageUsage, 
  getUserAchievements,
  updateUserProfile, 
  updateUserPassword, 
  exportAccountBackup, 
  importAccountBackup, 
  UserAccount, 
  UserStreakData, 
  ActivityHeatmapData, 
  UserActivityItem, 
  UserStorageUsage,
  AchievementBadge
} from '../services/authService';
import { getProblemCatalog } from '../services/dataService';
import { ProblemSummary } from '../types';
import { AuthModal } from '../components/AuthModal';
import { PALETTES, PaletteId, getSavedPalette, applyPalette } from '../services/paletteService';

const AVATAR_COLORS = [
  { name: 'Tonic Green', hex: '#93C572' },
  { name: 'Sky Blue', hex: '#38BDF8' },
  { name: 'Purple', hex: '#A78BFA' },
  { name: 'Rose', hex: '#F472B6' },
  { name: 'Amber', hex: '#FBBF24' },
  { name: 'Emerald', hex: '#34D399' },
  { name: 'Indigo', hex: '#818CF8' },
  { name: 'Coral', hex: '#FB923C' }
];

export const ProfilePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Tab control: 'overview' | 'settings'
  const initialTab = searchParams.get('tab') === 'settings' ? 'settings' : 'overview';
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>(initialTab);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [streakData, setStreakData] = useState<UserStreakData>(() => getUserStreak());
  const [heatmapData, setHeatmapData] = useState<ActivityHeatmapData>(() => getUserActivityHeatmap());
  const [recentActivity, setRecentActivity] = useState<UserActivityItem[]>(() => getUserRecentActivity(undefined, 25));
  const [storageUsage, setStorageUsage] = useState<UserStorageUsage>(() => getUserStorageUsage());
  const [catalogProblems, setCatalogProblems] = useState<ProblemSummary[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Settings form states
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [roleInput, setRoleInput] = useState<UserAccount['role']>('Machine Learning Engineer');
  const [avatarColorInput, setAvatarColorInput] = useState('#93C572');
  const [profileSaveMsg, setProfileSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Appearance & Display states (Color Palette & Zoom Scale)
  const [currentPalette, setCurrentPalette] = useState<PaletteId>(() => getSavedPalette());
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    try {
      const s = localStorage.getItem('toniclite_zoom');
      if (s) return parseFloat(s);
    } catch {}
    return 0.9;
  });

  const handleSetZoom = (scale: number) => {
    setZoomLevel(scale);
    try {
      localStorage.setItem('toniclite_zoom', scale.toString());
      document.documentElement.style.zoom = scale.toString();
    } catch {}
  };

  const handleSetPalette = (palId: PaletteId) => {
    applyPalette(palId);
    setCurrentPalette(palId);
  };

  useEffect(() => {
    const handlePal = (e: any) => {
      setCurrentPalette(e.detail || getSavedPalette());
    };
    window.addEventListener('toniclite_palette_change', handlePal);
    return () => window.removeEventListener('toniclite_palette_change', handlePal);
  }, []);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Tooltip state for activity calendar squares
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  // Sync state with URL params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'settings') {
      setActiveTab('settings');
    } else {
      setActiveTab('overview');
    }
  }, [searchParams]);

  const switchTab = (tab: 'overview' | 'settings') => {
    setActiveTab(tab);
    setSearchParams(tab === 'settings' ? { tab: 'settings' } : {});
  };

  const refreshUserData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setStreakData(getUserStreak(user?.id));
    setHeatmapData(getUserActivityHeatmap(user?.id));
    setRecentActivity(getUserRecentActivity(user?.id, 25));
    setStorageUsage(getUserStorageUsage(user?.id));

    if (user) {
      setDisplayNameInput(user.displayName || user.username);
      setUsernameInput(user.username);
      setRoleInput(user.role || 'Machine Learning Engineer');
      setAvatarColorInput(user.avatarColor || '#93C572');
    }
  };

  useEffect(() => {
    refreshUserData();
    getProblemCatalog().then(data => {
      if (data && data.problems) {
        setCatalogProblems(data.problems);
      }
    });

    const handleAuthChange = () => refreshUserData();
    window.addEventListener('tensortonic_auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('tensortonic_auth_change', handleAuthChange);
    };
  }, []);

  // Compute solved difficulty breakdown (Easy 300, Medium 355, Hard 135)
  const solvedStats = useMemo(() => {
    const solvedSet = new Set(currentUser?.solvedProblems || []);
    let easy = 0;
    let medium = 0;
    let hard = 0;

    if (catalogProblems.length > 0) {
      // Build slug to difficulty map
      const diffMap = new Map<string, 'Easy' | 'Medium' | 'Hard'>();
      catalogProblems.forEach(p => {
        diffMap.set(p.slug, p.difficulty);
      });

      // Iterate through unique solved problems directly so each is counted exactly once
      solvedSet.forEach(slug => {
        const diff = diffMap.get(slug);
        if (diff === 'Easy') easy++;
        else if (diff === 'Medium') medium++;
        else if (diff === 'Hard') hard++;
        else {
          // If not in catalog (e.g. specialized problem), default to Medium
          medium++;
        }
      });
    }

    const totalSolved = solvedSet.size;
    const elo = getUserEloRating(currentUser?.id, easy, medium, hard);

    return {
      easy,
      easyTotal: 300,
      medium,
      mediumTotal: 355,
      hard,
      hardTotal: 135,
      totalSolved,
      totalCatalog: 790,
      elo
    };
  }, [currentUser, catalogProblems]);

  // Compute Achievements & Badges
  const badges = useMemo(() => {
    return getUserAchievements(currentUser?.id, solvedStats.hard);
  }, [currentUser, solvedStats.hard]);

  const unlockedBadgesCount = useMemo(() => badges.filter(b => b.unlocked).length, [badges]);

  // Handle saving profile info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingProfile(true);
    setProfileSaveMsg(null);

    const res = await updateUserProfile(currentUser.id, {
      displayName: displayNameInput,
      username: usernameInput,
      role: roleInput,
      avatarColor: avatarColorInput
    });

    setIsSavingProfile(false);
    if (res.success) {
      setProfileSaveMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setProfileSaveMsg(null), 3500);
      refreshUserData();
    } else {
      setProfileSaveMsg({ type: 'error', text: res.error || 'Failed to update profile.' });
    }
  };

  // Handle password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 4 characters.' });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordMsg(null);

    const res = await updateUserPassword(currentUser.id, currentPassword, newPassword);
    setIsUpdatingPassword(false);

    if (res.success) {
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 3500);
    } else {
      setPasswordMsg({ type: 'error', text: res.error || 'Failed to update password.' });
    }
  };

  // Handle export data
  const handleExport = () => {
    if (!currentUser) return;
    const jsonStr = exportAccountBackup(currentUser.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toniclite_${currentUser.username}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle import data
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importAccountBackup(content);
        if (res.success) {
          alert('Account backup imported successfully!');
          refreshUserData();
        } else {
          alert(res.error || 'Failed to import backup.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Handle sign out
  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logoutUser();
      navigate('/');
    }
  };

  // Helpers
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const formatRelativeTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const getProblemTitle = (slug: string) => {
    const p = catalogProblems.find(item => item.slug === slug || item.id === slug);
    if (p) return p.title;
    return slug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getProblemDifficulty = (slug: string): 'Easy' | 'Medium' | 'Hard' => {
    const p = catalogProblems.find(item => item.slug === slug || item.id === slug);
    return p?.difficulty || 'Medium';
  };

  return (
    <>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => refreshUserData()}
      />

      <div className="h-full overflow-y-auto custom-scrollbar bg-[#f8faf8] dark:bg-[#070e0a] text-foreground transition-colors pt-6 pb-28 sm:py-6 px-3 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* ======================================================== */}
          {/* 1. TOP PROFILE HEADER BANNER (Matches template image)   */}
          {/* ======================================================== */}
          <div className="relative rounded-3xl border border-border/80 dark:border-[#1d3326] bg-card dark:bg-[#0a1611] p-5 sm:p-7 shadow-xl overflow-hidden backdrop-blur-xl">
            {/* Ambient emerald backlight glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#93C572]/10 dark:bg-[#93C572]/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* User Avatar + Identity Info */}
              <div className="flex items-center gap-4 sm:gap-5">
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black text-black shadow-lg shrink-0 ring-2 ring-white/10"
                  style={{ backgroundColor: currentUser?.avatarColor || '#93C572' }}
                >
                  {getInitials(currentUser?.displayName || currentUser?.username || 'Guest')}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground dark:text-white">
                      {currentUser?.displayName || currentUser?.username || 'Guest User'}
                    </h1>
                    {currentUser && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#93C572]/15 text-[#93C572] text-xs font-semibold border border-[#93C572]/30">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{currentUser.role || 'Machine Learning Engineer'}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground font-mono">
                    <span>@{currentUser?.username || 'guest'}</span>
                    <span>•</span>
                    <span>{currentUser?.createdAt ? `Joined ${new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 'TonicLite Member'}</span>
                  </div>
                </div>
              </div>

              {/* Badges: Elo Rating + Day Streak Badge (Matches template top-right) */}
              <div className="flex items-center gap-3 self-start md:self-center">
                {/* Elo Rating Badge */}
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-secondary/80 dark:bg-[#12231b] border border-border/80 dark:border-[#223d2e] shadow-sm">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                    <span className="text-base">{getUserRankTier(solvedStats.elo).tierIcon}</span>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">Rating</div>
                    <div className="text-sm font-extrabold text-foreground dark:text-white font-mono flex items-center gap-1.5">
                      <span>{solvedStats.elo} ELO</span>
                      <span className="text-[10px] font-semibold text-primary">· {getUserRankTier(solvedStats.elo).tierName}</span>
                    </div>
                  </div>
                </div>

                {/* Day Streak Flame Badge */}
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 shadow-sm">
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold shadow-xs">
                    <Flame className="w-4 h-4 fill-black" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-amber-500/80 font-mono">Streak</div>
                    <div className="text-sm font-extrabold text-amber-500 dark:text-amber-400 font-mono">
                      {streakData.currentStreak} {streakData.currentStreak === 1 ? 'Day' : 'Days'}
                    </div>
                  </div>
                </div>

                {!currentUser && (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-4 py-2 rounded-2xl bg-[#93C572] hover:bg-[#a4d287] text-black font-bold text-xs shadow-md transition-all shrink-0"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Tabs Header */}
            <div className="flex items-center gap-2 mt-6 pt-5 border-t border-border/60 dark:border-[#1d3326]">
              <button
                onClick={() => switchTab('overview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-[#93C572] text-black shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Profile & Activity</span>
              </button>
              <button
                onClick={() => switchTab('settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-[#93C572] text-black shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Account Settings</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW & ACTIVITY                              */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              {/* 1. DIFFICULTY STAT CARDS (Easy 300, Medium 355, Hard 135) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Total Solved Card */}
                <div className="p-5 rounded-2xl border border-border/80 dark:border-[#1d3326] bg-card dark:bg-[#0a1611] shadow-md flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                    <span>Solved Total</span>
                    <CheckCircle2 className="w-4 h-4 text-[#93C572]" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-black text-foreground dark:text-white font-mono">{solvedStats.totalSolved}</span>
                    <span className="text-sm text-muted-foreground font-mono">/ {solvedStats.totalCatalog}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full h-2 rounded-full bg-secondary/80 dark:bg-black/40 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-[#93C572] transition-all duration-500"
                        style={{ width: `${Math.min(100, (solvedStats.totalSolved / solvedStats.totalCatalog) * 100)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono text-right">
                      {((solvedStats.totalSolved / solvedStats.totalCatalog) * 100).toFixed(1)}% solved
                    </div>
                  </div>
                </div>

                {/* Easy Card (0/300) */}
                <div className="p-5 rounded-2xl border border-border/80 dark:border-[#1d3326] bg-card dark:bg-[#0a1611] shadow-md flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                    <span className="text-emerald-500 font-bold">Easy</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-black text-emerald-500 dark:text-emerald-400 font-mono">{solvedStats.easy}</span>
                    <span className="text-sm text-muted-foreground font-mono">/ {solvedStats.easyTotal}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full h-2 rounded-full bg-secondary/80 dark:bg-black/40 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (solvedStats.easy / solvedStats.easyTotal) * 100)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono text-right">
                      {((solvedStats.easy / solvedStats.easyTotal) * 100).toFixed(1)}% solved
                    </div>
                  </div>
                </div>

                {/* Medium Card (0/355) */}
                <div className="p-5 rounded-2xl border border-border/80 dark:border-[#1d3326] bg-card dark:bg-[#0a1611] shadow-md flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                    <span className="text-amber-500 font-bold">Medium</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-black text-amber-500 dark:text-amber-400 font-mono">{solvedStats.medium}</span>
                    <span className="text-sm text-muted-foreground font-mono">/ {solvedStats.mediumTotal}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full h-2 rounded-full bg-secondary/80 dark:bg-black/40 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (solvedStats.medium / solvedStats.mediumTotal) * 100)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono text-right">
                      {((solvedStats.medium / solvedStats.mediumTotal) * 100).toFixed(1)}% solved
                    </div>
                  </div>
                </div>

                {/* Hard Card (0/135) */}
                <div className="p-5 rounded-2xl border border-border/80 dark:border-[#1d3326] bg-card dark:bg-[#0a1611] shadow-md flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                    <span className="text-rose-500 font-bold">Hard</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-black text-rose-500 dark:text-rose-400 font-mono">{solvedStats.hard}</span>
                    <span className="text-sm text-muted-foreground font-mono">/ {solvedStats.hardTotal}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full h-2 rounded-full bg-secondary/80 dark:bg-black/40 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-rose-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (solvedStats.hard / solvedStats.hardTotal) * 100)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono text-right">
                      {((solvedStats.hard / solvedStats.hardTotal) * 100).toFixed(1)}% solved
                    </div>
                  </div>
                </div>

              </div>

              {/* 2. ACTIVITY CALENDAR HEATMAP (Matches LeetCode / Template style) */}
              <div className="p-5 sm:p-6 rounded-3xl border border-border/80 dark:border-[#1d3326] bg-card dark:bg-[#0a1611] shadow-lg relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-foreground dark:text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#93C572]" />
                      <span>Activity Calendar</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submissions and problem solving activity in the last 12 months
                    </p>
                  </div>

                  {/* Summary badges */}
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <div className="px-3 py-1 rounded-xl bg-secondary/60 dark:bg-[#12231b] border border-border/60 dark:border-[#223d2e]">
                      <span className="text-muted-foreground mr-1">Active Days:</span>
                      <strong className="text-foreground dark:text-white">{streakData.totalActiveDays}</strong>
                    </div>
                    <div className="px-3 py-1 rounded-xl bg-secondary/60 dark:bg-[#12231b] border border-border/60 dark:border-[#223d2e]">
                      <span className="text-muted-foreground mr-1">Max Streak:</span>
                      <strong className="text-amber-500">{streakData.longestStreak} days</strong>
                    </div>
                  </div>
                </div>

                {/* Heatmap Grid Container */}
                <div className="relative overflow-x-auto pb-2 custom-scrollbar">
                  <div className="min-w-[760px]">
                    {/* Month labels along top */}
                    <div className="flex text-[10px] text-muted-foreground font-mono mb-2 pl-7 relative h-4">
                      {heatmapData.months.map((m, idx) => (
                        <span 
                          key={idx} 
                          className="absolute"
                          style={{ left: `${m.weekIndex * 14 + 28}px` }}
                        >
                          {m.label}
                        </span>
                      ))}
                    </div>

                    {/* Heatmap rows */}
                    <div className="flex gap-1">
                      {/* Weekday labels on left */}
                      <div className="flex flex-col justify-between text-[9px] text-muted-foreground font-mono pr-2 py-0.5 select-none w-7 shrink-0">
                        <span>Sun</span>
                        <span>Tue</span>
                        <span>Thu</span>
                        <span>Sat</span>
                      </div>

                      {/* 53 Columns of 7 Days */}
                      <div className="flex gap-1">
                        {heatmapData.weeks.map((week, wIdx) => (
                          <div key={wIdx} className="flex flex-col gap-1">
                            {week.map((day, dIdx) => {
                              let levelClass = 'bg-secondary/40 dark:bg-[#121c16] border-border/30 dark:border-[#1d2b22]';
                              if (day.level === 1) levelClass = 'bg-emerald-900/60 dark:bg-[#1a402a] border-emerald-700/50';
                              else if (day.level === 2) levelClass = 'bg-emerald-700/80 dark:bg-[#256c3f] border-emerald-600/60';
                              else if (day.level === 3) levelClass = 'bg-emerald-500 dark:bg-[#34a853] border-emerald-400/70';
                              else if (day.level === 4) levelClass = 'bg-[#93C572] dark:bg-[#93C572] border-[#a4d287] shadow-[0_0_8px_rgba(147,197,114,0.4)]';

                              return (
                                <div
                                  key={dIdx}
                                  className={`w-3 h-3 rounded-[3px] border transition-colors cursor-pointer hover:scale-125 ${levelClass}`}
                                  onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setHoveredDay({
                                      date: day.date,
                                      count: day.count,
                                      x: rect.left + rect.width / 2,
                                      y: rect.top - 8
                                    });
                                  }}
                                  onMouseLeave={() => setHoveredDay(null)}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border/40 dark:border-[#1d3326]">
                      <span className="font-mono">
                        {heatmapData.totalCount} submission{heatmapData.totalCount === 1 ? '' : 's'} logged
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <span>Less</span>
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-secondary/40 dark:bg-[#121c16] border border-border/30 dark:border-[#1d2b22]" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-900/60 dark:bg-[#1a402a] border border-emerald-700/50" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-700/80 dark:bg-[#256c3f] border border-emerald-600/60" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 dark:bg-[#34a853] border border-emerald-400/70" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-[#93C572] dark:bg-[#93C572] border border-[#a4d287]" />
                        <span>More</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating tooltip */}
                {hoveredDay && (
                  <div 
                    className="fixed z-50 transform -translate-x-1/2 -translate-y-full px-2.5 py-1 rounded-lg bg-black text-white text-[11px] font-mono shadow-xl pointer-events-none whitespace-nowrap border border-white/20"
                    style={{ left: `${hoveredDay.x}px`, top: `${hoveredDay.y}px` }}
                  >
                    <strong>{hoveredDay.count}</strong> {hoveredDay.count === 1 ? 'submission' : 'submissions'} on {hoveredDay.date}
                  </div>
                )}
              </div>

              {/* 3. ACHIEVEMENTS & MILESTONES SHOWCASE */}
              <div className="p-5 sm:p-6 rounded-3xl border border-border/80 dark:border-[#1d3326] bg-card dark:bg-[#0a1611] shadow-lg relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                      <Trophy className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-extrabold text-foreground dark:text-white flex items-center gap-2 flex-wrap">
                        <span>Achievements & Milestones</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-amber-500/15 text-amber-400 font-mono font-bold border border-amber-500/30">
                          {unlockedBadgesCount} / {badges.length} Unlocked
                        </span>
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Earn milestone badges as you conquer algorithms, maintain streaks, and write optimal code
                      </p>
                    </div>
                  </div>
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {badges.map((b) => {
                    const isUnlocked = b.unlocked;

                    const renderIcon = () => {
                      if (b.icon === 'flame') return <Flame className="w-5 h-5 fill-amber-500/40 text-amber-500" />;
                      if (b.icon === 'trophy') return <Trophy className="w-5 h-5 text-amber-400" />;
                      if (b.icon === 'zap') return <Zap className="w-5 h-5 text-sky-400" />;
                      if (b.icon === 'brain') return <Brain className="w-5 h-5 text-purple-400" />;
                      if (b.icon === 'target') return <Target className="w-5 h-5 text-rose-400" />;
                      if (b.icon === 'shield') return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
                      return <Award className="w-5 h-5 text-[#93C572]" />;
                    };

                    const tierBorder = 
                      b.tier === 'platinum' ? 'border-cyan-500/40' :
                      b.tier === 'gold' ? 'border-amber-500/40' :
                      b.tier === 'silver' ? 'border-sky-500/40' :
                      'border-emerald-500/40';

                    return (
                      <div
                        key={b.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                          isUnlocked
                            ? `bg-secondary/40 dark:bg-[#12231b] ${tierBorder} shadow-sm hover:scale-102`
                            : 'bg-secondary/15 dark:bg-[#0d1612]/60 border-border/40 dark:border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-80'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              isUnlocked ? 'bg-black/30 dark:bg-black/50 shadow-inner' : 'bg-secondary/50'
                            }`}>
                              {renderIcon()}
                            </div>

                            <span className={`text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-full ${
                              isUnlocked
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-secondary text-muted-foreground'
                            }`}>
                              {isUnlocked ? 'Unlocked' : 'Locked'}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-xs font-bold text-foreground dark:text-white truncate" title={b.title}>
                              {b.title}
                            </h3>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug" title={b.description}>
                              {b.description}
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3 pt-2 border-t border-border/40 dark:border-white/5 space-y-1">
                          <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                            <span>Progress</span>
                            <span className="font-bold text-foreground dark:text-white">{b.progress} / {b.target}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-secondary/80 dark:bg-black/50 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isUnlocked ? 'bg-[#93C572]' : 'bg-muted-foreground/40'
                              }`}
                              style={{ width: `${Math.min(100, (b.progress / b.target) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. USER STORAGE & DATABASE USAGE (Moved from Navbar dropdown as requested) */}
              <div className="p-5 sm:p-6 rounded-3xl border border-border/80 dark:border-[#1d3326] bg-card dark:bg-[#0a1611] shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold">
                      <Database className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-extrabold text-foreground dark:text-white">
                        Database & Storage Quota
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Your account storage usage and free-tier allocation
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-sm font-extrabold text-foreground dark:text-white">
                      {storageUsage.usedFormatted} <span className="text-muted-foreground font-normal">/ {storageUsage.maxFormatted}</span>
                    </div>
                    <div className="text-[11px] text-sky-400 font-semibold">
                      {storageUsage.percentage}% used
                    </div>
                  </div>
                </div>

                {/* Striped Progress Bar (Matching user requirement) */}
                <div className="w-full h-3 rounded-full bg-secondary/80 dark:bg-black/50 overflow-hidden border border-border/60 dark:border-white/10 relative shadow-inner mb-4">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, Math.max(2, storageUsage.percentage))}%`,
                      backgroundImage: 'repeating-linear-gradient(-45deg, #38bdf8, #38bdf8 4px, #1d4ed8 4px, #1d4ed8 8px)'
                    }}
                    title={`${storageUsage.percentage}% used`}
                  />
                </div>

                {/* Legend & Allocation details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-secondary/40 dark:bg-[#12231b] border border-border/40 dark:border-[#223d2e] flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#38bdf8] shrink-0 shadow-sm" />
                    <div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase">Already Used</div>
                      <div className="text-xs font-bold font-mono text-foreground dark:text-white">{storageUsage.usedFormatted}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-secondary/40 dark:bg-[#12231b] border border-border/40 dark:border-[#223d2e] flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#1d4ed8] shrink-0 shadow-sm" />
                    <div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase">Available Space</div>
                      <div className="text-xs font-bold font-mono text-foreground dark:text-white">{storageUsage.remainingFormatted}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-secondary/40 dark:bg-[#12231b] border border-border/40 dark:border-[#223d2e] flex items-center gap-3">
                    <Code2 className="w-4 h-4 text-[#93C572] shrink-0" />
                    <div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase">Code Drafts</div>
                      <div className="text-xs font-bold font-mono text-foreground dark:text-white">{storageUsage.items.codeDraftsCount} saved</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-secondary/40 dark:bg-[#12231b] border border-border/40 dark:border-[#223d2e] flex items-center gap-3">
                    <HardDrive className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase">Submissions Log</div>
                      <div className="text-xs font-bold font-mono text-foreground dark:text-white">{storageUsage.items.submissionsCount} logged</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border/40 dark:border-[#1d3326] font-mono">
                  <span>Current Plan: <strong className="text-[#93C572] font-semibold">{storageUsage.planName}</strong> (5.0 MB Free Browser DB)</span>
                  <span>Data auto-syncs with local storage & cloud session</span>
                </div>
              </div>

              {/* 4. RECENT ACTIVITY LIST (Matching template bottom section) */}
              <div className="p-5 sm:p-6 rounded-3xl border border-border/80 dark:border-[#1d3326] bg-card dark:bg-[#0a1611] shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base sm:text-lg font-extrabold text-foreground dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#93C572]" />
                    <span>Recent Activity</span>
                  </h2>
                  <Link 
                    to="/problems" 
                    className="text-xs text-[#93C572] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Browse All Problems</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {recentActivity.length === 0 ? (
                  <div className="text-center py-10 px-4 rounded-2xl bg-secondary/20 dark:bg-[#12231b]/40 border border-dashed border-border/60 dark:border-[#223d2e]">
                    <Code2 className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground dark:text-white">No submissions recorded yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Start coding machine learning algorithms to build your daily streak and earn ratings!
                    </p>
                    <Link
                      to="/problems"
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[#93C572] text-black font-bold text-xs hover:bg-[#a4d287] transition-all shadow-sm"
                    >
                      <span>Explore Problems</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60 dark:divide-[#1d3326]">
                    {recentActivity.map((sub) => {
                      const title = getProblemTitle(sub.slug);
                      const diff = getProblemDifficulty(sub.slug);
                      const diffColor = diff === 'Easy' ? 'text-emerald-500' : diff === 'Medium' ? 'text-amber-500' : 'text-rose-500';

                      return (
                        <div 
                          key={sub.id} 
                          className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-secondary/30 dark:hover:bg-[#12231b]/50 px-3 -mx-3 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${sub.success ? 'bg-[#93C572]' : 'bg-amber-400'}`} />
                            <div className="min-w-0">
                              <Link 
                                to={`/problems/${sub.slug}`}
                                className="font-bold text-xs sm:text-sm text-foreground dark:text-white hover:text-[#93C572] dark:hover:text-[#93C572] transition-colors truncate block"
                              >
                                {title}
                              </Link>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono mt-0.5">
                                <span className={`font-semibold ${diffColor}`}>{diff}</span>
                                <span>•</span>
                                <span>{sub.passedCount} / {sub.totalCount} tests</span>
                                <span>•</span>
                                <span>{sub.runtimeMs}ms</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center font-mono text-xs shrink-0">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.success
                                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                            }`}>
                              {sub.success ? 'Accepted' : 'Attempted'}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatRelativeTime(sub.timestamp)}
                            </span>
                            <Link
                              to={`/problems/${sub.slug}`}
                              className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-[11px] font-semibold transition-colors"
                            >
                              Code
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: ACCOUNT SETTINGS                                  */}
          {/* ======================================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6">

              {/* APPEARANCE & DISPLAY SETTINGS (Color Palette & Zoom Scale) */}
              <div className="p-5 sm:p-7 rounded-3xl border border-border/80 dark:border-[#1d3326] bg-card dark:bg-[#0a1611] shadow-lg">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border/60 dark:border-[#1d3326]">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-foreground dark:text-white">
                      Appearance & Display
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Customize your active color palette theme and interface display zoom density
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Color Palette Theme */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider font-mono">
                        Color Palette Theme
                      </label>
                      <span className="text-xs font-semibold text-[#93C572] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{PALETTES.find(p => p.id === currentPalette)?.name || 'Original Emerald'}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {PALETTES.map((pal) => {
                        const isSelected = pal.id === currentPalette;
                        return (
                          <button
                            key={pal.id}
                            type="button"
                            onClick={() => handleSetPalette(pal.id)}
                            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-[#93C572] bg-[#93C572]/10 shadow-md ring-1 ring-[#93C572]'
                                : 'border-border/70 hover:border-border bg-secondary/40 hover:bg-secondary/70'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-6 h-6 rounded-full shadow-inner flex items-center justify-center shrink-0 border border-white/20"
                                style={{ backgroundColor: pal.primaryHex }}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 text-black font-bold" />}
                              </div>
                              <div className="truncate">
                                <div className="text-xs font-bold text-foreground dark:text-white truncate flex items-center gap-1.5">
                                  <span>{pal.name}</span>
                                  {pal.isOriginal && (
                                    <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                                      Orig
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-muted-foreground truncate">
                                  {pal.tagline}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Display Zoom & Density */}
                  <div className="space-y-3 pt-4 border-t border-border/60 dark:border-[#1d3326]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider font-mono">
                        Interface Display Zoom & Density
                      </label>
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        Current: {Math.round(zoomLevel * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Adjust the scale of interface elements across all pages.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { scale: 0.9, label: '90% (Recommended)', desc: 'Authentic compact TensorTonic density' },
                        { scale: 0.85, label: '85% (Ultra Compact)', desc: 'Maximized information density' },
                        { scale: 1.0, label: '100% (Standard Scale)', desc: 'Default browser zoom scale' },
                      ].map((opt) => {
                        const isSelected = Math.abs(zoomLevel - opt.scale) < 0.01;
                        return (
                          <button
                            key={opt.scale}
                            type="button"
                            onClick={() => handleSetZoom(opt.scale)}
                            className={`p-3.5 rounded-2xl border text-left transition-all ${
                              isSelected
                                ? 'border-[#93C572] bg-[#93C572]/10 shadow-md ring-1 ring-[#93C572] font-bold'
                                : 'border-border/70 hover:border-border bg-secondary/40 hover:bg-secondary/70'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-foreground dark:text-white">{opt.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#93C572]" />}
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug">{opt.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. EDIT PROFILE FORM */}
              <div className="p-5 sm:p-7 rounded-3xl border border-border/80 dark:border-[#1d3326] bg-card dark:bg-[#0a1611] shadow-lg">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border/60 dark:border-[#1d3326]">
                  <div className="w-8 h-8 rounded-xl bg-[#93C572]/15 text-[#93C572] flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-foreground dark:text-white">
                      Profile Information
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Update your display name, username, machine learning role, and avatar color
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Display Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider font-mono">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        placeholder="e.g. Biniyam"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 dark:bg-[#12231b] border border-border dark:border-[#223d2e] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#93C572]"
                      />
                    </div>

                    {/* Username */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider font-mono">
                        Username Handle
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-muted-foreground font-mono text-sm">@</span>
                        <input
                          type="text"
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          placeholder="username"
                          required
                          className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-secondary/50 dark:bg-[#12231b] border border-border dark:border-[#223d2e] text-foreground dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#93C572]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider font-mono">
                      Specialization / Role
                    </label>
                    <select
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 dark:bg-[#12231b] border border-border dark:border-[#223d2e] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#93C572]"
                    >
                      <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                      <option value="Research Engineer">Research Engineer</option>
                      <option value="Data Scientist">Data Scientist</option>
                      <option value="Student">Student / Learner</option>
                    </select>
                  </div>

                  {/* Avatar Color Swatches */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider font-mono">
                      Avatar Theme Color
                    </label>
                    <div className="flex items-center gap-3 flex-wrap">
                      {AVATAR_COLORS.map((col) => (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => setAvatarColorInput(col.hex)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                            avatarColorInput === col.hex
                              ? 'ring-2 ring-white scale-110 shadow-md'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.name}
                        >
                          {avatarColorInput === col.hex && <Check className="w-4 h-4 text-black font-bold" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Msg */}
                  {profileSaveMsg && (
                    <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      profileSaveMsg.type === 'success'
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                    }`}>
                      {profileSaveMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{profileSaveMsg.text}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile || !currentUser}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#93C572] hover:bg-[#a4d287] text-black font-bold text-sm shadow-md transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* 2. CHANGE PASSWORD */}
              <div className="p-5 sm:p-7 rounded-3xl border border-border/80 dark:border-[#1d3326] bg-card dark:bg-[#0a1611] shadow-lg">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border/60 dark:border-[#1d3326]">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-foreground dark:text-white">
                      Security & Password
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Change your password to keep your TonicLite progress secure
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider font-mono">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 dark:bg-[#12231b] border border-border dark:border-[#223d2e] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#93C572]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider font-mono">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 dark:bg-[#12231b] border border-border dark:border-[#223d2e] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#93C572]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider font-mono">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 dark:bg-[#12231b] border border-border dark:border-[#223d2e] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#93C572]"
                      />
                    </div>
                  </div>

                  {passwordMsg && (
                    <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      passwordMsg.type === 'success'
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                    }`}>
                      {passwordMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{passwordMsg.text}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword || !currentUser}
                      className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-sm border border-border/80 transition-all disabled:opacity-50"
                    >
                      {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* 3. BACKUP & DATA PORTABILITY */}
              <div className="p-5 sm:p-7 rounded-3xl border border-border/80 dark:border-[#1d3326] bg-card dark:bg-[#0a1611] shadow-lg">
                <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-border/60 dark:border-[#1d3326]">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-foreground dark:text-white">
                      Account Portability & Backup
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Export your solved problems, code drafts, and test logs as a single JSON file
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
                  <button
                    onClick={handleExport}
                    disabled={!currentUser}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-[#93C572]" />
                    <span>Export Account JSON</span>
                  </button>

                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 text-sky-400" />
                    <span>Import Backup File</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* 4. DANGER ZONE / SIGN OUT */}
              <div className="p-5 sm:p-7 rounded-3xl border border-rose-500/30 dark:border-rose-900/40 bg-rose-500/5 dark:bg-rose-950/10 shadow-lg">
                <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-rose-500/20">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-rose-600 dark:text-rose-400">
                      Session & Sign Out
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Switch accounts or sign out of your current device session
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of TonicLite</span>
                  </button>

                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground font-bold text-xs border border-border transition-colors"
                  >
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Switch to Another Account</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
};
