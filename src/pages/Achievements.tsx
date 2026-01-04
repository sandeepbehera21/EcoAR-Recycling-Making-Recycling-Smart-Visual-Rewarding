import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Award,
  Trophy,
  Target,
  Flame,
  Loader2,
  Lock,
  CheckCircle,
  Scan,
  Recycle,
  Shield,
  Crown,
  Gem,
  Diamond,
  Star,
  Zap,
  Package,
  FileText,
  Wine,
  Cpu,
  Coins,
} from "lucide-react";
import { format } from "date-fns";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  requirement_waste_type: string | null;
  points_reward: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  target_waste_type: string | null;
  points_reward: number;
}

interface UserChallengeProgress {
  challenge_id: string;
  progress: number;
  completed: boolean;
}

interface UserStats {
  totalScans: number;
  totalPoints: number;
  streak: number;
  wasteTypeCounts: Record<string, number>;
}

const iconMap: Record<string, typeof Award> = {
  scan: Scan,
  recycle: Recycle,
  shield: Shield,
  trophy: Trophy,
  crown: Crown,
  coins: Coins,
  gem: Gem,
  diamond: Diamond,
  star: Star,
  flame: Flame,
  zap: Zap,
  target: Target,
  award: Award,
  package: Package,
  "file-text": FileText,
  wine: Wine,
  cpu: Cpu,
  cog: Recycle,
};

