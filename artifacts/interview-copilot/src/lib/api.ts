const BASE = "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export type Session = {
  id: number;
  title: string;
  role: string;
  company: string | null;
  resumeText: string | null;
  persona: string;
  timedMode: boolean;
  timePerQuestion: number;
  targetDate: string | null;
  drillMode: boolean;
  status: "active" | "completed";
  overallScore: number | null;
  createdAt: string;
  endedAt: string | null;
};

export type Question = {
  id: number;
  text: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  followUps: string[];
};

export type GeneratedQuestion = {
  text: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  followUps: string[];
};

export type Answer = {
  id: number;
  sessionId: number;
  questionId: number | null;
  questionText: string;
  answerText: string;
  clarityScore: number | null;
  confidenceScore: number | null;
  technicalDepthScore: number | null;
  communicationScore: number | null;
  overallScore: number | null;
  starScore: number | null;
  fillerWordCount: number;
  toneAnalysis: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  improvedAnswer: string | null;
  followUpQuestions: string[] | null;
  feedback: string | null;
  createdAt: string;
};

export type SessionWithAnswers = Session & { answers: Answer[] };

export type AnalysisResult = {
  answerId: number | null;
  clarityScore: number;
  confidenceScore: number;
  technicalDepthScore: number;
  communicationScore: number;
  overallScore: number;
  starScore: number;
  toneAnalysis: string;
  fillerWordCount: number;
  strengths: string[];
  weaknesses: string[];
  improvedAnswer: string;
  followUpQuestions: string[];
  feedback: string;
  starFeedback: string;
};

export type Badge = {
  id: string;
  label: string;
  description: string;
  earned: boolean;
  icon: string;
};

export type DashboardData = {
  totalSessions: number;
  totalAnswers: number;
  averageOverallScore: number | null;
  averageClarityScore: number | null;
  averageConfidenceScore: number | null;
  averageTechnicalDepthScore: number | null;
  averageCommunicationScore: number | null;
  streak: number;
  badges: Badge[];
  recentSessions: (Session & { company: string | null })[];
  weakAreas: { category: string; averageScore: number; sessionCount: number }[];
  scoreHistory: {
    date: string;
    overallScore: number;
    clarityScore: number;
    confidenceScore: number;
    technicalDepthScore: number;
    communicationScore: number;
  }[];
};

export const api = {
  sessions: {
    list: () => apiFetch<Session[]>("/sessions"),
    create: (data: {
      title: string;
      role: string;
      company?: string | null;
      resumeText?: string | null;
      persona?: string;
      timedMode?: boolean;
      timePerQuestion?: number;
      targetDate?: string | null;
      drillMode?: boolean;
    }) => apiFetch<Session>("/sessions", { method: "POST", body: JSON.stringify(data) }),
    get: (id: number) => apiFetch<SessionWithAnswers>(`/sessions/${id}`),
    end: (id: number) => apiFetch<Session>(`/sessions/${id}/end`, { method: "POST" }),
  },
  questions: {
    list: (params?: { category?: string; difficulty?: string }) => {
      const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
      return apiFetch<Question[]>(`/questions${qs}`);
    },
  },
  generateQuestions: (data: {
    role: string;
    company?: string | null;
    persona?: string;
    resumeText?: string | null;
    drillCategory?: string | null;
    count?: number;
  }) => apiFetch<{ questions: GeneratedQuestion[] }>("/generate-questions", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  analyze: (data: {
    questionText: string;
    answerText: string;
    role: string;
    sessionId?: number | null;
    questionId?: number | null;
    company?: string | null;
    persona?: string | null;
    resumeText?: string | null;
  }) => apiFetch<AnalysisResult>("/analyze", { method: "POST", body: JSON.stringify(data) }),
  answers: {
    save: (data: {
      sessionId: number;
      questionId?: number | null;
      questionText: string;
      answerText: string;
      analysisResult?: AnalysisResult | null;
    }) => apiFetch<Answer>("/answers", { method: "POST", body: JSON.stringify(data) }),
  },
  dashboard: {
    get: () => apiFetch<DashboardData>("/dashboard"),
  },
  parseResume: (file: File) => {
    const form = new FormData();
    form.append("resume", file);
    return fetch(`${BASE}/parse-resume`, { method: "POST", body: form })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error ?? "Failed to parse resume");
        }
        return res.json() as Promise<{ text: string; wordCount: number; fileName: string }>;
      });
  },
};
