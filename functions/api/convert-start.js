```js
export async function onRequestPost(context) {
  try {
    const request = context.request;
    const contentType =
      request.headers.get("content-type") || "";

    /* =====================================================
       STEP 2 — FILE UPLOAD
       Browser will POST multipart file to this same endpoint.
       Cloudflare will forward it to Render.
    ===================================================== */

    if (
      contentType
        .toLowerCase()
        .includes("multipart/form-data")
    ) {
      const incomingForm =
        await request.formData();

      const renderForm =
        new FormData();

      for (const [key, value] of incomingForm.entries()) {
        if (value instanceof File) {
          renderForm.append(
            key,
            value,
            value.name
          );
        } else {
          renderForm.append(
            key,
            String(value)
          );
        }
      }

      const renderResponse =
        await fetch(
          "https://free-conversion-engine.onrender.com/convert",
          {
            method: "POST",
            body: renderForm
          }
        );

      const renderText =
        await renderResponse.text();

      return new Response(
        renderText,
        {
          status: renderResponse.status,
          headers: {
            "Content-Type":
              renderResponse.headers.get(
                "content-type"
              ) ||
              "application/json; charset=UTF-8",

            "Cache-Control":
              "no-store, no-cache, must-revalidate"
          }
        }
      );
    }

    /* =====================================================
       STEP 1 — CREATE JOB
    ===================================================== */

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
          return json(
            {
              error:
                "Invalid JSON request body."
            },
            400
          );
        }
      }
    }

    const tool =
      String(
        body?.tool || ""
      )
        .trim()
        .toLowerCase();

    const filename =
      String(
        body?.filename ||
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
      return json(
        {
          error:
            "Conversion tool was not received."
        },
        400
      );
    }

    if (
      !allowedTools.includes(tool)
    ) {
      return json(
        {
          error:
            "Unsupported conversion tool: " +
            tool
        },
        400
      );
    }

    const jobId =
      crypto.randomUUID();

    /*
      IMPORTANT:
      Upload URL is now this Cloudflare endpoint,
      NOT Render directly.
    */

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

  } catch (error) {
    return json(
      {
        error:
          error?.message ||
          "Unable to start conversion."
      },
      500
    );
  }
}


/* =====================================================
   JSON RESPONSE
===================================================== */

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
```
