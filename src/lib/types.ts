export type Profile = {
  name: string;
  username: string;
  bio: string;
  avatarUrl?: string;
  followers: string[]; // Array of user UIDs
  following: string[]; // Array of user UIDs
};

export type Notification = {
  id: string;
  type: 'like' | 'comment' | 'follow';
  actorUsername: string; // The user who performed the action
  actorProfile?: Profile;
  postId?: string; // The post that was interacted with
  read: boolean;
  createdAt: string;
};

export type WithdrawalRequest = {
  id: string; // Firestore doc ID
  userEmail: string;
  user: User; // Enriched data for admin view
  amount: number;
  method: 'zain_cash' | 'mastercard';
  walletNumber: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'rejected';
}

export type ChatMessage = {
  id: number; // Using timestamp for ID for simplicity in local state
  senderEmail: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
  videoUrl?: string;
};

export type ChatConversation = {
  id: string; // e.g., 'uid1-uid2' sorted alphabetically
  participantEmails: string[];
  messages: ChatMessage[];
};

export type User = {
  uid: string;
  email: string;
  password?: string;
  profile: Profile;
  notifications?: Notification[];
  isAdmin?: boolean;
  isBanned?: boolean;
  banReason?: string;
  banEndDate?: string;
  blustBalance?: number;
  lastBlustClaim?: string | null;
  withdrawalRequests?: WithdrawalRequest[];
  isVerified?: boolean;
  verificationEndDate?: string;
  conversations?: ChatConversation[];
};

export type Comment = {
  id: number;
  authorUsername: string;
  author: Profile;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
  likes: number;
  likedBy: string[]; // Array of user emails
  replies: Comment[];
  isGift?: boolean; // To identify gift comments
  giftAmount?: number; // To store the amount of the gift
}

export type Post = {
    id: string; // Changed to string for Firestore doc ID
    authorUsername: string;
    author?: Profile;
    content: string;
    imageUrl?: string;
    imageHint?: string;
    likes: number;
    likedBy: string[]; // Array of user emails
    comments: Comment[];
    createdAt: string;
}

export type AppItem = {
    id: string; // Firestore doc ID
    name: string;
    description: string;
    iconUrl: string;
    downloadUrl: string;
}
