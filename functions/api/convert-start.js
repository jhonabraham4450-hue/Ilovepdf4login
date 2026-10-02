```js
export async function onRequestPost(context) {
  try {
    const request = context.request;

    let body = {};

    /* =========================
       READ JSON BODY
    ========================= */

    const contentType =
      request.headers.get("content-type") || "";

    if (
      contentType
        .toLowerCase()
        .includes("application/json")
    ) {
      try {
        body = await request.json();
      } catch {
        body = {};
      }
    }

    /* =========================
       GET TOOL
    ========================= */

    let tool = String(
      body.tool || ""
    )
      .trim()
      .toLowerCase();

    let filename = String(
      body.filename || "file"
    ).trim();

    /* =========================
       FALLBACK FROM REFERER
    ========================= */

    if (!tool) {
      const referer =
        request.headers.get("referer") || "";

      try {
        const refererUrl =
          new URL(referer);

        tool = String(
          refererUrl.searchParams.get("tool") || ""
        )
          .trim()
          .toLowerCase();
      } catch {}
    }

    /* =========================
       FALLBACK FROM REQUEST URL
    ========================= */

    if (!tool) {
      try {
        const requestUrl =
          new URL(request.url);

        tool = String(
          requestUrl.searchParams.get("tool") || ""
        )
          .trim()
          .toLowerCase();
      } catch {}
    }

    /* =========================
       DEFAULT ONLY FOR PDF TO WORD
       ========================= */

    if (!tool) {
      tool = "pdf-to-word";
    }

    /* =========================
       ALLOWED TOOLS
    ========================= */

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
          error:
            "Unsupported conversion tool: " + tool
        },
        400
      );
    }

    /* =========================
       CREATE JOB
    ========================= */

    const jobId =
      crypto.randomUUID();

    /* =========================
       RENDER CONVERSION SERVER
    ========================= */

    const renderUrl =
      "https://free-conversion-engine.onrender.com/convert";

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
        success: false,
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
