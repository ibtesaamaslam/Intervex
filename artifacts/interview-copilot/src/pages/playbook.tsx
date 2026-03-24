import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  Code2, BarChart3, Layers, Palette, Megaphone, DollarSign, ShoppingCart,
  Database, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Lightbulb,
  BookOpen, Target, Clock, Star, Zap, MessageSquare, Brain, Trophy, Mic,
  ArrowRight, Shield, TrendingUp, Users, Smile
} from "lucide-react";

/* ─────────────────────────────────────────────────────────── */
/* Role data                                                    */
/* ─────────────────────────────────────────────────────────── */
const ROLES = [
  {
    id: "swe",
    label: "Software Engineer",
    icon: Code2,
    color: "from-blue-500/20 to-blue-600/10",
    accent: "text-blue-400",
    border: "border-blue-400/20",
    bg: "bg-blue-400/10",
    dot: "bg-blue-400",
    tagline: "Systems thinking meets clean code.",
    keySkills: [
      "Data structures & algorithms (arrays, trees, graphs, DP)",
      "System design (scalability, databases, caching, APIs)",
      "OOP principles and design patterns",
      "Time/space complexity analysis",
      "Past project ownership and impact",
    ],
    commonQuestions: [
      "Design a URL shortener like bit.ly at scale.",
      "Reverse a linked list — explain trade-offs.",
      "Tell me about a time you debugged a hard production issue.",
      "How would you design the Twitter feed algorithm?",
      "What's the hardest technical decision you've made?",
    ],
    doList: [
      "Think out loud — interviewers want to see your reasoning process, not just the answer",
      "Clarify ambiguous requirements before writing a single line",
      "Start with a brute-force, then optimize — never jump to clever",
      "Quantify your impact: 'reduced latency by 40%', not 'made it faster'",
      "Ask about constraints: scale, latency, read vs. write ratio",
    ],
    dontList: [
      "Don't code in silence — silent candidates rarely pass",
      "Don't over-engineer system design from the start",
      "Don't say 'I don't know' and stop — talk through what you do know",
      "Don't ignore edge cases (null, empty, overflow)",
      "Don't memorize solutions — understand the pattern",
    ],
    starTip: "Use STAR to answer behavioral questions. For 'Tell me about a conflict with a teammate' — describe the Situation (sprint crunch), Task (conflicting PR reviews), Action (you scheduled a sync to align on style guide), Result (merged 2 days early, team adopted the guide).",
    powerMove: "End every system design with: 'Given more time, I'd add X to improve reliability / reduce cost.' It shows senior-level thinking.",
    prepPlan: [
      { day: "Week 1–2", task: "LeetCode: arrays, strings, hash maps (Easy → Medium)" },
      { day: "Week 3", task: "Trees, graphs, BFS/DFS, recursion" },
      { day: "Week 4", task: "System design: URL shortener, chat app, rate limiter" },
      { day: "Day before", task: "Review your past projects — write 3 STAR stories" },
      { day: "Day of", task: "No new topics — light review, sleep well, eat" },
    ],
  },
  {
    id: "pm",
    label: "Product Manager",
    icon: Layers,
    color: "from-violet-500/20 to-violet-600/10",
    accent: "text-violet-400",
    border: "border-violet-400/20",
    bg: "bg-violet-400/10",
    dot: "bg-violet-400",
    tagline: "Ship products users love and businesses need.",
    keySkills: [
      "Product intuition and customer empathy",
      "Prioritization frameworks (RICE, MoSCoW, Impact vs. Effort)",
      "Metrics definition and analytics (DAU, retention, conversion)",
      "Stakeholder communication and alignment",
      "Cross-functional leadership without authority",
    ],
    commonQuestions: [
      "How would you improve Spotify's onboarding experience?",
      "You have 3 features requested. How do you decide what ships first?",
      "A key metric drops 15% overnight. Walk me through your diagnosis.",
      "Tell me about a product you launched that didn't hit targets. What did you learn?",
      "How do you say no to a stakeholder?",
    ],
    doList: [
      "Always tie features to user problems AND business outcomes",
      "Use structured frameworks (CIRCLES, HEART) but don't robotically recite them",
      "Show data literacy — ask 'what does success look like?' and name metrics",
      "Demonstrate customer empathy with real user research references",
      "Be opinionated with humility: 'I believe X because of Y, but I'd validate by Z'",
    ],
    dontList: [
      "Don't pitch features without stating the problem they solve",
      "Don't say 'I'd just A/B test everything' — show how you'd form a hypothesis",
      "Don't ignore trade-offs — acknowledge what you'd deprioritize and why",
      "Don't be vague about metrics — be specific about what you'd measure",
      "Don't overlook the business model when improving a product",
    ],
    starTip: "For 'Tell me about a time you launched a product': Situation (we had high churn on day 3), Task (your goal was to reduce it 20%), Action (you ran user interviews, identified confusion in onboarding step 2, redesigned it), Result (churn dropped 31% in 6 weeks). Keep it tight.",
    powerMove: "When asked to improve a product: start with 'Who are the primary users and what's the core job to be done?' This signals senior PM thinking before jumping to solutions.",
    prepPlan: [
      { day: "Week 1", task: "Study 5 products you use daily — write their north star metric" },
      { day: "Week 2", task: "Practice CIRCLES and HEART frameworks out loud (timed)" },
      { day: "Week 3", task: "Read 'Inspired' by Marty Cagan, review your launch stories" },
      { day: "Day before", task: "Research the company's products, competitors, recent news" },
      { day: "Day of", task: "Have 3 STAR stories rehearsed; bring a notebook to show you listen" },
    ],
  },
  {
    id: "data",
    label: "Data Scientist",
    icon: BarChart3,
    color: "from-emerald-500/20 to-emerald-600/10",
    accent: "text-emerald-400",
    border: "border-emerald-400/20",
    bg: "bg-emerald-400/10",
    dot: "bg-emerald-400",
    tagline: "Turn raw data into decisions that matter.",
    keySkills: [
      "Statistics & probability (distributions, hypothesis testing, p-values)",
      "Machine learning (regression, classification, clustering, NLP)",
      "SQL and Python/pandas proficiency",
      "A/B test design and causal inference",
      "Communicating insights to non-technical stakeholders",
    ],
    commonQuestions: [
      "Walk me through how you'd design an A/B test for a new feature.",
      "How do you handle class imbalance in a classification problem?",
      "Explain overfitting and how you'd prevent it.",
      "A model's accuracy is 95% — is it good? How do you decide?",
      "Tell me about a time your analysis changed a business decision.",
    ],
    doList: [
      "Always ask 'what decision does this analysis inform?' before starting",
      "Mention precision/recall trade-offs when accuracy alone isn't enough",
      "Show business impact of your models — not just technical metrics",
      "Talk about data cleaning and its importance — it shows real-world experience",
      "Be explicit about assumptions you're making in your analysis",
    ],
    dontList: [
      "Don't just say 'I'd use a neural network' — explain why it fits the problem",
      "Don't ignore interpretability requirements — ask if the model needs to be explainable",
      "Don't skip EDA — mention it as a first step every time",
      "Don't forget about data leakage — bring it up proactively",
      "Don't confuse correlation with causation — this is a common red flag",
    ],
    starTip: "For impact stories: lead with the business outcome. 'My churn prediction model identified 8,000 at-risk users, the team ran a retention campaign, and revenue churn dropped 12% — saving $2M ARR.' The model details are secondary to the story.",
    powerMove: "When given an ambiguous analysis problem, say: 'Before I dive in, can I ask — what decision will this data inform, and what's our acceptable error rate?' It signals senior data thinking.",
    prepPlan: [
      { day: "Week 1", task: "SQL: window functions, CTEs, self-joins (practice on Stratascratch)" },
      { day: "Week 2", task: "Stats: hypothesis testing, confidence intervals, power analysis" },
      { day: "Week 3", task: "ML: end-to-end sklearn pipeline, feature engineering, model evaluation" },
      { day: "Day before", task: "Review 3 past projects with business impact numbers ready" },
      { day: "Day of", task: "Have a structured A/B test design answer memorized as a template" },
    ],
  },
  {
    id: "design",
    label: "UX / Product Designer",
    icon: Palette,
    color: "from-pink-500/20 to-rose-600/10",
    accent: "text-pink-400",
    border: "border-pink-400/20",
    bg: "bg-pink-400/10",
    dot: "bg-pink-400",
    tagline: "Design systems that feel inevitable.",
    keySkills: [
      "User research methodologies (interviews, usability testing, surveys)",
      "Information architecture and user flows",
      "Prototyping and interaction design (Figma, Framer)",
      "Accessibility (WCAG 2.1) and inclusive design",
      "Communicating design decisions with rationale",
    ],
    commonQuestions: [
      "Walk me through your design process using a project from your portfolio.",
      "How do you handle feedback when stakeholders disagree with your designs?",
      "Redesign the Google Maps search experience — go.",
      "Tell me about a time user research completely changed your direction.",
      "How do you balance aesthetics with functionality?",
    ],
    doList: [
      "Lead every portfolio walkthrough with the problem, not the screens",
      "Show your thinking process — sketches, wrong turns, pivots matter",
      "Quantify the impact of your designs (task completion rate, NPS, conversion)",
      "Demonstrate cross-functional collaboration — mention eng and PM partners",
      "Ask clarifying questions in design exercises: 'Who are the users? What platform?'",
    ],
    dontList: [
      "Don't show only polished Figma files without the reasoning behind them",
      "Don't say 'I just followed best practices' — show unique insight",
      "Don't ignore accessibility — it signals seniority if you bring it up unprompted",
      "Don't defend every pixel — show you're open to critique and iteration",
      "Don't overlook edge cases and error states in your designs",
    ],
    starTip: "For design challenges: frame it as 'Problem → Research → Insight → Hypothesis → Solution → Validation.' When you verbalize this loop naturally, you sound like a senior designer.",
    powerMove: "At the end of a portfolio presentation say: 'Looking back, if I could redo one thing, I would have tested the onboarding flow earlier.' Self-awareness in designers is rare — it stands out.",
    prepPlan: [
      { day: "Week 1", task: "Document each portfolio project with a problem/insight/outcome frame" },
      { day: "Week 2", task: "Practice a 20-minute live design exercise (set a timer)" },
      { day: "Week 3", task: "Study 3 companies' design systems — understand their principles" },
      { day: "Day before", task: "Research the company's product, find 2 UX issues to mention" },
      { day: "Day of", task: "Lead with problems, not solutions. Speak slowly and confidently" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    color: "from-orange-500/20 to-amber-600/10",
    accent: "text-orange-400",
    border: "border-orange-400/20",
    bg: "bg-orange-400/10",
    dot: "bg-orange-400",
    tagline: "Build demand. Shape narrative. Drive growth.",
    keySkills: [
      "Go-to-market strategy and campaign execution",
      "Funnel thinking: awareness → acquisition → retention",
      "Content strategy and brand voice",
      "Performance marketing (CAC, ROAS, LTV)",
      "Cross-channel attribution and analytics",
    ],
    commonQuestions: [
      "How would you launch a new product with a $50K budget?",
      "Tell me about a campaign that didn't perform. What did you learn?",
      "How do you measure the success of a brand awareness campaign?",
      "Walk me through how you'd build an email nurture sequence.",
      "What's your approach to content strategy for a new audience?",
    ],
    doList: [
      "Always tie campaigns to pipeline and revenue — not just vanity metrics",
      "Show data fluency: CAC, LTV, payback period, MQL-to-SQL conversion",
      "Demonstrate creative thinking alongside analytical rigor",
      "Reference specific channels and why you chose them over alternatives",
      "Show awareness of brand consistency across touchpoints",
    ],
    dontList: [
      "Don't pitch ideas without mentioning how you'd measure success",
      "Don't be vague: 'I'd run social ads' → instead say which platforms, why, what creative angle",
      "Don't ignore the sales and product team's role in GTM",
      "Don't claim campaigns succeeded without mentioning the numbers",
      "Don't confuse activity (posts published) with outcomes (pipeline generated)",
    ],
    starTip: "For campaign stories: 'We were launching to a cold market with no brand recognition (S). My task was to generate 500 MQLs in Q1 (T). I ran a co-marketing webinar with 3 complementary brands and a LinkedIn thought-leadership series (A). We hit 680 MQLs at 40% below target CAC (R).'",
    powerMove: "Say: 'I always start by defining what the one metric that matters is for this campaign — everything else is secondary.' This signals strategic focus, not just execution.",
    prepPlan: [
      { day: "Week 1", task: "Document your top 3 campaigns with before/after metrics" },
      { day: "Week 2", task: "Study the company's current marketing: channels, messaging, tone" },
      { day: "Week 3", task: "Read 'Obviously Awesome' (positioning) and 'Traction' (channels)" },
      { day: "Day before", task: "Prepare a GTM framework answer for a hypothetical product" },
      { day: "Day of", task: "Lead with outcomes, sprinkle in creativity" },
    ],
  },
  {
    id: "finance",
    label: "Finance / Analyst",
    icon: DollarSign,
    color: "from-teal-500/20 to-cyan-600/10",
    accent: "text-teal-400",
    border: "border-teal-400/20",
    bg: "bg-teal-400/10",
    dot: "bg-teal-400",
    tagline: "Make numbers tell a story that moves decisions.",
    keySkills: [
      "Financial modeling (3-statement, DCF, LBO)",
      "Valuation methodologies (comps, precedent transactions)",
      "Excel/Google Sheets mastery and financial storytelling",
      "Business acumen and industry analysis",
      "Communication of complex financials to senior leadership",
    ],
    commonQuestions: [
      "Walk me through a DCF model.",
      "How do you value a company with no profits?",
      "What's happening in the market right now that concerns you?",
      "Tell me about a time you found an error in financial data and how you handled it.",
      "Walk me through how you'd build a bottoms-up revenue model.",
    ],
    doList: [
      "Know the 3 financial statements and how they connect cold",
      "Show market awareness — reference current macro trends in your answers",
      "Demonstrate comfort with ambiguity: 'with limited data, here's my approach'",
      "Highlight your attention to detail with specific examples of error-catching",
      "Communicate financial insights in business terms, not just numbers",
    ],
    dontList: [
      "Don't say 'just use WACC' without explaining your cost of equity assumptions",
      "Don't be caught off guard by 'what's the current 10-year Treasury rate?'",
      "Don't present financials without a so-what narrative",
      "Don't underestimate qualitative judgment — models are only as good as assumptions",
      "Don't forget to sanity-check your numbers with industry benchmarks",
    ],
    starTip: "For technical interviews: when asked to walk through a DCF, pace yourself: assumptions → unlevered FCF → WACC → terminal value → equity bridge. Narrate your thinking at each step, don't just recite formulas.",
    powerMove: "Mention a recent deal or market event unprompted: 'I noticed X acquisition last week — the multiple was interesting given the macro headwinds. It reminded me of…' This signals you live in finance, not just study it.",
    prepPlan: [
      { day: "Week 1", task: "Build a 3-statement model and DCF from scratch without a template" },
      { day: "Week 2", task: "Practice accounting questions: deferred revenue, working capital, D&A" },
      { day: "Week 3", task: "Read 10-Ks of 3 companies in the target industry" },
      { day: "Day before", task: "Check current 10-year Treasury, S&P performance, recent deals" },
      { day: "Day of", task: "Speak with precision — every number you say should be defensible" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: ShoppingCart,
    color: "from-amber-500/20 to-yellow-600/10",
    accent: "text-amber-400",
    border: "border-amber-400/20",
    bg: "bg-amber-400/10",
    dot: "bg-amber-400",
    tagline: "Revenue is the only scoreboard that matters.",
    keySkills: [
      "Discovery and qualification (MEDDIC, BANT, SPIN)",
      "Pipeline management and forecast accuracy",
      "Negotiation and objection handling",
      "Relationship building and executive presence",
      "CRM hygiene and deal velocity optimization",
    ],
    commonQuestions: [
      "Sell me this pen. (Classic — but still used.)",
      "Walk me through your top deal last year — start to close.",
      "How do you handle a prospect who ghosts you after a demo?",
      "Tell me about a time you lost a deal. What would you do differently?",
      "What's your process from prospecting to close?",
    ],
    doList: [
      "Know your numbers cold: quota, attainment %, ACV, cycle length, win rate",
      "Show process discipline — interviewers want to see repeatable methodology",
      "Demonstrate curiosity through questions: great sellers ask great questions",
      "Reference the company's ICP and how your experience aligns",
      "Show resilience — sales rejections are expected; your bounce-back matters",
    ],
    dontList: [
      "Don't brag without numbers: 'I crushed quota' → say '147% of $1.2M quota in FY23'",
      "Don't use aggressive closing tactics in the interview itself — it reads as pushy",
      "Don't claim you're a team player without examples of cross-functional deals",
      "Don't forget to ask questions — top sellers are curious, not just convincing",
      "Don't skip the 'why this company?' question — interviewers want genuine motivation",
    ],
    starTip: "For deal stories: 'Enterprise at $320K ARR was stalled for 4 months (S). I needed to re-engage or move it to closed-lost (T). I requested an executive briefing and brought our VP to align on their strategic initiative. We created a custom ROI model showing 8-month payback (A). Signed 2 weeks later. It became our largest Q3 deal (R).'",
    powerMove: "Ask your interviewer: 'What separates your top performers from average reps on your team?' — then listen carefully and mirror their answer with evidence from your past. It's the best close in an interview.",
    prepPlan: [
      { day: "Week 1", task: "Write out your top 5 deals with full STAR format and exact numbers" },
      { day: "Week 2", task: "Research the company's product, ICP, and competitive positioning" },
      { day: "Week 3", task: "Practice the 'sell me this' exercise with a friend (2-minute version)" },
      { day: "Day before", task: "Prepare 5 great discovery questions to ask your interviewer" },
      { day: "Day of", task: "Smile, energy matters. Enthusiasm is a sales signal" },
    ],
  },
  {
    id: "ml",
    label: "ML Engineer",
    icon: Database,
    color: "from-indigo-500/20 to-purple-600/10",
    accent: "text-indigo-400",
    border: "border-indigo-400/20",
    bg: "bg-indigo-400/10",
    dot: "bg-indigo-400",
    tagline: "Ship models that work in production, not just notebooks.",
    keySkills: [
      "Model architecture and training (PyTorch, TensorFlow)",
      "MLOps: pipelines, model versioning, monitoring, drift detection",
      "Feature engineering and data preprocessing at scale",
      "Distributed training and inference optimization",
      "Experiment tracking and reproducibility (MLflow, W&B)",
    ],
    commonQuestions: [
      "How do you detect and handle model drift in production?",
      "Walk me through training a recommendation system from scratch.",
      "How do you optimize inference latency for a transformer model?",
      "Tell me about an ML project that failed. What did you change?",
      "How do you balance model accuracy vs. latency trade-offs?",
    ],
    doList: [
      "Talk about production failures — MLEs who've only worked in notebooks are obvious",
      "Show systems thinking: how does your model fit into the data pipeline?",
      "Quantify model improvements in business terms (revenue, engagement, cost savings)",
      "Mention monitoring strategies proactively — it signals prod experience",
      "Show awareness of responsible AI: fairness, bias, interpretability",
    ],
    dontList: [
      "Don't only discuss research papers — show you can ship",
      "Don't ignore data quality as a bottleneck — it's the #1 real-world challenge",
      "Don't overcomplicate when a simpler model would do — show judgment",
      "Don't forget cold-start problems in recommenders/ranking systems",
      "Don't skip the 'what would you monitor post-deployment?' discussion",
    ],
    starTip: "For project stories: lead with the business problem, then model choice rationale, then the engineering challenge, then production impact. 'Our CTR model was outdated — I retrained with real-time features, reduced inference time 60ms → 8ms, and CTR improved 18%.'",
    powerMove: "Say: 'The first thing I do before any model work is understand the label quality and whether the training distribution matches production.' This signals production-grade ML thinking immediately.",
    prepPlan: [
      { day: "Week 1", task: "Review ML fundamentals: bias-variance, regularization, optimization" },
      { day: "Week 2", task: "Build a full ML pipeline: ingest → train → evaluate → serve (FastAPI)" },
      { day: "Week 3", task: "Study MLOps: feature stores, model registries, A/B testing models" },
      { day: "Day before", task: "Review your best project with production metrics ready" },
      { day: "Day of", task: "Emphasize prod experience — it's what separates MLE from DS" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────── */
/* Universal tips                                               */
/* ─────────────────────────────────────────────────────────── */
const UNIVERSAL_TIPS = [
  {
    icon: Brain,
    title: "Answer structure",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
    tips: [
      "Lead with the bottom line — state your main point first, then support it",
      "Use STAR for every behavioral question: Situation, Task, Action, Result",
      "Keep answers 90–120 seconds unless they ask you to elaborate",
      "Pause before answering — 3 seconds of thinking looks confident, not lost",
      "Quantify every outcome: %, $, time saved, users impacted",
    ],
  },
  {
    icon: Mic,
    title: "Voice & delivery",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    tips: [
      "Slow down — nervous speakers rush. Deliberate pacing signals confidence",
      "Eliminate filler words: 'um', 'like', 'you know', 'basically', 'kinda'",
      "Use declarative sentences — avoid upward inflection at the end of statements",
      "Vary your tone — monotone delivery kills engagement regardless of content",
      "Record yourself and listen back. This is uncomfortable and essential",
    ],
  },
  {
    icon: Target,
    title: "The 'why' questions",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    tips: [
      "\"Why this company?\" — Research their product, mission, and recent news before. Never say 'great culture'",
      "\"Why are you leaving?\" — Always forward-looking. Never badmouth anyone",
      "\"Tell me about yourself\" — 90 seconds: past, present, future. Practice this until it's natural",
      "\"What's your biggest weakness?\" — Be real, show growth. Not 'I work too hard'",
      "\"Where do you see yourself in 5 years?\" — Ambitious, but rooted in the role you're applying for",
    ],
  },
  {
    icon: MessageSquare,
    title: "Questions to ask them",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    tips: [
      "\"What does success look like in this role in the first 90 days?\"",
      "\"What's the biggest challenge the team is currently facing?\"",
      "\"What separates your top performers from average ones?\"",
      "\"How does this company handle disagreements between teams?\"",
      "\"What made you personally choose this company over others?\"",
    ],
  },
  {
    icon: Shield,
    title: "Day-of checklist",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    tips: [
      "Test your audio, video, and internet 30 minutes before (virtual interviews)",
      "Keep water nearby — dry mouth is a confidence killer",
      "Have your top 3 STAR stories in front of you on paper",
      "Research your interviewer on LinkedIn — find a genuine connection point",
      "Log in 5 minutes early, mute notifications, close extra browser tabs",
    ],
  },
  {
    icon: TrendingUp,
    title: "After the interview",
    color: "text-teal-400",
    bg: "bg-teal-400/10",
    border: "border-teal-400/20",
    tips: [
      "Send a thank-you email within 2 hours — reference a specific moment from the conversation",
      "Write down every question they asked while it's fresh",
      "Score yourself honestly: what went well, what to improve",
      "Follow up after 5 business days if you hear nothing",
      "Never stop interviewing until an offer is signed and start date confirmed",
    ],
  },
];

/* ─────────────────────────────────────────────────────────── */
/* Accordion tip card                                           */
/* ─────────────────────────────────────────────────────────── */
function TipSection({ icon: Icon, title, color, bg, border, tips }: typeof UNIVERSAL_TIPS[number]) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("rounded-2xl border overflow-hidden transition-all", border, open ? bg : "bg-card/40")}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bg, border, "border")}>
            <Icon className={cn("w-4 h-4", color)} />
          </div>
          <span className="font-bold text-sm">{title}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }} className="overflow-hidden">
            <ul className="px-5 pb-4 space-y-2.5">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 className={cn("w-4 h-4 mt-0.5 shrink-0", color)} />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Main page                                                    */
/* ─────────────────────────────────────────────────────────── */
export function Playbook() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [activeTab, setActiveTab] = useState<"overview" | "dos" | "star" | "prep">("overview");

  const r = selectedRole;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Interview Playbook</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Role-specific prep guides</h1>
        <p className="text-muted-foreground text-base max-w-2xl">
          Curated strategies, power moves, and common pitfalls for every role — built from thousands of real interviews.
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* ── Left: Role selector ── */}
        <div className="xl:w-64 shrink-0">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Select your role</p>
          <div className="space-y-1.5">
            {ROLES.map(role => {
              const Icon = role.icon;
              const active = selectedRole.id === role.id;
              return (
                <button key={role.id} onClick={() => { setSelectedRole(role); setActiveTab("overview"); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 border",
                    active
                      ? cn("border", role.border, role.bg, role.accent, "font-semibold")
                      : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}>
                  <Icon className={cn("w-4 h-4 shrink-0", active ? role.accent : "")} />
                  <span className="text-sm truncate">{role.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary">Practice now</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Use Intervex to simulate a real {selectedRole.label} interview with AI feedback.
            </p>
            <Link href="/session/new">
              <button className={cn(
                "w-full py-2.5 rounded-xl text-xs font-bold transition-all",
                "bg-primary text-primary-foreground hover:opacity-90"
              )}>
                Start Interview <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </Link>
          </div>
        </div>

        {/* ── Right: Role detail ── */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Role hero */}
          <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className={cn("rounded-3xl border p-6 bg-gradient-to-br", r.color, r.border)}>
            <div className="flex items-start gap-4">
              <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0", r.bg, r.border)}>
                <r.icon className={cn("w-7 h-7", r.accent)} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-display font-bold">{r.label}</h2>
                  <div className={cn("w-2 h-2 rounded-full", r.dot)} />
                </div>
                <p className={cn("text-sm font-medium italic", r.accent)}>{r.tagline}</p>
              </div>
            </div>
          </motion.div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-xl w-fit">
            {(["overview", "dos", "star", "prep"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                  activeTab === tab ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                )}>
                {tab === "dos" ? "Do's & Don'ts" : tab === "star" ? "STAR Tips" : tab === "prep" ? "Prep Plan" : "Overview"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={`${r.id}-${activeTab}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

              {/* ── Overview ── */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Key skills interviewers evaluate</p>
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {r.keySkills.map((skill, i) => (
                        <div key={i} className={cn("flex items-start gap-2.5 p-3.5 rounded-xl border", r.border, r.bg)}>
                          <Star className={cn("w-4 h-4 mt-0.5 shrink-0", r.accent)} />
                          <span className="text-sm text-foreground/80">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Questions you will almost certainly face</p>
                    <div className="space-y-2">
                      {r.commonQuestions.map((q, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-card/60 border border-border/50">
                          <span className={cn("text-xs font-bold shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center", r.bg, r.accent)}>{i + 1}</span>
                          <span className="text-sm text-foreground/80 leading-relaxed">{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Power move callout */}
                  <div className={cn("p-5 rounded-2xl border-2", r.border, r.bg)}>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className={cn("w-4 h-4", r.accent)} />
                      <span className={cn("text-xs font-bold uppercase tracking-wider", r.accent)}>Power Move</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{r.powerMove}</p>
                  </div>
                </div>
              )}

              {/* ── Do's & Don'ts ── */}
              {activeTab === "dos" && (
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-bold text-emerald-400">Do these</h3>
                    </div>
                    <div className="space-y-2.5">
                      {r.doList.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-400/5 border border-emerald-400/15">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/80 leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <h3 className="font-bold text-rose-400">Avoid these</h3>
                    </div>
                    <div className="space-y-2.5">
                      {r.dontList.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-400/5 border border-rose-400/15">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/80 leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STAR tips ── */}
              {activeTab === "star" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { letter: "S", word: "Situation", desc: "Set the scene briefly — 1–2 sentences max", color: "from-blue-500/20 to-blue-600/10 border-blue-400/20 text-blue-400" },
                      { letter: "T", word: "Task", desc: "What was specifically your responsibility?", color: "from-violet-500/20 to-violet-600/10 border-violet-400/20 text-violet-400" },
                      { letter: "A", word: "Action", desc: "What YOU did — not 'we'. Be specific.", color: "from-amber-500/20 to-amber-600/10 border-amber-400/20 text-amber-400" },
                      { letter: "R", word: "Result", desc: "Quantify the outcome. Always.", color: "from-emerald-500/20 to-emerald-600/10 border-emerald-400/20 text-emerald-400" },
                    ].map(s => (
                      <div key={s.letter} className={cn("p-4 rounded-2xl border bg-gradient-to-br text-center", s.color)}>
                        <div className={cn("text-3xl font-display font-black mb-1", s.color.split(" ")[3])}>{s.letter}</div>
                        <div className="font-bold text-sm mb-1 text-foreground">{s.word}</div>
                        <div className="text-xs text-muted-foreground leading-snug">{s.desc}</div>
                      </div>
                    ))}
                  </div>

                  <div className={cn("p-6 rounded-2xl border", r.border, r.bg)}>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className={cn("w-5 h-5", r.accent)} />
                      <span className="font-bold">{r.label} STAR example</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{r.starTip}</p>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { title: "Common mistake", desc: "Using 'we' throughout. Interviewers want to know what YOU did. If it was truly a team effort, say 'I specifically owned X'.", icon: AlertTriangle, color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
                      { title: "Timing", desc: "STAR answers should be 90–120 seconds. Under 60 seconds = too thin. Over 3 minutes = losing them. Practice with a timer.", icon: Clock, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
                      { title: "Preparation", desc: "Write 8–10 STAR stories before any interview. Good stories work across multiple question types. Recycle strategically.", icon: Trophy, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
                    ].map((card, i) => (
                      <div key={i} className={cn("p-4 rounded-2xl border", card.color.split(" ")[2], card.color.split(" ")[1])}>
                        <card.icon className={cn("w-5 h-5 mb-2", card.color.split(" ")[0])} />
                        <div className="font-bold text-sm mb-1">{card.title}</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Prep plan ── */}
              {activeTab === "prep" && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    {r.prepPlan.map((step, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-card/60 border border-border/50">
                        <div className={cn("px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0", r.bg, r.accent, "border", r.border)}>
                          {step.day}
                        </div>
                        <div className="flex items-start gap-2.5">
                          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/80 leading-relaxed">{step.task}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Smile className="w-5 h-5 text-primary" />
                      <span className="font-bold text-sm text-primary">The real edge</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Most candidates prepare content but not delivery. Use Intervex to practice speaking your answers aloud — with a real AI interviewer asking follow-ups, timing your responses, and scoring your clarity, confidence, and STAR structure. The gap between thinking an answer and saying it fluently is where interviews are won and lost.
                    </p>
                    <Link href="/session/new">
                      <button className="mt-4 flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
                        <Mic className="w-4 h-4" />
                        Practice a mock {r.label} interview
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Universal tips ── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Universal interview tips</span>
          </div>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {UNIVERSAL_TIPS.map((tip, i) => (
            <TipSection key={i} {...tip} />
          ))}
        </div>
      </div>
    </div>
  );
}
