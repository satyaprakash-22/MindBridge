import { Button } from "@/components/ui/button";
import {
  Users, MessageCircle, Star, Clock, ArrowRight, ToggleLeft, ToggleRight,
  TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mentorAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

type AssignedYouth = {
  id: string;
  matchScore: number;
  youth: {
    id: string;
    selectedIssues: string[];
    user: {
      id: string;
      username: string;
    };
  };
};

const MentorPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [available, setAvailable] = useState(true);
  const [assignedYouth, setAssignedYouth] = useState<AssignedYouth[]>([]);
  const [sessionsDone, setSessionsDone] = useState(0);
  const [rating, setRating] = useState("0.0");
  const [avgResponse, setAvgResponse] = useState("8 min");
  const [activeChatYouthId, setActiveChatYouthId] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const result = await mentorAPI.getDashboard();
        setAvailable(Boolean(result.mentor?.profile?.isAvailable));
        setAssignedYouth(result.assignedYouth || []);
        const computedSessions = result.metrics?.sessionsDone ?? result.mentor?.profile?.totalSessions ?? 0;
        const computedRating = result.metrics?.avgRating ?? result.mentor?.profile?.rating ?? 0;
        const responseMinutes = result.metrics?.avgResponseMinutes ?? 8;

        setSessionsDone(computedSessions);
        setRating(Number(computedRating || 0).toFixed(1));
        setAvgResponse(`${responseMinutes} min`);
      } catch (error) {
        toast({
          title: "Unable to load mentor data",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    };

    loadDashboard();
    const refreshTimer = window.setInterval(loadDashboard, 30000);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [toast]);

  const onToggleAvailability = async () => {
    try {
      const result = await mentorAPI.toggleAvailability();
      setAvailable(Boolean(result.profile?.isAvailable));
      toast({
        title: "Status updated",
        description: result.profile?.isAvailable ? "You are now available." : "You are now offline.",
      });
    } catch (error) {
      toast({
        title: "Could not update status",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const openMentorChat = async (youthUserId: string) => {
    if (activeChatYouthId) {
      return;
    }

    setActiveChatYouthId(youthUserId);
    try {
      const result = await mentorAPI.startChatWithYouth(youthUserId);
      navigate(`/chat/${result.chat.id}`);
    } catch (error) {
      toast({
        title: "Unable to open chat",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActiveChatYouthId(null);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mentor Portal</h1>
          <p className="text-sm text-muted-foreground">Manage your assigned youth and track sessions.</p>
        </div>
        <button
          onClick={onToggleAvailability}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
            available
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-muted text-muted-foreground"
          }`}
        >
          {available ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
          {available ? "Available" : "Offline"}
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Youth Assigned", value: String(assignedYouth.length), icon: Users },
          { label: "Sessions Done", value: String(sessionsDone), icon: MessageCircle },
          { label: "Avg Rating", value: rating, icon: Star },
          { label: "Avg Response", value: avgResponse, icon: Clock },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
            <s.icon className="mx-auto mb-2 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Youth cards */}
      <h2 className="mb-4 text-lg font-semibold text-foreground">Assigned Youth</h2>
      <div className="space-y-4">
        {(assignedYouth.length === 0
          ? [{ id: "none", youth: { id: "No assignments yet", selectedIssues: [], user: { id: "", username: "" } }, matchScore: 0 }]
          : assignedYouth).map((y) => (
          <div key={y.id} className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                  {y.id === "none" ? "🕊️" : "🙂"}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{y.id === "none" ? y.youth.id : (y.youth.user?.username || y.youth.id)}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(y.youth.selectedIssues || []).map((i) => (
                      <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{i}</span>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{y.id === "none" ? "As youth users get matched, they will appear here." : `Match score: ${y.matchScore}pts`}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Last chat</p>
                  <p className="text-sm font-medium text-foreground">{y.id === "none" ? "-" : "Recent"}</p>
                </div>
                <Button
                  size="sm"
                  disabled={y.id === "none" || !y.youth.user?.id || activeChatYouthId === y.youth.user.id}
                  className="rounded-full bg-gradient-hero text-primary-foreground hover:opacity-90"
                  onClick={() => openMentorChat(y.youth.user.id)}
                >
                  {activeChatYouthId === y.youth.user.id ? "Opening..." : "Chat"} <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MentorPortal;
