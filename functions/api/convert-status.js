const CONVERTER_URL =
  "https://free-conversion-engine.onrender.com";

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get("job");

    if (!jobId) {
      return json({
        status: "error",
        error: "Missing job id."
      }, 400);
    }

    const response = await fetch(
      `${CONVERTER_URL}/status/${encodeURIComponent(jobId)}?t=${Date.now()}`,
      {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
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
          "Invalid response from conversion server."
      }, 502);
    }

    if (!response.ok) {
      return json(data, response.status);
    }

    if (data.status === "finished") {
      return json({
        success: true,
        status: "finished",
        jobId: jobId,
        filename: data.filename || "converted-file",
        downloadUrl:
          `${CONVERTER_URL}/download/${encodeURIComponent(jobId)}`
      });
    }

    if (data.status === "error") {
      return json({
        success: false,
        status: "error",
        jobId: jobId,
        error:
          data.error ||
          "Conversion failed."
      });
    }

    return json({
      success: true,
      status: data.status || "processing",
      jobId: jobId
    });

  } catch (error) {
    return json({
      status: "error",
      error:
        error?.message ||
        "Unable to connect to conversion server."
    }, 500);
  }
}

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache"
      }
    }
  );
}
