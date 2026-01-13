import { useState, useEffect } from "react";
import { isBookSetupComplete } from "@/lib/bookStorage";
import BookIntro from "@/components/book/BookIntro";
import BookSetup from "@/components/book/BookSetup";
import BookHome from "@/components/book/BookHome";

type BookStage = 'loading' | 'intro' | 'setup' | 'home';

const BookPage = () => {
  const [stage, setStage] = useState<BookStage>('loading');

  useEffect(() => {
    const isComplete = isBookSetupComplete();
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
    return <BookIntro onStart={() => setStage('setup')} />;
  }

  // Setup flow
  if (stage === 'setup') {
    return <BookSetup onComplete={() => setStage('home')} />;
  }

  // Home
  return <BookHome />;
};

export default BookPage;
