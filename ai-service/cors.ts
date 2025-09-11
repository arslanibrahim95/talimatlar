import { Context, Next } from "https://deno.land/x/oak@v12.6.1/mod.ts";

export const cors = async (ctx: Context, next: Next) => {
  // CORS headers
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  ctx.response.headers.set("Access-Control-Max-Age", "86400");

  // Handle preflight requests
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 200;
    return;
  }

  await next();
};
