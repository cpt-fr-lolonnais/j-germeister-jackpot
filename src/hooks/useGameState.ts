import { useState, useEffect, useCallback } from 'react';

export interface Player {
  id: string;
  name: string;
  active: boolean;
}

export type GamePhase = 'idle' | 'master_spinning' | 'master_revealed' | 'deer_spinning' | 'result' | 'challenge_input';

export interface GameState {
  phase: GamePhase;
  master: string | null;
  deer1: string | null;
  deer2: string | null;
  isDoppel: boolean;
  isDreifach: boolean;
}

export interface RoundLog {
  round: number;
  master: string;
  deer1: string;
  deer2: string;
  loser: string | null;
  jaegerConsumed: number;
}

export interface Stats {
  totalJaeger: number;
  jaegerRemaining: number;
  playerStats: Record<string, { drinks: number }>;
  rounds: RoundLog[];
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function saveToStorage(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useGameState() {
  const [players, setPlayersState] = useState<Player[]>(() => loadFromStorage('hj_players', []));
  const [gameState, setGameState] = useState<GameState>({
    phase: 'idle', master: null, deer1: null, deer2: null, isDoppel: false, isDreifach: false
  });
  const [stats, setStatsState] = useState<Stats>(() => loadFromStorage('hj_stats', {
    totalJaeger: 40, jaegerRemaining: 40, playerStats: {}, rounds: []
  }));

  // Migration: Reset corrupted stats from previous version
  useEffect(() => {
    const version = localStorage.getItem('hj_version');
    if (version !== '2') {
      localStorage.removeItem('hj_stats');
      localStorage.setItem('hj_version', '2');
      setStatsState({ totalJaeger: 40, jaegerRemaining: 40, playerStats: {}, rounds: [] });
    }
  }, []);

  const setPlayers = useCallback((p: Player[] | ((prev: Player[]) => Player[])) => {
    setPlayersState(prev => {
      const next = typeof p === 'function' ? p(prev) : p;
      saveToStorage('hj_players', next);
      return next;
    });
  }, []);

  const setStats = useCallback((s: Stats | ((prev: Stats) => Stats)) => {
    setStatsState(prev => {
      const next = typeof s === 'function' ? s(prev) : s;
      saveToStorage('hj_stats', next);
      return next;
    });
  }, []);

  const activePlayers = players.filter(p => p.active);

  const addPlayer = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPlayers(prev => [...prev, { id: crypto.randomUUID(), name: trimmed, active: true }]);
    setStats(prev => ({
      ...prev,
      playerStats: { ...prev.playerStats, [trimmed]: prev.playerStats[trimmed] || { drinks: 0 } }
    }));
  }, [setPlayers, setStats]);

  const removePlayer = useCallback((id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  }, [setPlayers]);

  const togglePlayer = useCallback((id: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  }, [setPlayers]);

  const pickRandom = useCallback(() => {
    const pool = activePlayers;
    return pool[Math.floor(Math.random() * pool.length)]?.name || '';
  }, [activePlayers]);

  const startSpin = useCallback(() => {
    if (activePlayers.length < 3) return;
    setGameState({ phase: 'master_spinning', master: null, deer1: null, deer2: null, isDoppel: false, isDreifach: false });
  }, [activePlayers]);

  const revealMaster = useCallback((name: string) => {
    setGameState(prev => ({ ...prev, phase: 'master_revealed', master: name }));
  }, []);

  const startDeerSpin = useCallback(() => {
    setGameState(prev => ({ ...prev, phase: 'deer_spinning' }));
  }, []);

  const revealDeers = useCallback((d1: string, d2: string) => {
    const master = gameState.master!;
    const isDreifach = master === d1 && master === d2;
    const isDoppel = !isDreifach && (master === d1 || master === d2);
    
    if (isDreifach) {
      setGameState(prev => ({ ...prev, phase: 'result', deer1: d1, deer2: d2, isDoppel: false, isDreifach: true }));
      // Auto-resolve jackpot
      recordDrink(master, null, d1, d2, 1, true);
    } else {
      setGameState(prev => ({ ...prev, phase: 'challenge_input', deer1: d1, deer2: d2, isDoppel, isDreifach: false }));
    }
  }, [gameState.master]);

  const recordDrink = useCallback((loserOrDrinker: string, secondDrinker: string | null, d1: string, d2: string, jaegerCount: number, isJackpot = false) => {
    setStats(prev => {
      const newPlayerStats = { ...prev.playerStats };
      if (!newPlayerStats[loserOrDrinker]) newPlayerStats[loserOrDrinker] = { drinks: 0 };
      newPlayerStats[loserOrDrinker].drinks += 1;
      if (secondDrinker) {
        if (!newPlayerStats[secondDrinker]) newPlayerStats[secondDrinker] = { drinks: 0 };
        newPlayerStats[secondDrinker].drinks += 1;
      }
      return {
        ...prev,
        jaegerRemaining: Math.max(0, prev.jaegerRemaining - jaegerCount),
        playerStats: newPlayerStats,
        rounds: [...prev.rounds, {
          round: prev.rounds.length + 1,
          master: gameState.master!,
          deer1: d1,
          deer2: d2,
          loser: loserOrDrinker,
          jaegerConsumed: jaegerCount
        }]
      };
    });
    if (!isJackpot) {
      setGameState(prev => ({ ...prev, phase: 'result' }));
    }
  }, [gameState.master, setStats]);

  const resolveChallengeNormal = useCallback((loser: string) => {
    const { master, deer1, deer2 } = gameState;
    recordDrink(loser, master!, deer1!, deer2!, 2);
  }, [gameState, recordDrink]);

  const resolveChallengeDoppel = useCallback((winner: string) => {
    const { master, deer1, deer2 } = gameState;
    const otherDeer = deer1 === master ? deer2! : deer1!;
    if (winner === master) {
      // Master gewinnt → otherDeer ist Verlierer, beide trinken
      recordDrink(otherDeer, master!, deer1!, deer2!, 2);
    } else {
      // Master verliert → nur Master trinkt
      recordDrink(master!, null, deer1!, deer2!, 1);
    }
  }, [gameState, recordDrink]);

  const resetRound = useCallback(() => {
    setGameState({ phase: 'idle', master: null, deer1: null, deer2: null, isDoppel: false, isDreifach: false });
  }, []);

  const resetAll = useCallback(() => {
    setStats({ totalJaeger: 40, jaegerRemaining: 40, playerStats: {}, rounds: [] });
    resetRound();
  }, [setStats, resetRound]);

  return {
    players, activePlayers, addPlayer, removePlayer, togglePlayer,
    gameState, startSpin, revealMaster, startDeerSpin, revealDeers, resolveChallengeNormal, resolveChallengeDoppel, resetRound,
    stats, resetAll, pickRandom
  };
}
