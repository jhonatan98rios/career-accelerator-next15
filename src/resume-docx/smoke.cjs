/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Standalone smoke test for resume-docx renderer.
 * Inlines a Resume object to avoid broken project dependencies.
 * Tests: all 4 templates, edge cases (empty, large), writes .docx to /tmp.
 */
const { writeFileSync, mkdirSync } = require("fs");
const path = require("path");

// ── Inline Resume (full developer example) ──────────────────────────────
const resume = {
  meta: { schemaVersion: "1.0.0", language: "en", generatedAt: null },
  personal: {
    name: "Ana Costa",
    email: "ana.costa@email.com",
    phone: null,
    location: { city: "São Paulo", state: "SP", country: "Brasil" },
    linkedin: "https://linkedin.com/in/anacosta",
    website: "https://anacosta.dev",
    photo: null,
  },
  summary: "Senior full-stack developer with 8+ years building scalable web applications.",
  experience: [
    {
      company: "FinTech Brasil",
      position: "Tech Lead",
      startDate: "2023-03",
      endDate: null,
      current: true,
      location: { city: "São Paulo", state: "SP", country: "Brasil" },
      description: "Leading a team of 6 engineers building a payments platform.",
      highlights: [
        "Architected event-driven microservices with Kafka and AWS Lambda",
        "Reduced P95 latency by 60% through query optimization and caching",
        "Introduced trunk-based development and CI/CD",
      ],
    },
    {
      company: "Ecommerce Pro",
      position: "Senior Software Engineer",
      startDate: "2020-06",
      endDate: "2023-02",
      current: false,
      location: { city: "Rio de Janeiro", state: "RJ", country: "Brasil" },
      description: "Built core checkout and cart services.",
      highlights: ["Migrated legacy PHP monolith to TypeScript microservices"],
    },
  ],
  education: [
    {
      institution: "UFMG",
      degree: "Bacharelado",
      field: "Ciência da Computação",
      startDate: "2013-01",
      endDate: "2017-12",
      gpa: null,
      description: null,
    },
  ],
  skills: {
    hard: [
      { name: "TypeScript", level: "expert" },
      { name: "React", level: "expert" },
      { name: "Node.js", level: "expert" },
      { name: "AWS", level: "advanced" },
    ],
    soft: [
      { name: "Technical Leadership", level: "advanced" },
      { name: "Mentoring", level: "advanced" },
    ],
  },
  languages: [
    { name: "Português", proficiency: "native" },
    { name: "Inglês", proficiency: "professional" },
  ],
  certifications: [
    { name: "AWS Solutions Architect", issuer: "AWS", date: "2021-08", url: null },
  ],
  projects: [],
  volunteer: [],
  awards: [],
  publications: [],
  references: [],
  social: {
    github: "https://github.com/anacosta",
    twitter: null,
    stackoverflow: null,
    medium: null,
    behance: null,
    dribbble: null,
  },
};

// Minimal resume
const minimal = {
  meta: { schemaVersion: "1.0.0", language: "pt", generatedAt: null },
  personal: { name: "Fulano", email: null, phone: null, location: null, linkedin: null, website: null, photo: null },
  summary: null, experience: [], education: [],
  skills: { hard: [], soft: [] }, languages: [], certifications: [],
  projects: [], volunteer: [], awards: [], publications: [], references: [],
  social: {},
};

// Large (50 experiences)
const large = {
  ...resume,
  experience: Array.from({ length: 50 }, (_, i) => ({
    ...resume.experience[0],
    company: `Company ${i}`,
    position: `Position ${i}`,
  })),
};

// ── Run tests ───────────────────────────────────────────────────────────

async function main() {
  const outDir = path.join(__dirname, "..", "..", "output", "resume-docx");
  mkdirSync(outDir, { recursive: true });

  let passed = 0;
  let failed = 0;

  const templates = ["modern", "classic", "ats", "academic"];

  // Load the renderer
  const { render } = require("./renderer");

  for (const tpl of templates) {
    for (const [name, data] of [["dev", resume], ["minimal", minimal], ["large", large]]) {
      try {
        const buffer = await render(data, tpl);

        // ZIP magic bytes
        if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
          throw new Error("Not a valid ZIP (missing PK header)");
        }
        if (buffer.length < 500) {
          throw new Error(`Too small: ${buffer.length} bytes`);
        }

        const filename = `${name}-${tpl}.docx`;
        writeFileSync(path.join(outDir, filename), buffer);
        console.log(`  ✓ ${name}/${tpl} → ${(buffer.length / 1024).toFixed(1)}KB`);
        passed++;
      } catch (err) {
        console.log(`  ✗ ${name}/${tpl}: ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
