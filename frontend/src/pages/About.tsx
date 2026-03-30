import { Heart, Mail, Phone, Users, MessageCircle, Globe, Calendar } from "lucide-react";

const impactStats = [
  { icon: Users, value: "Millions", label: "Lives Supported" },
  { icon: MessageCircle, value: "70,000+", label: "Young Volunteers Mobilised" },
  { icon: Globe, value: "Multi-City", label: "Grassroots and Institutional Reach" },
  { icon: Calendar, value: "10+ Years", label: "Community-Led Impact" },
];

const programAreas = [
  {
    title: "Educational Equity",
    description:
      "Early childhood education, foundational learning, academic support, mentoring, and life-skills programs that improve access to quality education for children and adolescents.",
  },
  {
    title: "Health & Adolescent Well Being",
    description:
      "Health awareness initiatives including menstrual health and hygiene, puberty education, nutrition awareness, and preventive health interventions promoting dignity and well being.",
  },
  {
    title: "Livelihoods & Hunger",
    description:
      "Food support initiatives, homeless rehabilitation, livelihood assistance, and skill-building and vocational programs aimed at improving economic resilience and dignity.",
  },
  {
    title: "Senior Saathi",
    description:
      "A platform that promotes engagement, support systems, and dignity for senior citizens through community-led initiatives.",
  },
  {
    title: "Community Well Being and Safety",
    description:
      "Disaster relief, road safety, responsible AI, animal support, WASH, climate action, and active citizenship initiatives including Youth Parliament and advocacy events.",
  },
];

const sdgGoals = [
  "Zero Hunger",
  "No Poverty",
  "Gender Equality",
  "Quality Education",
  "Good Health",
  "Responsible Consumption and Production",
  "Partnership for the Goals",
];

const About = () => {

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-hero px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-extrabold text-primary-foreground md:text-5xl">
            About Youngistaan Foundation
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Youth-led, community-centered, and impact-driven social action across India.
          </p>
        </div>
      </section>

      {/* Impact Narrative */}
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-5xl">
          <h2 className="mb-4 text-3xl font-bold text-foreground">Our Impact</h2>
          <p className="mb-5 leading-relaxed text-muted-foreground">
            Over the last decade, Youngistaan Foundation has grown into one of India&apos;s active grassroots youth-led social organizations, creating measurable impact through community engagement and partnerships. We have:
          </p>
          <ul className="mb-8 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>Supported millions of lives across underserved communities through grassroots interventions.</li>
            <li>Mobilised 70,000+ young volunteers across multiple cities.</li>
            <li>Implemented programs in partnership with government departments, institutions, and corporate partners.</li>
            <li>Strengthened access to education, health, livelihood opportunities, and community well being.</li>
          </ul>

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

      {/* Programs */}
      <section className="bg-muted/30 px-4 py-16">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-6 text-3xl font-bold text-foreground">Our Programs</h2>
          <p className="mb-8 leading-relaxed text-muted-foreground">
            Youngistaan Foundation works across interconnected thematic areas that address both immediate needs and structural challenges.
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            {programAreas.map((program) => (
              <article key={program.title} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-2 text-lg font-semibold text-foreground">{program.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{program.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-3 text-2xl font-bold text-foreground">Vision</h2>
              <p className="leading-relaxed text-muted-foreground">
                To build a compassionate and just society where every individual, regardless of background, has the opportunity to thrive with dignity, access to opportunities, and community support.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-3 text-2xl font-bold text-foreground">Mission</h2>
              <p className="leading-relaxed text-muted-foreground">
                To address key social challenges through collaborative action, community-led solutions, and youth engagement, enabling sustainable and inclusive development.
              </p>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Youngistaan Foundation works to empower underserved communities while nurturing young people as responsible leaders who drive long-term social change.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-sm leading-relaxed text-primary">
              Read more about Youngistaan Foundation&apos;s programs by clicking here or on the image to the left: {" "}
              <a
                href="https://youngistaanfoundation.org"
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline underline-offset-4"
              >
                https://youngistaanfoundation.org
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* SDGs */}
      <section className="bg-muted/30 px-4 py-16">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-4 text-3xl font-bold text-foreground">UN Sustainable Development Goals</h2>
          <p className="mb-5 leading-relaxed text-muted-foreground">
            Youngistaan Foundation projects are aligned with the following UN Sustainable Development Goals.
          </p>
          <div className="flex flex-wrap gap-2">
            {sdgGoals.map((goal) => (
              <span key={goal} className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground">
                {goal}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-4 text-3xl font-bold text-foreground">Our Approach: A Two-Way Model of Change</h2>
          <p className="mb-8 leading-relaxed text-muted-foreground">
            Youngistaan Foundation operates through an integrated model combining service-based interventions, community-led engagement, and youth participation. This enables both immediate support and long-term systemic change.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-2 text-xl font-semibold text-foreground">Community-Centered Interventions</h3>
              <p className="leading-relaxed text-muted-foreground">
                We design and implement grassroots programs that respond to the needs of underserved communities, focusing on access to education, health, livelihood opportunities, dignity, and social inclusion.
              </p>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Our interventions are developed in collaboration with communities and public systems to ensure sustainability and long-term impact.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-2 text-xl font-semibold text-foreground">Youth Engagement and Leadership Development</h3>
              <p className="leading-relaxed text-muted-foreground">
                Young people remain central to our work. We engage youth as volunteers, leaders, and changemakers by providing platforms for participation, exposure, and skill development.
              </p>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                By encouraging civic responsibility and social awareness, we nurture a generation capable of driving meaningful social change.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-sm leading-relaxed text-primary">
            This dual approach ensures that communities receive support while young people grow into responsible citizens who continue the cycle of impact.
          </div>
        </div>
      </section>

      {/* Contact & Helplines */}
      <section className="bg-muted/30 px-4 py-16">
        <div className="container mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-foreground">Get In Touch</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-3 text-lg font-semibold text-foreground">For volunteer or internship opportunities with us</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href="tel:+919100142224" className="hover:text-primary">+91 9100142224</a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href="mailto:admin@youngistaanfoundation.org" className="hover:text-primary">admin@youngistaanfoundation.org</a>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-3 text-lg font-semibold text-foreground">For corporate, donations, campaign and other partnerships</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Arun Daniel Yellamaty</p>
                <p>Founder and President</p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href="tel:+919885342224" className="hover:text-primary">+91 9885342224</a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href="mailto:arun@youngistaanfoundation.org" className="hover:text-primary">arun@youngistaanfoundation.org</a>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="mb-4 text-center text-xl font-semibold text-foreground">
              <Heart className="mr-1 inline h-5 w-5 text-destructive" /> Crisis Helplines
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
