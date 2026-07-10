interface IconProps { className?: string }

export function AppleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.54c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-2.99-.79-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.89 1.15 9.15.76 1.1 1.67 2.34 2.86 2.29 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.65zM14.77 5.6c.64-.77 1.07-1.85.95-2.92-.92.04-2.03.61-2.69 1.38-.59.68-1.1 1.78-.96 2.83 1.02.08 2.07-.52 2.7-1.29z" />
    </svg>
  )
}

export function WindowsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 5.25l7.2-.98v6.53H3zM11.02 4.15L21 2.8v8.32h-9.98zM3 12.7h7.2v6.53l-7.2-.98zM11.02 12.7H21v8.32l-9.98-1.35z" />
    </svg>
  )
}

export function AndroidIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3.8c-2.9 0-5.3 1.9-5.8 4.5h11.6C17.3 5.7 14.9 3.8 12 3.8z" />
      <path d="M6 9.6h12v6.6a1 1 0 0 1-1 1h-1.3v2.5a1.1 1.1 0 0 1-2.2 0v-2.5h-3v2.5a1.1 1.1 0 0 1-2.2 0v-2.5H7a1 1 0 0 1-1-1z" />
      <rect x="2.6" y="9.8" width="2.1" height="6" rx="1.05" />
      <rect x="19.3" y="9.8" width="2.1" height="6" rx="1.05" />
      <path d="M8.4 5L7.2 3.4M15.6 5l1.2-1.6" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18" />
    </svg>
  )
}

export function TelegramIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.9 4.3L2.9 11.6c-.9.35-.9 1.6.02 1.9l4.6 1.45 1.77 5.3c.24.7 1.13.9 1.66.36l2.5-2.5 4.6 3.38c.6.44 1.45.11 1.6-.62L23 5.4c.2-.9-.7-1.44-1.1-1.1zM9.4 14.3l8.1-5.9-6.5 6.4c-.2.2-.32.46-.36.74l-.3 2.2z" />
    </svg>
  )
}

export function PuzzleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 4a2 2 0 0 1 4 0c0 .5-.2 1 .5 1H16a1 1 0 0 1 1 1v2.5c0 .7.5.5 1 .5a2 2 0 0 1 0 4c-.5 0-1-.2-1 .5V16a1 1 0 0 1-1 1h-2.5c-.7 0-.5.5-.5 1a2 2 0 0 1-4 0c0-.5.2-1-.5-1H5a1 1 0 0 1-1-1v-2.5c0-.7-.5-.5-1-.5a2 2 0 0 1 0-4c.5 0 1 .2 1-.5V6a1 1 0 0 1 1-1h2.5c.7 0 .5-.5.5-1z" />
    </svg>
  )
}

export function CodeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 6l-6 6 6 6M16 6l6 6-6 6" />
    </svg>
  )
}
