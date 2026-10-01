```javascript
const CONVERTER_URL =
  "https://ilovepdf4-converter.onrender.com";

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("job");

  if (!jobId) {
    return json({
      status: "error",
      error: "Missing job id."
    });
  }

  let lastError = "";

  // Render Free service wake-up / temporary 503 retry
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const response = await fetch(
        `${CONVERTER_URL}/status/${encodeURIComponent(jobId)}?t=${Date.now()}`,
        {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = {
          status: "error",
          error: text || "Invalid response from conversion server."
        };
      }

      // Server is waking up / temporarily unavailable.
      // Retry instead of immediately showing an error.
      if (
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504
      ) {
        lastError =
          data.error ||
          data.message ||
          `Conversion server returned HTTP ${response.status}`;

        await sleep(3000);
        continue;
      }

      // Job not found
      if (response.status === 404) {
        return json({
          status: "error",
          error:
            data.error ||
            "Conversion job was not found."
        });
      }

      // Other HTTP error
      if (!response.ok) {
        return json({
          status: "error",
          error:
            data.error ||
            data.message ||
            `Conversion server returned HTTP ${response.status}`
        });
      }

      // Successful status response
      return json(data);

    } catch (error) {
      lastError =
        error?.message ||
        "Unable to connect to conversion server.";

      await sleep(3000);
    }
  }

  return json({
    status: "error",
    error:
      lastError ||
      "Conversion server did not respond. Please try again."
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
