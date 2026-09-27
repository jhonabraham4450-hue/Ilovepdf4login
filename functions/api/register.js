```javascript
import { json, setCookie } from "./_utils.js";

export async function onRequestPost({ request }) {
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

    if (!email.endsWith("@gmail.com")) {
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
        message: "Invalid request"
      },
      400
    );
  }
}
```
