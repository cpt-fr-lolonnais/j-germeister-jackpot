export default function JaegerBottle({ className = "w-4 h-6 inline-block" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 32" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" className={className}>
      <rect x="7" y="0.5" width="6" height="2.5" rx="0.5" fill="currentColor"/>
      <path d="M8 3h4v4.5h-4z"/>
      <path d="M8 7.5L4.5 10.5v15l1 2.5h9l1-2.5V10.5L12 7.5z"/>
    </svg>
  );
}
