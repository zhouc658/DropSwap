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

function findMatchingSkills(
  neededSkills: string[],
  availableSkills: Skill[]
): string[] {
  return neededSkills.filter((needed) =>
    availableSkills.some((skill) => {
      const need = normalize(needed);
      const has = normalize(skill.name);

      return need.includes(has) || has.includes(need);
    })
  );
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

    /**
     * VERY LIGHT FILTERING
     *
     * Only remove extreme availability mismatches.
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

    /**
     * Cohere should focus mainly on complementary skills.
     */
    const query = `
Find the best collaboration partner for this student.

STUDENT:
${student.name}

Creator type:
${student.creatorType || "Unknown"}

Skills they already have:
${
  studentSkills
    .map(
      (skill) =>
        `${skill.name} (${skill.level})`
    )
    .join(", ") || "Unknown"
}

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
3. Prioritize complementary skills over similar backgrounds.

IMPORTANT:

Rank candidates mainly based on SKILL COMPLEMENTARITY.

Do not prioritize availability, motivation, or role preference in this ranking.
Those factors will be scored separately by DropSwap.

The strongest match is someone who has skills the student needs,
especially when the student also has skills that the candidate needs.
`;

    /**
     * Turn each candidate into a document for Cohere.
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
${
  skills
    .map(
      (skill) =>
        `${skill.name} (${skill.level})`
    )
    .join(", ") || "Unknown"
}

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

    /**
     * Ask Cohere to rank candidates.
     */
    const rerank = await cohere.rerank({
      model: "rerank-v3.5",
      query,
      documents,
      topN: Math.min(5, candidates.length),
    });

    /**
     * Convert Cohere ranking back into student objects.
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

        /**
         * Cohere relevance score converted from 0-1 to 0-100.
         */
        const skillFitScore =
          result.relevanceScore * 100;

        const candidateSkills = safeParse<Skill[]>(
          candidate.skills,
          []
        );

        const candidateNeededSkills =
          safeParse<string[]>(
            candidate.neededSkills,
            []
          );

        /**
         * Direct reciprocal skill matching.
         */
        const youNeedTheyHave =
          findMatchingSkills(
            studentNeededSkills,
            candidateSkills
          );

        const theyNeedYouHave =
          findMatchingSkills(
            candidateNeededSkills,
            studentSkills
          );

        /**
         * What percentage of your needed skills
         * does this person directly cover?
         */
        const yourNeedsCovered =
          studentNeededSkills.length > 0
            ? youNeedTheyHave.length /
              studentNeededSkills.length
            : 0;

        /**
         * What percentage of their needed skills
         * do you directly cover?
         */
        const theirNeedsCovered =
          candidateNeededSkills.length > 0
            ? theyNeedYouHave.length /
              candidateNeededSkills.length
            : 0;

        /**
         * Reciprocal skill score.
         *
         * Your needs = 70%
         * Their needs = 30%
         */
        const reciprocalSkillScore = Math.round(
          (yourNeedsCovered * 0.7 +
            theirNeedsCovered * 0.3) *
            100
        );

        /**
         * FINAL DROPSWAP SCORE
         *
         * Direct skill match matters the most.
         */
        const compatibilityScore = Math.round(
          reciprocalSkillScore * 0.5 +
            skillFitScore * 0.2 +
            availabilityScore * 0.1 +
            roleScore * 0.1 +
            motivationScore * 0.1
        );

        /**
         * Human-readable reasons.
         */
        const matchReasons: string[] = [];

        if (youNeedTheyHave.length > 0) {
          matchReasons.push(
            `They have skills you need: ${youNeedTheyHave.join(
              ", "
            )}`
          );
        }

        if (theyNeedYouHave.length > 0) {
          matchReasons.push(
            `You have skills they need: ${theyNeedYouHave.join(
              ", "
            )}`
          );
        }

        if (
          student.availability !== null &&
          candidate.availability !== null
        ) {
          const difference = Math.abs(
            student.availability -
              candidate.availability
          );

          if (difference <= 3) {
            matchReasons.push(
              "You have similar weekly availability"
            );
          }
        }

        if (
          student.motivation &&
          candidate.motivation &&
          normalize(student.motivation) ===
            normalize(candidate.motivation)
        ) {
          matchReasons.push(
            `You share a similar motivation: ${candidate.motivation}`
          );
        }

        if (
          student.rolePreference &&
          candidate.rolePreference &&
          normalize(student.rolePreference) !==
            normalize(candidate.rolePreference)
        ) {
          matchReasons.push(
            "Your preferred working roles complement each other"
          );
        }

        return {
          id: candidate.id,
          name: candidate.name,
          school: candidate.school,
          major: candidate.major,
          creatorType:
            candidate.creatorType,

          skills: candidateSkills,
          neededSkills:
            candidateNeededSkills,

          availability:
            candidate.availability,

          rolePreference:
            candidate.rolePreference,

          motivation:
            candidate.motivation,

          compatibilityScore,

          scores: {
            reciprocalSkillFit:
              reciprocalSkillScore,

            semanticSkillFit:
              Math.round(skillFitScore),

            availability:
              availabilityScore,

            role:
              roleScore,

            motivation:
              motivationScore,
          },

          matchReasons,
          youNeedTheyHave,
          theyNeedYouHave,

          rerankScore:
            result.relevanceScore,
        };
      }
    );

    /**
     * Sort by final DropSwap compatibility score.
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