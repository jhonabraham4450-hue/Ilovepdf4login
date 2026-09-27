import { json, hashPassword } from "./_utils.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const mobile = String(body.mobile || "").trim();
    const password = String(body.password || "");

    if (!name || !email || !mobile || !password) {
      return json({ ok: false, error: "সব তথ্য পূরণ করুন।" }, 400);
    }

    if (password.length < 6) {
      return json(
        { ok: false, error: "Password কমপক্ষে 6 অক্ষরের হতে হবে।" },
        400
      );
    }

    if (!env.DB) {
      return json(
        { ok: false, error: "Database এখনো connect করা হয়নি।" },
        500
      );
    }

    const existing = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ? OR mobile = ? LIMIT 1"
    )
      .bind(email, mobile)
      .first();

    if (existing) {
      return json(
        { ok: false, error: "এই Email অথবা Mobile দিয়ে account আগে থেকেই আছে।" },
        409
      );
    }

    const passwordHash = await hashPassword(password);

    await env.DB.prepare(
      `INSERT INTO users
       (name, email, mobile, password_hash, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`
    )
      .bind(name, email, mobile, passwordHash)
      .run();

    return json({
      ok: true,
      message: "Account সফলভাবে তৈরি হয়েছে।"
    });

  } catch (error) {
    return json(
      {
        ok: false,
        error: "Registration failed."
      },
      500
    );
  }
}
