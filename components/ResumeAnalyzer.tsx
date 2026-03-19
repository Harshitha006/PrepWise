"use client";
// ============================================================
// components/ResumeAnalyzer.tsx
// Full unified Resume Analyzer — replaces basic ResumeUpload.tsx
// Covers: Parse → ATS Score → JD Match → Skill Gap →
//         Skill Assessment → Recruiter Sim → Improvement Plan
// ============================================================

import { useState, useCallback, useRef } from "react";
import {
  ParsedResume,
  ATSScore,
  SkillGap,
  AssessmentQuestion,
  AssessmentResult,
  RecruiterSimulation,
  ImprovementPlan,
} from "@/types/resume";

// ── Helper: colour by score ──────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}
function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}
function scoreRingColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

// ── Radial progress ring ─────────────────────────────────────
function ScoreRing({
  score,
  size = 120,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1e293b" strokeWidth="8" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={scoreRingColor(score)}
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fill="white"
          fontSize={size / 4}
          fontWeight="bold"
        >
          {score}
        </text>
      </svg>
      {label && <span className="text-xs text-slate-400">{label}</span>}
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────
function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className={scoreColor(value)}>{value}%</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${scoreBg(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ── Step indicator ───────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Parse" },
  { id: 3, label: "ATS Score" },
  { id: 4, label: "Skill Gap" },
  { id: 5, label: "Assessment" },
  { id: 6, label: "Recruiter" },
  { id: 7, label: "Plan" },
];

function StepBar({ current, completed }: { current: number; completed: number[] }) {
  return (
    <div className="flex items-center justify-between w-full mb-8">
      {STEPS.map((step, i) => {
        const done = completed.includes(step.id);
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  done
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : active
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "bg-slate-800 border-slate-600 text-slate-500"
                }`}
              >
                {done ? "✓" : step.id}
              </div>
              <span className="text-[10px] mt-1 text-slate-500 hidden sm:block">
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 ${
                  done ? "bg-emerald-500" : "bg-slate-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function ResumeAnalyzer() {
  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [atsScore, setAtsScore] = useState<ATSScore | null>(null);
  const [skillGap, setSkillGap] = useState<SkillGap | null>(null);
  const [assessmentQuestions, setAssessmentQuestions] = useState<
    Record<string, AssessmentQuestion[]>
  >({});
  const [assessmentAnswers, setAssessmentAnswers] = useState<
    Record<string, number[]>
  >({});
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [currentAssessSkill, setCurrentAssessSkill] = useState<string | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [recruiterSim, setRecruiterSim] = useState<RecruiterSimulation | null>(null);
  const [improvementPlan, setImprovementPlan] = useState<ImprovementPlan | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const markDone = (s: number) =>
    setCompleted((p) => (p.includes(s) ? p : [...p, s]));

  // ── API helpers ──────────────────────────────────────────────
  async function parseResume() {
    if (!file) return;
    setLoading(true);
    setLoadingMsg("Extracting resume content with AI…");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      setParsed(data.parsed);
      markDone(2);
      setStep(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setLoading(false);
    }
  }

  async function runATSScore() {
    if (!parsed) return;
    setLoading(true);
    setLoadingMsg("Running ATS scoring engine…");
    setError(null);
    try {
      const res = await fetch("/api/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: parsed, jobDescription, targetRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAtsScore(data.atsScore);
      markDone(3);

      // Auto-run skill gap next
      setLoadingMsg("Detecting skill gaps…");
      const res2 = await fetch("/api/skill-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: parsed, jobDescription, targetRole }),
      });
      const data2 = await res2.json();
      if (!res2.ok) throw new Error(data2.error);
      setSkillGap(data2.skillGap);
      markDone(4);
      setStep(5);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Scoring failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadAssessment(skill: string) {
    if (assessmentQuestions[skill]) {
      setCurrentAssessSkill(skill);
      setCurrentQIndex(0);
      return;
    }
    setLoading(true);
    setLoadingMsg(`Generating ${skill} assessment…`);
    try {
      const res = await fetch("/api/skill-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", skill, count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAssessmentQuestions((p) => ({ ...p, [skill]: data.questions }));
      setAssessmentAnswers((p) => ({ ...p, [skill]: [] }));
      setCurrentAssessSkill(skill);
      setCurrentQIndex(0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load assessment");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(skill: string, answerIndex: number) {
    const questions = assessmentQuestions[skill] || [];
    const newAnswers = [...(assessmentAnswers[skill] || []), answerIndex];
    setAssessmentAnswers((p) => ({ ...p, [skill]: newAnswers }));

    if (newAnswers.length >= questions.length) {
      // Evaluate
      setLoading(true);
      setLoadingMsg("Evaluating your answers…");
      try {
        const res = await fetch("/api/skill-assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "evaluate",
            skill,
            questions,
            answers: newAnswers,
          }),
        });
        const data = await res.json();
        setAssessmentResults((p) => {
          const without = p.filter((r) => r.skill !== skill);
          return [...without, data.result];
        });
        setCurrentAssessSkill(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Evaluation failed");
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentQIndex(newAnswers.length);
    }
  }

  async function runRecruiterSim() {
    if (!parsed || !atsScore) return;
    setLoading(true);
    setLoadingMsg("Simulating recruiter review…");
    setError(null);
    try {
      const res = await fetch("/api/recruiter-sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: parsed,
          atsScore,
          jobDescription,
          targetRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecruiterSim(data.simulation);
      markDone(6);
      setStep(7);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Recruiter sim failed");
    } finally {
      setLoading(false);
    }
  }

  async function runImprovementPlan() {
    if (!parsed || !atsScore || !skillGap || !recruiterSim) return;
    setLoading(true);
    setLoadingMsg("Building your personalized plan…");
    setError(null);
    try {
      const res = await fetch("/api/improvement-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: parsed,
          atsScore,
          skillGap,
          assessmentResults,
          recruiterSim,
          targetRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImprovementPlan(data.improvementPlan);
      markDone(7);
      setActiveTab("overview");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Plan generation failed");
    } finally {
      setLoading(false);
    }
  }

  // ── Drop handler ─────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") setFile(f);
    else setError("Please upload a PDF file.");
  }, []);

  // ── Readiness score = weighted average of all scores ─────────
  const readinessScore = (() => {
    if (!atsScore && !skillGap && !recruiterSim) return 0;
    const scores = [
      atsScore?.overall ?? 0,
      skillGap?.overallMatchScore ?? 0,
      recruiterSim?.shortlistProbability ?? 0,
    ].filter((_, i) => [!!atsScore, !!skillGap, !!recruiterSim][i]);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
  })();

  // ── Skills to assess ─────────────────────────────────────────
  const skillsToAssess = [
    ...(skillGap?.missingSkills.slice(0, 3) ?? []),
    ...(parsed?.skills.technical.slice(0, 3) ?? []),
  ].slice(0, 5);

  // ────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Resume & Skill Analyzer
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            AI-powered resume parsing, ATS scoring, skill validation & personalized coaching
          </p>
        </div>

        {/* Step Bar */}
        <StepBar current={step} completed={completed} />

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <span>⚠</span> {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-white">✕</button>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="mb-4 p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg text-violet-300 text-sm flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            {loadingMsg}
          </div>
        )}

        {/* ── STEP 1: Upload ─────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 hover:border-violet-500 rounded-2xl p-12 text-center cursor-pointer transition-all hover:bg-violet-500/5"
            >
              <div className="text-5xl mb-4">📄</div>
              <p className="text-slate-300 font-medium">
                {file ? file.name : "Drop your resume PDF here"}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                {file ? `${(file.size / 1024).toFixed(0)} KB` : "or click to browse — PDF only, max 5MB"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setFile(f);
                }}
              />
            </div>

            {/* Job Description */}
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Target Role</label>
                <input
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Frontend Engineer, Data Scientist"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">
                  Job Description{" "}
                  <span className="text-slate-600">(optional but recommended)</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                  placeholder="Paste the job description here for accurate ATS matching and skill gap analysis…"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!file) { setError("Please upload a resume PDF first."); return; }
                markDone(1);
                setStep(2);
                parseResume();
              }}
              disabled={!file || loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-all"
            >
              Analyze Resume →
            </button>
          </div>
        )}

        {/* ── STEP 2: Parsing ────────────────────────────────── */}
        {step === 2 && loading && (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-slate-300 text-lg">Parsing your resume with AI…</p>
            <p className="text-slate-500 text-sm mt-2">Extracting skills, experience, education & projects</p>
          </div>
        )}

        {/* ── STEP 3: ATS Score Setup ─────────────────────────── */}
        {step === 3 && parsed && !loading && (
          <div className="space-y-6">
            {/* Parsed Preview */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="font-bold text-lg mb-4 text-slate-200">✅ Resume Parsed Successfully</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Skills Found", value: parsed.skills.technical.length + parsed.skills.tools.length },
                  { label: "Experience", value: `${parsed.experience.length} roles` },
                  { label: "Projects", value: parsed.projects.length },
                  { label: "Education", value: parsed.education.length },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-900 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-violet-400">{s.value}</div>
                    <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
              {parsed.skills.technical.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-2">Detected Skills:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...parsed.skills.technical, ...parsed.skills.tools].slice(0, 20).map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={runATSScore}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-all"
            >
              Run ATS Score & Skill Gap Analysis →
            </button>
          </div>
        )}

        {/* ── STEP 5: Skill Assessment ────────────────────────── */}
        {step === 5 && skillGap && !loading && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="font-bold text-lg mb-2">Skill Gap Summary</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-emerald-400">{skillGap.presentSkills.length}</div>
                  <div className="text-xs text-slate-400">Skills Matched</div>
                </div>
                <div className="bg-red-500/10 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-red-400">{skillGap.missingSkills.length}</div>
                  <div className="text-xs text-slate-400">Skills Missing</div>
                </div>
                <div className="bg-yellow-500/10 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-yellow-400">{skillGap.overallMatchScore}%</div>
                  <div className="text-xs text-slate-400">JD Match</div>
                </div>
              </div>
              {skillGap.missingSkills.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Missing Skills:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skillGap.missingSkills.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Assessment Hub */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="font-bold text-lg mb-1">Skill Assessment</h2>
              <p className="text-slate-500 text-sm mb-4">
                Validate your claimed skills with a quick 5-question adaptive test
              </p>

              {/* Skill list to test */}
              {!currentAssessSkill && (
                <div className="space-y-2">
                  {skillsToAssess.map((skill) => {
                    const result = assessmentResults.find((r) => r.skill === skill);
                    return (
                      <div key={skill} className="flex items-center justify-between bg-slate-900 rounded-xl p-3">
                        <div>
                          <span className="font-medium text-sm">{skill}</span>
                          {result && (
                            <span className={`ml-2 text-xs ${result.verified ? "text-emerald-400" : "text-red-400"}`}>
                              {result.verified ? `✓ Verified (${result.score}%)` : `✗ Needs Work (${result.score}%)`}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => loadAssessment(skill)}
                          disabled={loading}
                          className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40"
                        >
                          {result ? "Retake" : "Start Test"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Active quiz */}
              {currentAssessSkill && assessmentQuestions[currentAssessSkill] && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-violet-300 font-medium">
                      {currentAssessSkill} — Q{currentQIndex + 1}/{assessmentQuestions[currentAssessSkill].length}
                    </span>
                    <button onClick={() => setCurrentAssessSkill(null)} className="text-xs text-slate-500 hover:text-white">
                      Cancel
                    </button>
                  </div>
                  <div className="w-full h-1 bg-slate-700 rounded mb-4">
                    <div
                      className="h-full bg-violet-500 rounded transition-all"
                      style={{
                        width: `${((currentQIndex) / assessmentQuestions[currentAssessSkill].length) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-slate-200 mb-4 text-sm leading-relaxed">
                    {assessmentQuestions[currentAssessSkill][currentQIndex]?.question}
                  </p>
                  <div className="space-y-2">
                    {assessmentQuestions[currentAssessSkill][currentQIndex]?.options.map(
                      (opt, i) => (
                        <button
                          key={i}
                          onClick={() => submitAnswer(currentAssessSkill, i)}
                          className="w-full text-left px-4 py-3 bg-slate-900 hover:bg-violet-600/20 border border-slate-700 hover:border-violet-500 rounded-xl text-sm transition-all"
                        >
                          <span className="text-slate-500 mr-2">{String.fromCharCode(65 + i)}.</span>
                          {opt}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { markDone(5); runRecruiterSim(); }}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-all"
              >
                Simulate Recruiter Review →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 7: Full Dashboard ──────────────────────────── */}
        {step === 7 && recruiterSim && (
          <div className="space-y-6">
            {/* Readiness score bar */}
            <div className="bg-gradient-to-r from-violet-900/40 to-cyan-900/40 rounded-2xl p-6 border border-violet-500/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Overall Readiness</h2>
                  <p className="text-slate-400 text-sm">For {targetRole}</p>
                </div>
                <ScoreRing score={readinessScore} size={100} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {atsScore && <div className="text-center">
                  <div className={`text-2xl font-bold ${scoreColor(atsScore.overall)}`}>{atsScore.overall}</div>
                  <div className="text-xs text-slate-500">ATS Score</div>
                </div>}
                {skillGap && <div className="text-center">
                  <div className={`text-2xl font-bold ${scoreColor(skillGap.overallMatchScore)}`}>{skillGap.overallMatchScore}</div>
                  <div className="text-xs text-slate-500">JD Match</div>
                </div>}
                <div className="text-center">
                  <div className={`text-2xl font-bold ${scoreColor(recruiterSim.shortlistProbability)}`}>
                    {recruiterSim.shortlistProbability}%
                  </div>
                  <div className="text-xs text-slate-500">Shortlist Chance</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
              {["overview", "ats", "skills", "recruiter", "plan"].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                    activeTab === t
                      ? "bg-violet-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t === "ats" ? "ATS" : t === "plan" ? "Action Plan" : t}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && atsScore && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700 space-y-3">
                  <h3 className="font-semibold text-slate-200">ATS Breakdown</h3>
                  {Object.entries(atsScore.breakdown).map(([k, v]) => (
                    <Bar
                      key={k}
                      label={k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
                      value={v}
                    />
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                    <h3 className="font-semibold text-slate-200 mb-3">Recruiter Decision</h3>
                    <div className={`text-2xl font-bold mb-2 ${
                      recruiterSim.decision.includes("Yes") ? "text-emerald-400" :
                      recruiterSim.decision === "Maybe" ? "text-yellow-400" : "text-red-400"
                    }`}>
                      {recruiterSim.decision}
                    </div>
                    <p className="text-slate-400 text-sm">{recruiterSim.reasoning}</p>
                  </div>
                  {atsScore.criticalIssues.length > 0 && (
                    <div className="bg-red-500/10 rounded-2xl p-5 border border-red-500/20">
                      <h3 className="font-semibold text-red-400 mb-2">⚠ Critical Issues</h3>
                      <ul className="space-y-1">
                        {atsScore.criticalIssues.map((i, idx) => (
                          <li key={idx} className="text-sm text-red-300">• {i}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ATS Tab */}
            {activeTab === "ats" && atsScore && (
              <div className="space-y-4">
                <div className="flex gap-4 flex-wrap">
                  <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700 flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <ScoreRing score={atsScore.overall} size={80} />
                      <div>
                        <div className="text-lg font-bold">
                          {atsScore.passesATS ? "✅ Passes ATS" : "❌ Fails ATS"}
                        </div>
                        <div className="text-sm text-slate-400">{atsScore.jdMatchPercentage}% JD match</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {atsScore.suggestions.map((s, i) => (
                        <div key={i} className="flex gap-2 text-sm text-slate-300">
                          <span className="text-cyan-400 mt-0.5">→</span> {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700 space-y-3">
                  <h3 className="font-semibold">Score Breakdown</h3>
                  {Object.entries(atsScore.breakdown).map(([k, v]) => (
                    <Bar key={k} label={k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())} value={v} />
                  ))}
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === "skills" && skillGap && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                  <h3 className="font-semibold text-emerald-400 mb-3">✓ Present Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skillGap.presentSkills.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-xs">{s}</span>
                    ))}
                  </div>
                  {assessmentResults.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-xs text-slate-500">Assessment Results</h4>
                      {assessmentResults.map((r) => (
                        <div key={r.skill} className="flex items-center justify-between text-sm">
                          <span>{r.skill}</span>
                          <span className={r.verified ? "text-emerald-400" : "text-red-400"}>
                            {r.score}% — {r.level}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                  <h3 className="font-semibold text-red-400 mb-3">✗ Missing Skills</h3>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {skillGap.missingSkills.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs">{s}</span>
                    ))}
                  </div>
                  <h3 className="font-semibold text-yellow-400 mb-3">⚡ Priority to Learn</h3>
                  <ol className="space-y-1">
                    {skillGap.prioritySkillsToLearn.map((s, i) => (
                      <li key={s} className="text-sm text-slate-300">
                        <span className="text-yellow-500 mr-2">{i + 1}.</span>{s}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* Recruiter Tab */}
            {activeTab === "recruiter" && (
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">Recruiter Simulation</h3>
                      <p className="text-slate-400 text-sm">AI mimicking a real recruiter's 6-second scan</p>
                    </div>
                    <ScoreRing score={recruiterSim.shortlistProbability} size={80} label="Shortlist %" />
                  </div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                    recruiterSim.decision.includes("Yes") ? "bg-emerald-500/20 text-emerald-300" :
                    recruiterSim.decision === "Maybe" ? "bg-yellow-500/20 text-yellow-300" :
                    "bg-red-500/20 text-red-300"
                  }`}>
                    Decision: {recruiterSim.decision}
                  </div>
                  <p className="text-slate-300 text-sm mb-4">{recruiterSim.reasoning}</p>
                  <div className="italic text-slate-500 text-sm border-l-2 border-slate-600 pl-3">
                    "{recruiterSim.recruiterNotes}"
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-emerald-500/10 rounded-2xl p-5 border border-emerald-500/20">
                    <h3 className="font-semibold text-emerald-400 mb-3">Strengths</h3>
                    <ul className="space-y-2">
                      {recruiterSim.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-emerald-400">✓</span>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-500/10 rounded-2xl p-5 border border-red-500/20">
                    <h3 className="font-semibold text-red-400 mb-3">Red Flags</h3>
                    <ul className="space-y-2">
                      {recruiterSim.redFlags.map((s, i) => (
                        <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-red-400">✗</span>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                  <h3 className="font-semibold text-cyan-400 mb-3">To Get Shortlisted</h3>
                  <ul className="space-y-2">
                    {recruiterSim.improveToGetShortlisted.map((s, i) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-2">
                        <span className="text-cyan-400 font-bold">{i + 1}.</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Plan Tab */}
            {activeTab === "plan" && (
              <div>
                {!improvementPlan ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400 mb-4">Generate your personalized 4-week improvement plan</p>
                    <button
                      onClick={runImprovementPlan}
                      disabled={loading}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 font-semibold text-white hover:opacity-90 disabled:opacity-40"
                    >
                      Generate My Plan →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Resume fixes */}
                    <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                      <h3 className="font-semibold mb-3">📝 Resume Edits</h3>
                      <div className="space-y-3">
                        {improvementPlan.resumeEdits.map((edit, i) => (
                          <div key={i} className={`p-3 rounded-xl border ${
                            edit.priority === "high"
                              ? "bg-red-500/10 border-red-500/20"
                              : edit.priority === "medium"
                              ? "bg-yellow-500/10 border-yellow-500/20"
                              : "bg-slate-900 border-slate-700"
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                {edit.section}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                edit.priority === "high"
                                  ? "bg-red-500/20 text-red-400"
                                  : edit.priority === "medium"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-slate-700 text-slate-400"
                              }`}>
                                {edit.priority}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400 mb-1">{edit.issue}</p>
                            <p className="text-sm text-slate-200">→ {edit.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Skills to Learn */}
                    <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                      <h3 className="font-semibold mb-3">🎯 Skills to Learn</h3>
                      <div className="space-y-4">
                        {improvementPlan.skillsToLearn.map((skill, i) => (
                          <div key={i} className="border border-slate-700 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-violet-300">{skill.skill}</span>
                              <span className="text-xs text-slate-500">{skill.estimatedTime}</span>
                            </div>
                            <p className="text-sm text-slate-400 mb-3">{skill.reason}</p>
                            <div className="space-y-1.5">
                              {skill.resources.map((r, j) => (
                                <a
                                  key={j}
                                  href={r.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-2 bg-slate-900 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs">
                                      {r.type === "video" ? "▶" : r.type === "article" ? "📄" : r.type === "course" ? "🎓" : r.type === "practice" ? "💻" : "🎧"}
                                    </span>
                                    <span className="text-xs text-slate-300">{r.title}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">{r.platform}</span>
                                    {r.free && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Free</span>}
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weekly plan */}
                    <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                      <h3 className="font-semibold mb-3">📅 4-Week Plan</h3>
                      <div className="space-y-3">
                        {improvementPlan.weeklyPlan.map((week) => (
                          <div key={week.week} className="border border-slate-700 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center text-xs font-bold">
                                {week.week}
                              </span>
                              <span className="font-medium text-sm">{week.focus}</span>
                            </div>
                            <ul className="space-y-1 ml-8">
                              {week.tasks.map((t, i) => (
                                <li key={i} className="text-xs text-slate-400 flex gap-2">
                                  <span className="text-violet-500">•</span>{t}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Start Over */}
            <button
              onClick={() => {
                setStep(1); setCompleted([]); setFile(null);
                setParsed(null); setAtsScore(null); setSkillGap(null);
                setAssessmentResults([]); setRecruiterSim(null);
                setImprovementPlan(null); setJobDescription(""); setError(null);
              }}
              className="w-full py-2.5 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 text-sm transition-all"
            >
              ↺ Analyze Another Resume
            </button>
          </div>
        )}
      </div>
    </div>
  );
}