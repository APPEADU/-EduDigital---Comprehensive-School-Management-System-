import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  DocumentReference,
  DocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import {
  db,
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
  isBenignAbortError,
  isTransientOfflineOrTokenError,
  FirebaseUser,
} from './firebase';
import {
  SchoolProfile,
  AuthorizedSignatory,
  ProfessionalProgramme,
  ProgrammeCourse,
  Student,
  CandidateProfile,
  CandidateCourseAssessment,
  ExamResult,
  FeePayment,
  IssuedCredential,
  GraduateAlumniRecord,
  CertificateReplacementRequest,
  EmployerVerificationLog,
  ResearchArticle,
  RoleType,
  PlatformOwnerProfile,
  formatInstituteLevelShort,
} from '../types';
import { PublicCredentialVerificationResult } from '../context/SchoolContext';

export const DEFAULT_PLATFORM_OWNER_PROFILE: PlatformOwnerProfile = {
  id: 'ownerProfile',
  name: 'Solomon Appeadu',
  roleTitle: 'Platform Owner & Lead Developer',
  subtitle: 'The vision behind an integrated school and professional institution management platform.',
  bio: 'Committed to empowering basic schools, senior high schools, colleges, universities, and professional institutes with a secure, unified digital platform—connecting admissions, continuous assessment, BECE & professional examinations, finance, HR payroll, and verifiable digital credentials in one trusted ecosystem.',
  photoUrl: '/assets/aistudio/PASSPORT_PICTURE_af7dd76f.jpg',
  whatsappNumber: '+233 207 615 941',
  updatedAt: '2026-10-31',
};

// ============================================================================
// DEFENSIVE PAYLOAD SANITIZATION (SYNCED VERBATIM WITH firebase-blueprint.json)
// ============================================================================

const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export const REMOVED_SAMPLE_SCHOOL_IDS = new Set([
  'sch-kri-01',
  'sch-citlfa-04',
  'sch-presec-07',
  'sch-mss-03',
]);

export function isRemovedSampleSchoolId(id?: string | null): boolean {
  if (!id) return false;
  return REMOVED_SAMPLE_SCHOOL_IDS.has(id.trim());
}

export function sanitizeFirestoreId(raw: string, fallbackPrefix = 'id'): string {
  const cleaned = (raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 128);
  if (cleaned.length >= 1 && ID_PATTERN.test(cleaned)) {
    return cleaned;
  }
  return `${fallbackPrefix}-${Date.now()}`;
}

export function clampStr(val: string | undefined | null, minLen: number, maxLen: number, fallback = ''): string {
  const base = (val ?? fallback).toString().trim();
  if (base.length < minLen) {
    const fb = fallback.trim();
    if (fb.length >= minLen) return fb.slice(0, maxLen);
    return base.padEnd(minLen, '_').slice(0, maxLen);
  }
  return base.slice(0, maxLen);
}

export function clampNum(val: number | undefined | null, minVal: number, maxVal: number): number {
  const n = typeof val === 'number' && Number.isFinite(val) ? val : minVal;
  return Math.min(maxVal, Math.max(minVal, n));
}

export function normalizeCertLookupKey(certNumber: string): string {
  return sanitizeFirestoreId(certNumber.trim().toUpperCase(), 'CERT');
}

export function isBootstrappedAdminUser(user: FirebaseUser | null): boolean {
  return Boolean(
    user &&
      user.emailVerified &&
      user.email &&
      user.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
  );
}

function ensureEnum<T extends string>(val: unknown, allowed: readonly T[], fallback: T): T {
  return typeof val === 'string' && (allowed as readonly string[]).includes(val) ? (val as T) : fallback;
}

async function readFreshDoc(ref: DocumentReference<DocumentData>): Promise<DocumentSnapshot<DocumentData>> {
  try {
    return await getDocFromServer(ref);
  } catch (err) {
    if (isBenignAbortError(err)) throw err;
    return await getDoc(ref);
  }
}

async function resolveVerifiedSchoolOwnerUid(safeSchoolId: string, fallbackOwnerUid: string): Promise<string> {
  try {
    const schSnap = await readFreshDoc(doc(db, 'schools', safeSchoolId));
    if (schSnap.exists()) {
      const cloudOwner = schSnap.data()?.ownerUid;
      if (typeof cloudOwner === 'string' && cloudOwner.trim().length > 0) {
        return sanitizeFirestoreId(cloudOwner, fallbackOwnerUid);
      }
    }
  } catch (err) {
    if (isBenignAbortError(err)) throw err;
  }
  return sanitizeFirestoreId(fallbackOwnerUid, 'usr');
}

const VALID_CREDENTIAL_TYPES = [
  'Full Qualification Certificate',
  'Level Completion Certificate',
  'Diploma Certificate',
  'Executive Programme Certificate',
  'Short Course Certificate',
  'Professional Examination Pass Certificate',
  'Official Academic Transcript',
  'Statement of Results',
  'Letter of Completion',
  'Digital Credential Badge',
] as const;

const VALID_CERT_STATUSES = ['Valid', 'Pending Approval', 'Revoked', 'Replaced', 'Expired'] as const;

// ============================================================================
// USER SPLIT PROFILE SYNC (/users/{uid}/public/profile & /users/{uid}/private/info)
// ============================================================================

