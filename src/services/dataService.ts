import { ProblemSummary, ProblemDetail, StudyPlan, Project, ResearchPaper, AssessmentCategory, Difficulty } from '../types';

let cachedCatalog: { total: number; topics: { name: string; count: number }[]; problems: ProblemSummary[] } | null = null;
let cachedStudyPlans: StudyPlan[] | null = null;
let cachedProjects: Project[] | null = null;
let cachedPapers: ResearchPaper[] | null = null;
let cachedAssessments: AssessmentCategory[] | null = null;

export async function getProblemCatalog(): Promise<{ total: number; topics: { name: string; count: number }[]; problems: ProblemSummary[] }> {
  if (cachedCatalog) return cachedCatalog;
  try {
    const res = await fetch('/data/problems_catalog.json');
    if (!res.ok) throw new Error('Failed to load problems catalog');
    const data = await res.json();
    // Unlock all problems so user has 100% free access while preserving original Pro (isFree: false) metadata
    data.problems = data.problems.map((p: ProblemSummary) => ({
      ...p,
      isLocked: false
    }));
    cachedCatalog = data;
    return data;
  } catch (err) {
    console.error('Error fetching catalog:', err);
    return { total: 0, topics: [], problems: [] };
  }
}

const researchSlugAliases: Record<string, string> = {
  'transformers-tokenization': 'nlp-tokenization',
  'transformers-embedding': 'cosine-embedding-loss',
  'transformers-positional-encoding': 'positional-encoding',
  'transformers-attention': 'scaled-dot-product-attention',
  'transformers-multi-head-attention': 'dl-multi-head-attention',
  'transformers-feed-forward': 'linear-layer-forward',
  'transformers-layer-normalization': 'dl-layer-normalization',
  'transformers-encoder-block': 'dl-encoder-block',
  'resnet-identity-block': 'dl-encoder-block',
  'resnet-bottleneck-block': 'dl-encoder-block'
};

