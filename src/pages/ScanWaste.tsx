import { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Camera,
  Upload,
  Scan,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Trash2,
  Recycle,
  Package,
  FileText,
  Loader2,
  Wine,
  Cpu,
  AlertCircle,
  X,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Clock,
} from "lucide-react";
import scanIllustration from "@/assets/scan-illustration.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

type WasteType = "plastic" | "metal" | "paper" | "organic" | "glass" | "ewaste" | "general" | null;

interface ClassificationResult {
  type: WasteType;
  confidence: number;
  item: string;
  tip: string;
}

const wasteInfo: Record<
  Exclude<WasteType, null>,
  { color: string; bin: string; icon: typeof Package; bgClass: string }
> = {
  plastic: {
    color: "text-accent",
    bin: "Blue Bin",
    icon: Package,
    bgClass: "bg-accent/10",
  },
  metal: {
    color: "text-muted-foreground",
    bin: "Gray Bin",
    icon: Recycle,
    bgClass: "bg-muted/30",
  },
  paper: {
    color: "text-chart-4",
    bin: "Yellow Bin",
    icon: FileText,
    bgClass: "bg-chart-4/10",
  },
  organic: {
    color: "text-primary",
    bin: "Green Bin",
    icon: Trash2,
    bgClass: "bg-primary/10",
  },
  glass: {
    color: "text-chart-2",
    bin: "Glass Recycling Bin",
    icon: Wine,
    bgClass: "bg-chart-2/10",
  },
  ewaste: {
    color: "text-destructive",
    bin: "E-Waste Collection Point",
    icon: Cpu,
    bgClass: "bg-destructive/10",
  },
  general: {
    color: "text-muted-foreground",
    bin: "General Waste Bin",
    icon: Trash2,
    bgClass: "bg-muted/20",
  },
};

// Points awarded per waste type
const pointsPerType: Record<Exclude<WasteType, null>, number> = {
  plastic: 15,
  metal: 20,
  paper: 10,
  organic: 10,
  glass: 15,
  ewaste: 25,
  general: 5,
};

