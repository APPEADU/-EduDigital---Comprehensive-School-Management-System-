import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import type { GoogleGenAI } from '@google/genai';

import crypto from 'crypto';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };
import { db } from './src/db/index.ts';
import { schools as sqlSchools, users as sqlUsers } from './src/db/schema.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Static uploads directory for permanent cloud asset storage (photographs, crests, documents)
const UPLOADS_DIR = path.resolve(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Persistent server data directory for multi-device institutional cloud storage
const DATA_DIR = path.resolve(__dirname, 'data');
const TENANTS_DIR = path.resolve(DATA_DIR, 'tenants');
const CLOUD_SCHOOLS_FILE = path.resolve(DATA_DIR, 'cloud_schools.json');
const CLOUD_ACCOUNTS_FILE = path.resolve(DATA_DIR, 'cloud_accounts.json');

if (!fs.existsSync(TENANTS_DIR)) {
  fs.mkdirSync(TENANTS_DIR, { recursive: true });
}

// Password hashing helper — never store plain-text passwords
const HASH_SALT = 'infodigital_sis_secure_salt_2026';
const LEGACY_SALT = 'legacy_sis_secure_salt_2026';
function hashPassword(plain: string): string {
  if (!plain) return '';
  return crypto.createHash('sha256').update(plain + HASH_SALT).digest('hex');
}

function verifyPassword(plain: string, hashedOrPlain: string): boolean {
  if (!hashedOrPlain) return false;
  // If stored value is already a 64-char hex sha256 hash
  if (/^[a-f0-9]{64}$/i.test(hashedOrPlain)) {
    if (hashPassword(plain) === hashedOrPlain) return true;
    const legacyHash = crypto.createHash('sha256').update(plain + LEGACY_SALT).digest('hex');
    const oldHash = crypto.createHash('sha256').update(plain + 'edu' + 'digital_sis_secure_salt_2026').digest('hex');
    return hashedOrPlain === legacyHash || hashedOrPlain === oldHash;
  }
  // Fallback for legacy unhashed passwords: verify and allow
  return plain === hashedOrPlain;
}

// In-memory + Disk persistence helpers
const DEFAULT_INITIAL_SCHOOLS = [
  {
    id: 'sch-kri-01',
    name: 'Kingdom Royal Institute',
    code: 'KRI-GH-001',
    motto: 'Excellence, Royalty & Moral Integrity',
    crest: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=200&q=80',
    levelType: 'SHS',
    region: 'Greater Accra',
    district: 'Ayawaso West / East Legon',
    address: 'Kingdom Royal Avenue, P.O. Box KD 770, East Legon, Accra, Ghana',
    phone: '+233 (0) 30 288 9911',
    whatsappNumber: '+233 207615941',
    whatsappEnabled: true,
    email: 'info@kingdomroyal.edu.gh',
    currency: 'GH₵',
    currentAcademicYear: '2025/2026',
    currentTerm: 'Term 1',
    termStartDate: '2025-09-08',
    termEndDate: '2025-12-18',
    nextTermBegins: '2026-01-12',
    headmasterName: 'Dr. Solomon Appeadu-Mensah (FWAS)',
    headmasterSignature: 'S. Appeadu-Mensah',
    enabledModules: ['boarding_house', 'transport_fleet', 'canteen_pos', 'ai_analytics'],
    isPublic: true,
    ownerUid: 'platform-owner-system',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];

function loadCloudSchools(): any[] {
  try {
    if (fs.existsSync(CLOUD_SCHOOLS_FILE)) {
      const raw = fs.readFileSync(CLOUD_SCHOOLS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading cloud_schools.json:', err);
  }
  // Initialize with default seeds so multi-device sync always has institutions
  try {
    fs.writeFileSync(CLOUD_SCHOOLS_FILE, JSON.stringify(DEFAULT_INITIAL_SCHOOLS, null, 2), 'utf-8');
  } catch {}
  return DEFAULT_INITIAL_SCHOOLS;
}

function saveCloudSchools(schools: any[]) {
  try {
    fs.writeFileSync(CLOUD_SCHOOLS_FILE, JSON.stringify(schools, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing cloud_schools.json:', err);
  }
}

function loadCloudAccounts(): any[] {
  try {
    if (fs.existsSync(CLOUD_ACCOUNTS_FILE)) {
      const raw = fs.readFileSync(CLOUD_ACCOUNTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading cloud_accounts.json:', err);
  }
  const defaultAccounts = [
    {
      id: 'usr-admin-solomon',
      name: 'Dr. Solomon Appeadu-Mensah',
      email: 'appeadusolomon65@gmail.com',
      role: 'proprietor',
      title: 'Super Administrator & Proprietor',
      schoolId: 'sch-kri-01',
      password: hashPassword('admin123'),
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'usr-admin-kri',
      name: 'Mrs. Cynthia Mensah-Bonsu',
      email: 'admin@kri-gh-001.edu.gh',
      role: 'admin',
      title: 'Headmistress & Operations Admin',
      schoolId: 'sch-kri-01',
      password: hashPassword('admin123'),
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ];
  try {
    fs.writeFileSync(CLOUD_ACCOUNTS_FILE, JSON.stringify(defaultAccounts, null, 2), 'utf-8');
  } catch {}
  return defaultAccounts;
}

function saveCloudAccounts(accounts: any[]) {
  try {
    fs.writeFileSync(CLOUD_ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing cloud_accounts.json:', err);
  }
}

function loadTenantData(schoolId: string): any | null {
  try {
    const filePath = path.resolve(TENANTS_DIR, `${schoolId}.json`);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error reading tenant data for ${schoolId}:`, err);
  }
  return null;
}

function saveTenantData(schoolId: string, tenantData: any) {
  try {
    const filePath = path.resolve(TENANTS_DIR, `${schoolId}.json`);
    const wrapped = {
      ...tenantData,
      lastModified: new Date().toISOString(),
      version: ((tenantData.version || 0) + 1),
    };
    fs.writeFileSync(filePath, JSON.stringify(wrapped, null, 2), 'utf-8');
    return wrapped;
  } catch (err) {
    console.error(`Error writing tenant data for ${schoolId}:`, err);
    throw err;
  }
}

// Background asynchronous synchronization to Firestore REST API where applicable
async function syncSchoolToFirestore(school: any) {
  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/schools/${school.id}?key=${firebaseConfig.apiKey}`;
    const fields: Record<string, any> = {
      id: { stringValue: school.id },
      name: { stringValue: school.name || 'School' },
      code: { stringValue: school.code || 'SCH' },
      motto: { stringValue: school.motto || '' },
      crest: { stringValue: school.crest || '' },
      levelType: { stringValue: school.levelType || 'Basic & JHS' },
      region: { stringValue: school.region || 'Greater Accra' },
      district: { stringValue: school.district || 'Metropolitan' },
      address: { stringValue: school.address || '' },
      officialPhone: { stringValue: school.phone || school.officialPhone || '+233000000000' },
      officialEmail: { stringValue: school.email || school.officialEmail || 'admin@school.edu.gh' },
      currency: { stringValue: school.currency || 'GH₵' },
      currentAcademicYear: { stringValue: school.currentAcademicYear || '2025/2026' },
      currentTerm: { stringValue: school.currentTerm || 'Term 1' },
      termStartDate: { stringValue: school.termStartDate || '2025-09-15' },
      termEndDate: { stringValue: school.termEndDate || '2025-12-19' },
      nextTermBegins: { stringValue: school.nextTermBegins || '2026-01-14' },
      headmasterName: { stringValue: school.headmasterName || 'Principal' },
      headmasterSignature: { stringValue: school.headmasterSignature || 'Principal' },
      isPublic: { booleanValue: true },
      enabledModules: {
        arrayValue: {
          values: (school.enabledModules || []).map((m: string) => ({ stringValue: m })),
        },
      },
      ownerUid: { stringValue: school.ownerUid || 'platform-owner-system' },
      updatedByUid: { stringValue: school.ownerUid || 'platform-owner-system' },
      createdAt: { timestampValue: new Date().toISOString() },
      updatedAt: { timestampValue: new Date().toISOString() },
    };
    if (school.whatsappNumber) {
      fields.whatsappNumber = { stringValue: school.whatsappNumber };
    }
    if (typeof school.whatsappEnabled === 'boolean') {
      fields.whatsappEnabled = { booleanValue: school.whatsappEnabled };
    }

    await fetch(firestoreUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }).catch(() => {});
  } catch {
    // Non-blocking firestore sync
  }
}

// ============================================================================
// CENTRAL CLOUD DATABASE ENDPOINTS (/api/cloud/*)
// ============================================================================

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/cloud/health', (_req: Request, res: Response) => {
  const schools = loadCloudSchools();
  res.json({
    status: 'ok',
    centralDatabase: 'active',
    registeredSchoolsCount: schools.length,
    timestamp: new Date().toISOString(),
  });
});

// 1. Retrieve all registered institutions from central cloud database
app.get('/api/cloud/schools', (_req: Request, res: Response) => {
  try {
    const schools = loadCloudSchools();
    res.json({
      success: true,
      schools,
      totalCount: schools.length,
      source: 'cloud',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, schools: [] });
  }
});

// 2. Onboard and permanently register a new school in the cloud database
app.post('/api/cloud/schools', async (req: Request, res: Response) => {
  try {
    const { school, adminCredentials, curriculumOptions, tenantData } = req.body;
    if (!school || !school.name || !school.code) {
      return res.status(400).json({ success: false, message: 'Invalid school registration payload.' });
    }

    const schoolId = school.id || `sch-${Date.now()}`;
    const cleanSchool = {
      ...school,
      id: schoolId,
      ownerUid: school.ownerUid || 'platform-owner-system',
      updatedAt: new Date().toISOString(),
    };

    // Save/update school in cloud_schools.json
    const existingSchools = loadCloudSchools();
    const existingIndex = existingSchools.findIndex((s: any) => s.id === schoolId || s.code === cleanSchool.code);
    let updatedSchools: any[];
    if (existingIndex >= 0) {
      updatedSchools = [...existingSchools];
      updatedSchools[existingIndex] = { ...existingSchools[existingIndex], ...cleanSchool };
    } else {
      updatedSchools = [...existingSchools, cleanSchool];
    }
    saveCloudSchools(updatedSchools);

    // Save initial school admin user account with hashed password
    const adminId = `usr-admin-${Date.now()}`;
    const rawPass = (adminCredentials && adminCredentials.password) ? adminCredentials.password.trim() : 'admin123';
    const hashedPass = hashPassword(rawPass);

    const adminUser = {
      id: adminId,
      name: adminCredentials?.name || 'School Administrator',
      email: (adminCredentials?.email || `admin@${cleanSchool.code.toLowerCase()}.edu.gh`).trim().toLowerCase(),
      role: adminCredentials?.role || 'proprietor',
      title: adminCredentials?.title || 'Headmaster & Super Administrator',
      schoolId,
      password: hashedPass,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      createdAt: new Date().toISOString(),
    };

    // Update global cloud accounts
    const existingAccounts = loadCloudAccounts();
    const accountIndex = existingAccounts.findIndex(
      (a: any) => a.schoolId === schoolId && a.email.toLowerCase() === adminUser.email.toLowerCase()
    );
    if (accountIndex >= 0) {
      existingAccounts[accountIndex] = adminUser;
    } else {
      existingAccounts.push(adminUser);
    }
    saveCloudAccounts(existingAccounts);

    // Persist complete initial tenant data in tenants/{schoolId}.json
    const baseTenant = tenantData || {
      school: cleanSchool,
      users: [adminUser],
      students: [],
      classes: [],
      educationalSections: [],
      gradeClasses: [],
      subjects: [],
      admissions: [],
      examResults: [],
      feeItems: [
        { id: `fee-${schoolId}-1`, name: 'Tuition & Registration Fee', amount: 1850, term: cleanSchool.currentTerm, classLevel: 'All' },
      ],
      feePayments: [],
      transactions: [],
      staff: [],
      staffAttendance: [],
      timetable: [],
      attendance: [],
      libraryBooks: [],
      bookLoans: [],
      assets: [],
      routes: [],
      boardingHouses: [],
      healthRecords: [],
      announcements: [],
      researchArticles: [],
      programmes: [],
      programmeCourses: [],
      candidates: [],
      candidateAssessments: [],
      certificateTemplates: [],
      issuedCredentials: [],
      graduateRecords: [],
      replacementRequests: [],
      accreditations: [],
      verificationLogs: [],
      biometricGateLogs: [],
      photoChangeRequests: [],
      beceMockSeries: [],
      beceMockScores: [],
      beceInterventions: [],
      beceAiReports: [],
    };

    // Ensure admin user inside tenantData also has hashed password
    baseTenant.users = [
      adminUser,
      ...(baseTenant.users || []).filter((u: any) => u.email.toLowerCase() !== adminUser.email.toLowerCase()),
    ];

    saveTenantData(schoolId, baseTenant);

    // Background sync to Cloud SQL PostgreSQL
    if (process.env.SQL_HOST) {
      db.insert(sqlSchools)
        .values({
          id: cleanSchool.id,
          name: cleanSchool.name,
          code: cleanSchool.code,
          motto: cleanSchool.motto || '',
          levelType: cleanSchool.levelType || 'SHS',
          region: cleanSchool.region || 'Greater Accra',
          district: cleanSchool.district || '',
          address: cleanSchool.address || '',
          phone: cleanSchool.phone || '',
          email: cleanSchool.email || '',
          currency: cleanSchool.currency || 'GH₵',
          currentAcademicYear: cleanSchool.currentAcademicYear || '2025/2026',
          currentTerm: cleanSchool.currentTerm || 'Term 1',
          ownerUid: cleanSchool.ownerUid || 'platform-owner-system',
        })
        .onConflictDoNothing()
        .catch((e: any) => console.warn('Cloud SQL school sync warning:', e.message));
    }

    // Background sync to Firestore REST API
    syncSchoolToFirestore(cleanSchool);

    res.json({
      success: true,
      school: cleanSchool,
      admin: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        title: adminUser.title,
        schoolId: adminUser.schoolId,
        avatar: adminUser.avatar,
      },
      message: `Institution ${cleanSchool.name} registered and saved permanently to the central cloud database.`,
    });
  } catch (err: any) {
    console.error('Error creating cloud school:', err);
    res.status(500).json({ success: false, message: err.message || 'School creation failed.' });
  }
});

// 2B. Delete an institutional school from the central cloud database (Platform Owner)
app.delete('/api/cloud/schools/:schoolId', (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'Missing schoolId parameter.' });
    }

    const currentSchools = loadCloudSchools();
    const updated = currentSchools.filter((s: any) => s.id !== schoolId);
    saveCloudSchools(updated);

    // Remove tenant file if present
    const tFile = path.resolve(TENANTS_DIR, `${schoolId}.json`);
    if (fs.existsSync(tFile)) {
      try {
        fs.unlinkSync(tFile);
      } catch (e) {
        console.warn(`Could not delete tenant file for ${schoolId}:`, e);
      }
    }

    res.json({
      success: true,
      message: `Institution ${schoolId} removed from central cloud database.`,
      remainingCount: updated.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2C. Cloud SQL PostgreSQL Endpoints (DQL/DML)
app.get('/api/cloudsql/schools', async (_req: Request, res: Response) => {
  try {
    if (!process.env.SQL_HOST) {
      return res.json({ success: true, source: 'local', schools: loadCloudSchools() });
    }
    const rows = await db.select().from(sqlSchools);
    res.json({ success: true, source: 'cloudsql', count: rows.length, schools: rows });
  } catch (error: any) {
    console.error('Failed to fetch schools from Cloud SQL:', error);
    res.status(500).json({ success: false, error: 'Database query failed' });
  }
});

app.get('/api/cloudsql/users', async (_req: Request, res: Response) => {
  try {
    if (!process.env.SQL_HOST) {
      return res.json({ success: true, source: 'local', users: loadCloudAccounts() });
    }
    const rows = await db.select().from(sqlUsers);
    res.json({ success: true, source: 'cloudsql', count: rows.length, users: rows });
  } catch (error: any) {
    console.error('Failed to fetch users from Cloud SQL:', error);
    res.status(500).json({ success: false, error: 'Database query failed' });
  }
});

// 3. Fetch institutional tenant data (students, classes, streams, teachers, exams, fees, etc.)
app.get('/api/cloud/tenant/:schoolId', (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'Missing school ID' });
    }

    const tenant = loadTenantData(schoolId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: `No tenant records found for institution ${schoolId}` });
    }

    // Sanitize user passwords before sending to client
    const sanitizedUsers = (tenant.users || []).map((u: any) => ({
      ...u,
      hasPassword: Boolean(u.password && u.password.trim().length > 0),
      password: '', // Never return password hashes in general read requests
    }));

    res.json({
      success: true,
      tenant: {
        ...tenant,
        users: sanitizedUsers,
      },
      version: tenant.version || 1,
      lastModified: tenant.lastModified || new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Save/update institutional tenant data (enrolment, exam marks, attendance, fees, classes, streams)
app.post('/api/cloud/tenant/:schoolId', (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const { tenantData } = req.body;

    if (!schoolId || !tenantData) {
      return res.status(400).json({ success: false, message: 'Missing schoolId or tenantData.' });
    }

    // Preserve existing hashed passwords for users if plain password not provided
    const existing = loadTenantData(schoolId);
    const existingUsers = existing?.users || [];
    const incomingUsers = tenantData.users || [];

    const mergedUsers = incomingUsers.map((inc: any) => {
      const match = existingUsers.find(
        (ex: any) => ex.id === inc.id || ex.email.toLowerCase() === inc.email.toLowerCase()
      );
      if (inc.password && inc.password.trim()) {
        // If password was updated with plain-text, hash it
        const isAlreadyHashed = /^[a-f0-9]{64}$/i.test(inc.password);
        return {
          ...inc,
          password: isAlreadyHashed ? inc.password : hashPassword(inc.password),
        };
      }
      return {
        ...inc,
        password: match?.password || '',
      };
    });

    const toSave = {
      ...tenantData,
      users: mergedUsers,
    };

    const saved = saveTenantData(schoolId, toSave);

    // Also update cloud_accounts index for cross-device authentication
    const cloudAccounts = loadCloudAccounts();
    for (const u of mergedUsers) {
      const idx = cloudAccounts.findIndex(
        (a: any) => a.schoolId === schoolId && a.email.toLowerCase() === u.email.toLowerCase()
      );
      const accRecord = {
        id: u.id,
        name: u.name,
        email: u.email.toLowerCase(),
        role: u.role,
        title: u.title,
        schoolId,
        password: u.password,
        avatar: u.avatar,
        studentId: u.studentId,
        candidateId: u.candidateId,
      };
      if (idx >= 0) {
        cloudAccounts[idx] = { ...cloudAccounts[idx], ...accRecord };
      } else {
        cloudAccounts.push(accRecord);
      }
    }
    saveCloudAccounts(cloudAccounts);

    res.json({
      success: true,
      version: saved.version,
      lastModified: saved.lastModified,
      message: 'Institution records saved to central cloud database.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Lightweight metadata poll endpoint for real-time synchronization across devices
app.get('/api/cloud/tenant/:schoolId/meta', (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const tenant = loadTenantData(schoolId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    res.json({
      success: true,
      schoolId,
      version: tenant.version || 1,
      lastModified: tenant.lastModified || '',
      studentCount: (tenant.students || []).length,
      classCount: (tenant.classes || []).length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Cross-device shared authentication endpoint
app.post('/api/cloud/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password, schoolId, loginMode } = req.body;
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId) {
      return res.status(400).json({ success: false, message: 'Please provide email or ID.' });
    }

    // Platform Owner login
    const BOOTSTRAPPED_OWNER_EMAIL = 'appeadusolomon65@gmail.com'.toLowerCase();
    if (loginMode === 'owner' || cleanId === BOOTSTRAPPED_OWNER_EMAIL) {
      if (cleanId !== BOOTSTRAPPED_OWNER_EMAIL) {
        return res.json({
          success: false,
          message: 'Only the verified Platform Owner email address can sign in under Platform Owner access.',
        });
      }
      return res.json({
        success: true,
        isPlatformAdmin: true,
        role: 'platform_owner',
        user: {
          id: 'usr-platform-owner',
          name: 'Solomon Appeadu',
          email: BOOTSTRAPPED_OWNER_EMAIL,
          role: 'platform_owner',
          title: 'InfoDigital Platform Owner & Principal Architect',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          schoolId: schoolId || 'sch-platform',
        },
      });
    }

    // Institutional login across schools
    const cloudAccounts = loadCloudAccounts();
    let matchedAccount = cloudAccounts.find((a: any) => {
      const matchEmail = a.email && a.email.toLowerCase() === cleanId;
      const matchId = (a.id && a.id.toLowerCase() === cleanId) ||
        (a.studentId && a.studentId.toLowerCase() === cleanId) ||
        (a.candidateId && a.candidateId.toLowerCase() === cleanId);
      if (schoolId) {
        return (matchEmail || matchId) && a.schoolId === schoolId;
      }
      return matchEmail || matchId;
    });

    // Fallback: If not in global accounts array, search tenant files directly
    if (!matchedAccount && fs.existsSync(TENANTS_DIR)) {
      try {
        const tenantFiles = fs.readdirSync(TENANTS_DIR);
        for (const file of tenantFiles) {
          if (!file.endsWith('.json')) continue;
          try {
            const rawTenant = fs.readFileSync(path.resolve(TENANTS_DIR, file), 'utf-8');
            const parsedTenant = JSON.parse(rawTenant);
            const tenantUsers: any[] = parsedTenant.users || [];
            const foundUser = tenantUsers.find((u: any) => {
              const matchEmail = u.email && u.email.toLowerCase() === cleanId;
              const matchId = (u.id && u.id.toLowerCase() === cleanId) ||
                (u.studentId && u.studentId.toLowerCase() === cleanId) ||
                (u.candidateId && u.candidateId.toLowerCase() === cleanId);
              if (schoolId) {
                return (matchEmail || matchId) && (u.schoolId === schoolId || parsedTenant.school?.id === schoolId);
              }
              return matchEmail || matchId;
            });
            if (foundUser) {
              matchedAccount = {
                ...foundUser,
                schoolId: foundUser.schoolId || parsedTenant.school?.id || file.replace('.json', ''),
              };
              // Cache in cloud accounts for faster future lookup
              cloudAccounts.push(matchedAccount);
              saveCloudAccounts(cloudAccounts);
              break;
            }
          } catch {}
        }
      } catch (scanErr) {
        console.warn('Tenant account scan notice:', scanErr);
      }
    }

    if (!matchedAccount) {
      return res.json({
        success: false,
        message: 'No institutional account found with this email or ID. Please check your credentials or reset password.',
      });
    }

    // Verify password if one exists on the account
    if (matchedAccount.password) {
      if (!cleanPass) {
        return res.json({ success: false, message: 'Password is required for this account.' });
      }
      const passOk = verifyPassword(cleanPass, matchedAccount.password);
      if (!passOk) {
        return res.json({ success: false, message: 'Incorrect password.' });
      }
    }

    res.json({
      success: true,
      schoolId: matchedAccount.schoolId,
      role: matchedAccount.role,
      user: {
        id: matchedAccount.id,
        name: matchedAccount.name,
        email: matchedAccount.email,
        role: matchedAccount.role,
        title: matchedAccount.title,
        schoolId: matchedAccount.schoolId,
        avatar: matchedAccount.avatar,
        studentId: matchedAccount.studentId,
        candidateId: matchedAccount.candidateId,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Cross-device password reset endpoint
app.post('/api/cloud/auth/reset-password', (req: Request, res: Response) => {
  try {
    const { identifier, newPassword, schoolId, mode } = req.body;
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (newPassword || '').trim();

    if (!cleanId || cleanPass.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const hashed = hashPassword(cleanPass);
    const cloudAccounts = loadCloudAccounts();
    const targetIdx = cloudAccounts.findIndex((a: any) => {
      const matchEmail = a.email && a.email.toLowerCase() === cleanId;
      const matchId = a.id && a.id.toLowerCase() === cleanId;
      return schoolId ? (matchEmail || matchId) && a.schoolId === schoolId : (matchEmail || matchId);
    });

    if (targetIdx < 0) {
      return res.json({
        success: false,
        message: 'No account found matching this identifier. Please verify your email or ID.',
      });
    }

    cloudAccounts[targetIdx].password = hashed;
    saveCloudAccounts(cloudAccounts);

    // Also update in tenant file if exists
    const acc = cloudAccounts[targetIdx];
    const tenant = loadTenantData(acc.schoolId);
    if (tenant && Array.isArray(tenant.users)) {
      tenant.users = tenant.users.map((u: any) =>
        u.email.toLowerCase() === cleanId || u.id === acc.id ? { ...u, password: hashed } : u
      );
      saveTenantData(acc.schoolId, tenant);
    }

    res.json({
      success: true,
      message: `Password reset successfully. You can now log in across any device.`,
      updatedEmail: acc.email,
      updatedRoleLabel: acc.title || acc.role,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Safe migration of local browser data to central cloud database
app.post('/api/cloud/migrate-local', (req: Request, res: Response) => {
  try {
    const { schools, tenants } = req.body;
    let migratedSchoolsCount = 0;
    let migratedTenantsCount = 0;

    const cloudSchools = loadCloudSchools();
    const existingIds = new Set(cloudSchools.map((s: any) => s.id));
    const existingCodes = new Set(cloudSchools.map((s: any) => s.code?.toUpperCase()));

    if (Array.isArray(schools)) {
      for (const sch of schools) {
        if (!sch || !sch.id || !sch.name) continue;
        const codeUpper = sch.code?.toUpperCase();
        if (!existingIds.has(sch.id) && !existingCodes.has(codeUpper)) {
          cloudSchools.push(sch);
          existingIds.add(sch.id);
          if (codeUpper) existingCodes.add(codeUpper);
          migratedSchoolsCount++;
          syncSchoolToFirestore(sch);
        }
      }
      if (migratedSchoolsCount > 0) {
        saveCloudSchools(cloudSchools);
      }
    }

    if (tenants && typeof tenants === 'object') {
      for (const [schId, tenantData] of Object.entries(tenants)) {
        if (!schId || !tenantData) continue;
        const currentTenant = loadTenantData(schId);
        if (!currentTenant) {
          saveTenantData(schId, tenantData);
          migratedTenantsCount++;
        }
      }
    }

    res.json({
      success: true,
      migratedSchoolsCount,
      migratedTenantsCount,
      message: `Migration complete: ${migratedSchoolsCount} institutions and ${migratedTenantsCount} tenant datasets saved to cloud.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Upload asset (student photograph, institution crest, certificate template)
app.post('/api/cloud/upload-asset', (req: Request, res: Response) => {
  try {
    const { dataUrl, fileName, folder } = req.body;
    if (!dataUrl || !dataUrl.includes('base64,')) {
      return res.status(400).json({ success: false, message: 'Valid base64 Data URL is required.' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid Data URL format.' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('pdf')) ext = 'pdf';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('svg')) ext = 'svg';

    const safeName = (fileName || `asset-${Date.now()}`)
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .slice(0, 60);
    const finalFileName = `${safeName}-${Date.now()}.${ext}`;

    const targetSubDir = folder ? path.resolve(UPLOADS_DIR, folder.replace(/[^a-zA-Z0-9_\-]/g, '')) : UPLOADS_DIR;
    if (!fs.existsSync(targetSubDir)) {
      fs.mkdirSync(targetSubDir, { recursive: true });
    }

    const targetFilePath = path.resolve(targetSubDir, finalFileName);
    fs.writeFileSync(targetFilePath, buffer);

    const publicUrl = folder
      ? `/uploads/${folder}/${finalFileName}`
      : `/uploads/${finalFileName}`;

    res.json({
      success: true,
      url: publicUrl,
      fileName: finalFileName,
      fileSizeBytes: buffer.length,
    });
  } catch (err: any) {
    console.error('Asset upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

let cachedAiClient: GoogleGenAI | null = null;
async function getAiClient(): Promise<GoogleGenAI> {
  if (!cachedAiClient) {
    const { GoogleGenAI: GoogleGenAIClient } = await import('@google/genai');
    cachedAiClient = new GoogleGenAIClient({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAiClient;
}

// AI Endpoint: Academic Performance & Attendance Analytics
app.post('/api/gemini/academic-insights', async (req: Request, res: Response) => {
  try {
    const { schoolName, classData, studentsData } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        analysis: "Demo AI Mode: Strong academic progress observed. Recommended interventions: Form 2 Science needs additional practical sessions in Elective Chemistry; 3 students flagged for attendance below 80%. Overall pass rate is 88.4% across Core Mathematics and Integrated Science.",
        recommendations: [
          "Organize targeted math clinics for students with class scores below 18/30",
          "Acknowledge top performing students in WASSCE mock evaluations",
          "Send automated SMS alerts to parents of students with >3 consecutive absences"
        ]
      });
    }

    const prompt = `You are an expert Ghanaian educational psychologist and Senior High School / Basic School academic consultant for "${schoolName || 'Ghanaian Institution'}".
Analyze the following student performance and attendance data:
${JSON.stringify({ classData, studentsData })}

Provide a concise, practical evaluation report in structured JSON format with:
1. "summary": Executive summary of academic strengths and weaknesses
2. "atRiskStudents": List of students needing immediate remedial intervention with reason
3. "curriculumInsights": Specific subjects needing syllabus reinforcement
4. "actionableRecommendations": 3-5 concrete steps for the Headmaster, HODs, and PTA.

Return ONLY valid JSON.`;

    const ai = await getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini academic-insights error:', error);
    return res.status(500).json({ error: error.message || 'AI generation failed' });
  }
});

// AI Endpoint: GES Lesson Plan Builder (Ghana Education Service / NaCCA standard)
app.post('/api/gemini/lesson-plan', async (req: Request, res: Response) => {
  try {
    const { subject, classLevel, topic, duration, strand, subStrand } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        subject: subject || 'Integrated Science',
        classLevel: classLevel || 'JHS 2 / Form 2',
        strand: strand || 'Diversity of Matter',
        subStrand: subStrand || 'Elements, Compounds and Mixtures',
        contentStandard: `B8.1.1.1: Demonstrate an understanding of atomic structure and chemical combinations.`,
        learningIndicator: `B8.1.1.1.2: Differentiate between elements, compounds and chemical mixtures with Ghanaian everyday examples (e.g., brass, gari and water, air).`,
        coreCompetencies: 'Critical Thinking and Problem Solving, Collaboration and Communication, Digital Literacy',
        resources: 'Samples of salt, iron filings, sulphur, water, beaker, magnet, projector',
        starterPhase: '5 mins: Show learners a bowl of gari mix and pure water. Ask learners which can be separated physically.',
        mainPhase: [
          'Step 1 (15 mins): Teacher explains definitions of pure elements vs compounds vs mixtures with atomic diagrams.',
          'Step 2 (20 mins): Group activity where learners separate iron filings from sand using magnets.',
          'Step 3 (10 mins): Presentation of group findings and table summary.'
        ],
        assessment: 'Formative quiz: Classify 5 substances into element, compound, or mixture (Table salt, Oxygen, Shito sauce, Bronze, Water).',
        homework: 'List five mixtures found in your kitchen at home and explain how each can be separated.'
      });
    }

    const prompt = `Generate a comprehensive Ghana Education Service (GES) and National Council for Curriculum and Assessment (NaCCA) standard lesson plan note.
Subject: ${subject}
Class Level: ${classLevel}
Topic: ${topic}
Duration: ${duration || '60 minutes'}
Strand: ${strand || 'Relevant GES Strand'}
Sub-strand: ${subStrand || 'Relevant GES Sub-strand'}

Respond in JSON with the exact fields:
- "strand": string
- "subStrand": string
- "contentStandard": string (GES code e.g. B7.2.1.1 or SHS standard)
- "learningIndicator": string
- "coreCompetencies": string
- "resources": string
- "starterPhase": string
- "mainPhase": array of strings (Step 1, Step 2, Step 3)
- "assessment": string
- "homework": string`;

    const ai = await getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini lesson-plan error:', error);
    return res.status(500).json({ error: error.message || 'AI lesson plan generation failed' });
  }
});

// AI Endpoint: WAEC / WASSCE / BECE Question & Marking Scheme Generator
app.post('/api/gemini/generate-questions', async (req: Request, res: Response) => {
  try {
    const { subject, examType, topic, count, difficulty } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        questions: [
          {
            number: 1,
            type: 'Section A (Objective)',
            question: `In the expansion of (2x - 3)^4, what is the coefficient of x^2?`,
            options: ['A) 216', 'B) -216', 'C) 96', 'D) 108'],
            correctAnswer: 'A) 216',
            markingScheme: 'Using binomial expansion term: 4C2 * (2x)^2 * (-3)^2 = 6 * 4x^2 * 9 = 216x^2. Hence coefficient is 216.'
          },
          {
            number: 2,
            type: 'Section B (Theory / Structured)',
            question: `(a) Define Osmosis in living tissues. (b) Describe an experiment using an Irish potato or yam cup to demonstrate osmosis in concentrated sucrose solution.`,
            markingScheme: '(a) Osmosis is the movement of water molecules from a region of lower solute concentration (higher water potential) to a region of higher solute concentration (lower water potential) across a selectively permeable membrane (3 marks). (b) Peeling potato, cutting cavity, adding sucrose, beaker of water, observation of level change (7 marks).'
          }
        ]
      });
    }

    const prompt = `You are a Senior WAEC (West African Examinations Council) Chief Examiner for Ghanaian schools setting ${examType || 'WASSCE'} questions for:
Subject: ${subject}
Topic: ${topic}
Number of questions: ${count || 3}
Difficulty: ${difficulty || 'Standard WAEC Level'}

Return JSON format with a "questions" array, where each item has:
- "number": number
- "type": "Section A (Multiple Choice)" or "Section B (Theory)"
- "question": string
- "options": optional array of strings (for MCQs)
- "correctAnswer": string
- "markingScheme": detailed marks allocation breakdown`;

    const ai = await getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini generate-questions error:', error);
    return res.status(500).json({ error: error.message || 'Question generation failed' });
  }
});

// AI Endpoint: Personalized Terminal Report Card Comments
app.post('/api/gemini/report-comment', async (req: Request, res: Response) => {
  try {
    const { studentName, classLevel, averageScore, attendanceRate, conduct, strengths, weaknesses } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        classTeacherRemark: `${studentName} has shown commendable dedication this term with an average of ${averageScore}%. Maintains a respectful attitude and active participation in class discussions.`,
        headteacherRemark: `An impressive terminal result. Promoted with praise. Keep up the high standard in the coming term.`,
        suggestedIntervention: `Encourage reading wider literature to further refine essay composition.`
      });
    }

    const prompt = `Generate formal, encouraging, constructive school report card comments for a student in a Ghanaian school:
Student: ${studentName}
Class: ${classLevel}
Average Mark: ${averageScore}%
Attendance: ${attendanceRate}%
Conduct: ${conduct || 'Good'}
Strengths: ${strengths || 'Consistent class work, good teamwork'}
Weaknesses / Areas for Improvement: ${weaknesses || 'Needs more focus during end-of-term examinations'}

Return JSON:
- "classTeacherRemark": string (2-3 sentences)
- "headteacherRemark": string (1-2 decisive sentences)
- "suggestedIntervention": string (actionable advice for parents)`;

    const ai = await getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini report-comment error:', error);
    return res.status(500).json({ error: error.message || 'Report comment generation failed' });
  }
});

// AI Endpoint: BECE Mock Performance Analysis, Personalised Learning Support & Readiness Prediction Report
app.post('/api/gemini/bece-mock-support', async (req: Request, res: Response) => {
  try {
    const {
      schoolName,
      studentName,
      className,
      mockHistory,
      latestSubjects,
      latestAggregate,
      trendDirection,
      attendanceRatePercent,
      continuousAssessmentAvg,
    } = req.body;

    const safeSubjects: Array<{
      subjectName: string;
      totalScore: number;
      beceGrade: number;
      sectionAScore?: number;
      sectionBScore?: number;
    }> = Array.isArray(latestSubjects) ? latestSubjects : [];

    const guidanceDisclaimer =
      'Educational Guidance Notice: This BECE Readiness & Performance Prediction Report is generated from mock examinations, continuous assessments, and attendance trends solely for academic planning and revision support. It is not a guaranteed WAEC BECE outcome.';

    if (!process.env.GEMINI_API_KEY) {
      // Dynamic, student-specific fallback derived directly from the student's actual mock subject scores
      const sortedAsc = [...safeSubjects].sort((a, b) => a.totalScore - b.totalScore);
      const sortedDesc = [...safeSubjects].sort((a, b) => b.totalScore - a.totalScore);
      const weakest = sortedAsc.slice(0, 3);
      const strongest = sortedDesc.slice(0, 2);

      const topicCatalog: Record<string, { diffs: string[]; topics: string[]; q: string; opts?: string[]; ans: string; scheme: string }> = {
        mathematics: {
          diffs: ['Algebraic expressions & linear inequalities', 'Mensuration of plane & solid shapes', 'Fractions, ratios & commercial arithmetic'],
          topics: ['Solving linear equations & word problems', 'Area, perimeter & volume of cylinders/cones', 'Venn diagrams (two-set problems) & probability'],
          q: 'In a JHS 3 class of 45 learners, 28 study French, 24 study Computing, and each learner studies at least one of the two subjects. How many learners study both subjects?',
          opts: ['A) 5', 'B) 7', 'C) 11', 'D) 17'],
          ans: 'B) 7',
          scheme: 'Let x = learners studying both. (28 - x) + x + (24 - x) = 45 => 52 - x = 45 => x = 7 learners (4 marks).',
        },
        science: {
          diffs: ['Chemical equations, acids, bases & salts', 'Electrical circuits & energy transformations', 'Human digestive & circulatory systems'],
          topics: ['Balancing simple chemical equations & pH indicators', 'Series vs parallel circuits & Ohm’s relationship', 'Photosynthesis, respiration & Osmosis experiments'],
          q: '(a) State two differences between a physical change and a chemical change. (b) Explain why table salt dissolved in water can be recovered by evaporation.',
          ans: 'Physical changes form no new substance and are reversible; evaporation removes water solvent leaving NaCl crystals.',
          scheme: '(a) Two valid contrasts: new substance vs no new substance; reversibility; heat changes (4 marks). (b) Water has a lower boiling point than NaCl and vaporizes leaving salt residue (6 marks).',
        },
        english: {
          diffs: ['Subject-verb concord & tense consistency in formal letters', 'Summary comprehension inference questions', 'Idiomatic expressions & lexical register'],
          topics: ['Formal letter & debate speech writing structure', 'Direct & indirect speech transformations', 'Comprehension vocabulary replacement in context'],
          q: 'Choose the word nearest in meaning to the underlined word: The headteacher commended the candidates for their diligence during the mock week.',
          opts: ['A) rebuked', 'B) praised', 'C) questioned', 'D) excused'],
          ans: 'B) praised',
          scheme: '"Commended" in formal context means praised or applauded (2 marks).',
        },
        social: {
          diffs: ['Constitutional governance & organs of government', 'Map reading, scale & cardinal bearings', 'Sustainable resource development in Ghana'],
          topics: ['Separation of powers & checks and balances', 'Environmental conservation & illegal mining impacts', 'Ghana’s post-independence socio-economic milestones'],
          q: 'Explain three ways in which environmental degradation affects agricultural productivity in rural Ghanaian communities.',
          ans: 'Loss of topsoil fertility, pollution of irrigation water bodies, and erratic micro-climate rainfall.',
          scheme: '3 well-explained points × 4 marks each = 12 marks (statement 1m, explanation with Ghanaian example 3m).',
        },
      };

      const lookupSubjectGuide = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('math')) return topicCatalog.mathematics;
        if (lower.includes('science')) return topicCatalog.science;
        if (lower.includes('english')) return topicCatalog.english;
        return topicCatalog.social;
      };

      const agg = Number(latestAggregate) || 18;
      const readinessLevel =
        agg <= 10
          ? 'High Readiness (Distinction Track)'
          : agg <= 18
          ? 'On Track (Credit Readiness)'
          : agg <= 26
          ? 'Developing (Targeted Support Needed)'
          : 'Priority Intervention Required';

      const lowBound = Math.max(6, agg - 3);
      const highBound = Math.min(54, agg + 2);

      const subjectDiagnoses = safeSubjects.map((sub) => {
        const guide = lookupSubjectGuide(sub.subjectName);
        const status =
          sub.totalScore >= 70
            ? 'Strength'
            : sub.totalScore >= 55
            ? 'Moderate'
            : 'Needs Urgent Attention';
        return {
          subjectName: sub.subjectName,
          latestScore: sub.totalScore,
          latestGrade: sub.beceGrade,
          status,
          areasOfDifficulty: status === 'Strength' ? ['Timed Section B presentation accuracy'] : guide.diffs,
          revisionTopics: guide.topics,
          targetedAction:
            status === 'Strength'
              ? `Maintain high momentum in ${sub.subjectName} with weekly timed WAEC past papers to secure Grade 1.`
              : `Complete 3 focused 45-minute topic drills per week in ${sub.subjectName} and review Section B marking schemes with subject teacher.`,
        };
      });

      const practiceQuestions = (weakest.length > 0 ? weakest : safeSubjects.slice(0, 2)).map((sub) => {
        const guide = lookupSubjectGuide(sub.subjectName);
        return {
          subjectName: sub.subjectName,
          topic: guide.topics[0],
          questionType: guide.opts ? 'Section A (Objective)' : 'Section B (Structured Theory)',
          question: guide.q,
          options: guide.opts,
          correctAnswer: guide.ans,
          markingScheme: guide.scheme,
        };
      });

      const w1 = weakest[0]?.subjectName || 'Core Mathematics';
      const w2 = weakest[1]?.subjectName || 'Integrated Science';
      const s1 = strongest[0]?.subjectName || 'English Language';

      return res.json({
        readinessLevel,
        predictedAggregateBand: `Aggregate ${String(lowBound).padStart(2, '0')} – ${String(highBound).padStart(2, '0')} (Advisory Range)`,
        executiveSummary: `${studentName || 'Candidate'} currently holds a Best-6 Mock Aggregate of ${agg} (${trendDirection || 'Maintaining'} trend) with ${attendanceRatePercent ?? 92}% attendance and ${continuousAssessmentAvg ?? 68}% continuous assessment average. Strongest mastery is recorded in ${s1}, while ${w1} and ${w2} require structured revision drills to lift overall BECE placement readiness.`,
        guidanceDisclaimer,
        subjectDiagnoses,
        practiceQuestions,
        weeklyStudyPlan: [
          { day: 'Monday', focusSubject: w1, topics: lookupSubjectGuide(w1).topics[0], activity: '40 mins concept review + 5 worked BECE Section B questions', durationMinutes: 60 },
          { day: 'Tuesday', focusSubject: w2, topics: lookupSubjectGuide(w2).topics[0], activity: 'Diagram labelling, definitions & 20 objective questions', durationMinutes: 60 },
          { day: 'Wednesday', focusSubject: s1, topics: 'Timed WAEC Past Paper Maintenance', activity: 'Full Section A timed drill to consolidate Grade 1–2 strength', durationMinutes: 45 },
          { day: 'Thursday', focusSubject: w1, topics: lookupSubjectGuide(w1).topics[1], activity: 'Error-log correction with Mathematics/Subject Clinic teacher', durationMinutes: 60 },
          { day: 'Friday', focusSubject: w2, topics: lookupSubjectGuide(w2).topics[1], activity: 'Structured theory essay/experiment practice with marking scheme', durationMinutes: 60 },
          { day: 'Saturday', focusSubject: 'Combined Core Mock Drill', topics: `${w1}, ${w2} & ${s1}`, activity: '90-minute simulated BECE revision paper under exam conditions', durationMinutes: 90 },
        ],
        recommendedInterventions: [
          {
            interventionType: 'Remedial Classes',
            subjectName: w1,
            rationale: `Targeted small-group clinic to address ${w1} foundational gaps before the next mock series.`,
          },
          {
            interventionType: 'WAEC Past-Question Practice',
            subjectName: w2,
            rationale: `Weekly supervised marking-scheme walkthroughs to improve Section B written precision in ${w2}.`,
          },
          {
            interventionType: 'Structured Revision Timetable',
            subjectName: s1,
            rationale: `Sustain strong performance in ${s1} while reallocating 65% of evening prep hours to weaker core subjects.`,
          },
        ],
      });
    }

    const prompt = `You are a Senior Ghana Education Service (GES) & WAEC Basic Education Certificate Examination (BECE) Academic Advisor for "${schoolName || 'Ghana Basic School'}".
Analyse this JHS candidate's longitudinal BECE mock examination records, continuous assessment average, and attendance rate:

Student: ${studentName}
Class: ${className}
Latest Best-6 Mock Aggregate: ${latestAggregate} (6 is highest distinction, 54 is lowest)
Performance Trend: ${trendDirection}
Attendance Rate: ${attendanceRatePercent}%
Continuous Assessment Average: ${continuousAssessmentAvg}%
Mock History Across Series: ${JSON.stringify(mockHistory)}
Latest Subject Breakdown: ${JSON.stringify(safeSubjects)}

Generate a personalised BECE Readiness, Learning Support & Intervention Report in valid JSON with these exact keys:
- "readinessLevel": one of "High Readiness (Distinction Track)", "On Track (Credit Readiness)", "Developing (Targeted Support Needed)", or "Priority Intervention Required"
- "predictedAggregateBand": string (e.g., "Aggregate 08 – 12 (Advisory Range)")
- "executiveSummary": string (3-4 sentences highlighting strengths, subjects needing attention, and trajectory)
- "guidanceDisclaimer": string (explicitly state that predictions are educational guidance based on mocks, continuous assessment, and attendance, not guaranteed examination outcomes)
- "subjectDiagnoses": array of objects with { "subjectName": string, "latestScore": number, "latestGrade": number, "status": "Strength" | "Moderate" | "Needs Urgent Attention", "areasOfDifficulty": string[], "revisionTopics": string[], "targetedAction": string }
- "practiceQuestions": array of 3-4 targeted BECE practice questions focusing on the student's weakest subjects, each with { "subjectName": string, "topic": string, "questionType": "Section A (Objective)" | "Section B (Structured Theory)", "question": string, "options": string[] (optional, include for Section A), "correctAnswer": string, "markingScheme": string }
- "weeklyStudyPlan": array of 6 days (Monday to Saturday), each with { "day": string, "focusSubject": string, "topics": string, "activity": string, "durationMinutes": number }
- "recommendedInterventions": array of 3 practical school/home interventions, each with { "interventionType": "Remedial Classes" | "Extra Lessons / Clinic" | "Peer Tutoring" | "Teacher Consultation" | "Structured Revision Timetable" | "WAEC Past-Question Practice" | "Regular Progress Assessment", "subjectName": string, "rationale": string }

Return ONLY valid JSON.`;

    const ai = await getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.guidanceDisclaimer) {
      parsed.guidanceDisclaimer = guidanceDisclaimer;
    }
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini bece-mock-support error:', error);
    return res.status(500).json({ error: error.message || 'BECE learning support analysis failed' });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasBuiltDist = fs.existsSync(path.resolve(distPath, 'index.html'));
  const isRunningInDev =
    process.env.npm_lifecycle_event === 'dev' ||
    process.execArgv.some((arg) => arg.includes('tsx')) ||
    (process.env.NODE_OPTIONS || '').includes('tsx');
  const isProd =
    process.env.NODE_ENV === 'production' || (!isRunningInDev && hasBuiltDist);
  const isDev = !isProd;
  const httpServer = http.createServer(app);

  if (isDev) {
    const viteReady = (async () => {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode:
            process.env.DISABLE_HMR === 'true' ? true : { server: httpServer },
        },
        appType: 'spa',
      });
      return vite.middlewares;
    })();

    viteReady.catch((err) => {
      console.error('Failed to initialize Vite middleware:', err);
    });

    app.use(async (req: Request, res: Response, next: NextFunction) => {
      try {
        const middlewares = await viteReady;
        middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
