'use client'

import Link from 'next/link';
import React, { useState } from 'react';
import { useFormContext } from '@/store/FormContext';

function generateStaticParams() {}
 
export default function Page() {

  const {
    manualDescription,
    uploadedFileName,
    answers,
    setManualDescription,
    setUploadedFileName,
    setAnswers
  } = useFormContext();


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFileName(file.name);
    // TODO: Handle file parsing or uploading logic
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAnswers({ ...answers, [name]: value });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-10">
      <h1 className="text-3xl font-bold text-center">Tell Us About Yourself</h1>

      {/* Manual Input or Upload */}
      <section className="space-y-4">
        <label className="block font-semibold">Manual Profile Description</label>
        <textarea
          rows={6}
          className="w-full p-3 border rounded-lg"
          placeholder="Describe your background, experience, and interests..."
          value={manualDescription}
          onChange={(e) => setManualDescription(e.target.value)}
        />

        <label className="block font-semibold">Or Upload a File (PDF, DOCX)</label>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileUpload}
          className="block"
        />
        {uploadedFileName && <p className="text-sm text-green-600">Uploaded: {uploadedFileName}</p>}
      </section>

      {/* Guided Questions */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Help Us Understand You Better</h2>

        <div>
          <label className="block font-semibold mb-1">1. What is your current role?</label>
          <input
            name="currentRole"
            type="text"
            className="w-full p-3 border rounded-lg"
            value={answers.currentRole}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">2. What job would you love to have?</label>
          <input
            name="dreamJob"
            type="text"
            className="w-full p-3 border rounded-lg"
            value={answers.dreamJob}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">3. What are your strongest soft skills?</label>
          <input
            name="softSkills"
            type="text"
            className="w-full p-3 border rounded-lg"
            placeholder="e.g. communication, leadership, adaptability"
            value={answers.softSkills}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">4. What are your strongest hard skills?</label>
          <input
            name="hardSkills"
            type="text"
            className="w-full p-3 border rounded-lg"
            placeholder="e.g. JavaScript, SQL, cloud computing"
            value={answers.hardSkills}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">5. What are the biggest challenges blocking your growth?</label>
          <textarea
            name="blockers"
            rows={3}
            className="w-full p-3 border rounded-lg"
            value={answers.blockers}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">6. What do you hope to achieve in the next 6-12 months?</label>
          <textarea
            name="goals"
            rows={3}
            className="w-full p-3 border rounded-lg"
            value={answers.goals}
            onChange={handleChange}
          />
        </div>
      </section>

      {/* Submit Button */}
      <div className="text-center">
        <Link href={"/profile/1234/output/abcd/v6"} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          Generate My Roadmap
        </Link>
      </div>
    </div>
  );
}
