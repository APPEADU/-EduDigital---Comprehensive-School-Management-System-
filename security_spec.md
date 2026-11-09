# InfoDigital & Credential Charter — Firestore Security Specification (Phase 0 TDD)

## 1. Core Data & Relational Invariants

1. **Default-Deny Global Safety Net**: `match /{document=**} { allow read, write: if false; }` is the first rule block; any undeclared path or method is unconditionally rejected.
2. **Verified Identity Mandate**: Every write operation across the entire database requires `request.auth != null && request.auth.token.email_verified == true`. Unverified email tokens cannot spoof the bootstrapped administrator (`appeadusolomon65@gmail.com`) or student/candidate email links.
3. **Master Gate Multi-Tenant Partitioning**: Every subcollection under `/schools/{schoolId}/...` verifies parent institution existence (`exists(/databases/$(database)/documents/schools/$(schoolId))`) and derives staff/admin/teacher permissions synchronously from `/schools/{schoolId}` (`ownerUid`) and `/schools/{schoolId}/members/{uid}`. Revoking a user's membership document immediately revokes subcollection write/get privileges.
4. **PII Split & Isolation**:
   - User PII (`email`, `phone`) is isolated in `/users/{userId}/private/info` (`allow get` restricted strictly to `request.auth.uid == userId || isPlatformAdmin()`, `allow list: if false`).
   - Student, Candidate, FeePayment, and Graduate contact records are restricted to verified institutional staff/owners or the matching verified student/candidate email—never blanket `isSignedIn()`.
   - Public verification (`/publicCredentials/{certificateKey}`) and consent-based alumni search (`/publicGraduates/{graduateId}`) store zero marks, zero financial balances, and zero personal emails/phones.
5. **Atomicity Guarantee (`existsAfter` & `getAfter`)**: Issuing or updating a status on `/schools/{schoolId}/credentials/{credentialId}` requires an atomic `writeBatch` that simultaneously writes `/publicCredentials/{publicLookupKey}` with matching `status` and `certificateNumber`, verified via `existsAfter` and `getAfter`.
6. **Terminal State Locking**:
   - Credentials in `Revoked` or `Replaced` status cannot be mutated by non-platform-admins.
   - Certificate replacement requests in `Approved & Re-issued` or `Declined` status are locked against subsequent non-platform-admin edits.
   - Fee payments in `Completed` status cannot be altered by regular teachers/bursars.
   - Verification logs (`/verificationLogs/{logId}`) are strictly append-only (`allow update, delete: if false`).
7. **Cost-Safe Query Enforcer**: Zero `get()` or `exists()` calls appear inside any `allow list` block. Every `allow list` block evaluates `resource.data` directly.
8. **Temporal & Structural Integrity**: Every entity enforces `hasAll` + `hasOnly` keys, `maxLength` bounds on every string (including institute course `levelLabel` <= 64, `courseDetails` <= 4,000, `rationale` <= 3,000, and `flyerDataUrl` <= 250,000 chars), bounded `.size()` on every list (including `objectives` <= 20 strings), regex ID guards (`^[a-zA-Z0-9_\-]+$`), `createdAt == request.time` on create, `createdAt == existing().createdAt` and `updatedAt == request.time` on update.
9. **Platform-Admin-Only School Registration**: Visitors (unauthenticated or Google-signed-in) and existing school administrators cannot create or delete `/schools/{schoolId}` documents (`allow create` and `allow delete` strictly require `isPlatformAdmin()`).

---

## 2. The "Dirty Dozen" Adversarial Payloads

All 12 payloads below MUST return `PERMISSION_DENIED` (tested in `firestore.rules.test.ts`):

1. **Payload 1 — Privilege Self-Escalation (Self-Assigned Admin Role)**
   - Path: `/schools/sch-kri-01/members/attacker_uid`
   - Attack: Regular verified user attempts to create their own membership with `"role": "admin"` instead of `"student"`.
2. **Payload 2 — Shadow Field Injection ("Ghost Field" Attack)**
   - Path: `/schools/sch-attacker-1`
   - Attack: School owner creates a valid `SchoolInstitution` payload plus an undeclared `"isVerifiedCharter": true` shadow key.
3. **Payload 3 — Unverified Email Spoofing Against Bootstrapped Admin**
   - Path: `/admins/spoof_uid`
   - Attack: Attacker authenticates with `"email": "appeadusolomon65@gmail.com"` but `"email_verified": false` and attempts to write an admin record.
4. **Payload 4 — PII Cross-User Snooping (Blanket Signed-In Read Attempt)**
   - Path: `/users/victim_uid/private/info`
   - Attack: Verified user `attacker_uid` attempts `getDoc` on `victim_uid`'s private PII document.
5. **Payload 5 — Unconstrained List Scraping on Student PII**
   - Path: `/schools/sch-kri-01/students`
   - Attack: Verified user `attacker_uid` (not school owner, not matching student email) attempts a blanket collection list query on `/students`.
6. **Payload 6 — Identity Spoofing (`ownerUid` Forgery on Create)**
   - Path: `/schools/sch-forged-1`
   - Attack: Verified user `attacker_uid` creates a school setting `"ownerUid": "victim_uid"`.
7. **Payload 7 — Resource / ID Poisoning (>128-char / Illegal Characters in Document ID)**
   - Path: `/schools/sch$invalid!id`
   - Attack: Verified user attempts to create a document with regex-violating characters in `{schoolId}`.
8. **Payload 8 — Value Poisoning on Whitelisted Update Key**
   - Path: `/schools/sch-own-1`
   - Attack: Legitimate school owner updates whitelisted key `motto` with an oversized 5,000-character string or integer `99999`, testing whether `isValidSchoolInstitution(incoming())` wraps the update block.
9. **Payload 9 — Client Timestamp Forgery (Backdating `createdAt`)**
   - Path: `/schools/sch-time-1`
   - Attack: Verified user supplies a hardcoded past timestamp (`2020-01-01T00:00:00Z`) instead of `serverTimestamp()` (`request.time`).
10. **Payload 10 — Orphaned Credential Issuance Without Atomic Public Projection (`existsAfter` Violation)**
    - Path: `/schools/sch-own-1/credentials/cred-orphan-1`
    - Attack: School owner writes to `/schools/sch-own-1/credentials/cred-orphan-1` alone without atomically writing `/publicCredentials/KRI-2026-CERT-00999` in the same batch.
11. **Payload 11 — Terminal State Shortcutting (Mutating a `Revoked` Certificate)**
    - Path: `/schools/sch-own-1/credentials/cred-revoked-1`
    - Attack: Non-platform-admin attempts to flip an already `Revoked` credential back to `Valid`.
12. **Payload 12 — Public Graduate Directory Consent Violation**
    - Path: `/publicGraduates/grad-no-consent-1`
    - Attack: School admin attempts to publish a graduate into `/publicGraduates` with `"directoryConsent": false`.

---

## 3. Automated Test Runner

See `/firestore.rules.test.ts` for the executable `@firebase/rules-unit-testing` suite validating that every single Dirty Dozen payload returns `PERMISSION_DENIED`.
