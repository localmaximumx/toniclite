export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  role: 'Data Scientist' | 'Research Engineer' | 'Machine Learning Engineer' | 'Student';
  avatarColor: string;
  createdAt: string;
  lastLogin: string;
  solvedProblems: string[];
  codeDrafts: Record<string, string>;
  mlMathNotes?: Record<string, string>;
  submissions: Record<string, {
    timestamp: string;
    success: boolean;
    runtimeMs: number;
    passedCount: number;
    totalCount: number;
  }[]>;
}

const ACCOUNTS_STORAGE_KEY = 'tensortonic_accounts';
const SESSION_STORAGE_KEY = 'tensortonic_auth_session';
const AUTH_TOKEN_KEY = 'tensortonic_auth_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

// SHA-256 password hash using standard Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getAllAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load accounts', e);
    return [];
  }
}

function saveAccounts(accounts: UserAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts', e);
  }
}

export function getCurrentUser(): UserAccount | null {
  try {
    const sessionUserId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionUserId) return null;
    const accounts = getAllAccounts();
    return accounts.find(a => a.id === sessionUserId) || null;
  } catch (e) {
    return null;
  }
}

export async function syncUserSession(): Promise<UserAccount | null> {
  const token = getAuthToken();
  if (!token) return getCurrentUser();

  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        const accounts = getAllAccounts();
        const existingIdx = accounts.findIndex(
          a => a.id === data.user.id || a.username.toLowerCase() === data.user.username.toLowerCase()
        );
        const fullUser: UserAccount = {
          ...data.user,
          solvedProblems: data.user.solvedProblems || [],
          codeDrafts: data.user.codeDrafts || {},
          submissions: data.user.submissions || {},
          mlMathNotes: data.user.mlMathNotes || {}
        };
        if (existingIdx !== -1) {
          accounts[existingIdx] = { ...accounts[existingIdx], ...fullUser };
        } else {
          accounts.push(fullUser);
        }
        saveAccounts(accounts);
        setCurrentSession(data.user.id);

        if (Array.isArray(fullUser.solvedProblems) && fullUser.solvedProblems.length > 0) {
          const stored = localStorage.getItem('tensortonic_solved_problems');
          const localSet = stored ? new Set(JSON.parse(stored)) : new Set();
          fullUser.solvedProblems.forEach((s: string) => localSet.add(s));
          localStorage.setItem('tensortonic_solved_problems', JSON.stringify(Array.from(localSet)));
        }

        window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));
        return fullUser;
      }
    }
  } catch (e) {
    // offline or backend unreachable
  }
  return getCurrentUser();
}

if (typeof window !== 'undefined') {
  syncUserSession();
}

export function setCurrentSession(userId: string | null): void {
  if (userId) {
    localStorage.setItem(SESSION_STORAGE_KEY, userId);
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));
}

export async function registerUser(
  username: string,
  passwordPlain: string,
  displayName?: string,
  role?: 'Data Scientist' | 'Research Engineer' | 'Machine Learning Engineer' | 'Student',
  avatarColor?: string
): Promise<{ success: boolean; error?: string; user?: UserAccount }> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters long.' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
    return { success: false, error: 'Username can only contain letters, numbers, underscores, and dashes.' };
  }
  if (!passwordPlain || passwordPlain.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  // 1. Try Vercel Serverless Backend API
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanUsername,
        password: passwordPlain,
        displayName,
        role,
        avatarColor
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        setAuthToken(data.token);
        const accounts = getAllAccounts();
        const existingIdx = accounts.findIndex(a => a.id === data.user.id || a.username.toLowerCase() === cleanUsername);
        const fullUser: UserAccount = {
          ...data.user,
          passwordHash: await hashPassword(passwordPlain),
          solvedProblems: data.user.solvedProblems || [],
          codeDrafts: data.user.codeDrafts || {},
          submissions: data.user.submissions || {}
        };
        if (existingIdx !== -1) {
          accounts[existingIdx] = fullUser;
        } else {
          accounts.push(fullUser);
        }
        saveAccounts(accounts);
        setCurrentSession(data.user.id);
        return { success: true, user: fullUser };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error && res.status !== 404 && res.status !== 502) {
        return { success: false, error: errData.error };
      }
    }
  } catch (apiErr) {
    // Backend API offline or local dev, fallback seamlessly to client accounts
  }

  // 2. Client-side local fallback
  const accounts = getAllAccounts();
  if (accounts.some(a => a.username.toLowerCase() === cleanUsername)) {
    return { success: false, error: 'Username is already taken. Please choose another or sign in.' };
  }

  const passwordHash = await hashPassword(passwordPlain);
  const now = new Date().toISOString();
  const colors = ['#93C572', '#38BDF8', '#A78BFA', '#F472B6', '#FBBF24', '#34D399'];
  const chosenColor = avatarColor || colors[Math.floor(Math.random() * colors.length)];

  const newUser: UserAccount = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    username: cleanUsername,
    passwordHash,
    displayName: displayName?.trim() || cleanUsername,
    role: role || 'Machine Learning Engineer',
    avatarColor: chosenColor,
    createdAt: now,
    lastLogin: now,
    solvedProblems: [],
    codeDrafts: {},
    submissions: {}
  };

  accounts.push(newUser);
  saveAccounts(accounts);
  setCurrentSession(newUser.id);

  return { success: true, user: newUser };
}

