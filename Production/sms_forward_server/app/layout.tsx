export const metadata = {
  title: 'OTP Relay API',
  description: 'Production-ready OTP relay API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

