```javascript
const FREE_ENGINE_URL =
  "https://free-conversion-engine.onrender.com";

export async function onRequestPost({ request }) {
  try {
    const contentType =
      request.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return json({
        success: false,
        error: "File upload request is required."
      }, 400);
    }

    const formData = await request.formData();

    const file = formData.get("file");

    const tool = String(
      formData.get("tool") || ""
    ).trim().toLowerCase();

    if (!file || typeof file === "string") {
      return json({
        success: false,
        error: "No file was uploaded."
      }, 400);
    }

    const conversions = {
      "word-to-pdf": {
        input: "docx",
        output: "pdf"
      },

      "powerpoint-to-pdf": {
        input: "pptx",
        output: "pdf"
      },

      "excel-to-pdf": {
        input: "xlsx",
        output: "pdf"
      },

      "pdf-to-word": {
        input: "pdf",
        output: "docx"
      },

      "pdf-to-powerpoint": {
        input: "pdf",
        output: "pptx"
      },

      "pdf-to-excel": {
        input: "pdf",
        output: "xlsx"
      }
    };

    const conversion = conversions[tool];

    if (!conversion) {
      return json({
        success: false,
        error:
          "Unsupported conversion tool: " + tool
      }, 400);
    }

    /*
     * Create a unique job ID.
     * The Render engine uses this same ID
     * for status and download.
     */
    const jobId =
      "job-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 10);

    /*
     * Send the uploaded file to the
     * Render conversion engine.
     */
    const engineForm =
      new FormData();

    engineForm.append(
      "file",
      file,
      file.name || "upload"
    );

    engineForm.append(
      "tool",
      tool
    );

    engineForm.append(
      "jobId",
      jobId
    );

    engineForm.append(
      "filename",
      file.name || "file"
    );

    const engineResponse =
      await fetch(
        FREE_ENGINE_URL + "/convert",
        {
          method: "POST",
          body: engineForm
        }
      );

    const responseText =
      await engineResponse.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      return json({
        success: false,
        error:
          "Invalid response from free conversion engine.",
        raw: responseText
      }, 502);
    }

    if (!engineResponse.ok) {
      return json({
        success: false,
        error:
          data?.error ||
          "Free conversion engine failed.",
        details: data
      }, engineResponse.status);
    }

    if (!data?.success) {
      return json({
        success: false,
        error:
          data?.error ||
          "Conversion could not be started.",
        details: data
      }, 502);
    }

    return json({
      success: true,

      jobId:
        data.jobId || jobId,

      status:
        data.status || "processing",

      filename:
        file.name || "file",

      outputFormat:
        conversion.output
    });

  } catch (error) {
    return json({
      success: false,
      error:
        error?.message ||
        "Unable to start conversion."
    }, 500);
  }
}


function json(
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        "Content-Type":
          "application/json",

        "Cache-Control":
          "no-store, no-cache, must-revalidate",

        "Pragma":
          "no-cache",

        "Expires":
          "0"
      }
    }
  );
}
```