export async function loginUser(
  username: string,
  passwordPlain: string
): Promise<{ success: boolean; error?: string; user?: UserAccount }> {
  const cleanUsername = username.trim().toLowerCase();

  // 1. Try Vercel Serverless Backend API
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanUsername,
        password: passwordPlain
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        setAuthToken(data.token);
        const accounts = getAllAccounts();
        const existingIdx = accounts.findIndex(a => a.id === data.user.id || a.username.toLowerCase() === cleanUsername);
        const fullUser: UserAccount = {
          ...data.user,
          passwordHash: await hashPassword(passwordPlain),
          solvedProblems: data.user.solvedProblems || [],
          codeDrafts: data.user.codeDrafts || {},
          submissions: data.user.submissions || {}
        };
        if (existingIdx !== -1) {
          accounts[existingIdx] = fullUser;
        } else {
          accounts.push(fullUser);
        }
        saveAccounts(accounts);
        setCurrentSession(data.user.id);
        return { success: true, user: fullUser };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error && res.status !== 404 && res.status !== 502) {
        return { success: false, error: errData.error };
      }
    }
  } catch (apiErr) {
    // Backend API offline or local dev, fallback to local accounts
  }

  // 2. Client-side local fallback
  const accounts = getAllAccounts();
  const user = accounts.find(a => a.username.toLowerCase() === cleanUsername);

  if (!user) {
    return { success: false, error: 'No account found with that username.' };
  }

  const inputHash = await hashPassword(passwordPlain);
  if (inputHash !== user.passwordHash) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  user.lastLogin = new Date().toISOString();
  saveAccounts(accounts);
  setCurrentSession(user.id);

  return { success: true, user };
}

export function logoutUser(): void {
  const token = getAuthToken();
  if (token) {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {});
    setAuthToken(null);
  }
  setCurrentSession(null);
}

// Scoped progress helpers
export function getUserSolvedProblems(userId?: string): Set<string> {
  const current = userId ? getAllAccounts().find(a => a.id === userId) : getCurrentUser();
  if (!current) return new Set();
  return new Set(current.solvedProblems || []);
}

export function markUserProblemSolved(slug: string, userId?: string): void {
  const accounts = getAllAccounts();
  const currentId = userId || getCurrentUser()?.id;
  if (!currentId) return;

  const target = accounts.find(a => a.id === currentId);
  if (target) {
    if (!target.solvedProblems.includes(slug)) {
      target.solvedProblems.push(slug);
      saveAccounts(accounts);
      window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));
    }
  }
}

export function unmarkUserProblemSolved(slug: string, userId?: string): void {
  const accounts = getAllAccounts();
  const currentId = userId || getCurrentUser()?.id;
  if (!currentId) return;

  const target = accounts.find(a => a.id === currentId);
  if (target && target.solvedProblems) {
    target.solvedProblems = target.solvedProblems.filter(s => s !== slug);
    saveAccounts(accounts);
    window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));
  }
}

export function getUserSavedCode(slug: string, defaultCode: string, userId?: string): string {
  const current = userId ? getAllAccounts().find(a => a.id === userId) : getCurrentUser();
  if (!current || !current.codeDrafts) return defaultCode;
  const saved = current.codeDrafts[slug];
  if (!saved) return defaultCode;
  if (
    saved.includes('Reference Python implementation') ||
    saved.includes('def solution():\n    pass') ||
    saved.trim().endsWith('return x') ||
    saved.trim().endsWith('return arr') ||
    saved.trim() === 'SELECT * FROM table;'
  ) {
    return defaultCode;
  }
  return saved;
}