export async function syncAuthenticatedUserProfile(
  fbUser: FirebaseUser,
  activeSchoolId: string,
  title = 'Verified Portal Member'
): Promise<void> {
  if (!fbUser.emailVerified || !fbUser.email) return;

  const uid = sanitizeFirestoreId(fbUser.uid, 'usr');
  const pubPath = `users/${uid}/public/profile`;
  const privPath = `users/${uid}/private/info`;
  const pubRef = doc(db, 'users', uid, 'public', 'profile');
  const privRef = doc(db, 'users', uid, 'private', 'info');

  const displayName = clampStr(fbUser.displayName || fbUser.email.split('@')[0], 1, 120, 'Portal User');
  const avatar = clampStr(
    fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    1,
    180000,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  );
  const safeSchoolId =
    activeSchoolId && activeSchoolId !== 'sch-uninitialized' && !isRemovedSampleSchoolId(activeSchoolId)
      ? sanitizeFirestoreId(activeSchoolId, 'sch-unassigned')
      : 'sch-unassigned';

  try {
    const existingPub = await getDoc(pubRef);
    if (!existingPub.exists()) {
      await setDoc(pubRef, {
        uid,
        displayName,
        accountTier: 'standard',
        title: clampStr(title, 1, 120, 'Verified Portal Member'),
        avatar,
        activeSchoolId: safeSchoolId,
        updatedByUid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(pubRef, {
        displayName,
        avatar,
        activeSchoolId: safeSchoolId,
        updatedByUid: uid,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    if (isBenignAbortError(error) || isTransientOfflineOrTokenError(error)) return;
    handleFirestoreError(error, OperationType.WRITE, pubPath);
  }

  try {
    const existingPriv = await getDoc(privRef);
    if (!existingPriv.exists()) {
      await setDoc(privRef, {
        uid,
        email: clampStr(fbUser.email, 3, 254, fbUser.email),
        phone: clampStr(fbUser.phoneNumber || '', 0, 40, ''),
        linkedStudentId: '',
        linkedCandidateId: '',
        updatedByUid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    if (isBenignAbortError(error) || isTransientOfflineOrTokenError(error)) return;
    handleFirestoreError(error, OperationType.WRITE, privPath);
  }
}

// ============================================================================
// CLOUD SERIALIZERS (BOUNDED NATIVE MAPS/LISTS — ZERO JSON.stringify)
// ============================================================================

function buildSchoolDocPayload(school: SchoolProfile, ownerUid: string, uid: string, isCreate: boolean) {
  const safeId = sanitizeFirestoreId(school.id, 'sch');
  const modules = (school.enabledModules || ['professional_credentials'])
    .slice(0, 25)
    .map((m) => clampStr(m, 1, 64, 'professional_credentials'));

  const base = {
    id: safeId,
    name: clampStr(school.name, 2, 200, 'Registered Institution'),
    code: clampStr(school.code, 2, 40, 'SCH-GH'),
    motto: clampStr(school.motto, 1, 240, 'Knowledge and Integrity'),
    crest: clampStr(
      school.crest,
      1,
      150000,
      'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=200&q=80'
    ),
    levelType: ensureEnum(
      school.levelType,
      [
        'SHS',
        'Basic & JHS',
        'Combined',
        'Professional Institute',
        'Vocational Training Centre',
        'College / Polytechnic',
        'Executive Education',
      ] as const,
      'Combined'
    ),
    region: clampStr(school.region, 1, 100, 'Greater Accra'),
    district: clampStr(school.district, 1, 120, 'Accra Metro'),
    address: clampStr(school.address, 1, 300, 'Accra, Ghana'),
    officialPhone: clampStr(school.phone, 1, 50, '+233 30 200 0000'),
    whatsappNumber: clampStr(school.whatsappNumber ?? school.phone ?? '', 0, 50, ''),
    whatsappEnabled: school.whatsappEnabled !== false,
    officialEmail: clampStr(school.email, 3, 254, 'registry@institution.edu.gh'),
    currency: clampStr(school.currency, 1, 16, 'GHS'),
    currentAcademicYear: clampStr(school.currentAcademicYear, 4, 32, '2025/2026'),
    currentTerm: ensureEnum(
      school.currentTerm,
      ['Term 1', 'Term 2', 'Term 3', 'Semester 1', 'Semester 2'] as const,
      'Term 1'
    ),
    termStartDate: clampStr(school.termStartDate, 1, 32, '2025-09-09'),
    termEndDate: clampStr(school.termEndDate, 1, 32, '2025-12-18'),
    nextTermBegins: clampStr(school.nextTermBegins, 1, 32, '2026-01-13'),
    headmasterName: clampStr(school.headmasterName, 1, 140, 'Head of Institution'),
    headmasterSignature: clampStr(school.headmasterSignature, 1, 140, school.headmasterName || 'Principal'),
    enabledModules: modules,
    ownerUid: sanitizeFirestoreId(ownerUid, uid),
    updatedByUid: sanitizeFirestoreId(uid, 'usr'),
    isPublic: true,
    updatedAt: serverTimestamp(),
  };

  if (isCreate) {
    return { ...base, createdAt: serverTimestamp() };
  }
  return base;
}

export function mapDocToSchoolProfile(data: Record<string, any>, existing?: SchoolProfile): SchoolProfile {
  return {
    ...(existing || {}),
    id: data.id,
    name: data.name,
    code: data.code,
    motto: data.motto,
    crest: data.crest,
    levelType: data.levelType,
    region: data.region,
    district: data.district,
    address: data.address,
    phone: data.officialPhone || existing?.phone || '',
    whatsappNumber:
      typeof data.whatsappNumber === 'string'
        ? data.whatsappNumber
        : existing?.whatsappNumber || data.officialPhone || '',
    whatsappEnabled:
      typeof data.whatsappEnabled === 'boolean'
        ? data.whatsappEnabled
        : existing?.whatsappEnabled ?? true,
    email: data.officialEmail || existing?.email || '',
    currency: data.currency || 'GHS',
    currentAcademicYear: data.currentAcademicYear || '2025/2026',
    currentTerm: data.currentTerm || 'Term 1',
    termStartDate: data.termStartDate || '2025-09-09',
    termEndDate: data.termEndDate || '2025-12-18',
    nextTermBegins: data.nextTermBegins || '2026-01-13',
    headmasterName: data.headmasterName || 'Head of Institution',
    headmasterSignature: data.headmasterSignature || data.headmasterName || 'Principal',
    enabledModules: Array.isArray(data.enabledModules) ? data.enabledModules : existing?.enabledModules,
    ownerUid: data.ownerUid,
  } as SchoolProfile & { ownerUid?: string };
}

// ============================================================================
// ATOMIC & ENTITY CLOUD MUTATIONS
// ============================================================================

export async function upsertSchoolInCloud(
  school: SchoolProfile,
  ownerUid: string
): Promise<string | null> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return null;

  const schoolId = sanitizeFirestoreId(school.id, 'sch');
  const path = `schools/${schoolId}`;
  const ref = doc(db, 'schools', schoolId);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      if (!isBootstrappedAdminUser(user)) {
        throw new Error('Unauthorized: Only the Platform Administrator can register a new school.');
      }
      await setDoc(ref, buildSchoolDocPayload(school, ownerUid, user.uid, true));
      return user.uid;
    } else {
      const existingOwner = snap.data().ownerUid || ownerUid;
      await updateDoc(ref, {
        name: clampStr(school.name, 2, 200, 'Registered Institution'),
        code: clampStr(school.code, 2, 40, 'SCH-GH'),
        motto: clampStr(school.motto, 1, 240, 'Knowledge and Integrity'),
        crest: clampStr(school.crest, 1, 150000, 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=200&q=80'),
        levelType: ensureEnum(
          school.levelType,
          [
            'SHS',
            'Basic & JHS',
            'Combined',
            'Professional Institute',
            'Vocational Training Centre',
            'College / Polytechnic',
            'Executive Education',
          ] as const,
          'Combined'
        ),
        region: clampStr(school.region, 1, 100, 'Greater Accra'),
        district: clampStr(school.district, 1, 120, 'Accra Metro'),
        address: clampStr(school.address, 1, 300, 'Accra, Ghana'),
        officialPhone: clampStr(school.phone, 1, 50, '+233 30 200 0000'),
        whatsappNumber: clampStr(school.whatsappNumber ?? school.phone ?? '', 0, 50, ''),
        whatsappEnabled: school.whatsappEnabled !== false,
        officialEmail: clampStr(school.email, 3, 254, 'registry@institution.edu.gh'),
        currency: clampStr(school.currency, 1, 16, 'GHS'),
        currentAcademicYear: clampStr(school.currentAcademicYear, 4, 32, '2025/2026'),
        currentTerm: ensureEnum(
          school.currentTerm,
          ['Term 1', 'Term 2', 'Term 3', 'Semester 1', 'Semester 2'] as const,
          'Term 1'
        ),
        termStartDate: clampStr(school.termStartDate, 1, 32, '2025-09-09'),
        termEndDate: clampStr(school.termEndDate, 1, 32, '2025-12-18'),
        nextTermBegins: clampStr(school.nextTermBegins, 1, 32, '2026-01-13'),
        headmasterName: clampStr(school.headmasterName, 1, 140, 'Head of Institution'),
        headmasterSignature: clampStr(school.headmasterSignature, 1, 140, 'Principal'),
        enabledModules: (school.enabledModules || ['professional_credentials'])
          .slice(0, 25)
          .map((m) => clampStr(m, 1, 64, 'professional_credentials')),
        isPublic: true,
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        updatedAt: serverTimestamp(),
      });
      return existingOwner;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

const SCHOOL_SUBCOLLECTIONS = [
  'members',
  'signatories',
  'programmes',
  'courses',
  'students',
  'candidates',
  'assessments',
  'examResults',
  'feePayments',
  'credentials',
  'graduates',
  'replacementRequests',
  'verificationLogs',
] as const;

export async function deleteSchoolInCloud(schoolId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified || !isBootstrappedAdminUser(user)) return;
  const safeId = sanitizeFirestoreId(schoolId, 'sch');
  const path = `schools/${safeId}`;

  try {
    // 1. Cascade-delete all documents in school subcollections
    for (const subCol of SCHOOL_SUBCOLLECTIONS) {
      const subPath = `schools/${safeId}/${subCol}`;
      try {
        const subSnap = await getDocs(collection(db, 'schools', safeId, subCol));
        for (const docSnap of subSnap.docs) {
          await deleteDoc(docSnap.ref);
        }
      } catch (subErr) {
        if (isBenignAbortError(subErr) || isTransientOfflineOrTokenError(subErr)) return;
        handleFirestoreError(subErr, OperationType.DELETE, subPath);
      }
    }

    // 2. Delete associated public projection documents (credentials, graduates, research articles)
    const publicCollections = ['publicCredentials', 'publicGraduates', 'publicArticles'] as const;
    for (const pubCol of publicCollections) {
      try {
        const pubSnap = await getDocs(
          query(collection(db, pubCol), where('schoolId', '==', safeId))
        );
        for (const docSnap of pubSnap.docs) {
          await deleteDoc(docSnap.ref);
        }
      } catch (pubErr) {
        if (isBenignAbortError(pubErr) || isTransientOfflineOrTokenError(pubErr)) return;
        handleFirestoreError(pubErr, OperationType.DELETE, pubCol);
      }
    }

    // 3. Delete root school document
    await deleteDoc(doc(db, 'schools', safeId));
  } catch (error) {
    if (isBenignAbortError(error) || isTransientOfflineOrTokenError(error)) return;
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteSchoolMemberAndProfileInCloud(
  schoolId: string,
  targetUserId: string,
  signatoryIds: string[] = []
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeTargetUid = sanitizeFirestoreId(targetUserId, 'usr');
  const actorUid = sanitizeFirestoreId(user.uid, 'usr');

  // 1. Delete linked digital signatory records in this school
  for (const sigId of signatoryIds) {
    const safeSigId = sanitizeFirestoreId(sigId, 'sig');
    try {
      await deleteDoc(doc(db, 'schools', safeSchoolId, 'signatories', safeSigId));
    } catch (err) {
      if (isBenignAbortError(err) || isTransientOfflineOrTokenError(err)) return;
      handleFirestoreError(err, OperationType.DELETE, `schools/${safeSchoolId}/signatories/${safeSigId}`);
    }
  }

  // 2. Delete institutional membership record in schools/{schoolId}/members/{uid}
  if (safeTargetUid && safeSchoolId !== 'sch-uninitialized') {
    const memberPath = `schools/${safeSchoolId}/members/${safeTargetUid}`;
    try {
      await deleteDoc(doc(db, 'schools', safeSchoolId, 'members', safeTargetUid));
    } catch (err) {
      if (isBenignAbortError(err) || isTransientOfflineOrTokenError(err)) return;
      handleFirestoreError(err, OperationType.DELETE, memberPath);
    }
  }

  // 3. If executed by Platform Admin (and target is not the Platform Admin's own UID), delete split user profile
  if (isBootstrappedAdminUser(user) && safeTargetUid && safeTargetUid !== actorUid) {
    try {
      await deleteDoc(doc(db, 'users', safeTargetUid, 'public', 'profile'));
    } catch (err) {
      if (isBenignAbortError(err) || isTransientOfflineOrTokenError(err)) return;
      handleFirestoreError(err, OperationType.DELETE, `users/${safeTargetUid}/public/profile`);
    }
    try {
      await deleteDoc(doc(db, 'users', safeTargetUid, 'private', 'info'));
    } catch (err) {
      if (isBenignAbortError(err) || isTransientOfflineOrTokenError(err)) return;
      handleFirestoreError(err, OperationType.DELETE, `users/${safeTargetUid}/private/info`);
    }
  }
}

export async function upsertSchoolMemberInCloud(
  schoolId: string,
  schoolOwnerUid: string,
  member: { uid: string; name: string; role: RoleType; title: string; avatar: string }
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeMemberUid = sanitizeFirestoreId(member.uid, 'usr');
  const path = `schools/${safeSchoolId}/members/${safeMemberUid}`;
  const ref = doc(db, 'schools', safeSchoolId, 'members', safeMemberUid);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: safeMemberUid,
        schoolId: safeSchoolId,
        schoolOwnerUid: sanitizeFirestoreId(schoolOwnerUid, user.uid),
        name: clampStr(member.name, 1, 140, 'Portal Member'),
        role: member.role,
        title: clampStr(member.title, 1, 140, 'Member'),
        avatar: clampStr(
          member.avatar,
          1,
          180000,
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
        ),
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        name: clampStr(member.name, 1, 140, 'Portal Member'),
        role: member.role,
        title: clampStr(member.title, 1, 140, 'Member'),
        avatar: clampStr(
          member.avatar,
          1,
          180000,
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
        ),
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertSignatoryInCloud(
  schoolId: string,
  schoolOwnerUid: string,
  sig: AuthorizedSignatory,
  options?: { onlyIfMissing?: boolean }
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeSigId = sanitizeFirestoreId(sig.id, 'sig');
  const path = `schools/${safeSchoolId}/signatories/${safeSigId}`;
  const ref = doc(db, 'schools', safeSchoolId, 'signatories', safeSigId);
  const safeRole = ensureEnum(
    sig.role,
    ['Registrar', 'Head of Institution', 'Academic Dean', 'Chief Examiner', 'Lead Lecturer / Teacher', 'Council Chair'] as const,
    'Registrar'
  );
  const safeMethod = ensureEnum(sig.signatureMethod, ['drawn', 'uploaded'] as const, 'drawn');

  try {
    const snap = await readFreshDoc(ref);
    if (!snap.exists()) {
      const verifiedOwnerUid = await resolveVerifiedSchoolOwnerUid(safeSchoolId, schoolOwnerUid || user.uid);
      await setDoc(ref, {
        id: safeSigId,
        schoolId: safeSchoolId,
        schoolOwnerUid: verifiedOwnerUid,
        authorUid: sanitizeFirestoreId(user.uid, 'usr'),
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        name: clampStr(sig.name, 1, 140, 'Authorised Signatory'),
        title: clampStr(sig.title, 1, 160, 'Registrar'),
        role: safeRole,
        signatureDataUrl: clampStr(sig.signatureDataUrl, 10, 180000, 'data:image/svg+xml;utf8,<svg></svg>'),
        signatureMethod: safeMethod,
        active: Boolean(sig.active),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (!options?.onlyIfMissing) {
      await updateDoc(ref, {
        name: clampStr(sig.name, 1, 140, 'Authorised Signatory'),
        title: clampStr(sig.title, 1, 160, 'Registrar'),
        role: safeRole,
        signatureDataUrl: clampStr(sig.signatureDataUrl, 10, 180000, 'data:image/svg+xml;utf8,<svg></svg>'),
        signatureMethod: safeMethod,
        active: Boolean(sig.active),
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    if (isBenignAbortError(error)) return;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSignatoryInCloud(schoolId: string, sigId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeSigId = sanitizeFirestoreId(sigId, 'sig');
  const path = `schools/${safeSchoolId}/signatories/${safeSigId}`;
  try {
    await deleteDoc(doc(db, 'schools', safeSchoolId, 'signatories', safeSigId));
  } catch (error) {
    if (isBenignAbortError(error)) return;
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertProgrammeInCloud(
  schoolId: string,
  schoolOwnerUid: string,
  prog: ProfessionalProgramme,
  options?: { onlyIfMissing?: boolean }
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeProgId = sanitizeFirestoreId(prog.id, 'prog');
  const path = `schools/${safeSchoolId}/programmes/${safeProgId}`;
  const ref = doc(db, 'schools', safeSchoolId, 'programmes', safeProgId);

  const boundedLevels = (prog.levels && prog.levels.length > 0
    ? prog.levels.slice(0, 6)
    : [{ levelNumber: 1, levelTitle: 'Level 1 (Foundation)', creditHoursRequired: 36, passMarkPercent: 50, maxAllowedResits: 3, levelFeeAmount: 1800 }]
  ).map((l) => ({
    levelNumber: clampNum(l.levelNumber, 1, 6),
    levelTitle: clampStr(l.levelTitle, 1, 120, 'Level 1'),
    creditHoursRequired: clampNum(l.creditHoursRequired, 0, 500),
    passMarkPercent: clampNum(l.passMarkPercent, 0, 100),
    maxAllowedResits: clampNum(l.maxAllowedResits, 0, 20),
    levelFeeAmount: clampNum(l.levelFeeAmount, 0, 1000000),
    awardOnLevelCompletion: clampStr(l.awardOnLevelCompletion || '', 0, 160, ''),
  }));

  const safeCategory = ensureEnum(
    prog.category,
    [
      'Professional Qualification',
      'Diploma Programme',
      'Certificate Programme',
      'Executive Education',
      'Vocational & Technical',
      'Short Course',
      'Secondary / Basic Completion',
    ] as const,
    'Certificate Programme'
  );
  const safeAuthModel = ensureEnum(
    prog.awardingAuthorityModel,
    [
      'Institution Direct Award',
      'Affiliated Awarding Body',
      'Dual: Institution Award + Professional Body Designation',
    ] as const,
    'Institution Direct Award'
  );
  const safeProgStatus = ensureEnum(prog.status, ['Active', 'Review', 'Archived'] as const, 'Active');

  try {
    const snap = await readFreshDoc(ref);
    if (!snap.exists()) {
      const verifiedOwnerUid = await resolveVerifiedSchoolOwnerUid(safeSchoolId, schoolOwnerUid || user.uid);
      await setDoc(ref, {
        id: safeProgId,
        schoolId: safeSchoolId,
        schoolOwnerUid: verifiedOwnerUid,
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        code: clampStr(prog.code, 1, 40, 'PROG-01'),
        title: clampStr(prog.title, 2, 220, 'Professional Programme'),
        category: safeCategory,
        qualificationAwarded: clampStr(prog.qualificationAwarded, 2, 240, 'Professional Certificate'),
        professionalDesignation: clampStr(prog.professionalDesignation || '', 0, 200, ''),
        affiliatedProfessionalBody: clampStr(prog.affiliatedProfessionalBody || '', 0, 220, ''),
        awardingAuthorityModel: safeAuthModel,
        durationLabel: clampStr(prog.durationLabel, 1, 80, '12 Months'),
        totalCreditHours: clampNum(prog.totalCreditHours, 0, 2000),
        entryRequirements: clampStr(prog.entryRequirements, 1, 1000, 'Standard entry qualification.'),
        assessmentMethods: clampStr(prog.assessmentMethods, 1, 1000, 'Continuous assessment and final examination.'),
        examinationRegulations: clampStr(prog.examinationRegulations, 1, 1000, 'Standard institutional examination rules.'),
        progressionRules: clampStr(prog.progressionRules, 1, 1000, 'Pass all mandatory courses at each level.'),
        completionRequirements: clampStr(prog.completionRequirements, 1, 1000, 'Complete all required levels and clear fees.'),
        feeClearanceRequired: Boolean(prog.feeClearanceRequired),
        levels: boundedLevels,
        status: safeProgStatus,
        isPublished: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (!options?.onlyIfMissing) {
      await updateDoc(ref, {
        code: clampStr(prog.code, 1, 40, 'PROG-01'),
        title: clampStr(prog.title, 2, 220, 'Professional Programme'),
        category: safeCategory,
        qualificationAwarded: clampStr(prog.qualificationAwarded, 2, 240, 'Professional Certificate'),
        professionalDesignation: clampStr(prog.professionalDesignation || '', 0, 200, ''),
        affiliatedProfessionalBody: clampStr(prog.affiliatedProfessionalBody || '', 0, 220, ''),
        awardingAuthorityModel: safeAuthModel,
        durationLabel: clampStr(prog.durationLabel, 1, 80, '12 Months'),
        totalCreditHours: clampNum(prog.totalCreditHours, 0, 2000),
        entryRequirements: clampStr(prog.entryRequirements, 1, 1000, 'Standard entry qualification.'),
        assessmentMethods: clampStr(prog.assessmentMethods, 1, 1000, 'Continuous assessment and final examination.'),
        examinationRegulations: clampStr(prog.examinationRegulations, 1, 1000, 'Standard institutional examination rules.'),
        progressionRules: clampStr(prog.progressionRules, 1, 1000, 'Pass all mandatory courses at each level.'),
        completionRequirements: clampStr(prog.completionRequirements, 1, 1000, 'Complete all required levels and clear fees.'),
        feeClearanceRequired: Boolean(prog.feeClearanceRequired),
        levels: boundedLevels,
        status: safeProgStatus,
        isPublished: true,
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    if (isBenignAbortError(error)) return;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProgrammeInCloud(schoolId: string, progId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeProgId = sanitizeFirestoreId(progId, 'prog');
  const path = `schools/${safeSchoolId}/programmes/${safeProgId}`;
  try {
    await deleteDoc(doc(db, 'schools', safeSchoolId, 'programmes', safeProgId));
  } catch (error) {
    if (isBenignAbortError(error)) return;
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertCourseInCloud(
  schoolId: string,
  schoolOwnerUid: string,
  course: ProgrammeCourse,
  options?: { onlyIfMissing?: boolean }
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeCourseId = sanitizeFirestoreId(course.id, 'crs');
  const safeProgId = sanitizeFirestoreId(course.programmeId, 'prog');
  const path = `schools/${safeSchoolId}/courses/${safeCourseId}`;
  const ref = doc(db, 'schools', safeSchoolId, 'courses', safeCourseId);

  const safeObjectives = (Array.isArray(course.objectives) ? course.objectives : [])
    .map((obj) => clampStr(obj, 1, 400, 'Course objective'))
    .filter(Boolean)
    .slice(0, 20);
  const safeLevelLabel = clampStr(
    course.levelLabel || formatInstituteLevelShort(course.levelNumber),
    1,
    64,
    'Level 1'
  );
  const safeCourseDetails = clampStr(course.courseDetails || '', 0, 4000, '');
  const safeRationale = clampStr(course.rationale || '', 0, 3000, '');
  const safeFlyerDataUrl = clampStr(course.flyerDataUrl || '', 0, 250000, '');

  try {
    const snap = await readFreshDoc(ref);
    if (!snap.exists()) {
      const verifiedOwnerUid = await resolveVerifiedSchoolOwnerUid(safeSchoolId, schoolOwnerUid || user.uid);
      await setDoc(ref, {
        id: safeCourseId,
        schoolId: safeSchoolId,
        schoolOwnerUid: verifiedOwnerUid,
        programmeId: safeProgId,
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        levelNumber: clampNum(course.levelNumber, 1, 6),
        code: clampStr(course.code, 1, 32, 'CRS-101'),
        title: clampStr(course.title, 2, 200, 'Foundation Course'),
        creditHours: clampNum(course.creditHours, 0, 100),
        lecturerName: clampStr(course.lecturerName, 1, 140, 'Course Lecturer'),
        caWeightPercent: clampNum(course.caWeightPercent, 0, 100),
        practicalWeightPercent: clampNum(course.practicalWeightPercent, 0, 100),
        examWeightPercent: clampNum(course.examWeightPercent, 0, 100),
        isMandatory: Boolean(course.isMandatory),
        examScheduleDate: clampStr(course.examScheduleDate || '', 0, 40, ''),
        semesterOrDiet: clampStr(course.semesterOrDiet, 1, 80, 'Examination Diet'),
        levelLabel: safeLevelLabel,
        courseDetails: safeCourseDetails,
        rationale: safeRationale,
        objectives: safeObjectives,
        flyerDataUrl: safeFlyerDataUrl,
        isPublished: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (!options?.onlyIfMissing) {
      await updateDoc(ref, {
        levelNumber: clampNum(course.levelNumber, 1, 6),
        code: clampStr(course.code, 1, 32, 'CRS-101'),
        title: clampStr(course.title, 2, 200, 'Foundation Course'),
        creditHours: clampNum(course.creditHours, 0, 100),
        lecturerName: clampStr(course.lecturerName, 1, 140, 'Course Lecturer'),
        caWeightPercent: clampNum(course.caWeightPercent, 0, 100),
        practicalWeightPercent: clampNum(course.practicalWeightPercent, 0, 100),
        examWeightPercent: clampNum(course.examWeightPercent, 0, 100),
        isMandatory: Boolean(course.isMandatory),
        examScheduleDate: clampStr(course.examScheduleDate || '', 0, 40, ''),
        semesterOrDiet: clampStr(course.semesterOrDiet, 1, 80, 'Examination Diet'),
        levelLabel: safeLevelLabel,
        courseDetails: safeCourseDetails,
        rationale: safeRationale,
        objectives: safeObjectives,
        flyerDataUrl: safeFlyerDataUrl,
        isPublished: true,
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    if (isBenignAbortError(error)) return;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCourseInCloud(schoolId: string, courseId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeCourseId = sanitizeFirestoreId(courseId, 'crs');
  const path = `schools/${safeSchoolId}/courses/${safeCourseId}`;
  try {
    await deleteDoc(doc(db, 'schools', safeSchoolId, 'courses', safeCourseId));
  } catch (error) {
    if (isBenignAbortError(error)) return;
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertStudentInCloud(
  schoolId: string,
  schoolOwnerUid: string,
  student: Student,
  studentEmail?: string,
  options?: { onlyIfMissing?: boolean }
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeStuId = sanitizeFirestoreId(student.id, 'stu');
  const path = `schools/${safeSchoolId}/students/${safeStuId}`;
  const ref = doc(db, 'schools', safeSchoolId, 'students', safeStuId);
  const derivedEmail = (
    studentEmail ||
    `${student.firstName.toLowerCase().replace(/\s+/g, '.')}.${student.lastName.toLowerCase().replace(/\s+/g, '.')}@student.edu.gh`
  ).toLowerCase();
  const safeGender = ensureEnum(student.gender, ['Male', 'Female'] as const, 'Male');
  const safeBoarding = ensureEnum(student.boardingStatus, ['Boarding', 'Day'] as const, 'Day');
  const mappedCloudStatus = student.status === 'Transferred' ? 'Withdrawn' : student.status;
  const safeStuStatus = ensureEnum(mappedCloudStatus, ['Active', 'Withdrawn', 'Graduated', 'Suspended'] as const, 'Active');

  try {
    const snap = await readFreshDoc(ref);
    if (!snap.exists()) {
      const verifiedOwnerUid = await resolveVerifiedSchoolOwnerUid(safeSchoolId, schoolOwnerUid || user.uid);
      await setDoc(ref, {
        id: safeStuId,
        schoolId: safeSchoolId,
        schoolOwnerUid: verifiedOwnerUid,
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        studentNumber: clampStr(student.studentNumber, 2, 64, 'STU-0001'),
        firstName: clampStr(student.firstName, 1, 80, 'Student'),
        lastName: clampStr(student.lastName, 1, 80, 'Learner'),
        otherNames: clampStr(student.otherNames || '', 0, 80, ''),
        gender: safeGender,
        dob: clampStr(student.dob, 1, 32, '2008-01-01'),
        photo: clampStr(
          student.photo,
          1,
          180000,
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        ),
        classId: clampStr(student.classId, 1, 128, 'cls-default'),
        stream: clampStr(student.stream, 1, 80, 'General'),
        boardingStatus: safeBoarding,
        studentEmail: clampStr(derivedEmail, 3, 254, 'student@school.edu.gh'),
        guardianName: clampStr(student.guardianName, 1, 140, 'Guardian'),
        guardianPhone: clampStr(student.guardianPhone || '', 0, 40, ''),
        guardianEmail: clampStr((student.guardianEmail || '').toLowerCase(), 0, 254, ''),
        guardianRelationship: clampStr(student.guardianRelationship || '', 0, 60, ''),
        emergencyContact: clampStr(student.emergencyContact || '', 0, 80, ''),
        medicalInfo: clampStr(student.medicalInfo || '', 0, 500, ''),
        admissionDate: clampStr(student.admissionDate, 1, 32, '2025-09-01'),
        status: safeStuStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (!options?.onlyIfMissing) {
      await updateDoc(ref, {
        studentNumber: clampStr(student.studentNumber, 2, 64, 'STU-0001'),
        firstName: clampStr(student.firstName, 1, 80, 'Student'),
        lastName: clampStr(student.lastName, 1, 80, 'Learner'),
        otherNames: clampStr(student.otherNames || '', 0, 80, ''),
        gender: safeGender,
        dob: clampStr(student.dob, 1, 32, '2008-01-01'),
        photo: clampStr(
          student.photo,
          1,
          180000,
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        ),
        classId: clampStr(student.classId, 1, 128, 'cls-default'),
        stream: clampStr(student.stream, 1, 80, 'General'),
        boardingStatus: safeBoarding,
        studentEmail: clampStr(derivedEmail, 3, 254, 'student@school.edu.gh'),
        guardianName: clampStr(student.guardianName, 1, 140, 'Guardian'),
        guardianPhone: clampStr(student.guardianPhone || '', 0, 40, ''),
        guardianEmail: clampStr((student.guardianEmail || '').toLowerCase(), 0, 254, ''),
        guardianRelationship: clampStr(student.guardianRelationship || '', 0, 60, ''),
        emergencyContact: clampStr(student.emergencyContact || '', 0, 80, ''),
        medicalInfo: clampStr(student.medicalInfo || '', 0, 500, ''),
        status: safeStuStatus,
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    if (isBenignAbortError(error)) return;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStudentInCloud(schoolId: string, studentId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeStuId = sanitizeFirestoreId(studentId, 'stu');
  const path = `schools/${safeSchoolId}/students/${safeStuId}`;
  try {
    await deleteDoc(doc(db, 'schools', safeSchoolId, 'students', safeStuId));
  } catch (error) {
    if (isBenignAbortError(error)) return;
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertCandidateInCloud(
  schoolId: string,
  schoolOwnerUid: string,
  cand: CandidateProfile,
  selfServiceOnly = false,
  options?: { onlyIfMissing?: boolean }
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeCandId = sanitizeFirestoreId(cand.id, 'cand');
  const path = `schools/${safeSchoolId}/candidates/${safeCandId}`;
  const ref = doc(db, 'schools', safeSchoolId, 'candidates', safeCandId);
  const safeGender = ensureEnum(cand.gender, ['Male', 'Female'] as const, 'Male');
  const safeDocType = ensureEnum(
    cand.identityDocumentType,
    ['Ghana Card (NIA)', 'Passport', 'Birth Certificate / GES Index'] as const,
    'Ghana Card (NIA)'
  );
  const safeCandStatus = ensureEnum(
    cand.status,
    ['Active', 'Completed / Graduated', 'Deferred', 'Suspended'] as const,
    'Active'
  );
  const safeMemStatus = ensureEnum(
    cand.membershipStatus,
    [
      'Registered Student Candidate',
      'Affiliate / Technician Member',
      'Graduate Member (Institution Complete)',
      'Associate Member (Awarded by External Professional Body)',
      'Fellow (Awarded by External Professional Body)',
      'Not Applicable (Academic / Vocational Only)',
    ] as const,
    'Registered Student Candidate'
  );

  try {
    const snap = await readFreshDoc(ref);
    if (!snap.exists()) {
      if (selfServiceOnly) return;
      const verifiedOwnerUid = await resolveVerifiedSchoolOwnerUid(safeSchoolId, schoolOwnerUid || user.uid);
      await setDoc(ref, {
        id: safeCandId,
        schoolId: safeSchoolId,
        schoolOwnerUid: verifiedOwnerUid,
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        candidateNumber: clampStr(cand.candidateNumber, 2, 64, 'CAND-0001'),
        firstName: clampStr(cand.firstName, 1, 80, 'Candidate'),
        lastName: clampStr(cand.lastName, 1, 80, 'Member'),
        otherNames: clampStr(cand.otherNames || '', 0, 80, ''),
        gender: safeGender,
        dob: clampStr(cand.dob, 1, 32, '1998-01-01'),
        email: clampStr(cand.email.toLowerCase(), 3, 254, 'candidate@institute.edu.gh'),
        phone: clampStr(cand.phone || '', 0, 40, ''),
        photo: clampStr(
          cand.photo,
          1,
          180000,
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        ),
        nationalIdNumber: clampStr(cand.nationalIdNumber, 1, 64, 'GHA-000000000-0'),
        identityVerified: Boolean(cand.identityVerified),
        identityDocumentType: safeDocType,
        previousQualifications: clampStr(cand.previousQualifications || '', 0, 500, ''),
        programmeId: sanitizeFirestoreId(cand.programmeId, 'prog'),
        currentLevel: clampNum(cand.currentLevel, 1, 6),
        completedLevels: (cand.completedLevels || []).slice(0, 6).map((n) => clampNum(n, 1, 6)),
        enrollmentDate: clampStr(cand.enrollmentDate, 1, 32, '2025-09-01'),
        status: safeCandStatus,
        membershipStatus: safeMemStatus,
        totalFeesBilled: clampNum(cand.totalFeesBilled, 0, 10000000),
        totalFeesPaid: clampNum(cand.totalFeesPaid, 0, 10000000),
        directoryConsent: Boolean(cand.directoryConsent),
        headlineOrRole: clampStr(cand.headlineOrRole || '', 0, 160, ''),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (options?.onlyIfMissing) {
      return;
    } else if (selfServiceOnly) {
      await updateDoc(ref, {
        phone: clampStr(cand.phone || '', 0, 40, ''),
        directoryConsent: Boolean(cand.directoryConsent),
        headlineOrRole: clampStr(cand.headlineOrRole || '', 0, 160, ''),
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        firstName: clampStr(cand.firstName, 1, 80, 'Candidate'),
        lastName: clampStr(cand.lastName, 1, 80, 'Member'),
        otherNames: clampStr(cand.otherNames || '', 0, 80, ''),
        phone: clampStr(cand.phone || '', 0, 40, ''),
        photo: clampStr(
          cand.photo,
          1,
          180000,
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        ),
        identityVerified: Boolean(cand.identityVerified),
        previousQualifications: clampStr(cand.previousQualifications || '', 0, 500, ''),
        currentLevel: clampNum(cand.currentLevel, 1, 6),
        completedLevels: (cand.completedLevels || []).slice(0, 6).map((n) => clampNum(n, 1, 6)),
        status: safeCandStatus,
        membershipStatus: safeMemStatus,
        totalFeesBilled: clampNum(cand.totalFeesBilled, 0, 10000000),
        totalFeesPaid: clampNum(cand.totalFeesPaid, 0, 10000000),
        directoryConsent: Boolean(cand.directoryConsent),
        headlineOrRole: clampStr(cand.headlineOrRole || '', 0, 160, ''),
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    if (isBenignAbortError(error)) return;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertAssessmentInCloud(
  schoolId: string,
  schoolOwnerUid: string,
  ass: CandidateCourseAssessment,
  candidateEmail: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeAssId = sanitizeFirestoreId(ass.id, 'ass');
  const path = `schools/${safeSchoolId}/assessments/${safeAssId}`;
  const ref = doc(db, 'schools', safeSchoolId, 'assessments', safeAssId);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: safeAssId,
        schoolId: safeSchoolId,
        schoolOwnerUid: sanitizeFirestoreId(schoolOwnerUid, user.uid),
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        candidateId: sanitizeFirestoreId(ass.candidateId, 'cand'),
        candidateEmail: clampStr(candidateEmail.toLowerCase(), 3, 254, 'candidate@institute.edu.gh'),
        programmeId: sanitizeFirestoreId(ass.programmeId, 'prog'),
        courseId: sanitizeFirestoreId(ass.courseId, 'crs'),
        levelNumber: clampNum(ass.levelNumber, 1, 6),
        examDiet: clampStr(ass.examDiet, 1, 80, 'Examination Diet'),
        attendancePercent: clampNum(ass.attendancePercent, 0, 100),
        caScore: clampNum(ass.caScore, 0, 100),
        practicalScore: clampNum(ass.practicalScore, 0, 100),
        examScore: clampNum(ass.examScore, 0, 100),
        totalScore: clampNum(ass.totalScore, 0, 100),
        grade: clampStr(ass.grade, 1, 16, 'Pass'),
        paperStatus: ass.paperStatus,
        exemptionBasis: clampStr(ass.exemptionBasis || '', 0, 240, ''),
        moderated: Boolean(ass.moderated),
        resitAttemptCount: clampNum(ass.resitAttemptCount, 0, 20),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        examDiet: clampStr(ass.examDiet, 1, 80, 'Examination Diet'),
        attendancePercent: clampNum(ass.attendancePercent, 0, 100),
        caScore: clampNum(ass.caScore, 0, 100),
        practicalScore: clampNum(ass.practicalScore, 0, 100),
        examScore: clampNum(ass.examScore, 0, 100),
        totalScore: clampNum(ass.totalScore, 0, 100),
        grade: clampStr(ass.grade, 1, 16, 'Pass'),
        paperStatus: ass.paperStatus,
        exemptionBasis: clampStr(ass.exemptionBasis || '', 0, 240, ''),
        moderated: Boolean(ass.moderated),
        resitAttemptCount: clampNum(ass.resitAttemptCount, 0, 20),
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertExamResultInCloud(
  schoolId: string,
  schoolOwnerUid: string,
  res: ExamResult,
  studentEmail: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeResId = sanitizeFirestoreId(res.id, 'res');
  const path = `schools/${safeSchoolId}/examResults/${safeResId}`;
  const ref = doc(db, 'schools', safeSchoolId, 'examResults', safeResId);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: safeResId,
        schoolId: safeSchoolId,
        schoolOwnerUid: sanitizeFirestoreId(schoolOwnerUid, user.uid),
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        studentId: sanitizeFirestoreId(res.studentId, 'stu'),
        studentEmail: clampStr(studentEmail.toLowerCase(), 3, 254, 'student@school.edu.gh'),
        classId: clampStr(res.classId, 1, 128, 'cls-1'),
        subjectId: clampStr(res.subjectId, 1, 128, 'sub-1'),
        term: clampStr(res.term, 1, 32, 'Term 1'),
        academicYear: clampStr(res.academicYear, 4, 32, '2025/2026'),
        classScore: clampNum(res.classScore, 0, 100),
        examScore: clampNum(res.examScore, 0, 100),
        totalScore: clampNum(res.totalScore, 0, 100),
        grade: clampStr(res.grade, 1, 8, 'B2'),
        remarks: clampStr(res.remarks, 1, 80, 'Very Good'),
        verified: Boolean(res.verified),
        published: Boolean(res.published),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        classScore: clampNum(res.classScore, 0, 100),
        examScore: clampNum(res.examScore, 0, 100),
        totalScore: clampNum(res.totalScore, 0, 100),
        grade: clampStr(res.grade, 1, 8, 'B2'),
        remarks: clampStr(res.remarks, 1, 80, 'Very Good'),
        verified: Boolean(res.verified),
        published: Boolean(res.published),
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createFeePaymentInCloud(
  schoolId: string,
  schoolOwnerUid: string,
  payment: FeePayment,
  studentEmail: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safePayId = sanitizeFirestoreId(payment.id, 'pay');
  const path = `schools/${safeSchoolId}/feePayments/${safePayId}`;
  const ref = doc(db, 'schools', safeSchoolId, 'feePayments', safePayId);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: safePayId,
        schoolId: safeSchoolId,
        schoolOwnerUid: sanitizeFirestoreId(schoolOwnerUid, user.uid),
        updatedByUid: sanitizeFirestoreId(user.uid, 'usr'),
        receiptNumber: clampStr(payment.receiptNumber, 2, 64, 'RCP-0001'),
        studentId: sanitizeFirestoreId(payment.studentId, 'stu'),
        studentEmail: clampStr(studentEmail.toLowerCase(), 3, 254, 'student@school.edu.gh'),
        amountPaid: clampNum(payment.amountPaid, 0, 10000000),
        paymentMethod: payment.paymentMethod,
        transactionRef: clampStr(payment.transactionRef, 1, 100, payment.receiptNumber),
        payerName: clampStr(payment.payerName, 1, 140, 'Guardian / Candidate'),
        payerPhone: clampStr(payment.payerPhone || '', 0, 40, ''),
        date: clampStr(payment.date, 1, 32, '2025-10-01'),
        term: clampStr(payment.term, 1, 32, 'Term 1'),
        academicYear: clampStr(payment.academicYear, 4, 32, '2025/2026'),
        status: payment.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Atomic Batch Write enforcing Pillar 7 (existsAfter / getAfter):
 * Simultaneously writes `/schools/{schoolId}/credentials/{credId}` and `/publicCredentials/{lookupKey}`.
 */
export async function issueOrUpdateCredentialAtomicInCloud(
  schoolId: string,
  schoolOwnerUid: string,
  cred: IssuedCredential,
  candidateEmail: string,
  options?: { onlyIfMissing?: boolean }
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeCredId = sanitizeFirestoreId(cred.id, 'cred');
  const baseLookupKey = normalizeCertLookupKey(cred.certificateNumber);

  const credPath = `schools/${safeSchoolId}/credentials/${safeCredId}`;
  const credRef = doc(db, 'schools', safeSchoolId, 'credentials', safeCredId);

  const safeCredType = ensureEnum(cred.credentialType, VALID_CREDENTIAL_TYPES, 'Full Qualification Certificate');
  const safeStatus = ensureEnum(cred.status, VALID_CERT_STATUSES, 'Valid');

  const sigSnapshot = (cred.signatoriesSnapshot && cred.signatoriesSnapshot.length > 0
    ? cred.signatoriesSnapshot.slice(0, 3)
    : [{ name: 'Institutional Registrar', title: 'Registrar', signatureDataUrl: 'data:image/svg+xml;utf8,<svg></svg>' }]
  ).map((s) => ({
    name: clampStr(s.name, 1, 140, 'Registrar'),
    title: clampStr(s.title, 1, 160, 'Registrar'),
    signatureDataUrl: clampStr(s.signatureDataUrl, 10, 180000, 'data:image/svg+xml;utf8,<svg></svg>'),
  }));

  const auditList = (cred.auditTrail && cred.auditTrail.length > 0
    ? cred.auditTrail.slice(-25)
    : [{ id: 'aud-1', timestamp: 'UTC', actorName: 'Registrar', actorRole: 'Registrar', previousStatus: 'Draft', newStatus: safeStatus, reason: 'Issued' }]
  ).map((a) => ({
    id: clampStr(a.id, 1, 80, 'aud-1'),
    timestamp: clampStr(a.timestamp, 1, 40, 'UTC'),
    actorName: clampStr(a.actorName, 1, 140, 'Registrar'),
    actorRole: clampStr(a.actorRole, 1, 100, 'Registrar'),
    previousStatus: clampStr(a.previousStatus, 1, 32, 'Draft'),
    newStatus: ensureEnum(a.newStatus, VALID_CERT_STATUSES, safeStatus),
    reason: clampStr(a.reason, 1, 400, 'Official update'),
  }));

  try {
    const uid = sanitizeFirestoreId(user.uid, 'usr');
    const verifiedOwnerUid = await resolveVerifiedSchoolOwnerUid(safeSchoolId, schoolOwnerUid || uid);

    const existingCredSnap = await readFreshDoc(credRef);
    const credExists = existingCredSnap.exists();

    let effectiveLookupKey =
      credExists && typeof existingCredSnap.data()?.publicLookupKey === 'string'
        ? sanitizeFirestoreId(existingCredSnap.data()!.publicLookupKey, 'CERT')
        : baseLookupKey;

    let pubRef = doc(db, 'publicCredentials', effectiveLookupKey);
    let existingPubSnap = await readFreshDoc(pubRef);

    // Prevent cross-institution serial collision on publicCredentials/{certificateKey}
    if (
      !credExists &&
      existingPubSnap.exists() &&
      (existingPubSnap.data()?.schoolId !== safeSchoolId || existingPubSnap.data()?.credentialId !== safeCredId)
    ) {
      effectiveLookupKey = sanitizeFirestoreId(`${safeSchoolId}-${baseLookupKey}`, 'CERT');
      pubRef = doc(db, 'publicCredentials', effectiveLookupKey);
      existingPubSnap = await readFreshDoc(pubRef);
    }

    const pubExists = existingPubSnap.exists();

    if (options?.onlyIfMissing && credExists && pubExists) {
      return;
    }

    const safeCertNumber = clampStr(cred.certificateNumber, 3, 80, effectiveLookupKey);
    const safeVrfCode = clampStr(cred.verificationCode, 3, 64, 'VRF-DEFAULT');
    const safeSchoolName = clampStr(cred.schoolName, 2, 200, 'Registered Institution');
    const safeSchoolCode = clampStr(cred.schoolCode, 2, 40, 'SCH-GH');
    const safeSchoolCrest = clampStr(
      cred.schoolCrest,
      1,
      150000,
      'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=200&q=80'
    );
    const safeAuthorityName = clampStr(cred.awardingAuthorityName, 2, 220, safeSchoolName);

    const batch = writeBatch(db);

    if (!credExists) {
      batch.set(credRef, {
        id: safeCredId,
        publicLookupKey: effectiveLookupKey,
        schoolId: safeSchoolId,
        schoolOwnerUid: verifiedOwnerUid,
        updatedByUid: uid,
        schoolName: safeSchoolName,
        schoolCode: safeSchoolCode,
        schoolCrest: safeSchoolCrest,
        certificateNumber: safeCertNumber,
        verificationCode: safeVrfCode,
        candidateId: sanitizeFirestoreId(cred.candidateId, 'cand'),
        candidateEmail: clampStr(candidateEmail.toLowerCase(), 3, 254, 'graduate@institute.edu.gh'),
        candidateNumber: clampStr(cred.candidateNumber, 2, 64, 'CAND-0001'),
        recipientFullName: clampStr(cred.recipientFullName, 2, 180, 'Graduate'),
        programmeId: clampStr(cred.programmeId, 1, 128, 'prog-default'),
        programmeTitle: clampStr(cred.programmeTitle, 2, 220, 'Programme'),
        credentialType: safeCredType,
        qualificationAwarded: clampStr(cred.qualificationAwarded, 2, 240, 'Qualification'),
        levelCompletedLabel: clampStr(cred.levelCompletedLabel, 1, 160, 'Full Programme'),
        honoursOrDistinction: clampStr(cred.honoursOrDistinction || '', 0, 80, ''),
        creditHoursCompleted: clampNum(cred.creditHoursCompleted, 0, 2000),
        issueDate: clampStr(cred.issueDate, 1, 32, '2025-10-01'),
        expiryDate: clampStr(cred.expiryDate || '', 0, 32, ''),
        status: safeStatus,
        replacedByCertificateNumber: clampStr(cred.replacedByCertificateNumber || '', 0, 80, ''),
        revocationOrStatusReason: clampStr(cred.revocationOrStatusReason || '', 0, 400, ''),
        awardingAuthorityName: safeAuthorityName,
        professionalBodyAffiliationNote: clampStr(cred.professionalBodyAffiliationNote || '', 0, 400, ''),
        templateId: clampStr(cred.templateId, 1, 128, 'tpl-default'),
        signatoriesSnapshot: sigSnapshot,
        auditTrail: auditList,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(credRef, {
        status: safeStatus,
        replacedByCertificateNumber: clampStr(cred.replacedByCertificateNumber || '', 0, 80, ''),
        revocationOrStatusReason: clampStr(cred.revocationOrStatusReason || '', 0, 400, ''),
        auditTrail: auditList,
        updatedByUid: uid,
        updatedAt: serverTimestamp(),
      });
    }

    if (!pubExists) {
      batch.set(pubRef, {
        certificateKey: effectiveLookupKey,
        credentialId: safeCredId,
        schoolId: safeSchoolId,
        updatedByUid: uid,
        certificateNumber: safeCertNumber,
        verificationCode: safeVrfCode,
        recipientFullName: clampStr(cred.recipientFullName, 2, 180, 'Graduate'),
        candidateNumber: clampStr(cred.candidateNumber, 2, 64, 'CAND-0001'),
        issuingInstitutionName: safeSchoolName,
        issuingInstitutionCode: safeSchoolCode,
        issuingInstitutionCrest: safeSchoolCrest,
        awardingAuthorityName: safeAuthorityName,
        professionalBodyAffiliationNote: clampStr(cred.professionalBodyAffiliationNote || '', 0, 400, ''),
        credentialType: safeCredType,
        programmeTitle: clampStr(cred.programmeTitle, 2, 220, 'Programme'),
        qualificationAwarded: clampStr(cred.qualificationAwarded, 2, 240, 'Qualification'),
        levelCompletedLabel: clampStr(cred.levelCompletedLabel, 1, 160, 'Full Programme'),
        honoursOrDistinction: clampStr(cred.honoursOrDistinction || '', 0, 80, ''),
        issueDate: clampStr(cred.issueDate, 1, 32, '2025-10-01'),
        expiryDate: clampStr(cred.expiryDate || '', 0, 32, ''),
        status: safeStatus,
        replacedByCertificateNumber: clampStr(cred.replacedByCertificateNumber || '', 0, 80, ''),
        revocationOrStatusReason: clampStr(cred.revocationOrStatusReason || '', 0, 400, ''),
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(pubRef, {
        status: safeStatus,
        replacedByCertificateNumber: clampStr(cred.replacedByCertificateNumber || '', 0, 80, ''),
        revocationOrStatusReason: clampStr(cred.revocationOrStatusReason || '', 0, 400, ''),
        updatedByUid: uid,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    if (isBenignAbortError(error)) return;
    handleFirestoreError(error, OperationType.WRITE, credPath);
  }
}

export async function upsertGraduateInCloud(
  schoolId: string,
  schoolOwnerUid: string,
  schoolName: string,
  schoolCode: string,
  grad: GraduateAlumniRecord,
  selfServiceOnly = false,
  options?: { onlyIfMissing?: boolean }
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeGradId = sanitizeFirestoreId(grad.id, 'grad');
  const path = `schools/${safeSchoolId}/graduates/${safeGradId}`;
  const ref = doc(db, 'schools', safeSchoolId, 'graduates', safeGradId);
  const pubRef = doc(db, 'publicGraduates', safeGradId);
  const uid = sanitizeFirestoreId(user.uid, 'usr');
  const safeCertStatus = ensureEnum(grad.certificateStatus, VALID_CERT_STATUSES, 'Valid');

  try {
    const snap = await readFreshDoc(ref);
    if (!snap.exists()) {
      if (selfServiceOnly) return;
      const verifiedOwnerUid = await resolveVerifiedSchoolOwnerUid(safeSchoolId, schoolOwnerUid || uid);
      await setDoc(ref, {
        id: safeGradId,
        schoolId: safeSchoolId,
        schoolOwnerUid: verifiedOwnerUid,
        updatedByUid: uid,
        candidateId: clampStr(grad.candidateId, 1, 128, 'cand-1'),
        candidateNumber: clampStr(grad.candidateNumber, 2, 64, 'CAND-001'),
        fullName: clampStr(grad.fullName, 2, 180, 'Graduate'),
        email: clampStr(grad.email.toLowerCase(), 3, 254, 'alumni@institute.edu.gh'),
        phone: clampStr(grad.phone || '', 0, 40, ''),
        photo: clampStr(
          grad.photo,
          1,
          180000,
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        ),
        programmeId: clampStr(grad.programmeId, 1, 128, 'prog-1'),
        programmeTitle: clampStr(grad.programmeTitle, 2, 220, 'Programme'),
        qualificationAwarded: clampStr(grad.qualificationAwarded, 2, 240, 'Qualification'),
        levelAttained: clampStr(grad.levelAttained, 1, 160, 'Full Programme'),
        graduationYear: clampNum(grad.graduationYear, 1950, 2100),
        completionApprovedDate: clampStr(grad.completionApprovedDate, 1, 32, '2025-10-01'),
        certificateNumber: clampStr(grad.certificateNumber, 3, 80, 'CERT-001'),
        verificationCode: clampStr(grad.verificationCode, 3, 64, 'VRF-001'),
        certificateStatus: safeCertStatus,
        membershipStatus: clampStr(grad.membershipStatus, 1, 80, 'Graduate Member (Institution Complete)'),
        directoryConsent: Boolean(grad.directoryConsent),
        currentEmployerOrRole: clampStr(grad.currentEmployerOrRole || '', 0, 160, ''),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (options?.onlyIfMissing) {
      // Still ensure publicGraduates projection exists if consented
      if (grad.directoryConsent && safeCertStatus === 'Valid') {
        const pubSnap = await readFreshDoc(pubRef);
        if (!pubSnap.exists()) {
          await setDoc(pubRef, {
            id: safeGradId,
            schoolId: safeSchoolId,
            updatedByUid: uid,
            institutionName: clampStr(schoolName, 2, 200, 'Registered Institution'),
            institutionCode: clampStr(schoolCode, 2, 40, 'SCH-GH'),
            candidateNumber: clampStr(grad.candidateNumber, 2, 64, 'CAND-001'),
            fullName: clampStr(grad.fullName, 2, 180, 'Graduate'),
            photo: clampStr(
              grad.photo,
              1,
              180000,
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
            ),
            programmeTitle: clampStr(grad.programmeTitle, 2, 220, 'Programme'),
            qualificationAwarded: clampStr(grad.qualificationAwarded, 2, 240, 'Qualification'),
            levelAttained: clampStr(grad.levelAttained, 1, 160, 'Full Programme'),
            graduationYear: clampNum(grad.graduationYear, 1950, 2100),
            certificateNumber: clampStr(grad.certificateNumber, 3, 80, 'CERT-001'),
            verificationCode: clampStr(grad.verificationCode, 3, 64, 'VRF-001'),
            certificateStatus: 'Valid',
            membershipStatus: clampStr(grad.membershipStatus, 1, 80, 'Graduate Member (Institution Complete)'),
            currentEmployerOrRole: clampStr(grad.currentEmployerOrRole || '', 0, 160, ''),
            directoryConsent: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
      return;
    } else if (selfServiceOnly) {
      await updateDoc(ref, {
        phone: clampStr(grad.phone || '', 0, 40, ''),
        directoryConsent: Boolean(grad.directoryConsent),
        currentEmployerOrRole: clampStr(grad.currentEmployerOrRole || '', 0, 160, ''),
        updatedByUid: uid,
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        fullName: clampStr(grad.fullName, 2, 180, 'Graduate'),
        email: clampStr(grad.email.toLowerCase(), 3, 254, 'alumni@institute.edu.gh'),
        phone: clampStr(grad.phone || '', 0, 40, ''),
        photo: clampStr(
          grad.photo,
          1,
          180000,
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        ),
        certificateNumber: clampStr(grad.certificateNumber, 3, 80, 'CERT-001'),
        verificationCode: clampStr(grad.verificationCode, 3, 64, 'VRF-001'),
        certificateStatus: safeCertStatus,
        membershipStatus: clampStr(grad.membershipStatus, 1, 80, 'Graduate Member (Institution Complete)'),
        directoryConsent: Boolean(grad.directoryConsent),
        currentEmployerOrRole: clampStr(grad.currentEmployerOrRole || '', 0, 160, ''),
        updatedByUid: uid,
        updatedAt: serverTimestamp(),
      });
    }

    // Sync consent-based public graduate directory (strictly non-PII)
    if (!selfServiceOnly) {
      const pubSnap = await readFreshDoc(pubRef);
      if (grad.directoryConsent && safeCertStatus === 'Valid') {
        if (!pubSnap.exists()) {
          await setDoc(pubRef, {
            id: safeGradId,
            schoolId: safeSchoolId,
            updatedByUid: uid,
            institutionName: clampStr(schoolName, 2, 200, 'Registered Institution'),
            institutionCode: clampStr(schoolCode, 2, 40, 'SCH-GH'),
            candidateNumber: clampStr(grad.candidateNumber, 2, 64, 'CAND-001'),
            fullName: clampStr(grad.fullName, 2, 180, 'Graduate'),
            photo: clampStr(
              grad.photo,
              1,
              180000,
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
            ),
            programmeTitle: clampStr(grad.programmeTitle, 2, 220, 'Programme'),
            qualificationAwarded: clampStr(grad.qualificationAwarded, 2, 240, 'Qualification'),
            levelAttained: clampStr(grad.levelAttained, 1, 160, 'Full Programme'),
            graduationYear: clampNum(grad.graduationYear, 1950, 2100),
            certificateNumber: clampStr(grad.certificateNumber, 3, 80, 'CERT-001'),
            verificationCode: clampStr(grad.verificationCode, 3, 64, 'VRF-001'),
            certificateStatus: 'Valid',
            membershipStatus: clampStr(grad.membershipStatus, 1, 80, 'Graduate Member (Institution Complete)'),
            currentEmployerOrRole: clampStr(grad.currentEmployerOrRole || '', 0, 160, ''),
            directoryConsent: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(pubRef, {
            fullName: clampStr(grad.fullName, 2, 180, 'Graduate'),
            photo: clampStr(
              grad.photo,
              1,
              180000,
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
            ),
            certificateNumber: clampStr(grad.certificateNumber, 3, 80, 'CERT-001'),
            verificationCode: clampStr(grad.verificationCode, 3, 64, 'VRF-001'),
            membershipStatus: clampStr(grad.membershipStatus, 1, 80, 'Graduate Member (Institution Complete)'),
            currentEmployerOrRole: clampStr(grad.currentEmployerOrRole || '', 0, 160, ''),
            updatedByUid: uid,
            updatedAt: serverTimestamp(),
          });
        }
      } else if (pubSnap.exists()) {
        await deleteDoc(pubRef);
      }
    }
  } catch (error) {
    if (isBenignAbortError(error)) return;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createReplacementRequestInCloud(
  schoolId: string,
  schoolOwnerUid: string,
  req: CertificateReplacementRequest
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified || !schoolOwnerUid) return;

  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeReqId = sanitizeFirestoreId(req.id, 'rep');
  const path = `schools/${safeSchoolId}/replacementRequests/${safeReqId}`;
  const ref = doc(db, 'schools', safeSchoolId, 'replacementRequests', safeReqId);
  const uid = sanitizeFirestoreId(user.uid, 'usr');

  try {
    await setDoc(ref, {
      id: safeReqId,
      schoolId: safeSchoolId,
      schoolOwnerUid: sanitizeFirestoreId(schoolOwnerUid, uid),
      requesterUid: uid,
      updatedByUid: uid,
      candidateId: clampStr(req.candidateId, 1, 128, 'cand-1'),
      originalCertificateId: clampStr(req.originalCertificateId, 1, 128, 'cred-1'),
      originalCertificateNumber: clampStr(req.originalCertificateNumber, 3, 80, 'CERT-001'),
      requesterName: clampStr(req.requesterName, 2, 180, 'Graduate'),
      reason: req.reason,
      details: clampStr(req.details, 1, 600, 'Replacement certificate requested.'),
      requestedDate: clampStr(req.requestedDate, 1, 32, '2025-10-01'),
      status: 'Pending Review',
      newCertificateNumber: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateReplacementRequestInCloud(
  schoolId: string,
  req: CertificateReplacementRequest
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeReqId = sanitizeFirestoreId(req.id, 'rep');
  const path = `schools/${safeSchoolId}/replacementRequests/${safeReqId}`;
  const ref = doc(db, 'schools', safeSchoolId, 'replacementRequests', safeReqId);
  const uid = sanitizeFirestoreId(user.uid, 'usr');

  try {
    await updateDoc(ref, {
      status: req.status,
      newCertificateNumber: clampStr(req.newCertificateNumber || '', 0, 80, ''),
      updatedByUid: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createVerificationLogInCloud(
  schoolId: string,
  schoolOwnerUid: string,
  log: EmployerVerificationLog
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified || !schoolOwnerUid) return;

  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeLogId = sanitizeFirestoreId(log.id, 'vlog');
  const path = `schools/${safeSchoolId}/verificationLogs/${safeLogId}`;
  const ref = doc(db, 'schools', safeSchoolId, 'verificationLogs', safeLogId);
  const uid = sanitizeFirestoreId(user.uid, 'usr');

  try {
    await setDoc(ref, {
      id: safeLogId,
      schoolId: safeSchoolId,
      schoolOwnerUid: sanitizeFirestoreId(schoolOwnerUid, uid),
      verifierUid: uid,
      timestamp: clampStr(log.timestamp, 1, 40, 'UTC'),
      queriedReference: clampStr(log.queriedReference, 1, 100, 'REF'),
      matchedCertificateNumber: clampStr(log.matchedCertificateNumber || '', 0, 80, ''),
      recipientName: clampStr(log.recipientName || '', 0, 180, ''),
      verifierOrganization: clampStr(log.verifierOrganization, 1, 180, 'Public Portal'),
      verifierContactName: clampStr(log.verifierContactName, 1, 140, 'Verifier'),
      verificationPurpose: clampStr(log.verificationPurpose, 1, 200, 'Credential Check'),
      lookupMode: log.lookupMode,
      resultStatus: log.resultStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function upsertResearchArticleInCloud(
  schoolId: string,
  schoolOwnerUid: string,
  article: ResearchArticle,
  options?: { onlyIfMissing?: boolean }
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeSchoolId = sanitizeFirestoreId(schoolId, 'sch');
  const safeArtId = sanitizeFirestoreId(article.id, 'art');
  const path = `publicArticles/${safeArtId}`;
  const ref = doc(db, 'publicArticles', safeArtId);
  const uid = sanitizeFirestoreId(user.uid, 'usr');

  const safeAuthors = (article.authors && article.authors.length > 0
    ? article.authors.slice(0, 10)
    : [{ name: 'Institutional Researcher', role: 'Faculty', affiliation: 'Academic Press' }]
  ).map((a) => ({
    name: clampStr(a.name, 1, 120, 'Author'),
    role: clampStr(a.role, 1, 100, 'Faculty'),
    affiliation: clampStr(a.affiliation, 1, 160, 'Institution'),
    isCorresponding: Boolean(a.isCorresponding),
  }));

  const safeKeywords = (article.keywords && article.keywords.length > 0
    ? article.keywords.slice(0, 12)
    : ['Education']
  ).map((k) => clampStr(k, 1, 60, 'Research'));

  const safeSections = (article.sections && article.sections.length > 0
    ? article.sections.slice(0, 15)
    : [{ heading: 'Introduction', content: article.abstract }]
  ).map((s) => ({
    heading: clampStr(s.heading, 1, 160, 'Section'),
    content: clampStr(s.content, 1, 8000, 'Content'),
  }));

  const safeRefs = (article.references || []).slice(0, 30).map((r) => clampStr(r, 1, 500, 'Reference'));
  const safeArtCat = ensureEnum(
    article.category,
    [
      'STEM & Applied Science',
      'Education & Pedagogy',
      'African History & Heritage',
      'Environmental & Climate Studies',
      'Economics & Commerce',
      'ICT, AI & Robotics',
      'Literature & Cultural Studies',
    ] as const,
    'STEM & Applied Science'
  );
  const safeArtStatus = ensureEnum(
    article.status,
    ['Published Open Access', 'Peer Reviewed', 'Faculty Working Paper', 'Student Capstone', 'Under Review'] as const,
    'Published Open Access'
  );

  try {
    const snap = await readFreshDoc(ref);
    if (!snap.exists()) {
      const verifiedOwnerUid = await resolveVerifiedSchoolOwnerUid(safeSchoolId, schoolOwnerUid || uid);
      await setDoc(ref, {
        id: safeArtId,
        schoolId: safeSchoolId,
        schoolOwnerUid: verifiedOwnerUid,
        authorUid: uid,
        updatedByUid: uid,
        title: clampStr(article.title, 3, 300, 'Academic Research Article'),
        subtitle: clampStr(article.subtitle || '', 0, 300, ''),
        abstract: clampStr(article.abstract, 10, 4000, 'Peer-reviewed institutional research summary.'),
        authors: safeAuthors,
        category: safeArtCat,
        keywords: safeKeywords,
        publicationDate: clampStr(article.publicationDate, 1, 32, '2025-10-01'),
        volume: clampStr(article.volume, 1, 80, 'Vol. 1, Issue 1'),
        doi: clampStr(article.doi, 3, 120, '10.5281/edudigital.2025.100'),
        status: safeArtStatus,
        viewsCount: clampNum(article.viewsCount, 0, 100000000),
        downloadsCount: clampNum(article.downloadsCount, 0, 100000000),
        citationsCount: clampNum(article.citationsCount, 0, 100000000),
        license: clampStr(article.license, 2, 120, 'CC BY 4.0 Open Access'),
        sections: safeSections,
        references: safeRefs,
        isOpenToPublic: Boolean(article.isOpenToPublic),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (!options?.onlyIfMissing) {
      await updateDoc(ref, {
        title: clampStr(article.title, 3, 300, 'Academic Research Article'),
        subtitle: clampStr(article.subtitle || '', 0, 300, ''),
        abstract: clampStr(article.abstract, 10, 4000, 'Peer-reviewed institutional research summary.'),
        authors: safeAuthors,
        category: safeArtCat,
        keywords: safeKeywords,
        status: safeArtStatus,
        sections: safeSections,
        references: safeRefs,
        isOpenToPublic: Boolean(article.isOpenToPublic),
        viewsCount: clampNum(article.viewsCount, 0, 100000000),
        downloadsCount: clampNum(article.downloadsCount, 0, 100000000),
        citationsCount: clampNum(article.citationsCount, 0, 100000000),
        updatedByUid: uid,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    if (isBenignAbortError(error)) return;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function incrementArticleMetricInCloud(
  articleId: string,
  field: 'viewsCount' | 'downloadsCount' | 'citationsCount'
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeArtId = sanitizeFirestoreId(articleId, 'art');
  const path = `publicArticles/${safeArtId}`;
  const ref = doc(db, 'publicArticles', safeArtId);
  const uid = sanitizeFirestoreId(user.uid, 'usr');

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    await updateDoc(ref, {
      viewsCount: field === 'viewsCount' ? (data.viewsCount || 0) + 1 : data.viewsCount || 0,
      downloadsCount: field === 'downloadsCount' ? (data.downloadsCount || 0) + 1 : data.downloadsCount || 0,
      citationsCount: field === 'citationsCount' ? (data.citationsCount || 0) + 1 : data.citationsCount || 0,
      updatedByUid: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteResearchArticleInCloud(articleId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const safeArtId = sanitizeFirestoreId(articleId, 'art');
  const path = `publicArticles/${safeArtId}`;
  try {
    await deleteDoc(doc(db, 'publicArticles', safeArtId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// PUBLIC UN-AUTHENTICATED & AUTHENTICATED CLOUD FETCHERS / LISTENERS
// ============================================================================

export async function upsertPlatformOwnerProfileInCloud(
  profile: PlatformOwnerProfile
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified || !isBootstrappedAdminUser(user)) return;

  const path = 'platformSettings/ownerProfile';
  const ref = doc(db, 'platformSettings', 'ownerProfile');
  const uid = sanitizeFirestoreId(user.uid, 'usr');

  const payload = {
    id: 'ownerProfile',
    name: clampStr(profile.name, 2, 140, DEFAULT_PLATFORM_OWNER_PROFILE.name),
    roleTitle: clampStr(profile.roleTitle, 2, 140, DEFAULT_PLATFORM_OWNER_PROFILE.roleTitle),
    subtitle: clampStr(profile.subtitle, 2, 260, DEFAULT_PLATFORM_OWNER_PROFILE.subtitle),
    bio: clampStr(profile.bio, 10, 1500, DEFAULT_PLATFORM_OWNER_PROFILE.bio),
    photoUrl: clampStr(profile.photoUrl, 1, 180000, DEFAULT_PLATFORM_OWNER_PROFILE.photoUrl),
    whatsappNumber: clampStr(profile.whatsappNumber, 3, 50, DEFAULT_PLATFORM_OWNER_PROFILE.whatsappNumber),
    isPublic: true,
    updatedByUid: uid,
    updatedAt: serverTimestamp(),
  };

  try {
    const snap = await readFreshDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, payload);
    }
  } catch (error) {
    if (isBenignAbortError(error) || isTransientOfflineOrTokenError(error)) return;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchPlatformOwnerProfileFromCloud(): Promise<PlatformOwnerProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'platformSettings', 'ownerProfile'));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      id: 'ownerProfile',
      name: typeof d.name === 'string' && d.name ? d.name : DEFAULT_PLATFORM_OWNER_PROFILE.name,
      roleTitle: typeof d.roleTitle === 'string' && d.roleTitle ? d.roleTitle : DEFAULT_PLATFORM_OWNER_PROFILE.roleTitle,
      subtitle: typeof d.subtitle === 'string' && d.subtitle ? d.subtitle : DEFAULT_PLATFORM_OWNER_PROFILE.subtitle,
      bio: typeof d.bio === 'string' && d.bio ? d.bio : DEFAULT_PLATFORM_OWNER_PROFILE.bio,
      photoUrl: typeof d.photoUrl === 'string' && d.photoUrl ? d.photoUrl : DEFAULT_PLATFORM_OWNER_PROFILE.photoUrl,
      whatsappNumber:
        typeof d.whatsappNumber === 'string' && d.whatsappNumber
          ? d.whatsappNumber
          : DEFAULT_PLATFORM_OWNER_PROFILE.whatsappNumber,
      updatedAt: new Date().toISOString().split('T')[0],
    };
  } catch {
    return null;
  }
}

export async function fetchPublicCloudRegistry(): Promise<{
  schools: (SchoolProfile & { ownerUid?: string })[];
  publicCreds: Record<string, any>[];
  publicGraduates: (GraduateAlumniRecord & { institutionName: string; institutionCode: string })[];
  publicArticles: ResearchArticle[];
  ownerProfile: PlatformOwnerProfile | null;
}> {
  let schools: (SchoolProfile & { ownerUid?: string })[] = [];
  let publicCreds: Record<string, any>[];
  publicCreds = [];
  let publicGraduates: (GraduateAlumniRecord & { institutionName: string; institutionCode: string })[] = [];
  let publicArticles: ResearchArticle[] = [];
  let ownerProfile: PlatformOwnerProfile | null = null;

  ownerProfile = await fetchPlatformOwnerProfileFromCloud();

  try {
    const schSnap = await getDocs(query(collection(db, 'schools'), where('isPublic', '==', true)));
    schools = schSnap.docs
      .map((d) => mapDocToSchoolProfile(d.data()))
      .filter((s) => !isRemovedSampleSchoolId(s.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'schools');
  }

  try {
    const credSnap = await getDocs(query(collection(db, 'publicCredentials'), where('isPublic', '==', true)));
    publicCreds = credSnap.docs
      .map((d) => d.data())
      .filter((c) => !isRemovedSampleSchoolId(c.schoolId));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'publicCredentials');
  }

  try {
    const gradSnap = await getDocs(query(collection(db, 'publicGraduates'), where('directoryConsent', '==', true)));
    publicGraduates = gradSnap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: data.id,
          schoolId: data.schoolId,
          candidateId: data.id,
          candidateNumber: data.candidateNumber,
          fullName: data.fullName,
          email: '',
          phone: '',
          photo: data.photo,
          programmeId: '',
          programmeTitle: data.programmeTitle,
          qualificationAwarded: data.qualificationAwarded,
          levelAttained: data.levelAttained,
          graduationYear: data.graduationYear,
          completionApprovedDate: '',
          certificateNumber: data.certificateNumber,
          verificationCode: data.verificationCode,
          certificateStatus: data.certificateStatus,
          membershipStatus: data.membershipStatus,
          directoryConsent: true,
          currentEmployerOrRole: data.currentEmployerOrRole,
          institutionName: data.institutionName,
          institutionCode: data.institutionCode,
        };
      })
      .filter((g) => !isRemovedSampleSchoolId(g.schoolId));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'publicGraduates');
  }

  try {
    const artSnap = await getDocs(query(collection(db, 'publicArticles'), where('isOpenToPublic', '==', true)));
    publicArticles = artSnap.docs
      .map((d) => d.data() as ResearchArticle)
      .filter((a) => !isRemovedSampleSchoolId(a.schoolId));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'publicArticles');
  }

  return { schools, publicCreds, publicGraduates, publicArticles, ownerProfile };
}

export async function lookupPublicCredentialInCloud(
  rawQuery: string
): Promise<PublicCredentialVerificationResult | null> {
  const clean = rawQuery.trim().toUpperCase();
  if (!clean) return null;

  const verifiedAt = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const lookupKey = normalizeCertLookupKey(clean);

  try {
    const directSnap = await getDoc(doc(db, 'publicCredentials', lookupKey));
    let matchedData: Record<string, any> | null = directSnap.exists() ? directSnap.data() : null;

    if (!matchedData) {
      const certNumSnap = await getDocs(
        query(
          collection(db, 'publicCredentials'),
          where('isPublic', '==', true),
          where('certificateNumber', '==', clean)
        )
      );
      if (!certNumSnap.empty) {
        matchedData = certNumSnap.docs[0].data();
      }
    }

    if (!matchedData) {
      const codeSnap = await getDocs(
        query(
          collection(db, 'publicCredentials'),
          where('isPublic', '==', true),
          where('verificationCode', '==', clean)
        )
      );
      if (!codeSnap.empty) {
        matchedData = codeSnap.docs[0].data();
      }
    }

    if (!matchedData || isRemovedSampleSchoolId(matchedData.schoolId)) return null;

    let effectiveStatus = matchedData.status;
    if (effectiveStatus === 'Valid' && matchedData.expiryDate && new Date(matchedData.expiryDate) < new Date()) {
      effectiveStatus = 'Expired';
    }

    return {
      found: true,
      queriedReference: clean,
      verifiedAt,
      status: effectiveStatus,
      certificateNumber: matchedData.certificateNumber,
      verificationCode: matchedData.verificationCode,
      recipientFullName: matchedData.recipientFullName,
      candidateNumber: matchedData.candidateNumber,
      issuingInstitutionName: matchedData.issuingInstitutionName,
      issuingInstitutionCode: matchedData.issuingInstitutionCode,
      issuingInstitutionCrest: matchedData.issuingInstitutionCrest,
      awardingAuthorityName: matchedData.awardingAuthorityName,
      professionalBodyAffiliationNote: matchedData.professionalBodyAffiliationNote,
      credentialType: matchedData.credentialType,
      programmeTitle: matchedData.programmeTitle,
      qualificationAwarded: matchedData.qualificationAwarded,
      levelCompletedLabel: matchedData.levelCompletedLabel,
      honoursOrDistinction: matchedData.honoursOrDistinction,
      issueDate: matchedData.issueDate,
      expiryDate: matchedData.expiryDate,
      replacedByCertificateNumber: matchedData.replacedByCertificateNumber,
      revocationOrStatusReason: matchedData.revocationOrStatusReason,
    };
  } catch (error) {
    if (isBenignAbortError(error)) return null;
    handleFirestoreError(error, OperationType.GET, `publicCredentials/${lookupKey}`);
  }
}

let activePurgePromise: Promise<void> | null = null;
const completedPurgeUids = new Set<string>();

/**
 * Purges any previously seeded sample institutions and their subcollections/public projections
 * from Cloud Firestore when the verified Platform Owner signs in, leaving only owner-created schools.
 */
export async function purgeSampleInstitutionsFromCloud(fbUser: FirebaseUser): Promise<void> {
  if (!isBootstrappedAdminUser(fbUser)) return;
  if (completedPurgeUids.has(fbUser.uid)) return;
  if (activePurgePromise) return activePurgePromise;

  activePurgePromise = (async () => {
    try {
      for (const sampleId of REMOVED_SAMPLE_SCHOOL_IDS) {
        await deleteSchoolInCloud(sampleId);
      }
      completedPurgeUids.add(fbUser.uid);
    } finally {
      activePurgePromise = null;
    }
  })();

  return activePurgePromise;
}

function onListenerError(err: unknown, op: OperationType, path: string): void {
  if (isBenignAbortError(err)) return;
  handleFirestoreError(err, op, path);
}

/**
 * Attaches real-time onSnapshot listeners ONLY when Firebase Auth is ready & authenticated,
 * strictly scoping queries to match `firestore.rules` `allow list` constraints.
 */
export function subscribeToCloudWorkspace(params: {
  fbUser: FirebaseUser;
  activeSchoolId: string;
  schoolOwnerUid?: string;
  onPublicSchools: (schools: (SchoolProfile & { ownerUid?: string })[]) => void;
  onPublicCredentials: (creds: Record<string, any>[]) => void;
  onPublicGraduates: (grads: (GraduateAlumniRecord & { institutionName: string; institutionCode: string })[]) => void;
  onPublicArticles: (articles: ResearchArticle[]) => void;
  onSchoolSignatories: (sigs: AuthorizedSignatory[]) => void;
  onSchoolProgrammes: (progs: ProfessionalProgramme[]) => void;
  onSchoolCourses: (courses: ProgrammeCourse[]) => void;
  onSchoolStudents: (students: Student[]) => void;
  onSchoolCandidates: (candidates: CandidateProfile[]) => void;
  onSchoolAssessments: (assessments: CandidateCourseAssessment[]) => void;
  onSchoolExamResults: (results: ExamResult[]) => void;
  onSchoolFeePayments: (payments: FeePayment[]) => void;
  onSchoolCredentials: (credentials: IssuedCredential[]) => void;
  onSchoolGraduates: (graduates: GraduateAlumniRecord[]) => void;
  onSchoolReplacementRequests: (requests: CertificateReplacementRequest[]) => void;
}): Unsubscribe {
  const { fbUser, activeSchoolId, schoolOwnerUid } = params;
  const unsubs: Unsubscribe[] = [];

  if (!fbUser.emailVerified || !fbUser.email) {
    return () => {};
  }

  // 1. Global public registries (always filtered against removed sample schools)
  unsubs.push(
    onSnapshot(
      query(collection(db, 'schools'), where('isPublic', '==', true)),
      (snap) => {
        params.onPublicSchools(
          snap.docs
            .map((d) => mapDocToSchoolProfile(d.data()))
            .filter((s) => !isRemovedSampleSchoolId(s.id))
        );
      },
      (err) => onListenerError(err, OperationType.LIST, 'schools')
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'publicCredentials'), where('isPublic', '==', true)),
      (snap) => {
        params.onPublicCredentials(
          snap.docs
            .map((d) => d.data())
            .filter((c) => !isRemovedSampleSchoolId(c.schoolId))
        );
      },
      (err) => onListenerError(err, OperationType.LIST, 'publicCredentials')
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'publicGraduates'), where('directoryConsent', '==', true)),
      (snap) => {
        params.onPublicGraduates(
          snap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: data.id,
                schoolId: data.schoolId,
                candidateId: data.id,
                candidateNumber: data.candidateNumber,
                fullName: data.fullName,
                email: '',
                phone: '',
                photo: data.photo,
                programmeId: '',
                programmeTitle: data.programmeTitle,
                qualificationAwarded: data.qualificationAwarded,
                levelAttained: data.levelAttained,
                graduationYear: data.graduationYear,
                completionApprovedDate: '',
                certificateNumber: data.certificateNumber,
                verificationCode: data.verificationCode,
                certificateStatus: data.certificateStatus,
                membershipStatus: data.membershipStatus,
                directoryConsent: true,
                currentEmployerOrRole: data.currentEmployerOrRole,
                institutionName: data.institutionName,
                institutionCode: data.institutionCode,
              };
            })
            .filter((g) => !isRemovedSampleSchoolId(g.schoolId))
        );
      },
      (err) => onListenerError(err, OperationType.LIST, 'publicGraduates')
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'publicArticles'), where('isOpenToPublic', '==', true)),
      (snap) => {
        params.onPublicArticles(
          snap.docs
            .map((d) => d.data() as ResearchArticle)
            .filter((a) => !isRemovedSampleSchoolId(a.schoolId))
        );
      },
      (err) => onListenerError(err, OperationType.LIST, 'publicArticles')
    )
  );

  // Skip per-school subcollection listeners if no real school is active yet
  if (!activeSchoolId || activeSchoolId === 'sch-uninitialized' || isRemovedSampleSchoolId(activeSchoolId)) {
    return () => {
      unsubs.forEach((fn) => fn());
    };
  }

  const safeSchoolId = sanitizeFirestoreId(activeSchoolId, 'sch');
  const isBootstrap = isBootstrappedAdminUser(fbUser);
  const isOwner = Boolean(schoolOwnerUid && schoolOwnerUid === fbUser.uid);
  const userEmailLower = fbUser.email.toLowerCase();

  // 2. Published programmes & courses for active school (safe for any verified user)
  unsubs.push(
    onSnapshot(
      query(collection(db, 'schools', safeSchoolId, 'programmes'), where('isPublished', '==', true)),
      (snap) => {
        if (!snap.empty) {
          params.onSchoolProgrammes(snap.docs.map((d) => d.data() as ProfessionalProgramme));
        }
      },
      (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/programmes`)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'schools', safeSchoolId, 'courses'), where('isPublished', '==', true)),
      (snap) => {
        if (!snap.empty) {
          params.onSchoolCourses(snap.docs.map((d) => d.data() as ProgrammeCourse));
        }
      },
      (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/courses`)
    )
  );

  // 3. PII & Administrative Subcollections — strictly scoped by ownership or verified learner email!
  if (isBootstrap || isOwner) {
    const ownerFilter = isBootstrap
      ? (colName: string) => collection(db, 'schools', safeSchoolId, colName)
      : (colName: string) =>
          query(collection(db, 'schools', safeSchoolId, colName), where('schoolOwnerUid', '==', fbUser.uid));

    unsubs.push(
      onSnapshot(
        ownerFilter('signatories'),
        (snap) => {
          if (!snap.empty) params.onSchoolSignatories(snap.docs.map((d) => d.data() as AuthorizedSignatory));
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/signatories`)
      )
    );

    unsubs.push(
      onSnapshot(
        ownerFilter('students'),
        (snap) => {
          if (!snap.empty) params.onSchoolStudents(snap.docs.map((d) => d.data() as Student));
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/students`)
      )
    );

    unsubs.push(
      onSnapshot(
        ownerFilter('candidates'),
        (snap) => {
          if (!snap.empty) params.onSchoolCandidates(snap.docs.map((d) => d.data() as CandidateProfile));
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/candidates`)
      )
    );

    unsubs.push(
      onSnapshot(
        ownerFilter('assessments'),
        (snap) => {
          if (!snap.empty) params.onSchoolAssessments(snap.docs.map((d) => d.data() as CandidateCourseAssessment));
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/assessments`)
      )
    );

    unsubs.push(
      onSnapshot(
        ownerFilter('examResults'),
        (snap) => {
          if (!snap.empty) params.onSchoolExamResults(snap.docs.map((d) => d.data() as ExamResult));
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/examResults`)
      )
    );

    unsubs.push(
      onSnapshot(
        ownerFilter('feePayments'),
        (snap) => {
          if (!snap.empty) params.onSchoolFeePayments(snap.docs.map((d) => d.data() as FeePayment));
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/feePayments`)
      )
    );

    unsubs.push(
      onSnapshot(
        ownerFilter('credentials'),
        (snap) => {
          if (!snap.empty) params.onSchoolCredentials(snap.docs.map((d) => d.data() as IssuedCredential));
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/credentials`)
      )
    );

    unsubs.push(
      onSnapshot(
        ownerFilter('graduates'),
        (snap) => {
          if (!snap.empty) params.onSchoolGraduates(snap.docs.map((d) => d.data() as GraduateAlumniRecord));
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/graduates`)
      )
    );

    unsubs.push(
      onSnapshot(
        ownerFilter('replacementRequests'),
        (snap) => {
          if (!snap.empty) {
            params.onSchoolReplacementRequests(snap.docs.map((d) => d.data() as CertificateReplacementRequest));
          }
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/replacementRequests`)
      )
    );
  } else {
    // Verified Student / Candidate / Graduate self-service listeners (strictly filtered to their own email/UID!)
    unsubs.push(
      onSnapshot(
        query(collection(db, 'schools', safeSchoolId, 'students'), where('studentEmail', '==', userEmailLower)),
        (snap) => {
          if (!snap.empty) params.onSchoolStudents(snap.docs.map((d) => d.data() as Student));
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/students`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'schools', safeSchoolId, 'candidates'), where('email', '==', userEmailLower)),
        (snap) => {
          if (!snap.empty) params.onSchoolCandidates(snap.docs.map((d) => d.data() as CandidateProfile));
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/candidates`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'schools', safeSchoolId, 'assessments'), where('candidateEmail', '==', userEmailLower)),
        (snap) => {
          if (!snap.empty) params.onSchoolAssessments(snap.docs.map((d) => d.data() as CandidateCourseAssessment));
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/assessments`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'schools', safeSchoolId, 'examResults'), where('studentEmail', '==', userEmailLower)),
        (snap) => {
          if (!snap.empty) params.onSchoolExamResults(snap.docs.map((d) => d.data() as ExamResult));
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/examResults`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'schools', safeSchoolId, 'feePayments'), where('studentEmail', '==', userEmailLower)),
        (snap) => {
          if (!snap.empty) params.onSchoolFeePayments(snap.docs.map((d) => d.data() as FeePayment));
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/feePayments`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'schools', safeSchoolId, 'credentials'), where('candidateEmail', '==', userEmailLower)),
        (snap) => {
          if (!snap.empty) params.onSchoolCredentials(snap.docs.map((d) => d.data() as IssuedCredential));
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/credentials`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'schools', safeSchoolId, 'graduates'), where('email', '==', userEmailLower)),
        (snap) => {
          if (!snap.empty) params.onSchoolGraduates(snap.docs.map((d) => d.data() as GraduateAlumniRecord));
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/graduates`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'schools', safeSchoolId, 'replacementRequests'),
          where('requesterUid', '==', sanitizeFirestoreId(fbUser.uid, 'usr'))
        ),
        (snap) => {
          if (!snap.empty) {
            params.onSchoolReplacementRequests(snap.docs.map((d) => d.data() as CertificateReplacementRequest));
          }
        },
        (err) => onListenerError(err, OperationType.LIST, `schools/${safeSchoolId}/replacementRequests`)
      )
    );
  }

  return () => {
    unsubs.forEach((fn) => fn());
  };
}
