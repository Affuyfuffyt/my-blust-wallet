// src/app/app/messages/page.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { User, ChatConversation } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquarePlus, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';

export default function MessagesPage() {
  const { user, getAllUsers, getConversationsForUser, startOrGetConversation } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  
  const allUsers = useMemo(() => getAllUsers(true), [getAllUsers]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const convos = await getConversationsForUser();
    const allUsersData = allUsers;
    const populatedConvos = convos.map(convo => {
        const otherParticipantEmail = convo.participantEmails.find(email => email !== user?.email);
        const otherUser = allUsersData.find(u => u.email === otherParticipantEmail);
        const lastMessage = convo.messages[convo.messages.length - 1];
        return {
            ...convo,
            otherUser,
            lastMessage,
        };
    }).sort((a, b) => {
        if (!a.lastMessage?.createdAt) return 1;
        if (!b.lastMessage?.createdAt) return -1;
        const dateA = (a.lastMessage.createdAt as any).toDate ? (a.lastMessage.createdAt as any).toDate() : new Date(a.lastMessage.createdAt);
        const dateB = (b.lastMessage.createdAt as any).toDate ? (b.lastMessage.createdAt as any).toDate() : new Date(b.lastMessage.createdAt);
        return dateB.getTime() - dateA.getTime();
    });
    setConversations(populatedConvos);
  }, [getConversationsForUser, allUsers, user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);


  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allUsers.filter(u =>
      (u.profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.profile.username.toLowerCase().includes(searchQuery.toLowerCase())) &&
      u.email !== user?.email
    );
  }, [searchQuery, allUsers, user]);

  const handleStartConversation = async (targetUser: User) => {
    const conversation = await startOrGetConversation(targetUser.email);
    if (conversation) {
      router.push(`/app/messages/${encodeURIComponent(targetUser.profile.username)}`);
    }
  };

  useEffect(() => {
    if(searchQuery.trim()){
        setIsSearching(true);
    } else {
        setIsSearching(false);
    }
  }, [searchQuery]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">الرسائل</h1>
        <div className="relative mt-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="البحث عن مستخدمين..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {isSearching ? (
          <div>
            {searchResults.length > 0 ? (
                searchResults.map(foundUser => (
                <div key={foundUser.email} className="flex items-center gap-3 p-4 border-b hover:bg-muted/50">
                    <Avatar>
                        <AvatarImage src={foundUser.profile.avatarUrl} alt={foundUser.profile.name} />
                        <AvatarFallback>{foundUser.profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-semibold">{foundUser.profile.name}</p>
                        <p className="text-sm text-muted-foreground">@{foundUser.profile.username}</p>
                    </div>
                    <Button size="sm" onClick={() => handleStartConversation(foundUser)}>مراسلة</Button>
                </div>
                ))
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <p>لم يتم العثور على مستخدمين.</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {conversations.length > 0 ? (
              conversations.map(({ id, otherUser, lastMessage }) => {
                const lastMessageDate = lastMessage?.createdAt ? (lastMessage.createdAt.toDate ? lastMessage.createdAt.toDate() : new Date(lastMessage.createdAt)) : null;

                return otherUser && (
                  <Link href={`/app/messages/${encodeURIComponent(otherUser.profile.username)}`} key={id}>
                    <div className="flex items-center gap-3 p-4 border-b hover:bg-muted/50 cursor-pointer">
                      <Avatar>
                        <AvatarImage src={otherUser.profile.avatarUrl} alt={otherUser.profile.name} />
                        <AvatarFallback>{otherUser.profile.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between">
                            <p className="font-semibold">{otherUser.profile.name}</p>
                            {lastMessageDate && (
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(lastMessageDate, { addSuffix: true, locale: ar })}
                                </p>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {lastMessage ? `${lastMessage.senderEmail === user?.email ? 'أنت: ' : ''}${lastMessage.content}` : 'لا توجد رسائل بعد'}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="text-center p-16 text-muted-foreground flex flex-col items-center gap-4">
                <MessageSquarePlus className="h-16 w-16" />
                <h2 className="text-lg font-semibold">لا توجد محادثات</h2>
                <p>ابحث عن مستخدم لبدء محادثة جديدة.</p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
