import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const studentId = Number(
      searchParams.get("studentId")
    );

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

    const interests =
      await prisma.interest.findMany({
        where: {
          senderId: studentId,
        },
      });

    return Response.json({
      success: true,
      interests,
    });
  } catch (error) {
    console.error(
      "LOAD INTERESTS ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not load interests.",
      },
      {
        status: 500,
      }
    );
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const senderId = Number(body.senderId);
    const receiverId = Number(body.receiverId);
    const status = body.status || "interested";

    if (
      Number.isNaN(senderId) ||
      Number.isNaN(receiverId)
    ) {
      return Response.json(
        {
          error: "Invalid student IDs.",
        },
        {
          status: 400,
        }
      );
    }

    if (senderId === receiverId) {
      return Response.json(
        {
          error: "You cannot match with yourself.",
        },
        {
          status: 400,
        }
      );
    }

    const sender = await prisma.student.findUnique({
      where: {
        id: senderId,
      },
    });

    const receiver = await prisma.student.findUnique({
      where: {
        id: receiverId,
      },
    });

    if (!sender || !receiver) {
      return Response.json(
        {
          error: "Student not found.",
        },
        {
          status: 404,
        }
      );
    }

    const interest = await prisma.interest.upsert({
      where: {
        senderId_receiverId: {
          senderId,
          receiverId,
        },
      },

      update: {
        status,
      },

      create: {
        senderId,
        receiverId,
        status,
      },
    });

    const reverseInterest =
      await prisma.interest.findUnique({
        where: {
          senderId_receiverId: {
            senderId: receiverId,
            receiverId: senderId,
          },
        },
      });

    const isMutual =
      status === "interested" &&
      reverseInterest?.status === "interested";

    return Response.json({
      success: true,
      interest,
      isMutual,
    });
  } catch (error) {
    console.error("INTEREST ERROR:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not save interest.",
      },
      {
        status: 500,
      }
    );
  }
}