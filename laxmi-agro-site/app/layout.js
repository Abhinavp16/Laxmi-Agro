import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RouteMain from "@/components/RouteMain";

export const metadata = {
  title: "Laxmi Agro Enterprises",
  description:
    "Laxmi Agro Enterprises supplies pumps, pipes, cables, sprinklers, control panels, and allied agriculture products from Raipur.",
  keywords: "Laxmi Agro Enterprises, agriculture supplies Raipur, submersible pumps, PVC column pipes, GI pipes, sprinkler sets, control panels",
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
