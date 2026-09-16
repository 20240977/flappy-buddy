import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const output = join(projectRoot, "dist");
mkdirSync(output, { recursive: true });

for (const file of ["index.html", "styles.css", "game.js"]) {
  copyFileSync(join(projectRoot, file), join(output, file));
}

console.log("Flappy Buddy static files copied to dist/");
