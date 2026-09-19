import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      passwordHash: string;
      role: UserRole;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}
