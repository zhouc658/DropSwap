import { CohereClientV2 } from "cohere-ai";
import { prisma } from "@/lib/prisma";

const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY,
});

type Skill = {
  name: string;
  level: string;
};

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function calculateAvailabilityScore(
  a: number | null,
  b: number | null
) {
  if (!a || !b) return 60;

  const difference = Math.abs(a - b);

  if (difference <= 1) return 100;
  if (difference <= 3) return 90;
  if (difference <= 5) return 75;
  if (difference <= 8) return 55;

  return 30;
}

function calculateRoleScore(
  roleA: string | null,
  roleB: string | null
) {
  if (!roleA || !roleB) return 60;

  const a = normalize(roleA);
  const b = normalize(roleB);

  if (a === "co-creator" && b === "co-creator") {
    return 100;
  }

  if (
    (a === "lead" && b === "executor") ||
    (a === "executor" && b === "lead")
  ) {
    return 95;
  }

  if (
    (a === "lead" && b === "co-creator") ||
    (a === "co-creator" && b === "lead")
  ) {
    return 75;
  }

  if (
    (a === "executor" && b === "co-creator") ||
    (a === "co-creator" && b === "executor")
  ) {
    return 80;
  }

  if (a === "lead" && b === "lead") {
    return 35;
  }

  if (a === "executor" && b === "executor") {
    return 45;
  }

  return 60;
}