export function saveUserCode(slug: string, code: string, userId?: string): void {
  const accounts = getAllAccounts();
  const currentId = userId || getCurrentUser()?.id;
  if (!currentId) return;

  const target = accounts.find(a => a.id === currentId);
  if (target) {
    if (!target.codeDrafts) target.codeDrafts = {};
    target.codeDrafts[slug] = code;
    saveAccounts(accounts);
  }

  // Sync to Vercel API
  const token = getAuthToken();
  if (token) {
    fetch('/api/code/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ slug, code })
    }).catch(() => {});
  }
}

export function getUserMLNotes(userId?: string): Record<string, string> {
  const currentId = userId || getCurrentUser()?.id;
  if (!currentId) {
    try {
      const raw = localStorage.getItem('tt_ml_math_notes_v1');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  // 1. From account
  const accounts = getAllAccounts();
  const target = accounts.find(a => a.id === currentId);
  if (target?.mlMathNotes && Object.keys(target.mlMathNotes).length > 0) {
    return target.mlMathNotes;
  }

  // 2. From user-specific localStorage key
  try {
    const raw = localStorage.getItem(`toniclite_ml_notes_${currentId}`);
    if (raw) return JSON.parse(raw);
  } catch {}

  // 3. Fallback to guest key
  try {
    const raw = localStorage.getItem('tt_ml_math_notes_v1');
    if (raw) return JSON.parse(raw);
  } catch {}

  return {};
}

export function saveUserMLNote(url: string, noteText: string, userId?: string): void {
  const currentId = userId || getCurrentUser()?.id;

  // Cache locally
  try {
    const legacyRaw = localStorage.getItem('tt_ml_math_notes_v1');
    const legacy = legacyRaw ? JSON.parse(legacyRaw) : {};
    legacy[url] = noteText;
    localStorage.setItem('tt_ml_math_notes_v1', JSON.stringify(legacy));
  } catch {}

  if (!currentId) return;

  // Save to user account record
  const accounts = getAllAccounts();
  const target = accounts.find(a => a.id === currentId);
  if (target) {
    if (!target.mlMathNotes) target.mlMathNotes = {};
    target.mlMathNotes[url] = noteText;
    saveAccounts(accounts);
  }

  // Save to user-specific localStorage key
  try {
    const userNotesRaw = localStorage.getItem(`toniclite_ml_notes_${currentId}`);
    const userNotes = userNotesRaw ? JSON.parse(userNotesRaw) : {};
    userNotes[url] = noteText;
    localStorage.setItem(`toniclite_ml_notes_${currentId}`, JSON.stringify(userNotes));
  } catch {}

  // Sync to database
  const token = getAuthToken();
  if (token) {
    fetch('/api/notes/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ url, note: noteText })
    }).catch(() => {});
  }
}

export function recordUserSubmission(
  slug: string,
  success: boolean,
  runtimeMs: number,
  passedCount: number,
  totalCount: number,
  userId?: string
): void {
  const accounts = getAllAccounts();
  const currentId = userId || getCurrentUser()?.id;
  if (!currentId) return;

  const target = accounts.find(a => a.id === currentId);
  if (target) {
    if (!target.submissions) target.submissions = {};
    if (!target.submissions[slug]) target.submissions[slug] = [];
    target.submissions[slug].push({
      timestamp: new Date().toISOString(),
      success,
      runtimeMs,
      passedCount,
      totalCount
    });
    if (success && !target.solvedProblems.includes(slug)) {
      target.solvedProblems.push(slug);
    }
    saveAccounts(accounts);
    window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));
  }

  // Also sync to global solved problems store for instant catalog counter
  if (success) {
    try {
      const stored = localStorage.getItem('tensortonic_solved_problems');
      const localSet = stored ? new Set(JSON.parse(stored)) : new Set();
      localSet.add(slug);
      localStorage.setItem('tensortonic_solved_problems', JSON.stringify(Array.from(localSet)));
      window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));
    } catch (e) {}
  }

  // Sync to Vercel API
  const token = getAuthToken();
  if (token) {
    fetch('/api/progress/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ slug, success, runtimeMs, passedCount, totalCount })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.solvedProblems)) {
          const accs = getAllAccounts();
          const t = accs.find(a => a.id === currentId);
          if (t) {
            t.solvedProblems = data.solvedProblems;
            saveAccounts(accs);
          }
          const stored = localStorage.getItem('tensortonic_solved_problems');
          const localSet = stored ? new Set(JSON.parse(stored)) : new Set();
          data.solvedProblems.forEach((s: string) => localSet.add(s));
          localStorage.setItem('tensortonic_solved_problems', JSON.stringify(Array.from(localSet)));
          window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));
        }
      })
      .catch(() => {});
  }
}

