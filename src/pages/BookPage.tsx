import { useState, useEffect } from "react";
import { isBookSetupComplete } from "@/lib/bookStorage";
import BookSetup from "@/components/book/BookSetup";
import BookHome from "@/components/book/BookHome";

const BookPage = () => {
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    setSetupComplete(isBookSetupComplete());
  }, []);

  // Loading state
  if (setupComplete === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return setupComplete ? (
    <BookHome />
  ) : (
    <BookSetup onComplete={() => setSetupComplete(true)} />
  );
};

export default BookPage;
