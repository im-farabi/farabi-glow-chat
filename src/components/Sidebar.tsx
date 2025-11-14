import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, MessageSquare, X, MoreVertical, Edit2, Trash2, FileEdit, User, Settings, Image, BookCheck, SquareStack, Volume2, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAllChats, truncateTitle, deleteChat, renameChat, getUserPreferences, type ChatSession } from '@/lib/storage';
import UsageBanner from '@/components/UsageBanner';
import MonthlyBalanceBanner from '@/components/MonthlyBalanceBanner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import SettingsDialog from '@/components/SettingsDialog';
interface SidebarProps {
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}
const Sidebar = ({
  currentChatId,
  onNewChat,
  onSelectChat,
  isOpen = true,
  onClose
}: SidebarProps) => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const {
    toast
  } = useToast();
  const preferences = getUserPreferences();
  const username = preferences.name.trim() || 'Anonymous';
  useEffect(() => {
    loadChats();
  }, [currentChatId]);
  const loadChats = () => {
    setChats(getAllChats());
  };
  const filteredChats = chats.filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const handleChatSelect = (chatId: string) => {
    onSelectChat(chatId);
    onClose?.(); // Close sidebar on mobile after selecting a chat
  };
  const handleRename = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setSelectedChatId(chatId);
      setNewTitle(chat.title);
      setRenameDialogOpen(true);
    }
  };
  const handleRenameConfirm = () => {
    if (selectedChatId && newTitle.trim()) {
      renameChat(selectedChatId, newTitle.trim());
      loadChats();
      setRenameDialogOpen(false);
      toast({
        title: "Renamed!",
        description: "Chat renamed successfully"
      });
    }
  };
  const handleDelete = (chatId: string) => {
    deleteChat(chatId);
    loadChats();
    if (currentChatId === chatId) {
      onNewChat();
    }
    toast({
      title: "Deleted!",
      description: "Chat deleted successfully"
    });
  };
  const handleEdit = (chatId: string) => {
    onSelectChat(chatId);
    onClose?.();
  };
  return <>
      {/* Mobile backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}

      <aside className={`
        flex flex-col border-r border-border bg-card
        fixed md:relative inset-y-0 left-0 z-50
        w-80 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 md:hidden border-b border-border">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
        
        <UsageBanner />
        
        <Button onClick={onNewChat} className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>

        <Link to="/image-gen" className="block">
          <Button variant="outline" className="w-full justify-start">
            <Image className="mr-2 h-4 w-4" />
            Image Generator
          </Button>
        </Link>

        <Link to="/mcq-gen" className="block">
          <Button variant="outline" className="w-full justify-start">
            <BookCheck className="mr-2 h-4 w-4" />
            MCQ Generator
          </Button>
        </Link>

        <Link to="/flashcard-gen" className="block">
          <Button variant="outline" className="w-full justify-start">
            <SquareStack className="mr-2 h-4 w-4" />
            Flashcard Generator
          </Button>
        </Link>

        <Link to="/web-gen" className="block">
          <Button variant="outline" className="w-full justify-start">
            <Globe className="mr-2 h-4 w-4" />
            Website Generator
          </Button>
        </Link>

        <Link to="/voice-explain" className="block"
>
          
        </Link>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search Chats" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {filteredChats.map(chat => <div key={chat.id} className={`
                group relative w-full rounded-lg transition-colors
                ${currentChatId === chat.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}
              `}>
              <button onClick={() => handleChatSelect(chat.id)} className="w-full px-4 py-3 text-left">
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
              
              <div className="absolute right-2 top-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleRename(chat.id)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(chat.id)}>
                      <FileEdit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(chat.id)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>)}
        </div>
      </ScrollArea>

      {/* User Profile Section */}
      <div className="p-4 border-t border-border">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => setSettingsOpen(true)}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">Welcome {username}!</p>
            <p className="text-xs text-muted-foreground">Customize the AI</p>
          </div>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Enter new title" onKeyDown={e => {
            if (e.key === 'Enter') {
              handleRenameConfirm();
            }
          }} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameConfirm}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </aside>
    </>;
};
export default Sidebar;