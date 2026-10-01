const CONVERTER_URL =
  "https://ilovepdf4-converter.onrender.com";

export async function onRequestGet({ request }) {

  try {

    const url = new URL(request.url);
    const jobId = url.searchParams.get("job");

    if (!jobId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing job id."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const downloadUrl =
      CONVERTER_URL +
      "/download/" +
      encodeURIComponent(jobId);

    const upstreamResponse = await fetch(downloadUrl, {
      method: "GET",
      redirect: "follow",
      cf: {
        cacheTtl: 0,
        cacheEverything: false
      }
    });

    if (!upstreamResponse.ok) {

      const errorText =
        await upstreamResponse.text();

      return new Response(
        JSON.stringify({
          success: false,
          error:
            errorText ||
            "Unable to download converted file."
        }),
        {
          status: upstreamResponse.status,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const headers = new Headers();

    const contentType =
      upstreamResponse.headers.get("Content-Type");

    const contentDisposition =
      upstreamResponse.headers.get("Content-Disposition");

    const contentLength =
      upstreamResponse.headers.get("Content-Length");

    headers.set(
      "Content-Type",
      contentType ||
      "application/octet-stream"
    );

    if (contentDisposition) {
      headers.set(
        "Content-Disposition",
        contentDisposition
      );
    } else {
      headers.set(
        "Content-Disposition",
        'attachment; filename="converted-file"'
      );
    }

    if (contentLength) {
      headers.set(
        "Content-Length",
        contentLength
      );
    }

    headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    headers.set(
      "Pragma",
      "no-cache"
    );

    return new Response(
      upstreamResponse.body,
      {
        status: 200,
        headers
      }
    );

  } catch (error) {

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error?.message ||
          "Download failed."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
