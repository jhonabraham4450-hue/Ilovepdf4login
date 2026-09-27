import { json, getCookie } from "./_utils.js";

export async function onRequestGet({ request }) {
  const username = getCookie(request, "auth_token");

  if (!username) {
    return json(
      {
        loggedIn: false,
        message: "Not logged in"
      },
      401
    );
  }

  return json(
    {
      loggedIn: true,
      user: {
        username
      }
    },
    200
  );
}
