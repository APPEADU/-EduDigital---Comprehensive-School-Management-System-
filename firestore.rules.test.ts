import { readFileSync } from 'node:fs';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const baseSchoolPayload = (ownerUid: string, id: string) => ({
  id,
  name: 'Test Royal Institute',
  code: 'TRI-GH',
  motto: 'Integrity and Knowledge',
  crest: 'https://example.com/crest.png',
  levelType: 'Professional Institute',
  region: 'Greater Accra',
  district: 'Accra Metro',
  address: '12 Independence Ave, Accra',
  officialPhone: '+233302000111',
  officialEmail: 'registry@tri.edu.gh',
  currency: 'GHS',
  currentAcademicYear: '2026/2027',
  currentTerm: 'Semester 1',
  termStartDate: '2026-09-01',
  termEndDate: '2026-12-18',
  nextTermBegins: '2027-01-12',
  headmasterName: 'Prof. Kwesi Mensah',
  headmasterSignature: 'Prof. K. Mensah',
  enabledModules: ['professional_credentials'],
  ownerUid,
  updatedByUid: ownerUid,
  isPublic: true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

describe('Firestore Fortress Security Rules — Dirty Dozen Red Team Suite', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-edudigital-security-test',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      const now = Timestamp.now();
      await setDoc(doc(adminDb, 'schools', 'sch-own-1'), {
        ...baseSchoolPayload('owner_uid', 'sch-own-1'),
        createdAt: now,
        updatedAt: now,
      });
      await setDoc(doc(adminDb, 'users', 'victim_uid', 'private', 'info'), {
        uid: 'victim_uid',
        email: 'victim@school.edu.gh',
        phone: '+233240000000',
        linkedStudentId: 'stu-1',
        linkedCandidateId: 'cand-1',
        updatedByUid: 'victim_uid',
        createdAt: now,
        updatedAt: now,
      });
      await setDoc(doc(adminDb, 'schools', 'sch-own-1', 'students', 'stu-1'), {
        id: 'stu-1',
        schoolId: 'sch-own-1',
        schoolOwnerUid: 'owner_uid',
        updatedByUid: 'owner_uid',
        studentNumber: 'TRI-2026-0001',
        firstName: 'Ama',
        lastName: 'Boateng',
        otherNames: '',
        gender: 'Female',
        dob: '2008-04-12',
        photo: 'https://example.com/stu.jpg',
        classId: 'cls-1',
        stream: 'Science',
        boardingStatus: 'Boarding',
        studentEmail: 'ama.boateng@student.edu.gh',
        guardianName: 'Kofi Boateng',
        guardianPhone: '+233244112233',
        guardianEmail: 'kofi@example.com',
        guardianRelationship: 'Father',
        emergencyContact: '+233244112233',
        medicalInfo: 'None',
        admissionDate: '2026-09-01',
        status: 'Active',
        createdAt: now,
        updatedAt: now,
      });
      await setDoc(doc(adminDb, 'schools', 'sch-own-1', 'credentials', 'cred-revoked-1'), {
        id: 'cred-revoked-1',
        publicLookupKey: 'TRI-2026-CERT-00001',
        schoolId: 'sch-own-1',
        schoolOwnerUid: 'owner_uid',
        updatedByUid: 'owner_uid',
        schoolName: 'Test Royal Institute',
        schoolCode: 'TRI-GH',
        schoolCrest: 'https://example.com/crest.png',
        certificateNumber: 'TRI-2026-CERT-00001',
        verificationCode: 'VRF-TRI12-8899',
        candidateId: 'cand-1',
        candidateEmail: 'cand1@tri.edu.gh',
        candidateNumber: 'TRI-CAND-001',
        recipientFullName: 'Kwame Owusu',
        programmeId: 'prog-1',
        programmeTitle: 'Chartered Tax Law',
        credentialType: 'Full Qualification Certificate',
        qualificationAwarded: 'Chartered Diploma in Tax Law',
        levelCompletedLabel: 'Level 3 (Professional)',
        honoursOrDistinction: 'Distinction',
        creditHoursCompleted: 120,
        issueDate: '2026-06-15',
        expiryDate: '',
        status: 'Revoked',
        replacedByCertificateNumber: '',
        revocationOrStatusReason: 'Substantiated examination irregularity',
        awardingAuthorityName: 'Test Royal Institute Academic Board',
        professionalBodyAffiliationNote: '',
        templateId: 'tpl-1',
        signatoriesSnapshot: [{ name: 'Prof. K. Mensah', title: 'Rector', signatureDataUrl: 'data:image/svg+xml;utf8,<svg></svg>' }],
        auditTrail: [{ id: 'aud-1', timestamp: '2026-06-20 UTC', actorName: 'Registrar', actorRole: 'Registrar', previousStatus: 'Valid', newStatus: 'Revoked', reason: 'Revoked' }],
        createdAt: now,
        updatedAt: now,
      });
    });
  });

  it('1. Rejects privilege self-escalation to admin role in /members', async () => {
    const attacker = testEnv.authenticatedContext('attacker_uid', {
      email: 'attacker@gmail.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      setDoc(doc(attacker, 'schools', 'sch-own-1', 'members', 'attacker_uid'), {
        uid: 'attacker_uid',
        schoolId: 'sch-own-1',
        schoolOwnerUid: 'owner_uid',
        name: 'Attacker',
        role: 'admin',
        title: 'Fake Admin',
        avatar: 'https://example.com/a.png',
        updatedByUid: 'attacker_uid',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('2. Rejects shadow field injection (ghost field)', async () => {
    const platformAdmin = testEnv.authenticatedContext('platform_admin_uid', {
      email: 'appeadusolomon65@gmail.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      setDoc(doc(platformAdmin, 'schools', 'sch-ghost-1'), {
        ...baseSchoolPayload('platform_admin_uid', 'sch-ghost-1'),
        isVerifiedCharter: true,
      })
    );
  });

  it('3. Rejects unverified email spoofing against bootstrapped admin', async () => {
    const spoofedAdmin = testEnv.authenticatedContext('spoof_uid', {
      email: 'appeadusolomon65@gmail.com',
      email_verified: false,
    }).firestore();

    await assertFails(
      setDoc(doc(spoofedAdmin, 'admins', 'spoof_uid'), {
        uid: 'spoof_uid',
        note: 'Spoofed bootstrap admin',
        updatedByUid: 'spoof_uid',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('4. Rejects PII cross-user snooping on /users/{victim}/private/info', async () => {
    const attacker = testEnv.authenticatedContext('attacker_uid', {
      email: 'attacker@gmail.com',
      email_verified: true,
    }).firestore();

    await assertFails(getDoc(doc(attacker, 'users', 'victim_uid', 'private', 'info')));
  });

  it('5. Rejects unconstrained list scraping on /students PII', async () => {
    const attacker = testEnv.authenticatedContext('attacker_uid', {
      email: 'attacker@gmail.com',
      email_verified: true,
    }).firestore();

    await assertFails(getDocs(collection(attacker, 'schools', 'sch-own-1', 'students')));
  });

  it('6. Rejects ownerUid identity spoofing on school creation', async () => {
    const platformAdmin = testEnv.authenticatedContext('platform_admin_uid', {
      email: 'appeadusolomon65@gmail.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      setDoc(doc(platformAdmin, 'schools', 'sch-forged-1'), {
        ...baseSchoolPayload('victim_uid', 'sch-forged-1'),
        updatedByUid: 'platform_admin_uid',
      })
    );
  });

  it('7. Rejects illegal characters in path document IDs', async () => {
    const platformAdmin = testEnv.authenticatedContext('platform_admin_uid', {
      email: 'appeadusolomon65@gmail.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      setDoc(doc(platformAdmin, 'schools', 'sch$bad!id'), baseSchoolPayload('platform_admin_uid', 'sch$bad!id'))
    );
  });

  it('8. Rejects value poisoning on whitelisted update field', async () => {
    const owner = testEnv.authenticatedContext('owner_uid', {
      email: 'owner@gmail.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      updateDoc(doc(owner, 'schools', 'sch-own-1'), {
        motto: 'X'.repeat(5000),
        updatedByUid: 'owner_uid',
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('9. Rejects client-forged past createdAt timestamp', async () => {
    const platformAdmin = testEnv.authenticatedContext('platform_admin_uid', {
      email: 'appeadusolomon65@gmail.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      setDoc(doc(platformAdmin, 'schools', 'sch-backdated-1'), {
        ...baseSchoolPayload('platform_admin_uid', 'sch-backdated-1'),
        createdAt: Timestamp.fromDate(new Date('2020-01-01T00:00:00Z')),
      })
    );
  });

  it('10. Rejects credential issuance without atomic publicCredentials write (existsAfter)', async () => {
    const owner = testEnv.authenticatedContext('owner_uid', {
      email: 'owner@gmail.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      setDoc(doc(owner, 'schools', 'sch-own-1', 'credentials', 'cred-orphan-1'), {
        id: 'cred-orphan-1',
        publicLookupKey: 'TRI-2026-CERT-99999',
        schoolId: 'sch-own-1',
        schoolOwnerUid: 'owner_uid',
        updatedByUid: 'owner_uid',
        schoolName: 'Test Royal Institute',
        schoolCode: 'TRI-GH',
        schoolCrest: 'https://example.com/crest.png',
        certificateNumber: 'TRI-2026-CERT-99999',
        verificationCode: 'VRF-TRI99-9999',
        candidateId: 'cand-1',
        candidateEmail: 'cand1@tri.edu.gh',
        candidateNumber: 'TRI-CAND-001',
        recipientFullName: 'Orphan Test',
        programmeId: 'prog-1',
        programmeTitle: 'Chartered Tax Law',
        credentialType: 'Full Qualification Certificate',
        qualificationAwarded: 'Chartered Diploma',
        levelCompletedLabel: 'Level 3',
        honoursOrDistinction: 'Pass',
        creditHoursCompleted: 120,
        issueDate: '2026-10-24',
        expiryDate: '',
        status: 'Valid',
        replacedByCertificateNumber: '',
        revocationOrStatusReason: '',
        awardingAuthorityName: 'Academic Board',
        professionalBodyAffiliationNote: '',
        templateId: 'tpl-1',
        signatoriesSnapshot: [{ name: 'Prof. K. Mensah', title: 'Rector', signatureDataUrl: 'data:image/svg+xml;utf8,<svg></svg>' }],
        auditTrail: [{ id: 'aud-1', timestamp: '2026-10-24 UTC', actorName: 'Rector', actorRole: 'Proprietor', previousStatus: 'Draft', newStatus: 'Valid', reason: 'Issued' }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('11. Rejects terminal state shortcutting on Revoked credential by non-platform-admin', async () => {
    const owner = testEnv.authenticatedContext('owner_uid', {
      email: 'owner@gmail.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      updateDoc(doc(owner, 'schools', 'sch-own-1', 'credentials', 'cred-revoked-1'), {
        status: 'Valid',
        updatedByUid: 'owner_uid',
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('12. Rejects publishing graduate to public directory without directoryConsent == true', async () => {
    const owner = testEnv.authenticatedContext('owner_uid', {
      email: 'owner@gmail.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      setDoc(doc(owner, 'publicGraduates', 'grad-no-consent-1'), {
        id: 'grad-no-consent-1',
        schoolId: 'sch-own-1',
        updatedByUid: 'owner_uid',
        institutionName: 'Test Royal Institute',
        institutionCode: 'TRI-GH',
        candidateNumber: 'TRI-CAND-001',
        fullName: 'Kwame Owusu',
        photo: 'https://example.com/p.jpg',
        programmeTitle: 'Chartered Tax Law',
        qualificationAwarded: 'Chartered Diploma',
        levelAttained: 'Level 3',
        graduationYear: 2026,
        certificateNumber: 'TRI-2026-CERT-00010',
        verificationCode: 'VRF-TRI10-1234',
        certificateStatus: 'Valid',
        membershipStatus: 'Graduate Member (Institution Complete)',
        currentEmployerOrRole: 'Auditor',
        directoryConsent: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('13. Rejects new school registration or deletion by verified visitors and existing school admins', async () => {
    const visitor = testEnv.authenticatedContext('visitor_uid', {
      email: 'visitor@gmail.com',
      email_verified: true,
    }).firestore();

    const existingSchoolOwner = testEnv.authenticatedContext('owner_uid', {
      email: 'owner@gmail.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      setDoc(doc(visitor, 'schools', 'sch-visitor-1'), baseSchoolPayload('visitor_uid', 'sch-visitor-1'))
    );
    await assertFails(
      setDoc(
        doc(existingSchoolOwner, 'schools', 'sch-branch-2'),
        baseSchoolPayload('owner_uid', 'sch-branch-2')
      )
    );
    await assertFails(deleteDoc(doc(existingSchoolOwner, 'schools', 'sch-own-1')));
  });

  it('14. Rejects unauthenticated visitor attempting to register a new school', async () => {
    const unauth = testEnv.unauthenticatedContext().firestore();

    await assertFails(
      setDoc(doc(unauth, 'schools', 'sch-unauth-1'), baseSchoolPayload('anon_uid', 'sch-unauth-1'))
    );
  });

  it('15. Allows verified Platform Super Admin (appeadusolomon65@gmail.com) to register a new school', async () => {
    const platformAdmin = testEnv.authenticatedContext('platform_admin_uid', {
      email: 'appeadusolomon65@gmail.com',
      email_verified: true,
    }).firestore();

    await assertSucceeds(
      setDoc(
        doc(platformAdmin, 'schools', 'sch-charter-new'),
        baseSchoolPayload('platform_admin_uid', 'sch-charter-new')
      )
    );
  });

  it('16. Allows unauthenticated list on /schools with isPublic == true filter and rejects unconstrained list', async () => {
    const unauth = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(
      getDocs(query(collection(unauth, 'schools'), where('isPublic', '==', true)))
    );
    await assertFails(getDocs(collection(unauth, 'schools')));
  });
});