function calculateMotivationScore(
  motivationA: string | null,
  motivationB: string | null
) {
  if (!motivationA || !motivationB) return 60;

  const a = normalize(motivationA);
  const b = normalize(motivationB);

  if (a === b) {
    return 100;
  }

  if (
    (a.includes("portfolio") && b.includes("learning")) ||
    (a.includes("learning") && b.includes("portfolio"))
  ) {
    return 80;
  }

  if (
    (a.includes("startup") && b.includes("portfolio")) ||
    (a.includes("portfolio") && b.includes("startup"))
  ) {
    return 65;
  }

  return 60;
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;
    const studentId = Number(id);

    if (Number.isNaN(studentId)) {
      return Response.json(
        {
          error: "Invalid student ID.",
        },
        {
          status: 400,
        }
      );
    }

    const student = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
    });

    if (!student) {
      return Response.json(
        {
          error: "Student not found.",
        },
        {
          status: 404,
        }
      );
    }

    const allCandidates = await prisma.student.findMany({
      where: {
        id: {
          not: studentId,
        },
      },
    });

    if (allCandidates.length === 0) {
      return Response.json({
        student,
        matches: [],
      });
    }

    const studentSkills = safeParse<Skill[]>(
      student.skills,
      []
    );

    const studentNeededSkills = safeParse<string[]>(
      student.neededSkills,
      []
    );

    const studentNeededRoles = safeParse<string[]>(
      student.neededRoles,
      []
    );

    /*
      VERY LIGHT FILTERING

      For the prototype, don't aggressively remove candidates yet.
      We want to see how Cohere ranks everyone.

      We only remove extreme availability mismatches.
    */

    const candidates = allCandidates.filter(
      (candidate) => {
        if (
          student.availability &&
          candidate.availability
        ) {
          const difference = Math.abs(
            student.availability -
              candidate.availability
          );

          if (difference > 15) {
            return false;
          }
        }

        return true;
      }
    );

    if (candidates.length === 0) {
      return Response.json({
        student,
        matches: [],
      });
    }

    /*
      This describes WHAT THE CURRENT STUDENT NEEDS.

      Cohere will compare every candidate against this query.
    */

    const query = `
Find the best collaboration partner for this student.

STUDENT:
${student.name}

Creator type:
${student.creatorType || "Unknown"}

Skills they already have:
${studentSkills
  .map(
    (skill) =>
      `${skill.name} (${skill.level})`
  )
  .join(", ") || "Unknown"}

Skills they need:
${studentNeededSkills.join(", ") || "Unknown"}

Collaborator roles they need:
${studentNeededRoles.join(", ") || "Unknown"}

Current challenge:
${student.stuckOn || "Unknown"}

Motivation:
${student.motivation || "Unknown"}

Availability:
${
  student.availability
    ? `${student.availability} hours/week`
    : "Unknown"
}

Role preference:
${student.rolePreference || "Unknown"}

A strong candidate should:

1. Have skills that directly fill this student's missing skills.
2. Ideally need skills that this student already has.
3. Have compatible availability.
4. Have compatible motivation.
5. Have a compatible collaboration role.

Prioritize reciprocal skill exchange rather than simple similarity.
`;

    /*
      Turn every candidate into one searchable document.
    */

    const documents = candidates.map(
      (candidate) => {
        const skills = safeParse<Skill[]>(
          candidate.skills,
          []
        );

        const neededSkills = safeParse<string[]>(
          candidate.neededSkills,
          []
        );

        const neededRoles = safeParse<string[]>(
          candidate.neededRoles,
          []
        );

        return `
NAME:
${candidate.name}

CREATOR TYPE:
${candidate.creatorType || "Unknown"}

HAS THESE SKILLS:
${skills
  .map(
    (skill) =>
      `${skill.name} (${skill.level})`
  )
  .join(", ") || "Unknown"}

NEEDS THESE SKILLS:
${neededSkills.join(", ") || "Unknown"}

LOOKING FOR THESE ROLES:
${neededRoles.join(", ") || "Unknown"}

CURRENT CHALLENGE:
${candidate.stuckOn || "Unknown"}

MOTIVATION:
${candidate.motivation || "Unknown"}

AVAILABILITY:
${
  candidate.availability
    ? `${candidate.availability} hours/week`
    : "Unknown"
}

ROLE PREFERENCE:
${candidate.rolePreference || "Unknown"}
`;
      }
    );

    /*
      Ask Cohere to rank the candidates.
    */

    const rerank = await cohere.rerank({
      model: "rerank-v3.5",
      query,
      documents,
      topN: Math.min(5, candidates.length),
    });

    /*
      Convert Cohere's ranking back into real students.
    */

    const matches = rerank.results.map(
      (result) => {
        const candidate =
          candidates[result.index];

        const availabilityScore =
          calculateAvailabilityScore(
            student.availability,
            candidate.availability
          );

        const roleScore =
          calculateRoleScore(
            student.rolePreference,
            candidate.rolePreference
          );

        const motivationScore =
          calculateMotivationScore(
            student.motivation,
            candidate.motivation
          );

        /*
          Cohere score is 0-1.
          Convert it to a 0-100 signal.

          This is NOT displayed directly as
          "Cohere says you're 93% compatible."
        */

        const skillFitScore =
          result.relevanceScore * 100;

        /*
          Our first experimental DropSwap score.

          Skill/gap fit is intentionally weighted highest.
        */

        const compatibilityScore = Math.round(
          skillFitScore * 0.55 +
            availabilityScore * 0.2 +
            roleScore * 0.15 +
            motivationScore * 0.1
        );

        const skills = safeParse<Skill[]>(
          candidate.skills,
          []
        );

        const neededSkills =
          safeParse<string[]>(
            candidate.neededSkills,
            []
          );

        return {
          id: candidate.id,
          name: candidate.name,
          school: candidate.school,
          major: candidate.major,
          creatorType:
            candidate.creatorType,

          skills,
          neededSkills,

          availability:
            candidate.availability,

          rolePreference:
            candidate.rolePreference,

          motivation:
            candidate.motivation,

          compatibilityScore,

          scores: {
            semanticSkillFit:
              Math.round(skillFitScore),

            availability:
              availabilityScore,

            role:
              roleScore,

            motivation:
              motivationScore,
          },

          rerankScore:
            result.relevanceScore,
        };
      }
    );

    /*
      Our combined score can change the ordering slightly,
      so sort again.
    */

    matches.sort(
      (a, b) =>
        b.compatibilityScore -
        a.compatibilityScore
    );

    return Response.json({
      student: {
        id: student.id,
        name: student.name,
      },

      matches,
    });
  } catch (error) {
    console.error("MATCHING ERROR:", error);

    return Response.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Matching failed.",
      },
      {
        status: 500,
      }
    );
  }
}