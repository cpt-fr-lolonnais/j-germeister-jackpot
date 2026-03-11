import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface SlotReelProps {
  names: string[];
  spinning: boolean;
  onStop?: (name: string) => void;
  label: string;
  revealed?: string | null;
  inactive?: boolean;
  spinDuration?: number;
}

export default function SlotReel({ names, spinning, onStop, label, revealed, inactive = false, spinDuration = 2500 }: SlotReelProps) {
  const [displayName, setDisplayName] = useState('');
  const [stopped, setStopped] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;
  const namesRef = useRef(names);
  namesRef.current = names;

  useEffect(() => {
    if (!spinning) return;
    if (namesRef.current.length === 0) return;

    setStopped(false);
    let speed = 50;
    let elapsed = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;

      const randomName = namesRef.current[Math.floor(Math.random() * namesRef.current.length)];
      setDisplayName(randomName);
      elapsed += speed;

      if (elapsed > spinDuration) {
        const finalName = namesRef.current[Math.floor(Math.random() * namesRef.current.length)];
        setDisplayName(finalName);
        setStopped(true);
        onStopRef.current?.(finalName);
        return;
      }

      if (elapsed > spinDuration * 0.6) {
        speed = Math.min(speed + 30, 300);
      } else if (elapsed > spinDuration * 0.3) {
        speed = Math.min(speed + 10, 150);
      }

      timeoutRef.current = setTimeout(tick, speed);
    };

    tick();

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [spinning, spinDuration]);

  useEffect(() => {
    if (revealed) {
      setDisplayName(revealed);
      setStopped(true);
    }
  }, [revealed]);
  return (
    <div className={`flex flex-col items-center gap-2 ${inactive ? 'opacity-30' : ''}`}>
      <span className="text-xs font-arcade uppercase tracking-widest text-primary text-glow-orange">
        {label}
      </span>
      <div className="slot-reel w-24 h-28 sm:w-28 sm:h-32 rounded-lg flex items-center justify-center overflow-hidden relative">
        {inactive ? (
          <span className="text-muted-foreground text-2xl">?</span>
        ) : (
          <motion.div
            key={displayName}
            initial={spinning && !stopped ? { y: -20, opacity: 0 } : {}}
            animate={{ y: 0, opacity: 1 }}
            className={`text-center px-2 font-orbitron font-bold text-sm sm:text-base ${
              stopped ? 'text-primary text-glow-orange' : 'text-foreground'
            }`}
          >
            {displayName || '—'}
          </motion.div>
        )}

        {/* Scanlines overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
          }}
        />
      </div>
    </div>
  );
}
