import { env as workerEnv } from "cloudflare:workers";

export async function onRequestPost({ request }) {
  try {
    const apiKey = workerEnv.CLOUDCONVERT_API_KEY;

    if (!apiKey) {
      return json({
        success: false,
        error: "CLOUDCONVERT_API_KEY is not available in the Production Worker."
      }, 500);
    }

    const body = await request.json();

    const tool = String(body.tool || "");
    const filename = String(body.filename || "file");

    const inputFormat = getExtension(filename);

    const outputMap = {
      "word-to-pdf": "pdf",
      "powerpoint-to-pdf": "pdf",
      "excel-to-pdf": "pdf",

      "pdf-to-word": "docx",
      "pdf-to-powerpoint": "pptx",
      "pdf-to-excel": "xlsx"
    };

    const outputFormat = outputMap[tool];

    if (!outputFormat) {
      return json({
        success: false,
        error: "This tool does not use the CloudConvert backend."
      }, 400);
    }

    if (!inputFormat) {
      return json({
        success: false,
        error: "Could not detect the input file format."
      }, 400);
    }

    const payload = {
      tasks: {
        "upload-file": {
          operation: "import/upload"
        },

        "convert-file": {
          operation: "convert",
          input: "upload-file",
          input_format: inputFormat,
          output_format: outputFormat
        },

        "export-file": {
          operation: "export/url",
          input: "convert-file"
        }
      }
    };

    const response = await fetch(
      "https://api.cloudconvert.com/v2/jobs",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return json({
        success: false,
        error:
          result?.message ||
          result?.data?.message ||
          "CloudConvert job creation failed."
      }, response.status);
    }

    const tasks = result?.data?.tasks || [];

    const uploadTask = tasks.find(
      task =>
        task.name === "upload-file" ||
        task.operation === "import/upload"
    );

    if (
      !uploadTask ||
      !uploadTask.result ||
      !uploadTask.result.form
    ) {
      return json({
        success: false,
        error: "CloudConvert did not return an upload form."
      }, 502);
    }

    return json({
      success: true,
      jobId: result.data.id,
      form: uploadTask.result.form
    });

  } catch (error) {
    return json({
      success: false,
      error: error?.message || "Server error."
    }, 500);
  }
}


function getExtension(filename) {
  const clean = filename
    .split("?")[0]
    .split("#")[0]
    .toLowerCase();

  let extension = "";

  if (clean.includes(".")) {
    extension = clean.split(".").pop();
  }

  if (extension === "jpeg") {
    extension = "jpg";
  }

  return extension;
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
