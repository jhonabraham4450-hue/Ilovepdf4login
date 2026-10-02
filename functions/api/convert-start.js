export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const tool = String(body.tool || "").trim().toLowerCase();
    const filename = String(body.filename || "file").trim();

    const allowedTools = [
      "word-to-pdf",
      "powerpoint-to-pdf",
      "excel-to-pdf",
      "pdf-to-word",
      "pdf-to-powerpoint",
      "pdf-to-excel"
    ];

    if (!allowedTools.includes(tool)) {
      return Response.json(
        {
          error: "Unsupported conversion tool."
        },
        { status: 400 }
      );
    }

    /*
      Create our own job ID.
      Render uses this same ID.
    */
    const jobId =
      crypto.randomUUID();

    /*
      IMPORTANT:
      This is the Render conversion engine,
      NOT CloudConvert.
    */
    const renderUrl =
      "https://free-conversion-engine.onrender.com/convert";

    return Response.json({
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

    console.error(
      "convert-start error:",
      error
    );

    return Response.json(
      {
        error:
          error?.message ||
          "Unable to start conversion."
      },
      { status: 500 }
    );
  }
}
