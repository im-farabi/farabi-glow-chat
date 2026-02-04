import { useState, useEffect, useMemo } from "react";
import { BookOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBookUserProfile } from "@/lib/bookStorage";
import BookRecommendations from "./BookRecommendations";
import BookLibrarySection from "./BookLibrarySection";
import BookSearchSection from "./BookSearchSection";

const BookDashboard = () => {
  const [userName, setUserName] = useState("Reader");

  useEffect(() => {
    const profile = getBookUserProfile();
    if (profile?.name) {
      setUserName(profile.name);
    }
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-orange-400" />
            </div>
            <span className="font-bold text-white">
              Read<span className="text-orange-400">ME</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-6 py-6 max-w-6xl mx-auto w-full space-y-8">
        {/* Greeting */}
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {greeting}, <span className="text-orange-400">{userName}</span>! 👋
          </h1>
          <p className="text-white/50 text-sm mt-1">What will you read today?</p>
        </div>

        {/* Recommendations Section */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <BookRecommendations />
        </div>

        {/* Library Section */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <BookLibrarySection />
        </div>

        {/* Search Section */}
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <BookSearchSection />
        </div>
      </main>

      {/* Bottom branding */}
      <footer className="py-4 text-center">
        <p className="text-white/20 text-xs">
          ReadME by FARABI
        </p>
      </footer>
    </div>
  );
};

export default BookDashboard;
