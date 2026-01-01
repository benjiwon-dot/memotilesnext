import "./globals.css";
import { AppProvider } from "../context/AppContext";

export const metadata = {
  title: "Memotiles",
  description: "Upload, crop to 20×20, and we’ll print & deliver.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}

