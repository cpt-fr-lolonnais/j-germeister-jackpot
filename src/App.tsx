import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import BanditPage from "@/pages/BanditPage";
import PlayersPage from "@/pages/PlayersPage";
import StatsPage from "@/pages/StatsPage";
import NotFound from "./pages/NotFound";
import { useGameState } from "@/hooks/useGameState";

const AppContent = () => {
  const gs = useGameState();

  return (
    <>
      <Toaster />
      <Sonner />
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={
            <BanditPage
              activePlayers={gs.activePlayers}
              gameState={gs.gameState}
              stats={gs.stats}
              startSpin={gs.startSpin}
              revealMaster={gs.revealMaster}
              startDeerSpin={gs.startDeerSpin}
              revealDeers={gs.revealDeers}
              resolveChallengeNormal={gs.resolveChallengeNormal}
              resolveChallengeDoppel={gs.resolveChallengeDoppel}
              resetRound={gs.resetRound}
              pickRandom={gs.pickRandom}
            />
          } />
          <Route path="/players" element={
            <PlayersPage
              players={gs.players}
              addPlayer={gs.addPlayer}
              removePlayer={gs.removePlayer}
              togglePlayer={gs.togglePlayer}
            />
          } />
          <Route path="/stats" element={
            <StatsPage stats={gs.stats} resetAll={gs.resetAll} deleteRound={gs.deleteRound} />
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <BottomNav />
    </>
  );
};

const App = () => (
  <TooltipProvider>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
