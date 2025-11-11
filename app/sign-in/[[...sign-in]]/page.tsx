import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Trimind V-Next</h1>
          <p className="mt-2 text-slate-600">Sign in to your account</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: "bg-slate-900 hover:bg-slate-800",
              card: "shadow-xl",
            },
          }}
        />
      </div>
    </div>
  );
}
