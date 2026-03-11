import { useState } from 'react';
import { motion } from 'framer-motion';
import { Stats } from '@/hooks/useGameState';
import { X, Shield, LogOut } from 'lucide-react';
import JaegerBottle from '@/components/JaegerBottle';
import AdminPinDialog from '@/components/AdminPinDialog';

interface Props {
  stats: Stats;
  resetAll: () => void;
  deleteRound: (roundNumber: number) => void;
  isAdmin: boolean;
  checkPin: (pin: string) => Promise<boolean>;
  logout: () => void;
}

export default function StatsPage({ stats, resetAll, deleteRound, isAdmin, checkPin, logout }: Props) {
  const { jaegerRemaining, totalJaeger, playerStats, rounds } = stats;
  const [pinOpen, setPinOpen] = useState(false);

  const leaderboard = Object.entries(playerStats)
    .map(([name, s]) => ({ name, drinks: s.drinks }))
    .filter(p => p.drinks > 0)
    .sort((a, b) => b.drinks - a.drinks || a.name.localeCompare(b.name));

  let currentRank = 1;
  const leaderboardWithRank = leaderboard.map((p, i) => {
    if (i > 0 && p.drinks < leaderboard[i - 1].drinks) {
      currentRank = i + 1;
    }
    return { ...p, rank: currentRank };
  });

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="w-10" />
        <h1 className="font-fraktur text-4xl text-center text-primary text-glow-orange">Statistik</h1>
        <button
          onClick={() => isAdmin ? logout() : setPinOpen(true)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-orbitron transition ${
            isAdmin 
              ? 'text-primary bg-primary/10 border border-primary/30' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {isAdmin ? <><LogOut className="w-3 h-3" /> Admin</> : <><Shield className="w-3 h-3" /> Admin</>}
        </button>
      </div>

      {/* Jäger Countdown */}
      <div className="neon-border rounded-lg p-4 mb-6 bg-card/50 text-center">
        <div className="font-orbitron font-bold text-3xl text-foreground">
          {jaegerRemaining} <span className="text-muted-foreground text-lg">von {totalJaeger}</span>
        </div>
        <p className="text-xs font-orbitron text-muted-foreground mt-1">Jägermeister übrig</p>
        <div className="w-full h-3 bg-muted rounded-full mt-3 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${(jaegerRemaining / totalJaeger) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {jaegerRemaining <= 0 && (
          <p className="font-arcade text-xs text-jaeger-gold text-glow-gold mt-3">
            ALLE JÄGER VERNICHTET!
          </p>
        )}
      </div>

      {/* Leaderboard */}
      <div className="mb-6">
        <h2 className="font-arcade text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
          <JaegerBottle className="w-3 h-5 inline-block" /> TRINK-RANGLISTE
        </h2>
        {leaderboardWithRank.length === 0 ? (
          <p className="text-center text-muted-foreground text-xs font-orbitron">Noch keine Runden gespielt.</p>
        ) : (
          <div className="space-y-2">
            {leaderboardWithRank.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-card neon-border"
              >
                <span className="font-arcade text-xs w-6 text-center text-muted-foreground">
                  {`${p.rank}.`}
                </span>
                <span className="flex-1 font-orbitron font-bold text-sm text-foreground">{p.name}</span>
                <span className="font-orbitron font-bold text-primary text-glow-orange">{p.drinks}</span>
                <span className="text-xs text-muted-foreground"><JaegerBottle className="w-3 h-5 inline-block" /></span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Round History */}
      {rounds.length > 0 && (
        <div className="mb-6">
          <h2 className="font-arcade text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
            RUNDENVERLAUF
          </h2>
          <div className="space-y-1">
            {[...rounds].reverse().map((r) => (
              <div key={r.round} className="text-xs font-orbitron text-muted-foreground p-2 rounded bg-card/50 border border-border flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div>
                    <span className="text-primary">R{r.round}:</span>{' '}
                    {r.jaegerConsumed === 1 ? (
                      <>{r.loser || r.master} trinkt alleine</>
                    ) : r.deer1 === r.deer2 ? (
                      <>{r.master} + {r.loser} trinken</>
                    ) : (
                      <>{r.master} + {r.loser} trinken · {r.deer1 === r.loser ? r.deer2 : r.deer1 === r.master ? r.deer2 : r.deer1} entkommt</>
                    )}
                  </div>
                  {r.timestamp && (
                    <div className="text-muted-foreground/30 text-[9px] mt-0.5">
                      {new Date(r.timestamp).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Runde ${r.round} wirklich löschen? Counter und Statistik werden zurückgerechnet.`)) {
                        deleteRound(r.round);
                      }
                    }}
                    className="text-muted-foreground/30 hover:text-destructive transition flex-shrink-0 mt-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset - only for admin */}
      {isAdmin && (
        <button
          onClick={() => {
            if (window.confirm('Wirklich alles zurücksetzen? Alle Statistiken gehen verloren!')) {
              resetAll();
            }
          }}
          className="w-full py-3 rounded-lg font-arcade text-[10px] bg-destructive text-destructive-foreground hover:opacity-90 transition"
        >
          ALLES ZURÜCKSETZEN
        </button>
      )}

      <AdminPinDialog open={pinOpen} onClose={() => setPinOpen(false)} checkPin={checkPin} />
    </div>
  );
}
