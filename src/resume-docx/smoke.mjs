// Smoke test: generates .docx files from resume examples
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Inline imports from our modules
import { validate } from "../resume/validator.js";
import { render } from "./renderer.js";

function loadResume(name) {
  const filePath = path.resolve(__dirname, "..", "resume", "examples", `${name}.json`);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const result = validate(raw);
  if (!result.ok) throw new Error(`Invalid ${name}: ${JSON.stringify(result.errors)}`);
  return result.data;
}

const EXAMPLES = ["developer", "teacher", "designer", "doctor", "musician"];
const TEMPLATES = ["modern", "classic", "ats", "academic"];

const outDir = path.resolve(__dirname, "..", "..", "output", "resume-docx");
mkdirSync(outDir, { recursive: true });

let passed = 0;
let failed = 0;

for (const example of EXAMPLES) {
  for (const tpl of TEMPLATES) {
    try {
      const resume = loadResume(example);
      const buffer = await render(resume, tpl);

      // ZIP magic bytes
      if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
        throw new Error("Not a valid ZIP/DOCX");
      }

      const filename = `${example}-${tpl}.docx`;
      writeFileSync(path.join(outDir, filename), buffer);
      console.log(`  ✓ ${example}/${tpl} → ${(buffer.length / 1024).toFixed(1)}KB`);
      passed++;
    } catch (err) {
      console.log(`  ✗ ${example}/${tpl}: ${err.message}`);
      failed++;
    }
  }
}

// Edge cases
console.log("\nEdge cases:");
try {
  const resume = loadResume("developer");
  const minimal = {
    meta: { schemaVersion: "1.0.0", language: "pt", generatedAt: null },
    personal: { name: "Fulano", email: null, phone: null, location: null, linkedin: null, website: null, photo: null },
    summary: null, experience: [], education: [],
    skills: { hard: [], soft: [] }, languages: [], certifications: [],
    projects: [], volunteer: [], awards: [], publications: [], references: [],
    social: {},
  };
  const buf = await render(minimal, "modern");
  if (buf[0] !== 0x50 || buf[1] !== 0x4b) throw new Error("Bad ZIP");
  writeFileSync(path.join(outDir, "minimal-modern.docx"), buf);
  console.log(`  ✓ minimal → ${(buf.length / 1024).toFixed(1)}KB`);
  passed++;
} catch (err) {
  console.log(`  ✗ minimal: ${err.message}`);
  failed++;
}

try {
  const resume = loadResume("developer");
  const manyExp = Array.from({ length: 50 }, (_, i) => ({
    ...resume.experience[0],
    company: `Company ${i}`,
    position: `Position ${i}`,
  }));
  const large = { ...resume, experience: manyExp };
  const buf = await render(large, "ats");
  if (buf[0] !== 0x50 || buf[1] !== 0x4b) throw new Error("Bad ZIP");
  writeFileSync(path.join(outDir, "large-50exp-ats.docx"), buf);
  console.log(`  ✓ 50 experiences → ${(buf.length / 1024).toFixed(1)}KB`);
  passed++;
} catch (err) {
  console.log(`  ✗ 50exp: ${err.message}`);
  failed++;
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
