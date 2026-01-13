import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Index from "./pages/Index";
import About from "./pages/About";
import BookPage from "./pages/BookPage";
import BookLibrary from "./pages/BookLibrary";
import BookSearch from "./pages/BookSearch";
import BookReader from "./pages/BookReader";
import HorizonRedirect from "./pages/HorizonRedirect";
import LovableRedirect from "./pages/LovableRedirect";
import AdRedirect from "./pages/AdRedirect";
import DonateRedirect from "./pages/DonateRedirect";
import Support from "./pages/Support";
import ImageGen from "./pages/ImageGen";
import MCQGen from "./pages/MCQGen";
import FlashcardGen from "./pages/FlashcardGen";
import YoutubeExplain from "./pages/YoutubeExplain";
import NotesShare from "./pages/NotesShare";
import ViewNote from "./pages/ViewNote";
import Grammify from "./pages/Grammify";
import Owner from "./pages/Owner";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Install from "./pages/Install";
import { getCursorPreference } from "./lib/storage";
import { useCursorEffects } from "./hooks/useCursorEffects";

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
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/c/:chatId" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/book/library" element={<BookLibrary />} />
          <Route path="/book/search" element={<BookSearch />} />
          <Route path="/book/read/:bookTitle" element={<BookReader />} />
          <Route path="/image-gen" element={<ImageGen />} />
          <Route path="/mcq-gen" element={<MCQGen />} />
          <Route path="/flashcard-gen" element={<FlashcardGen />} />
          <Route path="/youtube-explain" element={<YoutubeExplain />} />
          <Route path="/notes-share" element={<NotesShare />} />
          <Route path="/notes/:slug" element={<ViewNote />} />
          <Route path="/grammify" element={<Grammify />} />
          <Route path="/owner" element={<Owner />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/install" element={<Install />} />
          <Route path="/horizon" element={<HorizonRedirect />} />
          <Route path="/lovable" element={<LovableRedirect />} />
          <Route path="/ad" element={<AdRedirect />} />
          <Route path="/donate" element={<DonateRedirect />} />
          <Route path="/support" element={<Support />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Analytics />
      <SpeedInsights />
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
