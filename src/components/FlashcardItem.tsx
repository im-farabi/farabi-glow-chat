import { useState } from 'react';
import { Flashcard } from '@/pages/FlashcardGen';

interface FlashcardItemProps {
  card: Flashcard;
  index: number;
  flipMode: 'click' | 'hover';
}

const FlashcardItem = ({ card, index, flipMode }: FlashcardItemProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  const handleInteraction = () => {
    if (flipMode === 'click') {
      setIsFlipped(!isFlipped);
    }
  };
  
  const handleHover = (hover: boolean) => {
    if (flipMode === 'hover') {
      setIsFlipped(hover);
    }
  };
  
  return (
    <div 
      className="flashcard-container relative w-full h-[360px] md:h-[400px] cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={handleInteraction}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
    >
      <div 
        className={`flashcard relative w-full h-full transition-transform duration-[600ms] ${isFlipped ? 'flashcard-flipped' : ''}`}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front face */}
        <div 
          className="absolute inset-0 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10 p-8 md:p-10 flex flex-col justify-between shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex-1 flex items-center justify-center">
            <p className="text-center text-xl md:text-2xl font-medium leading-relaxed px-4">
              {card.question}
            </p>
          </div>
          <div className="text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-xs text-primary font-semibold mb-2">
              Question {index + 1}
            </div>
            <p className="text-xs text-muted-foreground">
              {flipMode === 'click' ? '👆 Click to flip' : '🖱️ Hover to flip'}
            </p>
          </div>
        </div>
        
        {/* Back face */}
        <div 
          className="absolute inset-0 rounded-xl border-2 border-secondary/30 bg-gradient-to-br from-secondary/10 to-accent/10 p-8 md:p-10 flex flex-col justify-between shadow-lg"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="flex-1 flex items-center justify-center">
            <p className="text-center text-xl md:text-2xl leading-relaxed px-4">
              {card.answer}
            </p>
          </div>
          <div className="text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-secondary/20 text-xs text-secondary font-semibold mb-2">
              Answer
            </div>
            <p className="text-xs text-muted-foreground">
              {flipMode === 'click' ? '👆 Click to flip back' : '🖱️ Move away to flip back'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardItem;
