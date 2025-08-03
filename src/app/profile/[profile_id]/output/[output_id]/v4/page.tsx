'use client'

import { useParams } from 'next/navigation'

function generateStaticParams() { }

interface PageProps {
  output_id: string
  profile_id: string
}

export default function Page() {

  const params = useParams()
  const { output_id, profile_id } = params


  return (
    <div>
      <style jsx>{`

        @keyframes float {
          0%,100% { transform: translateY(0) }
          50% { transform: translateY(-10px) }
        }

        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px) }
          100% { opacity: 1; transform: translateY(0) }
        }

        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fadeInUp { animation: fadeInUp 1s ease-out forwards; }

      `}</style>

      <header className="relative h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 to-indigo-600 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-64 h-64 bg-purple-700 rounded-full opacity-30 animate-float"></div>
        <div className="absolute bottom-16 right-1/5 w-72 h-72 bg-indigo-700 rounded-full opacity-30 animate-float animation-delay-2000"></div>
        <div className="z-10 text-center px-4">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 animate-fadeInUp">Become a Python Backend Pro</h1>
          <p className="text-xl md:text-2xl mb-8 animate-fadeInUp text-gray-200" {...applyAnimationDelay(200)}>
            Deep expertise • Top demand • Global & Remote • High pay
          </p>
          <a href="#roadmap"
            className="inline-block bg-white text-indigo-600 font-bold px-8 py-4 rounded-full shadow-lg transform hover:scale-105 transition"
            {...applyAnimationDelay(400)}>
            Start Your Journey
          </a>
        </div>
      </header>

      <main className="relative space-y-32">

        <section id="snapshot" className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 order-2 md:order-1 animate-fadeInUp">
              <h2 className="text-3xl font-bold text-purple-400">Real Demand, Real Numbers</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-purple-500 text-2xl mr-3">🔥</span>
                  <p><strong>11,000+</strong> Python Developer jobs on LinkedIn (US) & <strong>1,033,000+</strong> global listings</p>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 text-2xl mr-3">🌐</span>
                  <p><strong>3,406</strong> Python Web roles on Indeed; <strong>71,000+</strong> general Python jobs</p>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 text-2xl mr-3">💼</span>
                  <p><strong>17,900+</strong> Python Dev roles on Glassdoor, avg salary $97K–$167K</p>
                </li>
              </ul>
            </div>
            <div className="relative w-full flex justify-center order-1 md:order-2">
              <div className="w-80 h-80 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl transform rotate-6 shadow-2xl animate-float"></div>
              <div className="absolute top-8 left-12 w-64 h-64 bg-gray-900 rounded-lg transform -rotate-3 flex items-center justify-center text-6xl font-extrabold text-white shadow-lg animate-fadeInUp" {...applyAnimationDelay(500)}>
                Jobs
              </div>
            </div>
          </div>
        </section>

        <section id="compensation" className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-indigo-300 mb-6 text-center animate-fadeInUp">Compensation & Benefits</h2>
          <div className="grid md:grid-cols-3 gap-8 animate-fadeInUp text-gray-200" {...applyAnimationDelay(200)}>
            <div className="p-6 bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition">
              <h3 className="text-xl font-semibold mb-2 text-white">US Average Salary</h3>
              <p><strong>$126,600</strong> / year</p>
            </div>
            <div className="p-6 bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition" {...applyAnimationDelay(100)}>
              <h3 className="text-xl font-semibold mb-2 text-white">Remote Roles Avg</h3>
              <p><strong>$112,700</strong> / year</p>
            </div>
            <div className="p-6 bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition" {...applyAnimationDelay(200)}>
              <h3 className="text-xl font-semibold mb-2 text-white">Top 10% Earn</h3>
              <p>Up to <strong>$186,000</strong></p>
            </div>
          </div>
        </section>

        <section id="global" className="bg-gray-800 py-24">
          <div className="container mx-auto px-6 text-center space-y-8">
            <h2 className="text-4xl font-bold text-indigo-300 animate-fadeInUp">Work from Anywhere</h2>
            <p className="text-lg max-w-2xl mx-auto animate-fadeInUp text-white" {...applyAnimationDelay(100)}>
              Python roles span 50+ countries; companies in Canada, UK, UAE, and more sponsor visas or hire fully remote.</p>
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-gray-200">
              <div className="max-w-xs p-6 bg-indigo-700 rounded-2xl shadow-lg hover:-translate-y-2 transition animate-fadeInUp" {...applyAnimationDelay(200)}>
                <h3 className="text-2xl font-semibold mb-2">Remote-OK</h3>
                <p>1,093,757 total remote jobs</p>
              </div>
              <div className="max-w-xs p-6 bg-purple-700 rounded-2xl shadow-lg hover:-translate-y-2 transition animate-fadeInUp" {...applyAnimationDelay(400)}>
                <h3 className="text-2xl font-semibold mb-2">Travel Tech</h3>
                <p>Booking platforms & hospitality CRMs hire globally</p>
              </div>
              <div className="max-w-xs p-6 bg-indigo-700 rounded-2xl shadow-lg hover:-translate-y-2 transition animate-fadeInUp" {...applyAnimationDelay(600)}>
                <h3 className="text-2xl font-semibold mb-2">Visa Sponsorship</h3>
                <p>Roles in Canada, UK, UAE, and more</p>
              </div>
            </div>
          </div>
        </section>

        <section id="bigtech" className="container mx-auto px-6 py-24">
          <h2 className="text-3xl font-bold text-purple-400 mb-6 text-center animate-fadeInUp">Hiring Now: Big Tech & Startups</h2>
          <div className="grid md:grid-cols-2 gap-8 animate-fadeInUp text-gray-200" {...applyAnimationDelay(100)}>
            <div className="p-6 bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition">
              <h3 className="text-2xl font-semibold">Google</h3>
              <p>1,000+ Python roles (16% remote)</p>
            </div>
            <div className="p-6 bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition" {...applyAnimationDelay(100)}>
              <h3 className="text-2xl font-semibold">Amazon</h3>
              <p>372+ Python Developer listings in US</p>
            </div>
            <div className="p-6 bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition" {...applyAnimationDelay(200)}>
              <h3 className="text-2xl font-semibold">Meta</h3>
              <p>200+ Python-heavy engineering roles</p>
            </div>
            <div className="p-6 bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition" {...applyAnimationDelay(300)}>
              <h3 className="text-2xl font-semibold">Startups</h3>
              <p>SaaS, fintech, AI, travel-tech scale-ups hiring now</p>
            </div>
          </div>
        </section>

        <section id="roadmap" className="container mx-auto px-6 py-24">
          <div className="text-center mb-12 animate-fadeInUp">
            <h2 className="text-4xl font-bold text-purple-400">Your Python Backend Roadmap</h2>
            <p className="text-lg mt-2">Laser-focus your study and avoid wasted effort.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative p-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl shadow-2xl hover:scale-105 transition animate-fadeInUp">
              <span className="absolute -top-6 right-6 text-6xl opacity-20">1</span>
              <h3 className="text-2xl font-bold mb-3">Core & Frameworks</h3>
              <p>Python syntax, Flask/Django, FastAPI async.</p>
            </div>
            <div className="relative p-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-2xl hover:scale-105 transition animate-fadeInUp" {...applyAnimationDelay(200)}>
              <span className="absolute -top-6 right-6 text-6xl opacity-20">2</span>
              <h3 className="text-2xl font-bold mb-3">DB & ORM</h3>
              <p>PostgreSQL, Redis, SQLAlchemy/Django ORM.</p>
            </div>
            <div className="relative p-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl shadow-2xl hover:scale-105 transition animate-fadeInUp" {...applyAnimationDelay(400)}>
              <span className="absolute -top-6 right-6 text-6xl opacity-20">3</span>
              <h3 className="text-2xl font-bold mb-3">Docker & Cloud</h3>
              <p>Docker, AWS (EC2, ECS, Lambda), S3, IAM.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-2xl hover:scale-105 transition animate-fadeInUp" {...applyAnimationDelay(600)}>
              <span className="absolute -top-6 right-6 text-6xl opacity-20">4</span>
              <h3 className="text-2xl font-bold mb-3">CI/CD & Infra</h3>
              <p>GitHub Actions, GitLab CI, Terraform basics.</p>
            </div>
            <div className="p-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl shadow-2xl hover:scale-105 transition animate-fadeInUp" {...applyAnimationDelay(800)}>
              <span className="absolute -top-6 right-6 text-6xl opacity-20">5</span>
              <h3 className="text-2xl font-bold mb-3">Observability & Security</h3>
              <p>Prometheus/Grafana, structured logs, security fundamentals.</p>
            </div>
          </div>
        </section>

        <section className="relative py-24 bg-gradient-to-tr from-indigo-700 to-purple-800 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 space-y-6 animate-fadeInUp">
            <h2 className="text-4xl font-extrabold text-white">Your Future Starts Now</h2>
            <p className="text-lg max-w-2xl mx-auto text-gray-200">Master Python backend, unlock global roles & life-changing opportunities.</p>
            <a href="https://docs.python.org/3/tutorial/" className="inline-block bg-white text-indigo-700 font-bold px-10 py-4 rounded-full shadow-xl transform hover:scale-110 transition">
              Dive In Today
            </a>
          </div>
        </section>

        <footer className="py-12 text-center text-sm text-gray-500">
          <p>Data as of August 3, 2025 • LinkedIn • Glassdoor • Indeed • Remote-OK</p>
        </footer>
      </main>
    </div>
  )
}

function applyAnimationDelay(delay: Number) {
  return {style: { animationDelay: `${delay}ms` }};
}