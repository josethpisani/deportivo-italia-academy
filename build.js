import { existsSync } from "fs";

const requiredFiles = [
  "index.html",
  "api/data.js",
  "js/app.js",
  "js/api.js",
  "js/state.js",
  "js/events.js",
  "css/base.css",
  "css/responsive.css",
  "img/logo-deportivoitalia.png"
];

const missing = requiredFiles.filter(file => !existsSync(file));
if (missing.length) {
  console.error("Build validation failed. Missing files:", missing.join(", "));
  process.exit(1);
}

console.log(`Build validation passed: ${requiredFiles.length} production files found.`);
console.log("Deployment mode: native ES modules served from the project root.");
