import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  MessageCircle,
  RefreshCw,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

type DashboardStats = {
  totalYouth: number;
  totalVolunteers: number;
  pendingVolunteers: number;
  approvedVolunteers: number;
  activeChats: number;
  totalSessions: number;
  activeCrisisFlags: number;
};

type CrisisFlag = {
  id: string;
  reason: string;
  status: string;
  severity: string;
  createdAt: string;
};

type HeatmapDay = {
  date: string;
  count: number;
  avgMood: number;
  moodCount?: number;
  engagementCount?: number;
  hasMoodData?: boolean;
};

type ActivityDay = {
  date: string;
  sessions: number;
  messages: number;
  newUsers?: number;
  newYouth?: number;
  newVolunteers?: number;
  totalUsers?: number;
  totalVolunteers?: number;
};

type ActivityPoint = {
  date: string;
  label: string;
  sessions: number;
  messages: number;
  newUsers: number;
  newVolunteers: number;
  totalUsers: number;
  totalVolunteers: number;
};

type Volunteer = {
  userId: string;
  approvalStatus: "pending" | "approved" | "rejected" | string;
  user: {
    username: string;
    email: string;
  };
  expertise: string[];
  isAvailable: boolean;
  performance: {
    totalSessions: number;
    completedSessions: number;
    avgMessagesPerSession: number;
  };
  sessions: Array<{
    chatId: string;
    youthName: string;
    startedAt: string;
    endedAt: string | null;
    messageCount: number;
    sessionNotes: string;
  }>;
};

type YouthCase = {
  youthUserId: string;
  username: string;
  selectedIssues: string[];
  language: string;
  supportStyle: string;
  caseStatus: string;
  mentor: { id: string; username: string; email: string } | null;
  moodTrend: Array<{ mood: number; createdAt: string }>;
};

type CaseDetails = {
  youth: {
    id: string;
    username: string;
    email: string;
    ageBracket: string;
    city: string;
    selectedIssues: string[];
    language: string;
    supportStyle: string;
    createdAt: string;
  };
  caseStatus: string;
  assignment: {
    id: string;
    status: string;
    mentor: { id: string; username: string; email: string };
  } | null;
  caseHistory: {
    sessionNotes: string[];
    mentorHistory: string[];
    progress: string;
  } | null;
  moodTrend: Array<{ date: string; mood: number; journal?: string | null }>;
  chats: Array<{
    id: string;
    startedAt: string;
    endedAt: string | null;
    sessionNotes: string | null;
    mentor: { username: string; email: string } | null;
    messages: Array<{
      id: string;
      sender: string;
      content: string;
      createdAt: string;
    }>;
  }>;
};

type BlogPost = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
};

