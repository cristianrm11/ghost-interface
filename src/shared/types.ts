// ─── ATS ─────────────────────────────────────────────────────────────────────

export type ATSType =
  | 'greenhouse'
  | 'workday'
  | 'lever'
  | 'icims'
  | 'bamboohr'
  | 'ashby'
  | 'loxo'
  | 'generic';

export type ExperienceOrder = 'newest-first' | 'oldest-first';

export interface ATSFieldMap {
  experienceOrder: ExperienceOrder;
  /** Maps field name/id pattern → dot-notation profile path */
  fieldSelectors: Record<string, string>;
  openEndedSelectors: string[];
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface Location {
  city: string;
  state: string;
  country: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate: string; // YYYY-MM
  endDate: string | 'present';
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationDate: string; // YYYY-MM
  gpa?: string;
}

export interface UserProfile {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: Location;
    linkedIn: string;
    github: string;
    portfolio: string;
  };
  experience: WorkExperience[]; // always stored newest-first
  education: Education[];
  skills: string[];
  resumeText: string;
  yearsOfExperience: number; // computed from experience on save
  salaryExpectation?: number;
}

// ─── Form scanning ────────────────────────────────────────────────────────────

export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'file'
  | 'unknown';

export interface FieldDefinition {
  element: HTMLElement;
  key: string; // derived from name/id/label
  type: FieldType;
  charLimit?: number;
  required: boolean;
}

// ─── Confidence ───────────────────────────────────────────────────────────────

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

export interface ConfidenceScore {
  score: number; // 0.0–1.0
  level: ConfidenceLevel;
  reason: string;
  value: string | undefined;
}

// ─── JD parsing ───────────────────────────────────────────────────────────────

export interface JobDescription {
  title: string;
  company: string;
  yearsRequired: number;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  rawText: string;
}

export interface FitScore {
  overall: number; // 0–100
  yearsMatch: boolean;
  keywordHits: string[];
  keywordMisses: string[];
  titleMatch: 'exact' | 'related' | 'unrelated';
}

// ─── Decision tree ────────────────────────────────────────────────────────────

export type FillMethod = 'exact' | 'fuzzy' | 'inferred' | 'openEnded' | 'skipped';

export interface DecisionNode {
  id: string;
  fieldKey: string;
  atsType: ATSType;
  confidence: ConfidenceScore;
  fillMethod: FillMethod;
  timestamp: number;
  children: string[];
}

// ─── Overlay state ────────────────────────────────────────────────────────────

export type OverlayState =
  | 'idle'
  | 'fit-check'
  | 'filling'
  | 'review'
  | 'blocked'
  | 'ready';

// ─── Open-ended handler ───────────────────────────────────────────────────────

export type OpenEndedVariant = 'concise' | 'detailed' | 'custom';

export interface OpenEndedRequest {
  fieldKey: string;
  question: string;
  company: string;
  role: string;
  variant: OpenEndedVariant;
  profileSummary: string;
}

// ─── Chrome messages ──────────────────────────────────────────────────────────

export type ExtensionMessage =
  | { type: 'GET_PROFILE' }
  | { type: 'SET_PROFILE'; payload: UserProfile }
  | { type: 'GENERATE_OPEN_ENDED'; payload: OpenEndedRequest }
  | { type: 'LOG_DECISION'; payload: DecisionNode };

export type ExtensionResponse =
  | { type: 'PROFILE'; data: UserProfile | null }
  | { type: 'PROFILE_SAVED' }
  | { type: 'DECISION_LOGGED' }
  | { type: 'OPEN_ENDED_TEXT'; text: string }
  | { type: 'ERROR'; message: string };
