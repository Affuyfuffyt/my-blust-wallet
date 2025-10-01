// src/app/app/messages/[username]/page.tsx
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { User, ChatConversation, ChatMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Paperclip, ThumbsUp, X, BadgeCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogContent, DialogClose, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function ConversationPage() {
  const { user, getAllUsers, startOrGetConversation, sendMessage } = useAuth();
  const router = useRouter();
  const params = useParams();
  const usernameParam = Array.isArray(params.username) ? params.username[0] : params.username;
  const username = decodeURIComponent(usernameParam);
  const { toast } = useToast();


  const [newMessage, setNewMessage] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  
  const allUsers = useMemo(() => getAllUsers(true), [getAllUsers]);

   const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if(viewport) {
            setTimeout(() => viewport.scrollTop = viewport.scrollHeight, 100);
        }
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initConversation = async () => {
        if (user && username) {
            const targetUser = allUsers.find(u => u.profile.username === username);
            if (targetUser) {
                setOtherUser(targetUser);
                try {
                  const convo = await startOrGetConversation(targetUser.email);
                  if (convo) {
                      // Set up Firestore listener
                      unsubscribe = onSnapshot(doc(db, "conversations", convo.id), (doc) => {
                          if (doc.exists()) {
                              setConversation({ id: doc.id, ...doc.data() } as ChatConversation);
                          }
                      });
                  }
                } catch(e) {
                  console.error("Error starting conversation", e);
                  router.replace('/app/messages');
                }
            } else {
                router.replace('/app/messages');
            }
        }
        setLoading(false);
    };

    initConversation();

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [username, allUsers, startOrGetConversation, router, user]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, mediaPreview, scrollToBottom]);


  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
       if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          if (video.duration > 600) { // 10 minutes limit
            toast({
              variant: 'destructive',
              title: 'الفيديو طويل جدًا',
              description: 'الرجاء اختيار فيديو لا تزيد مدته عن 10 دقائق.',
            });
            return;
          }
          setMediaFile(file);
          setMediaPreview(URL.createObjectURL(file));
        };
        video.src = URL.createObjectURL(file);
      } else {
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
      }
    }
  };

  const removeMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview(null);
    if (mediaInputRef.current) {
      mediaInputRef.current.value = '';
    }
  };
  
  const handleSendMessage = async (content: string, file?: File | null) => {
    if ((!content.trim() && !file) || !conversation) return;
    await sendMessage(conversation.id, content, file ?? undefined);
    setNewMessage('');
    removeMedia();
  };

  const handleQuickLike = () => {
    handleSendMessage("👍");
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if(e.key === 'Enter' && !e.shiftKey){
          e.preventDefault();
          handleSendMessage(newMessage, mediaFile);
      }
  }

  const openMediaViewer = (media: { type: 'image' | 'video', url: string }) => {
    setSelectedMedia(media);
    setIsMediaViewerOpen(true);
  }

  if (loading || !user || !otherUser) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
    );
  }

  return (
    <>
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Link href={`/profile/${otherUser.profile.username}`} className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={otherUser.profile.avatarUrl} alt={otherUser.profile.name} />
            <AvatarFallback>{otherUser.profile.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold flex items-center gap-1">
                {otherUser.profile.name}
                {otherUser.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500" />}
            </p>
            <p className="text-xs text-muted-foreground">@{otherUser.profile.username}</p>
          </div>
        </Link>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {conversation?.messages.map((msg, index) => {
            const isCurrentUser = msg.senderEmail === user.email;
            const createdAtDate = (msg.createdAt as any)?.toDate ? (msg.createdAt as any).toDate() : new Date(msg.createdAt);
            const prevMsg = conversation.messages[index-1];
            const prevCreatedAtDate = prevMsg ? ((prevMsg.createdAt as any)?.toDate ? (prevMsg.createdAt as any).toDate() : new Date(prevMsg.createdAt)) : null;

            const showDate = index === 0 || (prevCreatedAtDate && createdAtDate.toDateString() !== prevCreatedAtDate.toDateString());
            
            return (
              <div key={msg.id || index}>
                {showDate && (
                    <div className="text-center text-xs text-muted-foreground my-4">
                        {format(createdAtDate, 'EEEE, d MMMM', { locale: ar })}
                    </div>
                )}
                <div className={cn("flex items-end gap-2", isCurrentUser ? "justify-end" : "justify-start")}>
                  {!isCurrentUser && (
                     <Avatar className="h-7 w-7">
                        <AvatarImage src={otherUser.profile.avatarUrl} />
                        <AvatarFallback>{otherUser.profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-xs md:max-w-md rounded-2xl px-3 py-2 text-sm",
                       msg.content === "👍" && !msg.imageUrl && !msg.videoUrl ? "bg-transparent text-4xl" : "",
                      isCurrentUser
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted rounded-bl-none",
                    )}
                  >
                    {msg.content && msg.content !== "👍" && <p className="whitespace-pre-wrap">{msg.content}</p>}
                    {msg.content === "👍" && !msg.imageUrl && !msg.videoUrl ? '👍' : null}

                    {msg.imageUrl && (
                        <button onClick={() => openMediaViewer({ type: 'image', url: msg.imageUrl! })} className="block mt-2">
                            <Image src={msg.imageUrl} alt="media" width={250} height={250} className="rounded-lg object-cover max-h-60 w-auto"/>
                        </button>
                    )}
                    {msg.videoUrl && (
                         <button onClick={() => openMediaViewer({ type: 'video', url: msg.videoUrl! })} className="block mt-2">
                            <video src={msg.videoUrl} className="rounded-lg max-h-60 w-full pointer-events-none" />
                        </button>
                    )}
                  </div>
                </div>
                 <p className={cn("text-xs text-muted-foreground mt-1", isCurrentUser ? "text-right mr-9" : "text-left ml-9")}>
                    {format(createdAtDate, 'h:mm a', { locale: ar })}
                </p>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input Footer */}
      <footer className="sticky bottom-0 bg-background border-t p-2 space-y-2">
         {mediaPreview && (
          <div className="relative group w-fit mx-auto bg-muted p-2 rounded-lg">
            {mediaFile?.type.startsWith('image/') ? (
              <Image src={mediaPreview} alt="Preview" width={100} height={100} className="rounded-md object-cover max-h-24 w-auto"/>
            ) : (
              <video src={mediaPreview} className="rounded-md max-h-24 w-auto" />
            )}
            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={removeMedia}>
              <X className="h-3 w-3"/>
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => mediaInputRef.current?.click()}><Paperclip className="h-5 w-5" /></Button>
           <input type="file" ref={mediaInputRef} onChange={handleMediaChange} className="hidden" accept="image/*,video/*" />
          <Input 
            placeholder="اكتب رسالتك..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-10"
          />
          {newMessage || mediaFile ? (
            <Button size="icon" onClick={() => handleSendMessage(newMessage, mediaFile)}>
                <Send className="h-5 w-5" />
            </Button>
          ) : (
            <Button size="icon" onClick={handleQuickLike}>
                <ThumbsUp className="h-5 w-5" />
            </Button>
          )}
        </div>
      </footer>
    </div>
    
    <Dialog open={isMediaViewerOpen} onOpenChange={setIsMediaViewerOpen}>
        <DialogContent className="max-w-none w-screen h-screen p-0 bg-black/80 border-none shadow-none flex items-center justify-center">
            <DialogHeader className="sr-only">
                <DialogTitle>Media Viewer</DialogTitle>
            </DialogHeader>
            <DialogClose className="absolute top-4 right-4 text-white z-50" />
            <div className="relative w-full h-full p-6">
                {selectedMedia?.type === 'image' && selectedMedia.url && (
                    <img src={selectedMedia.url} alt="Full screen media" className="max-w-full max-h-full object-contain mx-auto my-auto" />
                )}
                {selectedMedia?.type === 'video' && selectedMedia.url && (
                    <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-full mx-auto my-auto" />
                )}
            </div>
        </DialogContent>
    </Dialog>
    </>
  );
}
