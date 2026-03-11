import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  timestamp: number;
}

export interface Stats {
  totalJaeger: number;
  jaegerRemaining: number;
  playerStats: Record<string, { drinks: number }>;
  rounds: RoundLog[];
}

export function useGameState() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    phase: 'idle', master: null, deer1: null, deer2: null, isDoppel: false, isDreifach: false
  });
  const [stats, setStats] = useState<Stats>({
    totalJaeger: 40, jaegerRemaining: 40, playerStats: {}, rounds: []
  });
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('hj_admin') === 'true');
  const [loading, setLoading] = useState(true);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // --- FETCH ALL DATA ---
  const fetchAll = useCallback(async () => {
    const [configRes, playersRes, roundsRes, drinksRes] = await Promise.all([
      supabase.from('game_config').select('*').eq('id', 'main').maybeSingle(),
      supabase.from('players').select('*').order('created_at', { ascending: true }),
      supabase.from('rounds').select('*').order('round_number', { ascending: true }),
      supabase.from('player_drinks').select('*'),
    ]);

    if (playersRes.data) {
      setPlayers(playersRes.data.map(p => ({ id: p.id, name: p.name, active: p.active })));
    }

    const playerStats: Record<string, { drinks: number }> = {};
    if (drinksRes.data) {
      for (const d of drinksRes.data) {
        playerStats[d.name] = { drinks: d.drinks };
      }
    }

    const rounds: RoundLog[] = (roundsRes.data || []).map(r => ({
      round: r.round_number,
      master: r.master,
      deer1: r.deer1,
      deer2: r.deer2,
      loser: r.loser,
      jaegerConsumed: r.jaeger_consumed,
      timestamp: new Date(r.created_at || '').getTime(),
    }));

    const config = configRes.data;
    setStats({
      totalJaeger: config?.total_jaeger ?? 40,
      jaegerRemaining: config?.jaeger_remaining ?? 40,
      playerStats,
      rounds,
    });

    setLoading(false);
  }, []);

  // --- INITIAL LOAD + REALTIME ---
  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel('hirschjagd-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_config' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_drinks' }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  // --- ADMIN ---
  const checkPin = useCallback(async (pin: string): Promise<boolean> => {
    const { data } = await supabase.from('game_config').select('admin_pin').eq('id', 'main').maybeSingle();
    const correct = data?.admin_pin === pin;
    if (correct) {
      setIsAdmin(true);
      localStorage.setItem('hj_admin', 'true');
    }
    return correct;
  }, []);

  const logout = useCallback(() => {
    setIsAdmin(false);
    localStorage.removeItem('hj_admin');
  }, []);

  // --- PLAYER ACTIONS ---
  const addPlayer = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await supabase.from('players').insert({ name: trimmed, active: true });
    await supabase.from('player_drinks').upsert({ name: trimmed, drinks: 0 }, { onConflict: 'name' });
  }, []);

  const removePlayer = useCallback(async (id: string) => {
    await supabase.from('players').delete().eq('id', id);
  }, []);

  const togglePlayer = useCallback(async (id: string) => {
    const player = players.find(p => p.id === id);
    if (!player) return;
    await supabase.from('players').update({ active: !player.active }).eq('id', id);
  }, [players]);

  const activePlayers = players.filter(p => p.active);

  const pickRandom = useCallback(() => {
    const pool = activePlayers;
    return pool[Math.floor(Math.random() * pool.length)]?.name || '';
  }, [activePlayers]);

  // --- GAME ACTIONS (local state) ---
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

  // --- RECORD DRINK (Supabase) ---
  const recordDrink = useCallback(async (
    loserOrDrinker: string, secondDrinker: string | null,
    d1: string, d2: string, jaegerCount: number, isJackpot = false
  ) => {
    const currentGS = gameStateRef.current;
    const master = currentGS.master!;

    // 1. Insert round
    const { data: roundsData } = await supabase.from('rounds').select('round_number').order('round_number', { ascending: false }).limit(1);
    const nextRound = (roundsData?.[0]?.round_number ?? 0) + 1;

    await supabase.from('rounds').insert({
      round_number: nextRound,
      master,
      deer1: d1,
      deer2: d2,
      loser: loserOrDrinker,
      second_drinker: secondDrinker,
      jaeger_consumed: jaegerCount,
    });

    // 2. Decrement jaeger_remaining
    const { data: config } = await supabase.from('game_config').select('jaeger_remaining').eq('id', 'main').maybeSingle();
    const newRemaining = Math.max(0, (config?.jaeger_remaining ?? 40) - jaegerCount);
    await supabase.from('game_config').update({ jaeger_remaining: newRemaining }).eq('id', 'main');

    // 3. Update player_drinks
    const drinkers = [loserOrDrinker];
    if (secondDrinker) drinkers.push(secondDrinker);
    for (const drinker of drinkers) {
      const { data: existing } = await supabase.from('player_drinks').select('drinks').eq('name', drinker).maybeSingle();
      const current = existing?.drinks ?? 0;
      await supabase.from('player_drinks').upsert({ name: drinker, drinks: current + 1 }, { onConflict: 'name' });
    }

    if (!isJackpot) {
      setGameState(prev => ({ ...prev, phase: 'result' }));
    }
  }, []);

  const revealDeers = useCallback((d1: string, d2: string) => {
    const master = gameStateRef.current.master!;
    const isDreifach = master === d1 && master === d2;
    const isDoppel = !isDreifach && (master === d1 || master === d2);
    const isSameDeer = !isDreifach && !isDoppel && d1 === d2;

    if (isDreifach) {
      setGameState(prev => ({ ...prev, phase: 'result', deer1: d1, deer2: d2, isDoppel: false, isDreifach: true }));
      recordDrink(master, null, d1, d2, 1, true);
    } else if (isSameDeer) {
      setGameState(prev => ({ ...prev, phase: 'result', deer1: d1, deer2: d2, isDoppel: false, isDreifach: false }));
      recordDrink(d1, master, d1, d2, 2, true);
    } else {
      setGameState(prev => ({ ...prev, phase: 'challenge_input', deer1: d1, deer2: d2, isDoppel, isDreifach: false }));
    }
  }, [recordDrink]);

  const resolveChallengeNormal = useCallback((loser: string) => {
    const { master, deer1, deer2 } = gameStateRef.current;
    recordDrink(loser, master!, deer1!, deer2!, 2);
  }, [recordDrink]);

  const resolveChallengeDoppel = useCallback((loser: string) => {
    const { master, deer1, deer2 } = gameStateRef.current;
    const otherDeer = deer1 === master ? deer2! : deer1!;
    if (loser === master) {
      recordDrink(master!, null, deer1!, deer2!, 1);
    } else {
      recordDrink(otherDeer, master!, deer1!, deer2!, 2);
    }
  }, [recordDrink]);

  const resetRound = useCallback(() => {
    setGameState({ phase: 'idle', master: null, deer1: null, deer2: null, isDoppel: false, isDreifach: false });
  }, []);

  // --- DELETE ROUND ---
  const deleteRound = useCallback(async (roundNumber: number) => {
    // Find the round to delete
    const { data: roundData } = await supabase.from('rounds').select('*').eq('round_number', roundNumber).maybeSingle();
    if (!roundData) return;

    // Delete the round
    await supabase.from('rounds').delete().eq('round_number', roundNumber);

    // Increment jaeger_remaining
    const { data: config } = await supabase.from('game_config').select('jaeger_remaining').eq('id', 'main').maybeSingle();
    const newRemaining = Math.min(
      (config?.jaeger_remaining ?? 0) + roundData.jaeger_consumed,
      40
    );
    await supabase.from('game_config').update({ jaeger_remaining: newRemaining }).eq('id', 'main');

    // Decrement player_drinks for involved drinkers
    const drinkers: (string | null)[] = [roundData.loser, roundData.second_drinker];
    for (const drinker of drinkers) {
      if (!drinker) continue;
      const { data: existing } = await supabase.from('player_drinks').select('drinks').eq('name', drinker).maybeSingle();
      const current = existing?.drinks ?? 0;
      await supabase.from('player_drinks').update({ drinks: Math.max(0, current - 1) }).eq('name', drinker);
    }

    // Renumber remaining rounds
    const { data: remaining } = await supabase.from('rounds').select('id, round_number').order('round_number', { ascending: true });
    if (remaining) {
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].round_number !== i + 1) {
          await supabase.from('rounds').update({ round_number: i + 1 }).eq('id', remaining[i].id);
        }
      }
    }
  }, []);

  // --- RESET ALL ---
  const resetAll = useCallback(async () => {
    await supabase.from('rounds').delete().neq('round_number', -1); // delete all
    await supabase.from('player_drinks').update({ drinks: 0 }).neq('name', ''); // reset all
    await supabase.from('game_config').update({ jaeger_remaining: 40 }).eq('id', 'main');
    resetRound();
  }, [resetRound]);

  return {
    players, activePlayers, addPlayer, removePlayer, togglePlayer,
    gameState, startSpin, revealMaster, startDeerSpin, revealDeers,
    resolveChallengeNormal, resolveChallengeDoppel, resetRound,
    stats, resetAll, deleteRound, pickRandom,
    isAdmin, checkPin, logout, loading
  };
}
