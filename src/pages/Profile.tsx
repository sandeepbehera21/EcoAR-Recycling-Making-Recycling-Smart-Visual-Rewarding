import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import {
  Trophy,
  Flame,
  Leaf,
  Medal,
  Star,
  Edit2,
  Moon,
  Bell,
  Shield,
  Recycle,
  Target,
  Zap,
  Crown,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [recentActivity] = useState([
    { action: "Recycled Plastic Bottle", time: "2 hours ago", points: "+10" },
    { action: "Scanned Aluminum Can", time: "5 hours ago", points: "+15" },
    { action: "Daily Mission Complete", time: "1 day ago", points: "+50" },
  ]);
  const [editHostel, setEditHostel] = useState("");

  // ... (existing useEffects)

  // Update editHostel when user loads
  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditHostel(user.hostel || "");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      await axios.put("http://localhost:5000/api/auth/profile", {
        name: editName,
        hostel: editHostel
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
      setIsEditing(false);
      // Ideally reload user here, but for now assuming page reload or context update
      window.location.reload();
    } catch (error) {
      console.error("Failed to update profile", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Mock data for badges since it's not in the User model yet
  const badges = [
    { name: "Eco Starter", icon: Leaf, earned: true },
    { name: "Recycling Pro", icon: Recycle, earned: false },
    { name: "Streak Master", icon: Flame, earned: user?.streak && user.streak > 7 },
    { name: "Top One", icon: Trophy, earned: false },
    { name: "Early Bird", icon: Zap, earned: true },
    { name: "Community Star", icon: Star, earned: false },
    { name: "Expert Sorter", icon: Target, earned: false },
    { name: "Eco Warrior", icon: Crown, earned: false },
  ];

  const level = Math.floor((user?.points || 0) / 100) + 1;
  const xpProgress = (user?.points || 0) % 100;

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-20">
        {/* Banner Section */}
        <div className="h-48 bg-gradient-to-r from-emerald-400 to-cyan-500 relative">
          <div className="absolute top-4 right-4">
            <Button
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {isEditing ? "Cancel Editing" : "Edit Profile"}
            </Button>
          </div>
        </div>

        <div className="container max-w-6xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-8">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl ring-4 ring-background/50">
              <AvatarImage src={(user as any)?.avatar} />
              <AvatarFallback className="text-4xl bg-yellow-100 text-yellow-600">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2 mb-2 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    {user?.name || "User"}
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      Level {level}
                    </Badge>
                  </h1>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <p className="text-sm font-medium text-emerald-600 mt-1">
                    {user?.hostel || "No Hostel Selected"}
                  </p>
                </div>
              </div>

              <div className="max-w-md space-y-1">
                <div className="flex justify-between text-sm font-medium">
                  <span>{user?.points || 0} / {(level * 100)} XP</span>
                  <span className="text-muted-foreground">{100 - xpProgress} XP to next level</span>
                </div>
                <Progress value={xpProgress} className="h-2 bg-emerald-100 [&>div]:bg-emerald-500" />
              </div>
            </div>
          </div>

          {isEditing && (
            <Card className="mb-8 border-emerald-100 shadow-lg animate-fade-in">
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Display Name</Label>
                    <Input
                      id="username"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hostel / Building</Label>
                    <Select value={editHostel} onValueChange={setEditHostel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your hostel/building" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Main Building">Main Building</SelectItem>
                        <SelectItem value="Library">Library</SelectItem>
                        <SelectItem value="Student Center">Student Center</SelectItem>
                        <SelectItem value="North Hostel">North Hostel</SelectItem>
                        <SelectItem value="South Hostel">South Hostel</SelectItem>
                        <SelectItem value="East Hostel">East Hostel</SelectItem>
                        <SelectItem value="West Hostel">West Hostel</SelectItem>
                        <SelectItem value="Staff Quarters">Staff Quarters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={handleSaveProfile}>
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                <div className="p-3 bg-emerald-100 rounded-full text-emerald-600 mb-2">
                  <Star className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold">{user?.points || 0}</h3>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                <div className="p-3 bg-cyan-100 rounded-full text-cyan-600 mb-2">
                  <Recycle className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold">0</h3>
                <p className="text-sm text-muted-foreground">Items Recycled</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                <div className="p-3 bg-orange-100 rounded-full text-orange-600 mb-2">
                  <Flame className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold">{user?.streak || 0} days</h3>
                <p className="text-sm text-muted-foreground">Current Streak</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                <div className="p-3 bg-purple-100 rounded-full text-purple-600 mb-2">
                  <Trophy className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold">#{level}</h3>
                <p className="text-sm text-muted-foreground">Level</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Badges Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Medal className="h-5 w-5 text-emerald-500" />
                Badges & Achievements
              </h2>
              <div className="grid grid-cols-4 gap-4">
                {badges.map((badge, i) => (
                  <Card key={i} className={`aspect-square flex flex-col items-center justify-center p-2 text-center border-none shadow-sm ${badge.earned ? 'bg-white' : 'bg-muted/50 opacity-50'}`}>
                    <div className={`p-2 rounded-full mb-1 ${badge.earned ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'}`}>
                      <badge.icon className="h-5 w-5" />
                    </div>
                    {/* Only show badge name on hover or simplified view */}
                  </Card>
                ))}
                {/* Fill empty slots visually if needed */}
                <div className="col-span-4 text-center text-sm text-muted-foreground mt-2">
                  {badges.filter(b => b.earned).length} of {badges.length} badges earned
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Recent Activity
                </h2>
                <Card className="border-none shadow-md">
                  <CardContent className="p-0">
                    {recentActivity.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Recycle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No activity yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-emerald-100 text-emerald-600">
                                <Recycle className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{activity.action}</p>
                                <p className="text-xs text-muted-foreground">{activity.time}</p>
                              </div>
                            </div>
                            <span className="text-emerald-600 font-bold text-sm">{activity.points}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Settings Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                Settings
              </h2>
              <Card className="border-none shadow-md">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                        <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-muted-foreground">Toggle dark theme</p>
                      </div>
                    </div>
                    <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium">Notifications</p>
                        <p className="text-sm text-muted-foreground">Push notifications</p>
                      </div>
                    </div>
                    <Switch checked={notifications} onCheckedChange={setNotifications} />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
