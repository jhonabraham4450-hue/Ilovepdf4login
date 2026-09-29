import { json, setCookie } from "./_utils.js";

function toBase64(bytes) {
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

async function hashPassword(password) {

  const encoder = new TextEncoder();

  const salt = crypto.getRandomValues(
    new Uint8Array(16)
  );

  const keyMaterial =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

  const hash =
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );

  const hashBytes =
    new Uint8Array(hash);

  return (
    toBase64(salt) +
    ":" +
    toBase64(hashBytes)
  );
}


export async function onRequestPost({ request, env }) {

  try {

    const body =
      await request.json();

    const username =
      String(body.username || "").trim();

    const newPassword =
      String(body.newPassword || "");

    if (!username || !newPassword) {

      return json(
        {
          success: false,
          message:
            "Username and new password are required"
        },
        400
      );

    }

    if (newPassword.length < 6) {

      return json(
        {
          success: false,
          message:
            "New password must be at least 6 characters"
        },
        400
      );

    }

    if (!env.DB) {

      return json(
        {
          success: false,
          message:
            "Database connection is not configured"
        },
        500
      );

    }

    const user =
      await env.DB.prepare(
        `SELECT id, username, is_admin
         FROM users
         WHERE username = ?
         LIMIT 1`
      )
      .bind(username)
      .first();

    if (!user) {

      return json(
        {
          success: false,
          message:
            "User not found"
        },
        404
      );

    }

    const passwordHash =
      await hashPassword(newPassword);

    await env.DB.prepare(
      `UPDATE users
       SET password_hash = ?
       WHERE username = ?`
    )
      .bind(
        passwordHash,
        username
      )
      .run();

    return json(
      {
        success: true,
        message:
          "Password reset successful",
        user: {
          username: user.username,
          is_admin: user.is_admin
        }
      },
      200,
      {
        "Set-Cookie":
          setCookie(
            "auth_token",
            user.username
          )
      }
    );

  } catch (error) {

    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    return json(
      {
        success: false,
        message:
          "Password reset failed"
      },
      500
    );

  }
}
