export async function onRequest() {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Logged out successfully"
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "auth_token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
      }
    }
  );
}
