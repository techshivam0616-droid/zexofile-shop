import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, ArrowLeft } from "lucide-react";
import { ref, push, onValue, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "admin";
  senderName: string;
  timestamp: number;
}

interface ChatThread {
  id: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastTimestamp: number;
  unreadAdmin?: boolean;
}

const FloatingChat: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatId = isAdmin ? activeThread : user?.uid;

  useEffect(() => {
    if (!isAdmin || !open) return;
    const unsub = onValue(ref(db, "chatThreads"), (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
        list.sort((a: any, b: any) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));
        setThreads(list);
      } else {
        setThreads([]);
      }
    });
    return () => unsub();
  }, [isAdmin, open]);

  useEffect(() => {
    if (!chatId || !open) return;
    const unsub = onValue(ref(db, `chatMessages/${chatId}`), (snap) => {
      const data = snap.val();
      if (data) {
        setMessages(Object.entries(data).map(([id, val]: any) => ({ id, ...val })));
      } else {
        setMessages([]);
      }
    });
    return () => unsub();
  }, [chatId, open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    
    if (!user) {
      toast.error("Please login first to send a message");
      return;
    }

    const targetId = isAdmin ? activeThread : user.uid;
    if (!targetId) return;

    const text = message.trim();
    setSending(true);
    setMessage("");

    try {
      const msgData = {
        text,
        sender: isAdmin ? "admin" : "user",
        senderName: isAdmin ? "Admin" : (user.displayName || user.email || "User"),
        timestamp: Date.now(),
      };

      await push(ref(db, `chatMessages/${targetId}`), msgData);

      await set(ref(db, `chatThreads/${targetId}`), {
        userName: isAdmin ? threads.find(t => t.id === targetId)?.userName || "User" : (user.displayName || user.email?.split("@")[0] || "User"),
        userEmail: isAdmin ? threads.find(t => t.id === targetId)?.userEmail || "" : user.email,
        lastMessage: text,
        lastTimestamp: Date.now(),
        unreadAdmin: !isAdmin,
      });

      toast.success("Message sent!");
    } catch (error: any) {
      console.error("Chat send error:", error);
      toast.error("Message send failed: " + (error.message || "Unknown error"));
      setMessage(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 z-[90] w-80 max-w-[calc(100vw-2rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in"
          style={{ height: "420px" }}>
          
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-2">
            {isAdmin && activeThread && (
              <button onClick={() => setActiveThread(null)}><ArrowLeft size={18} /></button>
            )}
            <MessageCircle size={18} />
            <span className="text-sm font-semibold flex-1">
              {isAdmin ? (activeThread ? threads.find(t => t.id === activeThread)?.userName || "Chat" : "Messages") : "Chat with Us"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isAdmin && !activeThread ? (
              <div className="divide-y divide-border">
                {threads.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No messages yet.</p>
                )}
                {threads.map((t) => (
                  <button key={t.id} onClick={() => setActiveThread(t.id)}
                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{t.userName}</p>
                      {t.unreadAdmin && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{t.lastMessage}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t.userEmail}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {!user && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Please login to send us a message!
                  </p>
                )}
                {user && messages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    {isAdmin ? "No messages in this thread." : "Send a message and we'll reply soon!"}
                  </p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex flex-col ${m.sender === "admin" ? "items-start" : "items-end"}`}>
                    <p className="text-[10px] text-muted-foreground mb-0.5">{m.senderName}</p>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs ${
                      m.sender === "admin" 
                        ? "bg-muted text-foreground rounded-tl-none" 
                        : "bg-primary text-primary-foreground rounded-tr-none"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {(!isAdmin || activeThread) && (
            <div className="border-t border-border p-3 flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={user ? "Type a message..." : "Login to chat..."}
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground outline-none"
                disabled={!user}
              />
              <button 
                onClick={handleSend} 
                disabled={sending || !message.trim() || !user}
                className="w-9 h-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingChat;
