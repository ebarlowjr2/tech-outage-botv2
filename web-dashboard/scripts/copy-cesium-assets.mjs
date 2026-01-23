import fs from "fs";
import path from "path";

const cesiumSource = path.join(process.cwd(), "node_modules", "cesium", "Build", "Cesium");
const cesiumDest = path.join(process.cwd(), "public", "cesium");

fs.rmSync(cesiumDest, { recursive: true, force: true });
fs.mkdirSync(cesiumDest, { recursive: true });

for (const dir of ["Assets", "Widgets", "Workers"]) {
  fs.cpSync(path.join(cesiumSource, dir), path.join(cesiumDest, dir), { recursive: true });
}

console.log("Copied Cesium assets to public/cesium");
