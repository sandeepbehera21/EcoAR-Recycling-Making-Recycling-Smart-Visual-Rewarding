import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Recycle, Mail, Lock, ArrowRight, Leaf, User, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { GoogleLogin } from "@react-oauth/google";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(2, "Username must be at least 2 characters").optional(),
});

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading, signIn, signUp, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      // Redirect admin users to admin dashboard
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [user, loading, navigate]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast({
        title: "Welcome!",
        description: "Successfully logged in with Google.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Google login failed.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validationData = isLogin
        ? { email, password }
        : { email, password, username };

      authSchema.parse(validationData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error, user: loggedInUser } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login Failed",
            description: error.message || "Invalid email or password",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          // Redirect admin users to admin dashboard
          if (loggedInUser?.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/");
          }
        }
      } else {
        const { error } = await signUp(email, password, username);
        if (error) {
          let message = error.message;
          if (error.message?.includes("already registered")) {
            message = "This email is already registered. Please sign in instead.";
          }
          toast({
            title: "Sign Up Failed",
            description: message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account Created!",
            description: "Welcome to EcoAR Recycling!",
          });
          navigate("/");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-nature-gradient">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-eco-gradient items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-64 h-64 bg-card/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-card/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 rounded-full bg-card/20 backdrop-blur-sm">
              <Recycle className="h-16 w-16 text-primary-foreground animate-sway" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">
            EcoAR Recycling
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-md">
            Recycle Smarter. Earn Rewards. Save the Planet.
          </p>
          <div className="mt-12 flex justify-center gap-8">
            {[
              { icon: Leaf, label: "Eco Points" },
              { icon: Recycle, label: "AI Sorting" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 text-primary-foreground/70"
              >
                <div className="p-3 rounded-xl bg-card/20 backdrop-blur-sm">
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Recycle className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-gradient-eco">EcoAR</span>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isLogin
                ? "Sign in to continue your eco journey"
                : "Join our community of eco-warriors"}
            </p>

            <div className="flex justify-center lg:justify-start mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  console.log('Login Failed');
                  toast({
                    title: "Error",
                    description: "Google Login Failed",
                    variant: "destructive"
                  });
                }}
              />
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="EcoWarrior"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12"
                    required={!isLogin}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12"
                  required
                  minLength={6}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" disabled={isSubmitting} />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground">
                    Remember me
                  </Label>
                </div>
              </div>
            )}

            <Button type="submit" variant="hero" className="w-full h-12" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isLogin ? "Signing In..." : "Creating Account..."}
                </>
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <p className="text-center text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
              disabled={isSubmitting}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>

          {/* Back to home */}
          <div className="text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
