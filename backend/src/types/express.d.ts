import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      passwordHash: string | null;
      phone: string | null;
      preferredLanguage: string | null;
      provider: string | null;
      providerId: string | null;
      avatarUrl: string | null;
      role: UserRole;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}
