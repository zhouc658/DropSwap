import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

type Skill = {
  name: string;
  level: string;
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!student) {
    notFound();
  }

  const skills: Skill[] = student.skills
    ? JSON.parse(student.skills)
    : [];

  const neededSkills: string[] = student.neededSkills
    ? JSON.parse(student.neededSkills)
    : [];

  const neededRoles: string[] = student.neededRoles
    ? JSON.parse(student.neededRoles)
    : [];

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl bg-white p-10 shadow-sm">
          <div className="border-b border-gray-200 pb-8">
            <p className="text-sm font-medium text-gray-500">
              DropSwap Profile
            </p>

            <h1 className="mt-2 text-4xl font-bold text-gray-900">
              {student.name}
            </h1>

            <p className="mt-2 text-gray-600">
              {student.school || "School not provided"}

              {student.major
                ? ` • ${student.major}`
                : ""}
            </p>

            {student.creatorType && (
              <div className="mt-5 inline-block rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800">
                {student.creatorType}
              </div>
            )}
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">
              Skills
            </h2>

            {skills.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {skills.map((skill) => (
                  <div
                    key={`${skill.name}-${skill.level}`}
                    className="rounded-xl border border-gray-200 px-4 py-3"
                  >
                    <p className="font-medium text-gray-900">
                      {skill.name}
                    </p>

                    <p className="mt-1 text-sm capitalize text-gray-500">
                      {skill.level}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-gray-500">
                No skills identified yet.
              </p>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-gray-900">
              Looking for
            </h2>

            {neededRoles.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {neededRoles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-black px-4 py-2 text-sm text-white"
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}

            {neededSkills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {neededSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-gray-900">
              Current challenge
            </h2>

            <p className="mt-3 leading-7 text-gray-700">
              {student.stuckOn || "No challenge provided."}
            </p>
          </section>

          <section className="mt-10 grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">
                Availability
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {student.availability
                  ? `${student.availability} hrs/week`
                  : "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Role preference
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {student.rolePreference ||
                  "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Motivation
              </p>

              <p className="mt-1 font-medium capitalize text-gray-900">
                {student.motivation ||
                  "Not specified"}
              </p>
            </div>
          </section>

          <div className="mt-12">
            <Link
              href={`/matches/${student.id}`}
              className="block w-full rounded-xl bg-black px-6 py-4 text-center font-medium text-white transition hover:opacity-80"
            >
              Find My Matches
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}