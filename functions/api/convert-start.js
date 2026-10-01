const CLOUDCONVERT_API =
  "https://api.cloudconvert.com/v2/jobs";

export async function onRequestPost({ request, env }) {
  try {
    const apiKey = env.CLOUDCONVERT_API_KEY;

    if (!apiKey) {
      return json({
        success: false,
        error: "CLOUDCONVERT_API_KEY is not configured."
      }, 500);
    }

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

    if (!conversions[tool]) {
      return json({
        success: false,
        error: "Unsupported conversion tool: " + tool
      }, 400);
    }

    const conversion = conversions[tool];

    /* Create CloudConvert job */

    const jobResponse = await fetch(
      CLOUDCONVERT_API,
      {
        method: "POST",

        headers: {
          "Authorization":
            `Bearer ${apiKey}`,

          "Content-Type":
            "application/json",

          "Accept":
            "application/json"
        },

        body: JSON.stringify({
          tasks: {

            "upload-file": {
              operation: "import/upload"
            },

            "convert-file": {
              operation: "convert",

              input: "upload-file",

              input_format:
                conversion.input,

              output_format:
                conversion.output
            },

            "export-file": {
              operation: "export/url",

              input: "convert-file"
            }
          }
        })
      }
    );

    const responseText =
      await jobResponse.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      return json({
        success: false,
        error:
          "Invalid response from CloudConvert.",
        raw: responseText
      }, 502);
    }

    if (!jobResponse.ok) {
      return json({
        success: false,

        error:
          data?.message ||
          data?.data?.message ||
          "CloudConvert job creation failed.",

        details: data
      }, jobResponse.status);
    }

    const job = data?.data;

    if (!job?.id) {
      return json({
        success: false,
        error:
          "CloudConvert did not return a job ID.",
        details: data
      }, 502);
    }

    const uploadTask =
      Array.isArray(job.tasks)
        ? job.tasks.find(
            task =>
              task.name === "upload-file" ||
              task.operation === "import/upload"
          )
        : null;

    const uploadForm =
      uploadTask?.result?.form;

    if (
      !uploadForm?.url ||
      !uploadForm?.parameters
    ) {
      return json({
        success: false,
        error:
          "CloudConvert upload form was not returned.",
        details: job
      }, 502);
    }

    /*
     * Worker uploads the user's file
     * directly to CloudConvert.
     */

    const cloudForm =
      new FormData();

    for (
      const [key, value]
      of Object.entries(uploadForm.parameters)
    ) {
      cloudForm.append(
        key,
        String(value)
      );
    }

    cloudForm.append(
      "file",
      file,
      file.name || "upload"
    );

    const uploadResponse =
      await fetch(
        uploadForm.url,
        {
          method: "POST",
          body: cloudForm
        }
      );

    if (!uploadResponse.ok) {
      const uploadText =
        await uploadResponse.text();

      return json({
        success: false,

        error:
          "CloudConvert file upload failed.",

        details: uploadText
      }, 502);
    }

    return json({
      success: true,

      jobId: job.id,

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
        "Unable to start CloudConvert conversion."
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
