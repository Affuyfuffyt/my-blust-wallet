// src/lib/posts-data.ts
import type { Post } from './types';

// This is temporary data. In a real app, this would come from a database.
export const posts: Omit<Post, 'author'>[] = [
  {
    id: 1,
    authorUsername: "@sara",
    content: "استكشاف عالم العملات الرقمية يمكن أن يكون مثيراً ومربحاً! اليوم تعلمت عن آلية عمل العقود الذكية.",
    imageUrl: "https://picsum.photos/seed/tech/800/400",
    imageHint: "technology crypto",
    likes: 128,
    likedBy: [],
    comments: [
      {
        id: 101,
        authorUsername: '@mohammed',
        content: 'رائع! العقود الذكية هي المستقبل.',
        createdAt: '2024-01-10T15:12:00.000Z',
        likes: 15,
        likedBy: [],
        replies: [],
      },
    ],
    createdAt: "2024-01-10T14:48:00.000Z",
  },
  {
    id: 2,
    authorUsername: "@mohammed",
    content: "ما هي أفضل استراتيجية للتداول اليومي في رأيكم؟ شاركوني خبراتكم.",
    likes: 95,
    likedBy: [],
    comments: [],
    createdAt: "2024-01-12T10:30:00.000Z",
  },
    {
    id: 3,
    authorUsername: "@fatima",
    content: "نصيحة للمبتدئين: لا تستثمر أكثر مما يمكنك تحمل خسارته. السوق متقلب جداً.",
    imageUrl: "https://picsum.photos/seed/finance/800/400",
    imageHint: "finance money",
    likes: 250,
    likedBy: [],
    comments: [],
    createdAt: "2024-01-15T09:00:00.000Z",
  },
];
