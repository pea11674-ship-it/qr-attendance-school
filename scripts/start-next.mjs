import { openSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const out = openSync(join(root, "next-server.log"), "a");
const err = openSync(join(root, "next-server.err.log"), "a");

const child = spawn(process.execPath, [join(root, "node_modules", "next", "dist", "bin", "next"), "start"], {
  cwd: root,
  detached: true,
  stdio: ["ignore", out, err],
  windowsHide: true
});

child.unref();
console.log(child.pid);
