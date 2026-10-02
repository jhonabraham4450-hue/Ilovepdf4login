export async function onRequestGet(context) {
  try {
    const url =
      new URL(context.request.url);

    const jobId =
      url.searchParams.get("job");

    if (!jobId) {
      return json({
        status: "error",
        error: "Missing job id."
      }, 400);
    }

    /*
      Ask the Render conversion engine
      for the current job status.
    */
    const renderResponse =
      await fetch(
        "https://free-conversion-engine.onrender.com/status/" +
        encodeURIComponent(jobId),
        {
          method: "GET",

          headers: {
            "Accept": "application/json"
          },

          cache: "no-store"
        }
      );

    const text =
      await renderResponse.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch (error) {
      return json({
        status: "error",
        error:
          "Render returned an invalid response."
      }, 502);
    }

    /*
      Render conversion finished.
    */
    if (
      data.status === "finished"
    ) {
      return json({
        status: "finished",

        url: data.url,

        filename:
          data.filename || "converted-file"
      });
    }

    /*
      Render conversion failed.
    */
    if (
      data.status === "error" ||
      data.status === "failed"
    ) {
      return json({
        status: "error",

        error:
          data.error ||
          data.message ||
          "Conversion failed."
      }, 500);
    }

    /*
      Still processing.
    */
    return json({
      status:
        data.status ||
        "processing"
    });

  } catch (error) {
    return json({
      status: "error",

      error:
        error?.message ||
        "Unable to check conversion status."
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
