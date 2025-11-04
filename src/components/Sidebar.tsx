import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, MessageSquare, X } from 'lucide-react';
import { getAllChats, truncateTitle, type ChatSession } from '@/lib/storage';
import UsageBanner from '@/components/UsageBanner';

interface SidebarProps {
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ currentChatId, onNewChat, onSelectChat, isOpen = true, onClose }: SidebarProps) => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChats();
  }, [currentChatId]);

  const loadChats = () => {
    setChats(getAllChats());
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatSelect = (chatId: string) => {
    onSelectChat(chatId);
    onClose?.(); // Close sidebar on mobile after selecting a chat
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        flex flex-col border-r border-border bg-card
        fixed md:relative inset-y-0 left-0 z-50
        w-80 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 md:hidden border-b border-border">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
        <UsageBanner />
        
        <Button
          onClick={onNewChat}
          className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search Chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleChatSelect(chat.id)}
              className={`
                w-full rounded-lg px-4 py-3 text-left transition-colors
                ${currentChatId === chat.id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <MessageSquare className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {truncateTitle(chat.title)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(chat.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </aside>
    </>
  );
};

export default Sidebar;