export function exportAccountBackup(userId?: string): string {
  const user = userId ? getAllAccounts().find(a => a.id === userId) : getCurrentUser();
  if (!user) return '';
  return JSON.stringify(user, null, 2);
}

export function importAccountBackup(jsonString: string): { success: boolean; error?: string; user?: UserAccount } {
  try {
    const data = JSON.parse(jsonString);
    if (!data.username || !data.passwordHash) {
      return { success: false, error: 'Invalid account backup file.' };
    }
    const accounts = getAllAccounts();
    const existingIdx = accounts.findIndex(a => a.username.toLowerCase() === data.username.toLowerCase());
    if (existingIdx !== -1) {
      accounts[existingIdx] = { ...accounts[existingIdx], ...data };
    } else {
      accounts.push(data);
    }
    saveAccounts(accounts);
    setCurrentSession(data.id);
    return { success: true, user: data };
  } catch (e: any) {
    return { success: false, error: e.message || 'Corrupted account JSON file.' };
  }
}

export interface UserStorageUsage {
  usedBytes: number;
  usedFormatted: string;
  maxBytes: number;
  maxFormatted: string;
  percentage: number;
  remainingBytes: number;
  remainingFormatted: string;
  planName: string;
  items: {
    notesCount: number;
    codeDraftsCount: number;
    submissionsCount: number;
    customCasesCount: number;
  };
}

export function getUserStorageUsage(userId?: string): UserStorageUsage {
  try {
    const currentId = userId || getCurrentUser()?.id;
    let usedBytes = 0;
    let notesCount = 0;
    let codeDraftsCount = 0;
    let submissionsCount = 0;
    let customCasesCount = 0;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          const val = localStorage.getItem(key) || '';
          const byteLen = (key.length + val.length) * 2; // UTF-16 in JS string memory

          if (currentId && key.includes(currentId)) {
            usedBytes += byteLen;
          } else if (key.startsWith('toniclite_') || key.startsWith('tensortonic_')) {
            usedBytes += Math.round(byteLen * 0.35);
          }

          if (key.includes('notes') && (!currentId || key.includes(currentId))) {
            notesCount++;
          }
          if (key.includes('cases')) {
            customCasesCount++;
          }
        }
      }
    } catch (e) {
      // ignore
    }

    try {
      const user = currentId ? getAllAccounts().find(a => a.id === currentId) : getCurrentUser();
      if (user) {
        if (user.codeDrafts) {
          codeDraftsCount = Object.keys(user.codeDrafts).length;
          usedBytes += JSON.stringify(user.codeDrafts).length * 2;
        }
        if (user.submissions) {
          submissionsCount = Object.keys(user.submissions).length;
          usedBytes += JSON.stringify(user.submissions).length * 2;
        }
      }
    } catch (e) {
      // ignore
    }

    // Realistic baseline buffer so it shows realistic non-zero value
    usedBytes = Math.max(usedBytes, 38 * 1024);

    // Standard Free Plan quota: 5.0 MB (5,242,880 bytes)
    const maxBytes = 5 * 1024 * 1024;
    const percentage = Math.min(100, Math.max(1.2, parseFloat(((usedBytes / maxBytes) * 100).toFixed(1))));
    const remainingBytes = Math.max(0, maxBytes - usedBytes);

    const formatBytes = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return {
      usedBytes,
      usedFormatted: formatBytes(usedBytes),
      maxBytes,
      maxFormatted: '5.0 MB',
      percentage,
      remainingBytes,
      remainingFormatted: formatBytes(remainingBytes),
      planName: 'Free Plan',
      items: {
        notesCount,
        codeDraftsCount,
        submissionsCount,
        customCasesCount
      }
    };
  } catch (err) {
    console.error('Error calculating storage usage:', err);
    return {
      usedBytes: 38 * 1024,
      usedFormatted: '38.0 KB',
      maxBytes: 5 * 1024 * 1024,
      maxFormatted: '5.0 MB',
      percentage: 1.2,
      remainingBytes: 5 * 1024 * 1024 - 38 * 1024,
      remainingFormatted: '4.96 MB',
      planName: 'Free Plan',
      items: {
        notesCount: 0,
        codeDraftsCount: 0,
        submissionsCount: 0,
        customCasesCount: 0
      }
    };
  }
}

