```js
export async function onRequestPost(context) {
  try {
    const request = context.request;

    let body = {};

    const contentType =
      request.headers.get("content-type") || "";

    if (
      contentType
        .toLowerCase()
        .includes("application/json")
    ) {
      const raw = await request.text();

      if (raw.trim()) {
        try {
          body = JSON.parse(raw);
        } catch (error) {
          return json(
            {
              error: "Invalid JSON request body."
            },
            400
          );
        }
      }
    }

    let tool = String(
      body?.tool || ""
    )
      .trim()
      .toLowerCase();

    const filename = String(
      body?.filename || "file"
    ).trim();

    /*
      Fallback:
      If tool is missing from the JSON body,
      try to read it from the request URL.
    */
    if (!tool) {
      try {
        const requestUrl =
          new URL(request.url);

        tool = String(
          requestUrl.searchParams.get("tool") || ""
        )
          .trim()
          .toLowerCase();
      } catch (error) {
        tool = "";
      }
    }

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

    if (!allowedTools.includes(tool)) {
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

    return json({
      success: true,

      jobId: jobId,

      form: {
        url:
          "https://free-conversion-engine.onrender.com/convert",

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
