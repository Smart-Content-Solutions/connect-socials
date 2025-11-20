import { SignIn } from "@clerk/clerk-react";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <SignIn
        routing="path"
        path="/login"           // <-- REQUIRED!!!
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/dashboard"
        appearance={{
          elements: {
            socialButtonsBlockButton: "bg-white shadow-md p-3 rounded-lg",
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
          },
          layout: {
            socialButtonsVariant: "iconButton",
          },
        }}
        preferredSignInStrategy="oauth_google"
      />
    </div>
  );
}
