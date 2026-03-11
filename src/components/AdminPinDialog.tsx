import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  onClose: () => void;
  checkPin: (pin: string) => Promise<boolean>;
}

export default function AdminPinDialog({ open, onClose, checkPin }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async () => {
    if (pin.length !== 4) return;
    setChecking(true);
    setError(false);
    const ok = await checkPin(pin);
    setChecking(false);
    if (ok) {
      setPin('');
      onClose();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card neon-border rounded-xl p-6 w-72 mx-4"
          onClick={e => e.stopPropagation()}
        >
          <h2 className="font-fraktur text-2xl text-primary text-glow-orange text-center mb-4">
            Admin Login
          </h2>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="4-stelliger PIN"
            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground font-orbitron text-center text-lg tracking-[0.5em] placeholder:text-muted-foreground placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          {error && (
            <p className="text-destructive text-xs font-orbitron text-center mt-2">
              Falscher PIN!
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={pin.length !== 4 || checking}
            className="w-full mt-4 py-3 rounded-lg font-arcade text-[10px] bg-primary text-primary-foreground box-glow-orange disabled:opacity-40 transition"
          >
            {checking ? 'PRÜFE...' : 'ANMELDEN'}
          </button>
          <button
            onClick={onClose}
            className="w-full mt-2 py-2 rounded-lg font-orbitron text-xs text-muted-foreground hover:text-foreground transition"
          >
            Abbrechen
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
