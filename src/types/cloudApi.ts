import { SchoolProfile, UserAccount, SchoolTenantData, RoleType } from './index';

export interface CloudSchoolsResponse {
  success: boolean;
  schools: SchoolProfile[];
  source?: 'cloud' | 'local_fallback';
  totalCount: number;
}

export interface CloudCreateSchoolRequest {
  school: Omit<SchoolProfile, 'id'> & { id?: string };
  adminCredentials?: {
    name: string;
    email: string;
    password?: string;
    title?: string;
    role?: RoleType;
  };
  adminUser?: UserAccount;
  tenantData?: SchoolTenantData;
  initialPassword?: string;
  curriculumOptions?: {
    customCourses?: string[];
    customSubjects?: string[];
    skipAutoDefaults?: boolean;
    offeredPresetId?: string;
    offeredSectionIds?: string[];
  };
}

export interface CloudCreateSchoolResponse {
  success: boolean;
  school: SchoolProfile;
  admin: UserAccount;
  message?: string;
}

export interface CloudTenantResponse {
  success: boolean;
  tenant: SchoolTenantData;
  version: number;
  lastModified: string;
  isInitialSeed?: boolean;
}

export interface CloudSaveTenantRequest {
  schoolId: string;
  tenantData: SchoolTenantData;
  updatedByUid?: string;
  actionSummary?: string;
}

export interface CloudTenantMetaResponse {
  success: boolean;
  schoolId: string;
  version: number;
  lastModified: string;
  studentCount: number;
  classCount: number;
  exists?: boolean;
}

export interface CloudAuthLoginRequest {
  identifier: string;
  password?: string;
  schoolId?: string;
  targetSchoolId?: string;
  loginMode?: 'staff' | 'student' | 'owner';
}

export interface CloudAuthLoginResponse {
  success: boolean;
  user?: UserAccount;
  schoolId?: string;
  school?: SchoolProfile;
  role?: string;
  isPlatformAdmin?: boolean;
  message?: string;
}

export interface CloudResetPasswordRequest {
  identifier: string;
  newPassword: string;
  schoolId?: string;
  verificationInput?: string;
  mode?: 'owner' | 'portal';
  bypassVerification?: boolean;
}

export interface CloudResetPasswordResponse {
  success: boolean;
  message: string;
  updatedEmail?: string;
  updatedRoleLabel?: string;
}

export interface CloudLocalMigrationRequest {
  schools: SchoolProfile[];
  tenants: Record<string, SchoolTenantData>;
}

export interface CloudLocalMigrationResponse {
  success: boolean;
  migratedSchoolsCount: number;
  migratedTenantsCount: number;
  message: string;
}

export interface CloudAssetUploadRequest {
  dataUrl: string;
  fileName?: string;
  folder?: string;
}

export interface CloudAssetUploadResponse {
  success: boolean;
  url: string;
  fileName: string;
  fileSizeBytes: number;
}
