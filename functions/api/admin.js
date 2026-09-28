import { json, getCookie } from "./_utils.js";

export async function onRequestGet({ request, env }) {
  try {
    const username = getCookie(request, "auth_token");

    if (!username) {
      return json({
        success: false,
        message: "Login required"
      }, 401);
    }

    const admin = await env.DB.prepare(
      `SELECT id, username, mobile, email, is_admin, created_at
       FROM users
       WHERE username = ? AND is_admin = 1`
    )
      .bind(username)
      .first();

    if (!admin) {
      return json({
        success: false,
        message: "Admin access denied"
      }, 403);
    }

    const users = await env.DB.prepare(
      `SELECT id, username, mobile, email,
              email_verified, mobile_verified,
              is_admin, created_at
       FROM users
       ORDER BY id DESC`
    ).all();

    return json({
      success: true,
      admin: {
        username: admin.username
      },
      totalUsers: users.results.length,
      users: users.results
    });

  } catch (error) {
    return json({
      success: false,
      message: "Failed to load users"
    }, 500);
  }
}
