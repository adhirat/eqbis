"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { signUp } from "@/lib/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await signUp.email({
      name: `${firstName} ${lastName}`.trim(),
      email,
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message ?? "Could not create account. Please try again.");
    } else {
      router.push("/portal/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 relative">
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Image
            src="/logo.png"
            alt="Eqbis Logo"
            width={36}
            height={36}
            className="shrink-0"
          />
          <span className="text-2xl font-bold tracking-tight gradient-text">Eqbis</span>
        </Link>

        <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">Create your workspace</h1>
            <p className="text-sm text-[var(--text-muted)]">Start your 14-day free trial. No card needed.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">First name</label>
                <Input placeholder="Jane" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Last name</label>
                <Input placeholder="Smith" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Work email</label>
              <Input
                type="email"
                placeholder="jane@company.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Organization name</label>
              <Input
                placeholder="Acme Corp"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Password</label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-bg border-0 text-white hover:opacity-90 mt-2 h-9 text-sm"
            >
              {loading ? "Creating workspace…" : "Create workspace"}
            </Button>
          </form>

          <ul className="mt-5 space-y-1.5">
            {["14-day free trial, no credit card", "All modules included", "Cancel anytime"].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 transition-colors">Sign in</Link>
        </p>
        <p className="text-center text-xs text-[var(--text-muted)] mt-3">
          By creating an account you agree to our{" "}
          <a href="#" className="underline hover:text-foreground">Terms of Service</a>{" "}and{" "}
          <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
