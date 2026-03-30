import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { moodAPI, youthAPI } from "@/services/api";
import {
  Smile, Meh, Frown, Heart, CloudRain,
  MessageCircle, BookOpen, Users, ArrowRight, Sparkles
} from "lucide-react";

const moods = [
  { id: 1, icon: CloudRain, label: "Very Bad", color: "text-destructive" },
  { id: 2, icon: Frown, label: "Bad", color: "text-warning" },
  { id: 3, icon: Meh, label: "Okay", color: "text-muted-foreground" },
  { id: 4, icon: Smile, label: "Good", color: "text-accent" },
  { id: 5, icon: Heart, label: "Great", color: "text-primary" },
];

const YouthDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [journal, setJournal] = useState("");
  const [moodSubmitted, setMoodSubmitted] = useState(false);
  const [username, setUsername] = useState("User");
  const [isLoggingMood, setIsLoggingMood] = useState(false);
  const [isFetchingMentors, setIsFetchingMentors] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("mindbridge_user");
    if (user) {
      const parsed = JSON.parse(user);
      setUsername(parsed.username || "User");
    }

  }, []);

  const submitMood = async () => {
    if (!selectedMood || isLoggingMood) {
      return;
    }

    setIsLoggingMood(true);
    try {
      await moodAPI.logMood(selectedMood, journal);
      setMoodSubmitted(true);
      setJournal("");
      setSelectedMood(null);
      toast({
        title: "Mood logged",
        description: "Your check-in was saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Could not log mood",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingMood(false);
    }
  };

  const requestMentorMatch = async () => {
    if (isFetchingMentors) {
      return;
    }

    setIsFetchingMentors(true);
    try {
      navigate('/find-mentor');
    } catch (error) {
      toast({
        title: "Unable to find mentors",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingMentors(false);
    }
  };

  const openResources = async () => {
    try {
      await youthAPI.trackResourceExplore();
    } catch (_) {
      // Keep navigation smooth even if analytics tracking fails.
    } finally {
      navigate('/resources');
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Hey, <span className="text-gradient-primary">{username}</span> 👋
        </h1>
        <p className="text-sm text-muted-foreground">Welcome to your safe space. How are you feeling today?</p>
      </div>

      {/* Mood Check-in */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Sparkles className="h-5 w-5 text-primary" /> Daily Mood Check-in
        </h2>
        {!moodSubmitted ? (
          <>
            <div className="mb-4 flex justify-center gap-3">
              {moods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMood(m.id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border p-3 transition-all ${
                    selectedMood === m.id
                      ? "border-primary bg-primary/10 scale-110"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <m.icon className={`h-7 w-7 ${m.color}`} />
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </button>
              ))}
            </div>
            <textarea
              placeholder="What's on your mind today? (optional)"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              className="mb-4 w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              rows={2}
            />
            <Button
              onClick={submitMood}
              disabled={!selectedMood || isLoggingMood}
              className="w-full rounded-full bg-gradient-hero text-primary-foreground hover:opacity-90"
            >
              {isLoggingMood ? "Logging..." : "Log My Mood"}
            </Button>
          </>
        ) : (
          <div className="py-4 text-center">
            <p className="text-lg font-medium text-accent">✓ Mood logged! Keep going 💚</p>
            <p className="text-sm text-muted-foreground">You're building a streak. Come back tomorrow!</p>
          </div>
        )}
      </div>

      {/* Quick actions grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Mentor Chat card */}
        <div className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-md">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">Chat with Mentor</h3>
          <p className="mb-4 text-sm text-muted-foreground">Your assigned mentor is here for you. Start a conversation.</p>
          <Button variant="outline" className="rounded-full" size="sm" onClick={requestMentorMatch} disabled={isFetchingMentors}>
            {isFetchingMentors ? "Finding..." : "Find Mentor"} <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>

        {/* AI Bridge */}
        <div className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-md">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">AI Bridge</h3>
          <p className="mb-4 text-sm text-muted-foreground">Mentor unavailable? I'm here to listen and help — clearly AI, never pretending.</p>
          <Button variant="outline" className="rounded-full" size="sm">
            Talk to AI <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>

        {/* Explore */}
        <div className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-md">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-warning/10">
            <BookOpen className="h-5 w-5 text-warning" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">Explore Resources</h3>
          <p className="mb-4 text-sm text-muted-foreground">Articles, breathing exercises, podcasts — explore at your pace.</p>
          <Button variant="outline" className="rounded-full" size="sm" onClick={openResources}>
            Explore <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>

        {/* Forum */}
        <div className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-md">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">Community Forum</h3>
          <p className="mb-4 text-sm text-muted-foreground">Share thoughts, read stories, support each other — anonymously.</p>
          <Button variant="outline" className="rounded-full" size="sm">
            Visit Forum <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default YouthDashboard;
