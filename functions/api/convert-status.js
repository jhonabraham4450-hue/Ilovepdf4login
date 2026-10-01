```javascript
const CONVERTER_URL =
  "https://ilovepdf4-converter.onrender.com";

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get("job");

    if (!jobId) {
      return json({
        status: "error",
        error: "Missing job id."
      });
    }

    const response = await fetch(
      `${CONVERTER_URL}/status/${encodeURIComponent(jobId)}`,
      {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache"
        }
      }
    );

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return json({
        status: "error",
        error:
          "Conversion server returned invalid response. HTTP " +
          response.status
      });
    }

    if (!response.ok) {
      return json({
        status: "error",
        error:
          data.error ||
          data.message ||
          "Conversion server returned HTTP " +
          response.status
      });
    }

    return json(data);

  } catch (error) {
    return json({
      status: "error",
      error:
        error?.message ||
        "Unable to check conversion status."
    });
  }
}

function json(data) {
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache"
      }
    }
  );
}
```
