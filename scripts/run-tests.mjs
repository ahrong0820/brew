import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";

const child = spawn(
  process.execPath,
  ["--experimental-strip-types", "--test"],
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
  output += `\n${error.stack ?? error.message}\n`;
  process.exitCode = 1;
});
child.on("close", async (code) => {
  const lines = output.split(/\r?\n/);
  if (code === 0) {
    const summaryStart = Math.max(
      0,
      lines.findLastIndex((line) => line.startsWith("# tests ")) - 1,
    );
    console.log(lines.slice(summaryStart).join("\n").trim());
    process.exitCode = 0;
    return;
  }

  await writeFile("test-failure.log", output, "utf8");
  const markers = [
    /^not ok /,
    /failureType:/,
    /ERR_ASSERTION/,
    /AssertionError/,
    /^\s*expected:/,
    /^\s*actual:/,
  ];
  const selected = new Set();
  lines.forEach((line, index) => {
    if (!markers.some((marker) => marker.test(line))) return;
    for (
      let cursor = Math.max(0, index - 8);
      cursor <= Math.min(lines.length - 1, index + 24);
      cursor += 1
    ) {
      selected.add(cursor);
    }
  });

  if (selected.size === 0) {
    console.error(lines.slice(-250).join("\n"));
  } else {
    let previous = -2;
    for (const index of [...selected].sort((left, right) => left - right)) {
      if (index > previous + 1) console.error("\n---\n");
      console.error(lines[index]);
      previous = index;
    }
  }
  process.exitCode = code ?? 1;
});
