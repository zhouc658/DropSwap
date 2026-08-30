"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    school: "",
    major: "",
    resumeText: "",
    portfolioText: "",
    stuckOn: "",
    availability: "",
    rolePreference: "Co-creator",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/students/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      router.push(`/profile/${data.student.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <p className="mb-2 text-sm font-medium text-black">
            DropSwap
          </p>

          <h1 className="text-4xl font-bold text-gray-900">
            Create your profile
          </h1>

          <p className="mt-3 text-gray-600">
            Tell us about what you do, what you're building,
            and where you need help.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl bg-white p-8 shadow-sm"
        >
          <div>
            <label className="mb-2 block font-medium text-black">
              Name *
            </label>

            <input
              required
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Crystal Zhou"
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-black">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@school.edu"
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium text-black">
                School
              </label>

              <input
                name="school"
                value={form.school}
                onChange={handleChange}
                placeholder="Parsons"
                className="w-full rounded-xl border border-gray-300 p-3 text-black"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-black">
                Major
              </label>

              <input
                name="major"
                value={form.major}
                onChange={handleChange}
                placeholder="Design & Technology"
                className="w-full rounded-xl border border-gray-300 p-3 text-black"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block font-medium text-black">
              Resume / experience
            </label>

            <textarea
              name="resumeText"
              value={form.resumeText}
              onChange={handleChange}
              rows={7}
              placeholder="Paste your resume or describe your work experience..."
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Portfolio / projects
            </label>

            <textarea
              name="portfolioText"
              value={form.portfolioText}
              onChange={handleChange}
              rows={6}
              placeholder="Tell us about projects you've worked on..."
              className="w-full rounded-xl border border-gray-300 p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              What are you stuck on right now? *
            </label>

            <p className="mb-2 text-sm text-gray-500">
              Don't worry about knowing the technical role.
              Just describe the problem.
            </p>

            <textarea
              required
              name="stuckOn"
              value={form.stuckOn}
              onChange={handleChange}
              rows={5}
              placeholder="I designed an app in Figma but don't know how to turn it into a functioning product..."
              className="w-full rounded-xl border border-gray-300 p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              How many hours can you contribute each week?
            </label>

            <input
              type="number"
              min="1"
              max="80"
              name="availability"
              value={form.availability}
              onChange={handleChange}
              placeholder="8"
              className="w-full rounded-xl border border-gray-300 p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              How do you prefer to work?
            </label>

            <select
              name="rolePreference"
              value={form.rolePreference}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 p-3"
            >
              <option>Executor</option>
              <option>Co-creator</option>
              <option>Lead</option>
            </select>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-red-600">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-xl bg-black px-6 py-4 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Analyzing your profile..." : "Analyze My Profile"}
          </button>
        </form>
      </div>
    </main>
  );
}