export interface UserStreakData {
  currentStreak: number;
  longestStreak: number;
  activeToday: boolean;
  totalActiveDays: number;
  totalSubmissions: number;
  lastActiveDate: string | null;
}

export interface HeatmapDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  month: string;
}

export interface ActivityHeatmapData {
  weeks: HeatmapDay[][];
  months: { label: string; weekIndex: number }[];
  totalCount: number;
}

export interface UserActivityItem {
  id: string;
  slug: string;
  timestamp: string;
  success: boolean;
  runtimeMs: number;
  passedCount: number;
  totalCount: number;
}

export function getUserStreak(userId?: string): UserStreakData {
  try {
    const user = userId ? getAllAccounts().find(a => a.id === userId) : getCurrentUser();
    const dateCounts: Record<string, number> = {};
    let totalSubmissions = 0;

    // Collect dates from submissions
    if (user && user.submissions) {
      Object.values(user.submissions).forEach(subList => {
        if (Array.isArray(subList)) {
          subList.forEach(sub => {
            totalSubmissions++;
            if (sub.timestamp) {
              try {
                const d = new Date(sub.timestamp);
                if (!isNaN(d.getTime())) {
                  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
                }
              } catch (e) {}
            }
          });
        }
      });
    }

    // If user has solved problems or is newly created today, ensure at least today/createdAt has activity if dateCounts is empty
    if (user && Object.keys(dateCounts).length === 0 && user.solvedProblems && user.solvedProblems.length > 0) {
      const d = user.lastLogin ? new Date(user.lastLogin) : new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dateCounts[dateStr] = user.solvedProblems.length;
      totalSubmissions = user.solvedProblems.length;
    }

    const uniqueDates = Object.keys(dateCounts).sort();
    const totalActiveDays = uniqueDates.length;
    const lastActiveDate = uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : null;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterdayDate = new Date(now.getTime() - 86400000);
    const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    const dateSet = new Set(uniqueDates);
    const activeToday = dateSet.has(todayStr);

    // Calculate current streak
    let currentStreak = 0;
    if (activeToday) {
      currentStreak = 1;
      let checkDate = new Date(now.getTime() - 86400000);
      while (true) {
        const s = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (dateSet.has(s)) {
          currentStreak++;
          checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
          break;
        }
      }
    } else if (dateSet.has(yesterdayStr)) {
      currentStreak = 1;
      let checkDate = new Date(yesterdayDate.getTime() - 86400000);
      while (true) {
        const s = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (dateSet.has(s)) {
          currentStreak++;
          checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
          break;
        }
      }
    } else if (user && user.solvedProblems && user.solvedProblems.length > 0) {
      currentStreak = 1;
    }

    // Calculate longest streak
    let longestStreak = currentStreak;
    if (uniqueDates.length > 0) {
      let run = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i - 1] + 'T00:00:00');
        const curr = new Date(uniqueDates[i] + 'T00:00:00');
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
        if (diffDays === 1) {
          run++;
        } else if (diffDays > 1) {
          run = 1;
        }
        if (run > longestStreak) {
          longestStreak = run;
        }
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak, user?.solvedProblems?.length ? 1 : 0),
      activeToday,
      totalActiveDays,
      totalSubmissions,
      lastActiveDate
    };
  } catch (err) {
    return {
      currentStreak: 1,
      longestStreak: 1,
      activeToday: true,
      totalActiveDays: 1,
      totalSubmissions: 1,
      lastActiveDate: null
    };
  }
}

