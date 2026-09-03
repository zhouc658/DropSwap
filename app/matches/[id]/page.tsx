"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Match = {
  id: number;
  name: string;
  school: string | null;
  major: string | null;
  creatorType: string | null;

  skills: {
    name: string;
    level: string;
  }[];

  neededSkills: string[];

  availability: number | null;
  rolePreference: string | null;
  motivation: string | null;

  compatibilityScore: number;

  scores: {
    reciprocalSkillFit: number;
    semanticSkillFit: number;
    availability: number;
    role: number;
    motivation: number;
  };

  matchReasons: string[];
  youNeedTheyHave: string[];
  theyNeedYouHave: string[];
};

type MatchResponse = {
  student: {
    id: number;
    name: string;
  };

  matches: Match[];
};

type ChoiceState = {
  [matchId: number]: "interested" | "passed" | "mutual" | undefined;
};

export default function MatchesPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [choices, setChoices] = useState<ChoiceState>({});
  const [savingMatchId, setSavingMatchId] =
    useState<number | null>(null);

  useEffect(() => {
    async function loadMatches() {
      try {
        const response = await fetch(`/api/matches/${id}`);

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Could not load matches."
          );
        }

        setData(result);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Could not load matches.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, [id]);

  async function saveChoice(
    receiverId: number,
    status: "interested" | "passed"
  ) {
    if (!data) return;

    try {
      setSavingMatchId(receiverId);

      const response = await fetch("/api/interests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: data.student.id,
          receiverId,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Could not save your choice."
        );
      }

      if (result.isMutual) {
        setChoices((previous) => ({
          ...previous,
          [receiverId]: "mutual",
        }));
      } else {
        setChoices((previous) => ({
          ...previous,
          [receiverId]: status,
        }));
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Could not save your choice.");
      }
    } finally {
      setSavingMatchId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-8 text-black">
        <p>Finding your matches...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white p-8 text-black">
        <h1 className="text-2xl font-bold">
          Something went wrong
        </h1>

        <p className="mt-4">{error}</p>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12">
          <p className="text-sm font-medium uppercase tracking-[0.2em]">
            DropSwap Matches
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Matches for {data.student.name}
          </h1>

          <p className="mt-4 max-w-2xl text-lg">
            These students were ranked based on your
            skills, needs, availability, motivation,
            and preferred way of working.
          </p>
        </div>

        {data.matches.length === 0 && (
          <div className="rounded-2xl border border-black p-8">
            <h2 className="text-2xl font-semibold">
              No matches yet
            </h2>

            <p className="mt-2">
              Try updating your profile or creating
              more test students.
            </p>
          </div>
        )}

        <div className="space-y-8">
          {data.matches.map((match) => {
            const choice = choices[match.id];
            const isSaving =
              savingMatchId === match.id;

            return (
              <div
                key={match.id}
                className="rounded-3xl border border-black p-6 md:p-8"
              >
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.15em]">
                      {match.creatorType ||
                        "Student Creator"}
                    </p>

                    <h2 className="mt-2 text-3xl font-bold">
                      {match.name}
                    </h2>

                    <p className="mt-2">
                      {match.major || "Major not listed"}

                      {match.school
                        ? ` · ${match.school}`
                        : ""}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-full border border-black px-5 py-3 text-center">
                    <p className="text-2xl font-bold">
                      {match.compatibilityScore}%
                    </p>

                    <p className="text-xs uppercase tracking-wide">
                      Match
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl bg-zinc-100 p-6">
                  <h3 className="text-xl font-semibold">
                    Why we matched you
                  </h3>

                  {match.matchReasons.length > 0 ? (
                    <ul className="mt-4 space-y-3">
                      {match.matchReasons.map(
                        (reason, index) => (
                          <li
                            key={index}
                            className="flex gap-3"
                          >
                            <span>✓</span>
                            <span>{reason}</span>
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="mt-4">
                      This match was mainly identified
                      through overall skill fit and
                      collaboration compatibility.
                    </p>
                  )}
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-black p-5">
                    <p className="text-sm font-medium uppercase tracking-wide">
                      They can help you with
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {match.youNeedTheyHave.length >
                      0 ? (
                        match.youNeedTheyHave.map(
                          (skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-black px-3 py-1 text-sm"
                            >
                              {skill}
                            </span>
                          )
                        )
                      ) : (
                        <p className="text-sm">
                          No direct skill overlap found yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-black p-5">
                    <p className="text-sm font-medium uppercase tracking-wide">
                      You can help them with
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {match.theyNeedYouHave.length >
                      0 ? (
                        match.theyNeedYouHave.map(
                          (skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-black px-3 py-1 text-sm"
                            >
                              {skill}
                            </span>
                          )
                        )
                      ) : (
                        <p className="text-sm">
                          No direct reciprocal skill found yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-3">
                  <div>
                    <p className="text-sm font-semibold">
                      Availability
                    </p>

                    <p className="mt-1">
                      {match.availability
                        ? `${match.availability} hrs/week`
                        : "Not listed"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Working Role
                    </p>

                    <p className="mt-1">
                      {match.rolePreference ||
                        "Not listed"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Motivation
                    </p>

                    <p className="mt-1">
                      {match.motivation ||
                        "Not listed"}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-sm font-semibold">
                    Their Skills
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {match.skills.map((skill) => (
                      <span
                        key={`${match.id}-${skill.name}`}
                        className="rounded-full bg-black px-3 py-1 text-sm text-white"
                      >
                        {skill.name}
                        {skill.level
                          ? ` · ${skill.level}`
                          : ""}
                      </span>
                    ))}
                  </div>
                </div>

                {choice === "mutual" && (
                  <div className="mt-8 rounded-2xl border border-black bg-zinc-100 p-6">
                    <h3 className="text-2xl font-bold">
                      🎉 It&apos;s a match!
                    </h3>

                    <p className="mt-2">
                      You&apos;re both interested in
                      working together.
                    </p>

                    <button
                      type="button"
                      className="mt-5 rounded-full bg-black px-6 py-3 font-medium text-white"
                    >
                      Start Conversation
                    </button>
                  </div>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/profile/${match.id}`}
                    className="rounded-full border border-black px-6 py-3 font-medium transition hover:bg-black hover:text-white"
                  >
                    View Profile
                  </Link>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      saveChoice(
                        match.id,
                        "interested"
                      )
                    }
                    className={`rounded-full px-6 py-3 font-medium transition ${
                      choice === "interested" ||
                      choice === "mutual"
                        ? "bg-black text-white"
                        : "border border-black bg-white text-black hover:bg-black hover:text-white"
                    }`}
                  >
                    {isSaving
                      ? "Saving..."
                      : choice === "interested"
                      ? "Interested ✓"
                      : choice === "mutual"
                      ? "Matched ✓"
                      : "Interested"}
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      saveChoice(match.id, "passed")
                    }
                    className={`rounded-full px-6 py-3 font-medium transition ${
                      choice === "passed"
                        ? "bg-zinc-200"
                        : "border border-black hover:bg-zinc-100"
                    }`}
                  >
                    {choice === "passed"
                      ? "Passed ✓"
                      : "Pass"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}