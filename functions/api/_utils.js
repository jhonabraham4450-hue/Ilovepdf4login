export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders
    }
  });
}

export function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(
    new RegExp("(^|;\\s*)" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)")
  );

  return match ? decodeURIComponent(match[2]) : null;
}

export function setCookie(name, value, options = {}) {
  const {
    maxAge = 60 * 60 * 24 * 7,
    httpOnly = true,
    secure = true,
    sameSite = "Lax",
    path = "/"
  } = options;

  return [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAge}`,
    `Path=${path}`,
    httpOnly ? "HttpOnly" : "",
    secure ? "Secure" : "",
    `SameSite=${sameSite}`
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearCookie(name) {
  return setCookie(name, "", {
    maxAge: 0
  });
}
