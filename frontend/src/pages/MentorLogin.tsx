import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/services/api";
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

const PENDING_APPROVAL_TEXT = "awaiting admin approval";

const MentorLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFormComplete = Boolean(name.trim() && email.trim() && password.trim() && expertise.length > 0);

  const toggleExpertise = (id: string) => {
    setExpertise((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {
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
      await authAPI.mentorLogin(email, password, name, expertise);
      navigate("/mentor-portal");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";

      if (message.toLowerCase().includes(PENDING_APPROVAL_TEXT)) {
        toast({
          title: "Volunteer profile submitted",
          description: "Your profile is pending admin approval. You can sign in after approval.",
        });
        return;
      }

      toast({
        title: "Login failed",
        description: message,
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
          <p className="mt-2 text-xs text-muted-foreground">
            Your profile details are used to connect youth users with the right volunteer mentor.
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
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
            {!isFormComplete && (
              <p className="mt-1 text-xs text-muted-foreground">
                Fill name, email, password, and at least one experience domain to enable login.
              </p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting || !isFormComplete} className="w-full rounded-full bg-gradient-accent text-accent-foreground hover:opacity-90" size="lg">
            {isSubmitting ? "Logging in..." : "Login"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default MentorLogin;
