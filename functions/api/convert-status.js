export async function onRequestGet({ request, env }) {
  try {
    if (!env.CLOUDCONVERT_API_KEY) {
      return json({
        error: "CLOUDCONVERT_API_KEY is not configured."
      }, 500);
    }

    const url = new URL(request.url);
    const jobId = url.searchParams.get("job");

    if (!jobId) {
      return json({
        error: "Missing job id."
      }, 400);
    }

    const response = await fetch(
      `https://api.cloudconvert.com/v2/jobs/${encodeURIComponent(jobId)}`,
      {
        method: "GET",
        headers: {
          "Authorization":
            `Bearer ${env.CLOUDCONVERT_API_KEY}`
        }
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return json({
        error:
          result.message ||
          "Could not read conversion status."
      }, response.status);
    }

    const job = result.data || {};
    const tasks = job.tasks || [];

    const convertTask = tasks.find(
      task =>
        task.name === "convert-file" ||
        task.operation === "convert"
    );

    const exportTask = tasks.find(
      task =>
        task.name === "export-file" ||
        task.operation === "export/url"
    );

    if (
      job.status === "error" ||
      convertTask?.status === "error"
    ) {
      return json({
        status: "error",
        error:
          convertTask?.message ||
          job.message ||
          "Conversion failed."
      });
    }

    if (
      exportTask &&
      exportTask.status === "finished"
    ) {
      const file =
        exportTask.result?.files?.[0];

      if (!file?.url) {
        return json({
          status: "error",
          error:
            "Conversion finished but no download URL was returned."
        }, 502);
      }

      return json({
        status: "finished",
        url: file.url,
        filename:
          file.filename ||
          "iLovePDF4-output"
      });
    }

    return json({
      status:
        job.status ||
        "processing"
    });

  } catch (error) {

    return json({
      error:
        error.message ||
        "Server error."
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
          "no-store"
      }
    }
  );
}
