export async function onRequestGet(context) {

  try {

    const url =
      new URL(context.request.url);

    const jobId =
      url.searchParams.get("job");

    if (!jobId) {

      return Response.json(
        {
          status: "error",
          error: "Missing job ID."
        },
        { status: 400 }
      );
    }

    /*
      Ask Render conversion engine
      for the current job status.
    */
    const renderStatusUrl =
      "https://free-conversion-engine.onrender.com/status/" +
      encodeURIComponent(jobId);

    const response =
      await fetch(
        renderStatusUrl,
        {
          method: "GET",
          headers: {
            "Accept": "application/json"
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

      return Response.json(
        {
          status: "error",
          error:
            "Conversion engine returned invalid response."
        },
        { status: 502 }
      );
    }

    if (!response.ok) {

      return Response.json(
        {
          status:
            data.status || "error",

          error:
            data.error ||
            "Conversion engine error."
        },
        {
          status: response.status
        }
      );
    }

    /*
      Render already returns:
      status
      url
      filename
    */

    if (data.status === "finished") {

      return Response.json({

        status: "finished",

        url: data.url,

        filename:
          data.filename || "converted-file"

      });
    }

    if (
      data.status === "error" ||
      data.status === "failed"
    ) {

      return Response.json({

        status: "error",

        error:
          data.error ||
          "Conversion failed."

      });
    }

    return Response.json({

      status:
        data.status || "processing"

    });

  } catch (error) {

    console.error(
      "convert-status error:",
      error
    );

    return Response.json(
      {
        status: "error",

        error:
          error?.message ||
          "Unable to check conversion status."
      },
      { status: 500 }
    );
  }
}
