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

    if (username.length < 3) {
      return json(
        {
          success: false,
          message: "Username must be at least 3 characters"
        },
        400
      );
    }

    if (password.length < 6) {
      return json(
        {
          success: false,
          message: "Password must be at least 6 characters"
        },
        400
      );
    }

    // Temporary registration/session
    // Database storage will be connected in the next step.
    return json(
      {
        success: true,
        message: "Registration successful",
        user: {
          username
        }
      },
      201,
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
