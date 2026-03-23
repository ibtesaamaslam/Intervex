import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Loader2, Briefcase, Sparkles, ArrowRight, ArrowLeft, Building2,
  FileText, User, Clock, Target, Calendar, Zap, CheckCircle2, Brain
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ROLES = [
  "Software Engineer", "Frontend Engineer", "Backend Engineer", "Full Stack Engineer",
  "Data Scientist", "Machine Learning Engineer", "Product Manager", "DevOps Engineer",
  "Solutions Architect", "Engineering Manager", "Mobile Engineer", "QA Engineer",
];

const COMPANIES = [
  { name: "Google", color: "#4285F4" }, { name: "Meta", color: "#0866FF" },
  { name: "Amazon", color: "#FF9900" }, { name: "Apple", color: "#555555" },
  { name: "Microsoft", color: "#00A4EF" }, { name: "Netflix", color: "#E50914" },
  { name: "Stripe", color: "#635BFF" }, { name: "Airbnb", color: "#FF5A5F" },
  { name: "Uber", color: "#000000" }, { name: "Spotify", color: "#1DB954" },
  { name: "OpenAI", color: "#10A37F" }, { name: "Other", color: "#6B7280" },
];

const PERSONAS = [
  { id: "friendly", label: "Friendly", icon: "😊", desc: "Supportive, balanced feedback" },
  { id: "tough", label: "Tough", icon: "💪", desc: "Demanding, high-bar evaluation" },
  { id: "technical", label: "Technical", icon: "🧠", desc: "Deep technical focus" },
];

const STEPS = ["Basics", "Resume", "Settings", "Review"];

type FormData = {
  title: string;
  role: string;
  company: string;
  customRole: string;
  resumeText: string;
  persona: "friendly" | "tough" | "technical";
  timedMode: boolean;
  timePerQuestion: number;
  targetDate: string;
  drillMode: boolean;
};

