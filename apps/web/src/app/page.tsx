import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Users,
  BarChart3,
  FileText,
  Briefcase,
  MessageSquare,
  Settings2,
  Shield,
  Zap,
  Globe,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Human Resources",
    description:
      "Timesheets, leave management, payroll, org charts, and employee lifecycle — all in one place.",
  },
  {
    icon: BarChart3,
    title: "Finance & Billing",
    description:
      "Invoicing, subscriptions, expense tracking, and financial reporting built for growing businesses.",
  },
  {
    icon: Briefcase,
    title: "CRM & Sales",
    description:
      "Track leads, manage clients, automate follow-ups, and close deals faster with a unified pipeline.",
  },
  {
    icon: FileText,
    title: "Projects & Docs",
    description:
      "Plan projects, manage contracts, collaborate on documents, and track milestones end-to-end.",
  },
  {
    icon: MessageSquare,
    title: "Campaigns & Content",
    description:
      "Email campaigns, newsletters, knowledge bases, and course creation — all from one dashboard.",
  },
  {
    icon: Settings2,
    title: "Workflows & Automation",
    description:
      "Build no-code automations to connect your modules and eliminate repetitive manual work.",
  },
];

const stats = [
  { value: "45+", label: "Modules included" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "< 50ms", label: "Global latency" },
  { value: "SOC 2", label: "Compliant" },
];

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "For small teams getting started.",
    features: ["Up to 10 users", "Core HR & Finance modules", "5 GB storage", "Email support"],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    description: "For growing businesses that need everything.",
    features: ["Up to 100 users", "All 45+ modules", "50 GB storage", "Custom subdomain", "Priority support"],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large orgs with custom requirements.",
    features: ["Unlimited users", "Custom domain mapping", "SSO / SAML", "SLA + dedicated CSM", "On-prem option"],
    cta: "Contact sales",
    highlighted: false,
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-col">
        {/* Hero */}
        <section className="relative pt-40 pb-36 md:pt-52 md:pb-48 px-6 overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-40" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

          <div className="relative mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 text-xs font-medium bg-white/5 border-white/10 text-muted-foreground">
              <Zap className="w-3 h-3 mr-1.5 text-blue-400" />
              Now with AI-powered workflows
            </Badge>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
              One platform.
              <br />
              <span className="gradient-text">Every tool you need.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Eqbis unifies HR, Finance, CRM, Projects, and 40+ more modules into a
              single workspace — with multi-tenant support for agencies and enterprises.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="gradient-bg border-0 text-white hover:opacity-90 h-12 px-8">
                  Start for free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="h-12 px-8 border-white/10 hover:bg-white/5">
                  View pricing
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              No credit card required · 14-day free trial · Cancel anytime
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 border-y border-border">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 bg-white/5 border-white/10 text-muted-foreground text-xs">
                Platform
              </Badge>
              <h2 className="text-4xl font-bold tracking-tight mb-4">
                Everything your business runs on
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Stop paying for 12 different tools. Eqbis covers every department
                from a single, beautifully unified workspace.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group p-6 rounded-xl border border-border bg-card hover:border-blue-500/30 hover:bg-white/[0.02] transition-all duration-200"
                  >
                    <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Multi-tenant callout */}
        <section className="py-24 px-6 border-y border-border relative overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-20" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-3xl pointer-events-none" />
          <div className="relative mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="secondary" className="mb-4 bg-white/5 border-white/10 text-muted-foreground text-xs">
                  Multi-tenant
                </Badge>
                <h2 className="text-4xl font-bold tracking-tight mb-4">
                  Built for agencies{" "}
                  <span className="gradient-text">and enterprises</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Each of your clients gets their own isolated workspace, custom subdomain,
                  and branded portal login. You manage everything from one admin view.
                </p>
                <ul className="space-y-3">
                  {[
                    "client.yourdomain.com custom portal URLs",
                    "Isolated data with row-level security",
                    "Per-tenant branding (logo, colors)",
                    "Granular role-based access control",
                    "Invite clients directly to their workspace",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="rounded-xl border border-border bg-card p-6 space-y-3">
                  {[
                    { slug: "acme-corp", plan: "Pro", users: 24 },
                    { slug: "nova-studio", plan: "Starter", users: 8 },
                    { slug: "meridian-llc", plan: "Enterprise", users: 150 },
                  ].map((tenant) => (
                    <div
                      key={tenant.slug}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="text-sm font-medium text-foreground">{tenant.slug}</div>
                          <div className="text-xs text-muted-foreground">{tenant.slug}.eqbis.com</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                          {tenant.plan}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">{tenant.users} users</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute -bottom-3 -right-3 w-full h-full rounded-xl border border-blue-500/10 -z-10" />
              </div>
            </div>
          </div>
        </section>

        {/* Pricing preview */}
        <section className="py-24 px-6">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 bg-white/5 border-white/10 text-muted-foreground text-xs">
                Pricing
              </Badge>
              <h2 className="text-4xl font-bold tracking-tight mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start free, upgrade when you&apos;re ready. No hidden fees, no per-module charges.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative p-6 rounded-xl border ${
                    plan.highlighted
                      ? "border-blue-500/50 bg-blue-500/5"
                      : "border-border bg-card"
                  }`}
                >
                  {plan.highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-bg text-white border-0 text-xs">
                      Most popular
                    </Badge>
                  )}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">{plan.name}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.name === "Enterprise" ? "/contact" : "/auth/signup"}>
                    <Button
                      className={`w-full ${
                        plan.highlighted
                          ? "gradient-bg border-0 text-white hover:opacity-90"
                          : "bg-white/5 hover:bg-white/10 border-white/10"
                      }`}
                      variant={plan.highlighted ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security strip */}
        <section className="py-16 px-6 border-t border-border">
          <div className="mx-auto max-w-5xl">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              {[
                { icon: Shield, title: "Enterprise security", desc: "SOC 2 Type II certified. Data encrypted at rest and in transit." },
                { icon: Globe, title: "Globally distributed", desc: "Edge-deployed across 50+ regions for sub-50ms latency worldwide." },
                { icon: Zap, title: "Built to scale", desc: "From 5 to 50,000 users — the platform grows with your business." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/5 to-transparent pointer-events-none" />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Ready to consolidate your stack?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of teams who replaced their tool sprawl with Eqbis.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="gradient-bg border-0 text-white hover:opacity-90 h-12 px-10">
                Get started free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <p className="mt-4 text-xs text-muted-foreground">
              14-day free trial · No credit card required
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
