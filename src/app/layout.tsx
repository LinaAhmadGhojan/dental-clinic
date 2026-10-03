import type { Metadata, Viewport } from "next";
import { Cairo, Geist } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { StoreProvider } from "@/lib/store";
import Shell from "@/components/Shell";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"] });

export const metadata: Metadata = {
  title: "DentaCare - Smart Dental Clinic Management",
  description: "Live waiting queue, online booking, odontogram, billing and reports for dental clinics. Arabic and English.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0d9488" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${cairo.variable} h-full antialiased`}>
      <body className="min-h-full text-slate-900">
        <I18nProvider>
          <StoreProvider>
            <Shell>{children}</Shell>
          </StoreProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
