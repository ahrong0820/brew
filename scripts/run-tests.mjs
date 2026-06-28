import { spawn } from "node:child_process";

const focusedTests = [
  "test/clever-recommendation-profile.test.mjs",
  "test/technique-adjustment-flow.test.mjs",
  "test/recommendation-result-ui.test.mjs",
  "test/manual-brew-pace-adjustment.test.mjs",
  "test/adjustment-progression-limits.test.mjs",
  "test/taste-diagnosis-matrix.test.mjs",
];

const child = spawn(
  process.execPath,
  ["--experimental-strip-types", "--test", ...focusedTests],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
  },
);

let output = "";
child.stdout.setEncoding("utf8");
child.stderr.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  output += chunk;
});
child.stderr.on("data", (chunk) => {
  output += chunk;
});

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on("close", (code) => {
  console.log(output.trim());
  process.exitCode = code ?? 1;
});
