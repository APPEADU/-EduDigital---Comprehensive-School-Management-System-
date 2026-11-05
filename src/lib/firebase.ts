import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const BOOTSTRAPPED_ADMIN_EMAIL = 'appeadusolomon65@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isBenignAbortError(error: unknown): boolean {
  if (!error) return false;
  const anyErr = error as { name?: string; code?: string; message?: string };
  if (anyErr.name === 'AbortError' || anyErr.code === 'cancelled' || anyErr.code === 'aborted') {
    return true;
  }
  const msg = error instanceof Error ? error.message : String(anyErr.message ?? error);
  return (
    msg === 'AbortError' ||
    /The user aborted a request|signal is aborted|BodyStreamBuffer was aborted|Fetch is aborted/i.test(msg)
  );
}

export function isTransientOfflineOrTokenError(error: unknown): boolean {
  if (!error) return false;
  const anyErr = error as { code?: string; message?: string };
  if (anyErr.code === 'unavailable' || anyErr.code === 'auth/network-request-failed') {
    return true;
  }
  const msg = error instanceof Error ? error.message : String(anyErr.message ?? error);
  return /the client is offline|Fetching auth token failed|token-service-api|Failed to fetch|network-request-failed/i.test(
    msg
  );
}

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (isBenignAbortError(event.reason)) {
      event.preventDefault();
    }
  });
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (isBenignAbortError(error)) return;
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

export { signInWithPopup, signOut, onAuthStateChanged };
export type { FirebaseUser };
