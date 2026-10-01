const FREE_ENGINE_URL =
  "https://free-conversion-engine.onrender.com";

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);

    const jobId =
      url.searchParams.get("job") ||
      url.searchParams.get("jobId");

    if (!jobId) {
      return json({
        status: "error",
        error: "Missing job id."
      }, 400);
    }

    const response = await fetch(
      FREE_ENGINE_URL +
        "/status/" +
        encodeURIComponent(jobId),
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Cache-Control": "no-cache"
        }
      }
    );

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return json({
        status: "error",
        error:
          "Invalid response from free conversion engine."
      }, 502);
    }

    if (!response.ok) {
      return json({
        status: "error",
        error:
          data?.error ||
          "Unable to get conversion status.",
        details: data
      }, response.status);
    }

    if (!data) {
      return json({
        status: "error",
        error:
          "Conversion engine returned no status."
      }, 502);
    }

    return json({
      status:
        data.status || "unknown",

      jobId:
        data.jobId || jobId,

    downloadUrl:
  data.url
    ? data.url.replace(/^http:/i, "https:")
    : null,

      filename:
        data.filename || null,

      contentType:
        data.contentType || null
    });

  } catch (error) {
    return json({
      status: "error",
      error:
        error?.message ||
        "Unable to connect to free conversion engine."
    }, 500);
  }
}

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    }
  );
}
