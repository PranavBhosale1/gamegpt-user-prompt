import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { Puzzle } from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/challenge');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 pb-24">
            {children}
          </main>
        </div>
 <footer className="fixed bottom-0 right-0 left-72 z-50 px-6 pb-4 bg-background/80 backdrop-blur-md border-t border-border/50">
      <div className="flex justify-center">
        <button
          onClick={handleClick}
          className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg transition-transform duration-200 hover:scale-105"
        >
          {/* <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center">
            <PsychologistIcon className="w-6 h-6 text-white" />
          </div> */}
          <span className="font-semibold">Daily Challenges</span>
        </button>
      </div>
    </footer>




      </div>
    </SidebarProvider>
  );
}
