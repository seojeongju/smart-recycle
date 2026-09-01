import { app } from "./app";
import { syncPublicData } from "./sync";

export default {
  fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },
  scheduled(_controller, env, ctx) {
    ctx.waitUntil(syncPublicData(env));
  },
} satisfies ExportedHandler<Cloudflare.Env>;
