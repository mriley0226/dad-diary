import './globals.css'

export const metadata = {
  title: 'Keeper',
  description: 'A journal for the moments worth keeping.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}