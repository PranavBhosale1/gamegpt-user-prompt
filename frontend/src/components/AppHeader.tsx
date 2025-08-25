import { useNavigate } from 'react-router-dom';
import {
  User,
  Settings,
  Menu,
  Bell,
  Heart,
  LogOut,
  UserCheck,
} from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function AppHeader() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("userId");
  const fullname = localStorage.getItem('fullname') || '';
  const initials = fullname.trim().split(/\s+/).map(x => x[0]?.toUpperCase()).join('').slice(0,2);

  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="p-2 hover:bg-accent/50 rounded-lg transition-colors" />

          {collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center shadow-soft">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-lg text-foreground">
                  MantraMinds
                </h1>
              </div>
            </div>
          )}
        </div>

        {/* Center section */}
        <div className="hidden md:flex items-center gap-2 bg-gradient-warm px-4 py-2 rounded-full shadow-soft">
          <UserCheck className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Assessment Progress
          </span>
          <Badge variant="secondary" className="bg-primary-soft text-primary" />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {!isLoggedIn ? (
            <Button 
              variant="outline"
              className="px-5 font-semibold"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                    <AvatarFallback  className="bg-gradient-hero  font-semibold" >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium">{fullname}</p>
                  <p className="text-xs text-muted-foreground">
                    {localStorage.getItem('email')}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
