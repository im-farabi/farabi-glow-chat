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
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2 md:py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="text-center flex-1 md:flex-none">
          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="text-white">
              FARABI
            </span>
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">.me</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isTemporaryChat ? "default" : "ghost"}
                  size="icon"
                  onClick={onToggleTemporaryChat}
                  className={isTemporaryChat ? "bg-gradient-to-r from-primary to-secondary" : ""}
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
