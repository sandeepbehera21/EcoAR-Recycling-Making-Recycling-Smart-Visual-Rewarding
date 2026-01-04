import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  History,
  Loader2,
  Package,
  Recycle,
  FileText,
  Trash2,
  Wine,
  Cpu,
  Scan,
  Trophy,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface ScanRecord {
  _id: string; // MongoDB uses _id
  wasteType: string; // camelCase
  itemDescription: string | null;
  confidence: number | null;
  pointsEarned: number;
  tip: string | null;
  createdAt: string;
}

const wasteIcons: Record<string, typeof Package> = {
  plastic: Package,
  metal: Recycle,
  paper: FileText,
  organic: Trash2,
  glass: Wine,
  ewaste: Cpu,
  general: Trash2,
};

const wasteColors: Record<string, string> = {
  plastic: "text-accent bg-accent/10",
  metal: "text-muted-foreground bg-muted/30",
  paper: "text-chart-4 bg-chart-4/10",
  organic: "text-primary bg-primary/10",
  glass: "text-chart-2 bg-chart-2/10",
  ewaste: "text-destructive bg-destructive/10",
  general: "text-muted-foreground bg-muted/20",
};

const ScanHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalScans: 0,
    totalPoints: 0,
    topWasteType: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;

      try {
        const response = await axios.get(`http://localhost:5000/api/scan-history/${user._id}`);
        const data = response.data;

        setHistory(data || []);

        // Calculate stats
        const totalPoints = (data || []).reduce((sum: number, s: ScanRecord) => sum + s.pointsEarned, 0);
        const wasteTypeCounts: Record<string, number> = {};
        (data || []).forEach((s: ScanRecord) => {
          wasteTypeCounts[s.wasteType] = (wasteTypeCounts[s.wasteType] || 0) + 1;
        });
        const topWasteType = Object.entries(wasteTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

        setStats({
          totalScans: data?.length || 0,
          totalPoints,
          topWasteType,
        });
      } catch (error) {
        console.error("Error fetching scan history:", error);
      }
      setLoading(false);
    };

    if (user) {
      fetchHistory();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary/10">
              <History className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Scan History</h1>
              <p className="text-muted-foreground">Your recycling journey over time</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Scan className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Scans</p>
                    <p className="text-2xl font-bold">{stats.totalScans}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-accent/10">
                    <Trophy className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Points Earned</p>
                    <p className="text-2xl font-bold">{stats.totalPoints}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-chart-2/10">
                    <Recycle className="h-6 w-6 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Top Category</p>
                    <p className="text-2xl font-bold capitalize">{stats.topWasteType || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History List */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <Scan className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">No scans yet. Start recycling!</p>
                  <Button variant="eco" onClick={() => navigate("/scan")}>
                    <Scan className="h-4 w-4" />
                    Scan Your First Item
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((scan) => {
                    const IconComponent = wasteIcons[scan.wasteType] || Trash2;
                    const colorClass = wasteColors[scan.wasteType] || wasteColors.general;

                    return (
                      <div
                        key={scan._id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors"
                      >
                        <div className={`p-3 rounded-xl ${colorClass.split(" ")[1]}`}>
                          <IconComponent className={`h-6 w-6 ${colorClass.split(" ")[0]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold capitalize">{scan.wasteType}</h4>
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              +{scan.pointsEarned} pts
                            </Badge>
                            {scan.confidence && (
                              <span className="text-xs text-muted-foreground">
                                {scan.confidence}% confidence
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {scan.itemDescription || "Waste item"}
                          </p>
                          {scan.tip && (
                            <p className="text-xs text-primary mt-1 italic">💡 {scan.tip}</p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{format(new Date(scan.createdAt), "MMM d")}</p>
                          <p>{format(new Date(scan.createdAt), "h:mm a")}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ScanHistory;
