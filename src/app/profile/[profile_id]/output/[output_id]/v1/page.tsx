interface PageProps {
  params: Promise<{
    output_id: string
    profile_id: string
  }>
}

export default async function Page({ params }: PageProps) {

  const { output_id, profile_id } = await params

  // TODO: replace with real data or hooks
  const stats = {
    openRoles: 1284,
    avgSalary: '$85k - $120k',
    growthRate: '12% YoY',
  };

  const skillGaps = [
    { name: 'React Advanced Patterns', type: 'Course', provider: 'Udemy', link: '#' },
    { name: 'TypeScript Deep Dive', type: 'Book', provider: 'OReilly', link: '#' },
    { name: 'Algorithm & Data Structures', type: 'Course', provider: 'Coursera', link: '#' },
  ];

  const languageRecommendations = [
    { name: 'Spanish', reason: 'Remote roles with Latin American teams', link: '#' },
    { name: 'German', reason: 'European market opportunities', link: '#' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">Your Dev Career Roadmap</h1>
        <p className="text-lg text-gray-600">Understand the market, compare your profile, and get actionable steps to level up.</p>
      </section>

      {/* Market Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold">Open Roles</h2>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.openRoles}</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold">Avg. Salary</h2>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.avgSalary}</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold">Market Growth</h2>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.growthRate}</p>
        </div>
      </section>

      {/* Motivation & Insight */}
      <section>
        <h2 className="text-3xl font-bold mb-4">Why Now?</h2>
        <p className="text-gray-700 leading-relaxed">
          The developer job market is expanding rapidly. Companies across industries are seeking talent to build scalable, performant applications. By investing in targeted skills, you can position yourself at the forefront of this growth and command top-tier compensation.
        </p>
      </section>

      {/* Skill Gap Courses */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Recommended Learning</h2>
        <div className="space-y-4">
          {skillGaps.map((item, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.type} • {item.provider}</p>
              </div>
              <a href={item.link} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                Take Course
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Language Recommendations */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Language Skills</h2>
        <div className="space-y-4">
          {languageRecommendations.map((lang, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">{lang.name}</h3>
                <p className="text-sm text-gray-500">{lang.reason}</p>
              </div>
              <a href={lang.link} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                Learn More
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
