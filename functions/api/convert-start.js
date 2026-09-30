export async function onRequestPost({ request }) {
  try {
    const body = await request.json();

    const tool = String(body.tool || "");
    const filename = String(body.filename || "file");

    const allowedTools = [
      "word-to-pdf",
      "powerpoint-to-pdf",
      "excel-to-pdf"
    ];

    if (!allowedTools.includes(tool)) {
      return json({
        success: false,
        error: "This conversion is not available on the free engine yet."
      }, 400);
    }

    const jobId = crypto.randomUUID();

    return json({
      success: true,
      jobId,
      form: {
        url: "https://ilovepdf4-converter.onrender.com/convert",
        parameters: {
          tool,
          jobId,
          filename
        }
      }
    });

  } catch (error) {
    return json({
      success: false,
      error: error?.message || "Server error."
    }, 500);
  }
}

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    }
  );
}
