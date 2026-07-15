import "./globals.css";

export const metadata = {
  title: "FEMA AFG Grants",
  description:
    "Recent FEMA Assistance to Firefighters Grants awarded to volunteer and rural fire departments",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
