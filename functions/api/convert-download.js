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

    /*
     IMPORTANT:
     Do NOT forward Content-Length.

     Cloudflare/Render may change the streamed
     response size/encoding. Sending the old
     Content-Length can cause mobile browsers
     to report "Failed" when saving.
    */

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

    headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    headers.set(
      "Pragma",
      "no-cache"
    );

    headers.set(
      "Expires",
      "0"
    );

    /*
     Allow the browser to receive the streamed file
     correctly through the same-origin download URL.
    */

    headers.set(
      "X-Content-Type-Options",
      "nosniff"
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
