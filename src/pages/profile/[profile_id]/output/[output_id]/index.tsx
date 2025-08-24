'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { InsightType } from '@/types/data';
import { connectDB } from '@/lib/db';
import { CareerInsight, ICareerInsight } from '@/models/CarrerInsight';
import { GetStaticProps, InferGetStaticPropsType } from 'next';

type StaticPropsType = {
  insight: InsightType | null
}

export default function Page({ insight }: InferGetStaticPropsType<typeof getStaticProps>) {

  useEffect(() => {

    document.querySelector('header')?.scrollIntoView({ behavior: 'instant', block: 'start' })
    //document.querySelector("html")?.style.setProperty("overflow", "hidden")

    // Select the element to animate
    const targetElement = document.querySelectorAll('.animate-fadeInUp-target');

    // Create an Intersection Observer instance
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {

        entry.target.classList.add('opacity-0')

        if (entry.isIntersecting) {
          // Element is visible, add the animation class
          entry.target.classList.add('animate-fadeInUp');
          // Optionally, stop observing once the animation is triggered
          observer.unobserve(entry.target);
        }
      });
    }, {
      // Options for the observer (e.g., threshold for visibility)
      threshold: 1 // Trigger when 100% of the element is visible
    });

    for (const element of targetElement) {
      observer.observe(element);
    }
  }, [])

  return (
    <div>
      <header className="relative h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 to-indigo-600 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-64 h-64 bg-purple-700 rounded-full opacity-30 animate-float"></div>
        <div className="absolute bottom-16 right-1/5 w-72 h-72 bg-indigo-700 rounded-full opacity-30 animate-float"></div>
        <div className="z-10 text-center px-4">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 animate-fadeInUp-target" {...applyAnimationDelay(300)}>{insight!.hero.title}</h1>
          <p className="text-xl md:text-2xl mb-8 animate-fadeInUp-target text-gray-200 bo" {...applyAnimationDelay(600)}>
            {insight!.hero.subtitle}
          </p>
          <button
            onClick={() => {
              document.querySelector('html')?.style.setProperty("overflow", "auto")
              document.querySelector('#snapshot')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
            className="inline-block bg-white text-indigo-600 font-bold px-8 py-4 rounded-full shadow-lg transform hover:scale-105 transition animate-fadeInUp-target"
            {...applyAnimationDelay(900)}>
            {insight!.hero.anchor}
          </button>
        </div>
      </header>

      <main className="relative space-y-16">

        <section id="snapshot" className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 order-2 md:order-1 animate-fadeInUp-target">
              <h2 className="text-3xl font-bold text-purple-400 mt-8"> {insight!.marketSnapshot.title} </h2>
              <ul className="space-y-4">
                {
                  insight!.marketSnapshot.items.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-purple-500 text-2xl mr-3">{item.icon}</span>
                      <p className='font-bold text-gray-300'> {item.description} </p>
                    </li>
                  ))
                }
              </ul>
            </div>
            <div className="relative w-full flex justify-center order-1 md:order-2">
              <div className="w-80 h-80 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl transform rotate-6 shadow-2xl animate-float"></div>
              <div className="absolute top-8 left-12 w-64 h-64 bg-gray-900 rounded-lg transform -rotate-3 flex items-center justify-center text-6xl font-extrabold text-white shadow-lg animate-fadeInUp-target" {...applyAnimationDelay(500)}>
                Jobs
              </div>
            </div>
          </div>
        </section>

        <section id="compensation" className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-indigo-300 mb-6 text-center animate-fadeInUp-target"> {insight!.compensation.title} </h2>
          <div className="flex flex-wrap justify-center gap-8 animate-fadeInUp-target text-gray-200" {...applyAnimationDelay(200)}>
            {insight!.compensation.items.map((item, index) => (
              <div
                key={index}
                className="w-full sm:w-[calc(33.333%-2rem)] p-6 bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition"
              >
                <h3 className="text-xl font-semibold mb-2 text-white">{item.label}</h3>
                <p>
                  <strong>{item.value}</strong>
                </p>
              </div>
            ))}
          </div>
        </section>


        <section id="global" className="bg-gray-800 py-24">
          <div className="container mx-auto px-6 text-center space-y-8">
            <h2 className="text-4xl font-bold text-indigo-300 animate-fadeInUp-target"> {insight!.globalOpportunities.title} </h2>
            <p className="text-lg max-w-2xl mx-auto animate-fadeInUp-target text-white" {...applyAnimationDelay(100)}>
              {insight!.globalOpportunities.subtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-gray-200">
              {
                insight!.globalOpportunities.cards.map((card, index) => (
                  <div key={index} className={`w-full sm:w-[calc(33.333%-2rem)] p-6 ${card.bgColor} rounded-2xl shadow-lg hover:-translate-y-2 transition animate-fadeInUp-target`} {...applyAnimationDelay(index * 200)}>
                    <h3 className="text-2xl font-semibold mb-2">{card.title}</h3>
                    <p>{card.description}</p>
                  </div>
                ))
              }
            </div>
          </div>
        </section>

        <section id="bigtech" className="container mx-auto px-6 py-24">
          <h2 className="text-3xl font-bold text-purple-400 mb-6 text-center animate-fadeInUp-target"> {insight!.bigTechHiring.title} </h2>
          <div className="grid md:grid-cols-2 gap-8 animate-fadeInUp-target text-gray-200" {...applyAnimationDelay(100)}>
            {
              insight!.bigTechHiring.items.map((item, index) => (
                <div key={index} className="p-6 bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition">
                  <h3 className="text-2xl font-semibold mb-2 text-white">{item.company}</h3>
                  <p>{item.details}</p>
                </div>
              ))
            }
          </div>
        </section>

        <section id="roadmap" className="container mx-auto px-6 py-24">
          <div className="text-center mb-12 animate-fadeInUp-target">
            <h2 className="text-4xl font-bold text-purple-400"> {insight!.roadmap.title} </h2>
            <p className="text-lg mt-2"> {insight!.roadmap.subtitle} </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {
              insight!.roadmap.steps.map((step, index) => (
                <div key={index} className="relative p-8 bg-gradient-to-br from-purple-600 to-indigo-600 text-gray-200 rounded-3xl shadow-2xl hover:scale-105 transition animate-fadeInUp-target" {...applyAnimationDelay(index * 200)}>
                  <span className="absolute -top-6 right-6 text-6xl opacity-20">{step.step}</span>
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              ))
            }
          </div>
        </section>

        <section className="relative py-24 bg-gradient-to-tr from-indigo-700 to-purple-800 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 space-y-6 animate-fadeInUp-target">
            <h2 className="text-4xl font-extrabold text-white"> {insight!.finalCta.title} </h2>
            <p className="text-lg max-w-2xl mx-auto text-gray-200"> {insight!.finalCta.subtitle} </p>
            <Link
              href={insight!.finalCta.cta.href}
              target='_blank'
              className="inline-block bg-white text-indigo-700 font-bold px-10 py-4 rounded-full shadow-xl transform hover:scale-110 transition"
            >
              {insight!.finalCta.cta.text}
            </Link>
          </div>
        </section>

        <footer className="py-12 text-center text-sm text-gray-500">
          <p>{insight!.footer.text}</p>
        </footer>
      </main>
    </div>
  )
}

