import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication | TumaNow",
  description: "Login, register, or reset your password",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

