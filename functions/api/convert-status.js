export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const jobId = url.searchParams.get("job");

    if (!jobId) {
      return json({
        status: "error",
        error: "Missing job id."
      }, 400);
    }

    const renderResponse = await fetch(
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

    const text = await renderResponse.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return json({
        status: "error",
        error: "Render returned an invalid response."
      }, 502);
    }

    if (
      data.status === "finished" ||
      data.status === "complete" ||
      data.status === "completed"
    ) {

      // Render URL থাকলে সেটি ব্যবহার করবে।
      // না থাকলে আমরা নিজেরাই download URL তৈরি করব।
      const downloadUrl =
        data.url ||
        data.downloadUrl ||
        data.resultUrl ||
        data.result?.url ||
        (
          "https://free-conversion-engine.onrender.com/download/" +
          encodeURIComponent(jobId)
        );

      return json({
        status: "finished",
        url: downloadUrl,
        downloadUrl: downloadUrl,
        resultUrl: downloadUrl,
        filename:
          data.filename ||
          data.result?.filename ||
          "converted-file"
      });
    }

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

    return json({
      status: data.status || "processing"
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
      status,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Cache-Control":
          "no-store, no-cache, must-revalidate"
      }
    }
  );
}
