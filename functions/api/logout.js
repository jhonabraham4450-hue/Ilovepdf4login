import { json, clearCookie } from "./_utils.js";

export async function onRequestPost() {
  return json(
    {
      success: true,
      message: "Logged out successfully"
    },
    200,
    {
      "Set-Cookie": clearCookie("auth_token")
    }
  );
}
