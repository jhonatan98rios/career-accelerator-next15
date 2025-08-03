function generateStaticParams() { }

interface PageProps {
  params: Promise<{
    output_id: string
    profile_id: string
  }>
}

export default async function Page({ params }: PageProps) {

  const { output_id, profile_id } = await params


  return (
    <div>
      <header className="bg-blue-600 text-white text-center py-20">
        <h1 className="text-4xl md:text-5xl font-bold">Specialize in Python Web Development</h1>
        <p className="mt-4 text-xl max-w-2xl mx-auto">Already coding? Go deep with Python backend — leverage high demand, remote freedom, growing salaries, and global careers.</p>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-12">

        <section>
          <h2 className="text-3xl font-semibold text-blue-600 mb-4">Why Python? Real Numbers from August 2025</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>High demand:</strong> ~11 000 Python Developer jobs active on LinkedIn in the U.S., ~2 000 in Europe — every day new roles appear. (<em>source: LinkedIn</em>)</li>
            <li><strong>Glassdoor US job board:</strong> ~17 900 open Python Developer roles right now. (<em>source: Glassdoor</em>)</li>
            <li><strong>Indeed abroad:</strong> ~5 100 “international” Python jobs listed — many sponsor visas or fully remote. (<em>source: Indeed</em>)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-3xl font-semibold text-blue-600 mb-4">Compensation & Benefits</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>US average:</strong> $126,600/year for Python Developer roles, with typical range $97 K–$167 K. (<em>source: Glassdoor</em>)</li>
            <li><strong>Remote roles:</strong> ~$112 700/year on average, and the top 10% earn up to $186 000. (<em>source: Glassdoor remote salary data</em>)</li>
            <li><strong>Companies also offer:</strong> stock bonuses, flexible hours, remote-first perks, travel allowances, visa sponsorships—especially in tech & travel sectors.</li>
            <li><strong>Job evolution:</strong> CTOs report demand for quality engineers is rising despite AI—tools boost productivity but don’t replace the need for solid fundamentals. (<em>source: Terminal CEO insider</em>)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-3xl font-semibold text-blue-600 mb-4">Work from Anywhere & Travel the World</h2>
          <p>Python roles span literally every region—emerging tech cities in Asia, Europe, North America, and global travel/OTA companies.</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>The “international” listings often include roles in countries like Canada, UK, Middle East, and fully remote teams. (<em>source: Indeed global Python jobs</em>)</li>
            <li>Travel-tech companies (e.g. software teams for booking platforms, hospitality CRMs) explicitly look for Python web developers. (<em>source: Zoftify travel jobs</em>)</li>
            <li>Remote‑OK lists active Python roles in dozens of countries—work from a beach in Bali or an apartment in Lisbon. (<em>source: remote OK jobs across countries</em>)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-3xl font-semibold text-blue-600 mb-4">Big Tech, Startups & Scale-Ups Are Hiring</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Google:</strong> 1 000+ Python‑emphasized roles in the U.S., about 16% are remote. (<em>source: LinkedIn</em>)</li>
            <li><strong>Amazon:</strong> ~372 active Python Developer listings in the U.S., including AWS‑adjacent back-end roles. (<em>source: Glassdoor & Indeed</em>)</li>
            <li><strong>Meta (Facebook):</strong> 200+ Python‑heavy engineering roles and Developer Advocate positions. (<em>source: Glassdoor & LinkedIn</em>)</li>
            <li><strong>Startups & scale-ups:</strong> Python is the backbone of many SaaS, AI, fintech startups. Roles in biotech/travel are common, often with visa help + global travel time included.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-3xl font-semibold text-blue-600 mb-4">Your Python Back-End Roadmap 📍</h2>
          <p className="mb-4">Skip frontend (React/Vue), SEO tricks, and mobile-native stacks—for a focused route that companies need and pay for.</p>
          <ol className="list-decimal list-inside space-y-4">
            <li><strong>Core Python & Web Frameworks</strong>: build REST APIs with Flask or Django; learn async with FastAPI.</li>
            <li><strong>Databases & ORMs</strong>: PostgreSQL, Redis, and databases via SQLAlchemy or Django ORM.</li>
            <li><strong>Docker & Containerization</strong>: build, test, and ship services in containers.</li>
            <li><strong>Cloud (AWS/GCP/Azure)</strong>: EC2 or containers on ECS/Fargate, S3, IAM, and serverless functions (Lambda/GCF).</li>
            <li><strong>CI/CD & DevOps basics</strong>: automated testing, GitHub Actions or GitLab pipelines, infra-as-code (Terraform basics).</li>
            <li><strong>Logging, Monitoring, & Security fundamentals</strong>: structured logging, Prometheus/Grafana, key security hygiene.</li>
            <li><strong>Architectural Capabilities</strong>: message queues, microservices, caching, scaling strategies.</li>
            <li><strong>Build your portfolio</strong>: work examples, GitHub + demo deployments—highlight containerized apps on AWS.</li>
          </ol>
          <p className="mt-6 italic">Focus on these—don’t get distracted with frontend JavaScript frameworks, React SEO, or native mobile dev unless you aim for full‑stack or mobile app roles.</p>
        </section>

        <footer className="text-sm text-gray-600 text-center pt-8">
          <p>Data cited is current as of early August 2025 from LinkedIn, Glassdoor, Indeed, remote‑OK, and hiring research (job count and salary numbers reflect live postings as of that date).</p>
        </footer>

      </main>
    </div>
  )
}