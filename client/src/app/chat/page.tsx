"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { 
  Send, 
  MessageSquare, 
  ArrowLeft, 
  Circle, 
  User, 
  Check, 
  CheckCheck, 
  Loader2,
  Sparkles,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Navbar } from "@/components/layout/Navbar";


function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserIdQuery = searchParams.get("user");
  const { user, isAuthenticated } = useAuthStore();

  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  
  // Status states
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializingRef = useRef<string | null>(null);
  const activeRoomRef = useRef<any>(null);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // 1. Fetch chat rooms on mount
  const fetchRooms = async (autoSelectTargetId?: string) => {
    setLoadingRooms(true);
    try {
      const response = await api.get("/api/v1/chat");
      const fetchedRooms = response.data.data || [];
      setRooms(fetchedRooms);

      // Initialize online status map from fetched rooms otherParticipant statuses
      const initialOnlineStatus: Record<string, boolean> = {};
      fetchedRooms.forEach((room: any) => {
        const recipient = room.otherParticipant || room.participants?.find((p: any) => p.userId !== user?.id)?.user;
        if (recipient && recipient.id) {
          initialOnlineStatus[recipient.id] = !!room.otherParticipant?.isOnline;
        }
      });
      setOnlineUsers(initialOnlineStatus);

      // Handle query param targetUserId redirection/selection
      if (autoSelectTargetId && user) {
        let existingRoom = fetchedRooms.find((r: any) => 
          r.participants?.some((p: any) => p.userId === autoSelectTargetId) ||
          r.otherParticipant?.id === autoSelectTargetId
        );

        if (!existingRoom && initializingRef.current !== autoSelectTargetId) {
          initializingRef.current = autoSelectTargetId;
          // Initialize room via POST
          try {
            const initResponse = await api.post("/api/v1/chat/rooms", {
              targetUserId: autoSelectTargetId,
            });
            const newRoom = initResponse.data.data;
            setRooms((prev) => {
              if (prev.some(r => r.id === newRoom.id)) return prev;
              return [newRoom, ...prev];
            });
            existingRoom = newRoom;
          } catch (initErr) {
            console.error("Failed to initialize chat room:", initErr);
          } finally {
            initializingRef.current = null;
          }
        }

        if (existingRoom) {
          handleSelectRoom(existingRoom);
        }
      }
    } catch (err) {
      console.error("Failed to fetch chat rooms:", err);
    } finally {
      setLoadingRooms(false);
    }
  };

  // 2. Setup Socket.IO client connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem("rentmate_token");
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

    const socket = io(socketUrl, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected successfully");
    });

    // Listen for incoming messages
    socket.on("new_message", (message: any) => {
      // Append if it belongs to the active room
      if (activeRoomRef.current && message.chatRoomId === activeRoomRef.current.id) {
        setMessages((prev) => [...prev, message]);
        // Auto mark as read
        socket.emit("mark_read", { roomId: activeRoomRef.current.id });
      }

      // Update rooms list with new message and timestamp
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          if (room.id === message.chatRoomId) {
            return {
              ...room,
              messages: [message], // update snippet
              unreadCount: room.id === activeRoomRef.current?.id ? 0 : (room.unreadCount || 0) + 1,
            };
          }
          return room;
        }).sort((a, b) => {
          const aTime = a.messages?.[0]?.createdAt || a.createdAt;
          const bTime = b.messages?.[0]?.createdAt || b.createdAt;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        })
      );
    });

    // Listen for online status updates
    socket.on("user_status", (data: { userId: string; status: string }) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [data.userId]: data.status === "online",
      }));
    });

    // Listen for typing events
    socket.on("typing", (data: { roomId: string; userId: string }) => {
      if (activeRoomRef.current && data.roomId === activeRoomRef.current.id) {
        setTypingUsers((prev) => ({ ...prev, [data.userId]: true }));
      }
    });

    socket.on("stop_typing", (data: { roomId: string; userId: string }) => {
      if (activeRoomRef.current && data.roomId === activeRoomRef.current.id) {
        setTypingUsers((prev) => ({ ...prev, [data.userId]: false }));
      }
    });

    // Listen for seen receipts
    socket.on("messages_read", (data: { roomId: string; readBy: string; readAt: string }) => {
      if (activeRoomRef.current && data.roomId === activeRoomRef.current.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId !== data.readBy && !msg.readAt
              ? { ...msg, readAt: data.readAt }
              : msg
          )
        );
      }
    });

    socket.on("error", (err: { message: string }) => {
      console.error("Socket error received:", err.message);
    });

    // Load rooms list
    fetchRooms(targetUserIdQuery || undefined);

    return () => {
      socket.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [isAuthenticated, user, targetUserIdQuery]);

  // Load message history when selecting a room
  const handleSelectRoom = async (room: any) => {
    setActiveRoom(room);
    setLoadingMessages(true);
    setTypingUsers({});

    // Reset unread count locally
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unreadCount: 0 } : r));

    try {
      const response = await api.get(`/api/v1/chat/${room.id}/messages`);
      setMessages(response.data.data?.messages || []);

      // Notify socket server to mark messages read and join room channel
      if (socketRef.current) {
        socketRef.current.emit("join_room", { roomId: room.id });
        socketRef.current.emit("mark_read", { roomId: room.id });
      }
    } catch (err) {
      console.error("Failed to load message history:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Emit typing indicators on input change
  const handleInputChange = (val: string) => {
    setMessageInput(val);
    if (!socketRef.current || !activeRoom) return;

    // Send typing notification
    socketRef.current.emit("typing", { roomId: activeRoom.id });

    // Throttle / Debounce stop typing emit
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stop_typing", { roomId: activeRoom.id });
    }, 1500);
  };

  // Submit new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeRoom || !socketRef.current) return;

    // Stop typing indicator immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current.emit("stop_typing", { roomId: activeRoom.id });

    // Emit send_message
    socketRef.current.emit("send_message", {
      roomId: activeRoom.id,
      content: messageInput,
    });

    setMessageInput("");
  };

  // Scroll to bottom of message panel
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <h2 className="text-xl font-bold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground max-w-sm mb-6">Please log in to access the RentMate workspace.</p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
        {/* <Footer /> */}
      </div>
    );
  }

  // Helper: Find other participant details
  const getRecipient = (room: any) => {
    return room.participants?.find((p: any) => p.userId !== user?.id)?.user || { firstName: "Deleted", lastName: "User", id: "" };
  };

  const filteredRooms = rooms.filter((room, index, self) => {
    const rec = getRecipient(room);
    const isUnique = self.findIndex(r => getRecipient(r).id === rec.id) === index;
    const matchesSearch = `${rec.firstName} ${rec.lastName}`.toLowerCase().includes(searchFilter.toLowerCase());
    return isUnique && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 md:px-8 py-6 max-w-7xl h-[calc(100vh-140px)] flex flex-col">
        
        {/* Workspace Card */}
        <div className="flex-1 border border-border/50 shadow-xl rounded-2xl overflow-hidden bg-card/40 backdrop-blur-md flex h-full">
          
          {/* Left panel: Room lists */}
          <div className="w-full md:w-80 border-r border-border/40 flex flex-col h-full bg-card/60">
            {/* Toolbar */}
            <div className="p-4 border-b border-border/40 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" /> Chats
                </h2>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 h-9 bg-background/50 border-border/60 text-sm"
                />
              </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
              {loadingRooms ? (
                <div className="flex flex-col items-center py-10">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground mt-2 font-medium">Loading conversations...</span>
                </div>
              ) : filteredRooms.length > 0 ? (
                <div className="divide-y divide-border/20">
                  {filteredRooms.map((room) => {
                    const recipient = getRecipient(room);
                    const isSelected = activeRoom?.id === room.id;
                    const lastMsg = room.messages?.[0];
                    const isOnline = onlineUsers[recipient.id];

                    return (
                      <button
                        key={room.id}
                        onClick={() => handleSelectRoom(room)}
                        className={`w-full p-4 flex items-start gap-3 text-left transition-all ${
                          isSelected
                            ? "bg-primary/5 border-l-4 border-primary"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-10 w-10 border border-border/40">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {recipient.firstName?.charAt(0)}{recipient.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <Circle
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${
                              isOnline ? "fill-emerald-500 text-emerald-500" : "fill-muted text-muted"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-sm truncate">
                              {recipient.firstName} {recipient.lastName}
                            </h4>
                            {lastMsg && (
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {lastMsg ? lastMsg.content : "No messages yet"}
                          </p>
                        </div>
                        {room.unreadCount > 0 && (
                          <Badge className="shrink-0 rounded-full h-5 min-w-[20px] justify-center px-1">
                            {room.unreadCount}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground text-xs font-semibold">
                  No active chats.
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel: Messages Workspace */}
          <div className="hidden md:flex flex-1 flex-col h-full bg-background/20">
            {activeRoom ? (
              <div className="flex flex-col h-full">
                
                {/* Active Header */}
                <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/40">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border border-border/40">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {getRecipient(activeRoom).firstName?.charAt(0)}
                          {getRecipient(activeRoom).lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <Circle
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${
                          onlineUsers[getRecipient(activeRoom).id] ? "fill-emerald-500 text-emerald-500" : "fill-muted text-muted"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">
                        {getRecipient(activeRoom).firstName} {getRecipient(activeRoom).lastName}
                      </h3>
                      <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                        {onlineUsers[getRecipient(activeRoom).id] ? "Active Now" : "Offline"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <span className="text-xs text-muted-foreground mt-2 font-medium">Fetching history...</span>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, index) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                          <div
                            key={msg.id || index}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div className="max-w-[70%] space-y-1">
                              <div
                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                  isMe
                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                    : "bg-muted/80 text-foreground rounded-tl-none border border-border/40"
                                }`}
                              >
                                {msg.content}
                              </div>
                              <div className="flex items-center justify-end gap-1.5 px-1">
                                <span className="text-[9px] text-muted-foreground">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMe && (
                                  msg.readAt ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 text-muted-foreground" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Typing indicator alert */}
                      {Object.keys(typingUsers).some((k) => typingUsers[k] && k !== user?.id) && (
                        <div className="flex justify-start items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">
                              {getRecipient(activeRoom).firstName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-muted/40 px-3 py-1.5 rounded-full text-xs text-muted-foreground italic flex items-center gap-1">
                            <span className="animate-pulse">typing...</span>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Send input toolbar */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-border/40 flex gap-2 bg-card/20">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="flex-1 bg-background border-border/50 rounded-xl"
                  />
                  <Button type="submit" size="icon" className="rounded-xl" disabled={!messageInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground text-center">
                <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mb-4 border border-dashed border-border/60">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">No Conversation Selected</h3>
                <p className="text-xs text-muted-foreground max-w-xs mt-1.5">
                  Select a participant from the left column to read messages and start chat.
                </p>
              </div>
            )}
          </div>

        </div>

      </main>

    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-semibold">Loading chat room...</p>
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
