import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2 md:justify-center md:py-3">
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
            <span className="text-white">
              FARABI
            </span>
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">.me</span>
          </h1>
        </div>

        {/* Spacer for mobile to keep title centered */}
        <div className="w-10 md:hidden" />
      </div>
    </header>
  );
};

export default Header;
