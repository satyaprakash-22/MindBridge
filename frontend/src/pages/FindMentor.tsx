import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, History, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { chatAPI, youthAPI } from "@/services/api";

type MentorCard = {
  mentorId: string;
  name: string;
  email: string;
  expertise: string[];
  matchedIssues: string[];
  matchScore: number;
  totalSessions: number;
  rating: number;
  isAvailable: boolean;
  hasHistory: boolean;
  lastChatAt: string | null;
  chatCount: number;
};

const FindMentor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState<string | null>(null);
  const [previousMentors, setPreviousMentors] = useState<MentorCard[]>([]);
  const [matchedMentors, setMatchedMentors] = useState<MentorCard[]>([]);
  const [otherVolunteers, setOtherVolunteers] = useState<MentorCard[]>([]);

  useEffect(() => {
    const loadMentors = async () => {
      try {
        const result = await youthAPI.getMatchedMentors();
        setPreviousMentors(result.previousMentors || []);
        setMatchedMentors(result.matchedMentors || result.mentors || []);
        setOtherVolunteers(result.otherVolunteers || []);
      } catch (error) {
        toast({
          title: "Unable to load mentors",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadMentors();
  }, [toast]);

  const startChat = async (mentorId: string) => {
    if (isStarting) {
      return;
    }

    setIsStarting(mentorId);
    try {
      await youthAPI.assignMentor(mentorId);
      const chat = await chatAPI.startChat(mentorId);
      navigate(`/chat/${chat.chat.id}`);
    } catch (error) {
      toast({
        title: "Could not start chat",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStarting(null);
    }
  };

  const MentorList = ({ title, icon, mentors, emptyMessage }: { title: string; icon: React.ReactNode; mentors: MentorCard[]; emptyMessage: string }) => (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        {icon} {title}
      </h2>
      {mentors.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {mentors.map((mentor) => (
            <div key={mentor.mentorId} className="rounded-xl border border-border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-foreground">{mentor.name}</p>
                  <p className="text-xs text-muted-foreground">{mentor.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Score: {mentor.matchScore} • Sessions: {mentor.totalSessions} • Rating: {Number(mentor.rating || 0).toFixed(1)}
                  </p>
                  {mentor.lastChatAt && (
                    <p className="text-xs text-muted-foreground">
                      Last chat: {new Date(mentor.lastChatAt).toLocaleString()} ({mentor.chatCount} chats)
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => startChat(mentor.mentorId)}
                  disabled={!mentor.isAvailable || isStarting === mentor.mentorId}
                  className="rounded-full bg-gradient-hero text-primary-foreground hover:opacity-90"
                >
                  {isStarting === mentor.mentorId ? "Opening..." : mentor.hasHistory ? "Continue Chat" : "Select & Chat"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {mentor.matchedIssues.length > 0 ? (
                  mentor.matchedIssues.map((issue) => (
                    <span key={`${mentor.mentorId}-${issue}`} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {issue}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No direct feeling-domain overlap.</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="outline" className="rounded-full" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p className="text-sm text-muted-foreground">Choose a mentor and start or continue chat</p>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Find Your Mentor</h1>
        <p className="text-sm text-muted-foreground">Mentors are ranked by your selected feelings and volunteer expertise.</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Loading mentors...</p>
        </div>
      ) : (
        <div className="space-y-5">
          <MentorList
            title="Previously Chatted Mentors"
            icon={<History className="h-5 w-5 text-primary" />}
            mentors={previousMentors}
            emptyMessage="No previous mentor chats yet."
          />

          <MentorList
            title="Best Matched Mentors"
            icon={<Sparkles className="h-5 w-5 text-accent" />}
            mentors={matchedMentors}
            emptyMessage="No matched mentors available right now."
          />

          <MentorList
            title="Other Volunteers"
            icon={<Users className="h-5 w-5 text-warning" />}
            mentors={otherVolunteers}
            emptyMessage="No additional volunteers online right now."
          />
        </div>
      )}
    </div>
  );
};

export default FindMentor;