const Achievements = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [challengeProgress, setChallengeProgress] = useState<UserChallengeProgress[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalScans: 0,
    totalPoints: 0,
    streak: 0,
    wasteTypeCounts: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch all achievements
      const { data: achievementsData } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value", { ascending: true });

      // Fetch user's unlocked achievements
      const { data: userAchievementsData } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user.id);

      // Fetch today's challenges
      const today = new Date().toISOString().split("T")[0];
      const { data: challengesData } = await supabase
        .from("daily_challenges")
        .select("*")
        .eq("active_date", today);

      // Fetch user's challenge progress
      const { data: progressData } = await supabase
        .from("user_challenge_progress")
        .select("challenge_id, progress, completed")
        .eq("user_id", user.id);

      // Fetch user profile for streak and points
      const { data: profileData } = await supabase
        .from("profiles")
        .select("points, streak")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch scan history for stats
      const { data: scanData } = await supabase
        .from("scan_history")
        .select("waste_type")
        .eq("user_id", user.id);

      // Calculate waste type counts
      const wasteTypeCounts: Record<string, number> = {};
      (scanData || []).forEach((scan) => {
        wasteTypeCounts[scan.waste_type] = (wasteTypeCounts[scan.waste_type] || 0) + 1;
      });

      setAchievements(achievementsData || []);
      setUserAchievements(userAchievementsData || []);
      setDailyChallenges(challengesData || []);
      setChallengeProgress(progressData || []);
      setUserStats({
        totalScans: scanData?.length || 0,
        totalPoints: profileData?.points || 0,
        streak: profileData?.streak || 0,
        wasteTypeCounts,
      });
      setLoading(false);
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const getAchievementProgress = (achievement: Achievement): number => {
    switch (achievement.requirement_type) {
      case "total_scans":
        return Math.min(100, (userStats.totalScans / achievement.requirement_value) * 100);
      case "total_points":
        return Math.min(100, (userStats.totalPoints / achievement.requirement_value) * 100);
      case "streak":
        return Math.min(100, (userStats.streak / achievement.requirement_value) * 100);
      case "waste_type_count":
        const count = userStats.wasteTypeCounts[achievement.requirement_waste_type || ""] || 0;
        return Math.min(100, (count / achievement.requirement_value) * 100);
      default:
        return 0;
    }
  };

  const isAchievementUnlocked = (achievementId: string): boolean => {
    return userAchievements.some((ua) => ua.achievement_id === achievementId);
  };

  const getChallengeProgress = (challengeId: string): UserChallengeProgress | undefined => {
    return challengeProgress.find((cp) => cp.challenge_id === challengeId);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary/10">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Achievements & Challenges</h1>
              <p className="text-muted-foreground">
                {unlockedCount}/{totalCount} achievements unlocked
              </p>
            </div>
          </div>

          {/* Streak Banner */}
          <Card className="glass-card mb-8 bg-eco-gradient text-primary-foreground">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-card/20">
                    <Flame className="h-10 w-10" />
                  </div>
                  <div>
                    <p className="text-sm opacity-80">Current Streak</p>
                    <p className="text-4xl font-bold">{userStats.streak} days</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Keep it up!</p>
                  <p className="text-lg">Scan daily to maintain your streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="challenges" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="challenges" className="gap-2">
                <Target className="h-4 w-4" />
                Daily Challenges
              </TabsTrigger>
              <TabsTrigger value="achievements" className="gap-2">
                <Award className="h-4 w-4" />
                Achievements
              </TabsTrigger>
            </TabsList>

            {/* Daily Challenges */}
            <TabsContent value="challenges" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Today's Challenges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyChallenges.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No challenges available today. Check back tomorrow!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dailyChallenges.map((challenge) => {
                        const progress = getChallengeProgress(challenge.id);
                        const progressValue = progress?.progress || 0;
                        const progressPercent = Math.min(100, (progressValue / challenge.target_value) * 100);
                        const isCompleted = progress?.completed || false;

                        return (
                          <div
                            key={challenge.id}
                            className={`p-4 rounded-xl border ${
                              isCompleted ? "bg-primary/10 border-primary/30" : "bg-muted/20 border-border/50"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{challenge.title}</h4>
                                  {isCompleted && (
                                    <Badge className="bg-primary text-primary-foreground">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Complete
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{challenge.description}</p>
                              </div>
                              <Badge variant="secondary" className="bg-accent/10 text-accent">
                                +{challenge.points_reward} pts
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <Progress value={progressPercent} className="h-2" />
                              <p className="text-xs text-muted-foreground text-right">
                                {progressValue}/{challenge.target_value}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="text-center">
                <Button variant="eco" onClick={() => navigate("/scan")}>
                  <Scan className="h-4 w-4" />
                  Start Scanning to Complete Challenges
                </Button>
              </div>
            </TabsContent>

            {/* Achievements */}
            <TabsContent value="achievements" className="space-y-6">
              {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
                <Card key={category} className="glass-card">
                  <CardHeader>
                    <CardTitle className="capitalize flex items-center gap-2">
                      {category === "milestone" && <Trophy className="h-5 w-5 text-primary" />}
                      {category === "points" && <Coins className="h-5 w-5 text-accent" />}
                      {category === "streak" && <Flame className="h-5 w-5 text-destructive" />}
                      {category === "waste_type" && <Recycle className="h-5 w-5 text-chart-2" />}
                      {category.replace("_", " ")} Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {categoryAchievements.map((achievement) => {
                        const unlocked = isAchievementUnlocked(achievement.id);
                        const progress = getAchievementProgress(achievement);
                        const IconComponent = iconMap[achievement.icon] || Award;

                        return (
                          <div
                            key={achievement.id}
                            className={`p-4 rounded-xl border transition-all ${
                              unlocked
                                ? "bg-primary/10 border-primary/30"
                                : "bg-muted/20 border-border/50 opacity-75"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-3 rounded-xl ${
                                  unlocked ? "bg-primary/20" : "bg-muted/30"
                                }`}
                              >
                                {unlocked ? (
                                  <IconComponent className="h-6 w-6 text-primary" />
                                ) : (
                                  <Lock className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold">{achievement.name}</h4>
                                  <Badge variant="secondary" className="text-xs">
                                    +{achievement.points_reward}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {achievement.description}
                                </p>
                                {!unlocked && (
                                  <div className="space-y-1">
                                    <Progress value={progress} className="h-1.5" />
                                    <p className="text-xs text-muted-foreground">
                                      {Math.round(progress)}% complete
                                    </p>
                                  </div>
                                )}
                                {unlocked && (
                                  <Badge className="bg-primary/20 text-primary text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Unlocked
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Achievements;