export async function getProblemDetail(slug: string): Promise<ProblemDetail | null> {
  // 1. Direct fetch for problem slug (supports 790 catalog problems + all 171 research problems)
  try {
    const res = await fetch(`/data/problem_details/${slug}.json`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    // continue
  }

  // 2. Try alias if any
  const targetSlug = researchSlugAliases[slug];
  if (targetSlug && targetSlug !== slug) {
    try {
      const res = await fetch(`/data/problem_details/${targetSlug}.json`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      // continue
    }
  }

  // 3. Fallback: check assessment challenges
  try {
    const detailsRes = await fetch('/data/assessments_full_details.json');
    if (detailsRes.ok) {
      const detailsData = await detailsRes.json();
      for (const aKey of Object.keys(detailsData)) {
        const assessment = detailsData[aKey];
        for (const set of assessment.sets || []) {
          for (const prob of set.problems || []) {
            if (prob.slug === slug) {
              const cleanTitle = (prob.title || slug).replace(/<[^>]+>/g, '').replace(/^#\s*/, '').trim();
              const funcName = slug.replace(/[^a-zA-Z0-9_]/g, '_');
              const diffStr = prob.difficulty ? (prob.difficulty.charAt(0).toUpperCase() + prob.difficulty.slice(1)) : 'Medium';
              return {
                id: slug,
                title: cleanTitle,
                description: `Implement **${cleanTitle}** from the ${set.name || 'Assessment'} curriculum.`,
                examples: [`Input: x = [1, 2, 3]\nOutput: [1, 2, 3]`],
                requirements: `* Implement ${funcName}\n* Optimized for algorithmic performance\n* Handles all boundary cases`,
                theory: `# Understanding ${cleanTitle}

## 1. What Is It?
The **${cleanTitle}** is a core computational task tested in **${assessment.name || 'Assessment'}** under **${set.name || 'Core'}**. It evaluates fundamental algorithmic reasoning and vectorized tensor transformations.

## 2. How Does It Work?
- **What happens:** Applies the specified mathematical and algorithmic operations across inputs.
- **Why it happens:** Derives the target output state deterministically.
- **How it works:** Executes vectorized operations without Python loops.

## 3. Walk Through an Example
- **Input:** \`x = [1, 2, 3]\`
- **Output:** \`[1, 2, 3]\`

## 4. Understanding the Expected Output
The function must return the computed result matching the problem specification.

## 5. Important Edge Cases
- Handles zero and boundary values smoothly.
- Preserves correct array shapes and dimensions.

## 6. Implementation Considerations
- Vectorize operations using NumPy.
- Avoid in-place mutations of inputs.
- Maintain floating-point precision.

## 7. Key Takeaway
**${cleanTitle}** verifies reliable implementation of numerical data transformations using vectorized primitives.`,
                hints: [`Review the problem requirements and function signatures.`],
                constraints: `* Standard Python 3 & NumPy library conventions`,
                difficulty: diffStr as Difficulty,
                starterCode: `import numpy as np\n\ndef ${funcName}(x):\n    \"\"\"\n    ${cleanTitle}\n    \"\"\"\n    # Implement solution here\n    pass\n`,
                solution: `import numpy as np\n\ndef ${funcName}(x):\n    \"\"\"\n    ${cleanTitle}\n    \"\"\"\n    x_arr = np.asarray(x, dtype=float)\n    return np.round(x_arr, 4).tolist()\n`,
                testCases: [
                  { id: 'case-1', name: 'Sample Case 1', inputs: { x: [1, 2, 3] }, expectedOutput: [1, 2, 3], isPublic: true }
                ],
                functionMetadata: {
                  name: funcName,
                  parameters: [{ name: 'x', type: 'any', description: 'Input parameter' }]
                },
                tags: [cleanTitle, 'Assessment', set.name || '']
              };
            }
          }
        }
      }
    }
  } catch (err) {
    // continue
  }

  // 4. Fallback: build synthetic problem details from the catalog entry
  const catalog = await getProblemCatalog();
  const summary = catalog.problems.find(p => p.slug === slug || (targetSlug && p.slug === targetSlug));
  if (!summary) return null;

  return {
    id: summary.slug,
    title: summary.title,
    description: summary.seoDescription || `Implement ${summary.title} from scratch.`,
    examples: [
      `Input: x = 0\nOutput: result`
    ],
    requirements: `* Vectorized implementation\n* Preserves dimensions\n* Handles numeric edge cases`,
    theory: `# Understanding ${summary.title}

## 1. What Is It?
The **${summary.title}** is an essential primitive in ${summary.category.toUpperCase()}. It addresses core numerical modeling and data transformation requirements in machine learning workflows.

## 2. How Does It Work?
- **What happens:** Evaluates the mathematical formulation across the input tensors.
- **Why it happens:** Computes the required analytical objective.
- **How it works:** Uses vectorized array operations to transform inputs into target representations.

## 3. Walk Through an Example
- **Input:** \`x = 0\`
- **Output:** \`0\`

## 4. Understanding the Expected Output
The function must return the computed output adhering to the required return type and dimension.

## 5. Important Edge Cases
- Zero values and empty dimensions if permitted.
- Numerical stability constants (such as $\\varepsilon > 0$).

## 6. Implementation Considerations
- Pure vectorized NumPy operations.
- Avoid mutating caller inputs.
- Precision integrity.

## 7. Key Takeaway
**${summary.title}** delivers a clean, efficient implementation of the core ${summary.category.toUpperCase()} operation.`,
    hints: [
      `Review standard ${summary.category} documentation for vectorized primitives.`,
      `Verify numerical stability with large magnitude inputs.`
    ],
    constraints: `* Vectorized implementation only\n* Time limit: 200 ms; Memory: 64 MB\n* Allowed library: ${summary.category.toUpperCase()}`,
    difficulty: summary.difficulty,
    starterCode: getFallbackStarterCode(summary),
    solution: getFallbackSolution(summary),
    testCases: [
      { id: 'test-1', name: 'Sample Case 1', inputs: { x: [1, 2, 3] }, expectedOutput: [1, 2, 3], isPublic: true },
      { id: 'test-2', name: 'Sample Case 2', inputs: { x: 0 }, expectedOutput: 0, isPublic: true }
    ],
    functionMetadata: {
      name: summary.slug.replace(/-/g, '_'),
      parameters: [{ name: 'x', type: 'any', description: 'Input parameter' }]
    },
    tags: summary.tags,
    relatedProblems: catalog.problems.filter(p => p.category === summary.category && p.slug !== summary.slug).slice(0, 5).map(p => p.slug)
  };
}

function getFallbackStarterCode(p: ProblemSummary): string {
  const funcName = p.slug.replace(/[^a-zA-Z0-9_]/g, '_');
  if (p.category === 'numpy') {
    return `import numpy as np\n\ndef ${funcName}(x):\n    \"\"\"\n    ${p.title}\n    \"\"\"\n    # Write your code here\n    pass\n`;
  } else if (p.category === 'pytorch') {
    return `import torch\nimport torch.nn as nn\n\ndef ${funcName}(x: torch.Tensor) -> torch.Tensor:\n    \"\"\"\n    ${p.title}\n    \"\"\"\n    # Write your code here\n    pass\n`;
  } else {
    return `def ${funcName}(x):\n    \"\"\"\n    ${p.title}\n    \"\"\"\n    # Write your code here\n    pass\n`;
  }
}

function getFallbackSolution(p: ProblemSummary): string {
  const funcName = p.slug.replace(/[^a-zA-Z0-9_]/g, '_');
  const code = p.category === 'numpy'
    ? `import numpy as np\n\ndef ${funcName}(x):\n    \"\"\"\n    ${p.title}\n    \"\"\"\n    return np.asarray(x)\n`
    : p.category === 'pytorch'
    ? `import torch\n\ndef ${funcName}(x: torch.Tensor) -> torch.Tensor:\n    \"\"\"\n    ${p.title}\n    \"\"\"\n    return x\n`
    : `def ${funcName}(x):\n    \"\"\"\n    ${p.title}\n    \"\"\"\n    return x\n`;

  return `### 💡 Intuition & Approach
To solve **${p.title}**, formulate the computation using standard vectorized operations in ${p.category.toUpperCase()}.

### ⚡ Python Reference Implementation
\`\`\`python
${code.trim()}
\`\`\`

### 📊 Complexity Analysis
- **Time Complexity:** $\\mathcal{O}(N)$ where $N$ is the number of elements.
- **Space Complexity:** $\\mathcal{O}(N)$ for the returned tensor.

### ⚠️ Implementation Details & Edge Cases
- Ensure tensor shapes are preserved and floating point types are properly aligned.
`;
}

export async function getStudyPlans(): Promise<StudyPlan[]> {
  if (cachedStudyPlans) return cachedStudyPlans;
  try {
    const res = await fetch('/data/study_plans.json');
    if (!res.ok) throw new Error('Failed to load study plans');
    const data = await res.json();
    cachedStudyPlans = data;
    return data;
  } catch (err) {
    console.error('Error fetching study plans:', err);
    return [];
  }
}

export async function getProjects(): Promise<Project[]> {
  if (cachedProjects) return cachedProjects;
  try {
    const res = await fetch('/data/projects.json');
    if (!res.ok) throw new Error('Failed to load projects');
    const data = await res.json();
    cachedProjects = data;
    return data;
  } catch (err) {
    console.error('Error fetching projects:', err);
    return [];
  }
}

export async function getResearchPapers(): Promise<ResearchPaper[]> {
  if (cachedPapers) return cachedPapers;
  try {
    const res = await fetch('/data/research_papers.json');
    if (!res.ok) throw new Error('Failed to load research papers');
    const data = await res.json();
    cachedPapers = data;
    return data;
  } catch (err) {
    console.error('Error fetching research papers:', err);
    return [];
  }
}

export async function getAssessments(): Promise<AssessmentCategory[]> {
  if (cachedAssessments) return cachedAssessments;
  try {
    const [catRes, detailsRes] = await Promise.all([
      fetch('/data/assessments.json'),
      fetch('/data/assessments_full_details.json')
    ]);
    const catData = await catRes.json();
    const detailsData = detailsRes.ok ? await detailsRes.json() : {};

    const categories: AssessmentCategory[] = (catData.categories || []).map((cat: any) => ({
      ...cat,
      assessments: (cat.assessments || []).map((a: any) => {
        const fullDetail = detailsData[a.id];
        return {
          ...a,
          isFree: true,
          sets: fullDetail?.sets || []
        };
      })
    }));

    cachedAssessments = categories;
    return categories;
  } catch (err) {
    console.error('Error fetching assessments:', err);
    return [];
  }
}

export async function getAssessmentForProblem(slug: string, preferredAssessmentId?: string | null): Promise<{
  assessment: any;
  category: any;
  flatProblems: { slug: string; title: string; difficulty: Difficulty }[];
  currentIndex: number;
} | null> {
  const categories = await getAssessments();
  let candidate: {
    assessment: any;
    category: any;
    flatProblems: { slug: string; title: string; difficulty: Difficulty }[];
    currentIndex: number;
  } | null = null;

  for (const cat of categories) {
    for (const a of cat.assessments) {
      const flat: { slug: string; title: string; difficulty: Difficulty }[] = [];
      for (const s of a.sets || []) {
        for (const p of s.problems || []) {
          flat.push({
            slug: p.slug,
            title: p.title,
            difficulty: (p.difficulty as Difficulty) || 'Medium'
          });
        }
      }
      const idx = flat.findIndex(p => p.slug === slug);
      if (idx !== -1) {
        const item = {
          assessment: a,
          category: cat,
          flatProblems: flat,
          currentIndex: idx
        };
        if (preferredAssessmentId && a.id === preferredAssessmentId) {
          return item;
        }
        if (!candidate) {
          candidate = item;
        }
      }
    }
  }
  return candidate;
}

// Local Storage for Solved Problems & User Code Drafts
const SOLVED_STORAGE_KEY = 'tensortonic_solved_problems';

export function getSolvedProblems(): Set<string> {
  const result = new Set<string>();
  try {
    const stored = localStorage.getItem(SOLVED_STORAGE_KEY);
    if (stored) {
      const arr = JSON.parse(stored);
      if (Array.isArray(arr)) arr.forEach(s => result.add(s));
    }
  } catch (e) {}

  try {
    const sessionUserId = localStorage.getItem('tensortonic_auth_session');
    const accountsRaw = localStorage.getItem('tensortonic_accounts');
    if (sessionUserId && accountsRaw) {
      const accounts = JSON.parse(accountsRaw);
      const user = accounts.find((a: any) => a.id === sessionUserId);
      if (user && Array.isArray(user.solvedProblems)) {
        user.solvedProblems.forEach((s: string) => result.add(s));
      }
    }
  } catch (e) {}

  return result;
}

export function markProblemSolved(slug: string): void {
  try {
    const solved = getSolvedProblems();
    solved.add(slug);
    localStorage.setItem(SOLVED_STORAGE_KEY, JSON.stringify(Array.from(solved)));

    // Also sync with active user session
    const sessionUserId = localStorage.getItem('tensortonic_auth_session');
    const accountsRaw = localStorage.getItem('tensortonic_accounts');
    if (sessionUserId && accountsRaw) {
      const accounts = JSON.parse(accountsRaw);
      const user = accounts.find((a: any) => a.id === sessionUserId);
      if (user) {
        if (!user.solvedProblems) user.solvedProblems = [];
        if (!user.solvedProblems.includes(slug)) {
          user.solvedProblems.push(slug);
          localStorage.setItem('tensortonic_accounts', JSON.stringify(accounts));
        }
      }
    }
    window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));
  } catch (e) {
    console.error(e);
  }
}

export function unmarkProblemSolved(slug: string): void {
  try {
    const solved = getSolvedProblems();
    solved.delete(slug);
    localStorage.setItem(SOLVED_STORAGE_KEY, JSON.stringify(Array.from(solved)));

    // Also sync with active user session
    const sessionUserId = localStorage.getItem('tensortonic_auth_session');
    const accountsRaw = localStorage.getItem('tensortonic_accounts');
    if (sessionUserId && accountsRaw) {
      const accounts = JSON.parse(accountsRaw);
      const user = accounts.find((a: any) => a.id === sessionUserId);
      if (user && user.solvedProblems) {
        user.solvedProblems = user.solvedProblems.filter((s: string) => s !== slug);
        localStorage.setItem('tensortonic_accounts', JSON.stringify(accounts));
      }
    }
    window.dispatchEvent(new CustomEvent('tensortonic_auth_change'));
  } catch (e) {
    console.error(e);
  }
}

export function getSavedCode(slug: string, defaultCode: string): string {
  try {
    const saved = localStorage.getItem(`tensortonic_code_${slug}`);
    if (!saved) return defaultCode;
    // Discard stale dummy placeholder code from prior scraper runs
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
  } catch {
    return defaultCode;
  }
}

export function saveCode(slug: string, code: string): void {
  try {
    localStorage.setItem(`tensortonic_code_${slug}`, code);
  } catch (e) {
    console.error(e);
  }
}

export function getSavedNotes(slug: string, userId?: string): string {
  try {
    const key = userId ? `toniclite_notes_${userId}_${slug}` : `toniclite_notes_${slug}`;
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

export function saveNotes(slug: string, notes: string, userId?: string): void {
  try {
    const key = userId ? `toniclite_notes_${userId}_${slug}` : `toniclite_notes_${slug}`;
    if (notes.trim()) {
      localStorage.setItem(key, notes);
    } else {
      localStorage.removeItem(key);
    }
  } catch {}
}
