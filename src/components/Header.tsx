import { Menu, MessageSquareDashed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeaderProps {
  onMenuClick?: () => void;
  isTemporaryChat?: boolean;
  onToggleTemporaryChat?: () => void;
}

const Header = ({ onMenuClick, isTemporaryChat, onToggleTemporaryChat }: HeaderProps) => {
  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl h-14">
      <div className="flex items-center justify-between px-4 h-full">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden hover:bg-accent/50"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="text-center flex-1 md:flex-none">
          <h1 className="text-xl md:text-2xl font-bold">
            <span className="text-foreground">FARABI</span>
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">.me</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isTemporaryChat ? "default" : "ghost"}
                  size="icon"
                  onClick={onToggleTemporaryChat}
                  className={isTemporaryChat ? "bg-gradient-to-r from-primary to-secondary hover:opacity-90" : "hover:bg-accent/50"}
                  aria-label="Toggle temporary chat"
                >
                  <MessageSquareDashed className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isTemporaryChat ? 'Temporary mode active - chats won\'t be saved' : 'Enable temporary chat mode'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
};

export default Header;