export function NewSession() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    title: "", role: "", company: "", customRole: "",
    resumeText: "", persona: "friendly", timedMode: false,
    timePerQuestion: 120, targetDate: "", drillMode: false,
  });

  const set = (key: keyof FormData, val: string | boolean | number) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const createMutation = useMutation({
    mutationFn: api.sessions.create,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      navigate(`/session/${session.id}`);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create session.", variant: "destructive" });
    },
  });

  const finalRole = form.role === "custom" ? form.customRole : form.role;

  const canNext = [
    form.title.trim() && finalRole.trim(),
    true,
    true,
    true,
  ][step];

  const handleCreate = () => {
    createMutation.mutate({
      title: form.title.trim(),
      role: finalRole.trim(),
      company: form.company && form.company !== "Other" ? form.company : null,
      resumeText: form.resumeText.trim() || null,
      persona: form.persona,
      timedMode: form.timedMode,
      timePerQuestion: form.timePerQuestion,
      targetDate: form.targetDate || null,
      drillMode: form.drillMode,
    });
  };

  const stepContent = [
    /* Step 0: Basics */
    <div key="basics" className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Session Title</label>
        <input
          type="text" value={form.title} onChange={e => set("title", e.target.value)}
          placeholder="e.g. Google L5 SWE Practice, Behavioral Round..."
          className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">Role</label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {ROLES.map(r => (
            <button key={r} type="button" onClick={() => set("role", r)}
              className={cn("px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all",
                form.role === r ? "bg-primary/20 border border-primary/40 text-primary" : "bg-secondary/30 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}>
              <Briefcase className="w-3 h-3 inline mr-1.5 opacity-60" />{r}
            </button>
          ))}
          <button type="button" onClick={() => set("role", "custom")}
            className={cn("px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all",
              form.role === "custom" ? "bg-primary/20 border border-primary/40 text-primary" : "bg-secondary/30 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}>
            + Custom Role
          </button>
        </div>
        {form.role === "custom" && (
          <input type="text" value={form.customRole} onChange={e => set("customRole", e.target.value)}
            placeholder="Enter custom role..." autoFocus
            className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">
          <Building2 className="w-4 h-4 inline mr-1.5" />Target Company <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {COMPANIES.map(c => (
            <button key={c.name} type="button" onClick={() => set("company", form.company === c.name ? "" : c.name)}
              className={cn("px-3 py-2.5 rounded-xl text-sm font-medium transition-all border",
                form.company === c.name ? "border-primary/40 bg-primary/10 text-primary" : "border-border/50 bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>,

    /* Step 1: Resume */
    <div key="resume" className="space-y-4">
      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-sm text-primary/80 leading-relaxed">
        <Sparkles className="w-4 h-4 inline mr-2" />
        Paste your resume and Intervex will generate questions tailored to your specific experience, skills, and projects.
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          <FileText className="w-4 h-4 inline mr-1.5" />Your Resume <span className="text-muted-foreground font-normal">(optional — paste as text)</span>
        </label>
        <textarea
          value={form.resumeText}
          onChange={e => set("resumeText", e.target.value)}
          placeholder="Paste your resume text here... Include your experience, skills, projects, and education."
          rows={12}
          className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none text-sm leading-relaxed"
        />
        {form.resumeText && (
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />{form.resumeText.split(/\s+/).length} words — questions will be tailored to your background
          </p>
        )}
      </div>
    </div>,

    /* Step 2: Settings */
    <div key="settings" className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-3">
          <User className="w-4 h-4 inline mr-1.5" />Interviewer Persona
        </label>
        <div className="grid grid-cols-3 gap-3">
          {PERSONAS.map(p => (
            <button key={p.id} type="button" onClick={() => set("persona", p.id)}
              className={cn("p-4 rounded-2xl border text-left transition-all",
                form.persona === p.id ? "border-primary/40 bg-primary/10" : "border-border/50 bg-secondary/30 hover:bg-secondary/60"
              )}>
              <div className="text-2xl mb-2">{p.icon}</div>
              <div className={cn("font-bold text-sm", form.persona === p.id ? "text-primary" : "text-foreground")}>{p.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className={cn("p-4 rounded-2xl border transition-all", form.timedMode ? "border-amber-400/30 bg-amber-400/5" : "border-border/50 bg-secondary/30")}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="font-medium text-sm">Timed Mode</span>
            </div>
            <button onClick={() => set("timedMode", !form.timedMode)}
              className={cn("w-11 h-6 rounded-full transition-all relative", form.timedMode ? "bg-amber-400" : "bg-secondary")}>
              <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all", form.timedMode ? "left-6" : "left-1")} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Simulate real interview pressure with a countdown timer</p>
          {form.timedMode && (
            <div className="mt-3">
              <label className="text-xs text-muted-foreground mb-1 block">Seconds per question</label>
              <input type="range" min={30} max={300} step={15} value={form.timePerQuestion}
                onChange={e => set("timePerQuestion", parseInt(e.target.value))}
                className="w-full accent-amber-400" />
              <div className="text-sm font-bold text-amber-400 mt-1">{form.timePerQuestion}s ({Math.floor(form.timePerQuestion / 60)}:{String(form.timePerQuestion % 60).padStart(2, "0")})</div>
            </div>
          )}
        </div>

        <div className={cn("p-4 rounded-2xl border transition-all", form.drillMode ? "border-rose-400/30 bg-rose-400/5" : "border-border/50 bg-secondary/30")}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-400" />
              <span className="font-medium text-sm">Drill Mode</span>
            </div>
            <button onClick={() => set("drillMode", !form.drillMode)}
              className={cn("w-11 h-6 rounded-full transition-all relative", form.drillMode ? "bg-rose-400" : "bg-secondary")}>
              <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all", form.drillMode ? "left-6" : "left-1")} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Focus on your weakest areas from past sessions</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          <Calendar className="w-4 h-4 inline mr-1.5" />Target Interview Date <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input type="date" value={form.targetDate} onChange={e => set("targetDate", e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        {form.targetDate && (
          <p className="text-xs text-primary mt-1">
            {Math.max(0, Math.ceil((new Date(form.targetDate).getTime() - Date.now()) / 86400000))} days until your interview
          </p>
        )}
      </div>
    </div>,

    /* Step 3: Review */
    <div key="review" className="space-y-4">
      <div className="grid gap-3">
        {[
          { icon: Sparkles, label: "Session", value: form.title },
          { icon: Briefcase, label: "Role", value: finalRole || "—" },
          { icon: Building2, label: "Company", value: form.company || "Not specified" },
          { icon: Brain, label: "Persona", value: PERSONAS.find(p => p.id === form.persona)?.label ?? "Friendly" },
          { icon: FileText, label: "Resume", value: form.resumeText ? `${form.resumeText.split(/\s+/).length} words pasted` : "Not provided" },
          { icon: Clock, label: "Timer", value: form.timedMode ? `${form.timePerQuestion}s per question` : "Off" },
          { icon: Target, label: "Drill Mode", value: form.drillMode ? "On — targeting weak areas" : "Off" },
          { icon: Calendar, label: "Target Date", value: form.targetDate ? new Date(form.targetDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Not set" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/30 border border-border/50">
            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground w-24 shrink-0">{label}</span>
            <span className="text-sm font-medium text-foreground">{value}</span>
          </div>
        ))}
      </div>
      {(form.company || form.resumeText) && (
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary/80 flex items-start gap-2">
          <Zap className="w-4 h-4 shrink-0 mt-0.5" />
          AI-powered questions will be generated tailored to your {form.company ? `${form.company} interview` : "background"} on session start.
        </div>
      )}
    </div>,
  ];

  return (
    <div className="max-w-2xl mx-auto py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">New Interview Session</h1>
          <p className="text-muted-foreground">Customize your practice experience in a few steps.</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 transition-all",
                i < step ? "bg-primary border-primary text-white" :
                i === step ? "border-primary text-primary bg-primary/10" :
                "border-border text-muted-foreground"
              )}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn("text-xs font-medium hidden sm:block", i === step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
              {i < STEPS.length - 1 && <div className={cn("flex-1 h-px", i < step ? "bg-primary" : "bg-border")} />}
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-0 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleCreate} disabled={createMutation.isPending || !form.title.trim() || !finalRole.trim()}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all">
                {createMutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</> : <><Zap className="w-5 h-5" /> Start Session</>}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
