import { json, getCookie } from "./_utils.js";

export async function onRequestGet({ request, env }) {

  try {

    /*
      ============================
      GET LOGGED-IN USER
      ============================
    */

    const username =
      getCookie(request, "auth_token");


    if (!username) {

      return json({
        success: false,
        message: "Login required"
      }, 401);

    }


    /*
      ============================
      CHECK ADMIN
      ============================
    */

    const admin =
      await env.DB.prepare(
        `SELECT
          id,
          username,
          mobile,
          email,
          email_verified,
          mobile_verified,
          is_admin,
          created_at
        FROM users
        WHERE username = ?
        LIMIT 1`
      )
      .bind(username)
      .first();


    if (!admin) {

      return json({
        success: false,
        message: "User account not found"
      }, 403);

    }


    /*
      ADMIN FLAG
      Must be 1
    */

    if (Number(admin.is_admin) !== 1) {

      return json({
        success: false,
        message: "Admin access denied",
        username: admin.username,
        is_admin: admin.is_admin
      }, 403);

    }


    /*
      ============================
      GET ALL USERS
      ============================
    */

    const usersResult =
      await env.DB.prepare(
        `SELECT
          id,
          username,
          mobile,
          email,
          email_verified,
          mobile_verified,
          is_admin,
          created_at
        FROM users
        ORDER BY id DESC`
      )
      .all();


    const users =
      usersResult.results || [];


    /*
      ============================
      DASHBOARD STATISTICS
      ============================
    */

    const totalUsers =
      users.length;


    let totalAdmins = 0;
    let verifiedEmail = 0;
    let verifiedMobile = 0;
    let verifiedUsers = 0;
    let todayUsers = 0;


    /*
      Current date in UTC
      SQLite / Cloudflare D1 uses UTC
    */

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);


    users.forEach(user => {

      if (
        Number(user.is_admin) === 1
      ) {

        totalAdmins++;

      }


      if (
        Number(user.email_verified) === 1
      ) {

        verifiedEmail++;

      }


      if (
        Number(user.mobile_verified) === 1
      ) {

        verifiedMobile++;

      }


      if (
        Number(user.email_verified) === 1 ||
        Number(user.mobile_verified) === 1
      ) {

        verifiedUsers++;

      }


      if (user.created_at) {

        const createdDate =
          String(user.created_at)
            .slice(0, 10);


        if (createdDate === today) {

          todayUsers++;

        }

      }

    });


    /*
      ============================
      RETURN ADMIN DASHBOARD DATA
      ============================
    */

    return json({

      success: true,

      admin: {
        id: admin.id,
        username: admin.username,
        mobile: admin.mobile,
        email: admin.email
      },

      totalUsers,

      stats: {

        totalUsers,

        totalAdmins,

        verifiedEmail,

        verifiedMobile,

        verifiedUsers,

        todayUsers

      },

      users

    });


  } catch (error) {

    console.error(
      "ADMIN API ERROR:",
      error
    );


    return json({

      success: false,

      message:
        "Failed to load admin dashboard",

      error:
        error?.message || "Unknown error"

    }, 500);

  }

}
