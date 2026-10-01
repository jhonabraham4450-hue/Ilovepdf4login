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

    const response = await fetch(
      `${CONVERTER_URL}/download/${encodeURIComponent(jobId)}`,
      {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache"
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      return new Response(
        JSON.stringify({
          success: false,
          error: errorText || "File is not ready."
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const fileBuffer = await response.arrayBuffer();

    if (!fileBuffer || fileBuffer.byteLength === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Downloaded file is empty."
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

    const headers = new Headers();

    headers.set(
      "Content-Type",
      response.headers.get("Content-Type") ||
        "application/octet-stream"
    );

    const disposition =
      response.headers.get("Content-Disposition");

    headers.set(
      "Content-Disposition",
      disposition ||
        'attachment; filename="converted-file"'
    );

    headers.set(
      "Content-Length",
      String(fileBuffer.byteLength)
    );

    headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    headers.set("Pragma", "no-cache");

    return new Response(fileBuffer, {
      status: 200,
      headers
    });

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