const caseStatusOptions = ["Active", "Monitoring", "Resolved", "Escalated"];

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const prettyDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}`;
};

const getMoodCellClass = (count: number, avgMood: number, hasMoodData?: boolean, engagementCount?: number) => {
  if (count === 0) {
    return "bg-slate-300/30";
  }

  if (!hasMoodData && (engagementCount || 0) > 0) {
    if ((engagementCount || 0) >= 10) {
      return "bg-sky-500/75";
    }

    if ((engagementCount || 0) >= 5) {
      return "bg-sky-500/60";
    }

    return "bg-sky-500/45";
  }

  if (avgMood <= 1.8) {
    return "bg-red-500/80";
  }

  if (avgMood <= 2.5) {
    return "bg-amber-500/80";
  }

  if (avgMood <= 3.5) {
    return "bg-sky-500/70";
  }

  return "bg-emerald-500/80";
};

const AdminDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "volunteers" | "cases" | "reports">("overview");
  const [stats, setStats] = useState<DashboardStats>({
    totalYouth: 0,
    totalVolunteers: 0,
    pendingVolunteers: 0,
    approvedVolunteers: 0,
    activeChats: 0,
    totalSessions: 0,
    activeCrisisFlags: 0,
  });
  const [crisisFlags, setCrisisFlags] = useState<CrisisFlag[]>([]);
  const [moodHeatmap, setMoodHeatmap] = useState<HeatmapDay[]>([]);
  const [activityByDay, setActivityByDay] = useState<ActivityDay[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [cases, setCases] = useState<YouthCase[]>([]);
  const [selectedCaseUserId, setSelectedCaseUserId] = useState<string>("");
  const [selectedCaseDetails, setSelectedCaseDetails] = useState<CaseDetails | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostAuthor, setNewPostAuthor] = useState("");
  const [reassignMentorUserId, setReassignMentorUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const approvedMentors = useMemo(
    () => volunteers.filter((volunteer) => volunteer.approvalStatus === "approved"),
    [volunteers]
  );

  const staticActivitySeries = useMemo<ActivityPoint[]>(() => {
    const seed = [
      { sessions: 4, messages: 28, newUsers: 2, newVolunteers: 0 },
      { sessions: 5, messages: 33, newUsers: 1, newVolunteers: 1 },
      { sessions: 3, messages: 21, newUsers: 1, newVolunteers: 0 },
      { sessions: 6, messages: 40, newUsers: 2, newVolunteers: 1 },
      { sessions: 7, messages: 45, newUsers: 3, newVolunteers: 1 },
      { sessions: 5, messages: 34, newUsers: 1, newVolunteers: 0 },
      { sessions: 6, messages: 38, newUsers: 2, newVolunteers: 1 },
      { sessions: 8, messages: 52, newUsers: 3, newVolunteers: 1 },
      { sessions: 7, messages: 47, newUsers: 2, newVolunteers: 0 },
      { sessions: 6, messages: 42, newUsers: 2, newVolunteers: 1 },
      { sessions: 9, messages: 57, newUsers: 4, newVolunteers: 1 },
      { sessions: 8, messages: 55, newUsers: 3, newVolunteers: 1 },
      { sessions: 10, messages: 62, newUsers: 4, newVolunteers: 2 },
      { sessions: 9, messages: 58, newUsers: 3, newVolunteers: 1 },
    ];

    let runningUsers = 120;
    let runningVolunteers = 28;

    return seed.map((entry, idx) => {
      const offset = 13 - idx;
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = toDateKey(date);

      runningUsers += entry.newUsers;
      runningVolunteers += entry.newVolunteers;

      return {
        date: key,
        label: prettyDate(key),
        sessions: entry.sessions,
        messages: entry.messages,
        newUsers: entry.newUsers,
        newVolunteers: entry.newVolunteers,
        totalUsers: runningUsers,
        totalVolunteers: runningVolunteers,
      };
    });
  }, []);

  const activitySeries = useMemo(() => {
    const dataMap = new Map(activityByDay.map((entry) => [entry.date, entry]));
    const totalNewUsers14d = activityByDay.reduce((sum, entry) => sum + (entry.newUsers || 0), 0);
    const totalNewVolunteers14d = activityByDay.reduce((sum, entry) => sum + (entry.newVolunteers || 0), 0);
    let runningUsers = Math.max(0, stats.totalYouth - totalNewUsers14d);
    let runningVolunteers = Math.max(0, stats.totalVolunteers - totalNewVolunteers14d);

    const points: ActivityPoint[] = [];

    for (let offset = 13; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = toDateKey(date);
      const row = dataMap.get(key);
      const newUsers = row?.newUsers || 0;
      const newVolunteers = row?.newVolunteers || 0;

      runningUsers += newUsers;
      runningVolunteers += newVolunteers;

      points.push({
        date: key,
        label: prettyDate(key),
        sessions: row?.sessions || 0,
        messages: row?.messages || 0,
        newUsers,
        newVolunteers,
        totalUsers: runningUsers,
        totalVolunteers: runningVolunteers,
      });
    }

    return points;
  }, [activityByDay, stats.totalYouth, stats.totalVolunteers]);

  const hasLiveActivityData = useMemo(
    () => activitySeries.some((entry) => (
      entry.sessions > 0 || entry.messages > 0 || entry.newUsers > 0 || entry.newVolunteers > 0
    )),
    [activitySeries]
  );

  const graphSeries = hasLiveActivityData ? activitySeries : staticActivitySeries;

  const moodHeatmapSeries = useMemo(() => {
    const dataMap = new Map(moodHeatmap.map((entry) => [entry.date, entry]));
    const points: Array<{
      date: string;
      label: string;
      count: number;
      avgMood: number;
      hasMoodData: boolean;
      engagementCount: number;
      colorClass: string;
    }> = [];

    for (let offset = 29; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = toDateKey(date);
      const row = dataMap.get(key);
      const count = row?.count || 0;
      const avgMood = row?.avgMood || 0;
      const hasMoodData = Boolean(row?.hasMoodData);
      const engagementCount = row?.engagementCount || 0;

      points.push({
        date: key,
        label: prettyDate(key),
        count,
        avgMood,
        hasMoodData,
        engagementCount,
        colorClass: getMoodCellClass(count, avgMood, hasMoodData, engagementCount),
      });
    }

    return points;
  }, [moodHeatmap]);

  const staticHeatmapSeries = useMemo(() => {
    const seed = [
      { count: 4, avgMood: 2.4 }, { count: 5, avgMood: 2.8 }, { count: 6, avgMood: 3.1 },
      { count: 4, avgMood: 3.6 }, { count: 7, avgMood: 2.2 }, { count: 3, avgMood: 3.9 },
      { count: 5, avgMood: 3.2 }, { count: 8, avgMood: 2.1 }, { count: 6, avgMood: 2.7 },
      { count: 7, avgMood: 3.4 }, { count: 5, avgMood: 3.8 }, { count: 4, avgMood: 2.5 },
      { count: 6, avgMood: 2.9 }, { count: 7, avgMood: 3.3 }, { count: 5, avgMood: 3.7 },
      { count: 8, avgMood: 2.0 }, { count: 6, avgMood: 2.6 }, { count: 5, avgMood: 3.0 },
      { count: 7, avgMood: 3.5 }, { count: 6, avgMood: 3.2 }, { count: 4, avgMood: 2.3 },
      { count: 8, avgMood: 2.4 }, { count: 5, avgMood: 2.9 }, { count: 6, avgMood: 3.4 },
      { count: 7, avgMood: 3.1 }, { count: 5, avgMood: 3.6 }, { count: 6, avgMood: 2.8 },
      { count: 9, avgMood: 2.2 }, { count: 7, avgMood: 2.7 }, { count: 6, avgMood: 3.3 },
    ];

    return seed.map((entry, idx) => {
      const offset = 29 - idx;
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = toDateKey(date);

      return {
        date: key,
        label: prettyDate(key),
        count: entry.count,
        avgMood: entry.avgMood,
        hasMoodData: true,
        engagementCount: 0,
        colorClass: getMoodCellClass(entry.count, entry.avgMood, true, 0),
      };
    });
  }, []);

  const hasLiveHeatmapData = useMemo(
    () => moodHeatmapSeries.some((entry) => entry.count > 0 || entry.engagementCount > 0),
    [moodHeatmapSeries]
  );

  const heatmapSeries = hasLiveHeatmapData ? moodHeatmapSeries : staticHeatmapSeries;

  const totalsFromActivity = useMemo(() => {
    return graphSeries.reduce(
      (acc, item) => {
        acc.sessions += item.sessions;
        acc.messages += item.messages;
        acc.newUsers += item.newUsers;
        acc.newVolunteers += item.newVolunteers;
        return acc;
      },
      { sessions: 0, messages: 0, newUsers: 0, newVolunteers: 0 }
    );
  }, [graphSeries]);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [dashboardRes, volunteersRes, casesRes, postsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getVolunteers(),
        adminAPI.getCases(),
        adminAPI.getBlogPosts(),
      ]);

      setStats((prev) => ({ ...prev, ...(dashboardRes.stats || {}) }));
      setCrisisFlags((prev) => (Array.isArray(dashboardRes.crisisFlags) ? dashboardRes.crisisFlags : prev));
      setMoodHeatmap((prev) => (Array.isArray(dashboardRes.moodHeatmap) ? dashboardRes.moodHeatmap : prev));
      setActivityByDay((prev) => (Array.isArray(dashboardRes.activityByDay) ? dashboardRes.activityByDay : prev));
      setVolunteers((prev) => (Array.isArray(volunteersRes.volunteers) ? volunteersRes.volunteers : prev));
      setCases((prev) => (Array.isArray(casesRes.cases) ? casesRes.cases : prev));
      setBlogPosts((prev) => (Array.isArray(postsRes.posts) ? postsRes.posts : prev));

      const availableCases = Array.isArray(casesRes.cases) ? casesRes.cases : [];
      const nextSelectedCaseId = availableCases.some((item) => item.youthUserId === selectedCaseUserId)
        ? selectedCaseUserId
        : (availableCases[0]?.youthUserId || "");

      if (nextSelectedCaseId && nextSelectedCaseId !== selectedCaseUserId) {
        setSelectedCaseUserId(nextSelectedCaseId);
      }

      if (nextSelectedCaseId) {
        const details = await adminAPI.getCaseDetails(nextSelectedCaseId);
        setSelectedCaseDetails(details);
      }
    } catch (error) {
      toast({
        title: "Unable to load admin dashboard",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCaseDetails = async (youthUserId: string) => {
    if (!youthUserId) {
      return;
    }

    try {
      const result = await adminAPI.getCaseDetails(youthUserId);
      setSelectedCaseDetails(result);
      setReassignMentorUserId("");
    } catch (error) {
      toast({
        title: "Unable to load case details",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (selectedCaseUserId) {
      loadCaseDetails(selectedCaseUserId);
    }
  }, [selectedCaseUserId]);

  const handleVolunteerApproval = async (mentorUserId: string, status: "approved" | "rejected") => {
    try {
      await adminAPI.updateVolunteerApproval(mentorUserId, status);
      toast({ title: `Volunteer ${status}` });
      await loadAll();
    } catch (error) {
      toast({
        title: "Unable to update volunteer",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCaseStatusUpdate = async (status: string) => {
    if (!selectedCaseUserId) {
      return;
    }

    try {
      await adminAPI.updateCaseStatus(selectedCaseUserId, status);
      toast({ title: `Case moved to ${status}` });
      await loadAll();
      await loadCaseDetails(selectedCaseUserId);
    } catch (error) {
      toast({
        title: "Unable to update case status",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReassignMentor = async () => {
    if (!selectedCaseUserId || !reassignMentorUserId) {
      return;
    }

    try {
      const result = await adminAPI.reassignCaseMentor(selectedCaseUserId, reassignMentorUserId);
      toast({
        title: "Mentor reassigned",
        description: result.handoverSummary || "AI handover summary generated.",
      });
      await loadAll();
      await loadCaseDetails(selectedCaseUserId);
    } catch (error) {
      toast({
        title: "Unable to reassign mentor",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: "csv" | "pdf") => {
    try {
      const blob = await adminAPI.exportReport(format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mindbridge-report.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: `${format.toUpperCase()} report downloaded` });
    } catch (error) {
      toast({
        title: "Report export failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePublishPost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({
        title: "Title and content required",
        variant: "destructive",
      });
      return;
    }

    try {
      await adminAPI.publishBlogPost({
        title: newPostTitle,
        content: newPostContent,
        author: newPostAuthor,
      });
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostAuthor("");
      toast({ title: "Update published to About page blog" });
      const postsRes = await adminAPI.getBlogPosts();
      setBlogPosts(postsRes.posts || []);
    } catch (error) {
      toast({
        title: "Unable to publish update",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const statCards = [
    { label: "Total Youth", value: stats.totalYouth, icon: Users },
    { label: "Volunteers", value: stats.totalVolunteers, icon: UserCheck },
    { label: "Pending Volunteers", value: stats.pendingVolunteers, icon: Shield },
    { label: "Active Chats", value: stats.activeChats, icon: MessageCircle },
    { label: "Total Sessions", value: stats.totalSessions, icon: TrendingUp },
    { label: "Crisis Flags", value: stats.activeCrisisFlags, icon: AlertTriangle },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">NGO Admin Command Center</h1>
          <p className="text-sm text-muted-foreground">Overview, volunteer governance, case operations, and reports</p>
        </div>
        <Button onClick={loadAll} variant="outline" className="rounded-full" disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          ["overview", "Overview Dashboard"],
          ["volunteers", "Volunteer Management"],
          ["cases", "Youth Case Management"],
          ["reports", "Reports & Publishing"],
        ].map(([id, label]) => (
          <Button
            key={id}
            variant={activeTab === id ? "default" : "outline"}
            onClick={() => setActiveTab(id as "overview" | "volunteers" | "cases" | "reports")}
            className="rounded-full"
          >
            {label}
          </Button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
            {statCards.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                <BarChart3 className="h-4 w-4 text-primary" /> Mood Heatmap (30 days)
              </h2>
              <div className="grid grid-cols-10 gap-2">
                {heatmapSeries.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date} • logs: ${day.count} • avg mood: ${day.avgMood}`}
                    className={`h-8 rounded-md border border-border/70 transition-all duration-500 hover:scale-110 animate-in fade-in zoom-in-95 ${day.colorClass}`}
                  />
                ))}
              </div>
              {!hasLiveHeatmapData && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing static sample heatmap until live mood/activity data is available.
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>Low</span>
                <span className="h-3 w-3 rounded-sm bg-red-500/80" />
                <span className="h-3 w-3 rounded-sm bg-amber-500/80" />
                <span className="h-3 w-3 rounded-sm bg-sky-500/70" />
                <span className="h-3 w-3 rounded-sm bg-emerald-500/80" />
                <span>High</span>
                <span className="ml-2 rounded-full border border-border px-2 py-0.5">Blue = engagement (no mood log)</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                <TrendingUp className="h-4 w-4 text-primary" /> User & Volunteer Update Graph (14 days)
              </h2>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={graphSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="newUsers"
                      name="Daily New Users"
                      fill="#6366f1"
                      opacity={0.32}
                      radius={[4, 4, 0, 0]}
                      animationDuration={700}
                    />
                    <Bar
                      dataKey="newVolunteers"
                      name="Daily New Volunteers"
                      fill="#10b981"
                      opacity={0.3}
                      radius={[4, 4, 0, 0]}
                      animationDuration={700}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalVolunteers"
                      name="Total Volunteers"
                      stroke="#10b981"
                      strokeWidth={2.8}
                      dot={false}
                      isAnimationActive
                      animationDuration={900}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalUsers"
                      name="Total Users"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={false}
                      isAnimationActive
                      animationDuration={900}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              {!hasLiveActivityData && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing static sample visualization until live activity data is available.
                </p>
              )}
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-border p-2 text-muted-foreground">14d Sessions: {totalsFromActivity.sessions}</div>
                <div className="rounded-lg border border-border p-2 text-muted-foreground">14d Messages: {totalsFromActivity.messages}</div>
                <div className="rounded-lg border border-border p-2 text-muted-foreground">14d New Users: {totalsFromActivity.newUsers}</div>
                <div className="rounded-lg border border-border p-2 text-muted-foreground">14d New Volunteers: {totalsFromActivity.newVolunteers}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Crisis Flags
            </h2>
            <div className="space-y-2">
              {(crisisFlags.length === 0 ? [{ id: "empty", reason: "No active crisis flags", status: "Resolved", severity: "low", createdAt: new Date().toISOString() }] : crisisFlags).map((flag) => (
                <div key={flag.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 text-xs">
                  <div>
                    <p className="font-medium text-foreground">{flag.reason}</p>
                    <p className="text-muted-foreground">{new Date(flag.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-warning/10 px-2 py-1 text-warning">{flag.severity}</span>
                    <span className="rounded-full bg-destructive/10 px-2 py-1 text-destructive">{flag.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "volunteers" && (
        <div className="space-y-4">
          {(volunteers.length === 0 ? [] : volunteers).map((volunteer) => (
            <div key={volunteer.userId} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{volunteer.user.username}</h3>
                  <p className="text-xs text-muted-foreground">{volunteer.user.email}</p>
                  <p className="text-xs text-muted-foreground">Expertise: {(volunteer.expertise || []).join(", ") || "None"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    volunteer.approvalStatus === "approved"
                      ? "bg-accent/10 text-accent"
                      : volunteer.approvalStatus === "rejected"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-warning/10 text-warning"
                  }`}>
                    {volunteer.approvalStatus}
                  </span>
                  <Button size="sm" onClick={() => handleVolunteerApproval(volunteer.userId, "approved")} className="rounded-full">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleVolunteerApproval(volunteer.userId, "rejected")} className="rounded-full">
                    Reject
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 text-xs sm:grid-cols-3">
                <div className="rounded-xl border border-border p-3">
                  <p className="font-medium text-foreground">Total Sessions</p>
                  <p className="text-muted-foreground">{volunteer.performance.totalSessions}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="font-medium text-foreground">Completed Sessions</p>
                  <p className="text-muted-foreground">{volunteer.performance.completedSessions}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="font-medium text-foreground">Avg Messages / Session</p>
                  <p className="text-muted-foreground">{volunteer.performance.avgMessagesPerSession}</p>
                </div>
              </div>

              <details className="mt-4 rounded-xl border border-border p-3">
                <summary className="cursor-pointer text-sm font-medium text-foreground">Session-by-session breakdown</summary>
                <div className="mt-3 space-y-2">
                  {(volunteer.sessions.length === 0
                    ? [{ chatId: "none", youthName: "No sessions yet", startedAt: new Date().toISOString(), endedAt: null, messageCount: 0, sessionNotes: "" }]
                    : volunteer.sessions).map((session) => (
                    <div key={session.chatId} className="rounded-lg border border-border p-3 text-xs">
                      <p className="font-medium text-foreground">{session.youthName}</p>
                      <p className="text-muted-foreground">Messages: {session.messageCount}</p>
                      <p className="text-muted-foreground">
                        {new Date(session.startedAt).toLocaleString()} → {session.endedAt ? new Date(session.endedAt).toLocaleString() : "Ongoing"}
                      </p>
                      {session.sessionNotes ? <p className="mt-1 text-muted-foreground">Notes: {session.sessionNotes}</p> : null}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}

          {volunteers.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
              No volunteers found.
            </div>
          )}
        </div>
      )}

      {activeTab === "cases" && (
        <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <Users className="h-4 w-4 text-primary" /> Youth Cases
            </h2>
            <div className="space-y-2">
              {(cases.length === 0 ? [] : cases).map((entry) => (
                <button
                  key={entry.youthUserId}
                  onClick={() => setSelectedCaseUserId(entry.youthUserId)}
                  className={`w-full rounded-xl border p-3 text-left text-xs transition-all ${
                    selectedCaseUserId === entry.youthUserId
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <p className="font-medium text-foreground">{entry.username}</p>
                  <p className="text-muted-foreground">Status: {entry.caseStatus}</p>
                  <p className="text-muted-foreground">Mentor: {entry.mentor?.username || "Unassigned"}</p>
                </button>
              ))}
              {cases.length === 0 && <p className="text-xs text-muted-foreground">No youth cases found.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            {!selectedCaseDetails ? (
              <p className="text-sm text-muted-foreground">Select a case to view full history.</p>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{selectedCaseDetails.youth.username}</h3>
                    <p className="text-xs text-muted-foreground">Issues: {selectedCaseDetails.youth.selectedIssues.join(", ") || "None"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {caseStatusOptions.map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={selectedCaseDetails.caseStatus === status ? "default" : "outline"}
                        className="rounded-full text-xs"
                        onClick={() => handleCaseStatusUpdate(status)}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border p-3 text-xs">
                  <p className="font-medium text-foreground">Current Mentor</p>
                  <p className="text-muted-foreground">{selectedCaseDetails.assignment?.mentor?.username || "No mentor assigned"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      value={reassignMentorUserId}
                      onChange={(event) => setReassignMentorUserId(event.target.value)}
                      title="Select approved mentor"
                      aria-label="Select approved mentor"
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                    >
                      <option value="">Select approved mentor</option>
                      {approvedMentors.map((mentor) => (
                        <option key={mentor.userId} value={mentor.userId}>
                          {mentor.user.username} ({mentor.user.email})
                        </option>
                      ))}
                    </select>
                    <Button size="sm" className="rounded-full" onClick={handleReassignMentor} disabled={!reassignMentorUserId}>
                      <UserCheck className="mr-1 h-3 w-3" /> Reassign Mentor
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-border p-3 text-xs">
                  <p className="mb-2 font-medium text-foreground">Mood Trend</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(selectedCaseDetails.moodTrend.length === 0
                      ? [{ date: new Date().toISOString(), mood: 0, journal: "No mood logs" }]
                      : selectedCaseDetails.moodTrend.slice(-8)).map((entry, idx) => (
                      <div key={`${entry.date}-${idx}`} className="rounded-lg border border-border p-2">
                        <p className="text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</p>
                        <p className="font-medium text-foreground">Mood: {entry.mood}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border p-3 text-xs">
                  <p className="mb-2 font-medium text-foreground">Session Notes</p>
                  <div className="space-y-2">
                    {(selectedCaseDetails.caseHistory?.sessionNotes?.length
                      ? selectedCaseDetails.caseHistory.sessionNotes
                      : ["No session notes yet."]).map((note, idx) => (
                      <div key={`${idx}-${note.slice(0, 20)}`} className="rounded-lg border border-border p-2 text-muted-foreground">
                        {note}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border p-3 text-xs">
                  <p className="mb-2 font-medium text-foreground">Full Chat History</p>
                  <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                    {(selectedCaseDetails.chats.length === 0
                      ? [{ id: "none", startedAt: new Date().toISOString(), endedAt: null, sessionNotes: null, mentor: null, messages: [{ id: "placeholder", sender: "system", content: "No chat sessions yet.", createdAt: new Date().toISOString() }] }]
                      : selectedCaseDetails.chats).map((chat) => (
                      <div key={chat.id} className="rounded-lg border border-border p-3">
                        <p className="mb-2 font-medium text-foreground">
                          Session {new Date(chat.startedAt).toLocaleString()} {chat.mentor ? `with ${chat.mentor.username}` : ""}
                        </p>
                        <div className="space-y-1">
                          {chat.messages.map((message) => (
                            <p key={message.id} className="text-muted-foreground">
                              <span className="font-medium text-foreground">{message.sender}:</span> {message.content}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <Download className="h-4 w-4 text-primary" /> Export Reports
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleExport("csv")} className="rounded-full">
                <FileText className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button onClick={() => handleExport("pdf")} variant="outline" className="rounded-full">
                <Shield className="mr-2 h-4 w-4" /> Export PDF
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <BarChart3 className="h-4 w-4 text-primary" /> Publish About Page Updates
            </h2>
            <div className="space-y-3">
              <Input value={newPostTitle} onChange={(event) => setNewPostTitle(event.target.value)} placeholder="Article title" />
              <Input value={newPostAuthor} onChange={(event) => setNewPostAuthor(event.target.value)} placeholder="Author (optional)" />
              <textarea
                value={newPostContent}
                onChange={(event) => setNewPostContent(event.target.value)}
                placeholder="Write update content"
                className="min-h-[140px] w-full rounded-xl border border-border bg-background p-3 text-sm outline-none"
              />
              <Button onClick={handlePublishPost} className="rounded-full">Publish Update</Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 font-semibold text-foreground">Published Updates</h2>
            <div className="space-y-2">
              {(blogPosts.length === 0
                ? [{ id: "none", title: "No updates yet", content: "Publish from this panel to show on About page.", author: "Admin", createdAt: new Date().toISOString() }]
                : blogPosts).map((post) => (
                <div key={post.id} className="rounded-xl border border-border p-3 text-xs">
                  <p className="font-medium text-foreground">{post.title}</p>
                  <p className="text-muted-foreground">{post.content}</p>
                  <p className="mt-1 text-muted-foreground">By {post.author} • {new Date(post.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
