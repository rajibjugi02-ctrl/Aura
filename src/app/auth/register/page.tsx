import React from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-white">
      <div className="w-full max-w-md z-10">
        <RegisterForm />
      </div>
    </div>
  );
}
