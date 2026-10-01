const CLOUDCONVERT_API =
  "https://api.cloudconvert.com/v2/jobs";

export async function onRequestGet({ request, env }) {
  try {
    const apiKey = env.CLOUDCONVERT_API_KEY;

    if (!apiKey) {
      return json({
        success: false,
        error: "CLOUDCONVERT_API_KEY is not configured."
      }, 500);
    }

    const url = new URL(request.url);
    const jobId = url.searchParams.get("job");

    if (!jobId) {
      return json({
        success: false,
        error: "Missing job id."
      }, 400);
    }

    /*
     * Get the CloudConvert job so we can find
     * the real exported file URL.
     */
    const jobResponse = await fetch(
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

    const jobText = await jobResponse.text();

    let jobData;

    try {
      jobData = JSON.parse(jobText);
    } catch {
      return json({
        success: false,
        error: "Invalid response from CloudConvert."
      }, 502);
    }

    if (!jobResponse.ok) {
      return json({
        success: false,
        error:
          jobData?.message ||
          jobData?.data?.message ||
          "Unable to get CloudConvert job.",
        details: jobData
      }, jobResponse.status);
    }

    const job = jobData?.data;

    if (!job) {
      return json({
        success: false,
        error: "CloudConvert job data was not returned."
      }, 502);
    }

    /*
     * Find the export task.
     */
    const exportTask =
      Array.isArray(job.tasks)
        ? job.tasks.find(
            task =>
              task.name === "export-file" ||
              task.operation === "export/url"
          )
        : null;

    if (!exportTask) {
      return json({
        success: false,
        error: "CloudConvert export task was not found."
      }, 404);
    }

    if (exportTask.status !== "finished") {
      return json({
        success: false,
        error:
          "Conversion is not finished yet.",
        status: job.status || exportTask.status
      }, 409);
    }

    const convertedFile =
      exportTask?.result?.files?.[0];

    if (!convertedFile?.url) {
      return json({
        success: false,
        error:
          "CloudConvert did not return a download URL."
      }, 404);
    }

    /*
     * Download the REAL converted binary from
     * CloudConvert.
     */
    const upstreamResponse = await fetch(
      convertedFile.url,
      {
        method: "GET",
        redirect: "follow",
        cf: {
          cacheTtl: 0,
          cacheEverything: false
        }
      }
    );

    if (!upstreamResponse.ok) {
      const errorText =
        await upstreamResponse.text();

      return json({
        success: false,
        error:
          errorText ||
          "Unable to download converted file."
      }, upstreamResponse.status);
    }

    const headers = new Headers();

    /*
     * Use CloudConvert's actual MIME type.
     */
    headers.set(
      "Content-Type",
      convertedFile.mime ||
      upstreamResponse.headers.get("Content-Type") ||
      "application/octet-stream"
    );

    /*
     * Use the actual converted filename.
     */
    const filename =
      convertedFile.filename ||
      "converted-file";

    headers.set(
      "Content-Disposition",
      `attachment; filename="${filename.replace(/"/g, "")}"`
    );

    /*
     * IMPORTANT:
     * Do NOT forward Content-Length.
     */
    headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    headers.set(
      "Pragma",
      "no-cache"
    );

    headers.set(
      "Expires",
      "0"
    );

    headers.set(
      "X-Content-Type-Options",
      "nosniff"
    );

    /*
     * Stream the REAL CloudConvert file.
     */
    return new Response(
      upstreamResponse.body,
      {
        status: 200,
        headers
      }
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
