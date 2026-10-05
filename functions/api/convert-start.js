const RENDER_URL = "https://free-conversion-engine.onrender.com";

export async function onRequestPost(context) {
  try {
    const request = context.request;

    const contentType =
      request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return json(
        {
          success: false,
          error: "Invalid request. Multipart file upload is required."
        },
        400
      );
    }

    const incomingForm = await request.formData();

    const file = incomingForm.get("file");
    const tool = incomingForm.get("tool");

    if (!file || typeof file === "string") {
      return json(
        {
          success: false,
          error: "File was not received."
        },
        400
      );
    }

    if (!tool || typeof tool !== "string") {
      return json(
        {
          success: false,
          error: "Conversion tool was not received."
        },
        400
      );
    }

    /*
      Send the uploaded file directly
      to the free Render conversion engine.
    */

    const renderForm = new FormData();

    renderForm.append(
      "file",
      file,
      file.name || "input-file"
    );

    renderForm.append(
      "tool",
      tool
    );

    const renderResponse = await fetch(
      `${RENDER_URL}/convert`,
      {
        method: "POST",
        body: renderForm
      }
    );

    const renderText =
      await renderResponse.text();

    let renderData;

    try {
      renderData = JSON.parse(renderText);
    } catch {
      return json(
        {
          success: false,
          error:
            "Invalid response from free conversion engine.",
          details: renderText.slice(0, 1000)
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
            "Free conversion engine rejected the request.",
          details: renderData
        },
        renderResponse.status
      );
    }

    if (!renderData.success) {
      return json(
        {
          success: false,
          error:
            renderData.error ||
            renderData.message ||
            "Conversion job could not be created."
        },
        502
      );
    }

    if (!renderData.jobId) {
      return json(
        {
          success: false,
          error:
            "Free conversion engine did not return a job ID.",
          details: renderData
        },
        502
      );
    }

    return json({
      success: true,
      jobId: renderData.jobId,
      status:
        renderData.status || "processing",
      tool: tool,
      filename:
        renderData.filename ||
        file.name ||
        "converted"
    });

  } catch (error) {
    console.error(
      "convert-start error:",
      error
    );

    return json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to start conversion."
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
