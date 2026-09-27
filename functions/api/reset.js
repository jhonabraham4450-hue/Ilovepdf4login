import { json, getCookie, setCookie } from "./_utils.js";

export async function onRequestPost({ request }) {
  try {
    const body = await request.json();

    const username = String(body.username || "").trim();
    const newPassword = String(body.newPassword || "");

    if (!username || !newPassword) {
      return json(
        {
          success: false,
          message: "Username and new password are required"
        },
        400
      );
    }

    if (newPassword.length < 6) {
      return json(
        {
          success: false,
          message: "New password must be at least 6 characters"
        },
        400
      );
    }

    return json(
      {
        success: true,
        message: "Password reset successful",
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
