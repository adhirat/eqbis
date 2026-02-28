import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, MessageSquare, Building2 } from "lucide-react";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="pt-28 pb-24 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 bg-white/5 border-white/10 text-muted-foreground text-xs">
            Contact
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight mb-4">Get in touch</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Have a question, want a demo, or need enterprise pricing? We respond
            within one business day.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Form */}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  First name
                </label>
                <Input
                  placeholder="Jane"
                  className="bg-white/5 border-white/10 focus-visible:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Last name
                </label>
                <Input
                  placeholder="Smith"
                  className="bg-white/5 border-white/10 focus-visible:ring-blue-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Work email
              </label>
              <Input
                type="email"
                placeholder="jane@company.com"
                className="bg-white/5 border-white/10 focus-visible:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Company
              </label>
              <Input
                placeholder="Acme Corp"
                className="bg-white/5 border-white/10 focus-visible:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Message
              </label>
              <textarea
                rows={5}
                placeholder="Tell us how we can help..."
                className="w-full px-3 py-2 rounded-md text-sm bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
              />
            </div>

            <Button className="w-full gradient-bg border-0 text-white hover:opacity-90">
              Send message
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By submitting you agree to our{" "}
              <a href="#" className="underline hover:text-foreground">
                Privacy Policy
              </a>
              .
            </p>
          </div>

          {/* Contact options */}
          <div className="space-y-5">
            {[
              {
                icon: Mail,
                title: "Email us",
                description: "For general inquiries and support.",
                value: "hello@eqbis.com",
              },
              {
                icon: MessageSquare,
                title: "Live chat",
                description: "Chat with our team in the portal.",
                value: "Available Mon–Fri, 9am–6pm IST",
              },
              {
                icon: Building2,
                title: "Enterprise sales",
                description: "For large teams and custom contracts.",
                value: "sales@eqbis.com",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex gap-4 p-5 rounded-xl border border-border bg-card"
                >
                  <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm mb-0.5">{item.title}</div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {item.description}
                    </div>
                    <div className="text-sm text-blue-400">{item.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
