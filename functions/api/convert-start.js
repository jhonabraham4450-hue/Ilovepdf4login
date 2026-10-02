```js
export async function onRequestPost(context) {
  try {
    const request = context.request;

    let body = {};

    /*
     * Read JSON safely.
     * tool.html sends:
     * {
     *   tool: "...",
     *   filename: "..."
     * }
     */
    const contentType =
      request.headers.get("content-type") || "";

    if (
      contentType
        .toLowerCase()
        .includes("application/json")
    ) {
      try {
        body = await request.json();
      } catch (error) {
        body = {};
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
        body?.filename || "file"
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

    /*
     * Create the same job ID that will be
     * sent to the Render conversion engine.
     */
    const jobId =
      crypto.randomUUID();

    /*
     * Render conversion endpoint.
     */
    const renderUrl =
      "https://free-conversion-engine.onrender.com/convert";

    /*
     * IMPORTANT:
     *
     * tool.html uploads the actual file to
     * form.url and automatically appends all
     * form.parameters.
     *
     * Therefore these parameters go directly
     * to Render as multipart form fields.
     */
    return json({
      success: true,

      jobId: jobId,

      form: {
        url: renderUrl,

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


/* =========================
   JSON RESPONSE
========================= */

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
