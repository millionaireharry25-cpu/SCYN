import { useEffect, useState, useRef } from "react";
import { db, auth, storage } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Chat, Message, User } from "../types";
import { Send, Image as ImageIcon, Paperclip, Mic, Phone, Video, MoreVertical, ChevronLeft, Smile, Check, CheckCheck, Zap, File, Download } from "lucide-react";
import { cn, GlassCard } from "./GlassCard";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";

interface ChatWindowProps {
  chat: Chat;
  onBack: () => void;
  onStartCall: () => void;
}

export const ChatWindow = ({ chat, onBack, onStartCall }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "chats", chat.id, "messages"),
      orderBy("createdAt", "asc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgData);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [chat.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    const msgText = newMessage;
    setNewMessage("");

    try {
      await addDoc(collection(db, "chats", chat.id, "messages"), {
        chatId: chat.id,
        senderId: auth.currentUser.uid,
        text: msgText,
        type: "text",
        status: "sent",
        createdAt: new Date().toISOString(),
      });

      await updateDoc(doc(db, "chats", chat.id), {
        lastMessage: { text: msgText, senderId: auth.currentUser.uid },
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    const storageRef = ref(storage, `chats/${chat.id}/${Date.now()}_${file.name}`);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, "chats", chat.id, "messages"), {
        chatId: chat.id,
        senderId: auth.currentUser.uid,
        type: file.type.startsWith("image/") ? "image" : "file",
        fileUrl: url,
        fileName: file.name,
        status: "sent",
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/50 relative">
      {/* Wallpaper Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://picsum.photos/seed/chat/1920/1080?blur=10')] bg-cover bg-center" />

      {/* Header */}
      <div className="z-10 flex items-center justify-between p-6 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="md:hidden p-2 hover:bg-white/5 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="relative">
            <img src={chat.groupPhoto || ""} alt="" className="w-12 h-12 rounded-2xl bg-slate-800 object-cover" referrerPolicy="no-referrer" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-950 rounded-full" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight">{chat.name}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
              <Zap size={10} />
              Synced
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onStartCall} className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Phone size={20} /></button>
          <button onClick={onStartCall} className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Video size={20} /></button>
          <button className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 z-10 scrollbar-hide">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === auth.currentUser?.uid;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn("flex", isMe ? "justify-end" : "justify-start")}
            >
              <div className={cn(
                "max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-xl relative group transition-all",
                isMe 
                  ? "bg-white text-black rounded-tr-none" 
                  : "bg-white/10 backdrop-blur-xl text-white rounded-tl-none border border-white/10"
              )}>
                {msg.type === "image" ? (
                  <img src={msg.fileUrl} alt="" className="rounded-xl max-h-80 w-full object-cover mb-2" referrerPolicy="no-referrer" />
                ) : msg.type === "file" ? (
                  <div className="flex items-center gap-3 p-3 bg-black/10 rounded-xl mb-2 border border-black/5">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Paperclip size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{msg.fileName}</div>
                      <div className="text-[10px] opacity-50 uppercase tracking-widest">Attached File</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed font-medium">{msg.text}</p>
                )}
                <div className={cn(
                  "flex items-center justify-end gap-1.5 mt-2",
                  isMe ? "text-black/40" : "text-white/40"
                )}>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">
                    {format(new Date(msg.createdAt), "HH:mm")}
                  </span>
                  {isMe && (
                    <span className="flex items-center">
                      {msg.status === "seen" ? <CheckCheck size={14} className="text-emerald-600" /> : <Check size={14} />}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="z-10 p-6 bg-black/60 backdrop-blur-2xl border-t border-white/10">
        <form onSubmit={handleSendMessage} className="flex items-center gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <Paperclip size={22} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          
          <div className="flex-1 relative group">
            <input
              type="text"
              placeholder="Type a message or paste a link..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button type="button" className="p-1 text-slate-500 hover:text-white transition-colors">
                <Smile size={20} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={cn(
              "p-4 rounded-2xl transition-all shadow-lg",
              newMessage.trim() 
                ? "bg-emerald-500 text-white scale-105 shadow-emerald-500/20" 
                : "bg-white/5 text-slate-500"
            )}
          >
            {newMessage.trim() ? <Send size={22} /> : <Mic size={22} />}
          </button>
        </form>
      </div>
    </div>
  );
};
