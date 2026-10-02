export async function onRequestPost(context) {
  try {
    const request = context.request;

    let body;

    try {
      body = await request.json();
    } catch (error) {
      return json({
        error: "Invalid JSON request."
      }, 400);
    }

    const tool = String(body?.tool || "").trim().toLowerCase();
    const filename = String(body?.filename || "file").trim();

    const allowedTools = [
      "word-to-pdf",
      "powerpoint-to-pdf",
      "excel-to-pdf",
      "pdf-to-word",
      "pdf-to-powerpoint",
      "pdf-to-excel"
    ];

    if (!allowedTools.includes(tool)) {
      return json({
        error: "Unsupported conversion tool: " + tool
      }, 400);
    }

    /*
      Generate a job ID here.
      The same ID will be sent to Render during upload.
    */
    const jobId =
      crypto.randomUUID();

    /*
      IMPORTANT:
      tool.html already expects:
        data.jobId
        data.form.url
        data.form.parameters

      So we keep that exact format.
    */
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
    return json({
      error:
        error?.message ||
        "Unable to start conversion."
    }, 500);
  }
}


function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status: status,

      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Cache-Control": "no-store"
      }
    }
  );
}
