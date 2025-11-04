import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-4 md:justify-center md:py-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              FARABI
            </span>
            <span className="text-muted-foreground/50">.me</span>
          </h1>
          <p className="mt-1 md:mt-2 text-xs md:text-sm text-muted-foreground">
            Let's start chatting
          </p>
        </div>

        {/* Spacer for mobile to keep title centered */}
        <div className="w-10 md:hidden" />
      </div>
    </header>
  );
};

export default Header;
