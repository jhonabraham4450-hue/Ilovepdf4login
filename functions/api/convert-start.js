```js
const CONVERTER_URL = "https://ilovepdf4-converter.onrender.com";

export async function onRequestPost({ request }) {
  try {
    const body = await request.json();

    const tool = String(body.tool || "").trim().toLowerCase();
    const filename = String(body.filename || "file");

    const allowedTools = [
      "word-to-pdf",
      "powerpoint-to-pdf",
      "excel-to-pdf",
      "pdf-to-word",
      "pdf-to-powerpoint",
      "pdf-to-excel"
    ];

    if (!allowedTools.includes(tool)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unsupported conversion tool: " + tool
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const jobId = crypto.randomUUID();

    return new Response(
      JSON.stringify({
        success: true,
        jobId: jobId,
        form: {
          url: CONVERTER_URL + "/convert",
          parameters: {
            tool: tool,
            jobId: jobId,
            filename: filename
          }
        }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error && error.message
          ? error.message
          : "Server error."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
```
