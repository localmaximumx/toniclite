import crypto from 'crypto';

// In-memory fallback cache for development or when external KV is not yet provisioned
let inMemoryStore = {
  accounts: {}, // username -> account
  accountsById: {}, // id -> account
  sessions: {}, // token -> userId
  codeDrafts: {}, // `${userId}:${slug}` -> code
  submissions: {} // `${userId}:${slug}` -> [submissions]
};

// Upstash Redis / Vercel KV REST helper (zero external dependencies, works on Node & Edge runtimes)
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function kvCommand(command, ...args) {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const res = await fetch(KV_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KV_TOKEN}`
      },
      body: JSON.stringify([command, ...args])
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`KV [${command}] HTTP ${res.status}:`, errText);
      return null;
    }
    const json = await res.json();
    return json.result;
  } catch (e) {
    console.warn(`KV [${command}] exception:`, e.message);
    return null;
  }
}

export function hashPassword(plainText) {
  return crypto.createHash('sha256').update(plainText.trim()).digest('hex');
}

export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function getAccountByUsername(username) {
  const clean = username.trim().toLowerCase();
  if (KV_URL) {
    const data = await kvCommand('get', `user:name:${clean}`);
    if (data) {
      return typeof data === 'string' ? JSON.parse(data) : data;
    }
  }
  return inMemoryStore.accounts[clean] || null;
}

export async function getAccountById(userId) {
  if (KV_URL) {
    const data = await kvCommand('get', `user:id:${userId}`);
    if (data) {
      return typeof data === 'string' ? JSON.parse(data) : data;
    }
  }
  return inMemoryStore.accountsById[userId] || null;
}

export async function saveAccount(account) {
  const clean = account.username.toLowerCase();
  inMemoryStore.accounts[clean] = account;
  inMemoryStore.accountsById[account.id] = account;

  if (KV_URL) {
    const serialized = JSON.stringify(account);
    await kvCommand('set', `user:name:${clean}`, serialized);
    await kvCommand('set', `user:id:${account.id}`, serialized);
    await kvCommand('sadd', 'users:list', clean);
  }
  return account;
}

export async function getAllUserAccounts() {
  if (KV_URL) {
    const list = await kvCommand('smembers', 'users:list');
    if (Array.isArray(list) && list.length > 0) {
      const accounts = await Promise.all(list.map(username => getAccountByUsername(username)));
      return accounts.filter(Boolean);
    }
  }
  return Object.values(inMemoryStore.accounts);
}

export async function createSession(userId) {
  const token = generateToken();
  inMemoryStore.sessions[token] = userId;

  if (KV_URL) {
    // Session TTL: 30 days (2592000 seconds)
    await kvCommand('set', `session:${token}`, userId);
  }
  return token;
}

export async function getUserIdFromSession(token) {
  if (!token) return null;
  if (KV_URL) {
    const id = await kvCommand('get', `session:${token}`);
    if (id) return id;
  }
  return inMemoryStore.sessions[token] || null;
}

export async function deleteSession(token) {
  if (!token) return;
  delete inMemoryStore.sessions[token];
  if (KV_URL) {
    await kvCommand('del', `session:${token}`);
  }
}

export async function recordSubmission(userId, slug, submission) {
  const account = await getAccountById(userId);
  if (!account) return null;

  if (!account.submissions) account.submissions = {};
  if (!account.submissions[slug]) account.submissions[slug] = [];
  account.submissions[slug].push(submission);

  if (!account.solvedProblems) account.solvedProblems = [];
  if (submission.success && !account.solvedProblems.includes(slug)) {
    account.solvedProblems.push(slug);
  }

  await saveAccount(account);
  return account;
}

export async function saveDraft(userId, slug, code) {
  const account = await getAccountById(userId);
  if (!account) return null;

  if (!account.codeDrafts) account.codeDrafts = {};
  account.codeDrafts[slug] = code;

  await saveAccount(account);
  return code;
}

export async function getDraft(userId, slug) {
  const account = await getAccountById(userId);
  if (!account || !account.codeDrafts) return null;
  return account.codeDrafts[slug] || null;
}

export async function saveUserNote(userId, url, note) {
  const account = await getAccountById(userId);
  if (!account) return null;

  if (!account.mlMathNotes) account.mlMathNotes = {};
  account.mlMathNotes[url] = note;

  await saveAccount(account);
  return note;
}

export async function getUserNotes(userId) {
  const account = await getAccountById(userId);
  if (!account || !account.mlMathNotes) return {};
  return account.mlMathNotes;
}
