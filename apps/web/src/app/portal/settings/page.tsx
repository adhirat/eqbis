import { PortalHeader } from "@/components/portal/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe, Shield, Bell, CreditCard } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <PortalHeader
        breadcrumbs={[
          { label: "Settings" },
        ]}
      />
      <div className="flex-1 p-6 max-w-2xl space-y-8">
        {/* Organization */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Organization</h2>
          </div>
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Organization name
              </label>
              <Input
                defaultValue="Acme Corp"
                className="bg-white/5 border-white/10 focus-visible:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Subdomain
              </label>
              <div className="flex items-center">
                <Input
                  defaultValue="acme"
                  className="rounded-r-none bg-white/5 border-white/10 focus-visible:ring-blue-500/30"
                />
                <div className="h-9 flex items-center px-3 bg-white/5 border border-l-0 border-white/10 rounded-r-md text-sm text-muted-foreground whitespace-nowrap">
                  .eqbis.com
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Custom domain
                <Badge variant="secondary" className="ml-2 text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
                  Enterprise
                </Badge>
              </label>
              <Input
                placeholder="portal.yourdomain.com"
                disabled
                className="bg-white/5 border-white/10 opacity-50"
              />
            </div>
            <Button size="sm" className="gradient-bg border-0 text-white hover:opacity-90">
              Save changes
            </Button>
          </div>
        </section>

        <Separator className="bg-border" />

        {/* Security */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Security</h2>
          </div>
          <div className="space-y-3 p-5 rounded-xl border border-border bg-card">
            {[
              { label: "Two-factor authentication", description: "Require 2FA for all members", enabled: false },
              { label: "Single sign-on (SSO)", description: "SAML 2.0 / OIDC", enabled: false, enterprise: true },
              { label: "Session timeout", description: "Auto sign-out after 24 hours of inactivity", enabled: true },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between py-2">
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    {item.label}
                    {item.enterprise && (
                      <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
                        Enterprise
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                </div>
                <div
                  className={`w-9 h-5 rounded-full flex items-center transition-colors cursor-pointer ${
                    item.enabled ? "bg-blue-500 justify-end pr-0.5" : "bg-white/10 justify-start pl-0.5"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator className="bg-border" />

        {/* Notifications */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Notifications</h2>
          </div>
          <div className="p-5 rounded-xl border border-border bg-card space-y-3">
            {[
              { label: "Leave requests", enabled: true },
              { label: "Invoice payments", enabled: true },
              { label: "New support tickets", enabled: false },
              { label: "Project milestones", enabled: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-foreground/80">{item.label}</span>
                <div
                  className={`w-9 h-5 rounded-full flex items-center transition-colors cursor-pointer ${
                    item.enabled ? "bg-blue-500 justify-end pr-0.5" : "bg-white/10 justify-start pl-0.5"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator className="bg-border" />

        {/* Billing */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Billing</h2>
          </div>
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-medium">Pro plan</div>
                <div className="text-xs text-muted-foreground mt-0.5">$99/month · Renews Jan 15, 2026</div>
              </div>
              <Badge className="gradient-bg text-white border-0 text-xs">Active</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5">
                Manage billing
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                View invoices
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
