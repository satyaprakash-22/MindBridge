import { useMemo, useState } from "react";
import { BookOpen, HeartPulse, GraduationCap, Heart, Users, FileText, Activity, Headphones, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ResourceCategory = "all" | "mental-health" | "academic" | "wellness" | "stories";
type ResourceType = "all" | "article" | "exercise" | "podcast";

type ResourceItem = {
  id: string;
  title: string;
  summary: string;
  author: string;
  category: Exclude<ResourceCategory, "all">;
  type: Exclude<ResourceType, "all">;
  detail: {
    domain: string;
    estimatedTime: string;
    quickSummary: string;
    takeaways: string[];
    actionPlan: string[];
    reflectionPrompt: string;
  };
};

const resources: ResourceItem[] = [
  {
    id: "r1",
    title: "Understanding Anxiety",
    summary: "Learn about anxiety symptoms and coping strategies.",
    author: "MindBridge Team",
    category: "mental-health",
    type: "article",
    detail: {
      domain: "Mental Health",
      estimatedTime: "7 min read",
      quickSummary:
        "Anxiety is the body's alert system working overtime. This resource explains how anxious thoughts, body sensations, and avoidance habits form a cycle, and how to break it with grounding and realistic self-talk.",
      takeaways: [
        "Notice your top 3 anxiety triggers and the body signals that appear first.",
        "Name the thought pattern: catastrophe, mind-reading, or all-or-nothing thinking.",
        "Use a 60-second grounding reset before reacting.",
      ],
      actionPlan: [
        "Pause and do 4 slow breaths: in for 4, out for 6.",
        "Write one fear sentence, then rewrite a balanced version.",
        "Pick one small action that proves you can handle the moment.",
      ],
      reflectionPrompt: "What thought shows up most often when stress starts, and what kinder replacement can you practice?",
    },
  },
  {
    id: "r2",
    title: "5-Minute Breathing Exercise",
    summary: "A quick breathing technique to calm your mind.",
    author: "Wellness Team",
    category: "wellness",
    type: "exercise",
    detail: {
      domain: "Wellness",
      estimatedTime: "5 min exercise",
      quickSummary:
        "This guided breathing routine helps your nervous system shift from panic mode to calm mode. It combines posture, paced breathing, and a short body scan for fast relief.",
      takeaways: [
        "Breathing longer on the exhale helps reduce tension quickly.",
        "Posture matters: relaxed shoulders and unclenched jaw improve breathing quality.",
        "A short body scan prevents stress from building unnoticed.",
      ],
      actionPlan: [
        "Sit upright, place one hand on chest and one on belly.",
        "Breathe in for 4 counts, out for 6 counts, repeat 10 rounds.",
        "End by relaxing forehead, jaw, shoulders, and hands.",
      ],
      reflectionPrompt: "After this exercise, where in your body do you feel the biggest difference?",
    },
  },
  {
    id: "r3",
    title: "Dealing with Academic Pressure",
    summary: "Tips for managing school stress and expectations.",
    author: "Education Support",
    category: "academic",
    type: "article",
    detail: {
      domain: "Academic",
      estimatedTime: "8 min read",
      quickSummary:
        "Academic pressure becomes lighter when tasks are broken down into realistic steps. This resource helps you move from overwhelm to a clear weekly study plan.",
      takeaways: [
        "Pressure rises when goals are vague; clarity lowers stress.",
        "A 45/10 focus cycle is often better than long unplanned study blocks.",
        "Tracking progress daily improves confidence and consistency.",
      ],
      actionPlan: [
        "List all tasks due this week and rank by urgency and weight.",
        "Create three focus blocks per day with one specific goal each.",
        "Use a nightly 5-minute review to adjust tomorrow's plan.",
      ],
      reflectionPrompt: "Which one school task feels heavy right now, and what is the smallest next step you can take today?",
    },
  },
  {
    id: "r4",
    title: "Podcast: Teen Voices",
    summary: "Real stories from teens about overcoming challenges.",
    author: "Youth Media",
    category: "stories",
    type: "podcast",
    detail: {
      domain: "Stories",
      estimatedTime: "12 min listen",
      quickSummary:
        "Teen Voices shares short stories about setbacks, support, and recovery. Listening to peer experiences can reduce isolation and offer practical coping ideas.",
      takeaways: [
        "Many teens feel similar pressure even when it looks like they are doing fine.",
        "Small support systems (one friend, one mentor) can change outcomes.",
        "Recovery is rarely linear; setbacks are part of progress.",
      ],
      actionPlan: [
        "Listen with a notebook and mark one idea that feels relatable.",
        "Write one sentence: If they can try again, I can try ___.",
        "Share one takeaway with a friend or mentor.",
      ],
      reflectionPrompt: "Which story felt closest to your own experience, and why?",
    },
  },
  {
    id: "r5",
    title: "Sleep Reset Guide",
    summary: "Build a simple nightly routine for better rest.",
    author: "Wellness Team",
    category: "wellness",
    type: "article",
    detail: {
      domain: "Wellness",
      estimatedTime: "6 min read",
      quickSummary:
        "Better sleep starts with rhythm, not perfection. This guide helps you set a realistic wind-down routine that improves sleep quality over one week.",
      takeaways: [
        "A stable sleep-wake window is more important than sleeping early once.",
        "Screen intensity near bedtime can delay sleep signals.",
        "A short routine trains your brain to switch into rest mode.",
      ],
      actionPlan: [
        "Set a fixed wake-up time for the next 7 days.",
        "Reduce bright screens 30 minutes before bed.",
        "Use one calming cue: stretching, reading, or soft audio.",
      ],
      reflectionPrompt: "What bedtime habit currently steals your sleep, and what is your replacement habit?",
    },
  },
  {
    id: "r6",
    title: "Study Focus Sprint",
    summary: "A 15-minute focus exercise for exam preparation.",
    author: "Education Support",
    category: "academic",
    type: "exercise",
    detail: {
      domain: "Academic",
      estimatedTime: "15 min exercise",
      quickSummary:
        "This sprint method improves concentration by combining short planning, timed focus, and quick review. It is ideal when motivation is low but deadlines are near.",
      takeaways: [
        "Starting with one clear target reduces procrastination.",
        "Short timed sessions can outperform long distracted sessions.",
        "A 2-minute recap locks learning and reveals weak spots quickly.",
      ],
      actionPlan: [
        "Set one micro-goal (for example: solve 5 problems).",
        "Run a 12-minute timer with all notifications off.",
        "Take 3 minutes to review mistakes and log next step.",
      ],
      reflectionPrompt: "What subject benefits most from focus sprints for you right now?",
    },
  },
  {
    id: "r7",
    title: "Overthinking Reset",
    summary: "A practical method to stop looping thoughts and regain mental clarity.",
    author: "MindBridge Team",
    category: "mental-health",
    type: "article",
    detail: {
      domain: "Mental Health",
      estimatedTime: "6 min read",
      quickSummary:
        "Overthinking often comes from uncertainty and fear of making mistakes. This guide helps you separate useful planning from repetitive worry so you can move forward with calmer decisions.",
      takeaways: [
        "You cannot solve every future scenario by thinking harder.",
        "Naming the thought loop lowers its intensity.",
        "Action creates relief faster than rumination.",
      ],
      actionPlan: [
        "Write the looping thought in one sentence.",
        "Ask: Is this a real problem now or a maybe-later fear?",
        "Choose one 10-minute action and begin immediately.",
      ],
      reflectionPrompt: "What thought loop visits you most, and what action can interrupt it next time?",
    },
  },
  {
    id: "r8",
    title: "Exam Week Planner",
    summary: "A day-by-day structure to reduce stress during exam season.",
    author: "Education Support",
    category: "academic",
    type: "article",
    detail: {
      domain: "Academic",
      estimatedTime: "9 min read",
      quickSummary:
        "Exam stress decreases when your plan is realistic and visible. This planner helps you divide subjects by priority, energy levels, and revision weight so you avoid last-minute panic.",
      takeaways: [
        "A visible plan lowers uncertainty and improves confidence.",
        "Hard subjects need earlier repetition, not longer sessions on one day.",
        "Recovery breaks are part of performance, not a waste of time.",
      ],
      actionPlan: [
        "Divide subjects into high, medium, and low confidence.",
        "Assign morning focus to hard topics and evening review to lighter topics.",
        "Reserve one daily 30-minute buffer for unfinished work.",
      ],
      reflectionPrompt: "Which exam topic causes the most stress, and where will you place it in tomorrow's plan?",
    },
  },
  {
    id: "r9",
    title: "Hydration + Energy Check",
    summary: "Simple daily habits to improve focus, mood, and physical energy.",
    author: "Wellness Team",
    category: "wellness",
    type: "exercise",
    detail: {
      domain: "Wellness",
      estimatedTime: "4 min setup",
      quickSummary:
        "Low energy often comes from skipped hydration and irregular fuel. This micro-plan helps you maintain stable energy through small routines that are easy to sustain during busy days.",
      takeaways: [
        "Even mild dehydration can reduce concentration.",
        "Energy crashes are often linked to long gaps without food or water.",
        "Tiny habits repeated daily beat strict plans you cannot maintain.",
      ],
      actionPlan: [
        "Start your day with one full glass of water.",
        "Set two reminders for hydration before afternoon.",
        "Pair study blocks with a quick stretch and water sip.",
      ],
      reflectionPrompt: "At what time of day does your energy drop most, and what one habit can protect that time?",
    },
  },
  {
    id: "r10",
    title: "Self-Compassion After Setbacks",
    summary: "Learn to recover from mistakes without harsh self-judgment.",
    author: "MindBridge Team",
    category: "mental-health",
    type: "article",
    detail: {
      domain: "Mental Health",
      estimatedTime: "7 min read",
      quickSummary:
        "Setbacks feel heavier when self-talk turns critical. This resource teaches a self-compassion framework that helps you process mistakes, protect motivation, and restart with clarity.",
      takeaways: [
        "Harsh self-criticism often lowers performance over time.",
        "Compassionate language improves emotional recovery speed.",
        "Reflection is useful only when it leads to one practical change.",
      ],
      actionPlan: [
        "Name the setback factually without labels like 'failure'.",
        "Ask: What would I tell a friend in this same situation?",
        "Pick one adjustment and test it in your next attempt.",
      ],
      reflectionPrompt: "What is one sentence of kinder self-talk you can use when something goes wrong?",
    },
  },
  {
    id: "r11",
    title: "Deep Work Session Builder",
    summary: "Design distraction-light study sessions for difficult subjects.",
    author: "Education Support",
    category: "academic",
    type: "exercise",
    detail: {
      domain: "Academic",
      estimatedTime: "10 min setup",
      quickSummary:
        "Deep work sessions help you understand difficult material faster by reducing context switching. This setup guide gives you a repeatable study environment with clear start and finish rules.",
      takeaways: [
        "Preparation before study matters as much as study time itself.",
        "Single-task sessions improve retention and confidence.",
        "Short debriefs make future sessions more effective.",
      ],
      actionPlan: [
        "Define one objective before starting.",
        "Block distractions: silent phone, one tab, one notebook.",
        "End with a 2-minute recap and one follow-up task.",
      ],
      reflectionPrompt: "What is your biggest distraction trigger during study, and how will you block it next session?",
    },
  },
  {
    id: "r12",
    title: "Evening Wind-Down Routine",
    summary: "A gentle 20-minute routine to release stress before sleep.",
    author: "Wellness Team",
    category: "wellness",
    type: "exercise",
    detail: {
      domain: "Wellness",
      estimatedTime: "20 min routine",
      quickSummary:
        "A predictable wind-down sequence helps your body transition from alert mode to rest mode. This routine combines breathing, low-light cues, and light stretching to improve sleep readiness.",
      takeaways: [
        "Consistent evening cues improve sleep quality over time.",
        "Lowering stimulation before bed reduces mind racing.",
        "A short routine is easier to maintain than perfect sleep rules.",
      ],
      actionPlan: [
        "Dim lights and avoid intense scrolling 20 minutes before bed.",
        "Do 5 minutes of neck and shoulder stretches.",
        "Finish with 10 slow breaths and one gratitude line.",
      ],
      reflectionPrompt: "Which night habit helps you feel calmest before sleep, and how can you make it consistent?",
    },
  },
];

const categoryTabs = [
  { id: "all", label: "All Resources", icon: BookOpen },
  { id: "mental-health", label: "Mental Health", icon: HeartPulse },
  { id: "academic", label: "Academic", icon: GraduationCap },
  { id: "wellness", label: "Wellness", icon: Heart },
  { id: "stories", label: "Stories", icon: Users },
] as const;

const typeTabs = [
  { id: "all", label: "All Types" },
  { id: "article", label: "Articles" },
  { id: "exercise", label: "Exercises" },
  { id: "podcast", label: "Podcasts" },
] as const;

const typeIcon = {
  article: FileText,
  exercise: Activity,
  podcast: Headphones,
};

const Resources = () => {
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory>("all");
  const [selectedType, setSelectedType] = useState<ResourceType>("all");
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);

  const filtered = useMemo(() => (
    resources.filter((item) => {
      const categoryOk = selectedCategory === "all" || item.category === selectedCategory;
      const typeOk = selectedType === "all" || item.type === selectedType;
      return categoryOk && typeOk;
    })
  ), [selectedCategory, selectedType]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 rounded-3xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold text-foreground">Explore Resources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Articles, breathing exercises, podcasts — explore at your pace.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        {categoryTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              selectedCategory === tab.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/30"
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {typeTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              selectedType === tab.id
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-background text-muted-foreground hover:border-accent/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => {
          const Icon = typeIcon[item.type];
          return (
            <div key={item.id} className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="rounded-full bg-accent/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
                  {item.type}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">By {item.author}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-primary hover:text-primary"
                  onClick={() => setSelectedResource(item)}
                >
                  Open <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          No resources match your current filters.
        </div>
      )}

      <Dialog open={Boolean(selectedResource)} onOpenChange={(open) => !open && setSelectedResource(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {selectedResource && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedResource.title}</DialogTitle>
                <DialogDescription>
                  {selectedResource.detail.domain} • {selectedResource.type} • {selectedResource.detail.estimatedTime}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="font-medium text-foreground">AI-inspired topic summary</p>
                  <p className="mt-2 text-muted-foreground">{selectedResource.detail.quickSummary}</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="font-medium text-foreground">What this resource gives you</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    {selectedResource.detail.takeaways.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="font-medium text-foreground">Try this now</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                    {selectedResource.detail.actionPlan.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-primary">Reflection Prompt</p>
                  <p className="mt-1 text-foreground">{selectedResource.detail.reflectionPrompt}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Resources;
