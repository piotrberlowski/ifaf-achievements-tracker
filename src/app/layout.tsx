import Navigation from "@/components/Navigation";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IFAF achievements",
  description: "Records and GAINS awards for the Irish Field Archery Federation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="relative flex h-dvh w-full flex-col px-2">
        <div className="flex flex-none">
          <Navigation className="flex-1" />
        </div>
        <main className="relative mx-auto h-full w-full items-center bg-base-100 align-top lg:w-5/6 xl:w-3/4">
          {children}
        </main>
      </body>
    </html>
  );
}
