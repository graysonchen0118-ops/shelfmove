import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Shell } from "@/components/Shell";

const lexend = Lexend({ subsets: ["latin", "latin-ext", "vietnamese"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: "Shelfmove | Hearth & Grain, 1.0 to 2.17", template: "%s | Shelfmove" },
  description: "The store move console for Hearth & Grain: parts list, price check, customer accounts, order top-ups and switch day, while the live store keeps selling.",
};

export const viewport: Viewport = {
  themeColor: "#3b3fb8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={lexend.className}>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
