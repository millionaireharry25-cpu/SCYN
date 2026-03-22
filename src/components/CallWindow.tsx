import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Phone, Video, PhoneOff, Mic, MicOff, VideoOff, ScreenShare, User } from "lucide-react";
import { GlassCard, cn } from "./GlassCard";
import { motion, AnimatePresence } from "motion/react";

interface CallWindowProps {
  chatId: string;
  onEnd: () => void;
}

export const CallWindow = ({ chatId, onEnd }: CallWindowProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [status, setStatus] = useState<"connecting" | "ringing" | "connected">("connecting");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    socketRef.current = io();
    socketRef.current.emit("join-room", chatId);

    // Simplified WebRTC logic for UI demonstration
    // In a real app, you'd handle offers, answers, and ICE candidates here
    const timer = setTimeout(() => setStatus("connected"), 2000);

    return () => {
      clearTimeout(timer);
      socketRef.current?.disconnect();
      peerConnectionRef.current?.close();
    };
  }, [chatId]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl aspect-video relative rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border border-white/10">
        {/* Remote Video (Main) */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isVideoOff ? (
            <div className="text-center space-y-4">
              <div className="w-32 h-32 rounded-full bg-white/10 mx-auto flex items-center justify-center">
                <User size={64} className="text-slate-500" />
              </div>
              <p className="text-slate-400">Camera is off</p>
            </div>
          ) : (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              poster="https://picsum.photos/seed/remote/1280/720"
            />
          )}
        </div>

        {/* Local Video (PIP) */}
        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          className="absolute top-4 right-4 w-48 md:w-64 aspect-video rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-800 z-10"
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            poster="https://picsum.photos/seed/local/640/360"
          />
        </motion.div>

        {/* Call Info Overlay */}
        <div className="absolute top-8 left-8 z-10">
          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden">
              <img src="https://picsum.photos/seed/user/100/100" alt="" />
            </div>
            <div>
              <div className="font-bold text-lg">John Doe</div>
              <div className="text-xs text-emerald-400 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {status === "connected" ? "04:20" : "Connecting..."}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-6 z-10">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "p-4 rounded-2xl backdrop-blur-md border transition-all hover:scale-110",
              isMuted ? "bg-red-500/20 border-red-500/50 text-red-500" : "bg-white/10 border-white/20 text-white"
            )}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={cn(
              "p-4 rounded-2xl backdrop-blur-md border transition-all hover:scale-110",
              isVideoOff ? "bg-red-500/20 border-red-500/50 text-red-500" : "bg-white/10 border-white/20 text-white"
            )}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>

          <button
            onClick={onEnd}
            className="p-6 rounded-3xl bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:bg-red-600 transition-all hover:scale-110 active:scale-95"
          >
            <PhoneOff size={32} />
          </button>

          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={cn(
              "p-4 rounded-2xl backdrop-blur-md border transition-all hover:scale-110",
              isScreenSharing ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-500" : "bg-white/10 border-white/20 text-white"
            )}
          >
            <ScreenShare size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
