export async function onRequest(context) {
  const { request } = context;

  // Get authentication cookie
  const cookie = request.headers.get("Cookie") || "";

  const match = cookie.match(/auth_token=([^;]+)/);

  if (!match) {
    return new Response(
      JSON.stringify({
        loggedIn: false,
        message: "Not logged in"
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  try {
    const token = decodeURIComponent(match[1]);

    // Basic session information
    return new Response(
      JSON.stringify({
        loggedIn: true,
        user: {
          username: token
        }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        loggedIn: false,
        message: "Invalid session"
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