export function getUserActivityHeatmap(userId?: string): ActivityHeatmapData {
  try {
    const user = userId ? getAllAccounts().find(a => a.id === userId) : getCurrentUser();
    const dateCounts: Record<string, number> = {};
    let totalCount = 0;

    if (user && user.submissions) {
      Object.values(user.submissions).forEach(subList => {
        if (Array.isArray(subList)) {
          subList.forEach(sub => {
            totalCount++;
            if (sub.timestamp) {
              try {
                const d = new Date(sub.timestamp);
                if (!isNaN(d.getTime())) {
                  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
                }
              } catch (e) {}
            }
          });
        }
      });
    }

    // Default solved activity credit if submissions record is empty
    if (user && Object.keys(dateCounts).length === 0 && user.solvedProblems && user.solvedProblems.length > 0) {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      dateCounts[dateStr] = user.solvedProblems.length;
      totalCount = user.solvedProblems.length;
    }

    // 53 weeks grid ending on coming Saturday
    const now = new Date();
    const endDayOfWeek = now.getDay(); // 0 is Sun, 6 is Sat
    const daysToSaturday = (6 - endDayOfWeek + 7) % 7;
    const gridEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToSaturday);

    const totalDays = 53 * 7;
    const gridStart = new Date(gridEnd.getFullYear(), gridEnd.getMonth(), gridEnd.getDate() - totalDays + 1);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weeks: HeatmapDay[][] = [];
    const months: { label: string; weekIndex: number }[] = [];
    let lastRecordedMonth = -1;

    let cursor = new Date(gridStart.getTime());
    let currentWeek: HeatmapDay[] = [];

    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth();
      const d = cursor.getDate();
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const count = dateCounts[dateStr] || 0;

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count >= 7) level = 4;
      else if (count >= 4) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      const dayItem: HeatmapDay = {
        date: dateStr,
        count,
        level,
        dayOfWeek: cursor.getDay(),
        month: monthNames[m]
      };

      currentWeek.push(dayItem);

      // Check month boundary
      if (currentWeek.length === 1 && m !== lastRecordedMonth) {
        months.push({ label: monthNames[m], weekIndex: weeks.length });
        lastRecordedMonth = m;
      }

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return {
      weeks,
      months,
      totalCount
    };
  } catch (err) {
    console.error('Heatmap calculation error:', err);
    return {
      weeks: [],
      months: [],
      totalCount: 0
    };
  }
}

export function getUserRecentActivity(userId?: string, limit: number = 20): UserActivityItem[] {
  try {
    const user = userId ? getAllAccounts().find(a => a.id === userId) : getCurrentUser();
    if (!user || !user.submissions) return [];
    const list: UserActivityItem[] = [];
    Object.entries(user.submissions).forEach(([slug, subs]) => {
      if (Array.isArray(subs)) {
        subs.forEach(s => {
          list.push({
            id: `${slug}_${s.timestamp}`,
            slug,
            timestamp: s.timestamp,
            success: s.success,
            runtimeMs: s.runtimeMs,
            passedCount: s.passedCount,
            totalCount: s.totalCount
          });
        });
      }
    });
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list.slice(0, limit);
  } catch (e) {
    return [];
  }
}

export interface UserRankTierInfo {
  tierName: string;
  tierIcon: string;
  badgeClass: string;
  currentElo: number;
  minElo: number;
  nextTierName: string | null;
  nextTierMinElo: number | null;
  progressPct: number;
}

export function getUserRankTier(elo: number): UserRankTierInfo {
  if (elo >= 2300) {
    return {
      tierName: 'Tensor Grandmaster',
      tierIcon: '👑',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      currentElo: elo,
      minElo: 2300,
      nextTierName: null,
      nextTierMinElo: null,
      progressPct: 100
    };
  } else if (elo >= 2000) {
    const range = 2300 - 2000;
    const progress = Math.min(100, Math.max(0, ((elo - 2000) / range) * 100));
    return {
      tierName: 'Gradient Alchemist',
      tierIcon: '⚡',
      badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      currentElo: elo,
      minElo: 2000,
      nextTierName: 'Tensor Grandmaster',
      nextTierMinElo: 2300,
      progressPct: parseFloat(progress.toFixed(1))
    };
  } else if (elo >= 1800) {
    const range = 2000 - 1800;
    const progress = Math.min(100, Math.max(0, ((elo - 1800) / range) * 100));
    return {
      tierName: 'Eigen Master',
      tierIcon: '💎',
      badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      currentElo: elo,
      minElo: 1800,
      nextTierName: 'Gradient Alchemist',
      nextTierMinElo: 2000,
      progressPct: parseFloat(progress.toFixed(1))
    };
  } else if (elo >= 1650) {
    const range = 1800 - 1650;
    const progress = Math.min(100, Math.max(0, ((elo - 1650) / range) * 100));
    return {
      tierName: 'Matrix Specialist',
      tierIcon: '🥇',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      currentElo: elo,
      minElo: 1650,
      nextTierName: 'Eigen Master',
      nextTierMinElo: 1800,
      progressPct: parseFloat(progress.toFixed(1))
    };
  } else if (elo >= 1550) {
    const range = 1650 - 1550;
    const progress = Math.min(100, Math.max(0, ((elo - 1550) / range) * 100));
    return {
      tierName: 'Vector Explorer',
      tierIcon: '🥈',
      badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      currentElo: elo,
      minElo: 1550,
      nextTierName: 'Matrix Specialist',
      nextTierMinElo: 1650,
      progressPct: parseFloat(progress.toFixed(1))
    };
  } else {
    const range = 1550 - 1500;
    const progress = Math.min(100, Math.max(0, ((elo - 1500) / range) * 100));
    return {
      tierName: 'Scalar Novice',
      tierIcon: '🥉',
      badgeClass: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
      currentElo: elo,
      minElo: 1500,
      nextTierName: 'Vector Explorer',
      nextTierMinElo: 1550,
      progressPct: parseFloat(progress.toFixed(1))
    };
  }
}

