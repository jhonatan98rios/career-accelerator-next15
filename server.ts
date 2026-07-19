// ponytail: custom server for selective gzip — Next.js `compress: false`
// disables it globally so SSE streams aren't buffered; this server re-applies
// compression for every route EXCEPT /api/chat via the `compression` middleware.
import { createServer, IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import next from "next";
import compression from "compression";

type NodeMiddleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => void;

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, turbo: dev });
const handle = app.getRequestHandler();

const shouldCompress = (req: IncomingMessage, res: ServerResponse): boolean => {
  if (req.url?.startsWith("/api/chat")) return false;
  // ponytail: delegate to compression's default filter (content-type, size, etc.)
  return compression.filter(req, res);
};

const compress = compression({ filter: shouldCompress }) as NodeMiddleware;

app.prepare().then(() => {
  createServer((req, res) => {
    compress(req, res, (err?: unknown) => {
      if (err) {
        console.error("[server] compression error", err);
        res.statusCode = 500;
        res.end("Internal Server Error");
        return;
      }
      handle(req, res, parse(req.url!, true));
    });
  }).listen(port, () => {
    console.log(
      `> Server listening on http://localhost:${port} [${dev ? "dev" : "prod"}]`,
    );
  });
});
