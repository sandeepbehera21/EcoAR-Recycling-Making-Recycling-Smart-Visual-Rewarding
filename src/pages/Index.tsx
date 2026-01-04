import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Scan, MapPin, Trophy, ArrowRight, Leaf, Sparkles, Recycle } from "lucide-react";
import heroEarth from "@/assets/hero-earth.png";
import scanIllustration from "@/assets/scan-illustration.png";
import binsIllustration from "@/assets/bins-illustration.png";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import DailyMissions from "@/components/dashboard/DailyMissions";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStartScanning = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start scanning waste items.",
      });
      navigate("/login");
    } else {
      navigate("/scan");
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container relative py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Powered by AI & WebAR
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-gradient-eco">Scan to Sort.</span>
                <br />
                Navigate to Bin.
                <br />
                <span className="text-foreground">Earn Points.</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg">
                Recycle Smarter. Earn Rewards. Save the Planet. Join thousands making sustainable choices with our gamified recycling platform.
              </p>

              {user && (
                <div className="max-w-md animate-fade-in-up delay-100">
                  <DailyMissions />
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <Button variant="hero" size="xl" onClick={handleStartScanning}>
                  <Scan className="h-5 w-5" />
                  Start Scanning
                </Button>
                <Button variant="eco-outline" size="xl" asChild>
                  <Link to="/locate">
                    <MapPin className="h-5 w-5" />
                    Find Bins
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                {[
                  { value: "50K+", label: "Items Recycled" },
                  { value: "12K+", label: "Active Users" },
                  { value: "98%", label: "Accuracy" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-bold text-primary">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative animate-fade-in-up delay-200">
              <div className="relative animate-float">
                <img
                  src={heroEarth}
                  alt="Eco-friendly planet with recycling symbols"
                  className="w-full max-w-lg mx-auto drop-shadow-2xl"
                />
              </div>
              {/* Floating badges */}
              <div className="absolute top-10 right-0 glass-card rounded-xl p-3 animate-fade-in-up delay-300">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Leaf className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">CO₂ Saved</p>
                    <p className="text-xs text-muted-foreground">12.5 tons</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-20 left-0 glass-card rounded-xl p-3 animate-fade-in-up delay-400">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Trophy className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Points Earned</p>
                    <p className="text-xs text-muted-foreground">2.4M total</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-card/50">
        <div className="container">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It <span className="text-gradient-eco">Works</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to make recycling fun and rewarding
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Scan,
                title: "Scan Your Waste",
                description: "Use your camera to scan any waste item. Our AI instantly identifies what type of recyclable it is.",
                image: scanIllustration,
              },
              {
                step: "02",
                icon: Recycle,
                title: "Get Classification",
                description: "Receive instant feedback on waste type - plastic, metal, paper, or organic - with disposal instructions.",
                image: binsIllustration,
              },
              {
                step: "03",
                icon: Trophy,
                title: "Dispose & Earn",
                description: "Navigate to the nearest bin using AR, dispose correctly, and earn points for sustainable choices.",
                image: heroEarth,
              },
            ].map((item, index) => (
              <div
                key={item.step}
                className="group relative glass-card rounded-2xl p-6 hover:shadow-xl transition-all duration-500 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-6 right-6 text-6xl font-bold text-primary/10">
                  {item.step}
                </div>
                <div className="relative z-10">
                  <div className="mb-4 p-3 rounded-xl bg-eco-gradient w-fit">
                    <item.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground mb-4">{item.description}</p>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-40 object-cover rounded-xl opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold">
                Powered by <span className="text-gradient-eco">AI & WebAR</span>
              </h2>
              <p className="text-muted-foreground">
                Our cutting-edge technology makes recycling accessible to everyone. No app download needed - just open your browser and start making a difference.
              </p>
              <div className="space-y-4">
                {[
                  "Real-time waste classification using AI",
                  "AR navigation to nearest recycling bins",
                  "Gamified experience with points & rewards",
                  "Compete with friends on the leaderboard",
                ].map((feature, index) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="p-1 rounded-full bg-primary/20">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Button variant="eco" size="lg" onClick={handleStartScanning}>
                Try It Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative animate-fade-in-up delay-200">
              <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
                <img
                  src={scanIllustration}
                  alt="AI-powered waste scanning"
                  className="w-full rounded-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-eco-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-card rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-card rounded-full blur-3xl" />
        </div>
        <div className="container relative text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Join our community of eco-warriors and start earning rewards for sustainable choices today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="eco-glass" size="xl" asChild>
              <Link to="/login">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
