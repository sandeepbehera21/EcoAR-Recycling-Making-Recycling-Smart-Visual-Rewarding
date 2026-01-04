import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, CheckCircle, Clock, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const DailyMissions = () => {
    const { user } = useAuth();

    if (!user) return null;

    // Filter valid missions just in case
    const missions = user.dailyMissions || [];

    if (missions.length === 0) {
        return (
            <Card className="glass-card animate-fade-in-up delay-200">
                <CardContent className="p-6 text-center text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No active missions for today.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card animate-fade-in-up delay-200 border-2 border-primary/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Daily Eco Missions
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {missions.map((mission) => (
                    <div key={mission.id} className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span className={mission.completed ? "text-primary line-through transition-all" : "transition-all"}>
                                {mission.title}
                            </span>
                            <div className="flex items-center gap-1 text-xs">
                                {mission.completed ? (
                                    <span className="flex items-center gap-1 text-primary font-bold">
                                        <CheckCircle className="h-3 w-3" />
                                        Completed
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        {mission.progress}/{mission.target}
                                    </span>
                                )}
                                {mission.reward > 0 && !mission.completed && (
                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center gap-1">
                                        <Trophy className="h-3 w-3" />
                                        {mission.reward} XP
                                    </span>
                                )}
                            </div>
                        </div>
                        <Progress
                            value={Math.min((mission.progress / mission.target) * 100, 100)}
                            className={`h-2 transition-all ${mission.completed ? "bg-primary/20" : ""}`}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default DailyMissions;
