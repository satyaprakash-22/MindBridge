import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Shield, Users, Bot, BarChart3, MessageCircle, BookOpen,
  ArrowRight, Heart, CheckCircle
} from "lucide-react";

const stats = [
  { value: "50%", label: "Mental health conditions begin before age 14" },
  { value: "90%", label: "Affected youth in low-income settings get no care" },
  { value: "1 in 7", label: "Adolescents globally have a mental health condition" },
];

const features = [
  { icon: Shield, title: "Anonymous & Safe", desc: "No real name, no email. Your identity stays private — always." },
  { icon: Users, title: "Peer Mentors", desc: "Trained volunteers who listen, guide, and walk with you." },
  { icon: Bot, title: "AI Bridge", desc: "When your mentor is away, AI steps in — clearly labeled, never pretending." },
  { icon: BarChart3, title: "NGO Dashboard", desc: "Real-time data helps Youngistaan Foundation measure and improve impact." },
  { icon: MessageCircle, title: "Safe Forum", desc: "Share your thoughts anonymously. Upvote only — positivity by design." },
  { icon: BookOpen, title: "Resource Hub", desc: "Articles, exercises, podcasts — filtered by mood and language." },
];

const steps = [
  { num: "01", title: "Sign Up Anonymously", desc: "Choose a username, age bracket, and city. No personal details needed." },
  { num: "02", title: "Get Matched", desc: "Our engine finds you the best mentor based on your needs and language." },
  { num: "03", title: "Start Talking", desc: "Chat with your mentor privately. Track your mood. Grow at your pace." },
];

const Landing = () => {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero px-4 py-20 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_60%)]" />
        <div className="container relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground">
            <Heart className="h-3.5 w-3.5" /> Built for Youngistaan Foundation
          </div>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-primary-foreground md:text-6xl">
            Bridging youth to support,{" "}
            <span className="text-accent">one conversation</span>{" "}
            at a time
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-primary-foreground/80">
            Safe, anonymous, human-led mental health support for adolescents aged 13–18 across India. 
            Because every young mind deserves to be heard.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/get-support">
              <Button size="lg" className="rounded-full bg-accent px-8 text-accent-foreground hover:bg-accent/90">
                Get Support <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/mentor-login">
              <Button size="lg" variant="outline" className="rounded-full border-primary-foreground/30 bg-primary-foreground/10 px-8 text-primary-foreground hover:bg-primary-foreground/20">
                I'm a Volunteer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Impact stats */}
      <section className="border-b border-border bg-muted/30 px-4 py-12">
        <div className="container mx-auto grid gap-6 md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.value} className="text-center">
              <p className="text-3xl font-extrabold text-primary md:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20">
        <div className="container mx-auto">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-foreground">Everything you need to feel supported</h2>
            <p className="text-muted-foreground">Built with safety, privacy, and genuine human connection at the core.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/30 px-4 py-20">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-foreground">How MindBridge Works</h2>
            <p className="text-muted-foreground">Three simple steps to start your journey.</p>
          </div>
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.num} className="flex gap-5 rounded-2xl border border-border bg-card p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-hero text-lg font-bold text-primary-foreground">
                  {step.num}
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/get-support">
              <Button size="lg" className="rounded-full bg-gradient-hero px-8 text-primary-foreground hover:opacity-90">
                Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="px-4 py-12">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="flex flex-col items-center gap-3">
            {["100% Anonymous — No real name or email ever stored",
              "Human-first — AI only steps in when your mentor is away",
              "Trusted by Youngistaan Foundation NGO"].map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-accent" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
