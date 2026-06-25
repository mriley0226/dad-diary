import './globals.css'
import { PHProvider } from './lib/posthog'

export const metadata = {
  title: 'Keeper',
  description: 'A journal for the moments worth keeping.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PHProvider>{children}</PHProvider>
      </body>
    </html>
  )
}