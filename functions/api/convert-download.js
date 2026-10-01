const CONVERTER_URL =
  "https://ilovepdf4-converter.onrender.com";

export async function onRequestGet({ request }) {

  try {

    const url =
      new URL(request.url);

    const jobId =
      url.searchParams.get("job");

    if(!jobId){

      return new Response(
        JSON.stringify({
          success:false,
          error:"Missing job id."
        }),
        {
          status:400,
          headers:{
            "Content-Type":"application/json",
            "Cache-Control":"no-store"
          }
        }
      );
    }

    const downloadUrl =
      CONVERTER_URL +
      "/download/" +
      encodeURIComponent(jobId);

    /*
      Send the browser directly to the Render
      download endpoint.

      Render already sets:
      Content-Type
      Content-Disposition
      Content-Length
    */

    return Response.redirect(
      downloadUrl,
      302
    );

  }catch(error){

    return new Response(
      JSON.stringify({
        success:false,
        error:
          error?.message ||
          "Download failed."
      }),
      {
        status:500,
        headers:{
          "Content-Type":"application/json",
          "Cache-Control":"no-store"
        }
      }
    );

  }

}
