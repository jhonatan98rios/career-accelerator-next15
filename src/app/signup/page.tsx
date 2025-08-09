import React, { Suspense } from "react";
import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <SignupForm />
    </Suspense>
  );
}
