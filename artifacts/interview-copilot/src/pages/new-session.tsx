import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, Briefcase, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ROLES = [
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Product Manager",
  "DevOps Engineer",
  "Solutions Architect",
  "Engineering Manager",
];

export function NewSession() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");

  const createMutation = useMutation({
    mutationFn: api.sessions.create,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      navigate(`/session/${session.id}`);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create session. Please try again.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = role === "custom" ? customRole : role;
    if (!title.trim() || !finalRole.trim()) {
      toast({ title: "Missing fields", description: "Please enter a title and role.", variant: "destructive" });
      return;
    }
    createMutation.mutate({ title: title.trim(), role: finalRole.trim() });
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">New Interview Session</h1>
          <p className="text-muted-foreground">Set up your practice session and choose a role to interview for.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Session Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Google L5 Practice, Behavioral Round..."
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-foreground">Role</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
                    role === r
                      ? "bg-primary/20 border border-primary/40 text-primary"
                      : "bg-secondary/30 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <Briefcase className="w-3 h-3 inline mr-1.5 opacity-60" />
                  {r}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRole("custom")}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
                  role === "custom"
                    ? "bg-primary/20 border border-primary/40 text-primary"
                    : "bg-secondary/30 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                + Custom Role
              </button>
            </div>

            {role === "custom" && (
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="Enter custom role..."
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                autoFocus
              />
            )}
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-4 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)]"
          >
            {createMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Creating Session...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Start Interview Session</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