// AI Recycling Education Mode - Educational content for each waste type
const educationalContent: Record<Exclude<WasteType, null>, {
  whyRecyclable: string;
  environmentalImpact: string;
  funFact: string;
  decompositionTime: string;
}> = {
  plastic: {
    whyRecyclable: "Plastic is made from petroleum-based polymers that can be melted down and reformed into new products. When recycled, plastic bottles can become fleece jackets, playground equipment, or new containers!",
    environmentalImpact: "If not recycled, plastic takes 450+ years to decompose. It breaks into microplastics that pollute oceans, harm marine life, and enter our food chain. Every year, 8 million tons of plastic end up in our oceans.",
    funFact: "Recycling just one plastic bottle saves enough energy to power a 60W light bulb for 6 hours! 🌟",
    decompositionTime: "450-1000 years"
  },
  metal: {
    whyRecyclable: "Metals like aluminum and steel are infinitely recyclable without losing quality! Aluminum cans can be recycled and back on store shelves as new cans in just 60 days.",
    environmentalImpact: "Mining new metal ore destroys habitats and uses massive amounts of energy. Recycling aluminum saves 95% of the energy needed to make new aluminum from raw materials!",
    funFact: "The aluminum can you recycle today could be back on the shelf as a new can in just 2 months! ♻️",
    decompositionTime: "80-200 years"
  },
  paper: {
    whyRecyclable: "Paper fibers can be recycled 5-7 times before they become too short. Recycled paper uses 70% less energy and reduces water pollution by 35% compared to making new paper.",
    environmentalImpact: "Without recycling, more trees are cut down (17 trees per ton of paper!), destroying wildlife habitats and reducing our planet's ability to absorb CO2. Paper in landfills produces methane, a powerful greenhouse gas.",
    funFact: "Recycling one ton of paper saves 17 trees, 7,000 gallons of water, and 4,100 kWh of electricity! 🌳",
    decompositionTime: "2-6 weeks"
  },
  organic: {
    whyRecyclable: "Organic waste can be composted into nutrient-rich soil! Composting returns valuable nutrients to the earth and creates natural fertilizer for gardens and farms.",
    environmentalImpact: "When organic waste goes to landfills, it produces methane - a greenhouse gas 25x more potent than CO2! Composting instead reduces landfill waste by 30% and fights climate change.",
    funFact: "A banana peel can generate electricity! Some countries use food waste to power homes through biogas. 🍌⚡",
    decompositionTime: "2 weeks - 2 years"
  },
  glass: {
    whyRecyclable: "Glass is 100% recyclable and can be recycled endlessly without losing purity or quality! Recycled glass is used to make new bottles, jars, fiberglass insulation, and even road surfaces.",
    environmentalImpact: "Glass never biodegrades in landfills. Manufacturing new glass requires mining sand, which destroys beaches and riverbeds. Recycling glass reduces CO2 emissions by 20% and saves 30% energy.",
    funFact: "A glass bottle takes 1 million years to decompose in a landfill, but can be recycled in just 30 days! 🍾",
    decompositionTime: "1 million+ years"
  },
  ewaste: {
    whyRecyclable: "Electronics contain valuable metals like gold, silver, and copper that can be recovered and reused. One ton of circuit boards contains 40-800 times more gold than one ton of gold ore!",
    environmentalImpact: "E-waste contains toxic materials like lead, mercury, and cadmium. When dumped improperly, these toxins leak into soil and groundwater, causing cancer, brain damage, and birth defects in communities.",
    funFact: "The gold in 1 million recycled cell phones = 75 pounds of gold, plus 772 pounds of silver! 📱✨",
    decompositionTime: "1000+ years (never fully)"
  },
  general: {
    whyRecyclable: "While general waste typically goes to landfills, you can reduce this category by choosing recyclable alternatives and composting when possible.",
    environmentalImpact: "Landfills produce harmful gases, attract pests, and take up valuable land. They can contaminate groundwater and take decades to fill. Reducing general waste helps our planet breathe easier.",
    funFact: "The average person generates 4.5 pounds of waste daily. Small changes in habits can reduce this by 50%! 🌍",
    decompositionTime: "Varies by material"
  }
};

