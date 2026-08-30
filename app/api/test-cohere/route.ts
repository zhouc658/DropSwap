import { CohereClientV2 } from "cohere-ai";

const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY,
});

export async function GET() {
  try {
    const response = await cohere.chat({
      model: "command-a-03-2025",
      messages: [
        {
          role: "user",
          content:
            "Say: Cohere is successfully connected to DropSwap.",
        },
      ],
    });

    return Response.json({
      success: true,
      response: response.message,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Cohere connection failed",
      },
      { status: 500 }
    );
  }
}