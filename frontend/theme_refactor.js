import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIR = path.join(__dirname, "src");

const replacements = [
  { from: /bg-slate-900/g, to: "bg-base-300" },
  { from: /bg-slate-800\/50/g, to: "bg-base-200/50" },
  { from: /bg-slate-800\/70/g, to: "bg-base-200/70" },
  { from: /bg-slate-800/g, to: "bg-base-200" },
  { from: /bg-slate-700/g, to: "bg-base-100" },
  { from: /text-slate-200/g, to: "text-base-content" },
  { from: /text-slate-300/g, to: "text-base-content/80" },
  { from: /text-slate-400/g, to: "text-base-content/60" },
  { from: /border-slate-700\/50/g, to: "border-base-100/50" },
  { from: /border-slate-700/g, to: "border-base-100" },
  { from: /border-slate-800/g, to: "border-base-200" },
  { from: /placeholder:text-slate-400/g, to: "placeholder:text-base-content/50" },
  { from: /bg-slate-900\/50/g, to: "bg-base-300/50" },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith(".jsx") || fullPath.endsWith(".js")) {
      let content = fs.readFileSync(fullPath, "utf-8");
      let original = content;
      
      for (const { from, to } of replacements) {
        content = content.replace(from, to);
      }
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, "utf-8");
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(DIR);
console.log("Refactor complete.");
