export async function onRequestPost(context) {

  try {

    const request = context.request;
    const contentType =
      request.headers.get("content-type") || "";

    /* =========================================
       FILE UPLOAD
    ========================================= */

    if (
      contentType
        .toLowerCase()
        .includes("multipart/form-data")
    ) {

      const formData =
        await request.formData();

      const file =
        formData.get("file");

      const tool =
        String(
          formData.get("tool") || ""
        ).trim().toLowerCase();

      const jobId =
        String(
          formData.get("jobId") || ""
        ).trim();

      const filename =
        String(
          formData.get("filename") ||
          file?.name ||
          "file"
        ).trim();

      if (!file || !(file instanceof File)) {
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

      if (!jobId) {
        return json({
          success: false,
          error: "Job ID was not received."
        }, 400);
      }

      /* ---------------------------------------
         Create NEW multipart form for Render
      --------------------------------------- */

      const renderForm =
        new FormData();

      renderForm.append(
        "tool",
        tool
      );

      renderForm.append(
        "jobId",
        jobId
      );

      renderForm.append(
        "filename",
        filename
      );

      renderForm.append(
        "file",
        file,
        file.name || filename
      );

      /* ---------------------------------------
         Send file to Render
      --------------------------------------- */

      const renderResponse =
        await fetch(
          "https://free-conversion-engine.onrender.com/convert",
          {
            method: "POST",
            body: renderForm,
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

        return json({
          success: false,
          error:
            "Render returned invalid JSON.",
          renderStatus:
            renderResponse.status,
          renderResponse:
            renderText.slice(0, 1000)
        }, 502);

      }

      if (!renderResponse.ok) {

        return json({
          success: false,
          error:
            renderData.error ||
            renderData.message ||
            "Render conversion request failed.",
          renderStatus:
            renderResponse.status
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
       CREATE JOB
    ========================================= */

    let body = {};

    if (
      contentType
        .toLowerCase()
        .includes("application/json")
    ) {

      const raw =
        await request.text();

      if (raw.trim()) {

        try {

          body =
            JSON.parse(raw);

        } catch {

          return json({
            success: false,
            error:
              "Invalid JSON request body."
          }, 400);

        }

      }

    }


    const tool =
      String(
        body.tool || ""
      ).trim().toLowerCase();

    const filename =
      String(
        body.filename ||
        "file"
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
        error:
          "Conversion tool was not received."
      }, 400);

    }


    if (!allowedTools.includes(tool)) {

      return json({
        success: false,
        error:
          "Unsupported conversion tool: " +
          tool
      }, 400);

    }


    const jobId =
      crypto.randomUUID();


    const uploadUrl =
      new URL(
        request.url
      ).origin +
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

  }

  catch (error) {

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

function json(
  data,
  status = 200
) {

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
