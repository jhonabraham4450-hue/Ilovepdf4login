const CONVERTER_URL =
  "https://free-conversion-engine.onrender.com";

export async function onRequestPost({ request }) {
  try {
    const incomingForm = await request.formData();

    const tool = String(
      incomingForm.get("tool") || ""
    )
      .trim()
      .toLowerCase();

    const file = incomingForm.get("file");

    const allowedTools = [
      "word-to-pdf",
      "powerpoint-to-pdf",
      "excel-to-pdf",
      "pdf-to-word",
      "pdf-to-powerpoint",
      "pdf-to-excel"
    ];

    if (!allowedTools.includes(tool)) {
      return json(
        {
          success: false,
          error: "Unsupported conversion tool: " + tool
        },
        400
      );
    }

    if (!(file instanceof File)) {
      return json(
        {
          success: false,
          error: "No file uploaded."
        },
        400
      );
    }

    const renderForm = new FormData();

    renderForm.append(
      "file",
      file,
      file.name
    );

    renderForm.append(
      "tool",
      tool
    );

    const renderResponse = await fetch(
      CONVERTER_URL + "/convert",
      {
        method: "POST",
        body: renderForm,
        headers: {
          "Accept": "application/json"
        }
      }
    );

    const responseText =
      await renderResponse.text();

    let data = null;

    try {
      data = JSON.parse(responseText);
    } catch {
      return json(
        {
          success: false,
          error:
            "Render returned a non-JSON response.",
          details:
            responseText ||
            "Empty response",
          httpStatus:
            renderResponse.status
        },
        502
      );
    }

    if (!renderResponse.ok || !data.success) {
      return json(
        {
          success: false,
          error:
            data.error ||
            "Unable to start conversion.",
          details:
            data.details ||
            null,
          httpStatus:
            renderResponse.status
        },
        renderResponse.status || 502
      );
    }

    return json(
      {
        success: true,
        jobId: data.jobId,
        status:
          data.status || "processing"
      },
      200
    );

  } catch (error) {
    return json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to start conversion."
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
          "application/json; charset=UTF-8",
        "Cache-Control":
          "no-store, no-cache, must-revalidate"
      }
    }
  );
}
