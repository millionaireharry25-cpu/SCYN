import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { Chat, User } from "../types";
import { Search, Plus, UserPlus, Zap } from "lucide-react";
import { cn } from "./GlassCard";
import { formatDistanceToNow } from "date-fns";

interface ChatListProps {
  onSelectChat: (chat: Chat) => void;
  selectedChatId?: string;
}

export const ChatList = ({ onSelectChat, selectedChatId }: ChatListProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", auth.currentUser.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      
      // Ensure "My Sync" (self-chat) exists or is at top
      const selfChat = chatData.find(c => c.type === "private" && c.participants.length === 1);
      const otherChats = chatData.filter(c => !(c.type === "private" && c.participants.length === 1));
      
      setChats(selfChat ? [selfChat, ...otherChats] : otherChats);
    });

    return () => unsubscribe();
  }, []);

  const startSelfSync = async () => {
    if (!auth.currentUser) return;
    const existing = chats.find(c => c.type === "private" && c.participants.length === 1);
    if (existing) {
      onSelectChat(existing);
      return;
    }
    const newChatRef = await addDoc(collection(db, "chats"), {
      type: "private",
      participants: [auth.currentUser.uid],
      updatedAt: new Date().toISOString(),
      name: "My Sync (PC/Mobile)",
      groupPhoto: "https://api.dicebear.com/7.x/bottts/svg?seed=sync",
    });
    onSelectChat({
      id: newChatRef.id,
      type: "private",
      participants: [auth.currentUser.uid],
      updatedAt: new Date().toISOString(),
      name: "My Sync (PC/Mobile)",
      groupPhoto: "https://api.dicebear.com/7.x/bottts/svg?seed=sync",
    });
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length > 2) {
      setIsSearching(true);
      const q = query(
        collection(db, "users"),
        where("displayName", ">=", val),
        where("displayName", "<=", val + "\uf8ff"),
        limit(5)
      );
      const snapshot = await getDocs(q);
      setSearchResults(snapshot.docs.map(doc => doc.data() as User).filter(u => u.uid !== auth.currentUser?.uid));
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const startNewChat = async (targetUser: User) => {
    if (!auth.currentUser) return;

    // Check if chat already exists
    const existingChat = chats.find(c => c.type === "private" && c.participants.includes(targetUser.uid));
    if (existingChat) {
      onSelectChat(existingChat);
      setSearchQuery("");
      setIsSearching(false);
      return;
    }

    const newChatRef = await addDoc(collection(db, "chats"), {
      type: "private",
      participants: [auth.currentUser.uid, targetUser.uid],
      updatedAt: new Date().toISOString(),
      name: targetUser.displayName,
      groupPhoto: targetUser.photoURL,
    });

    onSelectChat({
      id: newChatRef.id,
      type: "private",
      participants: [auth.currentUser.uid, targetUser.uid],
      updatedAt: new Date().toISOString(),
      name: targetUser.displayName,
      groupPhoto: targetUser.photoURL,
    });
    setSearchQuery("");
    setIsSearching(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search chats or users..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
          />
        </div>
        <button
          onClick={startSelfSync}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
        >
          <Zap size={14} />
          Sync with Mobile/PC
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {isSearching ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">Users</p>
            {searchResults.map((u) => (
              <button
                key={u.uid}
                onClick={() => startNewChat(u)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <img src={u.photoURL || ""} alt="" className="w-10 h-10 rounded-full bg-slate-800" referrerPolicy="no-referrer" />
                <div>
                  <div className="font-medium">{u.displayName}</div>
                  <div className="text-xs text-slate-500">{u.status}</div>
                </div>
              </button>
            ))}
            {searchResults.length === 0 && searchQuery.length > 2 && (
              <p className="text-center text-slate-500 py-4 text-sm">No users found</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                  selectedChatId === chat.id ? "bg-white/10" : "hover:bg-white/5"
                )}
              >
                <div className="relative">
                  <img src={chat.groupPhoto || ""} alt="" className="w-12 h-12 rounded-full bg-slate-800" referrerPolicy="no-referrer" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <div className="font-semibold truncate text-sm">{chat.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: false })}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {chat.lastMessage?.text || "No messages yet"}
                  </div>
                </div>
              </button>
            ))}
            {chats.length === 0 && (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Plus size={32} className="mx-auto opacity-20" />
                <p className="text-sm">No chats yet. Search for a user to start messaging.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
