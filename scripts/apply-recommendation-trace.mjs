import { readFile, writeFile } from "node:fs/promises";

const path = "test/recommendation-trace.test.mjs";
const source = await readFile(path, "utf8");
const broken = `      drink
Style: "hot",`;

if (!source.includes(broken)) {
  throw new Error("broken drinkStyle fixture was not found");
}

await writeFile(path, source.replace(broken, `      drinkStyle: "hot",`));
