import { json, setCookie } from "./_utils.js";

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

function fromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function hashPassword(password) {
  const encoder = new TextEncoder();

  const salt = crypto.getRandomValues(new Uint8Array(16));

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

  return `${toBase64(salt)}:${toBase64(hash)}`;
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    const username = String(body.username || "").trim();
    const mobile = String(body.mobile || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!username || !mobile || !email || !password) {
      return json(
        {
          success: false,
          message: "Username, mobile number, Gmail and password are required"
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

    if (!/^01[0-9]{9}$/.test(mobile)) {
      return json(
        {
          success: false,
          message: "Please enter a valid Bangladesh mobile number"
        },
        400
      );
    }

    if (!/^[^@\s]+@gmail\.com$/i.test(email)) {
      return json(
        {
          success: false,
          message: "Please enter a valid Gmail address"
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

    if (!env.DB) {
      return json(
        {
          success: false,
          message: "Database connection is not configured"
        },
        500
      );
    }

    const existing = await env.DB.prepare(
      `SELECT id FROM users
       WHERE username = ? OR mobile = ? OR email = ?
       LIMIT 1`
    )
      .bind(username, mobile, email)
      .first();

    if (existing) {
      return json(
        {
          success: false,
          message: "Username, mobile number or Gmail already exists"
        },
        409
      );
    }

    const passwordHash = await hashPassword(password);

    await env.DB.prepare(
      `INSERT INTO users
       (username, mobile, email, password_hash, email_verified, mobile_verified, is_admin)
       VALUES (?, ?, ?, ?, 0, 0, 0)`
    )
      .bind(username, mobile, email, passwordHash)
      .run();

    return json(
      {
        success: true,
        message: "Registration successful",
        user: {
          username,
          mobile,
          email
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
        message: "Registration failed"
      },
      500
    );
  }
}
