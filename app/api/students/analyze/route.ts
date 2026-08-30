import { CohereClientV2 } from "cohere-ai";
import { prisma } from "@/lib/prisma";

const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY,
});

type Skill = {
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
};

type AIProfile = {
  creatorType: string;
  skills: Skill[];
  neededSkills: string[];
  neededRoles: string[];
  motivation: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      school,
      major,
      resumeText,
      portfolioText,
      stuckOn,
      availability,
      rolePreference,
    } = body;

    if (!name || !stuckOn) {
      return Response.json(
        {
          error: "Name and project problem are required.",
        },
        {
          status: 400,
        }
      );
    }

    const prompt = `
You are the profile analysis system for DropSwap.

DropSwap matches students and creators based on complementary
skills, project needs, availability, motivation, and working style.

Analyze the following student.

NAME:
${name}

SCHOOL:
${school || "Not provided"}

MAJOR:
${major || "Not provided"}

RESUME / EXPERIENCE:
${resumeText || "Not provided"}

PORTFOLIO / PROJECTS:
${portfolioText || "Not provided"}

WHAT THEY ARE STUCK ON:
${stuckOn}

WEEKLY AVAILABILITY:
${availability || "Not provided"} hours

ROLE PREFERENCE:
${rolePreference || "Not provided"}

Your tasks:

1. Determine their primary creator/professional type.

2. Extract demonstrated skills.
Do not invent skills that are not supported by the provided information.

3. Estimate each skill level using only:
beginner, intermediate, advanced, or expert.

4. Translate what they are stuck on into concrete skills
they need from another collaborator.

5. Identify 1-3 collaborator roles that could fill that gap.

6. Infer their primary motivation from:
portfolio, learning, startup/product building,
exploration, networking, or other.

Return information that accurately reflects the student's
provided experience and project needs.
`;

    const response = await cohere.chat({
      model: "command-a-03-2025",

      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],

      responseFormat: {
        type: "json_object",

        jsonSchema: {
          type: "object",

          properties: {
            creatorType: {
              type: "string",
            },

            skills: {
              type: "array",

              items: {
                type: "object",

                properties: {
                  name: {
                    type: "string",
                  },

                  level: {
                    type: "string",

                    enum: [
                      "beginner",
                      "intermediate",
                      "advanced",
                      "expert",
                    ],
                  },
                },

                required: ["name", "level"],
              },
            },

            neededSkills: {
              type: "array",

              items: {
                type: "string",
              },
            },

            neededRoles: {
              type: "array",

              items: {
                type: "string",
              },
            },

            motivation: {
              type: "string",
            },
          },

          required: [
            "creatorType",
            "skills",
            "neededSkills",
            "neededRoles",
            "motivation",
          ],
        },
      },
    });

    const textContent = response.message.content?.find(
      (item) => item.type === "text"
    );

    if (!textContent || textContent.type !== "text") {
      throw new Error("Cohere did not return text.");
    }

    const analyzed: AIProfile = JSON.parse(textContent.text);

    const student = await prisma.student.create({
      data: {
        name,

        email:
          email && email.trim().length > 0
            ? email.trim()
            : null,

        school:
          school && school.trim().length > 0
            ? school.trim()
            : null,

        major:
          major && major.trim().length > 0
            ? major.trim()
            : null,

        resumeText:
          resumeText && resumeText.trim().length > 0
            ? resumeText.trim()
            : null,

        portfolioText:
          portfolioText && portfolioText.trim().length > 0
            ? portfolioText.trim()
            : null,

        stuckOn,

        creatorType: analyzed.creatorType,

        skills: JSON.stringify(analyzed.skills),

        neededSkills: JSON.stringify(
          analyzed.neededSkills
        ),

        neededRoles: JSON.stringify(
          analyzed.neededRoles
        ),

        motivation: analyzed.motivation,

        availability: availability
          ? Number(availability)
          : null,

        rolePreference:
          rolePreference || null,
      },
    });

    return Response.json({
      success: true,
      student,
      analysis: analyzed,
    });
  } catch (error) {
    console.error("PROFILE ANALYSIS ERROR:", error);

    return Response.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Profile analysis failed",
      },
      {
        status: 500,
      }
    );
  }
}