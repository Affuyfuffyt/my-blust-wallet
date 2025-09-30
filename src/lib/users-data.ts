// src/lib/users-data.ts
import type { User } from './types';

// This is temporary seed data.
// In a real app, user creation would be handled by the signup process.
// The password here is for demonstration purposes. In a real app, they should be hashed.
export const initialUsers: Record<string, User> = {
  "rauter505@gmail.com": {
    email: "rauter505@gmail.com",
    password: "mdMD@#$2002",
    profile: {
      name: "Admin",
      username: "@admin",
      bio: "أنا المشرف على هذه المنصة.",
      avatarUrl: "https://i.pravatar.cc/150?u=admin",
    },
    notifications: [],
    isAdmin: true,
    isBanned: false,
    blustBalance: 15000,
    lastBlustClaim: null,
  },
  "blust@blust.iq": {
    email: "blust@blust.iq",
    password: "mdMD@#$2002",
    profile: {
        name: "محفظتي بلوست",
        username: "@blust",
        bio: "الحساب الرسمي لتطبيق محفظتي بلوست.",
        avatarUrl: "https://picsum.photos/seed/blust-wallet/150/150",
    },
    notifications: [],
    isAdmin: false,
    isBanned: false,
    blustBalance: 0,
    lastBlustClaim: null,
  },
  "sara@example.com": {
    email: "sara@example.com",
    password: "password123",
    profile: {
      name: "سارة عبد الرحمن",
      username: "@sara",
      bio: "مهتمة بالعملات الرقمية وتقنية البلوك تشين.",
      avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    },
    notifications: [],
    isAdmin: false,
    isBanned: false,
    blustBalance: 500,
    lastBlustClaim: "2024-01-01T10:00:00.000Z",
  },
  "mohammed@example.com": {
    email: "mohammed@example.com",
    password: "password123",
    profile: {
      name: "محمد علي",
      username: "@mohammed",
      bio: "متداول يومي ومحلل فني.",
      avatarUrl: "https://i.pravatar.cc/150?u=a04258114e29026702d",
    },
    notifications: [],
    isAdmin: false,
    isBanned: false,
    blustBalance: 2500,
    lastBlustClaim: null,
  },
  "fatima@example.com": {
    email: "fatima@example.com",
    password: "password123",
    profile: {
      name: "فاطمة الزهراء",
      username: "@fatima",
      bio: "مستثمرة طويلة الأجل في العملات الرقمية.",
      avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704e",
    },
    notifications: [],
    isAdmin: false,
    isBanned: false,
    blustBalance: 8000,
    lastBlustClaim: "2024-01-10T12:00:00.000Z",
  },
};
