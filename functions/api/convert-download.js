const CLOUDCONVERT_API =
  "https://api.cloudconvert.com/v2/jobs";

export async function onRequestGet({ request, env }) {

  try {

    const apiKey =
      env.CLOUDCONVERT_API_KEY;

    if (!apiKey) {

      return json({
        success: false,
        error: "CLOUDCONVERT_API_KEY is not configured."
      }, 500);

    }

    const url =
      new URL(request.url);

    const jobId =
      url.searchParams.get("job");

    if (!jobId) {

      return json({
        success: false,
        error: "Missing job id."
      }, 400);

    }

    const response =
      await fetch(
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

    const text =
      await response.text();

    let data;

    try {

      data = JSON.parse(text);

    } catch {

      return json({
        success: false,
        error: "Invalid response from CloudConvert."
      }, 502);

    }

    if (!response.ok) {

      return json({
        success: false,
        error:
          data?.message ||
          data?.data?.message ||
          "Unable to get CloudConvert job.",
        details: data
      }, response.status);

    }

    const job =
      data?.data;

    if (!job) {

      return json({
        success: false,
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

    if (!exportTask) {

      return json({
        success: false,
        error: "CloudConvert export task was not found.",
        status: job.status || "unknown"
      }, 404);

    }

    if (exportTask.status !== "finished") {

      return json({
        success: false,
        error: "Conversion is not finished yet.",
        status:
          job.status ||
          exportTask.status
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
     * IMPORTANT
     *
     * Instead of proxying the converted
     * binary through Cloudflare, redirect
     * the browser directly to CloudConvert's
     * signed download URL.
     *
     * This avoids mobile Chrome download
     * failures caused by streaming the file
     * through the Worker.
     */

    return Response.redirect(
      convertedFile.url,
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

        "Pragma":
          "no-cache",

        "Expires":
          "0"
      }
    }
  );

}
