const CONVERTER_URL =
"https://ilovepdf4-converter.onrender.com";

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

const response = await fetch(
  CONVERTER_URL +
  "/status/" +
  encodeURIComponent(jobId),
  {
    method: "GET",
    headers: {
      "Cache-Control": "no-cache"
    }
  }
);

const data = await response.json();

if (data.status === "finished") {
  return json({
    status: "finished",
    url:
      "/api/convert-download?job=" +
      encodeURIComponent(jobId),
    filename:
      data.filename || "converted.pdf"
  });
}

return json(data, response.status);
```

} catch (error) {
return json({
status: "error",
error:
error?.message ||
"Server error."
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
"Cache-Control": "no-store"
}
}
);
}
