import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy } from "firebase/firestore";
import { Note } from "../types";
import { Plus, Pin, Trash2, Search, FileText } from "lucide-react";
import { cn, GlassCard } from "./GlassCard";
import { motion, AnimatePresence } from "motion/react";

export const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "notes"),
      where("uid", "==", auth.currentUser.uid),
      orderBy("isPinned", "desc"),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)));
    });

    return () => unsubscribe();
  }, []);

  const handleAddNote = async () => {
    if (!newNote.trim() || !auth.currentUser) return;

    await addDoc(collection(db, "notes"), {
      uid: auth.currentUser.uid,
      content: newNote,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewNote("");
  };

  const togglePin = async (note: Note) => {
    await updateDoc(doc(db, "notes", note.id), {
      isPinned: !note.isPinned,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteNote = async (id: string) => {
    await deleteDoc(doc(db, "notes", id));
  };

  const filteredNotes = notes.filter(n => n.content.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-full p-6 space-y-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Notes</h2>
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <FileText size={20} />
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
          />
        </div>

        <div className="relative group">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Quick note for your other device..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none placeholder:text-slate-600"
          />
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            className="absolute bottom-4 right-4 p-3 bg-white text-black rounded-xl disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
        <AnimatePresence>
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <GlassCard className={cn(
                "p-5 group relative transition-all border-white/5 hover:border-white/20",
                note.isPinned && "border-emerald-500/30 bg-emerald-500/5"
              )}>
                <div className="flex justify-between items-start gap-4">
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap flex-1">{note.content}</p>
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => togglePin(note)}
                      className={cn("p-2 rounded-lg hover:bg-white/10 transition-colors", note.isPinned ? "text-emerald-400" : "text-slate-500")}
                    >
                      <Pin size={18} />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                  {note.isPinned && (
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                      <Pin size={10} />
                      Pinned
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredNotes.length === 0 && (
          <div className="text-center py-20 text-slate-500 space-y-4">
            <div className="p-6 bg-white/5 rounded-full inline-block">
              <FileText size={48} className="opacity-10" />
            </div>
            <p className="text-sm font-medium">No notes found</p>
          </div>
        )}
      </div>
    </div>
  );
};
