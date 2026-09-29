import { onRequestPost as login } from "./functions/api/login.js";
import { onRequestPost as register } from "./functions/api/register.js";
import { onRequestPost as logout } from "./functions/api/logout.js";

import { onRequestGet as me } from "./functions/api/me.js";
import { onRequestGet as admin } from "./functions/api/admin.js";

import { onRequestPost as forgot } from "./functions/api/forgot.js";
import { onRequestPost as reset } from "./functions/api/reset.js";

import { onRequestPost as convertStart } from "./functions/api/convert-start.js";
import { onRequestGet as convertStatus } from "./functions/api/convert-status.js";


const routes = {

  "/api/login": {
    POST: login
  },

  "/api/register": {
    POST: register
  },

  "/api/logout": {
    POST: logout
  },

  "/api/me": {
    GET: me
  },

  "/api/admin": {
    GET: admin
  },

  "/api/forgot": {
    POST: forgot
  },

  "/api/reset": {
    POST: reset
  },

  "/api/convert-start": {
    POST: convertStart
  },

  "/api/convert-status": {
    GET: convertStatus
  }

};


export default {

  async fetch(request, env, ctx) {

    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method.toUpperCase();


    /*
      API ROUTES
    */

    if (
      routes[pathname] &&
      routes[pathname][method]
    ) {

      try {

        return await routes[pathname][method]({
          request,
          env,
          ctx
        });

      } catch (error) {

        return new Response(
          JSON.stringify({
            success: false,
            error: error?.message || "Server error"
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


    /*
      UNKNOWN API ROUTE
    */

    if (pathname.startsWith("/api/")) {

      return new Response(
        JSON.stringify({
          success: false,
          error: "API endpoint not found"
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );

    }


    /*
      STATIC FILES
    */

    if (env.ASSETS) {

      return env.ASSETS.fetch(request);

    }


    return new Response(
      "iLovePDF4 Worker is running.",
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain"
        }
      }
    );

  }

};
