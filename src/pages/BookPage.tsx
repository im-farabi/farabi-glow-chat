import { useState, useEffect } from "react";
import { isBookSetupComplete, saveBookUserProfile, getBookUserProfile } from "@/lib/bookStorage";
import BookBackground from "@/components/book/BookBackground";
import BookLanding from "@/components/book/BookLanding";
import BookOnboarding from "@/components/book/BookOnboarding";
import BookDashboard from "@/components/book/BookDashboard";

type BookStage = 'loading' | 'landing' | 'onboarding' | 'dashboard';

const BookPage = () => {
  const [stage, setStage] = useState<BookStage>('loading');

  useEffect(() => {
    const isComplete = isBookSetupComplete();
    setStage(isComplete ? 'dashboard' : 'landing');
  }, []);

  const handleStartOnboarding = () => {
    setStage('onboarding');
  };

  const handleCompleteOnboarding = (name: string, age: number) => {
    saveBookUserProfile({
      name,
      age,
      selectedBooks: [],
      interests: ['self-improvement', 'fiction', 'business'],
      isSetupComplete: true,
      createdAt: Date.now()
    });
    setStage('dashboard');
  };

  // Loading state
  if (stage === 'loading') {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center">
        <div className="animate-pulse text-white/50">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black font-poppins">
      <BookBackground />
      
      {stage === 'landing' && (
        <BookLanding onStart={handleStartOnboarding} />
      )}
      
      {stage === 'onboarding' && (
        <BookOnboarding onComplete={handleCompleteOnboarding} />
      )}
      
      {stage === 'dashboard' && (
        <BookDashboard />
      )}
    </div>
  );
};

export default BookPage;
