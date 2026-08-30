"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Skill = {
  name: string;
  level: string;
};

type Match = {
  id: number;
  name: string;
  school: string | null;
  major: string | null;
  creatorType: string | null;

  skills: Skill[];
  neededSkills: string[];

  availability: number | null;
  rolePreference: string | null;
  motivation: string | null;

  compatibilityScore: number;

  scores: {
    semanticSkillFit: number;
    availability: number;
    role: number;
    motivation: number;
  };
};

type MatchResponse = {
  student: {
    id: number;
    name: string;
  };

  matches: Match[];
};

export default function MatchesPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMatches() {
      try {
        const response = await fetch(`/api/matches/${id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Could not find matches."
          );
        }

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadMatches();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-10 text-black">
        <div className="mx-auto max-w-4xl">
          <p>Finding your best matches...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-10 text-black">
        <div className="mx-auto max-w-4xl">
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12 text-black">
      <div className="mx-auto max-w-4xl">

        {/* PAGE HEADER */}

        <div className="mb-10">
          <p className="text-sm font-medium">
            DropSwap Matches
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Matches for {data.student.name}
          </h1>

          <p className="mt-3">
            Ranked by complementary skills, availability,
            working role and motivation.
          </p>
        </div>

        {/* NO MATCHES */}

        {data.matches.length === 0 ? (
          <div className="rounded-2xl bg-white p-8">
            No suitable matches found yet.
          </div>
        ) : (

          /* MATCH CARDS */

          <div className="space-y-6">
            {data.matches.map((match, index) => (
              <div
                key={match.id}
                className="rounded-3xl bg-white p-8 text-black shadow-sm"
              >
                {/* TOP SECTION */}

                <div className="flex flex-col justify-between gap-5 sm:flex-row">
                  <div>
                    <p className="text-sm font-medium">
                      Match #{index + 1}
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                      {match.name}
                    </h2>

                    <p className="mt-1">
                      {match.school || "School not provided"}

                      {match.major
                        ? ` • ${match.major}`
                        : ""}
                    </p>

                    {match.creatorType && (
                      <p className="mt-3 font-medium">
                        {match.creatorType}
                      </p>
                    )}
                  </div>

                  {/* COMPATIBILITY SCORE */}

                  <div className="text-left sm:text-right">
                    <p className="text-4xl font-bold">
                      {match.compatibilityScore}%
                    </p>

                    <p className="text-sm">
                      DropSwap compatibility
                    </p>
                  </div>
                </div>

                {/* THEIR SKILLS */}

                <div className="mt-7">
                  <p className="text-sm font-medium">
                    Their skills
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {match.skills.map((skill) => (
                      <span
                        key={`${match.id}-${skill.name}`}
                        className="rounded-full bg-gray-100 px-3 py-2 text-sm text-black"
                      >
                        {skill.name} · {skill.level}
                      </span>
                    ))}
                  </div>
                </div>

                {/* WHAT THEY NEED */}

                <div className="mt-7">
                  <p className="text-sm font-medium">
                    They're looking for
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {match.neededSkills.map((skill) => (
                      <span
                        key={`${match.id}-need-${skill}`}
                        className="rounded-full border border-gray-300 px-3 py-2 text-sm text-black"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* SCORE BREAKDOWN */}

                <div className="mt-7 grid gap-4 sm:grid-cols-4">
                  <Score
                    label="Skill fit"
                    score={match.scores.semanticSkillFit}
                  />

                  <Score
                    label="Availability"
                    score={match.scores.availability}
                  />

                  <Score
                    label="Role"
                    score={match.scores.role}
                  />

                  <Score
                    label="Motivation"
                    score={match.scores.motivation}
                  />
                </div>

                {/* PROFILE BUTTON */}

                <div className="mt-8">
                  <Link
                    href={`/profile/${match.id}`}
                    className="inline-block rounded-xl bg-black px-5 py-3 font-medium text-white"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Score({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 text-black">
      <p className="text-sm">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold">
        {score}
      </p>
    </div>
  );
}