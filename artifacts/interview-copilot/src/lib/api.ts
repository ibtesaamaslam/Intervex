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
  strengths: string[];
  weaknesses: string[];
  improvedAnswer: string;
  followUpQuestions: string[];
  feedback: string;
};

export type DashboardData = {
  totalSessions: number;
  totalAnswers: number;
  averageOverallScore: number | null;
  averageClarityScore: number | null;
  averageConfidenceScore: number | null;
  averageTechnicalDepthScore: number | null;
  averageCommunicationScore: number | null;
  recentSessions: Session[];
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
    create: (data: { title: string; role: string }) =>
      apiFetch<Session>("/sessions", { method: "POST", body: JSON.stringify(data) }),
    get: (id: number) => apiFetch<SessionWithAnswers>(`/sessions/${id}`),
    end: (id: number) => apiFetch<Session>(`/sessions/${id}/end`, { method: "POST" }),
  },
  questions: {
    list: (params?: { category?: string; difficulty?: string }) => {
      const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
      return apiFetch<Question[]>(`/questions${qs}`);
    },
  },
  analyze: (data: {
    questionText: string;
    answerText: string;
    role: string;
    sessionId?: number | null;
    questionId?: number | null;
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
};
