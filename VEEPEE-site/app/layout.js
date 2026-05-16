import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RouteMain from "@/components/RouteMain";

export const metadata = {
  title: "Veepee Impex - Agriculture & Power Tools Distributor",
  description:
    "Distributor of Oxon heavy machinery. Empowering Indian farmers and industries with professional power tools, irrigation systems, and agricultural innovation. Pan India distribution from Raipur, Chhattisgarh.",
  keywords: "agriculture machinery, power tools, irrigation, Oxon, Veepee Impex, Raipur, Chhattisgarh, wholesale, farming equipment",
  icons: {
    icon: "/favicon-rounded.svg",
    shortcut: "/favicon-rounded.svg",
    apple: "/images/veepee-logo.webp",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-secondary bg-neutral-background text-text-secondary overflow-x-hidden">
        <Header />
        <RouteMain>{children}</RouteMain>
        <Footer />
      </body>
    </html>
  );
}
