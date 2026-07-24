"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import TextField from "@/components/TextField";
import Button from "@/components/Button";
import ErrorBanner from "@/components/ErrorBanner";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading: sessionLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionLoading && user) {
      router.replace("/home");
    }
  }, [sessionLoading, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push("/home");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't sign in. Check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      heroImage="/images/monument-reunification.jpg"
      heroAlt="The Monument de la Réunification in Yaoundé"
      tagline="Fifteen places. One city. Wherever you start, we'll help you plan it."
    >
      <div className="md:hidden mb-8">
        <Logo size="md" />
      </div>

      <h1 className="font-display text-3xl font-semibold text-canopy mb-1">
        Welcome back
      </h1>
      <p className="text-ink/60 mb-8">Sign in to keep planning your trip.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <ErrorBanner message={error} />

        <Button type="submit" fullWidth isLoading={isSubmitting} className="mt-2">
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink/60">
        New to GlobeTrotter?{" "}
        <Link href="/signup" className="text-laterite font-semibold hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
