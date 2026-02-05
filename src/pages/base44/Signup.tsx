import { SignUp } from "@clerk/clerk-react";

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/login"
        fallbackRedirectUrl="/home"
      />
    </div>
  );
}
