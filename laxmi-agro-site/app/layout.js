import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RouteMain from "@/components/RouteMain";

export const metadata = {
  title: "Laxmi Agro - Agriculture & Equipment Solutions",
  description:
    "Agriculture and industrial equipment platform for machinery, irrigation, power tools, and farm supply operations.",
  keywords: "laxmi agro, agriculture machinery, power tools, irrigation, wholesale, farming equipment, agri marketplace",
  icons: {
    icon: "/favicon-rounded.png",
    shortcut: "/favicon-rounded.png",
    apple: "/favicon-rounded.png",
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
