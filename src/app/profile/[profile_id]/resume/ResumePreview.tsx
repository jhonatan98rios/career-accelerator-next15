import type { Resume } from "@/resume";

// ── Localized labels ────────────────────────────────────────────────────

const LABELS: Record<string, Record<string, string>> = {
  pt: {
    summary: "Resumo",
    experience: "Experiência Profissional",
    education: "Formação Acadêmica",
    skills: "Habilidades",
    hardSkills: "Técnicas",
    softSkills: "Comportamentais",
    languages: "Idiomas",
    certifications: "Certificações",
    projects: "Projetos",
    volunteer: "Voluntariado",
    awards: "Premiações",
    publications: "Publicações",
    references: "Referências",
    present: "presente",
  },
  en: {
    summary: "Summary",
    experience: "Professional Experience",
    education: "Education",
    skills: "Skills",
    hardSkills: "Technical",
    softSkills: "Soft",
    languages: "Languages",
    certifications: "Certifications",
    projects: "Projects",
    volunteer: "Volunteer",
    awards: "Awards",
    publications: "Publications",
    references: "References",
    present: "present",
  },
};

const PROFICIENCY: Record<string, Record<string, string>> = {
  pt: { basic: "Básico", conversational: "Conversação", professional: "Profissional", native: "Nativo" },
  en: { basic: "Basic", conversational: "Conversational", professional: "Professional", native: "Native" },
};

