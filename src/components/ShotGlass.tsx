export default function ShotGlass({ className = "w-4 h-4 inline-block" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 28" fill="currentColor" className={className}>
      <path d="M4 2h16l-2 20H6L4 2zm2 2l1.5 16h9L18 4H6z" />
      <rect x="8" y="24" width="8" height="2" rx="1" />
    </svg>
  );
}
