import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIR = path.join(__dirname, "src");

const replacements = [
  { from: /text-cyan-400/g, to: "text-primary" },
  { from: /bg-cyan-500\/10/g, to: "bg-primary/10" },
  { from: /bg-cyan-500\/20/g, to: "bg-primary/20" },
  { from: /hover:bg-cyan-500\/20/g, to: "hover:bg-primary/20" },
  { from: /from-cyan-500\/20/g, to: "from-primary/20" },
  { from: /to-cyan-400\/10/g, to: "to-primary/10" },
  { from: /via-cyan-500\/30/g, to: "via-primary/30" },
  { from: /text-cyan-500/g, to: "text-primary" },
  { from: /bg-gradient-to-r from-cyan-500 to-cyan-600/g, to: "bg-primary" },
  { from: /hover:from-cyan-600 hover:to-cyan-700/g, to: "hover:opacity-90" },
  { from: /bg-cyan-600 text-white/g, to: "bg-primary text-primary-content" },
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
console.log("Cyan refactor complete.");
