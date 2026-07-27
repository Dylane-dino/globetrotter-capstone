"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import TextField from "@/components/TextField";
import Button from "@/components/Button";
import ErrorBanner from "@/components/ErrorBanner";
import Logo from "@/components/Logo";
import InterestPicker from "@/components/InterestPicker";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { INTEREST_OPTIONS } from "@/lib/interests";

const MIN_INTERESTS = 2;

export default function SignupPage() {
  const router = useRouter();
  const { signup, user, isLoading: sessionLoading } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionLoading && user) {
      router.replace("/home");
    }
  }, [sessionLoading, user, router]);

  function handleContinue(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setStep(2);
  }

  function toggleInterest(id: string) {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleFinish() {
    setError(null);
    setIsSubmitting(true);
    try {
      const tags = Array.from(
        new Set(
          selectedInterests.flatMap(
            (id) => INTEREST_OPTIONS.find((o) => o.id === id)?.tags || []
          )
        )
      );
      await signup({
        name,
        email,
        password,
        preferred_tags: tags,
        budget_level: "medium",
      });
      router.push("/home");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't create your account. Check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-ivory">
        <div className="max-w-3xl mx-auto px-6 py-10 md:py-16">
          <div className="mb-8">
            <Logo size="sm" />
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className="font-stamp text-[11px] uppercase tracking-wider text-laterite">
              Step 2 of 2
            </span>
            <div className="flex-1 h-1 rounded-full bg-canopy/10 overflow-hidden">
              <div className="h-full w-full bg-laterite" />
            </div>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-semibold text-canopy mb-2">
            What do you love?
          </h1>
          <p className="text-ink/60 mb-8">
            Pick at least {MIN_INTERESTS}, and we&apos;ll tailor Yaoundé to you
            from the moment you log in.
          </p>

          <InterestPicker selected={selectedInterests} onToggle={toggleInterest} />

          <ErrorBanner message={error} />

          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm font-semibold text-canopy/60 hover:text-canopy"
            >
              &larr; Back
            </button>
            <Button
              onClick={handleFinish}
              isLoading={isSubmitting}
              disabled={selectedInterests.length < MIN_INTERESTS}
            >
              {selectedInterests.length < MIN_INTERESTS
                ? `Pick ${MIN_INTERESTS - selectedInterests.length} more`
                : "Create my account"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthShell
      heroImage="/images/mont-febe.jpg"
      heroAlt="View of Mont Fébé overlooking Yaoundé"
      eyebrow="Yaoundé, Cameroon"
      headline="Start Your Journey"
      tagline="Tell us who you are, then show us what you love."
      supporting="We'll tailor every recommendation to your taste from day one."
    >
      <h2 className="font-display text-2xl font-semibold text-ivory mb-1">
        Create your account
      </h2>
      <p className="text-ivory/70 text-sm mb-6">Step 1 of 2 — the basics.</p>

      <form onSubmit={handleContinue} className="flex flex-col gap-4">
        <TextField
          variant="glass"
          label="Full name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
        />
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
        <TextField
          variant="glass"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />
        <TextField
          variant="glass"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
        />

        <ErrorBanner message={error} />

        <Button type="submit" fullWidth className="mt-1">
          Continue
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ivory/75">
        Already have an account?{" "}
        <Link href="/" className="text-marigold font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
