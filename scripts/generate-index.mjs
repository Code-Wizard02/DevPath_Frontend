import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const distClient = join(process.cwd(), "dist/client");
const assetsDir = join(distClient, "assets");

const files = readdirSync(assetsDir);
const cssFile = files.find((f) => f.startsWith("styles-") && f.endsWith(".css"));
const mainJs = files.find(
  (f) => f.startsWith("index-") && f.endsWith(".js") && !f.includes("dashboard"),
);
const dashboardJs = files.find((f) => f.startsWith("dashboard-") && f.endsWith(".js"));
const routeJs = files.find((f) => f.startsWith("index-") && f.endsWith(".js") && f !== mainJs);

if (!cssFile || !mainJs) {
  console.error("Missing assets:", { cssFile, mainJs });
  process.exit(1);
}

const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DevPath</title>
    <meta name="description" content="El bootcamp mas intensivo de LATAM. Aprende a programar y consigue trabajo en 6 meses." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" crossorigin href="/assets/${cssFile}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" crossorigin src="/assets/${mainJs}"></script>
    ${routeJs ? `<script type="module" crossorigin src="/assets/${routeJs}"></script>` : ""}
    ${dashboardJs ? `<script type="module" crossorigin src="/assets/${dashboardJs}"></script>` : ""}
  </body>
</html>
`;

writeFileSync(join(distClient, "index.html"), html);
console.log("Generated index.html with assets:", { cssFile, mainJs, routeJs, dashboardJs });