function applyAnimationDelay(delay: Number) {
  return { style: { animationDelay: `${delay}ms` } };
}


export const getStaticProps = (async (context) => {

  const { profile_id, output_id } = (context.params ?? {}) as { profile_id?: string; output_id?: string };

  await connectDB();

  // @ts-ignore
  const insight: ICareerInsight | null = await CareerInsight.findOne({
    "_id": output_id,
    "user_id": profile_id
  }).lean();

  if (!insight) {
    return {
      redirect: {
        destination: `/profile/${profile_id}/history`,
        permanent: false,
      },
      props: {
        insight: null,
      },
    };
  }

  const serialized_insight = {
    ...insight,
    _id: (insight._id as string | { toString(): string }).toString(),
    user_id: (insight.user_id as string | { toString(): string }).toString(),
    marketSnapshot: {
      ...insight.marketSnapshot,
      items: insight.marketSnapshot.items.map(item => ({
        ...item,
        // @ts-ignore
        _id: item._id.toString(),
      }))
    },
    compensation: {
      ...insight.compensation,
      items: insight.compensation.items.map(item => ({
        ...item,
        // @ts-ignore
        _id: item._id.toString(),
      }))
    },
    globalOpportunities: {
      ...insight.globalOpportunities,
      cards: insight.globalOpportunities.cards.map(card => ({
        ...card,
        // @ts-ignore
        _id: card._id.toString(),
      }))
    },
    bigTechHiring: {
      ...insight.bigTechHiring,
      items: insight.bigTechHiring.items.map(item => ({
        ...item,
        // @ts-ignore
        _id: item._id.toString(),
      }))
    },
    roadmap: {
      ...insight.roadmap,
      steps: insight.roadmap.steps.map(step => ({
        ...step,
        // @ts-ignore
        _id: step._id.toString(),
      }))
    },
    createdAt: insight.createdAt.toString(),
    // @ts-ignore
    updatedAt: insight.updatedAt.toString(),
  }

  return {
    props: {
      insight: serialized_insight,
    },
  };

}) satisfies GetStaticProps<StaticPropsType>



export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' }; // Check it later
}
