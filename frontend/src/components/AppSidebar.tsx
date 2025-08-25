import { useState } from "react";
import { 
  Brain, 
  BarChart3, 
  Users, 
  FileText, 
  AlertTriangle,
  Target,
  Heart
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const isLoggedIn = !!localStorage.getItem('userId');

  const menuItems = isLoggedIn ? [
    { 
      title: "Challenge Game", 
      url: "/challenge", 
      icon: Target, 
      description: "Interactive behavioral challenges",
      color: "text-emerald-600"
    },
    { 
      title: "Emotion Dashboard", 
      url: "/emotions", 
      icon: BarChart3, 
      description: "Visualize emotional trends",
      color: "text-blue-600"
    },
    { 
      title: "Connect to a Therapist", 
      url: "/journal", 
      icon: Users, 
      description: "Professional mental health support",
      color: "text-purple-600"
    },
    { 
      title: "Behavioral Reports", 
      url: "/reports", 
      icon: FileText, 
      description: "Assessment summaries",
      color: "text-orange-600"
    },
    { 
      title: "Immediate Help", 
      url: "/companion", 
      icon: AlertTriangle, 
      description: "Emergency mental wellness support",
      color: "text-red-600"
    },
  ] : [
    { 
      title: "Challenge Game", 
      url: "/challenge", 
      icon: Target, 
      description: "Interactive behavioral challenges",
      color: "text-emerald-600"
    },
    // { 
    //   title: "Connect to a Therapist", 
    //   url: "/journal", 
    //   icon: Users, 
    //   description: "Professional mental health support",
    //   color: "text-purple-600"
    // },
  ];

  const isActive = (path: string) => currentPath === path;
  const getNavClass = (path: string) =>
    isActive(path) 
      ? "bg-primary-soft text-primary font-medium shadow-soft" 
      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar
      className={`transition-all duration-300 ${collapsed ? "w-16" : "w-72"} border-r border-border/50 bg-gradient-warm backdrop-blur-sm`}
      collapsible="icon"
    >
      <SidebarContent className="p-2">
        {/* App branding */}
        <div className={`mb-4 px-3 ${collapsed ? "text-center" : ""}`}>
          <NavLink to="/index" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform cursor-pointer">
              <Heart className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">MantraMinds</h2>
                <p className="text-xs text-muted-foreground">Assessment Hub</p>
              </div>
            )}
          </NavLink>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-auto p-0">
                    <NavLink 
                      to={item.url}
                      className={`flex items-center p-3 rounded-lg transition-all duration-200 ${getNavClass(item.url)} group`}
                      onClick={e => {
                        // if (!isLoggedIn) {
                        //   e.preventDefault();
                        //   navigate('/login');
                        // }
                        //else normal NavLink
                      }}
                    >
                      <item.icon 
                        className={`h-5 w-5 ${item.color} group-hover:scale-110 transition-transform`} 
                      />
                      {!collapsed && (
                        <div className="ml-3 flex-1">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom section */}
        {!collapsed && (
          <div className="mt-auto p-4 bg-gradient-calm rounded-lg mx-2 mb-2">
            <div className="text-center">
              <Brain className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">
                Your Journey Matters
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Every step toward self-awareness is progress
              </p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
