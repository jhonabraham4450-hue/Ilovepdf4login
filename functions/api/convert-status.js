const RENDER_URL =
  "https://free-conversion-engine.onrender.com";

export async function onRequestGet(context) {
  try {
    const url =
      new URL(context.request.url);

    const jobId =
      url.searchParams.get("job");

    if (!jobId) {
      return json(
        {
          success: false,
          error: "Job ID was not provided."
        },
        400
      );
    }

    const renderResponse =
      await fetch(
        `${RENDER_URL}/status/${encodeURIComponent(jobId)}`,
        {
          method: "GET",
          headers: {
            "Accept":
              "application/json"
          }
        }
      );

    const renderText =
      await renderResponse.text();

    let renderData;

    try {
      renderData =
        JSON.parse(renderText);
    } catch {
      return json(
        {
          success: false,
          error:
            "Invalid response from free conversion engine.",
          details:
            renderText.slice(0, 1000)
        },
        502
      );
    }

    if (!renderResponse.ok) {
      return json(
        {
          success: false,
          error:
            renderData.error ||
            renderData.message ||
            "Unable to check conversion status."
        },
        renderResponse.status
      );
    }

    /*
      Normalize every possible status
      returned by the Render server.
    */

    const status =
      renderData.status ||
      renderData.state ||
      "processing";

    /*
      If conversion is finished,
      create a direct Render download URL.
    */

    if (
      status === "finished" ||
      status === "completed" ||
      status === "success"
    ) {
      const downloadUrl =
        renderData.downloadUrl ||
        renderData.url ||
        renderData.resultUrl ||
        renderData.download_url ||
        (
          renderData.result &&
          (
            renderData.result.url ||
            renderData.result.downloadUrl
          )
        );

      let finalDownloadUrl =
        downloadUrl;

      if (!finalDownloadUrl) {
        finalDownloadUrl =
          `${RENDER_URL}/download/${encodeURIComponent(jobId)}`;
      }

      return json({
        success: true,
        status: "finished",

        jobId: jobId,

        downloadUrl:
          finalDownloadUrl,

        url:
          finalDownloadUrl,

        resultUrl:
          finalDownloadUrl,

        filename:
          renderData.filename ||
          renderData.outputFilename ||
          "converted-file",

        message:
          renderData.message ||
          "Conversion completed successfully."
      });
    }

    /*
      Conversion failed.
    */

    if (
      status === "error" ||
      status === "failed" ||
      status === "failure"
    ) {
      return json(
        {
          success: false,
          status: "failed",
          jobId: jobId,
          error:
            renderData.error ||
            renderData.message ||
            "Conversion failed."
        },
        500
      );
    }

    /*
      Still processing.
    */

    return json({
      success: true,
      status: "processing",
      jobId: jobId,

      progress:
        renderData.progress ??
        null,

      message:
        renderData.message ||
        "Conversion is still processing."
    });

  } catch (error) {
    console.error(
      "convert-status error:",
      error
    );

    return json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to check conversion status."
      },
      500
    );
  }
}


function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        "Cache-Control":
          "no-store, no-cache, must-revalidate"
      }
    }
  );
}
