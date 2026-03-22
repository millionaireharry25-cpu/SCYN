export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  status: "online" | "offline";
  lastSeen?: string;
  wallpaper?: string;
}

export interface Chat {
  id: string;
  type: "private" | "group";
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
  name?: string;
  groupPhoto?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  type: "text" | "image" | "video" | "file" | "voice";
  fileUrl?: string;
  fileName?: string;
  status: "sent" | "delivered" | "seen";
  createdAt: string;
  reactions?: Record<string, string[]>;
}

export interface Note {
  id: string;
  uid: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}
