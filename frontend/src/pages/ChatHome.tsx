import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { ChatInterface } from "@/components/ChatInterface";

export default function ChatHome() {
  // Always render the same structure/layout, just let the content shift based on the user state.
  return (
    <SidebarProvider>
      <div className="w-screen h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex flex-1 min-h-0 min-w-0">
          <AppSidebar />
          {/* 1. Center chat box always for both user and guest */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 items-center justify-center">
            <div className="w-full max-w-2xl flex flex-col flex-1">
              <ChatInterface />
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
