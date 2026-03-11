import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import SlotReel from '@/components/SlotReel';
import JaegerBottle from '@/components/JaegerBottle';
import { GameState, Stats, Player } from '@/hooks/useGameState';

interface Props {
  activePlayers: Player[];
  gameState: GameState;
  stats: Stats;
  startSpin: () => void;
  revealMaster: (name: string) => void;
  startDeerSpin: () => void;
  revealDeers: (d1: string, d2: string) => void;
  resolveChallengeNormal: (loser: string) => void;
  resolveChallengeDoppel: (winner: string) => void;
  resetRound: () => void;
  pickRandom: () => string;
}

export default function BanditPage({
  activePlayers, gameState, stats, startSpin, revealMaster,
  startDeerSpin, revealDeers, resolveChallengeNormal, resolveChallengeDoppel, resetRound, pickRandom
}: Props) {
  const { phase, master, deer1, deer2, isDoppel, isDreifach } = gameState;
  const names = useMemo(() => activePlayers.map(p => p.name), [activePlayers]);
  const canSpin = activePlayers.length >= 3 && stats.jaegerRemaining > 0;

  const [showSpecial, setShowSpecial] = useState<'doppel' | 'jackpot' | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Handle master reel stop
  const handleMasterStop = useCallback((name: string) => {
    setTimeout(() => {
      revealMaster(name);
      setIsSpinning(false);
    }, 300);
  }, [revealMaster]);

  // Handle deer reels stop
  const [deer1Stopped, setDeer1Stopped] = useState<string | null>(null);
  const [deer2Stopped, setDeer2Stopped] = useState<string | null>(null);

  const handleDeer1Stop = useCallback((name: string) => {
    setDeer1Stopped(name);
  }, []);

  const handleDeer2Stop = useCallback((name: string) => {
    setDeer2Stopped(name);
  }, []);

  useEffect(() => {
    if (phase === 'deer_spinning' && deer1Stopped && deer2Stopped) {
      setTimeout(() => {
        revealDeers(deer1Stopped, deer2Stopped);
        setDeer1Stopped(null);
        setDeer2Stopped(null);
        setIsSpinning(false);
      }, 500);
    }
  }, [deer1Stopped, deer2Stopped, phase, revealDeers]);

  // Special effects
  useEffect(() => {
    if (isDreifach && phase === 'result') {
      setShowSpecial('jackpot');
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 7, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#E77917', '#1D3C34', '#FFD700'] });
        confetti({ particleCount: 7, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#E77917', '#1D3C34', '#FFD700'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      setTimeout(() => setShowSpecial(null), 4000);
    } else if (isDoppel && phase === 'challenge_input') {
      setShowSpecial('doppel');
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 }, colors: ['#E77917', '#1D3C34'] });
      setTimeout(() => setShowSpecial(null), 2000);
    }
  }, [isDreifach, isDoppel, phase]);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    if (phase === 'idle') {
      startSpin();
    } else if (phase === 'master_revealed') {
      setDeer1Stopped(null);
      setDeer2Stopped(null);
      startDeerSpin();
    }
  };

  const getButtonLabel = () => {
    switch (phase) {
      case 'idle': return 'SPIN!';
      case 'master_spinning': return 'DREHT...';
      case 'master_revealed': return 'HIRSCHE JAGEN!';
      case 'deer_spinning': return 'DREHT...';
      default: return '';
    }
  };

  const isGameOver = stats.jaegerRemaining <= 0;

  // Get last round info for result display
  const lastRound = stats.rounds[stats.rounds.length - 1];

  return (
    <div className="p-4 pb-24 max-w-md mx-auto text-center relative overflow-hidden">
      {/* Special effect overlays */}
      <AnimatePresence>
        {showSpecial === 'jackpot' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 animate-mega-shake"
          >
            <div className="text-center">
              <div className="font-arcade text-2xl text-jaeger-gold text-glow-gold animate-flash mb-4">
                JACKPOT!!!
              </div>
              <div className="font-fraktur text-4xl text-primary text-glow-orange">
                {master}
              </div>
              <div className="font-orbitron text-lg text-foreground mt-2">
                TRINKT ALLEINE! <JaegerBottle />
              </div>
            </div>
          </motion.div>
        )}
        {showSpecial === 'doppel' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80"
          >
            <div className="font-arcade text-xl text-jaeger-gold text-glow-gold animate-glitch">
              ⚡ DOPPELGÄNGER ⚡
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-4">
        <h1 className="font-fraktur text-5xl text-primary text-glow-orange leading-tight">Hirschjagd</h1>
        <p className="font-arcade text-[8px] text-foreground animate-neon-pulse mt-1 tracking-widest">
          40 SHOTS TO GLORY
        </p>
      </div>

      {/* Jäger Counter */}
      <div className="neon-border rounded-lg p-3 mb-6 bg-card/50">
        <span className="font-orbitron font-bold text-lg">
          🦌 {stats.jaegerRemaining}/{stats.totalJaeger} JÄGER ÜBRIG
        </span>
        <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={false}
            animate={{ width: `${(stats.jaegerRemaining / stats.totalJaeger) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {isGameOver ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="py-12"
        >
          <div className="font-arcade text-xl text-jaeger-gold text-glow-gold mb-4">
            🏁 ALLE JÄGER VERNICHTET! 🏁
          </div>
          <div className="font-fraktur text-3xl text-primary text-glow-orange">
            Das Massaker ist vorbei!
          </div>
        </motion.div>
      ) : (
        <>
          {/* Slot Machine */}
          <div className="flex justify-center gap-3 mb-6">
            <SlotReel
              names={names}
              spinning={phase === 'master_spinning'}
              onStop={handleMasterStop}
              label="MEISTER"
              revealed={master}
              spinDuration={2500}
            />
            <SlotReel
              names={names}
              spinning={phase === 'deer_spinning'}
              onStop={handleDeer1Stop}
              label="HIRSCH"
              revealed={deer1}
              inactive={phase === 'idle' || phase === 'master_spinning' || phase === 'master_revealed'}
              spinDuration={2800}
            />
            <SlotReel
              names={names}
              spinning={phase === 'deer_spinning'}
              onStop={handleDeer2Stop}
              label="HIRSCH"
              revealed={deer2}
              inactive={phase === 'idle' || phase === 'master_spinning' || phase === 'master_revealed'}
              spinDuration={3200}
            />
          </div>

          {/* Spin Button */}
          {(phase === 'idle' || phase === 'master_revealed') && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSpin}
              disabled={!canSpin || isSpinning}
              className="w-full py-4 rounded-xl font-arcade text-sm bg-primary text-primary-foreground box-glow-orange disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {getButtonLabel()}
            </motion.button>
          )}

          {phase === 'master_spinning' || phase === 'deer_spinning' ? (
            <div className="py-4 font-arcade text-xs text-muted-foreground animate-pulse">
              {getButtonLabel()}
            </div>
          ) : null}

          {/* Challenge Input */}
          {phase === 'challenge_input' && !isDreifach && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-4"
            >
              {isDoppel ? (
                <>
                  <p className="font-orbitron text-sm text-foreground">
                    <span className="text-primary font-bold">{master}</span> ist Meister UND Hirsch!
                    <br />Er tritt an gegen <span className="text-primary font-bold">{deer1 === master ? deer2 : deer1}</span>!
                  </p>
                  <p className="font-arcade text-[10px] text-muted-foreground">Wer hat die Challenge VERLOREN?</p>
                  <div className="flex gap-3">
                    {[master!, deer1 === master ? deer2! : deer1!].map(name => (
                      <motion.button
                        key={name}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => resolveChallengeDoppel(name)}
                        className="flex-1 py-3 rounded-lg font-orbitron font-bold text-sm bg-secondary text-secondary-foreground neon-border hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        {name}
                      </motion.button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="font-orbitron text-sm text-foreground">
                    <span className="text-primary font-bold">{master}</span> bestimmt die Challenge!
                    <br /><span className="text-primary font-bold">{deer1}</span> vs <span className="text-primary font-bold">{deer2}</span>
                  </p>
                  <p className="font-arcade text-[10px] text-muted-foreground">Wer hat die Challenge VERLOREN?</p>
                  <div className="flex gap-3">
                    {[deer1!, deer2!].map(name => (
                      <motion.button
                        key={name}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => resolveChallengeNormal(name)}
                        className="flex-1 py-3 rounded-lg font-orbitron font-bold text-sm bg-secondary text-secondary-foreground neon-border hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        {name}
                      </motion.button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Result display */}
          {phase === 'result' && lastRound && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 space-y-4"
            >
              {lastRound.jaegerConsumed === 1 ? (
                <p className="font-orbitron text-lg text-foreground">
                  {isDreifach ? '🎰' : '⚡'} <span className="text-primary font-bold">{lastRound.master}</span> TRINKT ALLEINE! <JaegerBottle />
                </p>
              ) : (
                <p className="font-orbitron text-lg text-foreground">
                  🦌 <span className="text-primary font-bold">{lastRound.master}</span> + <span className="text-primary font-bold">
                    {lastRound.loser}
                  </span> trinken! <JaegerBottle />
                </p>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={resetRound}
                className="w-full py-3 rounded-xl font-arcade text-xs bg-secondary text-secondary-foreground neon-border hover:bg-primary hover:text-primary-foreground transition-all"
              >
                NÄCHSTE RUNDE →
              </motion.button>
            </motion.div>
          )}

          {!canSpin && phase === 'idle' && activePlayers.length < 3 && (
            <p className="mt-4 text-xs font-orbitron text-destructive">
              Mindestens 3 aktive Spieler nötig!
            </p>
          )}
        </>
      )}
    </div>
  );
}
