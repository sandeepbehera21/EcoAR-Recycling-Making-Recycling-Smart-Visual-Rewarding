import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, TrendingUp, Calendar, Loader2, Building2, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";

interface LeaderboardUser {
  rank: number;
  _id: string;
  name: string;
  email?: string;
  picture?: string;
  points: number;
  weeklyScore?: number;
  streak?: number;
  isHostel?: boolean;
  avgPoints?: number;
  userCount?: number;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-6 w-6 text-chart-4" />;
    case 2:
      return <Medal className="h-6 w-6 text-muted-foreground" />;
    case 3:
      return <Medal className="h-6 w-6 text-chart-3" />;
    default:
      return null;
  }
};

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("alltime");
  const [viewMode, setViewMode] = useState<"users" | "hostels">("users");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        let type = timeframe === "weekly" ? "weekly" : "points";
        if (viewMode === "hostels") {
          type = "hostel";
        }

        const response = await axios.get(`http://localhost:5000/api/leaderboard?type=${type}&limit=20`);
        setLeaderboardData(response.data || []);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [timeframe, viewMode]);

  // Find current user's rank (only for user view)
  const currentUserRank = viewMode === "users" ? leaderboardData.find((u) => u._id === user?._id) : null;
  const userRankIndex = currentUserRank ? currentUserRank.rank : null;

  // Top 3 for podium
  const top3 = leaderboardData.slice(0, 3);

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-chart-4/10 text-chart-4 text-sm font-medium mb-4">
              <Trophy className="h-4 w-4" />
              Compete & Win
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-gradient-eco">Leaderboard</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              See who is leading the eco-revolution. Climb the ranks to earn rewards!
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "users" | "hostels")} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Top Users
                </TabsTrigger>
                <TabsTrigger value="hostels" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Top Hostels
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {viewMode === "users" && (
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-40 glass-card">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">This Week</SelectItem>
                  <SelectItem value="alltime">All Time</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Trophy className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p>No data available yet.</p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {top3.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-in-up delay-100">
                  {/* Second Place */}
                  <div className="pt-8">
                    <Card className="glass-card text-center p-4 border-muted-foreground/30">
                      <div className="relative">
                        <Avatar className="w-16 h-16 mx-auto border-4 border-muted-foreground/30">
                          {top3[1].isHostel ? (
                            <AvatarFallback><Building2 className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
                          ) : (
                            <>
                              <AvatarImage src={top3[1]?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3[1]?.email}`} />
                              <AvatarFallback>2</AvatarFallback>
                            </>
                          )}
                        </Avatar>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-muted-foreground text-card rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                      </div>
                      <h4 className="font-semibold mt-4 text-sm truncate">{top3[1]?.name || "User"}</h4>
                      <p className="text-lg font-bold text-muted-foreground">
                        {(top3[1]?.points || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </Card>
                  </div>

                  {/* First Place */}
                  <div>
                    <Card className="glass-card text-center p-4 border-chart-4/50 bg-gradient-to-b from-chart-4/10 to-transparent relative overflow-hidden">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2">
                        <Crown className="h-8 w-8 text-chart-4" />
                      </div>
                      <div className="relative mt-6">
                        <Avatar className="w-20 h-20 mx-auto border-4 border-chart-4/50">
                          {top3[0].isHostel ? (
                            <AvatarFallback className="bg-chart-4/20"><Building2 className="h-10 w-10 text-chart-4" /></AvatarFallback>
                          ) : (
                            <>
                              <AvatarImage src={top3[0]?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3[0]?.email}`} />
                              <AvatarFallback>1</AvatarFallback>
                            </>
                          )}
                        </Avatar>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-chart-4 text-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                      </div>
                      <h4 className="font-semibold mt-4 truncate">{top3[0]?.name || "User"}</h4>
                      <p className="text-xl font-bold text-chart-4">
                        {(top3[0]?.points || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </Card>
                  </div>

                  {/* Third Place */}
                  <div className="pt-12">
                    <Card className="glass-card text-center p-4 border-chart-3/30">
                      <div className="relative">
                        <Avatar className="w-14 h-14 mx-auto border-4 border-chart-3/30">
                          {top3[2].isHostel ? (
                            <AvatarFallback><Building2 className="h-6 w-6 text-chart-3" /></AvatarFallback>
                          ) : (
                            <>
                              <AvatarImage src={top3[2]?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3[2]?.email}`} />
                              <AvatarFallback>3</AvatarFallback>
                            </>
                          )}
                        </Avatar>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-chart-3 text-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                      </div>
                      <h4 className="font-semibold mt-4 text-sm truncate">{top3[2]?.name || "User"}</h4>
                      <p className="text-lg font-bold text-chart-3">
                        {(top3[2]?.points || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </Card>
                  </div>
                </div>
              )}

              {/* Current User Progress (Only for Users view) */}
              {viewMode === "users" && user && (
                <Card className="mb-8 bg-eco-gradient border-none animate-fade-in-up delay-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <Avatar className="w-16 h-16 border-4 border-primary-foreground/30">
                        <AvatarImage src={user.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                        <AvatarFallback>You</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-center md:text-left">
                        <p className="text-primary-foreground/70 text-sm">Your Current Rank</p>
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                          <span className="text-3xl font-bold text-primary-foreground">
                            #{userRankIndex || "—"}
                          </span>
                          {userRankIndex && userRankIndex <= 10 && (
                            <>
                              <TrendingUp className="h-5 w-5 text-primary-foreground/70" />
                              <span className="text-primary-foreground/70 text-sm">Top 10!</span>
                            </>
                          )}
                        </div>
                        <p className="text-primary-foreground font-medium">
                          {(user.points || 0).toLocaleString()} points • {user.streak || 0} day streak
                        </p>
                      </div>
                      <div className="w-full md:w-48">
                        <p className="text-primary-foreground/70 text-xs mb-2">Points to next rank</p>
                        <Progress
                          value={userRankIndex && userRankIndex > 1 ? 75 : 100}
                          className="h-3 bg-primary-foreground/20"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Full Leaderboard */}
              <Card className="glass-card overflow-hidden animate-fade-in-up delay-400">
                <div className="divide-y divide-border/50">
                  {leaderboardData.map((leaderUser) => (
                    <div
                      key={leaderUser._id || leaderUser.name}
                      className={`flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors ${leaderUser.rank <= 3 ? "bg-muted/20" : ""
                        } ${leaderUser._id === user?._id && viewMode === "users" ? "bg-primary/10" : ""}`}
                    >
                      {/* Rank */}
                      <div className="w-12 flex items-center justify-center">
                        {getRankIcon(leaderUser.rank) || (
                          <span className="text-lg font-bold text-muted-foreground">
                            {leaderUser.rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar & Name */}
                      <Avatar className="w-10 h-10">
                        {leaderUser.isHostel ? (
                          <AvatarFallback className="bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></AvatarFallback>
                        ) : (
                          <>
                            <AvatarImage src={leaderUser.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderUser.email}`} />
                            <AvatarFallback>{(leaderUser.name || "U")[0]}</AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {leaderUser.name || "Anonymous"}
                          {leaderUser._id === user?._id && viewMode === "users" && (
                            <span className="text-primary ml-2">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {leaderUser.isHostel ? (
                            <span>Avg: {leaderUser.avgPoints} pts/user • {leaderUser.userCount} users</span>
                          ) : (
                            <span>🔥 {leaderUser.streak || 0} day streak</span>
                          )}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {(leaderUser.points || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Leaderboard;
