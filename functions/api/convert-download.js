const CONVERTER_URL =
  "https://ilovepdf4-converter.onrender.com";

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get("job");

    if (!jobId) {
      return new Response("Missing job id.", {
        status: 400
      });
    }

    const response = await fetch(
      `${CONVERTER_URL}/download/${encodeURIComponent(jobId)}`
    );

    if (!response.ok) {
      const text = await response.text();

      return new Response(
        text || "File is not ready.",
        {
          status: response.status
        }
      );
    }

    const headers = new Headers();

    headers.set(
      "Content-Type",
      response.headers.get("Content-Type") ||
      "application/pdf"
    );

    const disposition =
      response.headers.get("Content-Disposition");

    if (disposition) {
      headers.set(
        "Content-Disposition",
        disposition
      );
    } else {
      headers.set(
        "Content-Disposition",
        'attachment; filename="converted.pdf"'
      );
    }

    return new Response(
      response.body,
      {
        status: 200,
        headers
      }
    );

  } catch (error) {
    return new Response(
      error?.message || "Download failed.",
      {
        status: 500
      }
    );
  }
}