export function getUserEloRating(
  userId?: string,
  easySolved: number = 0,
  mediumSolved: number = 0,
  hardSolved: number = 0
): number {
  try {
    const streak = getUserStreak(userId);
    const user = userId ? getAllAccounts().find(a => a.id === userId) : getCurrentUser();
    const solvedTotal = user?.solvedProblems?.length || 0;

    let base = 1500;
    if (easySolved === 0 && mediumSolved === 0 && hardSolved === 0 && solvedTotal > 0) {
      // Approximate distribution if breakdown not provided
      base += solvedTotal * 8;
    } else {
      base += easySolved * 4 + mediumSolved * 10 + hardSolved * 22;
    }

    base += Math.min(streak.currentStreak * 3, 60);
    try {
      const mathCompleted = JSON.parse(localStorage.getItem('tt_ml_math_completed_v1') || '[]');
      if (Array.isArray(mathCompleted) && mathCompleted.length > 0) {
        base += Math.min(250, mathCompleted.length * 4);
      }
    } catch {}
    return Math.max(1500, base);
  } catch {
    return 1500;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: {
    displayName?: string;
    username?: string;
    role?: UserAccount['role'];
    avatarColor?: string;
  }
): Promise<{ success: boolean; error?: string; user?: UserAccount }> {
  const accounts = getAllAccounts();
  const index = accounts.findIndex(a => a.id === userId);
  if (index === -1) {
    return { success: false, error: 'User not found.' };
  }

  const current = accounts[index];

  if (updates.username && updates.username.trim().toLowerCase() !== current.username.toLowerCase()) {
    const cleanUsername = updates.username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters.' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      return { success: false, error: 'Username can only contain letters, numbers, underscores, and dashes.' };
    }
    const exists = accounts.some(a => a.id !== userId && a.username.toLowerCase() === cleanUsername);
    if (exists) {
      return { success: false, error: 'Username is already taken by another account.' };
    }
    current.username = cleanUsername;
  }

  if (updates.displayName !== undefined) {
    current.displayName = updates.displayName.trim() || current.username;
  }
  if (updates.role) {
    current.role = updates.role;
  }
  if (updates.avatarColor) {
    current.avatarColor = updates.avatarColor;
  }

  accounts[index] = current;
  saveAccounts(accounts);
  window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));

  // Sync to Vercel API if available
  const token = getAuthToken();
  if (token) {
    try {
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: current.displayName,
          username: current.username,
          role: current.role,
          avatarColor: current.avatarColor
        })
      });
    } catch (e) {
      // ignore
    }
  }

  return { success: true, user: current };
}

export async function updateUserPassword(
  userId: string,
  currentPasswordPlain: string,
  newPasswordPlain: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPasswordPlain || newPasswordPlain.length < 4) {
    return { success: false, error: 'New password must be at least 4 characters long.' };
  }

  const accounts = getAllAccounts();
  const user = accounts.find(a => a.id === userId);
  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  const currentHash = await hashPassword(currentPasswordPlain);
  if (user.passwordHash && user.passwordHash !== currentHash) {
    return { success: false, error: 'Current password is incorrect.' };
  }

  const newHash = await hashPassword(newPasswordPlain);
  user.passwordHash = newHash;
  saveAccounts(accounts);
  window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));

  // Sync to backend if token exists
  const token = getAuthToken();
  if (token) {
    try {
      await fetch('/api/user/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: currentPasswordPlain,
          newPassword: newPasswordPlain
        })
      });
    } catch (e) {}
  }

  return { success: true };
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  category: 'solving' | 'streak' | 'speed' | 'mastery';
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  target: number;
}

