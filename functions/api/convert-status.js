const CLOUDCONVERT_API =
  "https://api.cloudconvert.com/v2/jobs";

export async function onRequestGet({ request, env }) {
  try {
    const apiKey = env.CLOUDCONVERT_API_KEY;

    if (!apiKey) {
      return json({
        status: "error",
        error: "CLOUDCONVERT_API_KEY is not configured."
      }, 500);
    }

    const url = new URL(request.url);
    const jobId = url.searchParams.get("job");

    if (!jobId) {
      return json({
        status: "error",
        error: "Missing job id."
      }, 400);
    }

    const response = await fetch(
      `${CLOUDCONVERT_API}/${encodeURIComponent(jobId)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json",
          "Cache-Control": "no-cache"
        },
        cf: {
          cacheTtl: 0,
          cacheEverything: false
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
        error: "Invalid response from CloudConvert."
      }, 502);
    }

    if (!response.ok) {
      return json({
        status: "error",
        error:
          data?.message ||
          data?.data?.message ||
          "Unable to get CloudConvert job status.",
        details: data
      }, response.status);
    }

    const job = data?.data;

    if (!job) {
      return json({
        status: "error",
        error: "CloudConvert job data was not returned."
      }, 502);
    }

    const exportTask =
      Array.isArray(job.tasks)
        ? job.tasks.find(
            task =>
              task.name === "export-file" ||
              task.operation === "export/url"
          )
        : null;

    let downloadUrl = null;

    if (
      exportTask &&
      exportTask.status === "finished" &&
      exportTask.result &&
      Array.isArray(exportTask.result.files) &&
      exportTask.result.files.length > 0
    ) {
      downloadUrl =
        exportTask.result.files[0].url || null;
    }

    return json({
      status: job.status || "unknown",
      jobId: job.id,

      downloadUrl: downloadUrl,

      filename:
        exportTask?.result?.files?.[0]?.filename ||
        null,

      contentType:
        exportTask?.result?.files?.[0]?.mime ||
        null
    });

  } catch (error) {
    return json({
      status: "error",
      error:
        error?.message ||
        "Unable to connect to CloudConvert."
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
