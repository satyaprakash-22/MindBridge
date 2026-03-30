import { useEffect, useState } from "react";
import { Heart, MapPin, Mail, Phone, Users, MessageCircle, Globe, Calendar } from "lucide-react";

const impactStats = [
  { icon: Users, value: "2,500+", label: "Youth Supported" },
  { icon: MessageCircle, value: "10,000+", label: "Sessions Conducted" },
  { icon: Globe, value: "45+", label: "Cities Reached" },
  { icon: Calendar, value: "150+", label: "Active Mentors" },
];

const teamMembers = [
  { name: "Youngistaan Foundation", role: "Founding Organization", avatar: "🏛️" },
  { name: "Peer Mentors", role: "Trained Volunteers", avatar: "🤝" },
  { name: "Mental Health Advisors", role: "Clinical Oversight", avatar: "🧠" },
  { name: "Youth Ambassadors", role: "Community Leaders", avatar: "💪" },
];

type BlogPost = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const About = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/public/blog-posts`);
        if (!response.ok) {
          return;
        }

        const result = await response.json();
        setPosts(Array.isArray(result.posts) ? result.posts : []);
      } catch (_) {
        // Keep static About page even when blog endpoint is unavailable.
      }
    };

    loadPosts();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-hero px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-extrabold text-primary-foreground md:text-5xl">
            About Youngistaan Foundation
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Empowering India's youth through mental health support, peer mentoring, and community action since day one.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-3xl">
          <h2 className="mb-4 text-2xl font-bold text-foreground">Our Mission</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            Youngistaan Foundation is a youth-led non-governmental organisation committed to building safe, accessible, and stigma-free mental health support systems for adolescents across India.
          </p>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            MindBridge is our flagship digital initiative — a platform where every young person can find someone to talk to, without fear of judgement or loss of privacy. We believe that genuine human connection is the most powerful tool for healing, and technology should amplify that — never replace it.
          </p>
          <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <p className="text-center text-sm font-medium italic text-primary">
              "No young person should ever feel alone in what they're going through. We exist to make sure they don't have to."
            </p>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="bg-muted/30 px-4 py-16">
        <div className="container mx-auto">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Our Impact</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {impactStats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <s.icon className="h-6 w-6" />
                </div>
                <p className="text-3xl font-extrabold text-foreground">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="px-4 py-16">
        <div className="container mx-auto">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Our Team</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((m) => (
              <div key={m.name} className="rounded-2xl border border-border bg-card p-6 text-center transition-all hover:shadow-md">
                <div className="mx-auto mb-3 text-4xl">{m.avatar}</div>
                <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
                <p className="text-xs text-muted-foreground">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Latest Updates</h2>
          <div className="space-y-4">
            {(posts.length === 0 ? [{
              id: "empty",
              title: "No updates published yet",
              content: "Check back soon for new articles and NGO announcements.",
              author: "MindBridge Admin",
              createdAt: new Date().toISOString(),
            }] : posts).map((post) => (
              <article key={post.id} className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{post.title}</h3>
                  <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{post.content}</p>
                <p className="mt-3 text-xs font-medium text-primary">By {post.author}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Helplines */}
      <section className="bg-muted/30 px-4 py-16">
        <div className="container mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Get In Touch</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <a href="mailto:contact@youngistaan.org" className="text-sm text-muted-foreground hover:text-primary">contact@youngistaan.org</a>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Location</p>
                <p className="text-sm text-muted-foreground">India</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="mb-4 text-center text-lg font-semibold text-foreground">
              <Heart className="mr-1 inline h-4 w-4 text-destructive" /> Crisis Helplines
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <a href="tel:9152987821" className="flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 transition-colors hover:bg-destructive/10">
                <Phone className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-foreground">iCall (TISS)</p>
                  <p className="text-sm text-muted-foreground">9152987821</p>
                </div>
              </a>
              <a href="tel:18602662345" className="flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 transition-colors hover:bg-destructive/10">
                <Phone className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Vandrevala Foundation</p>
                  <p className="text-sm text-muted-foreground">1860-2662-345</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
