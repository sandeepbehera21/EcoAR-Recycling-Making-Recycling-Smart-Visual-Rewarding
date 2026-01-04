import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Shield, Users, Recycle, TrendingUp, Loader2, AlertTriangle,
  Trash2, CheckCircle, Search, RefreshCw, Award, MapPin,
  BarChart3, Activity, Calendar, Eye, Ban, Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  picture?: string;
  points: number;
  streak: number;
  weeklyScore: number;
  role: string;
  createdAt: string;
}

interface Report {
  _id: string;
  type: string;
  message: string;
  status: string;
  userId: { name: string; email: string } | null;
  createdAt: string;
}

interface DashboardStats {
  totalUsers: number;
  totalPoints: number;
  avgPoints: number;
  pendingReports: number;
  activeToday: number;
  totalScans: number;
}

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (!loading && user && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, loading, isAdmin, navigate, toast]);

  const fetchData = async () => {
    if (!isAdmin) return;
    setRefreshing(true);

    try {
      const usersResponse = await axios.get("http://localhost:5000/api/leaderboard?limit=100");
      setUsers(usersResponse.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoadingUsers(false);

    try {
      const token = localStorage.getItem("token");
      const reportsResponse = await axios.get("http://localhost:5000/api/reports/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(reportsResponse.data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
    setLoadingReports(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const updateReportStatus = async (reportId: string, status: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/reports/admin/${reportId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, status } : r))
      );

      toast({
        title: "Report Updated",
        description: `Status changed to ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Calculate stats
  const stats: DashboardStats = {
    totalUsers: users.length,
    totalPoints: users.reduce((sum, u) => sum + (u.points || 0), 0),
    avgPoints: users.length > 0 ? Math.round(users.reduce((sum, u) => sum + (u.points || 0), 0) / users.length) : 0,
    pendingReports: reports.filter((r) => r.status === "pending").length,
    activeToday: users.filter(u => u.streak > 0).length,
    totalScans: users.reduce((sum, u) => sum + (u.points || 0) / 10, 0), // Rough estimate
  };

  // Filter users by search
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/20">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Welcome back, <span className="font-medium text-foreground">{user?.name || 'Admin'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                <Activity className="h-3 w-3 mr-1.5" />
                Live
              </Badge>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Users</p>
                    <p className="text-2xl font-bold text-blue-500">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Points</p>
                    <p className="text-2xl font-bold text-green-500">{stats.totalPoints.toLocaleString()}</p>
                  </div>
                  <Recycle className="h-8 w-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Points</p>
                    <p className="text-2xl font-bold text-purple-500">{stats.avgPoints}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Users</p>
                    <p className="text-2xl font-bold text-orange-500">{stats.activeToday}</p>
                  </div>
                  <Activity className="h-8 w-8 text-orange-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending</p>
                    <p className="text-2xl font-bold text-amber-500">{stats.pendingReports}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-amber-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Est. Scans</p>
                    <p className="text-2xl font-bold text-cyan-500">{Math.floor(stats.totalScans)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-cyan-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="bg-card/50 backdrop-blur border p-1">
              <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="h-4 w-4" />
                Users ({users.length})
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <AlertTriangle className="h-4 w-4" />
                Reports ({stats.pendingReports} pending)
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card className="border-0 shadow-xl bg-card/50 backdrop-blur">
                <CardHeader className="border-b">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">User Management</CardTitle>
                      <CardDescription>View and manage all registered users</CardDescription>
                    </div>
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingUsers ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      {searchQuery ? "No users match your search." : "No users registered yet."}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="w-16">Rank</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-center">Points</TableHead>
                            <TableHead className="text-center">Streak</TableHead>
                            <TableHead className="text-center">Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((profile, index) => (
                            <TableRow key={profile._id} className="hover:bg-muted/20 transition-colors">
                              <TableCell>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                  index === 1 ? 'bg-gray-400/20 text-gray-400' :
                                    index === 2 ? 'bg-amber-600/20 text-amber-600' :
                                      'bg-muted text-muted-foreground'
                                  }`}>
                                  {index + 1}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary">
                                      {(profile.name || 'U').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="font-medium">{profile.name || "Anonymous"}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{profile.email || "—"}</TableCell>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center gap-1 font-semibold text-primary">
                                  <Recycle className="h-3.5 w-3.5" />
                                  {profile.points || 0}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                {(profile.streak || 0) > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-orange-500">
                                    🔥 {profile.streak}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant="secondary"
                                  className={
                                    profile.role === "admin"
                                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                                      : "bg-primary/10 text-primary border-primary/20"
                                  }
                                >
                                  {profile.role === "admin" ? (
                                    <><Shield className="h-3 w-3 mr-1" /> Admin</>
                                  ) : (
                                    profile.role || "user"
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4">
              <Card className="border-0 shadow-xl bg-card/50 backdrop-blur">
                <CardHeader className="border-b">
                  <CardTitle className="text-xl">Community Reports</CardTitle>
                  <CardDescription>Review and manage user-submitted reports</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {loadingReports ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-16 w-16 text-green-500/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No reports submitted yet. All clear! 🎉</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {reports.map((report) => (
                        <Card
                          key={report._id}
                          className={`border transition-all hover:shadow-md ${report.status === 'pending' ? 'border-amber-500/30 bg-amber-500/5' :
                            report.status === 'resolved' ? 'border-green-500/30 bg-green-500/5' :
                              'border-red-500/30 bg-red-500/5'
                            }`}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant={
                                      report.type === "bin_issue" ? "destructive" :
                                        report.type === "bug" ? "secondary" : "default"
                                    }
                                    className="capitalize"
                                  >
                                    {report.type === "bin_issue" ? (
                                      <><MapPin className="h-3 w-3 mr-1" /> Bin Issue</>
                                    ) : report.type === "bug" ? (
                                      <><AlertTriangle className="h-3 w-3 mr-1" /> Bug</>
                                    ) : (
                                      report.type
                                    )}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={
                                      report.status === "resolved"
                                        ? "border-green-500 text-green-500 bg-green-500/10"
                                        : report.status === "pending"
                                          ? "border-amber-500 text-amber-500 bg-amber-500/10"
                                          : "border-red-500 text-red-500 bg-red-500/10"
                                    }
                                  >
                                    {report.status === "resolved" ? (
                                      <><CheckCircle className="h-3 w-3 mr-1" /> Resolved</>
                                    ) : report.status === "pending" ? (
                                      <><Activity className="h-3 w-3 mr-1" /> Pending</>
                                    ) : (
                                      <><Ban className="h-3 w-3 mr-1" /> Rejected</>
                                    )}
                                  </Badge>
                                </div>
                                <p className="text-sm leading-relaxed">{report.message}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {report.userId?.name || report.userId?.email || "Anonymous"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(report.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              {report.status === "pending" && (
                                <div className="flex flex-col gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateReportStatus(report._id, "resolved")}
                                    className="bg-green-500 hover:bg-green-600 gap-1"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Resolve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateReportStatus(report._id, "rejected")}
                                    className="border-red-500/30 text-red-500 hover:bg-red-500/10 gap-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-xl bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users.slice(0, 5).map((user, index) => (
                        <div key={user._id} className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-500 text-yellow-950' :
                            index === 1 ? 'bg-gray-300 text-gray-700' :
                              index === 2 ? 'bg-amber-600 text-amber-50' :
                                'bg-muted text-muted-foreground'
                            }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user.name || 'Anonymous'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{user.points}</p>
                            <p className="text-xs text-muted-foreground">points</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <span className="text-muted-foreground">Users with streaks</span>
                        <span className="font-bold">{users.filter(u => u.streak > 0).length}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <span className="text-muted-foreground">Highest points</span>
                        <span className="font-bold text-primary">{Math.max(...users.map(u => u.points || 0), 0)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <span className="text-muted-foreground">Longest streak</span>
                        <span className="font-bold text-orange-500">🔥 {Math.max(...users.map(u => u.streak || 0), 0)} days</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <span className="text-muted-foreground">Resolved reports</span>
                        <span className="font-bold text-green-500">{reports.filter(r => r.status === 'resolved').length}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <span className="text-muted-foreground">Admin users</span>
                        <span className="font-bold text-red-500">{users.filter(u => u.role === 'admin').length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Admin;
