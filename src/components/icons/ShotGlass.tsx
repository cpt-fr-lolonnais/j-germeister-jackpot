interface Props {
  className?: string;
}

export default function ShotGlass({ className = "w-4 h-4" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2L4 22h16L18 2H6z" />
      <path d="M6 12h12" />
    </svg>
  );
}
