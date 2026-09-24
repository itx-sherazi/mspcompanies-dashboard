export const dynamic = 'force-dynamic';

import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import ToastContainerConfig from "@/Componenets/ui/ToastContainerConfig";



const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <ToastContainerConfig />
      </body>
    </html>
  );
}