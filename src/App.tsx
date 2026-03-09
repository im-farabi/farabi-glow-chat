import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import BookPage from "./pages/BookPage";
import OldBookPage from "./pages/OldBookPage";
import NewsPage from "./pages/NewsPage";
import NewsCategory from "./pages/NewsCategory";
import NewsArticles from "./pages/NewsArticles";
import BookLibrary from "./pages/BookLibrary";
import BookSearch from "./pages/BookSearch";
import BookReader from "./pages/BookReader";
import NotesPage from "./pages/NotesPage";
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
import VideoGen from "./pages/VideoGen";
import Owner from "./pages/Owner";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Install from "./pages/Install";
import NewPage from "./pages/NewPage";
import NewChat from "./pages/NewChat";
import NewImage from "./pages/NewImage";
import NewVideo from "./pages/NewVideo";
import MailPage from "./pages/MailPage";
import WebGen from "./pages/WebGen";
import Study from "./pages/Study";
import SiteView from "./pages/SiteView";
import ComicGen from "./pages/ComicGen";
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
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/c/:chatId" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/book" element={<BookPage />} />
            <Route path="/oldbook" element={<OldBookPage />} />
            <Route path="/book/library" element={<BookLibrary />} />
            <Route path="/book/search" element={<BookSearch />} />
            <Route path="/book/read/:bookTitle" element={<BookReader />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/category/:categoryId" element={<NewsCategory />} />
            <Route path="/news/articles/:categoryId/:timeFilter" element={<NewsArticles />} />
            <Route path="/image-gen" element={<ImageGen />} />
            <Route path="/mcq-gen" element={<MCQGen />} />
            <Route path="/flashcard-gen" element={<FlashcardGen />} />
            <Route path="/youtube-explain" element={<YoutubeExplain />} />
            <Route path="/notes-share" element={<NotesShare />} />
            <Route path="/notes/:slug" element={<ViewNote />} />
            <Route path="/grammify" element={<Grammify />} />
            <Route path="/video-gen" element={<VideoGen />} />
            <Route path="/owner" element={<Owner />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/install" element={<Install />} />
            <Route path="/new" element={<NewPage />} />
            <Route path="/new/chat" element={<NewChat />} />
            <Route path="/new/image" element={<NewImage />} />
            <Route path="/new/video" element={<NewVideo />} />
            <Route path="/horizon" element={<HorizonRedirect />} />
            <Route path="/lovable" element={<LovableRedirect />} />
            <Route path="/ad" element={<AdRedirect />} />
            <Route path="/donate" element={<DonateRedirect />} />
            <Route path="/mail" element={<MailPage />} />
            <Route path="/web" element={<WebGen />} />
            <Route path="/site/*" element={<SiteView />} />
            <Route path="/study" element={<Study />} />
            <Route path="/support" element={<Support />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Analytics />
        <SpeedInsights />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
