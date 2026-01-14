import { useState, useEffect } from "react";
import { isNewsSetupComplete } from "@/lib/newsStorage";
import NewsIntro from "@/components/news/NewsIntro";
import NewsSetup from "@/components/news/NewsSetup";
import NewsHome from "@/components/news/NewsHome";

type NewsStage = 'loading' | 'intro' | 'setup' | 'home';

const NewsPage = () => {
  const [stage, setStage] = useState<NewsStage>('loading');

  useEffect(() => {
    const isComplete = isNewsSetupComplete();
    setStage(isComplete ? 'home' : 'intro');
  }, []);

  // Loading state
  if (stage === 'loading') {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Intro screen
  if (stage === 'intro') {
    return <NewsIntro onStart={() => setStage('setup')} />;
  }

  // Setup flow
  if (stage === 'setup') {
    return <NewsSetup onComplete={() => setStage('home')} />;
  }

  // Home
  return <NewsHome />;
};

export default NewsPage;
