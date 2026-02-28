import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X } from "lucide-react";

export const metadata: Metadata = { title: "Pricing" };

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "Perfect for small teams and early-stage businesses.",
    features: {
      included: [
        "Up to 10 users",
        "HR module (timesheets, leaves)",
        "Finance module (invoicing)",
        "Projects & Documents",
        "5 GB file storage",
        "Email support",
        "Mobile app access",
      ],
      excluded: [
        "CRM & Sales pipeline",
        "Custom subdomain",
        "Workflows & Automation",
        "Priority support",
        "SSO / SAML",
      ],
    },
    cta: "Start 14-day trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    description: "For growing teams that need the full platform.",
    features: {
      included: [
        "Up to 100 users",
        "All 45+ modules",
        "CRM & Sales pipeline",
        "50 GB file storage",
        "Custom subdomain",
        "Workflows & Automation",
        "Priority support",
        "API access",
      ],
      excluded: ["SSO / SAML", "Dedicated CSM", "On-premises option"],
    },
    cta: "Start 14-day trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations with advanced requirements.",
    features: {
      included: [
        "Unlimited users",
        "All Pro features",
        "Custom domain mapping",
        "SSO / SAML",
        "Unlimited storage",
        "Dedicated CSM",
        "99.99% uptime SLA",
        "On-premises option",
        "Security review & SOC 2",
      ],
      excluded: [],
    },
    cta: "Contact sales",
    highlighted: false,
  },
];

const faqs = [
  {
    q: "Can I change plans at any time?",
    a: "Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the start of your next billing cycle.",
  },
  {
    q: "What happens after my trial ends?",
    a: "You'll be prompted to choose a plan. Your data is preserved. If you don't subscribe, your account enters a read-only state for 30 days before deletion.",
  },
  {
    q: "Is there a per-user fee?",
    a: "No. All plans are flat-rate up to the user limit. Enterprise pricing is negotiated based on total seats.",
  },
  {
    q: "Can each client have their own subdomain?",
    a: "Yes — on the Pro plan each tenant gets a custom subdomain (e.g. client.eqbis.com). Enterprise supports custom domain mapping (e.g. portal.clientdomain.com).",
  },
  {
    q: "Is my data isolated from other tenants?",
    a: "Absolutely. Every tenant's data is row-level isolated with Postgres RLS policies. No data is ever shared across organizations.",
  },
];

export default function PricingPage() {
  return (
    <div className="pt-28 pb-24 px-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 bg-white/5 border-white/10 text-muted-foreground text-xs">
            Pricing
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Simple, honest pricing
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-5 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-7 rounded-xl border ${
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

              <div className="mb-6">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.included.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
                {plan.features.excluded.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground/50">
                    <X className="w-4 h-4 mt-0.5 shrink-0" />
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

        {/* FAQs */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-border pb-6 last:border-0">
                <h3 className="font-medium text-foreground mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
