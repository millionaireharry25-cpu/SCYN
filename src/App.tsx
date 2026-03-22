import React, { useEffect, useState } from "react";
import { auth, db, googleProvider } from "./firebase";
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { BottomNav } from "./components/BottomNav";
import { ChatList } from "./components/ChatList";
import { ChatWindow } from "./components/ChatWindow";
import { Notes } from "./components/Notes";
import { CallWindow } from "./components/CallWindow";
import { GlassCard, cn as glassCn } from "./components/GlassCard";
import { LogIn, MessageCircle, Phone, FileText, User as UserIcon, AlertCircle, Monitor, Smartphone, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Chat } from "./types";
import { getDocFromServer } from "firebase/firestore";

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-950 p-6">
          <GlassCard className="max-w-md w-full p-8 text-center space-y-4 border-red-500/50">
            <AlertCircle size={48} className="mx-auto text-red-500" />
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <p className="text-slate-400 text-sm">
              {typeof this.state.error === 'string' ? this.state.error : 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 bg-white text-black rounded-lg font-semibold"
            >
              Reload App
            </button>
          </GlassCard>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<"chats" | "calls" | "notes" | "profile">("chats");
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeCall, setActiveCall] = useState<string | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || "Anonymous",
          email: firebaseUser.email || "",
          photoURL: firebaseUser.photoURL || "",
          status: "online",
          lastSeen: new Date().toISOString(),
        }, { merge: true });
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-2xl font-light tracking-widest"
        >
          SYNC
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 p-4">
        <GlassCard className="max-w-md w-full p-8 text-center space-y-8">
          <div className="flex justify-center gap-4">
            <Monitor size={48} className="text-white/20" />
            <Zap size={48} className="text-emerald-400" />
            <Smartphone size={48} className="text-white/20" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">Sync</h1>
            <p className="text-slate-400">Seamlessly sync your PC and Mobile devices in real-time.</p>
          </div>
          <button
            onClick={handleLogin}
            className="w-full py-4 px-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95"
          >
            <LogIn size={20} />
            Get Started
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen bg-slate-950 text-white flex flex-col overflow-hidden font-sans">
        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden pb-16 md:pb-20">
          {/* List Pane (Chats/Calls/Notes) */}
          <div className={glassCn(
            "w-full md:w-96 border-r border-white/10 flex flex-col",
            selectedChat ? "hidden md:flex" : "flex"
          )}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live Sync
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              {activeTab === "chats" && (
                <motion.div
                  key="chats"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex-1 overflow-y-auto"
                >
                  <ChatList onSelectChat={setSelectedChat} selectedChatId={selectedChat?.id} />
                </motion.div>
              )}
              {activeTab === "notes" && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex-1 overflow-y-auto"
                >
                  <Notes />
                </motion.div>
              )}
              {activeTab === "calls" && (
                <motion.div
                  key="calls"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex-1 overflow-y-auto"
                >
                  <div className="p-8 text-center space-y-4">
                    <Phone size={48} className="mx-auto opacity-10" />
                    <p className="text-slate-500 text-sm">No recent calls</p>
                  </div>
                </motion.div>
              )}
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex-1 p-8 space-y-8"
                >
                  <div className="text-center space-y-4">
                    <div className="relative inline-block">
                      <img src={user.photoURL || ""} alt="" className="w-32 h-32 rounded-3xl mx-auto border-4 border-white/10 object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-xl border-4 border-slate-950">
                        <Zap size={16} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{user.displayName}</h2>
                      <p className="text-slate-500 text-sm">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-left px-6 hover:bg-white/10 transition-all flex items-center justify-between">
                      <span className="text-sm font-medium">Device Settings</span>
                      <Monitor size={16} className="text-slate-500" />
                    </button>
                    <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-left px-6 hover:bg-white/10 transition-all flex items-center justify-between">
                      <span className="text-sm font-medium">Sync Preferences</span>
                      <Zap size={16} className="text-slate-500" />
                    </button>
                    <button
                      onClick={() => signOut(auth)}
                      className="w-full py-4 bg-red-500/10 text-red-400 rounded-2xl font-bold hover:bg-red-500/20 transition-all"
                    >
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Detail Pane (Chat Window / Call Window) */}
          <div className={glassCn(
            "flex-1 flex flex-col relative",
            !selectedChat && activeTab === "chats" ? "hidden md:flex" : "flex"
          )}>
            {selectedChat ? (
              <ChatWindow 
                chat={selectedChat} 
                onBack={() => setSelectedChat(null)} 
                onStartCall={() => setActiveCall(selectedChat.id)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                  <div className="relative p-10 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <Zap size={64} className="text-emerald-400 animate-pulse" />
                  </div>
                </div>
                <div className="max-w-md space-y-4">
                  <h2 className="text-4xl font-bold tracking-tight">Sync Everything</h2>
                  <p className="text-slate-400 text-lg leading-relaxed">
                    Connect your mobile and PC seamlessly. Send files, notes, and messages to yourself or others in real-time.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-3 px-6 py-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                      <Monitor size={20} />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Desktop</div>
                      <div className="text-sm font-medium">Connected</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
                      <Smartphone size={20} />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Mobile</div>
                      <div className="text-sm font-medium">Ready to Sync</div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('chats')}
                  className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                >
                  Start Syncing
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Call Overlay */}
        <AnimatePresence>
          {activeCall && (
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="fixed inset-0 z-[100]"
            >
              <CallWindow chatId={activeCall} onEnd={() => setActiveCall(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}