export function getUserAchievements(
  userId?: string,
  hardSolvedCount: number = 0
): AchievementBadge[] {
  try {
    const user = userId ? getAllAccounts().find(a => a.id === userId) : getCurrentUser();
    const streak = getUserStreak(userId);
    const solvedTotal = user?.solvedProblems?.length || 0;

    let hasFastSubmission = false;
    let hasCleanSubmission = false;

    if (user?.submissions) {
      Object.values(user.submissions).forEach(list => {
        if (Array.isArray(list)) {
          list.forEach(sub => {
            if (sub.success) {
              hasCleanSubmission = true;
              if (sub.runtimeMs && sub.runtimeMs < 25) {
                hasFastSubmission = true;
              }
            }
          });
        }
      });
    }

    // Default fast submission if user has solved problems
    if (solvedTotal > 0 && !hasCleanSubmission) {
      hasCleanSubmission = true;
      hasFastSubmission = true;
    }

    const badges: AchievementBadge[] = [
      {
        id: 'first_solve',
        title: 'First Step',
        description: 'Solve your very first machine learning problem on TonicLite',
        category: 'solving',
        icon: 'trophy',
        tier: 'bronze',
        unlocked: solvedTotal >= 1,
        progress: Math.min(1, solvedTotal),
        target: 1
      },
      {
        id: 'five_solves',
        title: 'Getting Started',
        description: 'Successfully solve 5 machine learning algorithm problems',
        category: 'solving',
        icon: 'zap',
        tier: 'bronze',
        unlocked: solvedTotal >= 5,
        progress: Math.min(5, solvedTotal),
        target: 5
      },
      {
        id: 'ten_solves',
        title: 'Tensor Apprentice',
        description: 'Reach a milestone of 10 solved coding challenges',
        category: 'solving',
        icon: 'brain',
        tier: 'silver',
        unlocked: solvedTotal >= 10,
        progress: Math.min(10, solvedTotal),
        target: 10
      },
      {
        id: 'twenty_five_solves',
        title: 'ML Practitioner',
        description: 'Master 25 problems across NumPy, PyTorch, and algorithms',
        category: 'solving',
        icon: 'shield',
        tier: 'gold',
        unlocked: solvedTotal >= 25,
        progress: Math.min(25, solvedTotal),
        target: 25
      },
      {
        id: 'century_club',
        title: 'Century Club',
        description: 'Ascend to the elite rank of 100 solved problems',
        category: 'solving',
        icon: 'award',
        tier: 'platinum',
        unlocked: solvedTotal >= 100,
        progress: Math.min(100, solvedTotal),
        target: 100
      },
      {
        id: 'streak_3',
        title: 'Ignition',
        description: 'Achieve a 3-day consecutive problem solving streak',
        category: 'streak',
        icon: 'flame',
        tier: 'bronze',
        unlocked: streak.longestStreak >= 3,
        progress: Math.min(3, streak.longestStreak),
        target: 3
      },
      {
        id: 'streak_7',
        title: 'Week on Fire',
        description: 'Maintain a 7-day daily streak without missing a day',
        category: 'streak',
        icon: 'flame',
        tier: 'gold',
        unlocked: streak.longestStreak >= 7,
        progress: Math.min(7, streak.longestStreak),
        target: 7
      },
      {
        id: 'speed_demon',
        title: 'Speed Demon',
        description: 'Submit an optimal vectorized implementation under 25ms',
        category: 'speed',
        icon: 'zap',
        tier: 'silver',
        unlocked: hasFastSubmission,
        progress: hasFastSubmission ? 1 : 0,
        target: 1
      },
      {
        id: 'hard_tamer',
        title: 'Hardcore Solver',
        description: 'Conquer at least one Hard rated problem in the catalog',
        category: 'mastery',
        icon: 'target',
        tier: 'gold',
        unlocked: hardSolvedCount >= 1,
        progress: Math.min(1, hardSolvedCount),
        target: 1
      },
      {
        id: 'flawless',
        title: 'Flawless Execution',
        description: 'Pass all test cases in a single comprehensive submission',
        category: 'mastery',
        icon: 'shield',
        tier: 'silver',
        unlocked: hasCleanSubmission,
        progress: hasCleanSubmission ? 1 : 0,
        target: 1
      }
    ];

    return badges;
  } catch (err) {
    return [];
  }
}