const LEVELS: Record<string, Record<string, string>> = {
  pt: { beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado", expert: "Expert" },
  en: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", expert: "Expert" },
};

// ── Helpers ─────────────────────────────────────────────────────────────

function fmtDate(d: string | null, labels: Record<string, string>): string {
  if (!d) return labels.present;
  const [y, m] = d.split("-");
  return m ? `${m}/${y}` : y;
}

function fmtLocation(loc: { city?: string | null; state?: string | null; country?: string | null } | null): string {
  if (!loc) return "";
  return [loc.city, loc.state, loc.country].filter(Boolean).join(", ");
}

// ── Section component ───────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 pb-1 mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Main preview ────────────────────────────────────────────────────────

interface Props {
  resume: Resume;
}

export default function ResumePreview({ resume }: Props) {
  const lang = resume.meta?.language === "en" ? "en" : "pt";
  const t = LABELS[lang];
  const prof = PROFICIENCY[lang];
  const lvl = LEVELS[lang];

  const { personal, summary, experience, education, skills, languages, certifications, projects, volunteer, awards, publications, references } = resume;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white">
        <h2 className="text-2xl font-bold">{personal.name}</h2>
        {summary && <p className="text-indigo-100 text-sm mt-1 max-w-2xl">{summary}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-indigo-200">
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.location && <span>{fmtLocation(personal.location)}</span>}
          {personal.linkedin && (
            <a href={personal.linkedin} className="underline hover:text-white" target="_blank" rel="noopener">
              LinkedIn
            </a>
          )}
          {personal.website && (
            <a href={personal.website} className="underline hover:text-white" target="_blank" rel="noopener">
              {personal.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>

      <div className="px-6 py-4 space-y-1">
        {/* ── Experience ── */}
        {experience.length > 0 && (
          <Section title={t.experience}>
            {experience.map((exp, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                  <h4 className="font-semibold text-gray-900 text-sm">{exp.position}</h4>
                  <span className="text-xs text-gray-500 shrink-0">
                    {fmtDate(exp.startDate, t)} — {fmtDate(exp.endDate, t)}
                  </span>
                </div>
                <div className="flex justify-between flex-wrap gap-x-2">
                  <span className="text-sm text-gray-600">{exp.company}</span>
                  {exp.location && <span className="text-xs text-gray-400">{fmtLocation(exp.location)}</span>}
                </div>
                {exp.description && <p className="text-xs text-gray-600 mt-1">{exp.description}</p>}
                {exp.highlights.length > 0 && (
                  <ul className="list-disc list-inside mt-1 text-xs text-gray-600 space-y-0.5">
                    {exp.highlights.map((h, j) => <li key={j}>{h}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* ── Education ── */}
        {education.length > 0 && (
          <Section title={t.education}>
            {education.map((edu, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                  <h4 className="font-semibold text-gray-900 text-sm">{edu.degree} em {edu.field}</h4>
                  <span className="text-xs text-gray-500 shrink-0">
                    {fmtDate(edu.startDate, t)} — {fmtDate(edu.endDate, t)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{edu.institution}</p>
                {edu.description && <p className="text-xs text-gray-500 mt-0.5">{edu.description}</p>}
              </div>
            ))}
          </Section>
        )}

        {/* ── Skills ── */}
        {(skills.hard.length > 0 || skills.soft.length > 0) && (
          <Section title={t.skills}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skills.hard.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">{t.hardSkills}</p>
                  <div className="flex flex-wrap gap-1">
                    {skills.hard.map((s, i) => (
                      <span key={i} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
                        {s.name}{s.level ? ` — ${lvl[s.level] ?? s.level}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {skills.soft.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">{t.softSkills}</p>
                  <div className="flex flex-wrap gap-1">
                    {skills.soft.map((s, i) => (
                      <span key={i} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
                        {s.name}{s.level ? ` — ${lvl[s.level] ?? s.level}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── Languages ── */}
        {languages.length > 0 && (
          <Section title={t.languages}>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
              {languages.map((l, i) => (
                <span key={i}>
                  {l.name}{l.proficiency ? ` (${prof[l.proficiency] ?? l.proficiency})` : ""}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* ── Certifications ── */}
        {certifications.length > 0 && (
          <Section title={t.certifications}>
            {certifications.map((cert, i) => (
              <div key={i} className="mb-1 text-sm">
                <span className="font-semibold text-gray-900">{cert.name}</span>
                {cert.issuer && <span className="text-gray-500"> — {cert.issuer}</span>}
                {cert.date && <span className="text-gray-400 text-xs ml-1">({cert.date})</span>}
              </div>
            ))}
          </Section>
        )}

        {/* ── Projects ── */}
        {projects.length > 0 && (
          <Section title={t.projects}>
            {projects.map((proj, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {proj.url ? (
                      <a href={proj.url} className="text-indigo-600 hover:underline" target="_blank" rel="noopener">
                        {proj.name}
                      </a>
                    ) : proj.name}
                  </h4>
                  {(proj.startDate || proj.endDate) && (
                    <span className="text-xs text-gray-500 shrink-0">
                      {fmtDate(proj.startDate, t)} — {fmtDate(proj.endDate, t)}
                    </span>
                  )}
                </div>
                {proj.description && <p className="text-xs text-gray-600 mt-0.5">{proj.description}</p>}
                {proj.highlights.length > 0 && (
                  <ul className="list-disc list-inside mt-1 text-xs text-gray-600 space-y-0.5">
                    {proj.highlights.map((h, j) => <li key={j}>{h}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* ── Volunteer ── */}
        {volunteer.length > 0 && (
          <Section title={t.volunteer}>
            {volunteer.map((vol, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                  <h4 className="font-semibold text-gray-900 text-sm">{vol.role}</h4>
                  <span className="text-xs text-gray-500 shrink-0">
                    {fmtDate(vol.startDate, t)} — {fmtDate(vol.endDate, t)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{vol.organization}</p>
                {vol.description && <p className="text-xs text-gray-500 mt-0.5">{vol.description}</p>}
              </div>
            ))}
          </Section>
        )}

        {/* ── Awards ── */}
        {awards.length > 0 && (
          <Section title={t.awards}>
            {awards.map((award, i) => (
              <div key={i} className="mb-1 text-sm">
                <span className="font-semibold text-gray-900">{award.title}</span>
                {award.issuer && <span className="text-gray-500"> — {award.issuer}</span>}
                {award.date && <span className="text-gray-400 text-xs ml-1">({award.date})</span>}
                {award.description && <p className="text-xs text-gray-500 mt-0.5">{award.description}</p>}
              </div>
            ))}
          </Section>
        )}

        {/* ── Publications ── */}
        {publications.length > 0 && (
          <Section title={t.publications}>
            {publications.map((pub, i) => (
              <div key={i} className="mb-1 text-sm">
                <span className="font-semibold text-gray-900">
                  {pub.url ? (
                    <a href={pub.url} className="text-indigo-600 hover:underline" target="_blank" rel="noopener">
                      {pub.title}
                    </a>
                  ) : pub.title}
                </span>
                {pub.publisher && <span className="text-gray-500"> — {pub.publisher}</span>}
                {pub.date && <span className="text-gray-400 text-xs ml-1">({pub.date})</span>}
                {pub.description && <p className="text-xs text-gray-500 mt-0.5">{pub.description}</p>}
              </div>
            ))}
          </Section>
        )}

        {/* ── References ── */}
        {references.length > 0 && (
          <Section title={t.references}>
            {references.map((ref, i) => (
              <div key={i} className="mb-1 text-sm text-gray-700">
                <span className="font-semibold">{ref.name}</span>
                {ref.relationship && <span className="text-gray-500"> — {ref.relationship}</span>}
                {(ref.email || ref.phone) && (
                  <span className="text-gray-400 text-xs ml-2">
                    {[ref.email, ref.phone].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}
