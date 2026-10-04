const CONVERTER_URL =
  "https://free-conversion-engine.onrender.com";

export async function onRequestGet({ request }) {
  try {

    const url =
      new URL(request.url);

    const jobId =
      url.searchParams.get("job");

    if (!jobId) {

      return json(
        {
          success: false,
          status: "error",
          error: "Missing job id."
        },
        400
      );

    }


    const response =
      await fetch(
        `${CONVERTER_URL}/status/${encodeURIComponent(jobId)}?t=${Date.now()}`,
        {
          method: "GET",

          headers: {
            "Cache-Control":
              "no-cache, no-store, must-revalidate",

            "Pragma":
              "no-cache"
          }
        }
      );


    const text =
      await response.text();


    let data;


    try {

      data =
        JSON.parse(text);

    } catch {

      return json(
        {
          success: false,
          status: "error",
          error:
            "Invalid response from conversion server.",
          details:
            text || "Empty response"
        },
        502
      );

    }


    if (!response.ok) {

      return json(
        {
          success: false,
          status: "error",
          error:
            data.error ||
            data.message ||
            "Conversion server error."
        },
        response.status || 502
      );

    }


    /*
      RENDER JOB FINISHED
    */

    if (
      data.status === "finished" ||
      data.status === "completed"
    ) {

      return json(
        {
          success: true,

          status: "finished",

          jobId: jobId,

          filename:
            data.filename ||
            "converted-file",

          downloadUrl:
            `${CONVERTER_URL}/download/${encodeURIComponent(jobId)}`
        }
      );

    }


    /*
      RENDER JOB FAILED
    */

    if (
      data.status === "error" ||
      data.status === "failed"
    ) {

      return json(
        {
          success: false,

          status: "error",

          jobId: jobId,

          error:
            data.error ||
            data.message ||
            "Conversion failed."
        }
      );

    }


    /*
      STILL PROCESSING
    */

    return json(
      {
        success: true,

        status:
          data.status ||
          "processing",

        jobId: jobId
      }
    );


  } catch (error) {

    return json(
      {
        success: false,

        status: "error",

        error:
          error?.message ||
          "Unable to connect to conversion server."
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
          "no-store, no-cache, must-revalidate",

        "Pragma":
          "no-cache"
      }
    }
  );

}
