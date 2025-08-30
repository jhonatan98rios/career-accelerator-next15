import React, { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function SignupPage() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <LoginForm />
    </Suspense>
  );
}
