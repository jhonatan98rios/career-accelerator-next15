'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Answers {
  currentRole: string;
  experience: string;
  education: string;
  dreamJob: string;
  softSkills: string;
  hardSkills: string;
  blockers: string;
  "1-year-goals": string,
  "5-years-goals": string,
  "10-years-goals": string;
}

interface FormContextProps {
  manualDescription: string;
  uploadedFileName: string;
  answers: Answers;
  setManualDescription: (desc: string) => void;
  setUploadedFileName: (name: string) => void;
  setAnswers: (answers: Answers) => void;
}

const FormContext = createContext<FormContextProps | undefined>(undefined);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) throw new Error('useFormContext must be used within a FormProvider');
  return context;
};

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [manualDescription, setManualDescription] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [answers, setAnswers] = useState<Answers>({
    currentRole: '',
    experience: '',
    education: '',
    dreamJob: '',
    softSkills: '',
    hardSkills: '',
    blockers: '',
    "1-year-goals": '',
    "5-years-goals": '',
    "10-years-goals": '',
  });

  return (
    <FormContext.Provider value={{
      manualDescription,
      uploadedFileName,
      answers,
      setManualDescription,
      setUploadedFileName,
      setAnswers
    }}>
      {children}
    </FormContext.Provider>
  );
};
