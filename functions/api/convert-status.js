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
      }, 400);
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
        error: "Conversion server returned an invalid response."
      }, 502);
    }

    return json(data, response.status);

  } catch (error) {
    return json({
      status: "error",
      error: error?.message || "Unable to check conversion status."
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
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    }
  );
}
```
