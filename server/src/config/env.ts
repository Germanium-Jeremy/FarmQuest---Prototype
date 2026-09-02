import fs from "node:fs";

const envPaths = [".env", "server/.env"];

for (const path of envPaths) {
  if (fs.existsSync(path)) {
    process.loadEnvFile?.(path);
    break;
  }
}
