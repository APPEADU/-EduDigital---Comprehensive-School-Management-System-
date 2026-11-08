import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  name?: string,
  role?: string,
  schoolId?: string
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        name: name || '',
        role: role || 'admin',
        schoolId: schoolId || '',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          name: name || '',
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Database user sync failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function getUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Database query failed in getUsers:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}
