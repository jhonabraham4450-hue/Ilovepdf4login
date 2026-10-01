const CONVERTER_URL = "https://ilovepdf4-converter.onrender.com";

export async function onRequestGet({ request }) {
try {
const url = new URL(request.url);
const jobId = url.searchParams.get("job");

```
if (!jobId) {
  return json({
    status: "error",
    error: "Missing job id."
  }, 400);
}

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
        error: "Invalid response from conversion server."
      };
    }

    if (
      response.status === 502 ||
      response.status === 503 ||
      response.status === 504
    ) {
      if (attempt < 10) {
        await sleep(3000);
        continue;
      }

      return json({
        status: "error",
        error: "Conversion server is waking up. Please try again."
      });
    }

    if (!response.ok) {
      return json({
        status: "error",
        error:
          data.error ||
          data.message ||
          `Conversion server returned HTTP ${response.status}`
      });
    }

    return json(data);
  } catch (error) {
    if (attempt < 10) {
      await sleep(3000);
      continue;
    }

    return json({
      status: "error",
      error:
        error?.message ||
        "Unable to connect to conversion server."
    });
  }
}

return json({
  status: "error",
  error: "Unable to check conversion status."
});
```

} catch (error) {
return json({
status: "error",
error:
error?.message ||
"Unable to check conversion status."
}, 500);
}
}

function sleep(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}

function json(data, status = 200) {
return new Response(
JSON.stringify(data),
{
status,
headers: {
"Content-Type": "application/json",
"Cache-Control": "no-store, no-cache, must-revalidate",
"Pragma": "no-cache"
}
}
);
}
