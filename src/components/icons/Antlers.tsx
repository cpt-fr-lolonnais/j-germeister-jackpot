interface Props {
  className?: string;
}

export default function Antlers({ className = "w-5 h-5" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22v-8" />
      <path d="M12 14L8 8L5 3" />
      <path d="M8 8L6 10" />
      <path d="M8 8L10 6" />
      <path d="M12 14L16 8L19 3" />
      <path d="M16 8L18 10" />
      <path d="M16 8L14 6" />
    </svg>
  );
}
