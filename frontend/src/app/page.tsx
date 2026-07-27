"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import TextField from "@/components/TextField";
import Button from "@/components/Button";
import ErrorBanner from "@/components/ErrorBanner";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading: sessionLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotNote, setShowForgotNote] = useState(false);

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
      eyebrow="Yaoundé, Cameroon"
      headline="Explore Every Corner"
      tagline="Fifteen places. One city. Endless ways to experience it."
      supporting="Sign in to pick up your itinerary right where you left off."
    >
      <h2 className="font-display text-2xl font-semibold text-ivory mb-1">
        Welcome back
      </h2>
      <p className="text-ivory/70 text-sm mb-6">Sign in to your account.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          variant="glass"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
        <div>
          <TextField
            variant="glass"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
          <div className="flex justify-end mt-1.5">
            <button
              type="button"
              onClick={() => setShowForgotNote((v) => !v)}
              className="text-xs text-ivory/70 hover:text-ivory underline underline-offset-2"
            >
              Forgot password?
            </button>
          </div>
          {showForgotNote && (
            <p className="text-xs text-ivory/60 mt-1.5">
              Password reset isn&apos;t available yet in this phase — for
              now, sign up again with a new account if needed.
            </p>
          )}
        </div>

        <ErrorBanner message={error} />

        <Button type="submit" fullWidth isLoading={isSubmitting} className="mt-1">
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ivory/75">
        New here?{" "}
        <Link href="/signup" className="text-marigold font-semibold hover:underline">
          Create an Account
        </Link>
      </p>
    </AuthShell>
  );
}
