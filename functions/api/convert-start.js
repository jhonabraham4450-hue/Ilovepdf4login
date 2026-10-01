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

    const body = await request.json();

    const tool = String(body.tool || "")
      .trim()
      .toLowerCase();

    const filename = String(
      body.filename || "file"
    ).trim();

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

    const jobResponse = await fetch(
      CLOUDCONVERT_API,
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },

        body: JSON.stringify({
          tasks: {
            "upload-file": {
              operation: "import/upload"
            },

            "convert-file": {
              operation: "convert",
              input: "upload-file",
              input_format: conversion.input,
              output_format: conversion.output
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
          "Invalid response from CloudConvert."
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
        error: "CloudConvert did not return a job ID."
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

    const form =
      uploadTask?.result?.form;

    if (!form?.url || !form?.parameters) {
      return json({
        success: false,
        error:
          "CloudConvert upload form was not returned.",
        details: job
      }, 502);
    }

    return json({
      success: true,

      jobId: job.id,

      form: {
        url: form.url,
        parameters: form.parameters
      },

      filename: filename,

      outputFormat: conversion.output
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


function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache"
      }
    }
  );
}
