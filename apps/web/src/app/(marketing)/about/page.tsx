import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

export const metadata: Metadata = { title: "About" };

const values = [
  {
    title: "Simplicity over complexity",
    description:
      "Business software should be intuitive. We obsess over reducing cognitive load so your team spends less time learning tools and more time doing work.",
  },
  {
    title: "One source of truth",
    description:
      "Data fragmented across 10 SaaS tools is data that lies. We built Eqbis so every team — HR, Finance, Sales, Ops — works from the same foundation.",
  },
  {
    title: "Transparency by default",
    description:
      "No surprise pricing. No feature gates that appear after you're invested. What you see on the pricing page is exactly what you get.",
  },
  {
    title: "Built for scale",
    description:
      "Whether you're a 5-person team or a 5,000-person enterprise, the platform is the same. You don't outgrow Eqbis — it grows with you.",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-28 pb-24 px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-20">
          <Badge variant="secondary" className="mb-4 bg-white/5 border-white/10 text-muted-foreground text-xs">
            About Eqbis
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            We built the platform we{" "}
            <span className="gradient-text">always wanted</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            After years of stitching together a dozen different tools for HR,
            finance, projects, and communications, we decided to build one that
            does everything well — without the enterprise price tag.
          </p>
        </div>

        {/* Mission */}
        <div className="p-8 rounded-xl border border-border bg-card mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-3">Our mission</h2>
            <p className="text-muted-foreground leading-relaxed max-w-2xl">
              To give every business — from a 3-person startup to a 3,000-person
              enterprise — a single, beautiful, reliable platform to run their
              operations. We believe great software shouldn&apos;t require an IT
              department to manage or a consultant to configure.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8">What we believe in</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {values.map((value) => (
              <div
                key={value.title}
                className="p-6 rounded-xl border border-border bg-card hover:border-blue-500/20 transition-colors"
              >
                <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stack */}
        <div className="text-center p-8 rounded-xl border border-border bg-card">
          <h2 className="text-xl font-bold mb-3">Built on solid foundations</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Eqbis is built with Next.js, Supabase, and deployed on Vercel — giving
            you sub-50ms global latency, Postgres-grade data reliability, and
            enterprise-grade security out of the box.
          </p>
        </div>
      </div>
    </div>
  );
}
