import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DisplayTechIcons from "./DisplayTechIcons";
import { CalendarDays, Star } from "lucide-react";
import dayjs from "dayjs";
import Link from "next/link";

interface InterviewCardProps {
    interview: any;
    showFeedback?: boolean;
}

export default function InterviewCard({ interview, showFeedback }: InterviewCardProps) {
    return (
        <Card className="group overflow-hidden border-white/10 bg-zinc-900/50 transition-all hover:bg-zinc-900/80 hover:shadow-2xl hover:shadow-purple-500/10">
            <div className="relative h-32 w-full overflow-hidden">
                <img
                    src={interview.coverImage || "/placeholder.jpg"}
                    alt={interview.role}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                <Badge className="absolute top-2 right-2 border-none bg-purple-600/80 backdrop-blur-md">
                    {interview.type}
                </Badge>
            </div>
            <CardHeader className="p-4 pb-0">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-zinc-100">{interview.role}</h3>
                    <span className="text-xs text-zinc-400 capitalize">{interview.level}</span>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4">
                    <CalendarDays className="h-3 w-3" />
                    {dayjs(interview.createdAt).format("MMM DD, YYYY")}
                </div>
                <div className="flex items-center justify-between">
                    <DisplayTechIcons techStack={interview.techStack} />
                    {interview.score && (
                        <div className="flex items-center gap-1 text-yellow-500 font-bold">
                            <Star className="h-4 w-4 fill-yellow-500" />
                            {interview.score}
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Link href={showFeedback ? `/interview/${interview.id}/feedback` : `/interview/${interview.id}`} className="w-full">
                    <Button variant="secondary" className="w-full bg-white/5 hover:bg-white/10 border-white/10 text-zinc-200">
                        {showFeedback ? "View Feedback" : "Start Interview"}
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
