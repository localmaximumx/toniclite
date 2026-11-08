export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Category = 'numpy' | 'python' | 'pytorch' | 'cuda' | 'triton' | 'pandas' | 'sql' | 'all';

export interface TestCase {
  id: string;
  name: string;
  inputs: Record<string, any>;
  expectedOutput?: any;
  isPublic?: boolean;
}

export interface FunctionParam {
  name: string;
  type: string;
  example?: string;
  description?: string;
}

export interface FunctionMetadata {
  name: string;
  parameters: FunctionParam[];
}

export interface ProblemSummary {
  catalogId: string;
  id: string;
  sourceId: string;
  slug: string;
  source: string;
  category: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  isFree: boolean;
  planId?: string | null;
  planTitle?: string | null;
  sectionId?: string | null;
  sortOrder: number;
  seoDescription?: string;
  solved?: boolean;
  isLocked?: boolean;
}

export interface ProblemDetail {
  id: string;
  title: string;
  isFree?: boolean;
  description: string;
  seoDescription?: string;
  examples?: any[];
  requirements?: string | string[];
  theory?: string;
  hints?: (string | any)[];
  constraints?: string | string[];
  difficulty: Difficulty;
  starterCode?: string;
  createdAt?: string;
  updatedAt?: string;
  solution?: string | null;
  visualizationComponent?: string;
  testCases?: TestCase[];
  functionMetadata?: FunctionMetadata;
  relatedProblems?: string[];
  tags?: string[];
  prevId?: string | null;
  nextId?: string | null;
}

export interface StudySection {
  id: string;
  planId: string;
  title: string;
  sortOrder: number;
  quizTitle?: string;
  quizSlug?: string;
  problems: {
    slug: string;
    title: string;
    difficulty: Difficulty;
    sortOrder: number;
    type?: string;
    isFree?: boolean;
  }[];
}

export interface StudyPlan {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  icon?: string;
  gradient?: string;
  difficulty: string;
  accentColor?: string;
  category?: string;
  estimatedDays?: number;
  problemCount: number;
  sections?: StudySection[];
}

export interface Project {
  slug?: string;
  title: string;
  subtitle?: string;
  description: string;
  difficulty?: string;
  architectureType?: string;
  skills?: string[];
}

export interface AssessmentProblem {
  slug: string;
  type: string;
  title: string;
  difficulty: string;
}

export interface AssessmentSet {
  id: string;
  name: string;
  sortOrder: number;
  problems: AssessmentProblem[];
}

export interface AssessmentItem {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  isFree: boolean;
  status?: string;
  categoryId?: string;
  sets?: AssessmentSet[];
}

export interface AssessmentCategory {
  id: string;
  name: string;
  description: string;
  assessments: AssessmentItem[];
}

export interface ResearchTopic {
  id: string;
  name: string;
  description: string;
  color: string;
  sortOrder: number;
  problemId: string;
  isFree?: boolean;
  difficulty: Difficulty;
}

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string;
  description: string;
  paperUrl: string;
  year: number;
  isLocked: boolean;
  sortOrder: number;
  architectureType: string;
  visualizationComponent?: string;
  topics?: ResearchTopic[];
}