const ScanWaste = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<ClassificationResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [disposalConfirmed, setDisposalConfirmed] = useState(false);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user's current points
  useEffect(() => {
    const fetchUserPoints = async () => {
      // In MongoDB version, points are in user object. logic simplified.
      if (!user) return;
      setUserPoints(user.points || 0);
    };

    fetchUserPoints();
  }, [user]);

  const confirmDisposal = async () => {
    if (!user || !scannedResult?.type || disposalConfirmed) return;

    setIsConfirming(true);
    const pointsToAdd = pointsPerType[scannedResult.type];

    try {
      // Save to scan history in MongoDB (Backend handles points update)
      await axios.post("http://localhost:5000/api/scan-history", {
        userId: user._id,
        wasteType: scannedResult.type,
        itemDescription: scannedResult.item,
        confidence: scannedResult.confidence,
        pointsEarned: pointsToAdd,
        tip: scannedResult.tip
      });

      // Update local state (points)
      // Optimistic update or refetch user
      // Assuming backend updates user points, we can update local UI
      const newPoints = (userPoints || 0) + pointsToAdd;
      setUserPoints(newPoints);

      // Update challenges/achievements - Skipping for MongoDB MVP (requires backend implementation)
      // await updateChallengeProgress(scannedResult.type, pointsToAdd);
      // await checkAchievements(newPoints, newStreak, scannedResult.type);

      setDisposalConfirmed(true);

      toast({
        title: "🎉 Points Earned!",
        description: `+${pointsToAdd} points! Total: ${newPoints}`,
      });
    } catch (err: any) {
      console.error("Error confirming disposal:", err);
      toast({
        title: "Error",
        description: "Failed to save points. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const updateChallengeProgress = async (wasteType: string, pointsEarned: number) => {
    // Challenges not yet migrated to MongoDB
    return;
  };

  const checkAchievements = async (totalPoints: number, streak: number, wasteType: string) => {
    // Achievements not yet migrated to MongoDB
    return;
  };

  // Check auth on mount
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to scan waste items.",
      });
      navigate("/login");
    }
  }, [user, navigate, toast]);

  const classifyWaste = async (imageBase64: string) => {
    setIsScanning(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("classify-waste", {
        body: { imageBase64 },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setScannedResult(data.classification);
      toast({
        title: "Classification Complete!",
        description: `Detected: ${data.classification.item}`,
      });
    } catch (err: any) {
      console.error("Classification error:", err);
      setError(err.message || "Failed to classify waste");
      toast({
        title: "Classification Failed",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        classifyWaste(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      setError(null);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please check permissions or use image upload.");
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL("image/jpeg", 0.8);
        setImagePreview(base64);
        stopCamera();
        classifyWaste(base64);
      }
    }
  };

  const handleReset = () => {
    setScannedResult(null);
    setImagePreview(null);
    setIsScanning(false);
    setError(null);
    setDisposalConfirmed(false);
    stopCamera();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="flex justify-center gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                AI-Powered Classification
              </div>
              {userPoints !== null && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
                  🏆 {userPoints} points
                </div>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Scan Your <span className="text-gradient-eco">Waste</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Upload or capture an image of your waste item to get instant AI classification and disposal instructions.
            </p>
          </div>

          {/* Scanner Interface */}
          <Card className="glass-card border-2 border-dashed border-primary/30 overflow-hidden animate-fade-in-up delay-100">
            <CardContent className="p-0">
              {/* Scanner View */}
              <div className="relative aspect-video bg-muted/30 flex items-center justify-center overflow-hidden">
                {isCameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {/* Camera overlay */}
                    <div className="absolute inset-8 border-2 border-primary/60 rounded-2xl pointer-events-none">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                    </div>
                  </>
                ) : imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Uploaded waste"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-8">
                    <img
                      src={scanIllustration}
                      alt="Scan waste"
                      className="w-48 h-48 mx-auto mb-4 opacity-50"
                    />
                    <p className="text-muted-foreground">
                      Upload an image or use your camera to scan waste
                    </p>
                  </div>
                )}

                {/* Scanning Animation Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <div className="relative mb-4">
                        <div className="w-20 h-20 rounded-full border-4 border-primary/30 animate-ping absolute inset-0" />
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center scan-pulse">
                          <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        </div>
                      </div>
                      <p className="text-lg font-medium">Analyzing waste...</p>
                      <p className="text-sm text-muted-foreground">
                        AI is identifying the material
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && !isScanning && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center p-4">
                      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                      <p className="text-destructive font-medium mb-2">Classification Failed</p>
                      <p className="text-sm text-muted-foreground mb-4">{error}</p>
                      <Button variant="outline" onClick={handleReset}>
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}

                {/* Scan frame overlay for idle state */}
                {!isScanning && !scannedResult && !imagePreview && !isCameraActive && !error && (
                  <div className="absolute inset-8 border-2 border-primary/40 rounded-2xl pointer-events-none">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-card/50 border-t border-border/50">
                <div className="flex flex-wrap gap-4 justify-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {isCameraActive ? (
                    <>
                      <Button variant="hero" size="lg" onClick={capturePhoto}>
                        <Camera className="h-5 w-5" />
                        Capture Photo
                      </Button>
                      <Button variant="outline" size="lg" onClick={stopCamera}>
                        <X className="h-5 w-5" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="eco"
                        size="lg"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanning}
                      >
                        <Upload className="h-5 w-5" />
                        Upload Image
                      </Button>
                      <Button
                        variant="eco-outline"
                        size="lg"
                        onClick={startCamera}
                        disabled={isScanning}
                      >
                        <Camera className="h-5 w-5" />
                        Use Camera
                      </Button>
                      {(imagePreview || scannedResult) && (
                        <Button variant="outline" size="lg" onClick={handleReset}>
                          Reset
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Result Display */}
          {scannedResult && scannedResult.type && (
            <Card className="mt-8 glass-card animate-fade-in-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  Classification Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Waste Type Icon */}
                  <div className={`p-6 rounded-2xl ${wasteInfo[scannedResult.type].bgClass}`}>
                    {(() => {
                      const IconComponent = wasteInfo[scannedResult.type].icon;
                      return (
                        <IconComponent
                          className={`h-16 w-16 ${wasteInfo[scannedResult.type].color}`}
                        />
                      );
                    })()}
                  </div>

                  {/* Result Info */}
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-sm text-muted-foreground mb-1">
                      Detected Material
                    </p>
                    <h3 className={`text-3xl font-bold capitalize ${wasteInfo[scannedResult.type].color}`}>
                      {scannedResult.type}
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      {scannedResult.item}
                    </p>
                    <p className="text-lg text-muted-foreground mt-2">
                      Throw this in the{" "}
                      <span className="font-semibold text-foreground">
                        {wasteInfo[scannedResult.type].bin}
                      </span>
                    </p>
                    {scannedResult.tip && (
                      <p className="text-sm text-primary mt-2 italic">
                        💡 {scannedResult.tip}
                      </p>
                    )}
                    <div className="mt-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {scannedResult.confidence}% confidence
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex flex-col gap-3">
                    {disposalConfirmed ? (
                      <div className="text-center p-4 bg-primary/10 rounded-xl">
                        <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="font-semibold text-primary">Disposal Confirmed!</p>
                        <p className="text-sm text-muted-foreground">
                          +{pointsPerType[scannedResult.type]} points earned
                        </p>
                        {userPoints !== null && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Total: {userPoints} points
                          </p>
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="hero"
                        size="lg"
                        onClick={confirmDisposal}
                        disabled={isConfirming}
                      >
                        {isConfirming ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5" />
                            Confirm Disposal (+{pointsPerType[scannedResult.type]} pts)
                          </>
                        )}
                      </Button>
                    )}
                    <Button variant="eco-outline" size="lg" asChild>
                      <a href="/locate">
                        Find Nearest Bin
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recycling Education Mode */}
          {scannedResult && scannedResult.type && (
            <Card className="mt-6 glass-card animate-fade-in-up border-2 border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  AI Recycling Education Mode
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Learn why recycling this item matters for our planet
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Why is it Recyclable */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Recycle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">
                        Why is this recyclable?
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {educationalContent[scannedResult.type].whyRecyclable}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Environmental Impact */}
                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-destructive mb-1">
                        What happens if it's not recycled?
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {educationalContent[scannedResult.type].environmentalImpact}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fun Fact & Decomposition Time */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Fun Fact */}
                  <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-accent/10 shrink-0">
                        <Lightbulb className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-accent mb-1">
                          Did you know?
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {educationalContent[scannedResult.type].funFact}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Decomposition Time */}
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted shrink-0">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">
                          Decomposition Time
                        </h4>
                        <p className="text-lg font-bold text-foreground">
                          {educationalContent[scannedResult.type].decompositionTime}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          if sent to landfill
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    🌍 <span className="font-medium text-primary">Every item you recycle makes a difference!</span> Share this knowledge with others.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips Section */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Clear Images",
                description: "Take photos with good lighting for better accuracy",
              },
              {
                title: "Single Items",
                description: "Scan one item at a time for precise classification",
              },
              {
                title: "Earn Points",
                description: "Confirm each disposal to earn eco points",
              },
            ].map((tip, index) => (
              <Card key={tip.title} className="glass-card animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <CardContent className="pt-6">
                  <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-1">{tip.title}</h4>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ScanWaste;
