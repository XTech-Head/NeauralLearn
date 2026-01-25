import { ClerkProvider } from "@clerk/nextjs";
import Provider from "./provider";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <Provider>{children}</Provider>
        </ClerkProvider>
      </body>
    </html>
  );
}
