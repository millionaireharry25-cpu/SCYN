import React from "react";
import { MessageCircle, Phone, FileText, User as UserIcon, Zap } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../components/GlassCard";

interface BottomNavProps {
  activeTab: "chats" | "calls" | "notes" | "profile";
  setActiveTab: (tab: "chats" | "calls" | "notes" | "profile") => void;
}

export const BottomNav = ({ activeTab, setActiveTab }: BottomNavProps) => {
  const tabs = [
    { id: "chats", icon: MessageCircle, label: "Chats" },
    { id: "calls", icon: Phone, label: "Calls" },
    { id: "notes", icon: FileText, label: "Notes" },
    { id: "profile", icon: UserIcon, label: "Profile" },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 md:h-24 bg-black/60 backdrop-blur-3xl border-t border-white/10 flex items-center justify-around px-8 z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "relative flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group",
            activeTab === tab.id 
              ? "text-emerald-400" 
              : "text-slate-500 hover:text-slate-300"
          )}
        >
          <div className={cn(
            "p-3 rounded-2xl transition-all duration-300",
            activeTab === tab.id 
              ? "bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
              : "group-hover:bg-white/5"
          )}>
            <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
          </div>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
            activeTab === tab.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          )}>
            {tab.label}
          </span>
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            />
          )}
        </button>
      ))}
    </div>
  );
};
