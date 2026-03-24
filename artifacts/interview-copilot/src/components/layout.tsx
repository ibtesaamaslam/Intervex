import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  MessageSquarePlus, 
  Zap,
  Menu,
  X,
  BookOpen
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/session/new", label: "New Session", icon: MessageSquarePlus },
    { href: "/playbook", label: "Playbook", icon: BookOpen },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-xl border-r border-border">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-foreground">
          Inter<span className="text-primary">vex</span>
        </span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group relative overflow-hidden",
                isActive 
                  ? "bg-primary/10 text-primary font-semibold border border-primary/20" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
              )}>
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute inset-0 bg-primary/5 -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 h-screen sticky top-0 z-40">
        <Sidebar />
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-display font-bold">Inter<span className="text-primary">vex</span></span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-foreground">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 z-50 md:hidden"
            >
              <Sidebar />
              <button 
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto pt-16 md:pt-0 relative">
        <div className="fixed top-0 right-0 w-1/2 h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none opacity-50" />
        <div className="fixed bottom-0 left-1/4 w-1/2 h-[400px] bg-accent/5 rounded-full blur-[100px] -z-10 pointer-events-none opacity-50" />
        
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
