import { Playfair_Display, DM_Sans } from "next/font/google";
import TrackVisit from "@/components/TrackVisit";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${playfair.variable} ${dmSans.variable}`}>
        <TrackVisit />
        {children}
      </body>
    </html>
  );
}