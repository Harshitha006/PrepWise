import { getTechLogos } from "@/lib/utils";
import Image from "next/image";

interface DisplayTechIconsProps {
    techStack: string[];
}

export default function DisplayTechIcons({ techStack }: DisplayTechIconsProps) {
    const logos = getTechLogos(techStack).slice(0, 4);

    return (
        <div className="flex -space-x-2">
            {logos.map((logo, index) => (
                <div
                    key={index}
                    className="relative h-8 w-8 rounded-full border-2 border-zinc-900 bg-zinc-800 p-1.5 shadow-sm"
                    title={techStack[index]}
                >
                    <img
                        src={logo}
                        alt={techStack[index]}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg";
                        }}
                    />
                </div>
            ))}
            {techStack.length > 4 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 text-[10px] font-bold text-zinc-400">
                    +{techStack.length - 4}
                </div>
            )}
        </div>
    );
}
