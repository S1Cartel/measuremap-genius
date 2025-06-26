
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MapPin, LogOut, User, Settings, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <nav className="bg-black/90 backdrop-blur-md border-b border-violet-500/30 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              GeoMeasure Pro
            </h1>
            <p className="text-xs text-gray-400">Professional Mapping Platform</p>
          </div>
          <div className="ml-4 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-full">
            <div className="flex items-center gap-1">
              <Crown className="h-3 w-3 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">Premium</span>
            </div>
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-white font-medium">
                {user.user_metadata?.full_name || user.email}
              </p>
              <p className="text-xs text-gray-400">Professional Account</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-violet-500/50">
                    <AvatarFallback className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                      {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-900 border-violet-500/30" align="end">
                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-violet-600/20">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-violet-600/20">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-red-400 hover:text-red-300 hover:bg-red-600/20"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            Sign In
          </Button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
