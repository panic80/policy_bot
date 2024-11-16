import './globals.css'

export const metadata = {
  title: 'CFTDTI Assistant',
  description: 'Canadian Forces Temporary Duty Travel Instructions Assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

