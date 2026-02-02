import { DollarSign, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWebGenAuth } from '@/hooks/useWebGenAuth';

const CreditsDisplay = () => {
  const { user, credits, signOut } = useWebGenAuth();

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url;
  const userName = user.user_metadata?.user_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
  const initials = userName.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Credits badge */}
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full px-3 py-1.5">
        <DollarSign className="w-4 h-4 text-green-400" />
        <span className="text-green-400 font-bold text-sm">
          {credits.toFixed(2)}
        </span>
      </div>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-white/10">
            <Avatar className="w-8 h-8">
              <AvatarImage src={avatarUrl} alt={userName} />
              <AvatarFallback className="bg-purple-600 text-white text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-black/90 border-white/10 backdrop-blur-xl">
          <div className="px-3 py-2">
            <p className="text-white font-medium text-sm">{userName}</p>
            <p className="text-gray-400 text-xs truncate">{user.email}</p>
          </div>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CreditsDisplay;
