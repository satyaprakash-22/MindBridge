import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/services/api";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { Users, Mail, Lock, ArrowRight } from "lucide-react";

const domainOptions = [
  { id: "academic", label: "Academic Pressure", emoji: "📚" },
  { id: "family", label: "Family Conflict", emoji: "🏠" },
  { id: "friendship", label: "Friendship & Social", emoji: "👥" },
  { id: "romantic", label: "Romantic Relationships", emoji: "💔" },
  { id: "bullying", label: "Bullying & Cyberbullying", emoji: "🛡️" },
  { id: "selfworth", label: "Self-Worth & Identity", emoji: "🪞" },
  { id: "anxiety", label: "Anxiety & Worry", emoji: "😰" },
  { id: "grief", label: "Grief & Loss", emoji: "🕊️" },
  { id: "anger", label: "Anger & Emotions", emoji: "😤" },
  { id: "loneliness", label: "Loneliness & Isolation", emoji: "😞" },
  { id: "career", label: "Career & Future", emoji: "🧭" },
  { id: "home_safety", label: "Home & Safety", emoji: "⚠️" },
];

const MentorLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const hasGoogleClientId = Boolean(googleClientId && googleClientId.trim().length > 0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleToken, setGoogleToken] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleExpertise = (id: string) => {
    setExpertise((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.mentorLogin(email, password, name, expertise);
      navigate("/mentor-portal");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = (response: CredentialResponse) => {
    if (!response.credential) {
      toast({
        title: "Google sign-in failed",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }

    setGoogleToken(response.credential);
    toast({
      title: "Google account connected",
      description: "Now enter your volunteer name and expertise domains.",
    });
  };

  const handleGoogleVolunteerContinue = async () => {
    if (isSubmitting) {
      return;
    }

    if (!googleToken) {
      toast({
        title: "Google sign-in required",
        description: "Please continue with Google first.",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your volunteer name.",
        variant: "destructive",
      });
      return;
    }

    if (expertise.length === 0) {
      toast({
        title: "Select expertise",
        description: "Please select at least one expertise domain.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.mentorGoogleLogin({
        idToken: googleToken,
        name,
        expertise,
      });
      navigate("/mentor-portal");
    } catch (error) {
      toast({
        title: "Google volunteer login failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Users className="h-7 w-7 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Volunteer Login</h2>
          <p className="mt-1 text-sm text-muted-foreground">Welcome back, mentor.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="rounded-xl border border-border p-3">
            <p className="text-sm font-medium text-foreground">Continue with Google (recommended)</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your volunteer account will be linked to your Gmail address.
            </p>
            <div className="mt-3 flex justify-center">
              {hasGoogleClientId ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    toast({
                      title: "Google sign-in failed",
                      description: "Check OAuth origin settings and try again.",
                      variant: "destructive",
                    });
                  }}
                />
              ) : (
                <Button type="button" variant="outline" disabled className="w-full rounded-full">
                  Google OAuth not configured
                </Button>
              )}
            </div>
            {googleToken && (
              <p className="mt-2 text-center text-xs font-medium text-primary">Google connected. Complete details below.</p>
            )}
            {!hasGoogleClientId && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Add VITE_GOOGLE_CLIENT_ID in frontend env to enable this option.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Volunteer Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mentor Priya"
              className="rounded-xl"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="rounded-xl pl-10" required />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="rounded-xl pl-10" required />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Experience Domains</label>
            <div className="grid grid-cols-2 gap-2">
              {domainOptions.map((domain) => (
                <button
                  type="button"
                  key={domain.id}
                  onClick={() => toggleExpertise(domain.id)}
                  className={`flex items-center gap-2 rounded-xl border p-2 text-left text-xs transition-all ${
                    expertise.includes(domain.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <span>{domain.emoji}</span>
                  <span className="leading-tight">{domain.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{expertise.length} selected</p>
          </div>
          <Button
            type="button"
            onClick={handleGoogleVolunteerContinue}
            disabled={isSubmitting || !googleToken}
            className="w-full rounded-full bg-gradient-hero text-primary-foreground hover:opacity-90"
            size="lg"
          >
            {isSubmitting && googleToken ? "Continuing..." : "Continue with Google as Volunteer"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or use email and password</span>
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full rounded-full bg-gradient-accent text-accent-foreground hover:opacity-90" size="lg">
            {isSubmitting ? "Logging in..." : "Login"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default MentorLogin;
