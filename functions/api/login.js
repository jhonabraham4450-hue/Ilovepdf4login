import { json, setCookie } from "./_utils.js";

export async function onRequestPost({ request }) {
  try {
    const body = await request.json();

    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return json(
        {
          success: false,
          message: "Username and password are required"
        },
        400
      );
    }

    return json(
      {
        success: true,
        message: "Login successful",
        user: {
          username
        }
      },
      200,
      {
        "Set-Cookie": setCookie("auth_token", username)
      }
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
