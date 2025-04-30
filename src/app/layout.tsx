import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from 'next/image';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Artale-TW Alt Leaderboard",
  description: "Bella my beloved",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 主要內容 */}
        {children}

        {/* 頁尾 */}
        <footer className="footer">
          <div className="footerContent">
            <div className="footerLeft">
              <p className="footerText">© Artale-TW Alt Leaderboard by Kap</p>
            </div>
            <div className="footerCenter">
              {/* Discord Icon Link */}
              <a href="https://discord.com/users/78837614261571584" target="_blank" rel="noopener noreferrer" className="socialIcon">
                <Image
                  src="/discord-icon.svg"
                  alt="Discord"
                  width={24}
                  height={24}
                />
              </a>
              {/* GitHub Icon Link */}
              {/* <a href="你的GitHub倉庫連結" target="_blank" rel="noopener noreferrer" className="socialIcon">
                <Image
                  src="/icons/github-icon.svg"
                  alt="GitHub"
                  width={24}
                  height={24}
                />
              </a> */}
            </div>
            <div className="footerRight">
              <p className={`footerText footerDisclaimer`}>本站資料由Nexon Korea Corp及Artale提供，僅供參考</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}