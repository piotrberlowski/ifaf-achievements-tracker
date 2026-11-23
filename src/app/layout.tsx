import Navigation from "@/components/Navigation";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "IFAF achievements",
    template: "%s | IFAF achievements",
  },
  description: "Records and GAINS awards for the Irish Field Archery Federation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="relative flex min-h-dvh w-full flex-col bg-base-200 px-2 text-base-content">
        <div className="flex flex-none">
          <Navigation className="flex-1" />
        </div>
        <main className="relative mx-auto w-full flex-1 items-center bg-base-100 align-top lg:w-5/6 xl:w-3/4">
          {children}
        </main>
      </body>
    </html>
  );
}
