// ============================================================
// app/(root)/resume/page.tsx
// Resume Analyzer Page — mounts the full ResumeAnalyzer component
// ============================================================

import ResumeAnalyzer from "@/components/ResumeAnalyzer";

export const metadata = {
  title: "Resume Analyzer | PrepWise",
  description:
    "AI-powered resume parsing, ATS scoring, skill gap detection, and personalized improvement plans.",
};

export default function ResumePage() {
  return <ResumeAnalyzer />;
}
