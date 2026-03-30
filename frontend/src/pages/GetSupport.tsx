import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/services/api";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import {
  Users, Heart, Angry, Cloud, Brain, Home, GraduationCap,
  HeartCrack, Shield, Frown, Compass, Eye, ArrowRight, ArrowLeft, UserRound
} from "lucide-react";

const issueTypes = [
  { id: "academic", label: "Academic Pressure", icon: GraduationCap, emoji: "📚" },
  { id: "family", label: "Family Conflict", icon: Home, emoji: "🏠" },
  { id: "friendship", label: "Friendship & Social", icon: Users, emoji: "👥" },
  { id: "romantic", label: "Romantic Relationships", icon: HeartCrack, emoji: "💔" },
  { id: "bullying", label: "Bullying & Cyberbullying", icon: Shield, emoji: "🛡️" },
  { id: "selfworth", label: "Self-Worth & Identity", icon: Eye, emoji: "🪞" },
  { id: "anxiety", label: "Anxiety & Worry", icon: Cloud, emoji: "😰" },
  { id: "grief", label: "Grief & Loss", icon: Heart, emoji: "🕊️" },
  { id: "anger", label: "Anger & Emotions", icon: Angry, emoji: "😤" },
  { id: "loneliness", label: "Loneliness & Isolation", icon: Frown, emoji: "😞" },
  { id: "career", label: "Career & Future", icon: Compass, emoji: "🧭" },
  { id: "home_safety", label: "Home & Safety", icon: Home, emoji: "⚠️" },
];

const languages = ["English", "Hindi", "Telugu", "Tamil"];
const supportStyles = [
  { id: "listen", label: "Just listen to me", desc: "I need someone to hear me out" },
  { id: "advice", label: "Give me advice", desc: "Help me think through this" },
  { id: "action", label: "Help me take steps", desc: "I want practical next steps" },
  { id: "checkin", label: "Check in regularly", desc: "I need ongoing support" },
];

const GetSupport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const hasGoogleClientId = Boolean(googleClientId && googleClientId.trim().length > 0);

  const [step, setStep] = useState(1);
  const [authMethod, setAuthMethod] = useState<"guest" | "google" | null>(null);
  const [googleToken, setGoogleToken] = useState("");
  const [name, setName] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [language, setLanguage] = useState("");
  const [supportStyle, setSupportStyle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleIssue = (id: string) => {
    setSelectedIssues((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const canProceedGoogleStep =
    authMethod === "google" &&
    name.trim() &&
    selectedIssues.length > 0 &&
    language &&
    supportStyle &&
    googleToken;

  const handleGuestContinue = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      setAuthMethod("guest");
      await authAPI.guestLogin();
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Unable to continue as guest",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      toast({
        title: "Google sign-in incomplete",
        description: "Please try Google sign-in again.",
        variant: "destructive",
      });
      return;
    }

    setAuthMethod("google");
    setGoogleToken(response.credential);

    setIsSubmitting(true);
    try {
      await authAPI.googleLogin({
        idToken: response.credential,
      });
      toast({
        title: "Welcome back",
        description: "You are logged in with your saved profile.",
      });
      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please complete your profile.";
      if (!message.includes("PROFILE_SETUP_REQUIRED")) {
        toast({
          title: "Unable to continue",
          description: message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      setStep(2);
      toast({
        title: "Almost there",
        description: "Tell us your name and support preferences to finish setup.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.googleLogin({
        idToken: googleToken,
        name,
        selectedIssues,
        language,
        supportStyle,
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Unable to continue",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-3">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                step >= s ? "bg-gradient-hero text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {s}
              </div>
              <span className={`text-sm font-medium ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                {s === 1 ? "Choose Access" : "Support Preferences"}
              </span>
              {s < 2 && <div className={`h-0.5 w-8 ${step > 1 ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Access choice */}
        {step === 1 && (
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Brain className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Welcome to MindBridge</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose how you want to continue.</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold text-foreground">Continue as Guest</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter instantly and start exploring the app right away.
                </p>
                <Button
                  onClick={handleGuestContinue}
                  disabled={isSubmitting}
                  className="mt-4 w-full rounded-full bg-gradient-hero text-primary-foreground hover:opacity-90"
                  size="lg"
                >
                  <UserRound className="mr-2 h-4 w-4" />
                  {isSubmitting && authMethod === "guest" ? "Continuing..." : "Continue as Guest"}
                </Button>
              </div>

              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold text-foreground">Continue with Google</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Securely connect your Google account. Returning users continue instantly; first-time users complete a short setup.
                </p>
                <div className="mt-4 flex justify-center">
                  {hasGoogleClientId ? (
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => {
                        toast({
                          title: "Google sign-in failed",
                          description: "Please try again.",
                          variant: "destructive",
                        });
                      }}
                    />
                  ) : (
                    <Button disabled variant="outline" className="w-full rounded-full" size="lg">
                      Google OAuth not configured
                    </Button>
                  )}
                </div>
                {!hasGoogleClientId && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Add <span className="font-semibold">VITE_GOOGLE_CLIENT_ID</span> in your frontend .env file to enable Google login.
                  </p>
                )}
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Guest mode enters directly. Google mode continues to a short matching setup.
              </p>
            </div>
          </div>
        )}

        {/* Step 2 — Google intake */}
        {step === 2 && (
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-foreground">Tell us about your support needs</h2>
              <p className="mt-1 text-sm text-muted-foreground">Select up to 3 areas. This helps us match you with the right mentor.</p>
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Your name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="rounded-xl"
              />
            </div>

            {/* Issue grid */}
            <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {issueTypes.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => toggleIssue(issue.id)}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left text-xs font-medium transition-all ${
                    selectedIssues.includes(issue.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <span className="text-base">{issue.emoji}</span>
                  {issue.label}
                </button>
              ))}
            </div>
            <p className="mb-6 text-center text-xs text-muted-foreground">
              {selectedIssues.length}/3 selected
            </p>

            {/* Language */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Preferred language</label>
              <div className="grid grid-cols-4 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`rounded-xl border p-2.5 text-xs font-medium transition-all ${
                      language === lang
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Support style */}
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-foreground">How would you like support?</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {supportStyles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSupportStyle(s.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      supportStyle === s.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <p className={`text-sm font-medium ${supportStyle === s.id ? "text-primary" : "text-foreground"}`}>{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-full" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleGoogleSubmit}
                disabled={!canProceedGoogleStep || isSubmitting}
                className="flex-1 rounded-full bg-gradient-hero text-primary-foreground hover:opacity-90"
                size="lg"
              >
                {isSubmitting ? "Connecting..." : "Continue to Dashboard"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GetSupport;
