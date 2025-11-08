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
import HorizonRedirect from "./pages/HorizonRedirect";
import LovableRedirect from "./pages/LovableRedirect";
import AdRedirect from "./pages/AdRedirect";
import ImageGen from "./pages/ImageGen";
import NotFound from "./pages/NotFound";
import { getCursorPreference } from "./lib/storage";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const cursorType = getCursorPreference();
    document.body.classList.add(`cursor-${cursorType}`);
  }, []);

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
          <Route path="/image-gen" element={<ImageGen />} />
          <Route path="/horizon" element={<HorizonRedirect />} />
          <Route path="/lovable" element={<LovableRedirect />} />
          <Route path="/ad" element={<AdRedirect />} />
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
