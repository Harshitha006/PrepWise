import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTechLogos(techStack: string[]) {
  const normalizedTech = techStack.map((tech) => {
    const t = tech.toLowerCase().trim();
    if (t === "react") return "react";
    if (t === "next.js" || t === "nextjs") return "nextjs";
    if (t === "typescript") return "typescript";
    if (t === "javascript") return "javascript";
    if (t === "tailwind") return "tailwindcss";
    if (t === "nodejs" || t === "node") return "nodejs";
    if (t === "python") return "python";
    if (t === "java") return "java";
    if (t === "cpp" || t === "c++") return "cplusplus";
    if (t === "csharp" || t === "c#") return "csharp";
    if (t === "go") return "go";
    if (t === "rust") return "rust";
    if (t === "docker") return "docker";
    if (t === "aws") return "amazonwebservices";
    if (t === "firebase") return "firebase";
    if (t === "mongodb") return "mongodb";
    if (t === "postgresql" || t === "postgres") return "postgresql";
    return t;
  });

  return normalizedTech.map(
    (tech) =>
      `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${tech}/${tech}-original.svg`
  );
}

export function getRandomInterviewCover() {
  const covers = [
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522071823990-9482dca47710?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop",
  ];
  return covers[Math.floor(Math.random() * covers.length)];
}
