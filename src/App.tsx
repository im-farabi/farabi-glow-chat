import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Index from "./pages/Index";
import { getCursorPreference } from "./lib/storage";
import { useCursorEffects } from "./hooks/useCursorEffects";

// Lazy load non-critical routes for better performance
const About = lazy(() => import("./pages/About"));
const HorizonRedirect = lazy(() => import("./pages/HorizonRedirect"));
const LovableRedirect = lazy(() => import("./pages/LovableRedirect"));
const AdRedirect = lazy(() => import("./pages/AdRedirect"));
const DonateRedirect = lazy(() => import("./pages/DonateRedirect"));
const Support = lazy(() => import("./pages/Support"));
const ImageGen = lazy(() => import("./pages/ImageGen"));
const MCQGen = lazy(() => import("./pages/MCQGen"));
const FlashcardGen = lazy(() => import("./pages/FlashcardGen"));
const YoutubeExplain = lazy(() => import("./pages/YoutubeExplain"));
const NotesShare = lazy(() => import("./pages/NotesShare"));
const ViewNote = lazy(() => import("./pages/ViewNote"));
const AIMaker = lazy(() => import("./pages/AIMaker"));
const AIEndpoint = lazy(() => import("./pages/AIEndpoint"));
const Owner = lazy(() => import("./pages/Owner"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));

const queryClient = new QueryClient();

const App = () => {
  // Apply saved cursor preference
  useEffect(() => {
    const savedCursor = getCursorPreference();
    // Filter out cartoony cursor if it was saved previously
    const cursorType = savedCursor === 'cartoony' ? 'default' : savedCursor;
    document.body.classList.add(`cursor-${cursorType}`);
  }, []);

  // Add cursor click effects and sounds
  useCursorEffects();

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/c/:chatId" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/image-gen" element={<ImageGen />} />
            <Route path="/mcq-gen" element={<MCQGen />} />
            <Route path="/flashcard-gen" element={<FlashcardGen />} />
            <Route path="/youtube-explain" element={<YoutubeExplain />} />
            <Route path="/notes-share" element={<NotesShare />} />
            <Route path="/notes/:slug" element={<ViewNote />} />
            <Route path="/ai-maker" element={<AIMaker />} />
            <Route path="/ai/:id/prompt/:prompt" element={<AIEndpoint />} />
            <Route path="/owner" element={<Owner />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/horizon" element={<HorizonRedirect />} />
            <Route path="/lovable" element={<LovableRedirect />} />
            <Route path="/ad" element={<AdRedirect />} />
            <Route path="/donate" element={<DonateRedirect />} />
            <Route path="/support" element={<Support />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Analytics />
      <SpeedInsights />
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
