-- game_config: singleton row for global settings
CREATE TABLE public.game_config (
  id text PRIMARY KEY DEFAULT 'main',
  admin_pin text NOT NULL DEFAULT '1234',
  total_jaeger integer NOT NULL DEFAULT 40,
  jaeger_remaining integer NOT NULL DEFAULT 40,
  created_at timestamptz DEFAULT now()
);

INSERT INTO public.game_config (id, admin_pin) VALUES ('main', '1234');

ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on game_config" ON public.game_config FOR ALL USING (true) WITH CHECK (true);

-- players table
CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on players" ON public.players FOR ALL USING (true) WITH CHECK (true);

-- rounds table
CREATE TABLE public.rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number integer NOT NULL,
  master text NOT NULL,
  deer1 text NOT NULL,
  deer2 text NOT NULL,
  loser text,
  second_drinker text,
  jaeger_consumed integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on rounds" ON public.rounds FOR ALL USING (true) WITH CHECK (true);

-- player_drinks: denormalized drink counts
CREATE TABLE public.player_drinks (
  name text PRIMARY KEY,
  drinks integer NOT NULL DEFAULT 0
);

ALTER TABLE public.player_drinks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on player_drinks" ON public.player_drinks FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_drinks;