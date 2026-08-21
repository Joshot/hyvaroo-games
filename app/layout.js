import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const pressStart2P = Press_Start_2P({
  weight: '400',
  variable: "--font-press-start",
  subsets: ["latin"],
});

const vt323 = VT323({
  weight: '400',
  variable: "--font-vt323",
  subsets: ["latin"],
});

export const metadata = {
  title: "The Endless Expanse",
  description: "An infinite 8-bit RPG experience.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${pressStart2P.variable} ${vt323.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-vt323 text-xl leading-relaxed p-4 md:p-8 max-w-4xl mx-auto bg-black text-white">{children}</body>
    </html>
  );
}
