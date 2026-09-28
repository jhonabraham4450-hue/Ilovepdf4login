import { json, setCookie } from "./_utils.js";

function fromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function verifyPassword(password, storedHash) {
  try {
    const parts = String(storedHash).split(":");

    if (parts.length !== 2) {
      return false;
    }

    const salt = fromBase64(parts[0]);
    const expectedHash = fromBase64(parts[1]);

    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const hash = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );

    const actualHash = new Uint8Array(hash);

    if (actualHash.length !== expectedHash.length) {
      return false;
    }

    let result = 0;

    for (let i = 0; i < actualHash.length; i++) {
      result |= actualHash[i] ^ expectedHash[i];
    }

    return result === 0;

  } catch (error) {
    return false;
  }
}

export async function onRequestPost({ request, env }) {

  try {

    const body = await request.json();

    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return json({
        success: false,
        message: "Username and password are required"
      }, 400);
    }

    if (!env.DB) {
      return json({
        success: false,
        message: "Database connection is not configured"
      }, 500);
    }

    const user = await env.DB.prepare(
      `SELECT id, username, mobile, email, password_hash, is_admin
       FROM users
       WHERE username = ?
       LIMIT 1`
    )
      .bind(username)
      .first();

    if (!user) {
      return json({
        success: false,
        message: "Username or password is incorrect"
      }, 401);
    }

    const valid = await verifyPassword(
      password,
      user.password_hash
    );

    if (!valid) {
      return json({
        success: false,
        message: "Username or password is incorrect"
      }, 401);
    }

    return json(
      {
        success: true,
        message: "Login successful",
        user: {
          username: user.username,
          mobile: user.mobile,
          email: user.email,
          is_admin: user.is_admin
        }
      },
      200,
      {
        "Set-Cookie": setCookie(
          "auth_token",
          user.username
        )
      }
    );

  } catch (error) {

    return json({
      success: false,
      message: "Login failed"
    }, 500);

  }
}
