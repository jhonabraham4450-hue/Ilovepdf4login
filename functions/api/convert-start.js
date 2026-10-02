export async function onRequestPost(context) {
  try {
    const request = context.request;
    const contentType =
      (request.headers.get("content-type") || "").toLowerCase();

    /* =========================================
       1. FILE UPLOAD REQUEST
    ========================================= */
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      const file = formData.get("file");

      const tool = String(
        formData.get("tool") || ""
      ).trim().toLowerCase();

      /*
       * Existing tool.html may not send jobId.
       * Therefore create one here if missing.
       */
      let jobId = String(
        formData.get("jobId") || ""
      ).trim();

      if (!jobId) {
        jobId = crypto.randomUUID();
      }

      const filename = String(
        formData.get("filename") ||
        (file && file.name) ||
        "file"
      ).trim();

      if (!file) {
        return json({
          success: false,
          error: "File was not received by Cloudflare."
        }, 400);
      }

      if (!tool) {
        return json({
          success: false,
          error: "Conversion tool was not received."
        }, 400);
      }

      /* =========================================
         SEND FILE TO RENDER
      ========================================= */

      const renderForm = new FormData();

      renderForm.append("tool", tool);
      renderForm.append("jobId", jobId);
      renderForm.append("filename", filename);

      renderForm.append(
        "file",
        file,
        file.name || filename
      );

      const renderResponse = await fetch(
        "https://free-conversion-engine.onrender.com/convert",
        {
          method: "POST",
          body: renderForm,
          headers: {
            "Accept": "application/json"
          }
        }
      );

      const renderText =
        await renderResponse.text();

      let renderData;

      try {
        renderData = JSON.parse(renderText);
      } catch {
        return json({
          success: false,
          error: "Render returned invalid JSON.",
          renderStatus: renderResponse.status,
          renderResponse: renderText.slice(0, 1000)
        }, 502);
      }

      if (!renderResponse.ok) {
        return json({
          success: false,
          error:
            renderData.error ||
            renderData.message ||
            "Render conversion request failed.",
          renderStatus: renderResponse.status
        }, renderResponse.status);
      }

      return json({
        success: true,
        jobId:
          renderData.jobId ||
          jobId,
        status:
          renderData.status ||
          "processing"
      });
    }

    /* =========================================
       2. CREATE JOB REQUEST
       Existing tool.html sends JSON here
    ========================================= */

    let body = {};

    if (contentType.includes("application/json")) {
      const raw = await request.text();

      if (raw.trim()) {
        try {
          body = JSON.parse(raw);
        } catch {
          return json({
            success: false,
            error: "Invalid JSON request body."
          }, 400);
        }
      }
    }

    const tool = String(
      body.tool || ""
    ).trim().toLowerCase();

    const filename = String(
      body.filename || "file"
    ).trim();

    const allowedTools = [
      "word-to-pdf",
      "powerpoint-to-pdf",
      "excel-to-pdf",
      "pdf-to-word",
      "pdf-to-powerpoint",
      "pdf-to-excel"
    ];

    if (!tool) {
      return json({
        success: false,
        error: "Conversion tool was not received."
      }, 400);
    }

    if (!allowedTools.includes(tool)) {
      return json({
        success: false,
        error:
          "Unsupported conversion tool: " + tool
      }, 400);
    }

    const jobId = crypto.randomUUID();

    /*
     * Upload goes back through the same Cloudflare
     * endpoint. This lets Cloudflare receive the
     * multipart file and forward it to Render.
     */
    const uploadUrl =
      new URL(request.url).origin +
      "/api/convert-start";

    return json({
      success: true,
      jobId: jobId,

      form: {
        url: uploadUrl,

        parameters: {
          tool: tool,
          jobId: jobId,
          filename: filename
        }
      }
    });

  } catch (error) {
    return json({
      success: false,
      error:
        error?.message ||
        "Conversion server error."
    }, 500);
  }
}


/* =========================================
   JSON RESPONSE
========================================= */

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status: status,

      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",

        "Cache-Control":
          "no-store, no-cache, must-revalidate"
      }
    }
  );
}
