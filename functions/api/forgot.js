import { json } from "./_utils.js";

export async function onRequestPost({ request }) {
  try {
    const body = await request.json();

    const username = String(body.username || "").trim();

    if (!username) {
      return json(
        {
          success: false,
          message: "Username is required"
        },
        400
      );
    }

    return json(
      {
        success: true,
        message: "Username verified. You can reset your password.",
        user: {
          username
        }
      },
      200
    );
  } catch (error) {
    return json(
      {
        success: false,
        message: "Invalid request"
      },
      400
    );
  }
}
