import {
  json,
  hashPassword,
  setCookie
} from "./_utils.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    const identifier = String(body.identifier || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!identifier || !password) {
      return json(
        { ok: false, error: "Email/Mobile এবং Password দিন।" },
        400
      );
    }

    if (!env.DB) {
      return json(
        { ok: false, error: "Database এখনো connect করা হয়নি।" },
        500
      );
    }

    const user = await env.DB.prepare(
      `SELECT id, name, email, mobile, password_hash
       FROM users
       WHERE lower(email) = ? OR mobile = ?
       LIMIT 1`
    )
      .bind(identifier, identifier)
      .first();

    if (!user) {
      return json(
        { ok: false, error: "Account পাওয়া যায়নি।" },
        401
      );
    }

    const passwordHash = await hashPassword(password);

    if (passwordHash !== user.password_hash) {
      return json(
        { ok: false, error: "Password সঠিক নয়।" },
        401
      );
    }

    const sessionToken = crypto.randomUUID();

    await env.DB.prepare(
      `INSERT INTO sessions
       (token, user_id, created_at, expires_at)
       VALUES (?, ?, datetime('now'), datetime('now', '+7 days'))`
    )
      .bind(sessionToken, user.id)
      .run();

    return new Response(
      JSON.stringify({
        ok: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile
        }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Set-Cookie": setCookie(
            "session",
            sessionToken,
            7 * 24 * 60 * 60
          )
        }
      }
    );

  } catch (error) {

    return json(
      {
        ok: false,
        error: "Login failed."
      },
      500
    );
  }
}
