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
        success: false,
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
        success: false,
        error:
          "Invalid response from free conversion engine."
      }, 502);
    }

    if (!response.ok) {
      return json({
        success: false,
        error:
          data?.error ||
          "Unable to get conversion status.",
        details: data
      }, response.status);
    }

    if (!data) {
      return json({
        success: false,
        error:
          "Conversion engine returned no data."
      }, 502);
    }

    if (data.status !== "finished") {
      return json({
        success: false,
        error: "Conversion is not finished yet.",
        status: data.status || "unknown",
        jobId: data.jobId || jobId
      }, 409);
    }

    if (!data.url) {
      return json({
        success: false,
        error:
          "Free conversion engine did not return a download URL.",
        status: data.status,
        jobId: data.jobId || jobId
      }, 404);
    }

    return Response.redirect(
      data.url,
      302
    );

  } catch (error) {
    return json({
      success: false,
      error:
        error?.message ||
        "Download failed."
    }, 500);
  }
}

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status: status,
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
