import { SchoolProfile, UserAccount, SchoolTenantData, RoleType } from '../types';
import {
  CloudSchoolsResponse,
  CloudCreateSchoolRequest,
  CloudCreateSchoolResponse,
  CloudTenantResponse,
  CloudTenantMetaResponse,
  CloudAuthLoginRequest,
  CloudAuthLoginResponse,
  CloudResetPasswordRequest,
  CloudResetPasswordResponse,
  CloudLocalMigrationRequest,
  CloudLocalMigrationResponse,
  CloudAssetUploadRequest,
  CloudAssetUploadResponse,
} from '../types/cloudApi';

const CLOUD_API_BASE = '/api/cloud';

/**
 * Fetch all registered schools from the central cloud database.
 */
export async function fetchCloudSchools(): Promise<SchoolProfile[]> {
  try {
    const res = await fetch(`${CLOUD_API_BASE}/schools`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Cloud schools query returned status ${res.status}`);
    }
    const data: CloudSchoolsResponse = await res.json();
    return data.schools || [];
  } catch (error) {
    console.warn('Central cloud database fetch schools error, falling back to cached state:', error);
    return [];
  }
}

/**
 * Persist newly onboarded school and admin credentials permanently to the central cloud database.
 */
export async function createCloudSchool(
  params: CloudCreateSchoolRequest
): Promise<CloudCreateSchoolResponse> {
  const reqPayload: CloudCreateSchoolRequest = {
    school: params.school,
    adminCredentials: params.adminCredentials || (params.adminUser ? {
      name: params.adminUser.name,
      email: params.adminUser.email,
      password: params.initialPassword,
      title: params.adminUser.title,
      role: params.adminUser.role,
    } : undefined),
    adminUser: params.adminUser,
    tenantData: params.tenantData,
    initialPassword: params.initialPassword,
    curriculumOptions: params.curriculumOptions,
  };

  const res = await fetch(`${CLOUD_API_BASE}/schools`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqPayload),
  });

  if (!res.ok) {
    const errText = await res.text();
    let msg = `Failed to create school in cloud database (status ${res.status})`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.message) msg = parsed.message;
    } catch {
      // Ignore
    }
    throw new Error(msg);
  }

  const data: CloudCreateSchoolResponse = await res.json();
  return data;
}

/**
 * Fetch institutional tenant data (students, classes, streams, teachers, exams, fees, etc.) from the cloud database.
 */
export async function fetchCloudTenantData(
  schoolId: string
): Promise<{ tenant: SchoolTenantData; version: number } | null> {
  if (!schoolId || schoolId === 'sch-uninitialized') return null;

  try {
    const res = await fetch(`${CLOUD_API_BASE}/tenant/${encodeURIComponent(schoolId)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Cloud tenant query returned status ${res.status}`);
    }
    const data: CloudTenantResponse = await res.json();
    if (data.success && data.tenant) {
      return { tenant: data.tenant, version: data.version || 1 };
    }
    return null;
  } catch (error) {
    console.warn(`Central cloud tenant fetch error for ${schoolId}:`, error);
    return null;
  }
}

/**
 * Save/update an institution's tenant state in the central cloud database.
 */
export async function saveCloudTenantData(
  schoolId: string,
  tenantData: SchoolTenantData,
  actionSummary?: string
): Promise<{ success: boolean; version?: number; error?: string }> {
  if (!schoolId || schoolId === 'sch-uninitialized') {
    return { success: false, error: 'Invalid school ID' };
  }

  try {
    const res = await fetch(`${CLOUD_API_BASE}/tenant/${encodeURIComponent(schoolId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId,
        tenantData,
        actionSummary,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Cloud save error (status ${res.status}): ${errText}` };
    }

    const data = await res.json();
    return { success: true, version: data.version };
  } catch (error: any) {
    console.error(`Failed to save cloud tenant for ${schoolId}:`, error);
    return { success: false, error: error?.message || 'Network error' };
  }
}

/**
 * Check lightweight metadata for an institution to detect real-time changes made by other devices.
 */
export async function fetchCloudTenantMeta(schoolId: string): Promise<CloudTenantMetaResponse | null> {
  if (!schoolId || schoolId === 'sch-uninitialized') return null;
  try {
    const res = await fetch(`${CLOUD_API_BASE}/tenant/${encodeURIComponent(schoolId)}/meta`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Authenticate an institutional user (admin, teacher, student, parent) or platform owner against the central cloud database.
 */
export async function authenticateCloudUser(
  request: CloudAuthLoginRequest
): Promise<CloudAuthLoginResponse> {
  try {
    const res = await fetch(`${CLOUD_API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const data: CloudAuthLoginResponse = await res.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Unable to connect to central authentication service.',
    };
  }
}

/**
 * Reset an account password across the central cloud database.
 */
export async function resetCloudUserPassword(
  request: CloudResetPasswordRequest
): Promise<CloudResetPasswordResponse> {
  try {
    const res = await fetch(`${CLOUD_API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const data: CloudResetPasswordResponse = await res.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Unable to reach password reset service.',
    };
  }
}

/**
 * Migrates existing local schools and records from localStorage to the central cloud database.
 */
export async function migrateLocalSchoolsToCloud(
  schools: SchoolProfile[],
  tenants: Record<string, SchoolTenantData>
): Promise<CloudLocalMigrationResponse> {
  try {
    const payload: CloudLocalMigrationRequest = { schools, tenants };
    const res = await fetch(`${CLOUD_API_BASE}/migrate-local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Migration returned status ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      migratedSchoolsCount: 0,
      migratedTenantsCount: 0,
      message: error?.message || 'Local migration failed',
    };
  }
}

/**
 * Upload student photograph, school crest, or document to the cloud asset store.
 */
export async function uploadAssetToCloud(
  dataUrl: string,
  fileName?: string,
  folder?: string
): Promise<CloudAssetUploadResponse> {
  const payload: CloudAssetUploadRequest = { dataUrl, fileName, folder };
  const res = await fetch(`${CLOUD_API_BASE}/upload-asset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Asset upload failed with status ${res.status}`);
  }

  return await res.json();
}
