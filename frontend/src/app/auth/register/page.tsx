"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await register({ email, password, full_name: fullName });
      localStorage.setItem("racesplit_token", res.access_token);
      localStorage.setItem("racesplit_user", JSON.stringify(res.user));
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">
          {error}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-medium py-2.5 rounded transition disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-400 mt-4">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-[var(--accent)] hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
