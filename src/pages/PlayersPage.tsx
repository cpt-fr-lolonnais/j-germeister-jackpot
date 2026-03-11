import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, UserPlus } from 'lucide-react';
import { Player } from '@/hooks/useGameState';

interface Props {
  players: Player[];
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  togglePlayer: (id: string) => void;
}

export default function PlayersPage({ players, addPlayer, removePlayer, togglePlayer }: Props) {
  const [name, setName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const activeCount = players.filter(p => p.active).length;

  const handleAdd = () => {
    if (name.trim()) {
      addPlayer(name);
      setName('');
    }
  };

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <h1 className="font-fraktur text-4xl text-center text-primary text-glow-orange mb-2">Spieler</h1>
      <p className="text-center text-muted-foreground text-xs font-orbitron mb-6">
        {activeCount} aktiv · mind. 3 für den Bandit
      </p>

      {/* Add player */}
      <div className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Name eingeben..."
          className="flex-1 bg-input border border-border rounded-lg px-4 py-3 text-foreground font-orbitron text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleAdd}
          className="bg-primary text-primary-foreground px-4 rounded-lg font-bold hover:opacity-90 transition box-glow-orange"
        >
          <UserPlus className="w-5 h-5" />
        </button>
      </div>

      {/* Player list */}
      <div className="space-y-2">
        <AnimatePresence>
          {players.map(player => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`flex items-center gap-3 p-3 rounded-lg neon-border transition-all ${
                player.active ? 'bg-card' : 'bg-muted/30'
              }`}
            >
              {/* Toggle */}
              <button
                onClick={() => togglePlayer(player.id)}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  player.active ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-primary-foreground transition-transform ${
                    player.active ? 'left-[26px]' : 'left-0.5'
                  }`}
                />
              </button>

              {/* Name */}
              <span className={`flex-1 font-orbitron font-bold text-sm ${
                player.active ? 'text-foreground' : 'text-muted-foreground line-through'
              }`}>
                {player.name}
              </span>

              {/* Delete */}
              {deleteConfirm === player.id ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => { removePlayer(player.id); setDeleteConfirm(null); }}
                    className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded font-bold"
                  >
                    JA
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded font-bold"
                  >
                    NEIN
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(player.id)}
                  className="text-muted-foreground hover:text-destructive transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {players.length === 0 && (
        <p className="text-center text-muted-foreground font-orbitron text-xs mt-8">
          Noch keine Spieler. Füge mindestens 3 hinzu!
        </p>
      )}
    </div>
  );
}
