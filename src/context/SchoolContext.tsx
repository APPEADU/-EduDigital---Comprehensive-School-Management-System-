import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SchoolProfile,
  UserAccount,
  Student,
  AdmissionApplication,
  ClassRoom,
  SchoolCourseTrack,
  Subject,
  InstitutionClassificationType,
  AttendanceRecord,
  StaffAttendanceRecord,
  ExamResult,
  FeeItem,
  FeePayment,
  SchoolTransaction,
  StaffMember,
  TimetablePeriod,
  LibraryBook,
  BookLoan,
  SchoolAsset,
  TransportRoute,
  BoardingHouse,
  HealthIncident,
  SchoolAnnouncement,
  RoleType,
  CustomFeatureRequest,
  ResearchArticle,
  AuthorizedSignatory,
  ProfessionalProgramme,
  ProgrammeCourse,
  CandidateProfile,
  CandidateCourseAssessment,
  CertificateTemplateConfig,
  IssuedCredential,
  CertificateValidityStatus,
  GraduateAlumniRecord,
  CertificateReplacementRequest,
  InstitutionalAccreditation,
  EmployerVerificationLog,
  BiometricGateLog,
  StudentPhotoChangeRequest,
  PlatformOwnerProfile,
  BeceMockExamSeries,
  BeceMockScoreRecord,
  BeceAcademicIntervention,
  BeceAiReadinessReport,
  EducationalSection,
  GradeClassDefinition,
  StudentPlacementHistoryEntry,
  isInstituteLevelType,
  INSTITUTE_CERTIFICATE_LEVEL,
  formatInstituteLevelShort,
} from '../types';
import {
  GHANA_EDUCATIONAL_PRESETS,
  getCanonicalSectionsForLevelType,
  getCanonicalGradeClassesForLevelType,
  formatClassStreamDisplayName,
  inferGradeForLegacyClassRoom,
  buildDefaultStreamsForActiveGrades,
  ensureStreamsForActiveGrades,
} from '../utils/ghanaianClassStructure';
import {
  getDefaultModulesForSchool,
  getDefaultModulesForLevelType,
  INITIAL_CUSTOM_REQUESTS,
} from '../data/featureCatalog';
import { INITIAL_SUBJECTS } from '../data/seedData';
import {
  SchoolTenantData,
  EMPTY_WORKSPACE_SCHOOL,
  getInitialTenantData,
} from '../data/multiSchoolSeeds';
import {
  getDefaultSignatoriesForSchool,
  makeCalligraphicSignatureSvg,
} from '../data/professionalSeeds';
import { getInitialResearchArticles } from '../data/researchSeeds';
import { calculateWassceGrade, calculateBeceGrade } from '../utils/academicCalculations';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  BOOTSTRAPPED_ADMIN_EMAIL,
  isBenignAbortError,
  isTransientOfflineOrTokenError,
  FirebaseUser,
} from '../lib/firebase';
import {
  REMOVED_SAMPLE_SCHOOL_IDS,
  isRemovedSampleSchoolId,
  isBootstrappedAdminUser,
  syncAuthenticatedUserProfile,
  upsertSchoolInCloud,
  deleteSchoolInCloud,
  upsertSchoolMemberInCloud,
  deleteSchoolMemberAndProfileInCloud,
  upsertSignatoryInCloud,
  deleteSignatoryInCloud,
  upsertProgrammeInCloud,
  deleteProgrammeInCloud,
  upsertCourseInCloud,
  deleteCourseInCloud,
  upsertStudentInCloud,
  deleteStudentInCloud,
  upsertCandidateInCloud,
  upsertAssessmentInCloud,
  upsertExamResultInCloud,
  createFeePaymentInCloud,
  issueOrUpdateCredentialAtomicInCloud,
  upsertGraduateInCloud,
  createReplacementRequestInCloud,
  updateReplacementRequestInCloud,
  createVerificationLogInCloud,
  upsertResearchArticleInCloud,
  incrementArticleMetricInCloud,
  deleteResearchArticleInCloud,
  fetchPublicCloudRegistry,
  lookupPublicCredentialInCloud,
  purgeSampleInstitutionsFromCloud,
  subscribeToCloudWorkspace,
  DEFAULT_PLATFORM_OWNER_PROFILE,
  upsertPlatformOwnerProfileInCloud,
} from '../lib/firestoreSync';

const TENANT_STORAGE_PREFIX = 'edudigital_tenant_';
const LEGACY_TENANT_STORAGE_PREFIX = 'edughana_tenant_';
const SCHOOLS_STORAGE_KEY = 'edudigital_schools_v3';
const LEGACY_SCHOOLS_STORAGE_KEY = 'edughana_schools_v3';
const ACTIVE_SCHOOL_KEY = 'edudigital_active_school_id_v3';
const LEGACY_ACTIVE_SCHOOL_KEY = 'edughana_active_school_id_v3';
const PLATFORM_OWNER_PROFILE_KEY = 'edudigital_platform_owner_profile_v1';
const LEGACY_PLATFORM_OWNER_PROFILE_KEY = 'edughana_platform_owner_profile_v1';
const PLATFORM_OWNER_SESSION_KEY = 'edudigital_platform_owner_session_v1';
const PLATFORM_OWNER_PASSWORD_KEY = 'edudigital_platform_owner_password_v1';
const LEGACY_STORAGE_KEY = 'kingdom_royal_institute_sis_v2';
const EMPTY_SCHOOL_ID = 'sch-uninitialized';

const EMPTY_FALLBACK_USER: UserAccount = {
  id: 'usr-unassigned',
  name: 'Platform Administrator',
  email: 'owner@edudigital.sis',
  role: 'proprietor',
  title: 'Platform Owner',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  schoolId: EMPTY_SCHOOL_ID,
};

export interface CandidateProgressionEvaluation {
  candidateId: string;
  currentLevel: number;
  maxProgrammeLevel: number;
  mandatoryCoursesCount: number;
  passedOrExemptCount: number;
  resitRequiredCourses: string[];
  deferredOrPendingCourses: string[];
  feeBalance: number;
  feeClearedForProgression: boolean;
  feeClearedForGraduation: boolean;
  identityVerified: boolean;
  eligibleForNextLevel: boolean;
  eligibleForGraduation: boolean;
  statusSummary: string;
}

// Strict privacy-preserving public verification payload (never exposes marks, finances, or private contacts)
export interface PublicCredentialVerificationResult {
  found: boolean;
  queriedReference: string;
  verifiedAt: string;
  status?: CertificateValidityStatus;
  certificateNumber?: string;
  verificationCode?: string;
  recipientFullName?: string;
  candidateNumber?: string;
  issuingInstitutionName?: string;
  issuingInstitutionCode?: string;
  issuingInstitutionCrest?: string;
  awardingAuthorityName?: string;
  professionalBodyAffiliationNote?: string;
  credentialType?: string;
  programmeTitle?: string;
  qualificationAwarded?: string;
  levelCompletedLabel?: string;
  honoursOrDistinction?: string;
  issueDate?: string;
  expiryDate?: string;
  replacedByCertificateNumber?: string;
  revocationOrStatusReason?: string;
}

interface SchoolContextType {
  // Multi-Tenancy & School Partitioning
  schools: SchoolProfile[];
  activeSchoolId: string;
  school: SchoolProfile;
  switchSchool: (schoolId: string) => void;
  registerSchool: (
    schoolData: Omit<SchoolProfile, 'id'>,
    adminCredentials: { name: string; email: string; password?: string; title?: string; role?: RoleType },
    curriculumOptions?: {
      customCourses?: string[];
      customSubjects?: string[];
      skipAutoDefaults?: boolean;
      offeredPresetId?: string;
      offeredSectionIds?: string[];
    }
  ) => { school: SchoolProfile; admin: UserAccount };
  deleteSchool: (schoolId: string) => boolean;

  // Active School Data (Strictly Isolated to Active School)
  currentUser: UserAccount;
  users: UserAccount[];
  students: Student[];
  classes: ClassRoom[];
  educationalSections: EducationalSection[];
  gradeClasses: GradeClassDefinition[];
  subjects: Subject[];
  admissions: AdmissionApplication[];
  examResults: ExamResult[];
  feeItems: FeeItem[];
  feePayments: FeePayment[];
  transactions: SchoolTransaction[];
  staff: StaffMember[];
  staffAttendance: StaffAttendanceRecord[];
  timetable: TimetablePeriod[];
  attendance: AttendanceRecord[];
  libraryBooks: LibraryBook[];
  bookLoans: BookLoan[];
  assets: SchoolAsset[];
  routes: TransportRoute[];
  boardingHouses: BoardingHouse[];
  healthRecords: HealthIncident[];
  announcements: SchoolAnnouncement[];
  researchArticles: ResearchArticle[];
  allPublicResearchArticles: ResearchArticle[];

  // Signatures, Professional Programmes, Credentials, Alumni & Verification
  signatories: AuthorizedSignatory[];
  programmes: ProfessionalProgramme[];
  programmeCourses: ProgrammeCourse[];
  candidates: CandidateProfile[];
  candidateAssessments: CandidateCourseAssessment[];
  certificateTemplates: CertificateTemplateConfig[];
  issuedCredentials: IssuedCredential[];
  graduateRecords: GraduateAlumniRecord[];
  replacementRequests: CertificateReplacementRequest[];
  accreditations: InstitutionalAccreditation[];
  verificationLogs: EmployerVerificationLog[];
  biometricGateLogs: BiometricGateLog[];
  recordBiometricGateEvent: (
    event: Omit<BiometricGateLog, 'id' | 'schoolId' | 'date' | 'timestamp'> & {
      date?: string;
      timestamp?: string;
    }
  ) => BiometricGateLog;
  allPublicDirectoryGraduates: (GraduateAlumniRecord & { institutionName: string; institutionCode: string })[];
  samplePublicCredentials: { label: string; certificateNumber: string; verificationCode: string; status: CertificateValidityStatus; institutionCode: string }[];

  // Signature & Signatory Actions
  saveUserSignature: (
    userId: string,
    signatureDataUrl: string,
    method: 'drawn' | 'uploaded',
    signatoryRole?: AuthorizedSignatory['role'],
    customTitle?: string
  ) => void;
  upsertSignatory: (sig: Omit<AuthorizedSignatory, 'id' | 'updatedAt'> & { id?: string }) => AuthorizedSignatory;
  removeSignatory: (id: string) => void;

  // Programme, Course, Candidate & Progression Actions
  addProgramme: (prog: Omit<ProfessionalProgramme, 'id' | 'schoolId'>) => ProfessionalProgramme;
  updateProgramme: (id: string, data: Partial<ProfessionalProgramme>) => void;
  deleteProgramme: (id: string) => void;
  addProgrammeCourse: (course: Omit<ProgrammeCourse, 'id' | 'schoolId'>) => ProgrammeCourse;
  updateProgrammeCourse: (id: string, data: Partial<ProgrammeCourse>) => void;
  deleteProgrammeCourse: (id: string) => void;
  registerCandidate: (data: Omit<CandidateProfile, 'id' | 'schoolId' | 'candidateNumber' | 'enrollmentDate'> & { candidateNumber?: string }) => CandidateProfile;
  updateCandidate: (id: string, data: Partial<CandidateProfile>) => void;
  saveCandidateAssessment: (assessment: Omit<CandidateCourseAssessment, 'id'> & { id?: string }) => void;
  evaluateCandidateProgression: (candidateId: string) => CandidateProgressionEvaluation | null;
  promoteCandidateToNextLevel: (candidateId: string) => boolean;

  // Certificate Template, Issuance, Audit, Alumni & Verification Actions
  saveCertificateTemplate: (tpl: Omit<CertificateTemplateConfig, 'id' | 'schoolId'> & { id?: string }) => CertificateTemplateConfig;
  issueDigitalCredential: (
    payload: Omit<
      IssuedCredential,
      | 'id'
      | 'schoolId'
      | 'schoolName'
      | 'schoolCode'
      | 'schoolCrest'
      | 'certificateNumber'
      | 'verificationCode'
      | 'auditTrail'
    > & { certificateNumber?: string; approvalNote?: string }
  ) => { success: boolean; credential?: IssuedCredential; error?: string };
  updateCredentialStatus: (
    credentialId: string,
    newStatus: CertificateValidityStatus,
    reason: string,
    replacedByCertificateNumber?: string
  ) => void;
  submitReplacementRequest: (
    req: Omit<CertificateReplacementRequest, 'id' | 'schoolId' | 'requestedDate' | 'status'>
  ) => CertificateReplacementRequest;
  processReplacementRequest: (requestId: string, approve: boolean, adminNote: string) => IssuedCredential | null;
  updateGraduateProfile: (graduateId: string, data: Partial<Pick<GraduateAlumniRecord, 'email' | 'phone' | 'directoryConsent' | 'currentEmployerOrRole'>>) => void;
  addAccreditation: (acc: Omit<InstitutionalAccreditation, 'id' | 'schoolId'>) => InstitutionalAccreditation;
  updateAccreditation: (id: string, data: Partial<InstitutionalAccreditation>) => void;
  verifyCredentialPublic: (
    query: string,
    verifierMeta?: {
      organization?: string;
      contactName?: string;
      purpose?: string;
      mode?: EmployerVerificationLog['lookupMode'];
    }
  ) => PublicCredentialVerificationResult;
  verifyCredentialPublicAsync: (
    query: string,
    verifierMeta?: {
      organization?: string;
      contactName?: string;
      purpose?: string;
      mode?: EmployerVerificationLog['lookupMode'];
    }
  ) => Promise<PublicCredentialVerificationResult>;
  verifyCredentialsBatch: (
    queries: string[],
    verifierMeta: { organization: string; contactName: string; purpose: string }
  ) => PublicCredentialVerificationResult[];

  // App & Navigation State
  activeModule: string;
  setActiveModule: (module: string) => void;
  setCurrentUser: (user: UserAccount) => void;
  updateSchoolProfile: (profile: Partial<SchoolProfile>) => void;
  addStudent: (data: any) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  addAdmission: (data: any) => void;
  updateAdmissionStatus: (id: string, status: AdmissionApplication['status']) => void;
  recordAttendance: (classId: string, date: string, studentStatuses: Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'>) => void;
  saveExamResult: (result: Partial<ExamResult> & { studentId: string; subjectId: string; classId: string; classScore: number; examScore: number }) => void;
  publishResults: (classId: string) => void;
  recordFeePayment: (payment: Omit<FeePayment, 'id' | 'receiptNumber' | 'date'>) => FeePayment;
  recordTransaction: (txn: Omit<SchoolTransaction, 'id' | 'date'>) => void;
  addStaff: (
    data: Omit<StaffMember, 'id' | 'staffId'>,
    portalOptions?: { password?: string; portalRole?: RoleType }
  ) => void;
  updateStaff: (id: string, data: Partial<StaffMember>) => void;
  issueBookLoan: (bookId: string, studentId: string, dueDate: string) => void;
  returnBookLoan: (loanId: string) => void;
  addAsset: (asset: Omit<SchoolAsset, 'id'>) => void;
  addHealthRecord: (record: Omit<HealthIncident, 'id'>) => void;
  sendAnnouncement: (announcement: Omit<SchoolAnnouncement, 'id' | 'sentDate'>) => void;

  // Research & Academic Journal Press (Contribution to Knowledge)
  publishResearchArticle: (articleData: Omit<ResearchArticle, 'id' | 'publicationDate' | 'viewsCount' | 'downloadsCount' | 'citationsCount' | 'doi'>) => ResearchArticle;
  updateResearchArticle: (id: string, data: Partial<ResearchArticle>) => void;
  deleteResearchArticle: (id: string) => void;
  recordArticleView: (id: string) => void;
  recordArticleDownload: (id: string) => void;
  recordArticleCitation: (id: string) => void;

  isAuthenticated: boolean;
  firebaseUser: FirebaseUser | null;
  authReady: boolean;
  isCloudSynced: boolean;
  isPlatformAdmin: boolean;
  platformOwnerEmail: string;
  signInPlatformOwnerWithEmail: (
    email: string,
    password?: string,
    options?: { stayOnWebsite?: boolean; targetSchoolId?: string }
  ) => { success: boolean; isPlatformAdmin?: boolean; message?: string };
  signInWithGoogle: (
    preferredMode?: 'staff' | 'student' | 'owner',
    options?: { stayOnWebsite?: boolean }
  ) => Promise<{ success: boolean; isPlatformAdmin?: boolean; message?: string }>;
  enterPortalAsPlatformOwner: (targetSchoolId?: string) => boolean;
  loginWithEmail: (
    identifier: string,
    password?: string,
    targetSchoolId?: string,
    loginMode?: 'staff' | 'student' | 'owner'
  ) => { success: boolean; isPlatformAdmin?: boolean; message?: string };
  logout: () => void;
  updateUser: (userId: string, data: Partial<UserAccount>) => void;
  updateCurrentUserAvatar: (newAvatar: string) => void;
  addUserAccount: (user: Omit<UserAccount, 'id'>) => UserAccount;
  deleteUserAccount: (userId: string) => void;
  deleteStudent: (id: string) => void;
  deleteStaff: (id: string) => void;
  deleteAdmission: (id: string) => void;
  deleteAnnouncement: (id: string) => void;
  deleteAsset: (id: string) => void;
  deleteBook: (id: string) => void;
  resetToDemoData: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;

  // Modular Features & Bespoke Add-ons (Per-School Isolation)
  isModuleEnabled: (moduleId: string) => boolean;
  toggleSchoolModule: (moduleId: string) => void;
  customFeatureRequests: CustomFeatureRequest[];
  requestCustomFeature: (req: { title: string; category: string; description: string; urgency?: 'Standard' | 'Priority' | 'Critical Bespoke' }) => void;

  // Platform Owner & Developer Public Profile
  platformOwnerProfile: PlatformOwnerProfile;
  updatePlatformOwnerProfile: (updates: Partial<Omit<PlatformOwnerProfile, 'id'>>) => void;

  // Student & Applicant Passport Photograph Governance
  photoChangeRequests: StudentPhotoChangeRequest[];
  submitStudentPhotoRequest: (params: {
    studentId: string;
    newPhoto: string;
    requestedByName?: string;
    requestedByRole?: RoleType | 'applicant';
  }) => { immediateApplied: boolean; request: StudentPhotoChangeRequest };
  reviewStudentPhotoRequest: (requestId: string, approve: boolean, reviewNote?: string) => void;
  reviewAdmissionPhoto: (
    admissionId: string,
    status: 'Approved' | 'Revision Requested',
    reviewNote?: string,
    updatedPhotoUrl?: string
  ) => void;

  // BECE Mock Examination Management, Performance Tracking & AI Learning Support
  beceMockSeries: BeceMockExamSeries[];
  beceMockScores: BeceMockScoreRecord[];
  beceInterventions: BeceAcademicIntervention[];
  beceAiReports: BeceAiReadinessReport[];
  createBeceMockSeries: (
    data: Omit<BeceMockExamSeries, 'id' | 'schoolId' | 'sequenceOrder'> & { sequenceOrder?: number }
  ) => BeceMockExamSeries;
  updateBeceMockSeries: (id: string, updates: Partial<BeceMockExamSeries>) => void;
  deleteBeceMockSeries: (id: string) => void;
  saveBeceMockScore: (
    entry: Omit<BeceMockScoreRecord, 'id' | 'schoolId' | 'totalScore' | 'beceGrade' | 'gradeRemark' | 'updatedAt'> & {
      totalScore?: number;
    }
  ) => BeceMockScoreRecord;
  assignBeceIntervention: (
    item: Omit<BeceAcademicIntervention, 'id' | 'schoolId' | 'assignedDate'>
  ) => BeceAcademicIntervention;
  updateBeceIntervention: (id: string, updates: Partial<BeceAcademicIntervention>) => void;
  deleteBeceIntervention: (id: string) => void;
  saveBeceAiReport: (report: Omit<BeceAiReadinessReport, 'id' | 'schoolId' | 'generatedAt'>) => BeceAiReadinessReport;

  // Password Reset & Change (Platform Owner, Admins, Lecturers, Teachers, Staff, Students)
  hasPlatformOwnerPassword: boolean;
  resetAccountPassword: (params: {
    mode: 'owner' | 'portal';
    schoolId?: string;
    identifier: string;
    verificationInput?: string;
    newPassword: string;
    bypassVerification?: boolean;
  }) => { success: boolean; message: string; updatedEmail?: string; updatedRoleLabel?: string };
  changeCurrentUserPassword: (
    currentPassword: string,
    newPassword: string
  ) => { success: boolean; message: string };

  // Custom School Courses / Programmes & Custom Subjects (Apart from Automatic Defaults)
  courseTracks: SchoolCourseTrack[];
  addCourseTrack: (course: Omit<SchoolCourseTrack, 'id' | 'isCustom'>) => SchoolCourseTrack;
  addCourseTracksBulk: (
    courseNames: string[],
    defaultDepartment?: string,
    defaultCategory?: SchoolCourseTrack['category']
  ) => SchoolCourseTrack[];
  updateCourseTrack: (id: string, updates: Partial<SchoolCourseTrack>) => void;
  deleteCourseTrack: (idOrName: string) => void;
  clearAutoCourseTracks: () => void;
  restoreDefaultCourseTracks: () => void;
  addSubject: (subject: Omit<Subject, 'id' | 'isCustom'>) => Subject;
  addSubjectsBulk: (
    subjectNames: string[],
    options?: {
      category?: 'Core' | 'Elective';
      level?: Subject['level'];
      department?: string;
      programme?: string;
    }
  ) => Subject[];
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  clearAutoSubjects: () => void;
  restoreDefaultSubjects: () => void;
  addTimetablePeriod: (period: Omit<TimetablePeriod, 'id'>) => TimetablePeriod;
  deleteTimetablePeriod: (id: string) => void;

  // Class, Grade, Stream & Educational Section Management + Enrolment Placement & Promotion
  resolveTeacherDisplayName: (teacherId?: string, fallbackName?: string) => string;
  applyOfferedSectionsPreset: (presetId: string, options?: { generateDefaultStreams?: boolean }) => void;
  addEducationalSection: (data: {
    name: string;
    shortName?: string;
    code?: string;
    isShs?: boolean;
    description?: string;
  }) => EducationalSection;
  updateEducationalSection: (
    sectionId: string,
    updates: Partial<EducationalSection>,
    options?: { cascadeToGrades?: boolean }
  ) => void;
  deleteEducationalSection: (sectionId: string) => { success: boolean; message?: string };
  addGradeClass: (data: {
    sectionId: string;
    name: string;
    canonicalCode?: string;
    formNumber?: number;
    levelCategory?: 'Basic' | 'JHS' | 'SHS';
    isShs?: boolean;
    nextGradeId?: string;
  }) => GradeClassDefinition;
  updateGradeClass: (gradeId: string, updates: Partial<GradeClassDefinition>) => void;
  deleteGradeClass: (gradeId: string) => { success: boolean; message?: string };
  addClassStream: (params: {
    gradeId: string;
    streamDivision: string;
    programme?: string;
    customDisplayName?: string;
    formTutorTeacherId?: string;
    classTeacherName?: string;
    roomNumber?: string;
    capacity?: number;
  }) => { success: boolean; classRoom?: ClassRoom; message?: string };
  addClassStreamsBulk: (params: {
    gradeId: string;
    streamDivisions: string[];
    programme?: string;
    defaultCapacity?: number;
    roomPrefix?: string;
    formTutorTeacherId?: string;
  }) => ClassRoom[];
  updateClassStream: (classId: string, updates: Partial<ClassRoom>) => void;
  assignSubjectTeacherToStream: (classId: string, subjectId: string, teacherId: string) => void;
  deleteClassStream: (classId: string) => { success: boolean; message?: string };
  checkDuplicateStudentEnrolment: (params: {
    firstName: string;
    lastName: string;
    otherNames?: string;
    dob?: string;
    academicYear?: string;
    nationalIdOrNHIS?: string;
    guardianPhone?: string;
    excludeStudentId?: string;
  }) => { isDuplicate: boolean; matchedStudent?: Student; reason?: string };
  enrollStudentWithPlacement: (
    data: Omit<Student, 'id' | 'studentNumber' | 'status' | 'admissionDate'> & {
      academicYear?: string;
      admissionApplicationId?: string;
    }
  ) => { success: boolean; student?: Student; message?: string };
  reassignStudentClassStream: (params: {
    studentId: string;
    academicYear: string;
    sectionId: string;
    gradeId: string;
    classId: string;
    stream?: string;
    programme?: string;
    classTeacherId?: string;
    reason?: string;
  }) => { success: boolean; message: string };
  promoteOrTransferStudents: (params: {
    studentIds: string[];
    sourceAcademicYear: string;
    targetAcademicYear: string;
    action: 'promote' | 'transfer' | 'graduate';
    targetSectionId?: string;
    targetGradeId?: string;
    targetClassId?: string;
    transferDestinationSchool?: string;
    reason?: string;
    advanceSchoolAcademicYear?: boolean;
  }) => { success: boolean; count: number; message: string };
}

const SchoolContext = createContext<SchoolContextType | null>(null);

const inferPortalRoleFromStaffTitle = (roleTitle: string): RoleType => {
  const lower = (roleTitle || '').toLowerCase();
  if (lower.includes('proprietor') || lower.includes('founder') || lower.includes('chancellor')) {
    return 'proprietor';
  }
  if (
    lower.includes('accountant') ||
    lower.includes('bursar') ||
    lower.includes('finance') ||
    lower.includes('cashier') ||
    lower.includes('auditor')
  ) {
    return 'accountant';
  }
  if (lower.includes('librarian') || lower.includes('library')) {
    return 'librarian';
  }
  if (
    lower.includes('housemaster') ||
    lower.includes('housemistress') ||
    lower.includes('matron') ||
    lower.includes('warden')
  ) {
    return 'housemaster';
  }
  if (
    lower.includes('admin') ||
    lower.includes('registrar') ||
    lower.includes('rector') ||
    lower.includes('principal') ||
    lower.includes('headmaster') ||
    lower.includes('headmistress') ||
    lower.includes('director') ||
    lower.includes('dean')
  ) {
    return 'admin';
  }
  return 'teacher';
};

export const getDefaultCourseTracksForLevelType = (
  levelType?: InstitutionClassificationType | string
): SchoolCourseTrack[] => {
  if (isInstituteLevelType(levelType)) {
    return [
      {
        id: 'auto-trk-inst-chartered',
        code: 'LVL-1-3',
        name: 'Professional Qualification (Levels 1–3)',
        department: 'Professional Studies',
        category: 'Elective Programme',
        duration: '18 – 36 Months',
        description: 'Structured multi-level professional qualification track.',
        isCustom: false,
      },
      {
        id: 'auto-trk-inst-cert',
        code: 'CERT-01',
        name: 'Certificate Programme (Standalone)',
        department: 'Executive & Vocational Studies',
        category: 'Certificate / Diploma',
        duration: '3 – 12 Months',
        description: 'Direct competency and practitioner certificate programme.',
        isCustom: false,
      },
      {
        id: 'auto-trk-inst-dip',
        code: 'DIP-01',
        name: 'Higher Diploma / HND Track',
        department: 'Academic Studies',
        category: 'Certificate / Diploma',
        duration: '24 Months',
        description: 'Applied tertiary diploma and technical specialization.',
        isCustom: false,
      },
    ];
  }

  if (levelType === 'Basic & JHS') {
    return [
      {
        id: 'auto-trk-ges-basic',
        code: 'GES-BSC',
        name: 'GES Early Years & Primary Standard',
        department: 'Primary Department',
        category: 'Core Track',
        duration: 'KG 1 – Basic 6',
        description: 'NaCCA standard literacy, numeracy, creative arts, and science curriculum.',
        isCustom: false,
      },
      {
        id: 'auto-trk-ges-jhs',
        code: 'GES-JHS',
        name: 'GES Junior High (BECE Track)',
        department: 'Junior High Department',
        category: 'Core Track',
        duration: 'JHS 1 – JHS 3',
        description: 'Junior High School core and career technology BECE preparation.',
        isCustom: false,
      },
    ];
  }

  const shsDefaults: SchoolCourseTrack[] = [
    {
      id: 'auto-trk-sci',
      code: 'GEN-SCI',
      name: 'General Science',
      department: 'Science & Mathematics',
      category: 'Elective Programme',
      duration: '3 Years (SHS 1–3)',
      description: 'Physics, Chemistry, Biology, and Elective Mathematics track.',
      isCustom: false,
    },
    {
      id: 'auto-trk-arts',
      code: 'GEN-ART',
      name: 'General Arts',
      department: 'Humanities & Social Sciences',
      category: 'Elective Programme',
      duration: '3 Years (SHS 1–3)',
      description: 'Economics, Government, Geography, History, Literature, and Languages.',
      isCustom: false,
    },
    {
      id: 'auto-trk-bus',
      code: 'BUS-ACC',
      name: 'Business',
      department: 'Business',
      category: 'Elective Programme',
      duration: '3 Years (SHS 1–3)',
      description: 'Financial Accounting, Cost Accounting, Business Management, and Economics.',
      isCustom: false,
    },
    {
      id: 'auto-trk-vis',
      code: 'VIS-ART',
      name: 'Visual Arts',
      department: 'Creative & Visual Arts',
      category: 'Elective Programme',
      duration: '3 Years (SHS 1–3)',
      description: 'Graphic Design, General Knowledge in Art, Textiles, and Sculpture.',
      isCustom: false,
    },
    {
      id: 'auto-trk-hec',
      code: 'HOM-ECO',
      name: 'Home Economics',
      department: 'Vocational & Life Sciences',
      category: 'Elective Programme',
      duration: '3 Years (SHS 1–3)',
      description: 'Management in Living, Food & Nutrition, Clothing & Textiles, and Biology.',
      isCustom: false,
    },
  ];

  if (levelType === 'Combined') {
    return [
      {
        id: 'auto-trk-ges-comb',
        code: 'GES-JHS',
        name: 'GES Basic & JHS Track',
        department: 'Basic & JHS Department',
        category: 'Core Track',
        duration: 'Primary – JHS 3',
        description: 'Foundational Basic and Junior High BECE track.',
        isCustom: false,
      },
      ...shsDefaults,
    ];
  }

  return shsDefaults;
};

const generateVerificationCode = (prefix: string): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars[Math.floor(Math.random() * chars.length)];
    part2 += chars[Math.floor(Math.random() * chars.length)];
  }
  const clean = prefix.replace(/[^A-Z0-9]/gi, '').slice(0, 3).toUpperCase() || 'VRF';
  return `VRF-${clean}${part1.slice(0, 2)}-${part2}`;
};

function mergeById<T extends { id: string }>(localItems: T[], cloudItems: T[]): T[] {
  if (!cloudItems || cloudItems.length === 0) return localItems;
  const cloudMap = new Map<string, T>();
  for (const item of cloudItems) {
    cloudMap.set(item.id, item);
  }
  const merged = localItems.map((loc) => (cloudMap.has(loc.id) ? { ...loc, ...cloudMap.get(loc.id)! } : loc));
  const existingIds = new Set(localItems.map((loc) => loc.id));
  const brandNew = cloudItems.filter((c) => !existingIds.has(c.id));
  return [...brandNew, ...merged];
}

function getTodayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize registered schools directory (purging all legacy sample schools)
  const loadSchoolsList = (): SchoolProfile[] => {
    try {
      // Permanently purge legacy sample school caches from localStorage
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      for (const sampleId of REMOVED_SAMPLE_SCHOOL_IDS) {
        localStorage.removeItem(TENANT_STORAGE_PREFIX + sampleId);
        localStorage.removeItem(LEGACY_TENANT_STORAGE_PREFIX + sampleId);
      }

      const stored =
        localStorage.getItem(SCHOOLS_STORAGE_KEY) ??
        localStorage.getItem(LEGACY_SCHOOLS_STORAGE_KEY);
      if (stored) {
        const parsed: SchoolProfile[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned: SchoolProfile[] = parsed
            .filter(
              (s) =>
                Boolean(s && s.id && s.id !== EMPTY_SCHOOL_ID && !isRemovedSampleSchoolId(s.id))
            )
            .map((s): SchoolProfile => ({
              ...s,
              whatsappNumber: s.whatsappNumber ?? s.phone ?? '',
              whatsappEnabled: s.whatsappEnabled ?? true,
            }));

          localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify(cleaned));
          return cleaned;
        }
      }
      localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.error('Error loading schools list', e);
    }
    return [];
  };

  const [schools, setSchools] = useState<SchoolProfile[]>(loadSchoolsList);

  const loadInitialSchoolId = (availableSchools: SchoolProfile[]): string => {
    if (availableSchools.length === 0) {
      try {
        localStorage.removeItem(ACTIVE_SCHOOL_KEY);
        localStorage.removeItem(LEGACY_ACTIVE_SCHOOL_KEY);
      } catch {
        // Ignore storage errors
      }
      return EMPTY_SCHOOL_ID;
    }
    try {
      const stored =
        localStorage.getItem(ACTIVE_SCHOOL_KEY) ??
        localStorage.getItem(LEGACY_ACTIVE_SCHOOL_KEY);
      if (
        stored &&
        !isRemovedSampleSchoolId(stored) &&
        availableSchools.some((s) => s.id === stored)
      ) {
        return stored;
      }
    } catch (e) {
      console.error('Error loading active school id', e);
    }
    return availableSchools[0].id;
  };

  const [activeSchoolId, setActiveSchoolId] = useState<string>(() => loadInitialSchoolId(schools));

  const hydrateProfessionalFields = (schoolId: string, data: SchoolTenantData): SchoolTenantData => {
    if (!schoolId || schoolId === EMPTY_SCHOOL_ID || isRemovedSampleSchoolId(schoolId)) {
      return getInitialTenantData(EMPTY_SCHOOL_ID);
    }

    const signatories = Array.isArray(data.school?.signatories)
      ? data.school.signatories
      : getDefaultSignatoriesForSchool(data.school);

    const schoolIsInstitute = isInstituteLevelType(data.school?.levelType);
    const hasCompatibleStoredSections =
      Array.isArray(data.educationalSections) &&
      data.educationalSections.length > 0 &&
      (schoolIsInstitute
        ? data.educationalSections.some((s) => s.id.startsWith('sec-inst') || s.isCustom)
        : data.educationalSections.some((s) => !s.id.startsWith('sec-inst')));

    const rawSections: EducationalSection[] = hasCompatibleStoredSections
      ? data.educationalSections!
      : getCanonicalSectionsForLevelType(data.school?.levelType);

    const hasCompatibleStoredGrades =
      hasCompatibleStoredSections &&
      Array.isArray(data.gradeClasses) &&
      data.gradeClasses.length > 0;

    const rawGrades: GradeClassDefinition[] = hasCompatibleStoredGrades
      ? data.gradeClasses!
      : getCanonicalGradeClassesForLevelType(data.school?.levelType, rawSections);

    const rawClassesList = Array.isArray(data.classes) ? data.classes : [];
    const linkedClasses = rawClassesList.map((cls) =>
      inferGradeForLegacyClassRoom(cls, rawGrades, rawSections)
    );

    // Ensure sections & grades referenced by existing classes remain active unless explicitly customized
    const usedGradeIds = new Set(linkedClasses.map((c) => c.gradeId).filter(Boolean));
    const usedSecIds = new Set(linkedClasses.map((c) => c.sectionId).filter(Boolean));
    const hydratedSections = hasCompatibleStoredSections
      ? rawSections
      : rawSections.map((s) => (usedSecIds.has(s.id) ? { ...s, active: true } : s));
    const hydratedGrades = hasCompatibleStoredGrades
      ? rawGrades
      : rawGrades.map((g) => (usedGradeIds.has(g.id) ? { ...g, active: true } : g));

    const fallbackTeacherId =
      (Array.isArray(data.staff) && data.staff[0]?.id) ||
      (Array.isArray(data.users) && data.users[0]?.id) ||
      `usr-admin-${schoolId}`;
    const fallbackTeacherName =
      (Array.isArray(data.staff) && data.staff[0]?.fullName) ||
      (Array.isArray(data.users) && data.users[0]?.name) ||
      data.school?.headmasterName ||
      'Class Form Teacher';

    const ensuredClasses = ensureStreamsForActiveGrades(
      schoolId,
      hydratedSections,
      hydratedGrades,
      linkedClasses,
      fallbackTeacherId,
      fallbackTeacherName
    );

    const classByIdMap = new Map(ensuredClasses.map((c) => [c.id, c]));
    const hydratedStudents = (Array.isArray(data.students) ? data.students : []).map((stu) => {
      const cls = classByIdMap.get(stu.classId);
      if (!cls) return stu;
      return {
        ...stu,
        academicYear: stu.academicYear || data.school?.currentAcademicYear || '2025/2026',
        sectionId: stu.sectionId || cls.sectionId,
        sectionName: stu.sectionName || cls.sectionName,
        gradeId: stu.gradeId || cls.gradeId,
        gradeName: stu.gradeName || cls.gradeName,
        classTeacherId: stu.classTeacherId || cls.formTutorTeacherId,
        classTeacherName: stu.classTeacherName || cls.classTeacherName,
      };
    });

    return {
      ...data,
      school: {
        ...data.school,
        whatsappNumber: data.school.whatsappNumber ?? data.school.phone ?? '',
        whatsappEnabled: data.school.whatsappEnabled ?? true,
        signatories,
        headmasterSignatureDataUrl:
          data.school.headmasterSignatureDataUrl ||
          signatories[0]?.signatureDataUrl ||
          makeCalligraphicSignatureSvg(data.school.headmasterSignature || data.school.headmasterName),
      },
      classes: ensuredClasses,
      educationalSections: hydratedSections,
      gradeClasses: hydratedGrades,
      users: Array.isArray(data.users) ? data.users : [],
      students: hydratedStudents,
      subjects: Array.isArray(data.subjects)
        ? data.subjects.length > 0 || data.school?.customCurriculumInitialized
          ? data.subjects
          : INITIAL_SUBJECTS
        : INITIAL_SUBJECTS,
      admissions: Array.isArray(data.admissions) ? data.admissions : [],
      examResults: Array.isArray(data.examResults) ? data.examResults : [],
      feeItems: Array.isArray(data.feeItems) ? data.feeItems : [],
      feePayments: Array.isArray(data.feePayments) ? data.feePayments : [],
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      staff: Array.isArray(data.staff) ? data.staff : [],
      staffAttendance: Array.isArray(data.staffAttendance) ? data.staffAttendance : [],
      timetable: Array.isArray(data.timetable) ? data.timetable : [],
      attendance: Array.isArray(data.attendance) ? data.attendance : [],
      libraryBooks: Array.isArray(data.libraryBooks) ? data.libraryBooks : [],
      bookLoans: Array.isArray(data.bookLoans) ? data.bookLoans : [],
      assets: Array.isArray(data.assets) ? data.assets : [],
      routes: Array.isArray(data.routes) ? data.routes : [],
      boardingHouses: Array.isArray(data.boardingHouses) ? data.boardingHouses : [],
      healthRecords: Array.isArray(data.healthRecords) ? data.healthRecords : [],
      announcements: Array.isArray(data.announcements) ? data.announcements : [],
      researchArticles: Array.isArray(data.researchArticles) ? data.researchArticles : [],
      programmes: Array.isArray(data.programmes) ? data.programmes : [],
      programmeCourses: Array.isArray(data.programmeCourses) ? data.programmeCourses : [],
      candidates: Array.isArray(data.candidates) ? data.candidates : [],
      candidateAssessments: Array.isArray(data.candidateAssessments) ? data.candidateAssessments : [],
      certificateTemplates: Array.isArray(data.certificateTemplates) ? data.certificateTemplates : [],
      issuedCredentials: Array.isArray(data.issuedCredentials) ? data.issuedCredentials : [],
      graduateRecords: Array.isArray(data.graduateRecords) ? data.graduateRecords : [],
      replacementRequests: Array.isArray(data.replacementRequests) ? data.replacementRequests : [],
      accreditations: Array.isArray(data.accreditations) ? data.accreditations : [],
      verificationLogs: Array.isArray(data.verificationLogs) ? data.verificationLogs : [],
      biometricGateLogs: Array.isArray(data.biometricGateLogs) ? data.biometricGateLogs : [],
      photoChangeRequests: Array.isArray(data.photoChangeRequests) ? data.photoChangeRequests : [],
      beceMockSeries: Array.isArray(data.beceMockSeries) ? data.beceMockSeries : [],
      beceMockScores: Array.isArray(data.beceMockScores) ? data.beceMockScores : [],
      beceInterventions: Array.isArray(data.beceInterventions) ? data.beceInterventions : [],
      beceAiReports: Array.isArray(data.beceAiReports) ? data.beceAiReports : [],
    };
  };

  // 3. Load tenant data for active school
  const loadTenantData = (schoolId: string): SchoolTenantData => {
    if (!schoolId || schoolId === EMPTY_SCHOOL_ID || isRemovedSampleSchoolId(schoolId)) {
      return getInitialTenantData(EMPTY_SCHOOL_ID);
    }

    try {
      const storedStr =
        localStorage.getItem(TENANT_STORAGE_PREFIX + schoolId) ??
        localStorage.getItem(LEGACY_TENANT_STORAGE_PREFIX + schoolId);
      if (storedStr) {
        const stored: SchoolTenantData = JSON.parse(storedStr);
        if (stored && stored.school && stored.school.id === schoolId) {
          localStorage.setItem(TENANT_STORAGE_PREFIX + schoolId, storedStr);
          return hydrateProfessionalFields(schoolId, stored);
        }
        localStorage.removeItem(TENANT_STORAGE_PREFIX + schoolId);
        localStorage.removeItem(LEGACY_TENANT_STORAGE_PREFIX + schoolId);
      }
    } catch (e) {
      console.error('Error reading tenant data', e);
    }

    const matchingSchool = schools.find((s) => s.id === schoolId);
    const emptyBase = getInitialTenantData(schoolId);
    if (matchingSchool) {
      emptyBase.school = matchingSchool;
    }
    return hydrateProfessionalFields(schoolId, emptyBase);
  };

  const initialTenant = loadTenantData(activeSchoolId);

  // Tenant-scoped state
  const [school, setSchool] = useState<SchoolProfile>(initialTenant.school);
  const [users, setUsers] = useState<UserAccount[]>(initialTenant.users);
  const [currentUser, setCurrentUserState] = useState<UserAccount>(
    initialTenant.users[0] || EMPTY_FALLBACK_USER
  );
  const [students, setStudents] = useState<Student[]>(initialTenant.students);
  const [classes, setClasses] = useState<ClassRoom[]>(initialTenant.classes);
  const [educationalSections, setEducationalSections] = useState<EducationalSection[]>(
    initialTenant.educationalSections || getCanonicalSectionsForLevelType(initialTenant.school?.levelType)
  );
  const [gradeClasses, setGradeClasses] = useState<GradeClassDefinition[]>(
    initialTenant.gradeClasses || getCanonicalGradeClassesForLevelType(initialTenant.school?.levelType, initialTenant.educationalSections)
  );
  const [subjects, setSubjects] = useState<Subject[]>(initialTenant.subjects);
  const [admissions, setAdmissions] = useState<AdmissionApplication[]>(initialTenant.admissions);
  const [examResults, setExamResults] = useState<ExamResult[]>(initialTenant.examResults);
  const [feeItems, setFeeItems] = useState<FeeItem[]>(initialTenant.feeItems);
  const [feePayments, setFeePayments] = useState<FeePayment[]>(initialTenant.feePayments);
  const [transactions, setTransactions] = useState<SchoolTransaction[]>(initialTenant.transactions);
  const [staff, setStaff] = useState<StaffMember[]>(initialTenant.staff);
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendanceRecord[]>(initialTenant.staffAttendance);
  const [timetable, setTimetable] = useState<TimetablePeriod[]>(initialTenant.timetable);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialTenant.attendance);
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>(initialTenant.libraryBooks);
  const [bookLoans, setBookLoans] = useState<BookLoan[]>(initialTenant.bookLoans);
  const [assets, setAssets] = useState<SchoolAsset[]>(initialTenant.assets);
  const [routes, setRoutes] = useState<TransportRoute[]>(initialTenant.routes);
  const [boardingHouses, setBoardingHouses] = useState<BoardingHouse[]>(initialTenant.boardingHouses);
  const [healthRecords, setHealthRecords] = useState<HealthIncident[]>(initialTenant.healthRecords);
  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>(initialTenant.announcements);
  const [researchArticles, setResearchArticles] = useState<ResearchArticle[]>(
    initialTenant.researchArticles || getInitialResearchArticles(activeSchoolId)
  );

  // Professional & Credential Module State
  const [programmes, setProgrammes] = useState<ProfessionalProgramme[]>(initialTenant.programmes || []);
  const [programmeCourses, setProgrammeCourses] = useState<ProgrammeCourse[]>(initialTenant.programmeCourses || []);
  const [candidates, setCandidates] = useState<CandidateProfile[]>(initialTenant.candidates || []);
  const [candidateAssessments, setCandidateAssessments] = useState<CandidateCourseAssessment[]>(initialTenant.candidateAssessments || []);
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplateConfig[]>(initialTenant.certificateTemplates || []);
  const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredential[]>(initialTenant.issuedCredentials || []);
  const [graduateRecords, setGraduateRecords] = useState<GraduateAlumniRecord[]>(initialTenant.graduateRecords || []);
  const [replacementRequests, setReplacementRequests] = useState<CertificateReplacementRequest[]>(initialTenant.replacementRequests || []);
  const [accreditations, setAccreditations] = useState<InstitutionalAccreditation[]>(initialTenant.accreditations || []);
  const [verificationLogs, setVerificationLogs] = useState<EmployerVerificationLog[]>(initialTenant.verificationLogs || []);
  const [biometricGateLogs, setBiometricGateLogs] = useState<BiometricGateLog[]>(
    initialTenant.biometricGateLogs || []
  );
  const [photoChangeRequests, setPhotoChangeRequests] = useState<StudentPhotoChangeRequest[]>(
    initialTenant.photoChangeRequests || []
  );
  const [beceMockSeries, setBeceMockSeries] = useState<BeceMockExamSeries[]>(
    initialTenant.beceMockSeries || []
  );
  const [beceMockScores, setBeceMockScores] = useState<BeceMockScoreRecord[]>(
    initialTenant.beceMockScores || []
  );
  const [beceInterventions, setBeceInterventions] = useState<BeceAcademicIntervention[]>(
    initialTenant.beceInterventions || []
  );
  const [beceAiReports, setBeceAiReports] = useState<BeceAiReadinessReport[]>(
    initialTenant.beceAiReports || []
  );

  // Global Platform Owner & Developer Public Profile
  const [platformOwnerProfile, setPlatformOwnerProfile] = useState<PlatformOwnerProfile>(() => {
    try {
      const cached =
        localStorage.getItem(PLATFORM_OWNER_PROFILE_KEY) ??
        localStorage.getItem(LEGACY_PLATFORM_OWNER_PROFILE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.name === 'string') {
          localStorage.setItem(PLATFORM_OWNER_PROFILE_KEY, cached);
          return {
            ...DEFAULT_PLATFORM_OWNER_PROFILE,
            ...parsed,
            id: 'ownerProfile',
            photoUrl: parsed.photoUrl || DEFAULT_PLATFORM_OWNER_PROFILE.photoUrl,
          };
        }
      }
    } catch {
      // Fall back to default owner profile
    }
    return DEFAULT_PLATFORM_OWNER_PROFILE;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isOwnerEmailSession, setIsOwnerEmailSession] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem(PLATFORM_OWNER_SESSION_KEY)?.toLowerCase() ===
        BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
      );
    } catch {
      return false;
    }
  });
  const [ownerSavedPassword, setOwnerSavedPassword] = useState<string>(() => {
    try {
      return localStorage.getItem(PLATFORM_OWNER_PASSWORD_KEY) || '';
    } catch {
      return '';
    }
  });
  const [cloudPublicCreds, setCloudPublicCreds] = useState<Record<string, any>[]>([]);
  const [cloudPublicGraduates, setCloudPublicGraduates] = useState<
    (GraduateAlumniRecord & { institutionName: string; institutionCode: string })[]
  >([]);
  const [cloudPublicArticles, setCloudPublicArticles] = useState<ResearchArticle[]>([]);
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [publicNetworkRevision, setPublicNetworkRevision] = useState(0);

  const getEffectiveSchoolOwnerUid = (targetSchoolId = activeSchoolId): string | undefined => {
    if (school.id === targetSchoolId && school.ownerUid) return school.ownerUid;
    return schools.find((s) => s.id === targetSchoolId)?.ownerUid;
  };

  const canWriteSchoolAdminInCloud = (targetSchoolId = activeSchoolId): boolean => {
    if (!targetSchoolId || targetSchoolId === EMPTY_SCHOOL_ID || isRemovedSampleSchoolId(targetSchoolId)) {
      return false;
    }
    const fb = auth.currentUser;
    if (!fb || !fb.emailVerified) return false;
    if (isBootstrappedAdminUser(fb)) return true;
    const ownerUid = getEffectiveSchoolOwnerUid(targetSchoolId);
    return Boolean(ownerUid && ownerUid === fb.uid);
  };

  const platformOwnerEmail = BOOTSTRAPPED_ADMIN_EMAIL;
  const isCloudSynced = Boolean(firebaseUser && firebaseUser.emailVerified);
  const isPlatformAdmin = Boolean(
    isOwnerEmailSession || (firebaseUser && firebaseUser.emailVerified && isBootstrappedAdminUser(firebaseUser))
  );

  const setCurrentUser = (targetUser: UserAccount) => {
    setCurrentUserState(targetUser);
    if (
      targetUser.role === 'parent' ||
      targetUser.role === 'student' ||
      targetUser.role === 'graduate'
    ) {
      setActiveModule('parent-portal');
    } else if (activeModule === 'parent-portal') {
      setActiveModule(isInstituteLevelType(school.levelType) ? 'professional-credentials' : 'dashboard');
    }
  };

  const runCloudTask = (promise: Promise<unknown>) => {
    promise.catch((err) => {
      if (isBenignAbortError(err) || isTransientOfflineOrTokenError(err)) return;
      console.error('Cloud Firestore operation rejected:', err);
    });
  };

  // Boot fetch of public cloud registries (institutions, public QR verification credentials, graduates, journals)
  useEffect(() => {
    let cancelled = false;
    fetchPublicCloudRegistry()
      .then((registry) => {
        if (cancelled) return;
        const validCloudSchools = registry.schools.filter((s) => !isRemovedSampleSchoolId(s.id));
        if (validCloudSchools.length > 0) {
          setSchools((prev) => {
            const merged = mergeById(
              prev.filter((s) => s.id !== EMPTY_SCHOOL_ID && !isRemovedSampleSchoolId(s.id)),
              validCloudSchools
            );
            return merged;
          });
          setActiveSchoolId((prevId) => {
            if (!prevId || prevId === EMPTY_SCHOOL_ID || isRemovedSampleSchoolId(prevId)) {
              const firstCloud = validCloudSchools[0];
              let storedForFirst: SchoolTenantData | null = null;
              try {
                const raw =
                  localStorage.getItem(TENANT_STORAGE_PREFIX + firstCloud.id) ??
                  localStorage.getItem(LEGACY_TENANT_STORAGE_PREFIX + firstCloud.id);
                if (raw) {
                  const parsed = JSON.parse(raw);
                  if (parsed && parsed.school && parsed.school.id === firstCloud.id) {
                    storedForFirst = parsed;
                  }
                }
              } catch {
                // Ignore storage parse error
              }
              const baseTenant = storedForFirst || getInitialTenantData(firstCloud.id);
              const hydratedCloud = hydrateProfessionalFields(firstCloud.id, {
                ...baseTenant,
                school: {
                  ...baseTenant.school,
                  ...firstCloud,
                  signatories: firstCloud.signatories || baseTenant.school?.signatories || getDefaultSignatoriesForSchool(firstCloud),
                },
              });
              setSchool(hydratedCloud.school);
              setEducationalSections(hydratedCloud.educationalSections || []);
              setGradeClasses(hydratedCloud.gradeClasses || []);
              setClasses(hydratedCloud.classes);
              setSubjects(hydratedCloud.subjects);
              if (hydratedCloud.users.length > 0) {
                setUsers(hydratedCloud.users);
              }
              return firstCloud.id;
            }
            const activeCloud = validCloudSchools.find((s) => s.id === prevId);
            if (activeCloud) {
              setSchool((prevSch) => ({ ...prevSch, ...activeCloud, signatories: prevSch.signatories }));
            }
            return prevId;
          });
        }
        if (registry.ownerProfile) {
          setPlatformOwnerProfile(registry.ownerProfile);
          try {
            localStorage.setItem(PLATFORM_OWNER_PROFILE_KEY, JSON.stringify(registry.ownerProfile));
          } catch {
            // Ignore storage quota issues
          }
        }
        setCloudPublicCreds(registry.publicCreds);
        setCloudPublicGraduates(registry.publicGraduates);
        setCloudPublicArticles(registry.publicArticles);
        setPublicNetworkRevision((r) => r + 1);
      })
      .catch((err) => {
        if (cancelled || isBenignAbortError(err) || isTransientOfflineOrTokenError(err)) return;
        console.error('Initial public cloud registry sync error:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Firebase Auth listener & sample school cloud purge
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          await fbUser.getIdToken();
        } catch (tokenErr) {
          if (isTransientOfflineOrTokenError(tokenErr)) {
            setFirebaseUser(null);
            setAuthReady(true);
            return;
          }
        }
      }

      setFirebaseUser(fbUser);
      setAuthReady(true);

      if (fbUser && fbUser.emailVerified && fbUser.email) {
        runCloudTask(syncAuthenticatedUserProfile(fbUser, activeSchoolId));
        if (isBootstrappedAdminUser(fbUser)) {
          runCloudTask(
            purgeSampleInstitutionsFromCloud(fbUser).then(() =>
              fetchPublicCloudRegistry().then((reg) => {
                const validSchools = reg.schools.filter((s) => !isRemovedSampleSchoolId(s.id));
                setSchools((prev) =>
                  mergeById(
                    prev.filter((s) => s.id !== EMPTY_SCHOOL_ID && !isRemovedSampleSchoolId(s.id)),
                    validSchools
                  )
                );
                setCloudPublicCreds(reg.publicCreds);
                setCloudPublicGraduates(reg.publicGraduates);
                setCloudPublicArticles(reg.publicArticles);
                setPublicNetworkRevision((r) => r + 1);
              })
            )
          );
        }
      }
    });
    return () => unsubAuth();
  }, []);

  const effectiveActiveOwnerUid = getEffectiveSchoolOwnerUid(activeSchoolId);
  const hasAdminListenerScope = Boolean(
    isPlatformAdmin || (firebaseUser?.uid && effectiveActiveOwnerUid && effectiveActiveOwnerUid === firebaseUser.uid)
  );

  // Real-time Firestore workspace listeners (only active when authReady && verified user)
  useEffect(() => {
    if (!authReady || !firebaseUser || !firebaseUser.emailVerified) {
      return;
    }

    const unsubWorkspace = subscribeToCloudWorkspace({
      fbUser: firebaseUser,
      activeSchoolId,
      schoolOwnerUid: effectiveActiveOwnerUid,
      onPublicSchools: (cloudSchools) => {
        const validCloudSchools = cloudSchools.filter((s) => !isRemovedSampleSchoolId(s.id));
        if (validCloudSchools.length > 0) {
          setSchools((prev) =>
            mergeById(
              prev.filter((s) => s.id !== EMPTY_SCHOOL_ID && !isRemovedSampleSchoolId(s.id)),
              validCloudSchools
            )
          );
          if (!activeSchoolId || activeSchoolId === EMPTY_SCHOOL_ID || isRemovedSampleSchoolId(activeSchoolId)) {
            const firstCloud = validCloudSchools[0];
            const baseTenant = getInitialTenantData(firstCloud.id);
            const hydratedCloud = hydrateProfessionalFields(firstCloud.id, {
              ...baseTenant,
              school: {
                ...baseTenant.school,
                ...firstCloud,
                signatories: firstCloud.signatories || getDefaultSignatoriesForSchool(firstCloud),
              },
            });
            setActiveSchoolId(firstCloud.id);
            setSchool(hydratedCloud.school);
            setEducationalSections(hydratedCloud.educationalSections || []);
            setGradeClasses(hydratedCloud.gradeClasses || []);
            setClasses(hydratedCloud.classes);
            setSubjects(hydratedCloud.subjects);
          } else {
            const activeCloud = validCloudSchools.find((s) => s.id === activeSchoolId);
            if (activeCloud) {
              setSchool((prev) => ({ ...prev, ...activeCloud, signatories: prev.signatories }));
            }
          }
        }
      },
      onPublicCredentials: (creds) => {
        setCloudPublicCreds(creds);
        setPublicNetworkRevision((r) => r + 1);
      },
      onPublicGraduates: (grads) => {
        setCloudPublicGraduates(grads);
        setPublicNetworkRevision((r) => r + 1);
      },
      onPublicArticles: (articles) => {
        setCloudPublicArticles(articles);
        const forActive = articles.filter((a) => a.schoolId === activeSchoolId);
        if (forActive.length > 0) {
          setResearchArticles((prev) => mergeById(prev, forActive));
        }
        setPublicNetworkRevision((r) => r + 1);
      },
      onSchoolSignatories: (sigs) => {
        setSchool((prev) => ({ ...prev, signatories: mergeById(prev.signatories || [], sigs) }));
      },
      onSchoolProgrammes: (progs) => {
        setProgrammes((prev) => mergeById(prev, progs));
      },
      onSchoolCourses: (courses) => {
        setProgrammeCourses((prev) => mergeById(prev, courses));
      },
      onSchoolStudents: (cloudStudents) => {
        setStudents((prev) => mergeById(prev, cloudStudents));
      },
      onSchoolCandidates: (cloudCandidates) => {
        setCandidates((prev) => mergeById(prev, cloudCandidates));
      },
      onSchoolAssessments: (cloudAssessments) => {
        setCandidateAssessments((prev) => mergeById(prev, cloudAssessments));
      },
      onSchoolExamResults: (cloudResults) => {
        setExamResults((prev) => mergeById(prev, cloudResults));
      },
      onSchoolFeePayments: (cloudPayments) => {
        setFeePayments((prev) => mergeById(prev, cloudPayments));
      },
      onSchoolCredentials: (cloudCreds) => {
        setIssuedCredentials((prev) => mergeById(prev, cloudCreds));
      },
      onSchoolGraduates: (cloudGrads) => {
        setGraduateRecords((prev) => mergeById(prev, cloudGrads));
      },
      onSchoolReplacementRequests: (cloudReqs) => {
        setReplacementRequests((prev) => mergeById(prev, cloudReqs));
      },
    });

    return () => {
      unsubWorkspace();
    };
  }, [authReady, firebaseUser?.uid, firebaseUser?.emailVerified, activeSchoolId, hasAdminListenerScope]);

  const signatories: AuthorizedSignatory[] = React.useMemo(
    () => (Array.isArray(school.signatories) ? school.signatories : []),
    [school]
  );

  const buildCurrentTenantSnapshot = (): SchoolTenantData => ({
    school,
    users,
    students,
    classes,
    educationalSections,
    gradeClasses,
    subjects,
    admissions,
    examResults,
    feeItems,
    feePayments,
    transactions,
    staff,
    staffAttendance,
    timetable,
    attendance,
    libraryBooks,
    bookLoans,
    assets,
    routes,
    boardingHouses,
    healthRecords,
    announcements,
    researchArticles,
    programmes,
    programmeCourses,
    candidates,
    candidateAssessments,
    certificateTemplates,
    issuedCredentials,
    graduateRecords,
    replacementRequests,
    accreditations,
    verificationLogs,
    biometricGateLogs,
    photoChangeRequests,
    beceMockSeries,
    beceMockScores,
    beceInterventions,
    beceAiReports,
  });

  useEffect(() => {
    try {
      localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify(schools));
      if (!activeSchoolId || activeSchoolId === EMPTY_SCHOOL_ID || isRemovedSampleSchoolId(activeSchoolId)) {
        return;
      }
      if (school.id !== activeSchoolId) {
        return;
      }

      const currentTenantData = buildCurrentTenantSnapshot();
      localStorage.setItem(TENANT_STORAGE_PREFIX + activeSchoolId, JSON.stringify(currentTenantData));
      localStorage.setItem(ACTIVE_SCHOOL_KEY, activeSchoolId);
    } catch (e) {
      console.error('Failed to sync tenant data to localStorage', e);
    }
  }, [
    activeSchoolId,
    schools,
    school,
    users,
    currentUser,
    students,
    classes,
    educationalSections,
    gradeClasses,
    subjects,
    admissions,
    examResults,
    feeItems,
    feePayments,
    transactions,
    staff,
    staffAttendance,
    timetable,
    attendance,
    libraryBooks,
    bookLoans,
    assets,
    routes,
    boardingHouses,
    healthRecords,
    announcements,
    researchArticles,
    programmes,
    programmeCourses,
    candidates,
    candidateAssessments,
    certificateTemplates,
    issuedCredentials,
    graduateRecords,
    replacementRequests,
    accreditations,
    verificationLogs,
    biometricGateLogs,
    photoChangeRequests,
    beceMockSeries,
    beceMockScores,
    beceInterventions,
    beceAiReports,
    isAuthenticated,
  ]);

  const applyTenantState = (targetSchoolId: string, targetTenant: SchoolTenantData, safeSchool: SchoolProfile) => {
    setActiveSchoolId(targetSchoolId);
    setSchool(safeSchool);
    setUsers(targetTenant.users);
    setCurrentUserState(targetTenant.users[0] || EMPTY_FALLBACK_USER);
    setStudents(targetTenant.students);
    setClasses(targetTenant.classes);
    setEducationalSections(
      targetTenant.educationalSections || getCanonicalSectionsForLevelType(safeSchool.levelType)
    );
    setGradeClasses(
      targetTenant.gradeClasses ||
        getCanonicalGradeClassesForLevelType(safeSchool.levelType, targetTenant.educationalSections)
    );
    setSubjects(targetTenant.subjects);
    setAdmissions(targetTenant.admissions);
    setExamResults(targetTenant.examResults);
    setFeeItems(targetTenant.feeItems);
    setFeePayments(targetTenant.feePayments);
    setTransactions(targetTenant.transactions);
    setStaff(targetTenant.staff);
    setStaffAttendance(targetTenant.staffAttendance);
    setTimetable(targetTenant.timetable);
    setAttendance(targetTenant.attendance);
    setLibraryBooks(targetTenant.libraryBooks);
    setBookLoans(targetTenant.bookLoans);
    setAssets(targetTenant.assets);
    setRoutes(targetTenant.routes);
    setBoardingHouses(targetTenant.boardingHouses);
    setHealthRecords(targetTenant.healthRecords);
    setAnnouncements(targetTenant.announcements);
    setResearchArticles(targetTenant.researchArticles || []);
    setProgrammes(targetTenant.programmes || []);
    setProgrammeCourses(targetTenant.programmeCourses || []);
    setCandidates(targetTenant.candidates || []);
    setCandidateAssessments(targetTenant.candidateAssessments || []);
    setCertificateTemplates(targetTenant.certificateTemplates || []);
    setIssuedCredentials(targetTenant.issuedCredentials || []);
    setGraduateRecords(targetTenant.graduateRecords || []);
    setReplacementRequests(targetTenant.replacementRequests || []);
    setAccreditations(targetTenant.accreditations || []);
    setVerificationLogs(targetTenant.verificationLogs || []);
    setBiometricGateLogs(targetTenant.biometricGateLogs || []);
    setPhotoChangeRequests(targetTenant.photoChangeRequests || []);
    setBeceMockSeries(targetTenant.beceMockSeries || []);
    setBeceMockScores(targetTenant.beceMockScores || []);
    setBeceInterventions(targetTenant.beceInterventions || []);
    setBeceAiReports(targetTenant.beceAiReports || []);
  };

  const switchSchool = (targetSchoolId: string) => {
    if (targetSchoolId === activeSchoolId && school.id === targetSchoolId) return;

    const targetSchoolProfile = schools.find((s) => s.id === targetSchoolId);
    if (!targetSchoolProfile) {
      console.error('Target school not found:', targetSchoolId);
      return;
    }

    if (school.id === activeSchoolId) {
      try {
        localStorage.setItem(TENANT_STORAGE_PREFIX + activeSchoolId, JSON.stringify(buildCurrentTenantSnapshot()));
      } catch (e) {
        console.error('Error saving current tenant before switch', e);
      }
    }

    const targetTenant = loadTenantData(targetSchoolId);
    const safeSchool: SchoolProfile = {
      ...targetSchoolProfile,
      ...targetTenant.school,
      id: targetSchoolId,
      name: targetSchoolProfile.name,
      code: targetSchoolProfile.code,
    };

    applyTenantState(targetSchoolId, targetTenant, safeSchool);
    const targetIsInstitute = isInstituteLevelType(safeSchool.levelType);
    if (
      (!targetIsInstitute &&
        activeModule === 'professional-credentials' &&
        !(safeSchool.enabledModules || []).includes('professional_credentials')) ||
      (targetIsInstitute &&
        ['academics', 'attendance', 'examinations', 'bece-mock-exams', 'welfare-transport', 'library-inventory'].includes(activeModule))
    ) {
      setActiveModule('dashboard');
    }

    try {
      localStorage.setItem(ACTIVE_SCHOOL_KEY, targetSchoolId);
      localStorage.setItem(TENANT_STORAGE_PREFIX + targetSchoolId, JSON.stringify({ ...targetTenant, school: safeSchool }));
    } catch (e) {
      console.error('Failed to write target school to localStorage', e);
    }
  };

  const registerSchool = (
    schoolData: Omit<SchoolProfile, 'id'>,
    adminCredentials: { name: string; email: string; password?: string; title?: string; role?: RoleType },
    curriculumOptions?: {
      customCourses?: string[];
      customSubjects?: string[];
      skipAutoDefaults?: boolean;
      offeredPresetId?: string;
      offeredSectionIds?: string[];
    }
  ): { school: SchoolProfile; admin: UserAccount } => {
    const fb = auth.currentUser;
    const hasOwnerAccess =
      isOwnerEmailSession || Boolean(fb && fb.emailVerified && isBootstrappedAdminUser(fb));
    if (!hasOwnerAccess) {
      throw new Error(
        'Unauthorized: Visitors and schools are not permitted to add or register a new school. Only the Platform Administrator can onboard institutions.'
      );
    }

    const newSchoolId = `sch-${Date.now()}`;
    const isInst = isInstituteLevelType(schoolData.levelType);
    const defaultSigUrl = makeCalligraphicSignatureSvg(adminCredentials.name);
    const newAdminId = `usr-admin-${Date.now()}`;
    const initialSignatories: AuthorizedSignatory[] = [
      {
        id: `sig-${newSchoolId}-head`,
        userId: newAdminId,
        name: adminCredentials.name,
        title: adminCredentials.title || (isInst ? 'Rector & Registrar' : 'Headmaster & Principal'),
        role: 'Head of Institution',
        signatureDataUrl: defaultSigUrl,
        signatureMethod: 'drawn',
        updatedAt: new Date().toISOString().split('T')[0],
        active: true,
      },
    ];

    const creatorUid = fb?.uid || 'platform-owner-local';
    const defaultMods =
      schoolData.enabledModules && schoolData.enabledModules.length > 0
        ? schoolData.enabledModules
        : getDefaultModulesForLevelType(schoolData.levelType);

    const codePrefixForInit = (schoolData.code || 'SCH').split('-')[0].toUpperCase();
    const cleanedCustomCourseNames = (curriculumOptions?.customCourses || [])
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    const cleanedCustomSubjectNames = (curriculumOptions?.customSubjects || [])
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const initialCustomTracks: SchoolCourseTrack[] = cleanedCustomCourseNames.map((name, idx) => ({
      id: `trk-${newSchoolId}-${idx + 1}`,
      code: `${codePrefixForInit}-CRS-${String(idx + 1).padStart(2, '0')}`,
      name,
      department: isInst ? 'Institutional Programmes' : 'Academic Programmes',
      category: isInst ? 'Certificate / Diploma' : 'Custom Course',
      duration: isInst ? 'Institutional Schedule' : 'Full Academic Cycle',
      description: `Custom course/programme defined by ${schoolData.name}.`,
      isCustom: true,
    }));

    const skipDefaults = Boolean(curriculumOptions?.skipAutoDefaults);
    const autoCourseNamesToExclude = skipDefaults
      ? getDefaultCourseTracksForLevelType(schoolData.levelType).map((t) => t.name)
      : [];

    const newSchool: SchoolProfile = {
      ...schoolData,
      id: newSchoolId,
      ownerUid: creatorUid,
      whatsappNumber: schoolData.whatsappNumber?.trim() || schoolData.phone?.trim() || '',
      whatsappEnabled: schoolData.whatsappEnabled ?? true,
      headmasterSignatureDataUrl: defaultSigUrl,
      signatories: initialSignatories,
      enabledModules: isInst ? Array.from(new Set(['professional_credentials', ...defaultMods])) : defaultMods,
      customCourseTracks: [
        ...(schoolData.customCourseTracks || []),
        ...initialCustomTracks,
      ],
      excludedDefaultCourseNames: autoCourseNamesToExclude,
      customCurriculumInitialized:
        skipDefaults || cleanedCustomSubjectNames.length > 0 || cleanedCustomCourseNames.length > 0,
      offeredSectionIds: curriculumOptions?.offeredSectionIds,
    };

    const newAdmin: UserAccount = {
      id: newAdminId,
      name: adminCredentials.name,
      email: adminCredentials.email.trim().toLowerCase(),
      password: adminCredentials.password || 'admin123',
      role: adminCredentials.role || 'proprietor',
      title: adminCredentials.title || (isInst ? 'Rector & Super Administrator' : 'Headmaster & Super Administrator'),
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      schoolId: newSchoolId,
      signatureDataUrl: defaultSigUrl,
      signatureMethod: 'drawn',
      signatureUpdatedAt: new Date().toISOString().split('T')[0],
    };

    let starterSections = getCanonicalSectionsForLevelType(newSchool.levelType);
    const chosenPreset = curriculumOptions?.offeredPresetId
      ? GHANA_EDUCATIONAL_PRESETS.find((p) => p.id === curriculumOptions.offeredPresetId)
      : undefined;

    if (!isInst && chosenPreset) {
      const allowedSec = new Set(chosenPreset.sectionIds);
      starterSections = starterSections.map((s) => ({ ...s, active: allowedSec.has(s.id) }));
    } else if (!isInst && curriculumOptions?.offeredSectionIds && curriculumOptions.offeredSectionIds.length > 0) {
      const allowedSec = new Set(curriculumOptions.offeredSectionIds);
      starterSections = starterSections.map((s) => ({ ...s, active: allowedSec.has(s.id) }));
    }

    let starterGrades = getCanonicalGradeClassesForLevelType(newSchool.levelType, starterSections);
    if (!isInst && chosenPreset?.gradeCodes && chosenPreset.gradeCodes.length > 0) {
      const allowedCodes = new Set(chosenPreset.gradeCodes);
      starterGrades = starterGrades.map((g) => ({
        ...g,
        active: allowedCodes.has(g.canonicalCode),
      }));
    }

    const starterClasses: ClassRoom[] = buildDefaultStreamsForActiveGrades(
      newSchoolId,
      starterSections,
      starterGrades,
      newAdmin.id,
      newAdmin.name
    );

    const codePrefix = (newSchool.code || 'INST').split('-')[0].toUpperCase();
    const starterProgrammes: ProfessionalProgramme[] = isInst
      ? [
          {
            id: `prog-${newSchoolId}-01`,
            schoolId: newSchoolId,
            code: `${codePrefix}-QUAL-01`,
            title: `${newSchool.name} Chartered & Certificate Programme`,
            category: 'Professional Qualification',
            qualificationAwarded: `Professional Qualification & Certificate (${newSchool.code})`,
            awardingAuthorityModel: 'Institution Direct Award',
            durationLabel: 'Levels 1–3 & Certificate Track',
            totalCreditHours: 48,
            entryRequirements: 'Standard academic or practitioner entry qualification.',
            assessmentMethods: 'Continuous assessment, practical portfolio, and final examination.',
            examinationRegulations: 'Institutional examination board moderation and integrity rules.',
            progressionRules: 'Complete mandatory courses at each level or complete the standalone Certificate level.',
            completionRequirements: 'Pass required modules and satisfy institutional fee clearance.',
            feeClearanceRequired: true,
            status: 'Active',
            levels: [
              {
                levelNumber: 1,
                levelTitle: 'Level 1 (Foundation)',
                creditHoursRequired: 12,
                passMarkPercent: 50,
                maxAllowedResits: 3,
                levelFeeAmount: 1500,
                awardOnLevelCompletion: 'Level 1 Foundation Statement',
              },
              {
                levelNumber: 2,
                levelTitle: 'Level 2 (Intermediate)',
                creditHoursRequired: 12,
                passMarkPercent: 50,
                maxAllowedResits: 3,
                levelFeeAmount: 1800,
                awardOnLevelCompletion: 'Level 2 Intermediate Diploma',
              },
              {
                levelNumber: 3,
                levelTitle: 'Level 3 (Advanced / Final)',
                creditHoursRequired: 12,
                passMarkPercent: 50,
                maxAllowedResits: 3,
                levelFeeAmount: 2200,
                awardOnLevelCompletion: 'Full Professional Qualification',
              },
              {
                levelNumber: INSTITUTE_CERTIFICATE_LEVEL,
                levelTitle: 'Certificate (Standalone Non-Chartered)',
                creditHoursRequired: 12,
                passMarkPercent: 50,
                maxAllowedResits: 3,
                levelFeeAmount: 1200,
                awardOnLevelCompletion: 'Institutional Certificate of Competence',
              },
            ],
          },
        ]
      : [];

    const starterTemplates: CertificateTemplateConfig[] = [
      {
        id: `tpl-${newSchoolId}-01`,
        schoolId: newSchoolId,
        name: `${newSchool.name} Official Award Certificate`,
        themeStyle: 'emerald-gold',
        orientation: 'landscape',
        headerSubtitle: `${newSchool.name} · Official Academic & Professional Credential`,
        sealLabel: `OFFICIAL SEAL · ${newSchool.code}`,
        showQrCode: true,
        showCandidateId: true,
        showLevelCompleted: true,
        showCreditHours: true,
        showAuthorityDisclaimer: true,
        authorityDisclaimerText: `Issued under the seal and authority of ${newSchool.name} (${newSchool.code}). Verify online via certificate number or QR code.`,
        primarySignatoryId: initialSignatories[0]?.id,
      },
    ];

    const initialCustomSubjectsList: Subject[] = cleanedCustomSubjectNames.map((subName, idx) => ({
      id: `sbj-${newSchoolId}-cust-${idx + 1}`,
      code: `${codePrefix}-${String(101 + idx)}`,
      name: subName,
      category: idx < 4 ? 'Core' : 'Elective',
      level: isInst
        ? 'Tertiary / Institute'
        : newSchool.levelType === 'Basic & JHS'
        ? 'JHS'
        : 'SHS',
      department: 'Custom School Curriculum',
      isCustom: true,
    }));

    const starterSubjects: Subject[] = skipDefaults
      ? initialCustomSubjectsList
      : [...initialCustomSubjectsList, ...INITIAL_SUBJECTS];

    const newTenantData: SchoolTenantData = {
      school: newSchool,
      users: [newAdmin],
      students: [],
      classes: starterClasses,
      educationalSections: starterSections,
      gradeClasses: starterGrades,
      subjects: starterSubjects,
      admissions: [],
      examResults: [],
      feeItems: [
        { id: `fee-${newSchoolId}-1`, name: 'Tuition & Registration Fee', amount: 1850, term: newSchool.currentTerm, classLevel: 'All' },
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
      programmes: starterProgrammes,
      programmeCourses: [],
      candidates: [],
      candidateAssessments: [],
      certificateTemplates: starterTemplates,
      issuedCredentials: [],
      graduateRecords: [],
      replacementRequests: [],
      accreditations: [],
      verificationLogs: [],
      biometricGateLogs: [],
      photoChangeRequests: [],
      beceMockSeries:
        newSchool.levelType === 'Basic & JHS' || newSchool.levelType === 'Combined'
          ? [
              {
                id: `mock-${newSchoolId}-1`,
                schoolId: newSchoolId,
                title: 'BECE Mock 1 — Diagnostic Baseline Examination',
                shortLabel: 'Mock 1',
                category: 'BECE Mock Series',
                academicYear: newSchool.currentAcademicYear,
                term: newSchool.currentTerm,
                dateConducted: new Date().toISOString().split('T')[0],
                targetClassId: starterClasses.find((c) => c.level === 'JHS')?.id || 'all-jhs',
                sequenceOrder: 1,
                maxScorePerSubject: 100,
                publishedToPortals: true,
                notes: 'Baseline diagnostic mock covering GES JHS 1–3 BECE syllabus.',
              },
            ]
          : [],
      beceMockScores: [],
      beceInterventions: [],
      beceAiReports: [],
    };

    localStorage.setItem(TENANT_STORAGE_PREFIX + newSchoolId, JSON.stringify(newTenantData));

    const updatedSchools = [
      ...schools.filter((s) => s.id !== EMPTY_SCHOOL_ID && !isRemovedSampleSchoolId(s.id)),
      newSchool,
    ];
    setSchools(updatedSchools);
    localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify(updatedSchools));
    localStorage.setItem(ACTIVE_SCHOOL_KEY, newSchoolId);

    applyTenantState(newSchoolId, newTenantData, newSchool);
    const initialMod = isInst ? 'professional-credentials' : 'dashboard';
    setCurrentUserState(newAdmin);
    setIsAuthenticated(true);
    setActiveModule(initialMod);

    if (auth.currentUser?.emailVerified) {
      const uid = auth.currentUser.uid;
      runCloudTask(
        (async () => {
          await upsertSchoolInCloud(newSchool, uid);
          await upsertSchoolMemberInCloud(newSchoolId, uid, {
            uid: newAdmin.id,
            name: newAdmin.name,
            role: newAdmin.role,
            title: newAdmin.title,
            avatar: newAdmin.avatar,
          });
          for (const sig of initialSignatories) {
            await upsertSignatoryInCloud(newSchoolId, uid, sig);
          }
          for (const prog of starterProgrammes) {
            await upsertProgrammeInCloud(newSchoolId, uid, prog);
          }
        })()
      );
    }

    return { school: newSchool, admin: newAdmin };
  };

  const deleteSchool = (schoolId: string): boolean => {
    const fb = auth.currentUser;
    const hasOwnerAccess =
      isOwnerEmailSession || Boolean(fb && fb.emailVerified && isBootstrappedAdminUser(fb));
    if (!hasOwnerAccess) {
      return false;
    }

    if (fb && fb.emailVerified && isBootstrappedAdminUser(fb)) {
      runCloudTask(deleteSchoolInCloud(schoolId));
    }

    const filteredSchools = schools.filter(
      (s) => s.id !== schoolId && s.id !== EMPTY_SCHOOL_ID && !isRemovedSampleSchoolId(s.id)
    );
    setSchools(filteredSchools);
    setCloudPublicCreds((prev) => prev.filter((c) => c.schoolId !== schoolId));
    setCloudPublicGraduates((prev) => prev.filter((g) => g.schoolId !== schoolId));
    setCloudPublicArticles((prev) => prev.filter((a) => a.schoolId !== schoolId));
    setPublicNetworkRevision((r) => r + 1);

    try {
      localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify(filteredSchools));
      localStorage.removeItem(TENANT_STORAGE_PREFIX + schoolId);
      localStorage.removeItem(LEGACY_TENANT_STORAGE_PREFIX + schoolId);
    } catch (e) {
      console.error('Error removing deleted school from localStorage', e);
    }

    if (filteredSchools.length === 0) {
      try {
        localStorage.removeItem(ACTIVE_SCHOOL_KEY);
        localStorage.removeItem(LEGACY_ACTIVE_SCHOOL_KEY);
      } catch {
        // Ignore storage errors
      }
      const emptyTenant = getInitialTenantData(EMPTY_SCHOOL_ID);
      applyTenantState(EMPTY_SCHOOL_ID, emptyTenant, EMPTY_WORKSPACE_SCHOOL);
      setIsAuthenticated(false);
    } else if (activeSchoolId === schoolId) {
      const nextSchool = filteredSchools[0];
      const nextTenant = loadTenantData(nextSchool.id);
      const safeNextSchool: SchoolProfile = {
        ...nextSchool,
        ...nextTenant.school,
        id: nextSchool.id,
        name: nextSchool.name,
        code: nextSchool.code,
      };
      applyTenantState(nextSchool.id, nextTenant, safeNextSchool);
      try {
        localStorage.setItem(ACTIVE_SCHOOL_KEY, nextSchool.id);
      } catch {
        // Ignore storage errors
      }
    }

    return true;
  };

  const updateSchoolProfile = (profile: Partial<SchoolProfile>) => {
    setSchool((prev) => {
      const updated = { ...prev, ...profile };
      setSchools((allSchools) =>
        allSchools.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
      );
      if (canWriteSchoolAdminInCloud(updated.id)) {
        const ownerUid = updated.ownerUid || auth.currentUser!.uid;
        runCloudTask(upsertSchoolInCloud(updated, ownerUid));
      }
      return updated;
    });
  };

  const updateUser = (userId: string, data: Partial<UserAccount>) => {
    let updatedUserRef: UserAccount | null = null;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const merged = { ...u, ...data };
        updatedUserRef = merged;
        return merged;
      })
    );
    if (currentUser.id === userId) {
      setCurrentUserState((prev) => ({ ...prev, ...data }));
    }
    if (
      updatedUserRef &&
      (updatedUserRef as UserAccount).email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() &&
      typeof data.password === 'string'
    ) {
      const nextPass = data.password.trim();
      setOwnerSavedPassword(nextPass);
      try {
        if (nextPass) {
          localStorage.setItem(PLATFORM_OWNER_PASSWORD_KEY, nextPass);
        } else {
          localStorage.removeItem(PLATFORM_OWNER_PASSWORD_KEY);
        }
      } catch {
        // Ignore storage errors
      }
    }
    if (updatedUserRef && canWriteSchoolAdminInCloud(activeSchoolId)) {
      const u = updatedUserRef as UserAccount;
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(
        upsertSchoolMemberInCloud(activeSchoolId, ownerUid, {
          uid: u.id,
          name: u.name,
          role: u.role,
          title: u.title,
          avatar: u.avatar,
        })
      );
    }
  };

  const updateCurrentUserAvatar = (newAvatar: string) => {
    updateUser(currentUser.id, { avatar: newAvatar });
  };

  const addUserAccount = (userData: Omit<UserAccount, 'id'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: activeSchoolId,
    };
    setUsers((prev) => {
      const next = [newUser, ...prev];
      if (prev.length === 0 || currentUser.id === EMPTY_FALLBACK_USER.id) {
        setCurrentUserState(newUser);
      }
      return next;
    });
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(
        upsertSchoolMemberInCloud(activeSchoolId, ownerUid, {
          uid: newUser.id,
          name: newUser.name,
          role: newUser.role,
          title: newUser.title,
          avatar: newUser.avatar,
        })
      );
    }
    return newUser;
  };

  const deleteUserAccount = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    const remainingUsers = users.filter((u) => u.id !== userId);
    setUsers(remainingUsers);

    // Also remove any linked digital signatory & staff profile for this admin/user
    const currentSigs = Array.isArray(school.signatories) ? school.signatories : [];
    const removedSigs = currentSigs.filter(
      (s) =>
        s.userId === userId ||
        (targetUser && s.name.trim().toLowerCase() === targetUser.name.trim().toLowerCase())
    );
    const remainingSigs = currentSigs.filter((s) => !removedSigs.some((rem) => rem.id === s.id));

    if (removedSigs.length > 0 || (targetUser && school.headmasterName === targetUser.name)) {
      const nextAdmin =
        remainingUsers.find((u) => u.role === 'proprietor' || u.role === 'admin') || remainingUsers[0];
      const profilePatch: Partial<SchoolProfile> = {
        signatories: remainingSigs,
      };
      if (targetUser && school.headmasterName === targetUser.name) {
        profilePatch.headmasterName = nextAdmin?.name || 'Administrator';
        profilePatch.headmasterSignature = nextAdmin?.name || 'Administrator';
        profilePatch.headmasterSignatureDataUrl =
          remainingSigs[0]?.signatureDataUrl ||
          makeCalligraphicSignatureSvg(nextAdmin?.name || 'Administrator');
      }
      updateSchoolProfile(profilePatch);
    }

    if (targetUser) {
      const targetEmailLower = targetUser.email.trim().toLowerCase();
      setStaff((prev) => prev.filter((st) => st.email.trim().toLowerCase() !== targetEmailLower));
    }

    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      runCloudTask(
        deleteSchoolMemberAndProfileInCloud(
          activeSchoolId,
          userId,
          removedSigs.map((s) => s.id)
        )
      );
    }

    // Handle active session cleanly if the deleted account was currently active
    if (currentUser.id === userId) {
      const nextSessionUser =
        remainingUsers.find((u) => u.role === 'proprietor' || u.role === 'admin') || remainingUsers[0];
      if (nextSessionUser) {
        setCurrentUserState(nextSessionUser);
      } else if (isPlatformAdmin && firebaseUser?.email) {
        const ownerFallback: UserAccount = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Platform Owner',
          email: firebaseUser.email.toLowerCase(),
          role: 'proprietor',
          title: 'Platform Owner (No School Admin Assigned)',
          avatar:
            firebaseUser.photoURL ||
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
          schoolId: activeSchoolId,
        };
        setCurrentUserState(ownerFallback);
      } else {
        setCurrentUserState(EMPTY_FALLBACK_USER);
        setIsAuthenticated(false);
      }
    }
  };

  // ============================================================================
  // DIGITAL SIGNATURES & SIGNATORY ACTIONS
  // ============================================================================

  const saveUserSignature = (
    userId: string,
    signatureDataUrl: string,
    method: 'drawn' | 'uploaded',
    signatoryRole?: AuthorizedSignatory['role'],
    customTitle?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const targetUser = users.find((u) => u.id === userId) || currentUser;

    updateUser(userId, {
      signatureDataUrl,
      signatureMethod: method,
      signatureUpdatedAt: today,
    });

    const currentSigs = [...signatories];
    const existingIdx = currentSigs.findIndex((s) => s.userId === userId || s.name === targetUser.name);
    const derivedRole: AuthorizedSignatory['role'] =
      signatoryRole ||
      (targetUser.role === 'proprietor'
        ? 'Head of Institution'
        : targetUser.role === 'admin'
        ? 'Registrar'
        : 'Lead Lecturer / Teacher');

    const entry: AuthorizedSignatory = {
      id: existingIdx >= 0 ? currentSigs[existingIdx].id : `sig-${Date.now()}`,
      userId,
      name: targetUser.name,
      title: customTitle || targetUser.title,
      role: derivedRole,
      signatureDataUrl,
      signatureMethod: method,
      updatedAt: today,
      active: true,
    };

    if (existingIdx >= 0) {
      currentSigs[existingIdx] = entry;
    } else {
      currentSigs.push(entry);
    }

    const headUpdate: Partial<SchoolProfile> = { signatories: currentSigs };
    if (derivedRole === 'Head of Institution' || targetUser.role === 'proprietor') {
      headUpdate.headmasterSignatureDataUrl = signatureDataUrl;
      headUpdate.headmasterName = targetUser.name;
    }
    updateSchoolProfile(headUpdate);
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(upsertSignatoryInCloud(activeSchoolId, ownerUid, entry));
    }
  };

  const upsertSignatory = (sig: Omit<AuthorizedSignatory, 'id' | 'updatedAt'> & { id?: string }): AuthorizedSignatory => {
    const today = new Date().toISOString().split('T')[0];
    const currentSigs = [...signatories];
    const entry: AuthorizedSignatory = {
      ...sig,
      id: sig.id || `sig-${Date.now()}`,
      updatedAt: today,
    };
    const idx = currentSigs.findIndex((s) => s.id === entry.id);
    if (idx >= 0) {
      currentSigs[idx] = entry;
    } else {
      currentSigs.push(entry);
    }
    updateSchoolProfile({ signatories: currentSigs });
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(upsertSignatoryInCloud(activeSchoolId, ownerUid, entry));
    }
    return entry;
  };

  const removeSignatory = (id: string) => {
    updateSchoolProfile({ signatories: signatories.filter((s) => s.id !== id) });
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      runCloudTask(deleteSignatoryInCloud(activeSchoolId, id));
    }
  };

  // ============================================================================
  // MULTI-LEVEL PROGRAMMES, COURSES, CANDIDATES & PROGRESSION ENGINE
  // ============================================================================

  const addProgramme = (progData: Omit<ProfessionalProgramme, 'id' | 'schoolId'>): ProfessionalProgramme => {
    const newProg: ProfessionalProgramme = {
      ...progData,
      id: `prog-${activeSchoolId}-${Date.now()}`,
      schoolId: activeSchoolId,
    };
    setProgrammes((prev) => [newProg, ...prev]);
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(upsertProgrammeInCloud(activeSchoolId, ownerUid, newProg));
    }
    return newProg;
  };

  const updateProgramme = (id: string, data: Partial<ProfessionalProgramme>) => {
    setProgrammes((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...data };
        if (canWriteSchoolAdminInCloud(activeSchoolId)) {
          const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
          runCloudTask(upsertProgrammeInCloud(activeSchoolId, ownerUid, updated));
        }
        return updated;
      })
    );
  };

  const deleteProgramme = (id: string) => {
    setProgrammes((prev) => prev.filter((p) => p.id !== id));
    setProgrammeCourses((prev) => prev.filter((c) => c.programmeId !== id));
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      runCloudTask(deleteProgrammeInCloud(activeSchoolId, id));
    }
  };

  const addProgrammeCourse = (courseData: Omit<ProgrammeCourse, 'id' | 'schoolId'>): ProgrammeCourse => {
    const newCourse: ProgrammeCourse = {
      ...courseData,
      id: `crs-${activeSchoolId}-${Date.now()}`,
      schoolId: activeSchoolId,
    };
    setProgrammeCourses((prev) => [...prev, newCourse]);
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      const parentProg = programmes.find((p) => p.id === newCourse.programmeId);
      runCloudTask(
        (async () => {
          if (parentProg) {
            await upsertProgrammeInCloud(activeSchoolId, ownerUid, parentProg);
          }
          await upsertCourseInCloud(activeSchoolId, ownerUid, newCourse);
        })()
      );
    }
    return newCourse;
  };

  const updateProgrammeCourse = (id: string, data: Partial<ProgrammeCourse>) => {
    setProgrammeCourses((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, ...data };
        if (canWriteSchoolAdminInCloud(activeSchoolId)) {
          const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
          runCloudTask(upsertCourseInCloud(activeSchoolId, ownerUid, updated));
        }
        return updated;
      })
    );
  };

  const deleteProgrammeCourse = (id: string) => {
    setProgrammeCourses((prev) => prev.filter((c) => c.id !== id));
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      runCloudTask(deleteCourseInCloud(activeSchoolId, id));
    }
  };

  const registerCandidate = (
    data: Omit<CandidateProfile, 'id' | 'schoolId' | 'candidateNumber' | 'enrollmentDate'> & { candidateNumber?: string }
  ): CandidateProfile => {
    const prefix = school.code.split('-')[0] || 'CAND';
    const year = new Date().getFullYear();
    const seq = String(candidates.length + 45).padStart(4, '0');
    const candidateNumber = data.candidateNumber?.trim() || `${prefix}-CAND-${year}-${seq}`;
    const newCand: CandidateProfile = {
      ...data,
      id: `cand-${Date.now()}`,
      schoolId: activeSchoolId,
      candidateNumber,
      enrollmentDate: new Date().toISOString().split('T')[0],
    };
    setCandidates((prev) => [newCand, ...prev]);

    // Automatically create a portal login account for the candidate if one doesn't exist
    const cleanEmail =
      newCand.email.trim().toLowerCase() ||
      `${newCand.firstName.toLowerCase()}.${newCand.lastName.toLowerCase()}@candidate.${prefix.toLowerCase()}.edu.gh`;
    if (!users.some((u) => u.email.toLowerCase() === cleanEmail || u.candidateId === newCand.id)) {
      const prog = programmes.find((p) => p.id === newCand.programmeId);
      addUserAccount({
        name: `${newCand.firstName} ${newCand.lastName}`,
        email: cleanEmail,
        password: 'student123',
        role: 'student',
        title: `${formatInstituteLevelShort(newCand.currentLevel)} Candidate (${prog?.code || 'Programme'})`,
        avatar: newCand.photo,
        candidateId: newCand.id,
        studentId: newCand.studentId,
      });
    }

    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      const parentProg = programmes.find((p) => p.id === newCand.programmeId);
      runCloudTask(
        (async () => {
          if (parentProg) {
            await upsertProgrammeInCloud(activeSchoolId, ownerUid, parentProg);
          }
          await upsertCandidateInCloud(activeSchoolId, ownerUid, { ...newCand, email: cleanEmail });
        })()
      );
    }

    return newCand;
  };

  const updateCandidate = (id: string, data: Partial<CandidateProfile>) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, ...data };
        const fb = auth.currentUser;
        if (canWriteSchoolAdminInCloud(activeSchoolId)) {
          const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || fb!.uid;
          runCloudTask(upsertCandidateInCloud(activeSchoolId, ownerUid, updated, false));
        } else if (
          fb &&
          fb.emailVerified &&
          fb.email &&
          c.email.toLowerCase() === fb.email.toLowerCase()
        ) {
          const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || fb.uid;
          runCloudTask(upsertCandidateInCloud(activeSchoolId, ownerUid, updated, true));
        }
        return updated;
      })
    );
  };

  const saveCandidateAssessment = (assessmentData: Omit<CandidateCourseAssessment, 'id'> & { id?: string }) => {
    let savedRecord: CandidateCourseAssessment | null = null;
    setCandidateAssessments((prev) => {
      const idx = prev.findIndex(
        (a) =>
          (assessmentData.id && a.id === assessmentData.id) ||
          (a.candidateId === assessmentData.candidateId && a.courseId === assessmentData.courseId)
      );
      const record: CandidateCourseAssessment = {
        ...assessmentData,
        id: idx >= 0 ? prev[idx].id : assessmentData.id || `ass-${Date.now()}`,
      };
      savedRecord = record;
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [...prev, record];
    });

    if (savedRecord && canWriteSchoolAdminInCloud(activeSchoolId)) {
      const rec = savedRecord as CandidateCourseAssessment;
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      const cand = candidates.find((c) => c.id === rec.candidateId);
      const crs = programmeCourses.find((c) => c.id === rec.courseId);
      const prog = programmes.find((p) => p.id === rec.programmeId);
      runCloudTask(
        (async () => {
          if (prog) await upsertProgrammeInCloud(activeSchoolId, ownerUid, prog);
          if (crs) await upsertCourseInCloud(activeSchoolId, ownerUid, crs);
          if (cand) await upsertCandidateInCloud(activeSchoolId, ownerUid, cand);
          await upsertAssessmentInCloud(
            activeSchoolId,
            ownerUid,
            rec,
            cand?.email || 'candidate@institute.edu.gh'
          );
        })()
      );
    }
  };

  const evaluateCandidateProgression = (candidateId: string): CandidateProgressionEvaluation | null => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return null;
    const prog = programmes.find((p) => p.id === cand.programmeId);
    const isCertificateTrack = cand.currentLevel === INSTITUTE_CERTIFICATE_LEVEL;
    const charteredLevels = (prog?.levels || []).filter((l) => l.levelNumber !== INSTITUTE_CERTIFICATE_LEVEL);
    const maxLevel = isCertificateTrack
      ? INSTITUTE_CERTIFICATE_LEVEL
      : charteredLevels.length > 0
      ? Math.max(...charteredLevels.map((l) => l.levelNumber))
      : 3;

    const currentLevelCourses = programmeCourses.filter(
      (c) => c.programmeId === cand.programmeId && c.levelNumber === cand.currentLevel && c.isMandatory
    );
    const candAssess = candidateAssessments.filter(
      (a) => a.candidateId === cand.id && a.levelNumber === cand.currentLevel
    );

    let passedOrExemptCount = 0;
    const resitRequiredCourses: string[] = [];
    const deferredOrPendingCourses: string[] = [];

    for (const crs of currentLevelCourses) {
      const rec = candAssess.find((a) => a.courseId === crs.id);
      if (!rec) {
        deferredOrPendingCourses.push(`${crs.code}: ${crs.title} (Awaiting Exam)`);
      } else if (rec.paperStatus === 'Passed' || rec.paperStatus === 'Exempted') {
        passedOrExemptCount += 1;
      } else if (rec.paperStatus === 'Resit Required') {
        resitRequiredCourses.push(`${crs.code} (${rec.totalScore}% - Resit)`);
      } else {
        deferredOrPendingCourses.push(`${crs.code} (${rec.paperStatus})`);
      }
    }

    const allMandatorySatisfied =
      currentLevelCourses.length > 0
        ? passedOrExemptCount >= currentLevelCourses.length
        : candAssess.some((a) => a.paperStatus === 'Passed' || a.paperStatus === 'Exempted');

    const feeBalance = Math.max(0, cand.totalFeesBilled - cand.totalFeesPaid);
    const feeRatio = cand.totalFeesBilled > 0 ? cand.totalFeesPaid / cand.totalFeesBilled : 1;
    const feeClearedForProgression = !prog?.feeClearanceRequired || feeRatio >= 0.8;
    const feeClearedForGraduation = !prog?.feeClearanceRequired || feeBalance === 0;

    const isAtFinalLevel = isCertificateTrack || cand.currentLevel >= maxLevel;
    const eligibleForNextLevel =
      !isAtFinalLevel && allMandatorySatisfied && feeClearedForProgression && resitRequiredCourses.length === 0;
    const eligibleForGraduation =
      isAtFinalLevel &&
      allMandatorySatisfied &&
      feeClearedForGraduation &&
      cand.identityVerified &&
      resitRequiredCourses.length === 0;

    let statusSummary = 'In Progress';
    if (cand.status === 'Completed / Graduated') {
      statusSummary = 'Graduated & Transferred to Alumni Register';
    } else if (eligibleForGraduation) {
      statusSummary = isCertificateTrack
        ? 'Certificate Track Complete — Eligible for Certificate Issuance'
        : 'Eligible for Final Graduation & Credential Issuance';
    } else if (eligibleForNextLevel) {
      statusSummary = `Eligible to Progress to Level ${cand.currentLevel + 1}`;
    } else if (resitRequiredCourses.length > 0) {
      statusSummary = `Restricted: ${resitRequiredCourses.length} Resit Paper(s) Outstanding`;
    } else if (!feeClearedForProgression) {
      statusSummary = `Fee Clearance Pending (Balance: ${school.currency} ${feeBalance.toLocaleString()})`;
    } else if (deferredOrPendingCourses.length > 0) {
      statusSummary = `${deferredOrPendingCourses.length} Mandatory Paper(s) Pending Assessment`;
    }

    return {
      candidateId: cand.id,
      currentLevel: cand.currentLevel,
      maxProgrammeLevel: isCertificateTrack ? 1 : maxLevel,
      mandatoryCoursesCount: currentLevelCourses.length,
      passedOrExemptCount,
      resitRequiredCourses,
      deferredOrPendingCourses,
      feeBalance,
      feeClearedForProgression,
      feeClearedForGraduation,
      identityVerified: cand.identityVerified,
      eligibleForNextLevel,
      eligibleForGraduation,
      statusSummary,
    };
  };

  const promoteCandidateToNextLevel = (candidateId: string): boolean => {
    const evalResult = evaluateCandidateProgression(candidateId);
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand || !evalResult || !evalResult.eligibleForNextLevel) return false;

    const nextLevel = cand.currentLevel + 1;
    const prog = programmes.find((p) => p.id === cand.programmeId);
    const nextLevelConfig = prog?.levels.find((l) => l.levelNumber === nextLevel);

    const promotedCand: CandidateProfile = {
      ...cand,
      completedLevels: Array.from(new Set([...cand.completedLevels, cand.currentLevel])),
      currentLevel: nextLevel,
      totalFeesBilled: cand.totalFeesBilled + (nextLevelConfig?.levelFeeAmount || 0),
    };

    setCandidates((prev) => prev.map((c) => (c.id === candidateId ? promotedCand : c)));
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(upsertCandidateInCloud(activeSchoolId, ownerUid, promotedCand));
    }
    return true;
  };

  // ============================================================================
  // CERTIFICATE TEMPLATES, ISSUANCE, AUDIT LOG & ALUMNI TRANSFER
  // ============================================================================

  const saveCertificateTemplate = (
    tplData: Omit<CertificateTemplateConfig, 'id' | 'schoolId'> & { id?: string }
  ): CertificateTemplateConfig => {
    const record: CertificateTemplateConfig = {
      ...tplData,
      id: tplData.id || `tpl-${activeSchoolId}-${Date.now()}`,
      schoolId: activeSchoolId,
    };
    setCertificateTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === record.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [record, ...prev];
    });
    return record;
  };

  const transferCandidateToGraduateRegister = (
    cand: CandidateProfile,
    cred: IssuedCredential
  ) => {
    const gradYear = new Date(cred.issueDate || new Date().toISOString()).getFullYear();
    const prog = programmes.find((p) => p.id === cand.programmeId);
    const fullName = `${cand.firstName} ${cand.otherNames ? cand.otherNames + ' ' : ''}${cand.lastName}`;

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === cand.id
          ? {
              ...c,
              status: 'Completed / Graduated',
              completedLevels: prog
                ? prog.levels.map((l) => l.levelNumber)
                : Array.from(new Set([...c.completedLevels, c.currentLevel])),
              membershipStatus:
                c.membershipStatus === 'Registered Student Candidate'
                  ? 'Graduate Member (Institution Complete)'
                  : c.membershipStatus,
            }
          : c
      )
    );

    if (cand.studentId) {
      setStudents((prev) =>
        prev.map((s) => (s.id === cand.studentId ? { ...s, status: 'Graduated' } : s))
      );
    }

    let createdGrad: GraduateAlumniRecord | null = null;
    setGraduateRecords((prev) => {
      if (prev.some((g) => g.certificateNumber === cred.certificateNumber)) {
        return prev;
      }
      const newGrad: GraduateAlumniRecord = {
        id: `grad-${Date.now()}`,
        schoolId: activeSchoolId,
        candidateId: cand.id,
        candidateNumber: cand.candidateNumber,
        fullName,
        email: cand.email,
        phone: cand.phone,
        photo: cand.photo,
        programmeId: cand.programmeId,
        programmeTitle: cred.programmeTitle,
        qualificationAwarded: cred.qualificationAwarded,
        levelAttained: cred.levelCompletedLabel,
        graduationYear: gradYear,
        completionApprovedDate: cred.issueDate,
        certificateNumber: cred.certificateNumber,
        verificationCode: cred.verificationCode,
        certificateStatus: cred.status,
        membershipStatus:
          cand.membershipStatus === 'Registered Student Candidate'
            ? 'Graduate Member (Institution Complete)'
            : cand.membershipStatus,
        professionalBodyDesignation: prog?.professionalDesignation,
        directoryConsent: cand.directoryConsent,
        currentEmployerOrRole: cand.headlineOrRole || 'Verified Graduate',
      };
      createdGrad = newGrad;
      return [newGrad, ...prev];
    });

    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      const updatedCandObj: CandidateProfile = {
        ...cand,
        status: 'Completed / Graduated',
        completedLevels: prog
          ? prog.levels.map((l) => l.levelNumber)
          : Array.from(new Set([...cand.completedLevels, cand.currentLevel])),
        membershipStatus:
          cand.membershipStatus === 'Registered Student Candidate'
            ? 'Graduate Member (Institution Complete)'
            : cand.membershipStatus,
      };
      runCloudTask(upsertCandidateInCloud(activeSchoolId, ownerUid, updatedCandObj));
      if (createdGrad) {
        runCloudTask(upsertGraduateInCloud(activeSchoolId, ownerUid, school.name, school.code, createdGrad));
      }
    }
  };

  const issueDigitalCredential = (
    payload: Omit<
      IssuedCredential,
      | 'id'
      | 'schoolId'
      | 'schoolName'
      | 'schoolCode'
      | 'schoolCrest'
      | 'certificateNumber'
      | 'verificationCode'
      | 'auditTrail'
    > & { certificateNumber?: string; approvalNote?: string }
  ): { success: boolean; credential?: IssuedCredential; error?: string } => {
    const prefix = school.code.split('-')[0] || 'SCH';
    const year = new Date().getFullYear();
    const seq = String(issuedCredentials.length + 120).padStart(5, '0');
    const certNumber = (payload.certificateNumber?.trim() || `${prefix}-${year}-CERT-${seq}`).toUpperCase();

    // Prevent duplicate certificate serial numbers
    if (issuedCredentials.some((c) => c.certificateNumber.toUpperCase() === certNumber)) {
      return {
        success: false,
        error: `Duplicate Certificate Serial Number (${certNumber}) blocked by central register.`,
      };
    }

    const verificationCode = generateVerificationCode(prefix);
    const nowStamp = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

    const newCred: IssuedCredential = {
      ...payload,
      id: `cred-${activeSchoolId}-${Date.now()}`,
      schoolId: activeSchoolId,
      schoolName: school.name,
      schoolCode: school.code,
      schoolCrest: school.crest,
      certificateNumber: certNumber,
      verificationCode,
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          timestamp: nowStamp,
          actorName: currentUser.name,
          actorRole: currentUser.title || currentUser.role,
          previousStatus: 'Draft',
          newStatus: payload.status,
          reason:
            payload.approvalNote ||
            (payload.status === 'Valid'
              ? 'Academic, examination, and financial graduation requirements verified and approved for official issuance.'
              : 'Submitted to central credential register pending final executive sign-off.'),
        },
      ],
    };

    setIssuedCredentials((prev) => [newCred, ...prev]);
    setPublicNetworkRevision((r) => r + 1);

    const cand = candidates.find((c) => c.id === payload.candidateId);
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(
        issueOrUpdateCredentialAtomicInCloud(
          activeSchoolId,
          ownerUid,
          newCred,
          cand?.email || 'graduate@institute.edu.gh'
        )
      );
    }

    // Automatic transfer to Alumni / Graduate Register when full qualification is approved as Valid
    if (
      cand &&
      payload.status === 'Valid' &&
      (payload.credentialType === 'Full Qualification Certificate' ||
        payload.credentialType === 'Diploma Certificate' ||
        payload.credentialType === 'Executive Programme Certificate')
    ) {
      transferCandidateToGraduateRegister(cand, newCred);
    }

    return { success: true, credential: newCred };
  };

  const updateCredentialStatus = (
    credentialId: string,
    newStatus: CertificateValidityStatus,
    reason: string,
    replacedByCertificateNumber?: string
  ) => {
    const nowStamp = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    let approvedTargetCred: IssuedCredential | null = null;
    let mutatedCred: IssuedCredential | null = null;

    setIssuedCredentials((prev) =>
      prev.map((cred) => {
        if (cred.id !== credentialId) return cred;
        const updated: IssuedCredential = {
          ...cred,
          status: newStatus,
          revocationOrStatusReason:
            newStatus === 'Revoked' || newStatus === 'Expired' || newStatus === 'Replaced'
              ? reason
              : cred.revocationOrStatusReason,
          replacedByCertificateNumber: replacedByCertificateNumber || cred.replacedByCertificateNumber,
          auditTrail: [
            ...cred.auditTrail,
            {
              id: `aud-${Date.now()}`,
              timestamp: nowStamp,
              actorName: currentUser.name,
              actorRole: currentUser.title || currentUser.role,
              previousStatus: cred.status,
              newStatus,
              reason,
            },
          ],
        };
        mutatedCred = updated;
        if (cred.status !== 'Valid' && newStatus === 'Valid') {
          approvedTargetCred = updated;
        }
        return updated;
      })
    );

    if (mutatedCred && canWriteSchoolAdminInCloud(activeSchoolId)) {
      const credObj = mutatedCred as IssuedCredential;
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      const cand = candidates.find((c) => c.id === credObj.candidateId);
      runCloudTask(
        issueOrUpdateCredentialAtomicInCloud(
          activeSchoolId,
          ownerUid,
          credObj,
          cand?.email || 'graduate@institute.edu.gh'
        )
      );
    }

    // Sync status in Graduate Register (preserving historical record!)
    setGraduateRecords((prev) =>
      prev.map((g) => {
        const target = issuedCredentials.find((c) => c.id === credentialId);
        if (target && g.certificateNumber === target.certificateNumber) {
          const updatedGrad = { ...g, certificateStatus: newStatus };
          if (canWriteSchoolAdminInCloud(activeSchoolId)) {
            const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
            runCloudTask(upsertGraduateInCloud(activeSchoolId, ownerUid, school.name, school.code, updatedGrad));
          }
          return updatedGrad;
        }
        return g;
      })
    );

    if (approvedTargetCred) {
      const credObj = approvedTargetCred as IssuedCredential;
      const cand = candidates.find((c) => c.id === credObj.candidateId);
      if (cand) {
        transferCandidateToGraduateRegister(cand, credObj);
      }
    }

    setPublicNetworkRevision((r) => r + 1);
  };

  const submitReplacementRequest = (
    reqData: Omit<CertificateReplacementRequest, 'id' | 'schoolId' | 'requestedDate' | 'status'>
  ): CertificateReplacementRequest => {
    const newReq: CertificateReplacementRequest = {
      ...reqData,
      id: `rep-${Date.now()}`,
      schoolId: activeSchoolId,
      requestedDate: new Date().toISOString().split('T')[0],
      status: 'Pending Review',
    };
    setReplacementRequests((prev) => [newReq, ...prev]);

    const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId);
    if (auth.currentUser?.emailVerified && ownerUid) {
      runCloudTask(createReplacementRequestInCloud(activeSchoolId, ownerUid, newReq));
    }

    return newReq;
  };

  const processReplacementRequest = (
    requestId: string,
    approve: boolean,
    adminNote: string
  ): IssuedCredential | null => {
    const req = replacementRequests.find((r) => r.id === requestId);
    if (!req) return null;

    if (!approve) {
      const declinedReq: CertificateReplacementRequest = { ...req, status: 'Declined' };
      setReplacementRequests((prev) =>
        prev.map((r) => (r.id === requestId ? declinedReq : r))
      );
      if (canWriteSchoolAdminInCloud(activeSchoolId)) {
        runCloudTask(updateReplacementRequestInCloud(activeSchoolId, declinedReq));
      }
      return null;
    }

    const originalCred = issuedCredentials.find((c) => c.id === req.originalCertificateId);
    if (!originalCred) return null;

    const prefix = school.code.split('-')[0] || 'SCH';
    const year = new Date().getFullYear();
    const newSerial = `${prefix}-${year}-REPL-${String(issuedCredentials.length + 201).padStart(4, '0')}`;

    // Mark original credential as Replaced (preserved in register!)
    updateCredentialStatus(
      originalCred.id,
      'Replaced',
      `Officially replaced by ${newSerial} (${req.reason}: ${adminNote})`,
      newSerial
    );

    const res = issueDigitalCredential({
      certificateNumber: newSerial,
      candidateId: originalCred.candidateId,
      candidateNumber: originalCred.candidateNumber,
      recipientFullName: req.requesterName || originalCred.recipientFullName,
      programmeId: originalCred.programmeId,
      programmeTitle: originalCred.programmeTitle,
      credentialType: originalCred.credentialType,
      qualificationAwarded: originalCred.qualificationAwarded,
      levelCompletedLabel: originalCred.levelCompletedLabel,
      honoursOrDistinction: originalCred.honoursOrDistinction,
      creditHoursCompleted: originalCred.creditHoursCompleted,
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: originalCred.expiryDate,
      status: 'Valid',
      awardingAuthorityName: originalCred.awardingAuthorityName,
      professionalBodyAffiliationNote: originalCred.professionalBodyAffiliationNote,
      templateId: originalCred.templateId,
      signatoriesSnapshot: signatories.slice(0, 3).map((s) => ({
        name: s.name,
        title: s.title,
        signatureDataUrl: s.signatureDataUrl,
      })),
      approvalNote: `Authorised Replacement Credential superseding ${originalCred.certificateNumber}. ${adminNote}`,
    });

    if (res.credential) {
      const approvedReq: CertificateReplacementRequest = {
        ...req,
        status: 'Approved & Re-issued',
        newCertificateNumber: res.credential.certificateNumber,
      };
      setReplacementRequests((prev) =>
        prev.map((r) => (r.id === requestId ? approvedReq : r))
      );
      if (canWriteSchoolAdminInCloud(activeSchoolId)) {
        runCloudTask(updateReplacementRequestInCloud(activeSchoolId, approvedReq));
      }

      setGraduateRecords((prev) =>
        prev.map((g) => {
          if (g.certificateNumber !== originalCred.certificateNumber) return g;
          const updatedGrad: GraduateAlumniRecord = {
            ...g,
            fullName: res.credential!.recipientFullName,
            certificateNumber: res.credential!.certificateNumber,
            verificationCode: res.credential!.verificationCode,
            certificateStatus: 'Valid',
          };
          if (canWriteSchoolAdminInCloud(activeSchoolId)) {
            const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
            runCloudTask(upsertGraduateInCloud(activeSchoolId, ownerUid, school.name, school.code, updatedGrad));
          }
          return updatedGrad;
        })
      );
      return res.credential;
    }
    return null;
  };

  const updateGraduateProfile = (
    graduateId: string,
    data: Partial<Pick<GraduateAlumniRecord, 'email' | 'phone' | 'directoryConsent' | 'currentEmployerOrRole'>>
  ) => {
    const targetGrad = graduateRecords.find((g) => g.id === graduateId);
    setGraduateRecords((prev) => prev.map((g) => (g.id === graduateId ? { ...g, ...data } : g)));
    if (targetGrad) {
      const updatedGrad = { ...targetGrad, ...data };
      const fb = auth.currentUser;
      if (canWriteSchoolAdminInCloud(activeSchoolId)) {
        const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || fb!.uid;
        runCloudTask(upsertGraduateInCloud(activeSchoolId, ownerUid, school.name, school.code, updatedGrad, false));
      } else if (
        fb &&
        fb.emailVerified &&
        fb.email &&
        targetGrad.email.toLowerCase() === fb.email.toLowerCase()
      ) {
        const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || fb.uid;
        runCloudTask(upsertGraduateInCloud(activeSchoolId, ownerUid, school.name, school.code, updatedGrad, true));
      }

      setCandidates((prev) =>
        prev.map((c) =>
          c.id === targetGrad.candidateId
            ? {
                ...c,
                email: data.email ?? c.email,
                phone: data.phone ?? c.phone,
                directoryConsent: data.directoryConsent ?? c.directoryConsent,
                headlineOrRole: data.currentEmployerOrRole ?? c.headlineOrRole,
              }
            : c
        )
      );
    }
    setPublicNetworkRevision((r) => r + 1);
  };

  const addAccreditation = (accData: Omit<InstitutionalAccreditation, 'id' | 'schoolId'>): InstitutionalAccreditation => {
    const newAcc: InstitutionalAccreditation = {
      ...accData,
      id: `acc-${activeSchoolId}-${Date.now()}`,
      schoolId: activeSchoolId,
    };
    setAccreditations((prev) => [newAcc, ...prev]);
    return newAcc;
  };

  const updateAccreditation = (id: string, data: Partial<InstitutionalAccreditation>) => {
    setAccreditations((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  };

  // ============================================================================
  // CROSS-INSTITUTION PUBLIC EMPLOYER CREDENTIAL VERIFICATION & DIRECTORY
  // ============================================================================

  const getAllCredentialsAcrossNetwork = (): { cred: IssuedCredential; schoolId: string }[] => {
    const seenCertNumbers = new Set<string>();
    const results: { cred: IssuedCredential; schoolId: string }[] = [];

    // 1. Live Cloud Firestore public credentials (global source of truth across devices)
    for (const pc of cloudPublicCreds) {
      const certNum = String(pc.certificateNumber || '').toUpperCase();
      if (!certNum || seenCertNumbers.has(certNum)) continue;
      seenCertNumbers.add(certNum);
      results.push({
        schoolId: pc.schoolId || activeSchoolId,
        cred: {
          id: pc.credentialId || pc.certificateKey,
          schoolId: pc.schoolId || activeSchoolId,
          schoolName: pc.issuingInstitutionName || school.name,
          schoolCode: pc.issuingInstitutionCode || school.code,
          schoolCrest: pc.issuingInstitutionCrest || school.crest,
          certificateNumber: pc.certificateNumber,
          verificationCode: pc.verificationCode,
          candidateId: '',
          candidateNumber: pc.candidateNumber || '',
          recipientFullName: pc.recipientFullName,
          programmeId: '',
          programmeTitle: pc.programmeTitle,
          credentialType: pc.credentialType,
          qualificationAwarded: pc.qualificationAwarded,
          levelCompletedLabel: pc.levelCompletedLabel,
          honoursOrDistinction: pc.honoursOrDistinction,
          creditHoursCompleted: 0,
          issueDate: pc.issueDate,
          expiryDate: pc.expiryDate,
          status: pc.status,
          replacedByCertificateNumber: pc.replacedByCertificateNumber,
          revocationOrStatusReason: pc.revocationOrStatusReason,
          awardingAuthorityName: pc.awardingAuthorityName,
          professionalBodyAffiliationNote: pc.professionalBodyAffiliationNote,
          templateId: '',
          signatoriesSnapshot: [],
          auditTrail: [],
        },
      });
    }

    // 2. Active school credentials
    issuedCredentials.forEach((cred) => {
      const certNum = cred.certificateNumber.toUpperCase();
      if (!seenCertNumbers.has(certNum)) {
        seenCertNumbers.add(certNum);
        results.push({ cred, schoolId: activeSchoolId });
      }
    });

    // 3. Other local seeded/cached schools
    for (const s of schools) {
      if (s.id === activeSchoolId) continue;
      const tenant = loadTenantData(s.id);
      (tenant.issuedCredentials || []).forEach((cred) => {
        const certNum = cred.certificateNumber.toUpperCase();
        if (!seenCertNumbers.has(certNum)) {
          seenCertNumbers.add(certNum);
          results.push({ cred, schoolId: s.id });
        }
      });
    }
    return results;
  };

  const appendVerificationLogToSchool = (targetSchoolId: string, logEntry: EmployerVerificationLog) => {
    if (targetSchoolId === activeSchoolId) {
      setVerificationLogs((prev) => [logEntry, ...prev]);
    } else {
      try {
        const tenant = loadTenantData(targetSchoolId);
        const updatedLogs = [logEntry, ...(tenant.verificationLogs || [])];
        localStorage.setItem(
          TENANT_STORAGE_PREFIX + targetSchoolId,
          JSON.stringify({ ...tenant, verificationLogs: updatedLogs })
        );
      } catch (e) {
        console.error('Error recording cross-school verification log', e);
      }
    }

    const ownerUid = getEffectiveSchoolOwnerUid(targetSchoolId);
    if (auth.currentUser?.emailVerified && ownerUid) {
      runCloudTask(createVerificationLogInCloud(targetSchoolId, ownerUid, logEntry));
    }
  };

  const verifyCredentialPublic = (
    query: string,
    verifierMeta?: {
      organization?: string;
      contactName?: string;
      purpose?: string;
      mode?: EmployerVerificationLog['lookupMode'];
    }
  ): PublicCredentialVerificationResult => {
    const cleanQuery = query.trim().toUpperCase();
    const verifiedAt = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    const allCreds = getAllCredentialsAcrossNetwork();

    const matched = allCreds.find(
      ({ cred }) =>
        cred.certificateNumber.toUpperCase() === cleanQuery ||
        cred.verificationCode.toUpperCase() === cleanQuery
    );

    const logEntry: EmployerVerificationLog = {
      id: `vlog-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      schoolId: matched ? matched.schoolId : activeSchoolId,
      timestamp: verifiedAt.slice(0, 16) + ' UTC',
      queriedReference: cleanQuery,
      matchedCertificateNumber: matched?.cred.certificateNumber,
      recipientName: matched?.cred.recipientFullName,
      verifierOrganization: verifierMeta?.organization?.trim() || 'Public Portal / QR Verification',
      verifierContactName: verifierMeta?.contactName?.trim() || 'Unauthenticated Third-Party Verifier',
      verificationPurpose: verifierMeta?.purpose?.trim() || 'Credential Authenticity Check',
      lookupMode: verifierMeta?.mode || 'Single Lookup / QR Scan',
      resultStatus: matched ? matched.cred.status : 'Not Found',
    };

    appendVerificationLogToSchool(matched ? matched.schoolId : activeSchoolId, logEntry);

    if (!matched) {
      return {
        found: false,
        queriedReference: cleanQuery,
        verifiedAt,
      };
    }

    const c = matched.cred;
    // Check automatic expiry if expiryDate is past
    let effectiveStatus = c.status;
    if (c.status === 'Valid' && c.expiryDate && new Date(c.expiryDate) < new Date()) {
      effectiveStatus = 'Expired';
    }

    return {
      found: true,
      queriedReference: cleanQuery,
      verifiedAt,
      status: effectiveStatus,
      certificateNumber: c.certificateNumber,
      verificationCode: c.verificationCode,
      recipientFullName: c.recipientFullName,
      candidateNumber: c.candidateNumber,
      issuingInstitutionName: c.schoolName,
      issuingInstitutionCode: c.schoolCode,
      issuingInstitutionCrest: c.schoolCrest,
      awardingAuthorityName: c.awardingAuthorityName,
      professionalBodyAffiliationNote: c.professionalBodyAffiliationNote,
      credentialType: c.credentialType,
      programmeTitle: c.programmeTitle,
      qualificationAwarded: c.qualificationAwarded,
      levelCompletedLabel: c.levelCompletedLabel,
      honoursOrDistinction: c.honoursOrDistinction,
      issueDate: c.issueDate,
      expiryDate: c.expiryDate,
      replacedByCertificateNumber: c.replacedByCertificateNumber,
      revocationOrStatusReason: c.revocationOrStatusReason,
    };
  };

  const verifyCredentialPublicAsync = async (
    queryStr: string,
    verifierMeta?: {
      organization?: string;
      contactName?: string;
      purpose?: string;
      mode?: EmployerVerificationLog['lookupMode'];
    }
  ): Promise<PublicCredentialVerificationResult> => {
    const cloudRes = await lookupPublicCredentialInCloud(queryStr);
    if (cloudRes && cloudRes.found) {
      return cloudRes;
    }
    return verifyCredentialPublic(queryStr, verifierMeta);
  };

  const verifyCredentialsBatch = (
    queries: string[],
    verifierMeta: { organization: string; contactName: string; purpose: string }
  ): PublicCredentialVerificationResult[] => {
    const cleaned = Array.from(
      new Set(
        queries
          .map((q) => q.trim())
          .filter(Boolean)
      )
    );
    return cleaned.map((q) =>
      verifyCredentialPublic(q, {
        ...verifierMeta,
        mode: 'Employer Batch Verification',
      })
    );
  };

  const allPublicDirectoryGraduates = React.useMemo(() => {
    const seenCerts = new Set<string>();
    const list: (GraduateAlumniRecord & { institutionName: string; institutionCode: string })[] = [];

    for (const cg of cloudPublicGraduates) {
      const key = cg.certificateNumber.toUpperCase();
      if (!seenCerts.has(key)) {
        seenCerts.add(key);
        list.push(cg);
      }
    }

    graduateRecords
      .filter((g) => g.directoryConsent && g.certificateStatus === 'Valid')
      .forEach((g) => {
        const key = g.certificateNumber.toUpperCase();
        if (!seenCerts.has(key)) {
          seenCerts.add(key);
          list.push({ ...g, institutionName: school.name, institutionCode: school.code });
        }
      });

    for (const s of schools) {
      if (s.id === activeSchoolId) continue;
      const tenant = loadTenantData(s.id);
      (tenant.graduateRecords || [])
        .filter((g) => g.directoryConsent && g.certificateStatus === 'Valid')
        .forEach((g) => {
          const key = g.certificateNumber.toUpperCase();
          if (!seenCerts.has(key)) {
            seenCerts.add(key);
            list.push({ ...g, institutionName: s.name, institutionCode: s.code });
          }
        });
    }
    return list;
  }, [cloudPublicGraduates, graduateRecords, schools, activeSchoolId, school.name, school.code, publicNetworkRevision]);

  const samplePublicCredentials = React.useMemo(() => {
    const all = getAllCredentialsAcrossNetwork();
    return all.slice(0, 6).map(({ cred }) => ({
      label: `${cred.recipientFullName} (${cred.status})`,
      certificateNumber: cred.certificateNumber,
      verificationCode: cred.verificationCode,
      status: cred.status,
      institutionCode: cred.schoolCode,
    }));
  }, [cloudPublicCreds, issuedCredentials, schools, activeSchoolId, publicNetworkRevision]);

  // ============================================================================
  // AUTHENTICATION (STAFF / ADMIN & STUDENT / CANDIDATE)
  // ============================================================================

  const matchAccountInTenant = (
    tenant: SchoolTenantData,
    rawIdentifier: string
  ): UserAccount | null => {
    const trimmed = rawIdentifier.trim().toLowerCase();

    // 1. Direct match in tenant.users by email or user ID
    const directUser = tenant.users.find(
      (u) => u.email.toLowerCase() === trimmed || u.id.toLowerCase() === trimmed
    );
    if (directUser) {
      return directUser;
    }

    // 2. Match Staff / Lecturer / Teacher / Accountant in tenant.staff by email or Staff ID
    const matchedStaff = (tenant.staff || []).find(
      (st) => st.email.trim().toLowerCase() === trimmed || st.staffId.trim().toLowerCase() === trimmed
    );
    if (matchedStaff) {
      const existingStaffUser = tenant.users.find(
        (u) => u.email.trim().toLowerCase() === matchedStaff.email.trim().toLowerCase()
      );
      if (existingStaffUser) return existingStaffUser;
      return {
        id: `usr-stf-${matchedStaff.id}`,
        name: matchedStaff.fullName,
        email: matchedStaff.email.trim().toLowerCase(),
        password: 'staff123',
        role: inferPortalRoleFromStaffTitle(matchedStaff.role),
        title: `${matchedStaff.role} (${matchedStaff.staffId})`,
        avatar:
          matchedStaff.photo ||
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
        schoolId: tenant.school.id,
      };
    }

    // 3. Match Candidate Number or Candidate Email
    const matchedCand = (tenant.candidates || []).find(
      (c) => c.candidateNumber.toLowerCase() === trimmed || c.email.toLowerCase() === trimmed
    );
    if (matchedCand) {
      const existingUser = tenant.users.find(
        (u) =>
          (u.role === 'student' || u.role === 'graduate') &&
          (u.candidateId === matchedCand.id || u.studentId === matchedCand.studentId)
      );
      if (existingUser) return existingUser;
      return {
        id: `usr-cand-${matchedCand.id}`,
        name: `${matchedCand.firstName} ${matchedCand.lastName}`,
        email: matchedCand.email,
        password: 'student123',
        role: matchedCand.status === 'Completed / Graduated' ? 'graduate' : 'student',
        title:
          matchedCand.status === 'Completed / Graduated'
            ? `Graduate (${matchedCand.candidateNumber})`
            : `Level ${matchedCand.currentLevel} Candidate (${matchedCand.candidateNumber})`,
        avatar: matchedCand.photo,
        schoolId: tenant.school.id,
        candidateId: matchedCand.id,
        studentId: matchedCand.studentId,
      };
    }

    // 4. Match Student Number or Guardian Email
    const matchedStu = tenant.students.find(
      (s) =>
        s.studentNumber.toLowerCase() === trimmed ||
        (s.guardianEmail && s.guardianEmail.trim().toLowerCase() === trimmed)
    );
    if (matchedStu) {
      const existingUser = tenant.users.find(
        (u) => (u.role === 'student' || u.role === 'graduate') && u.studentId === matchedStu.id
      );
      if (existingUser) return existingUser;
      return {
        id: `usr-stu-${matchedStu.id}`,
        name: `${matchedStu.firstName} ${matchedStu.lastName}`,
        email: `${matchedStu.firstName.toLowerCase()}.${matchedStu.lastName.toLowerCase()}@student.edu.gh`,
        password: 'student123',
        role: matchedStu.status === 'Graduated' ? 'graduate' : 'student',
        title: `Student (${matchedStu.studentNumber})`,
        avatar: matchedStu.photo,
        schoolId: tenant.school.id,
        studentId: matchedStu.id,
        assignedClassId: matchedStu.classId,
      };
    }

    // 5. Fallback: if identifier matches official school email, resolve primary proprietor/admin
    if (tenant.school?.email && tenant.school.email.trim().toLowerCase() === trimmed) {
      const primaryAdmin = tenant.users.find(
        (u) => u.role === 'proprietor' || u.role === 'admin'
      );
      if (primaryAdmin) return primaryAdmin;
    }

    return null;
  };

  const getLandingModuleForUser = (account: UserAccount, levelType: string): string => {
    if (
      account.role === 'parent' ||
      account.role === 'student' ||
      account.role === 'graduate'
    ) {
      return 'parent-portal';
    }
    return isInstituteLevelType(levelType) ? 'professional-credentials' : 'dashboard';
  };

  const activatePlatformOwnerAccountInSchool = (targetSchoolId?: string): boolean => {
    if (schools.length === 0) {
      return false;
    }

    const chosenSchoolId =
      targetSchoolId && schools.some((s) => s.id === targetSchoolId)
        ? targetSchoolId
        : activeSchoolId && schools.some((s) => s.id === activeSchoolId)
        ? activeSchoolId
        : schools[0].id;

    if (chosenSchoolId !== activeSchoolId) {
      switchSchool(chosenSchoolId);
    }

    const fb = auth.currentUser || firebaseUser;
    const targetSchoolObj = schools.find((s) => s.id === chosenSchoolId) || school;
    const emailLower = BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
    const displayName =
      fb?.displayName ||
      platformOwnerProfile.name ||
      'Solomon Appeadu';

    const ownerAccount: UserAccount = {
      id: fb?.uid || 'usr-platform-owner',
      name: displayName,
      email: emailLower,
      password: ownerSavedPassword || undefined,
      role: 'proprietor',
      title: 'Platform Owner & Super Administrator',
      avatar:
        fb?.photoURL ||
        platformOwnerProfile.photoUrl ||
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      schoolId: chosenSchoolId,
      signatureDataUrl: makeCalligraphicSignatureSvg(displayName),
      signatureMethod: 'drawn',
    };

    setUsers((prev) =>
      prev.some((u) => u.id === ownerAccount.id || u.email.toLowerCase() === emailLower)
        ? prev.map((u) =>
            u.id === ownerAccount.id || u.email.toLowerCase() === emailLower ? ownerAccount : u
          )
        : [ownerAccount, ...prev]
    );
    setCurrentUserState(ownerAccount);
    setIsAuthenticated(true);
    setActiveModule(getLandingModuleForUser(ownerAccount, targetSchoolObj.levelType));
    return true;
  };

  const signInPlatformOwnerWithEmail = (
    email: string,
    password?: string,
    options?: { stayOnWebsite?: boolean; targetSchoolId?: string }
  ): { success: boolean; isPlatformAdmin?: boolean; message?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return {
        success: false,
        isPlatformAdmin: false,
        message: 'Please enter the Platform Owner email address.',
      };
    }

    if (cleanEmail !== BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
      return {
        success: false,
        isPlatformAdmin: false,
        message:
          'Access denied: This email address is not authorised as the EduDigital SIS Platform Owner. Please use Staff & Admin or Student sign-in for institutional accounts.',
      };
    }

    if (ownerSavedPassword && ownerSavedPassword.trim().length > 0) {
      if (!password || password.trim() !== ownerSavedPassword.trim()) {
        return {
          success: false,
          isPlatformAdmin: false,
          message: 'Incorrect Platform Owner password. Please enter your Platform Owner password.',
        };
      }
    }

    setIsOwnerEmailSession(true);
    try {
      localStorage.setItem(PLATFORM_OWNER_SESSION_KEY, BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase());
    } catch {
      // Ignore storage errors
    }

    if (schools.length === 0 || options?.stayOnWebsite) {
      return { success: true, isPlatformAdmin: true };
    }

    activatePlatformOwnerAccountInSchool(options?.targetSchoolId);
    return { success: true, isPlatformAdmin: true };
  };

  const loginWithEmail = (
    identifier: string,
    password?: string,
    targetSchoolId?: string,
    loginMode?: 'staff' | 'student' | 'owner'
  ): { success: boolean; isPlatformAdmin?: boolean; message?: string } => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      return {
        success: false,
        message:
          loginMode === 'owner'
            ? 'Please enter the Platform Owner email address.'
            : 'Please enter your institutional email or Student / Candidate ID.',
      };
    }

    if (
      loginMode === 'owner' ||
      (loginMode !== 'student' && trimmed.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase())
    ) {
      return signInPlatformOwnerWithEmail(trimmed, password, { targetSchoolId });
    }

    if (schools.length === 0) {
      return {
        success: false,
        message:
          'No schools or institutes have been registered yet. Sign in as the Platform Owner with your email or Google account to register your first institution.',
      };
    }

    const checkPassword = (account: UserAccount) => {
      if (!account.password || !account.password.trim()) return true;
      if (!password || !password.trim()) return false;
      return account.password === password.trim();
    };

    // 1. Check specified school first if different from activeSchoolId
    if (targetSchoolId && targetSchoolId !== activeSchoolId) {
      const targetTenant = loadTenantData(targetSchoolId);
      const matchedInTarget = matchAccountInTenant(targetTenant, trimmed);
      if (matchedInTarget) {
        if (!checkPassword(matchedInTarget)) {
          return { success: false, message: 'Incorrect password for this account.' };
        }
        switchSchool(targetSchoolId);
        setCurrentUserState(matchedInTarget);
        setIsAuthenticated(true);
        setActiveModule(getLandingModuleForUser(matchedInTarget, targetTenant.school.levelType));
        return { success: true };
      }
      switchSchool(targetSchoolId);
    }

    // 2. Check active school
    const activeSnapshot = buildCurrentTenantSnapshot();
    const matchedInActive = matchAccountInTenant(activeSnapshot, trimmed);
    if (matchedInActive) {
      if (!checkPassword(matchedInActive)) {
        return { success: false, message: 'Incorrect password for this account.' };
      }
      if (!users.some((u) => u.id === matchedInActive.id)) {
        setUsers((prev) => [...prev, matchedInActive]);
      }
      setCurrentUserState(matchedInActive);
      setIsAuthenticated(true);
      setActiveModule(getLandingModuleForUser(matchedInActive, school.levelType));
      return { success: true };
    }

    // 3. Check other registered schools
    for (const otherSchool of schools) {
      if (otherSchool.id === activeSchoolId) continue;
      const otherTenant = loadTenantData(otherSchool.id);
      const matchedInOther = matchAccountInTenant(otherTenant, trimmed);
      if (matchedInOther) {
        if (!checkPassword(matchedInOther)) {
          return { success: false, message: 'Incorrect password for this account.' };
        }
        switchSchool(otherSchool.id);
        setCurrentUserState(matchedInOther);
        setIsAuthenticated(true);
        setActiveModule(getLandingModuleForUser(matchedInOther, otherTenant.school.levelType));
        return { success: true };
      }
    }

    return {
      success: false,
      message:
        'No matching portal account or Student / Candidate / Staff ID found. Please check your credentials or use Reset Password.',
    };
  };

  const hasPlatformOwnerPassword = Boolean(ownerSavedPassword && ownerSavedPassword.trim().length > 0);

  const resetAccountPassword = (params: {
    mode: 'owner' | 'portal';
    schoolId?: string;
    identifier: string;
    verificationInput?: string;
    newPassword: string;
    bypassVerification?: boolean;
  }): { success: boolean; message: string; updatedEmail?: string; updatedRoleLabel?: string } => {
    const cleanId = params.identifier.trim();
    const cleanNewPass = params.newPassword.trim();
    const verifRaw = (params.verificationInput || '').trim();

    if (!cleanId) {
      return {
        success: false,
        message: 'Please enter the account email address or Staff / Student / Candidate ID.',
      };
    }
    if (cleanNewPass.length < 6) {
      return {
        success: false,
        message: 'New password must be at least 6 characters long.',
      };
    }

    const extractDigits = (val?: string) => (val || '').replace(/\D/g, '');
    const matchesPhoneDigits = (entered: string, targetPhone?: string): boolean => {
      const enteredDigits = extractDigits(entered);
      const targetDigits = extractDigits(targetPhone);
      if (enteredDigits.length < 4 || targetDigits.length < 4) return false;
      return (
        targetDigits.endsWith(enteredDigits) ||
        enteredDigits.endsWith(targetDigits.slice(-9)) ||
        targetDigits === enteredDigits
      );
    };

    // 1. Platform Owner Password Reset Flow
    if (
      params.mode === 'owner' ||
      cleanId.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
    ) {
      if (cleanId.toLowerCase() !== BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
        return {
          success: false,
          message:
            'Only the authorised Platform Owner email address can reset the Platform Owner password. Switch to Staff/Lecturer/Admin or Student reset for institutional accounts.',
        };
      }

      const ownerPhone = platformOwnerProfile.whatsappNumber || '+233 207 615 941';
      const ownerNameLower = (platformOwnerProfile.name || 'Solomon Appeadu').trim().toLowerCase();
      const verifiedBySession = isPlatformAdmin;
      const verifiedByCurrentPass =
        Boolean(ownerSavedPassword && ownerSavedPassword.trim()) &&
        verifRaw === ownerSavedPassword.trim();
      const verifiedByOwnerPhone = matchesPhoneDigits(verifRaw, ownerPhone);
      const verifiedByOwnerName =
        !ownerSavedPassword && verifRaw.toLowerCase() === ownerNameLower;

      if (
        !verifiedBySession &&
        !verifiedByCurrentPass &&
        !verifiedByOwnerPhone &&
        !verifiedByOwnerName
      ) {
        return {
          success: false,
          message:
            'Verification did not match. Enter your current owner password or the last 4 digits of the registered Platform Owner WhatsApp number.',
        };
      }

      setOwnerSavedPassword(cleanNewPass);
      try {
        localStorage.setItem(PLATFORM_OWNER_PASSWORD_KEY, cleanNewPass);
      } catch {
        // Ignore storage errors
      }

      const ownerEmailLower = BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
      setUsers((prev) =>
        prev.map((u) =>
          u.email.toLowerCase() === ownerEmailLower ? { ...u, password: cleanNewPass } : u
        )
      );
      if (currentUser.email.toLowerCase() === ownerEmailLower) {
        setCurrentUserState((prev) => ({ ...prev, password: cleanNewPass }));
      }

      return {
        success: true,
        message: 'Platform Owner password has been reset. You can now sign in with your email and new password.',
        updatedEmail: BOOTSTRAPPED_ADMIN_EMAIL,
        updatedRoleLabel: 'Platform Owner',
      };
    }

    // 2. Institutional Portal Account Reset (Admins, Proprietors, Lecturers, Teachers, Staff, Students, Candidates)
    if (schools.length === 0) {
      return {
        success: false,
        message: 'No institutions are registered yet. Use Platform Owner reset for the owner account.',
      };
    }

    const searchOrderIds: string[] = [];
    if (params.schoolId && schools.some((s) => s.id === params.schoolId)) {
      searchOrderIds.push(params.schoolId);
    }
    if (activeSchoolId && !searchOrderIds.includes(activeSchoolId) && schools.some((s) => s.id === activeSchoolId)) {
      searchOrderIds.push(activeSchoolId);
    }
    for (const s of schools) {
      if (!searchOrderIds.includes(s.id)) {
        searchOrderIds.push(s.id);
      }
    }

    let foundSchoolId = '';
    let foundTenant: SchoolTenantData | null = null;
    let matchedAccount: UserAccount | null = null;

    for (const schId of searchOrderIds) {
      const tenantSnap = schId === activeSchoolId ? buildCurrentTenantSnapshot() : loadTenantData(schId);
      const acct = matchAccountInTenant(tenantSnap, cleanId);
      if (acct) {
        foundSchoolId = schId;
        foundTenant = tenantSnap;
        matchedAccount = acct;
        break;
      }
    }

    if (!matchedAccount || !foundTenant || !foundSchoolId) {
      return {
        success: false,
        message:
          'No Admin, Lecturer, Teacher, Staff, or Student account matched that email or ID. Verify your email or Staff/Student ID.',
      };
    }

    const adminAuthorized =
      Boolean(params.bypassVerification) &&
      (isPlatformAdmin ||
        (isAuthenticated &&
          (currentUser.role === 'proprietor' || currentUser.role === 'admin')));

    if (!adminAuthorized) {
      if (!verifRaw || verifRaw.length < 2) {
        return {
          success: false,
          message:
            'Please provide identity verification (current password, full name, Staff/Student ID, or registered phone digits).',
        };
      }

      const verifLower = verifRaw.toLowerCase();
      const matchedStaffRec = (foundTenant.staff || []).find(
        (st) =>
          st.email.trim().toLowerCase() === matchedAccount!.email.toLowerCase() ||
          `usr-stf-${st.id}` === matchedAccount!.id
      );
      const matchedStuRec = (foundTenant.students || []).find(
        (stu) => stu.id === matchedAccount!.studentId
      );
      const matchedCandRec = (foundTenant.candidates || []).find(
        (cand) => cand.id === matchedAccount!.candidateId
      );

      const matchesCurrentPassword =
        Boolean(matchedAccount.password) && verifRaw === matchedAccount.password;
      const matchesFullName =
        matchedAccount.name.trim().toLowerCase() === verifLower;
      const matchesStaffProof =
        Boolean(matchedStaffRec) &&
        (matchedStaffRec!.staffId.trim().toLowerCase() === verifLower ||
          matchedStaffRec!.ssnitNumber.trim().toLowerCase() === verifLower ||
          matchesPhoneDigits(verifRaw, matchedStaffRec!.phone));
      const matchesStudentProof =
        Boolean(matchedStuRec) &&
        (matchedStuRec!.studentNumber.trim().toLowerCase() === verifLower ||
          matchedStuRec!.guardianName.trim().toLowerCase() === verifLower ||
          matchesPhoneDigits(verifRaw, matchedStuRec!.guardianPhone));
      const matchesCandidateProof =
        Boolean(matchedCandRec) &&
        (matchedCandRec!.candidateNumber.trim().toLowerCase() === verifLower ||
          matchesPhoneDigits(verifRaw, matchedCandRec!.phone));
      const matchesAdminSchoolProof =
        (matchedAccount.role === 'proprietor' || matchedAccount.role === 'admin') &&
        (foundTenant.school.code.trim().toLowerCase() === verifLower ||
          foundTenant.school.headmasterName.trim().toLowerCase() === verifLower ||
          matchesPhoneDigits(verifRaw, foundTenant.school.phone) ||
          matchesPhoneDigits(verifRaw, foundTenant.school.whatsappNumber));

      if (
        !matchesCurrentPassword &&
        !matchesFullName &&
        !matchesStaffProof &&
        !matchesStudentProof &&
        !matchesCandidateProof &&
        !matchesAdminSchoolProof
      ) {
        return {
          success: false,
          message:
            'Verification failed. Enter your current password, exact registered full name, Staff/Student ID, or last 4 digits of your registered phone number.',
        };
      }
    }

    const updatedAccount: UserAccount = {
      ...matchedAccount,
      password: cleanNewPass,
    };

    if (foundSchoolId === activeSchoolId) {
      setUsers((prev) => {
        const exists = prev.some(
          (u) =>
            u.id === updatedAccount.id ||
            u.email.toLowerCase() === updatedAccount.email.toLowerCase()
        );
        if (exists) {
          return prev.map((u) =>
            u.id === updatedAccount.id ||
            u.email.toLowerCase() === updatedAccount.email.toLowerCase()
              ? updatedAccount
              : u
          );
        }
        return [updatedAccount, ...prev];
      });
      if (
        currentUser.id === updatedAccount.id ||
        currentUser.email.toLowerCase() === updatedAccount.email.toLowerCase()
      ) {
        setCurrentUserState(updatedAccount);
      }
    } else {
      const existsInOther = foundTenant.users.some(
        (u) =>
          u.id === updatedAccount.id ||
          u.email.toLowerCase() === updatedAccount.email.toLowerCase()
      );
      const nextOtherUsers = existsInOther
        ? foundTenant.users.map((u) =>
            u.id === updatedAccount.id ||
            u.email.toLowerCase() === updatedAccount.email.toLowerCase()
              ? updatedAccount
              : u
          )
        : [updatedAccount, ...foundTenant.users];
      try {
        localStorage.setItem(
          TENANT_STORAGE_PREFIX + foundSchoolId,
          JSON.stringify({ ...foundTenant, users: nextOtherUsers })
        );
      } catch (e) {
        console.error('Failed saving reset password to tenant storage', e);
      }
    }

    return {
      success: true,
      message: `Password reset complete for ${updatedAccount.name} (${foundTenant.school.name}). You may now sign in with your new password.`,
      updatedEmail: updatedAccount.email,
      updatedRoleLabel: updatedAccount.title || updatedAccount.role,
    };
  };

  const changeCurrentUserPassword = (
    currentPassword: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    const cleanNew = newPassword.trim();
    const cleanCurrent = currentPassword.trim();
    if (cleanNew.length < 6) {
      return {
        success: false,
        message: 'New password must be at least 6 characters long.',
      };
    }

    const isOwnerAccount =
      isPlatformAdmin &&
      (schools.length === 0 ||
        currentUser.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase());

    if (isOwnerAccount) {
      const isGoogleVerifiedOwner = Boolean(
        firebaseUser && firebaseUser.emailVerified && isBootstrappedAdminUser(firebaseUser)
      );
      if (
        ownerSavedPassword &&
        ownerSavedPassword.trim().length > 0 &&
        !isGoogleVerifiedOwner &&
        cleanCurrent !== ownerSavedPassword.trim()
      ) {
        return {
          success: false,
          message: 'Your current Platform Owner password is incorrect.',
        };
      }
      setOwnerSavedPassword(cleanNew);
      try {
        localStorage.setItem(PLATFORM_OWNER_PASSWORD_KEY, cleanNew);
      } catch {
        // Ignore storage errors
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
            ? { ...u, password: cleanNew }
            : u
        )
      );
      setCurrentUserState((prev) => ({ ...prev, password: cleanNew }));
      return {
        success: true,
        message: 'Platform Owner password updated.',
      };
    }

    if (
      currentUser.password &&
      currentUser.password.trim().length > 0 &&
      cleanCurrent !== currentUser.password.trim()
    ) {
      return {
        success: false,
        message: 'Your current password is incorrect.',
      };
    }

    const updatedCurrent: UserAccount = {
      ...currentUser,
      password: cleanNew,
    };

    setUsers((prev) => {
      const exists = prev.some(
        (u) =>
          u.id === updatedCurrent.id ||
          u.email.toLowerCase() === updatedCurrent.email.toLowerCase()
      );
      return exists
        ? prev.map((u) =>
            u.id === updatedCurrent.id ||
            u.email.toLowerCase() === updatedCurrent.email.toLowerCase()
              ? updatedCurrent
              : u
          )
        : [updatedCurrent, ...prev];
    });
    setCurrentUserState(updatedCurrent);

    return {
      success: true,
      message: 'Your account password has been updated.',
    };
  };

  const enterPortalAsPlatformOwner = (targetSchoolId?: string): boolean => {
    const fb = auth.currentUser || firebaseUser;
    const hasOwnerAccess =
      isOwnerEmailSession ||
      Boolean(fb && fb.email && fb.emailVerified && isBootstrappedAdminUser(fb));
    if (!hasOwnerAccess) {
      return false;
    }
    return activatePlatformOwnerAccountInSchool(targetSchoolId);
  };

  const signInWithGoogle = async (
    preferredMode: 'staff' | 'student' | 'owner' = 'staff',
    options?: { stayOnWebsite?: boolean }
  ): Promise<{ success: boolean; isPlatformAdmin?: boolean; message?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      if (!fbUser.email) {
        return { success: false, message: 'Google account did not return an email address.' };
      }

      const verifiedOwner = Boolean(fbUser.emailVerified && isBootstrappedAdminUser(fbUser));

      if (preferredMode === 'owner' && !verifiedOwner) {
        await signOut(auth).catch(() => {});
        return {
          success: false,
          isPlatformAdmin: false,
          message:
            'Access denied: Only the verified Platform Owner Google account is authorised for Platform Owner Sign-In. Please use Staff & Admin or Student & Candidate sign-in for institutional accounts.',
        };
      }

      if (verifiedOwner) {
        setIsOwnerEmailSession(true);
        try {
          localStorage.setItem(PLATFORM_OWNER_SESSION_KEY, BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase());
        } catch {
          // Ignore storage errors
        }
      }

      const emailLower = fbUser.email.toLowerCase();
      await syncAuthenticatedUserProfile(
        fbUser,
        activeSchoolId,
        preferredMode === 'student'
          ? 'Verified Student / Candidate'
          : verifiedOwner
          ? 'Platform Owner & Super Administrator'
          : 'Institutional Staff / Administrator'
      );

      if (schools.length === 0 || (verifiedOwner && options?.stayOnWebsite)) {
        if (verifiedOwner) {
          return { success: true, isPlatformAdmin: true };
        }
        return {
          success: false,
          isPlatformAdmin: false,
          message:
            'No schools or institutes are registered on this platform yet. Please message the Platform Owner on WhatsApp (+233 207 615 941) for onboarding.',
        };
      }

      // 1. Check active school for an existing user or candidate/student profile
      const activeSnapshot = buildCurrentTenantSnapshot();
      const matchedInActive = matchAccountInTenant(activeSnapshot, emailLower);
      if (matchedInActive) {
        const isOwnerStaffOrOwnerMode =
          verifiedOwner && (preferredMode === 'staff' || preferredMode === 'owner');
        const enriched: UserAccount = {
          ...matchedInActive,
          name: fbUser.displayName || matchedInActive.name,
          avatar: fbUser.photoURL || matchedInActive.avatar,
          role: isOwnerStaffOrOwnerMode ? 'proprietor' : matchedInActive.role,
          title: isOwnerStaffOrOwnerMode
            ? 'Platform Owner & Super Administrator'
            : matchedInActive.title,
        };
        setUsers((prev) =>
          prev.some((u) => u.id === enriched.id)
            ? prev.map((u) => (u.id === enriched.id ? enriched : u))
            : [enriched, ...prev]
        );
        setCurrentUserState(enriched);
        setIsAuthenticated(true);
        setActiveModule(getLandingModuleForUser(enriched, school.levelType));
        return { success: true, isPlatformAdmin: verifiedOwner };
      }

      // 2. Check other schools for an existing account
      if (!verifiedOwner) {
        for (const otherSchool of schools) {
          if (otherSchool.id === activeSchoolId) continue;
          const otherTenant = loadTenantData(otherSchool.id);
          const matchedInOther = matchAccountInTenant(otherTenant, emailLower);
          if (matchedInOther) {
            switchSchool(otherSchool.id);
            const enriched: UserAccount = {
              ...matchedInOther,
              name: fbUser.displayName || matchedInOther.name,
              avatar: fbUser.photoURL || matchedInOther.avatar,
            };
            setCurrentUserState(enriched);
            setIsAuthenticated(true);
            setActiveModule(getLandingModuleForUser(enriched, otherTenant.school.levelType));
            return { success: true, isPlatformAdmin: false };
          }
        }
      }

      // 3. Provision or sign in with Google identity in active school
      const displayName =
        fbUser.displayName ||
        emailLower.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const assignedRole: RoleType =
        preferredMode === 'student'
          ? 'student'
          : verifiedOwner
          ? 'proprietor'
          : 'admin';

      const newGoogleAccount: UserAccount = {
        id: fbUser.uid,
        name: displayName,
        email: emailLower,
        role: assignedRole,
        title:
          assignedRole === 'proprietor'
            ? 'Platform Owner & Super Administrator'
            : assignedRole === 'student'
            ? 'Student / Candidate'
            : 'School Administrator',
        avatar:
          fbUser.photoURL ||
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        schoolId: activeSchoolId,
        signatureDataUrl: makeCalligraphicSignatureSvg(displayName),
        signatureMethod: 'drawn',
      };

      setUsers((prev) =>
        prev.some((u) => u.id === newGoogleAccount.id || u.email.toLowerCase() === emailLower)
          ? prev.map((u) =>
              u.id === newGoogleAccount.id || u.email.toLowerCase() === emailLower ? newGoogleAccount : u
            )
          : [newGoogleAccount, ...prev]
      );

      setCurrentUserState(newGoogleAccount);
      setIsAuthenticated(true);
      setActiveModule(getLandingModuleForUser(newGoogleAccount, school.levelType));
      return { success: true, isPlatformAdmin: verifiedOwner };
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        return { success: false, message: 'Google sign-in popup was closed before completing authentication.' };
      }
      if (code === 'auth/popup-blocked') {
        return { success: false, message: 'Popup was blocked by your browser. Please allow popups for this site and try again.' };
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Google authentication failed. Please try again.',
      };
    }
  };

  const logout = () => {
    signOut(auth).catch((err) => console.error('Firebase sign-out error:', err));
    setIsOwnerEmailSession(false);
    try {
      localStorage.removeItem(PLATFORM_OWNER_SESSION_KEY);
    } catch {
      // Ignore storage errors
    }
    setIsAuthenticated(false);
  };

  // ============================================================================
  // EXISTING SCHOOL CRUD OPERATIONS
  // ============================================================================

  const FEATURE_REQUESTS_KEY = 'edudigital_feature_requests_v1';
  const LEGACY_FEATURE_REQUESTS_KEY = 'edughana_feature_requests_v1';
  const [customFeatureRequests, setCustomFeatureRequests] = useState<CustomFeatureRequest[]>(() => {
    try {
      const stored =
        localStorage.getItem(FEATURE_REQUESTS_KEY) ??
        localStorage.getItem(LEGACY_FEATURE_REQUESTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (r: CustomFeatureRequest) => r && r.schoolId && !isRemovedSampleSchoolId(r.schoolId)
          );
          localStorage.setItem(FEATURE_REQUESTS_KEY, JSON.stringify(cleaned));
          return cleaned;
        }
      }
    } catch (e) {
      console.error('Error loading custom feature requests', e);
    }
    return INITIAL_CUSTOM_REQUESTS;
  });

  const isModuleEnabled = (moduleId: string): boolean => {
    if (school.enabledModules && Array.isArray(school.enabledModules)) {
      return school.enabledModules.includes(moduleId);
    }
    const defaultModules = getDefaultModulesForSchool(school.id);
    return defaultModules.includes(moduleId);
  };

  const toggleSchoolModule = (moduleId: string) => {
    const currentList =
      school.enabledModules && Array.isArray(school.enabledModules)
        ? [...school.enabledModules]
        : getDefaultModulesForSchool(school.id);

    const isCurrentlyOn = currentList.includes(moduleId);
    const updatedList = isCurrentlyOn
      ? currentList.filter((id) => id !== moduleId)
      : [...currentList, moduleId];

    updateSchoolProfile({ enabledModules: updatedList });
  };

  const requestCustomFeature = (req: {
    title: string;
    category: string;
    description: string;
    urgency?: 'Standard' | 'Priority' | 'Critical Bespoke';
  }) => {
    const newReq: CustomFeatureRequest = {
      id: `cfr-${Date.now()}`,
      schoolId: school.id,
      schoolName: school.name,
      title: req.title,
      category: req.category,
      description: req.description,
      urgency: req.urgency || 'Standard',
      requestedBy: currentUser.name || 'School Administrator',
      requestedAt: new Date().toISOString().split('T')[0],
      status: 'Under Review',
    };
    setCustomFeatureRequests((prev) => {
      const updated = [newReq, ...prev];
      localStorage.setItem(FEATURE_REQUESTS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const resolveTeacherDisplayName = (teacherId?: string, fallbackName?: string): string => {
    if (!teacherId && fallbackName) return fallbackName;
    if (!teacherId) return fallbackName || 'Unassigned';
    const matchedStaff = staff.find((s) => s.id === teacherId || s.staffId === teacherId);
    if (matchedStaff) return matchedStaff.fullName;
    const matchedUser = users.find((u) => u.id === teacherId);
    if (matchedUser) return matchedUser.name;
    return fallbackName || 'Unassigned';
  };

  const addStudent = (data: any): Student => {
    const nextNum = students.length + 1;
    const prefix = school.code.split('-')[0] || 'STU';
    const yearToken = (data.academicYear || school.currentAcademicYear || '2025').match(/\d{4}/)?.[0] || '2025';
    const studentNumber = `${prefix}-${yearToken}-${String(nextNum).padStart(4, '0')}`;
    const resolvedPhoto =
      typeof data.photo === 'string' && data.photo.trim().length > 0
        ? data.photo.trim()
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

    const { _resolvedClassRoom, ...cleanStudentPayload } = data;
    const targetCls: ClassRoom | undefined =
      _resolvedClassRoom || classes.find((c) => c.id === cleanStudentPayload.classId);
    const targetGrade = gradeClasses.find(
      (g) => g.id === (cleanStudentPayload.gradeId || targetCls?.gradeId)
    );
    const targetSection = educationalSections.find(
      (s) => s.id === (cleanStudentPayload.sectionId || targetGrade?.sectionId || targetCls?.sectionId)
    );
    const resolvedAcademicYear =
      cleanStudentPayload.academicYear || school.currentAcademicYear || '2025/2026';
    const resolvedStream = cleanStudentPayload.stream || targetCls?.stream || 'A';
    const resolvedProgramme = cleanStudentPayload.programme || targetCls?.programme;
    const resolvedTeacherId = cleanStudentPayload.classTeacherId || targetCls?.formTutorTeacherId;
    const resolvedTeacherName = resolveTeacherDisplayName(
      resolvedTeacherId,
      cleanStudentPayload.classTeacherName || targetCls?.classTeacherName
    );
    const todayDate = new Date().toISOString().split('T')[0];

    const initialHistory: StudentPlacementHistoryEntry[] =
      Array.isArray(cleanStudentPayload.placementHistory) && cleanStudentPayload.placementHistory.length > 0
        ? cleanStudentPayload.placementHistory
        : targetCls
        ? [
            {
              id: `plh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              academicYear: resolvedAcademicYear,
              term: school.currentTerm,
              newSectionId: targetSection?.id,
              newSectionName: targetSection?.name || targetCls.sectionName || targetCls.level,
              newGradeId: targetGrade?.id,
              newGradeName: targetGrade?.name || targetCls.gradeName || targetCls.name,
              newClassId: targetCls.id,
              newClassName: targetCls.name,
              newStream: resolvedStream,
              programme: resolvedProgramme,
              classTeacherName: resolvedTeacherName,
              changeType: 'Initial Enrolment',
              reason: 'Official admission and initial class/stream placement.',
              changedBy: currentUser.name || 'Admissions Officer',
              changedAt: todayDate,
            },
          ]
        : [];

    const newStudent: Student = {
      id: `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentNumber,
      status: 'Active',
      admissionDate: todayDate,
      ...cleanStudentPayload,
      dob: (cleanStudentPayload.dob || '2012-01-01').trim(),
      guardianName: (cleanStudentPayload.guardianName || 'Parent / Guardian').trim(),
      guardianPhone: (cleanStudentPayload.guardianPhone || school.phone || '0000000000').trim(),
      academicYear: resolvedAcademicYear,
      sectionId: targetSection?.id || cleanStudentPayload.sectionId,
      sectionName: targetSection?.name || cleanStudentPayload.sectionName,
      gradeId: targetGrade?.id || cleanStudentPayload.gradeId,
      gradeName: targetGrade?.name || cleanStudentPayload.gradeName,
      stream: resolvedStream,
      programme: resolvedProgramme,
      classTeacherId: resolvedTeacherId,
      classTeacherName: resolvedTeacherName,
      placementHistory: initialHistory,
      photo: resolvedPhoto,
    };
    setStudents((prev) => [newStudent, ...prev]);

    // Automatically provision Student portal account linked to assigned class & stream
    const cleanFirst = newStudent.firstName.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'student';
    const cleanLast = newStudent.lastName.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'learner';
    const cleanDomain = prefix.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'school';
    const baseEmail = `${cleanFirst}.${cleanLast}@student.${cleanDomain}.edu.gh`;
    const stuEmail = users.some((u) => u.email.toLowerCase() === baseEmail)
      ? `${cleanFirst}.${cleanLast}${nextNum}@student.${cleanDomain}.edu.gh`
      : baseEmail;
    addUserAccount({
      name: `${newStudent.firstName} ${newStudent.lastName}`,
      email: stuEmail,
      password: 'student123',
      role: 'student',
      title: `Student (${studentNumber})`,
      avatar: newStudent.photo,
      studentId: newStudent.id,
      assignedClassId: newStudent.classId,
    });

    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(upsertStudentInCloud(activeSchoolId, ownerUid, newStudent, stuEmail));
    }

    return newStudent;
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, ...data };
        if (canWriteSchoolAdminInCloud(activeSchoolId)) {
          const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
          runCloudTask(upsertStudentInCloud(activeSchoolId, ownerUid, updated));
        }
        return updated;
      })
    );
    if (data.classId) {
      setUsers((prev) =>
        prev.map((u) => (u.studentId === id ? { ...u, assignedClassId: data.classId } : u))
      );
      setCurrentUserState((prev) =>
        prev.studentId === id ? { ...prev, assignedClassId: data.classId } : prev
      );
    }
    if (data.photo && data.photo.trim()) {
      const nextAvatar = data.photo.trim();
      setUsers((prev) =>
        prev.map((u) => (u.studentId === id ? { ...u, avatar: nextAvatar } : u))
      );
      setCurrentUserState((prev) => (prev.studentId === id ? { ...prev, avatar: nextAvatar } : prev));
    }
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setExamResults((prev) => prev.filter((r) => r.studentId !== id));
    setAttendance((prev) => prev.filter((a) => a.studentId !== id));
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      runCloudTask(deleteStudentInCloud(activeSchoolId, id));
    }
  };

  const deleteStaff = (id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
    setStaffAttendance((prev) => prev.filter((a) => a.staffId !== id));
  };

  const deleteAdmission = (id: string) => {
    setAdmissions((prev) => prev.filter((a) => a.id !== id));
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const deleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const deleteBook = (id: string) => {
    setLibraryBooks((prev) => prev.filter((b) => b.id !== id));
    setBookLoans((prev) => prev.filter((l) => l.bookId !== id));
  };

  const addAdmission = (data: any) => {
    const nextNum = admissions.length + 1;
    const prefix = school.code.split('-')[0] || 'APP';
    const hasUploadedPhoto = typeof data.photo === 'string' && data.photo.trim().length > 0;
    const isAdminActor = ['proprietor', 'admin'].includes(currentUser.role);
    const docs = Array.isArray(data.documentsUploaded) && data.documentsUploaded.length > 0
      ? data.documentsUploaded
      : hasUploadedPhoto
      ? ['Passport_Photograph.jpg', 'BECE_Result_Slip.pdf', 'Birth_Certificate.pdf']
      : ['BECE_Result_Slip.pdf', 'Birth_Certificate.pdf'];
    const newApp: AdmissionApplication = {
      id: `adm-${Date.now()}`,
      applicationNumber: `${prefix}-APP-2026-${String(nextNum).padStart(3, '0')}`,
      status: 'Pending',
      submittedDate: new Date().toISOString().split('T')[0],
      documentsUploaded: docs,
      photoApprovalStatus: hasUploadedPhoto ? (isAdminActor ? 'Approved' : 'Pending Review') : undefined,
      ...data,
    };
    setAdmissions((prev) => [newApp, ...prev]);
  };

  const updateAdmissionStatus = (id: string, status: AdmissionApplication['status']) => {
    setAdmissions((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const reviewAdmissionPhoto = (
    admissionId: string,
    status: 'Approved' | 'Revision Requested',
    reviewNote?: string,
    updatedPhotoUrl?: string
  ) => {
    const today = getTodayIsoDate();
    setAdmissions((prev) =>
      prev.map((a) =>
        a.id === admissionId
          ? {
              ...a,
              photo: updatedPhotoUrl || a.photo,
              photoApprovalStatus: status,
              photoReviewNote: reviewNote || (status === 'Approved' ? 'Passport photograph verified for admission records.' : 'Please upload a clearer passport-sized photograph on a plain background.'),
              photoReviewedBy: currentUser.name,
              photoReviewedAt: today,
            }
          : a
      )
    );
  };

  const recordAttendance = (classId: string, date: string, studentStatuses: Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'>) => {
    const remaining = attendance.filter((a) => !(a.classId === classId && a.date === date));
    const newRecords: AttendanceRecord[] = Object.entries(studentStatuses).map(([stuId, status]) => ({
      id: `att-${Date.now()}-${stuId}`,
      date,
      classId,
      studentId: stuId,
      status,
      recordedByTeacherId: currentUser.id,
    }));
    setAttendance([...remaining, ...newRecords]);
  };

  const saveExamResult = (resultData: Partial<ExamResult> & { studentId: string; subjectId: string; classId: string; classScore: number; examScore: number }) => {
    const total = Math.min(100, Math.max(0, resultData.classScore + resultData.examScore));
    const gradeDetails = calculateWassceGrade(total);
    let savedRes: ExamResult | null = null;

    setExamResults((prev) => {
      const existingIndex = prev.findIndex(
        (r) =>
          r.studentId === resultData.studentId &&
          r.subjectId === resultData.subjectId &&
          r.term === (resultData.term || school.currentTerm) &&
          r.academicYear === (resultData.academicYear || school.currentAcademicYear)
      );

      const updatedRecord: ExamResult = {
        id: existingIndex >= 0 ? prev[existingIndex].id : `res-${Date.now()}`,
        studentId: resultData.studentId,
        classId: resultData.classId,
        subjectId: resultData.subjectId,
        term: resultData.term || school.currentTerm,
        academicYear: resultData.academicYear || school.currentAcademicYear,
        classScore: resultData.classScore,
        examScore: resultData.examScore,
        totalScore: total,
        grade: gradeDetails.grade,
        remarks: gradeDetails.interpretation,
        verified: resultData.verified ?? false,
        published: resultData.published ?? false,
      };
      savedRes = updatedRecord;

      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = updatedRecord;
        return copy;
      }
      return [...prev, updatedRecord];
    });

    if (savedRes && canWriteSchoolAdminInCloud(activeSchoolId)) {
      const rec = savedRes as ExamResult;
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      const stu = students.find((s) => s.id === rec.studentId);
      const stuAccount = users.find((u) => u.studentId === rec.studentId);
      runCloudTask(
        (async () => {
          if (stu) await upsertStudentInCloud(activeSchoolId, ownerUid, stu, stuAccount?.email);
          await upsertExamResultInCloud(
            activeSchoolId,
            ownerUid,
            rec,
            stuAccount?.email || 'student@school.edu.gh'
          );
        })()
      );
    }
  };

  const publishResults = (classId: string) => {
    setExamResults((prev) =>
      prev.map((r) => {
        if (r.classId === classId && r.term === school.currentTerm && r.academicYear === school.currentAcademicYear) {
          const publishedRec = { ...r, verified: true, published: true };
          if (canWriteSchoolAdminInCloud(activeSchoolId)) {
            const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
            const stuAccount = users.find((u) => u.studentId === r.studentId);
            runCloudTask(
              upsertExamResultInCloud(
                activeSchoolId,
                ownerUid,
                publishedRec,
                stuAccount?.email || 'student@school.edu.gh'
              )
            );
          }
          return publishedRec;
        }
        return r;
      })
    );
  };

  const recordFeePayment = (paymentData: Omit<FeePayment, 'id' | 'receiptNumber' | 'date'>): FeePayment => {
    const nextReceiptNum = feePayments.length + 1;
    const prefix = school.code.split('-')[0] || 'RCP';
    const receiptNumber = `${prefix}-RCP-2025-${String(nextReceiptNum).padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newPayment: FeePayment = {
      id: `pay-${Date.now()}`,
      receiptNumber,
      date: today,
      ...paymentData,
    };

    setFeePayments((prev) => [newPayment, ...prev]);

    // Also update linked candidate fee balance if applicable
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.studentId === paymentData.studentId || c.id === paymentData.studentId) {
          const updatedCand = { ...c, totalFeesPaid: c.totalFeesPaid + paymentData.amountPaid };
          if (canWriteSchoolAdminInCloud(activeSchoolId)) {
            const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
            runCloudTask(upsertCandidateInCloud(activeSchoolId, ownerUid, updatedCand));
          }
          return updatedCand;
        }
        return c;
      })
    );

    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      const stuAccount = users.find((u) => u.studentId === newPayment.studentId || u.candidateId === newPayment.studentId);
      const cand = candidates.find((c) => c.id === newPayment.studentId || c.studentId === newPayment.studentId);
      runCloudTask(
        createFeePaymentInCloud(
          activeSchoolId,
          ownerUid,
          newPayment,
          cand?.email || stuAccount?.email || 'student@school.edu.gh'
        )
      );
    }

    const newTxn: SchoolTransaction = {
      id: `txn-${Date.now()}`,
      type: 'Income',
      category: 'School Fees',
      amount: newPayment.amountPaid,
      date: today,
      reference: newPayment.transactionRef || receiptNumber,
      description: `Fees received from ${newPayment.payerName} (${newPayment.paymentMethod})`,
      approvedBy: currentUser.name,
    };
    setTransactions((prev) => [newTxn, ...prev]);

    return newPayment;
  };

  const recordTransaction = (txn: Omit<SchoolTransaction, 'id' | 'date'>) => {
    setTransactions((prev) => [
      { id: `txn-${Date.now()}`, date: new Date().toISOString().split('T')[0], ...txn },
      ...prev,
    ]);
  };

  const addStaff = (
    data: Omit<StaffMember, 'id' | 'staffId'>,
    portalOptions?: { password?: string; portalRole?: RoleType }
  ) => {
    const nextId = staff.length + 1;
    const prefix = school.code.split('-')[0] || 'STF';
    const generatedStaffId = `${prefix}-STF-${String(nextId).padStart(3, '0')}`;
    const newStaffMember: StaffMember = {
      id: `stf-${Date.now()}`,
      staffId: generatedStaffId,
      ...data,
    };
    setStaff((prev) => [newStaffMember, ...prev]);

    // Automatically create a portal login account so Lecturers, Teachers, and Staff can sign in & reset passwords
    const cleanEmail = (data.email || '').trim().toLowerCase();
    if (cleanEmail && !users.some((u) => u.email.trim().toLowerCase() === cleanEmail)) {
      addUserAccount({
        name: data.fullName,
        email: cleanEmail,
        password: portalOptions?.password?.trim() || 'staff123',
        role: portalOptions?.portalRole || inferPortalRoleFromStaffTitle(data.role),
        title: `${data.role} (${generatedStaffId})`,
        avatar:
          data.photo ||
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      });
    }
  };

  const updateStaff = (id: string, data: Partial<StaffMember>) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  // ============================================================================
  // CUSTOM SCHOOL COURSES / PROGRAMMES & SUBJECTS MANAGEMENT
  // ============================================================================

  const courseTracks: SchoolCourseTrack[] = React.useMemo(() => {
    const excludedSet = new Set(
      (school.excludedDefaultCourseNames || []).map((n) => n.trim().toLowerCase())
    );
    const customList = (school.customCourseTracks || []).map((c) => ({
      ...c,
      isCustom: true,
    }));

    const seenNames = new Set(customList.map((c) => c.name.trim().toLowerCase()));
    const combined: SchoolCourseTrack[] = [...customList];

    // Include multi-level programmes registered in the school/institute
    for (const prog of programmes) {
      const key = prog.title.trim().toLowerCase();
      if (!seenNames.has(key) && !excludedSet.has(key)) {
        seenNames.add(key);
        combined.push({
          id: `prog-trk-${prog.id}`,
          code: prog.code,
          name: prog.title,
          department: prog.category,
          category: 'Certificate / Diploma',
          duration: prog.durationLabel,
          description: prog.qualificationAwarded,
          isCustom: true,
        });
      }
    }

    // Append non-excluded automatic default courses/programmes for this school's levelType
    for (const defTrack of getDefaultCourseTracksForLevelType(school.levelType)) {
      const key = defTrack.name.trim().toLowerCase();
      if (!seenNames.has(key) && !excludedSet.has(key)) {
        seenNames.add(key);
        combined.push(defTrack);
      }
    }

    return combined;
  }, [school.customCourseTracks, school.excludedDefaultCourseNames, school.levelType, programmes]);

  const addCourseTrack = (course: Omit<SchoolCourseTrack, 'id' | 'isCustom'>): SchoolCourseTrack => {
    const prefix = (school.code || 'SCH').split('-')[0].toUpperCase();
    const existingCustom = school.customCourseTracks || [];
    const newTrack: SchoolCourseTrack = {
      ...course,
      code:
        course.code?.trim().toUpperCase() ||
        `${prefix}-CRS-${String(existingCustom.length + 1).padStart(2, '0')}`,
      name: course.name.trim(),
      department: course.department?.trim() || 'Academic Programmes',
      id: `trk-${activeSchoolId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      isCustom: true,
    };

    const nextExcluded = (school.excludedDefaultCourseNames || []).filter(
      (n) => n.trim().toLowerCase() !== newTrack.name.toLowerCase()
    );

    updateSchoolProfile({
      customCourseTracks: [newTrack, ...existingCustom],
      excludedDefaultCourseNames: nextExcluded,
      customCurriculumInitialized: true,
    });
    return newTrack;
  };

  const addCourseTracksBulk = (
    courseNames: string[],
    defaultDepartment = 'Academic Programmes',
    defaultCategory: SchoolCourseTrack['category'] = 'Custom Course'
  ): SchoolCourseTrack[] => {
    const prefix = (school.code || 'SCH').split('-')[0].toUpperCase();
    const existingCustom = school.customCourseTracks || [];
    const existingNames = new Set(existingCustom.map((c) => c.name.trim().toLowerCase()));
    const created: SchoolCourseTrack[] = [];

    courseNames.forEach((raw, idx) => {
      const clean = raw.trim();
      if (!clean || existingNames.has(clean.toLowerCase())) return;
      existingNames.add(clean.toLowerCase());
      created.push({
        id: `trk-${activeSchoolId}-${Date.now()}-${idx}`,
        code: `${prefix}-CRS-${String(existingCustom.length + created.length + 1).padStart(2, '0')}`,
        name: clean,
        department: defaultDepartment,
        category: defaultCategory,
        duration: isInstituteLevelType(school.levelType) ? 'Institutional Schedule' : 'Full Academic Cycle',
        description: `Custom course offered by ${school.name}.`,
        isCustom: true,
      });
    });

    if (created.length > 0) {
      updateSchoolProfile({
        customCourseTracks: [...created, ...existingCustom],
        customCurriculumInitialized: true,
      });
    }
    return created;
  };

  const updateCourseTrack = (id: string, updates: Partial<SchoolCourseTrack>) => {
    const existingCustom = school.customCourseTracks || [];
    const inCustom = existingCustom.some((c) => c.id === id);
    if (inCustom) {
      updateSchoolProfile({
        customCourseTracks: existingCustom.map((c) => (c.id === id ? { ...c, ...updates, isCustom: true } : c)),
        customCurriculumInitialized: true,
      });
      return;
    }

    // If editing an automatic default course track, promote it to a customized school course track
    const autoTarget = getDefaultCourseTracksForLevelType(school.levelType).find((d) => d.id === id);
    if (autoTarget) {
      const promoted: SchoolCourseTrack = {
        ...autoTarget,
        ...updates,
        id: `trk-cust-${Date.now()}`,
        isCustom: true,
      };
      const prevExcluded = school.excludedDefaultCourseNames || [];
      updateSchoolProfile({
        customCourseTracks: [promoted, ...existingCustom],
        excludedDefaultCourseNames: Array.from(new Set([...prevExcluded, autoTarget.name])),
        customCurriculumInitialized: true,
      });
    }
  };

  const deleteCourseTrack = (idOrName: string) => {
    const existingCustom = school.customCourseTracks || [];
    const matchedCustom = existingCustom.find(
      (c) => c.id === idOrName || c.name.trim().toLowerCase() === idOrName.trim().toLowerCase()
    );
    if (matchedCustom) {
      updateSchoolProfile({
        customCourseTracks: existingCustom.filter((c) => c.id !== matchedCustom.id),
        customCurriculumInitialized: true,
      });
      return;
    }

    const autoTarget = getDefaultCourseTracksForLevelType(school.levelType).find(
      (d) => d.id === idOrName || d.name.trim().toLowerCase() === idOrName.trim().toLowerCase()
    );
    if (autoTarget) {
      const prevExcluded = school.excludedDefaultCourseNames || [];
      updateSchoolProfile({
        excludedDefaultCourseNames: Array.from(new Set([...prevExcluded, autoTarget.name])),
        customCurriculumInitialized: true,
      });
    }
  };

  const clearAutoCourseTracks = () => {
    const allDefaults = getDefaultCourseTracksForLevelType(school.levelType).map((d) => d.name);
    updateSchoolProfile({
      excludedDefaultCourseNames: allDefaults,
      customCurriculumInitialized: true,
    });
  };

  const restoreDefaultCourseTracks = () => {
    updateSchoolProfile({
      excludedDefaultCourseNames: [],
    });
  };

  const addSubject = (subject: Omit<Subject, 'id' | 'isCustom'>): Subject => {
    const prefix = (school.code || 'SUB').split('-')[0].toUpperCase();
    const newSub: Subject = {
      ...subject,
      id: `sbj-${activeSchoolId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code:
        subject.code?.trim().toUpperCase() ||
        `${prefix}-${String(subjects.length + 101)}`,
      name: subject.name.trim(),
      department: subject.department?.trim() || 'General Academics',
      isCustom: true,
    };
    setSubjects((prev) => [newSub, ...prev]);
    if (!school.customCurriculumInitialized) {
      updateSchoolProfile({ customCurriculumInitialized: true });
    }
    return newSub;
  };

  const addSubjectsBulk = (
    subjectNames: string[],
    options?: {
      category?: 'Core' | 'Elective';
      level?: Subject['level'];
      department?: string;
      programme?: string;
    }
  ): Subject[] => {
    const prefix = (school.code || 'SUB').split('-')[0].toUpperCase();
    const existingLower = new Set(subjects.map((s) => s.name.trim().toLowerCase()));
    const defaultLevel: Subject['level'] =
      options?.level ||
      (isInstituteLevelType(school.levelType)
        ? 'Tertiary / Institute'
        : school.levelType === 'Basic & JHS'
        ? 'JHS'
        : 'SHS');

    const created: Subject[] = [];
    subjectNames.forEach((raw, idx) => {
      const clean = raw.trim();
      if (!clean || existingLower.has(clean.toLowerCase())) return;
      existingLower.add(clean.toLowerCase());
      created.push({
        id: `sbj-${activeSchoolId}-${Date.now()}-${idx}`,
        code: `${prefix}-${String(subjects.length + created.length + 101)}`,
        name: clean,
        category: options?.category || 'Core',
        level: defaultLevel,
        department: options?.department || 'Custom School Curriculum',
        programme: options?.programme,
        isCustom: true,
      });
    });

    if (created.length > 0) {
      setSubjects((prev) => [...created, ...prev]);
      if (!school.customCurriculumInitialized) {
        updateSchoolProfile({ customCurriculumInitialized: true });
      }
    }
    return created;
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    if (!school.customCurriculumInitialized) {
      updateSchoolProfile({ customCurriculumInitialized: true });
    }
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setTimetable((prev) => prev.filter((t) => t.subjectId !== id));
    if (!school.customCurriculumInitialized) {
      updateSchoolProfile({ customCurriculumInitialized: true });
    }
  };

  const clearAutoSubjects = () => {
    setSubjects((prev) => prev.filter((s) => Boolean(s.isCustom)));
    updateSchoolProfile({ customCurriculumInitialized: true });
  };

  const restoreDefaultSubjects = () => {
    setSubjects((prev) => {
      const existingLower = new Set(prev.map((s) => s.name.trim().toLowerCase()));
      const missingDefaults = INITIAL_SUBJECTS.filter(
        (def) => !existingLower.has(def.name.trim().toLowerCase())
      );
      return [...prev, ...missingDefaults];
    });
  };

  const addTimetablePeriod = (period: Omit<TimetablePeriod, 'id'>): TimetablePeriod => {
    const newPeriod: TimetablePeriod = {
      ...period,
      id: `tt-${activeSchoolId}-${Date.now()}`,
    };
    setTimetable((prev) => [...prev, newPeriod]);
    return newPeriod;
  };

  const deleteTimetablePeriod = (id: string) => {
    setTimetable((prev) => prev.filter((t) => t.id !== id));
  };

  // ============================================================================
  // CLASS, GRADE, STREAM & EDUCATIONAL SECTION MANAGEMENT + PLACEMENT & PROMOTION
  // ============================================================================

  const applyOfferedSectionsPreset = (
    presetId: string,
    options?: { generateDefaultStreams?: boolean }
  ) => {
    const preset = GHANA_EDUCATIONAL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const allowedSections = new Set(preset.sectionIds);
    const allowedGradeCodes = preset.gradeCodes ? new Set(preset.gradeCodes) : null;

    const nextSections = educationalSections.map((sec) =>
      sec.isCustom ? sec : { ...sec, active: allowedSections.has(sec.id) }
    );

    const nextGrades = gradeClasses.map((grd) => {
      if (grd.isCustom) return grd;
      const inActiveSection = allowedSections.has(grd.sectionId);
      const inAllowedGrade = allowedGradeCodes ? allowedGradeCodes.has(grd.canonicalCode) : true;
      return {
        ...grd,
        active: inActiveSection && inAllowedGrade,
      };
    });

    setEducationalSections(nextSections);
    setGradeClasses(nextGrades);

    const activeGradeIds = new Set(nextGrades.filter((g) => g.active).map((g) => g.id));

    setClasses((prev) => {
      // Keep classes with enrolled students active, deactivate unused streams outside selected sections, and optionally generate missing default streams
      const updatedExisting = prev.map((cls) => {
        const hasStudents = students.some((s) => s.classId === cls.id && s.status === 'Active');
        if (hasStudents) return { ...cls, active: true };
        return {
          ...cls,
          active: cls.gradeId ? activeGradeIds.has(cls.gradeId) : cls.active ?? true,
        };
      });

      if (options?.generateDefaultStreams !== false) {
        const existingGradeIdsWithStreams = new Set(
          updatedExisting.filter((c) => c.active !== false).map((c) => c.gradeId)
        );
        const missingGrades = nextGrades.filter(
          (g) => g.active && !existingGradeIdsWithStreams.has(g.id)
        );
        if (missingGrades.length > 0) {
          const defaultTeacher = staff[0]?.id || currentUser.id;
          const defaultTeacherName = staff[0]?.fullName || currentUser.name;
          const generated = buildDefaultStreamsForActiveGrades(
            activeSchoolId,
            nextSections,
            missingGrades,
            defaultTeacher,
            defaultTeacherName
          );
          return [...updatedExisting, ...generated];
        }
      }

      return updatedExisting;
    });

    updateSchoolProfile({ offeredSectionIds: preset.sectionIds });
  };

  const addEducationalSection = (data: {
    name: string;
    shortName?: string;
    code?: string;
    isShs?: boolean;
    description?: string;
  }): EducationalSection => {
    const cleanName = data.name.trim();
    const maxOrder = educationalSections.reduce((m, s) => Math.max(m, s.order), 0);
    const created: EducationalSection = {
      id: `sec-cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code:
        data.code?.trim().toUpperCase() ||
        cleanName.toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 20),
      name: cleanName,
      shortName: data.shortName?.trim() || cleanName,
      order: maxOrder + 1,
      active: true,
      isShs: Boolean(data.isShs),
      isCustom: true,
      description: data.description?.trim() || 'Custom institutional educational section',
    };
    setEducationalSections((prev) => [...prev, created]);
    return created;
  };

  const updateEducationalSection = (
    sectionId: string,
    updates: Partial<EducationalSection>,
    options?: { cascadeToGrades?: boolean }
  ) => {
    setEducationalSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, ...updates } : s))
    );
    if (updates.name) {
      const nextSecName = updates.name.trim();
      setClasses((prev) =>
        prev.map((c) => (c.sectionId === sectionId ? { ...c, sectionName: nextSecName } : c))
      );
      setStudents((prev) =>
        prev.map((st) => (st.sectionId === sectionId ? { ...st, sectionName: nextSecName } : st))
      );
    }
    if (typeof updates.active === 'boolean' && options?.cascadeToGrades !== false) {
      const nextActive = updates.active;
      const nextSections = educationalSections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s
      );
      const nextGrades = gradeClasses.map((g) =>
        g.sectionId === sectionId ? { ...g, active: nextActive } : g
      );
      setGradeClasses(nextGrades);
      if (!nextActive) {
        setClasses((prev) =>
          prev.map((c) => {
            if (c.sectionId !== sectionId) return c;
            const hasActiveStudents = students.some((st) => st.classId === c.id && st.status === 'Active');
            return hasActiveStudents ? c : { ...c, active: false };
          })
        );
      } else {
        const defaultTeacherId = staff[0]?.id || currentUser.id;
        const defaultTeacherName = resolveTeacherDisplayName(defaultTeacherId);
        setClasses((prev) =>
          ensureStreamsForActiveGrades(
            activeSchoolId,
            nextSections,
            nextGrades,
            prev,
            defaultTeacherId,
            defaultTeacherName
          )
        );
      }
    }
  };

  const deleteEducationalSection = (sectionId: string): { success: boolean; message?: string } => {
    const enrolledCount = students.filter(
      (s) => s.sectionId === sectionId && s.status === 'Active'
    ).length;
    if (enrolledCount > 0) {
      return {
        success: false,
        message: `Cannot delete this section while ${enrolledCount} active student(s) are placed in it. Deactivate the section or reassign students first.`,
      };
    }
    const gradeIdsToRemove = new Set(
      gradeClasses.filter((g) => g.sectionId === sectionId).map((g) => g.id)
    );
    setEducationalSections((prev) => prev.filter((s) => s.id !== sectionId));
    setGradeClasses((prev) => prev.filter((g) => g.sectionId !== sectionId));
    setClasses((prev) =>
      prev.filter((c) => c.sectionId !== sectionId && (!c.gradeId || !gradeIdsToRemove.has(c.gradeId)))
    );
    return { success: true };
  };

  const addGradeClass = (data: {
    sectionId: string;
    name: string;
    canonicalCode?: string;
    formNumber?: number;
    levelCategory?: 'Basic' | 'JHS' | 'SHS';
    isShs?: boolean;
    nextGradeId?: string;
  }): GradeClassDefinition => {
    const cleanName = data.name.trim();
    const sec = educationalSections.find((s) => s.id === data.sectionId);
    const maxOrder = gradeClasses.reduce((m, g) => Math.max(m, g.order), 0);
    const inferredCategory: 'Basic' | 'JHS' | 'SHS' =
      data.levelCategory ||
      (sec?.isShs || sec?.code === 'SHS'
        ? 'SHS'
        : sec?.code === 'JHS'
        ? 'JHS'
        : 'Basic');

    const created: GradeClassDefinition = {
      id: `grd-cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sectionId: data.sectionId,
      canonicalCode:
        data.canonicalCode?.trim().toUpperCase() ||
        cleanName.toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 16),
      name: cleanName,
      order: maxOrder + 1,
      formNumber: data.formNumber ?? 1,
      levelCategory: inferredCategory,
      nextGradeId: data.nextGradeId,
      active: true,
      isShs: data.isShs ?? Boolean(sec?.isShs || inferredCategory === 'SHS'),
      isCustom: true,
    };

    const nextSections =
      sec && !sec.active
        ? educationalSections.map((s) => (s.id === sec.id ? { ...s, active: true } : s))
        : educationalSections;
    if (sec && !sec.active) {
      setEducationalSections(nextSections);
    }
    const nextGrades = [...gradeClasses, created];
    setGradeClasses(nextGrades);

    const defaultTeacherId = staff[0]?.id || currentUser.id;
    const defaultTeacherName = resolveTeacherDisplayName(defaultTeacherId);
    setClasses((prev) =>
      ensureStreamsForActiveGrades(
        activeSchoolId,
        nextSections,
        nextGrades,
        prev,
        defaultTeacherId,
        defaultTeacherName
      )
    );
    return created;
  };

  const updateGradeClass = (gradeId: string, updates: Partial<GradeClassDefinition>) => {
    const nextGrades = gradeClasses.map((g) => (g.id === gradeId ? { ...g, ...updates } : g));
    setGradeClasses(nextGrades);
    if (updates.name) {
      const nextGradeName = updates.name.trim();
      setClasses((prev) =>
        prev.map((c) => {
          if (c.gradeId !== gradeId) return c;
          const targetGrd = gradeClasses.find((g) => g.id === gradeId);
          const formatted = formatClassStreamDisplayName(
            {
              name: nextGradeName,
              canonicalCode: targetGrd?.canonicalCode || 'GRD',
              isShs: updates.isShs ?? targetGrd?.isShs,
            },
            c.streamLetter || c.stream,
            c.programme
          );
          return {
            ...c,
            gradeName: nextGradeName,
            name: formatted.displayName,
          };
        })
      );
      setStudents((prev) =>
        prev.map((st) => (st.gradeId === gradeId ? { ...st, gradeName: nextGradeName } : st))
      );
    }
    if (typeof updates.active === 'boolean') {
      if (!updates.active) {
        setClasses((prev) =>
          prev.map((c) => {
            if (c.gradeId !== gradeId) return c;
            const hasActiveStudents = students.some((st) => st.classId === c.id && st.status === 'Active');
            return hasActiveStudents ? c : { ...c, active: false };
          })
        );
      } else {
        const targetGrd = nextGrades.find((g) => g.id === gradeId);
        const nextSections =
          targetGrd && educationalSections.some((s) => s.id === targetGrd.sectionId && !s.active)
            ? educationalSections.map((s) =>
                s.id === targetGrd.sectionId ? { ...s, active: true } : s
              )
            : educationalSections;
        if (nextSections !== educationalSections) {
          setEducationalSections(nextSections);
        }
        const defaultTeacherId = staff[0]?.id || currentUser.id;
        const defaultTeacherName = resolveTeacherDisplayName(defaultTeacherId);
        setClasses((prev) =>
          ensureStreamsForActiveGrades(
            activeSchoolId,
            nextSections,
            nextGrades,
            prev,
            defaultTeacherId,
            defaultTeacherName
          )
        );
      }
    }
  };

  const deleteGradeClass = (gradeId: string): { success: boolean; message?: string } => {
    const classIds = new Set(classes.filter((c) => c.gradeId === gradeId).map((c) => c.id));
    const enrolledCount = students.filter(
      (s) => (s.gradeId === gradeId || classIds.has(s.classId)) && s.status === 'Active'
    ).length;
    if (enrolledCount > 0) {
      return {
        success: false,
        message: `Cannot delete this class level while ${enrolledCount} active student(s) are placed in its streams. Deactivate the class or move students first.`,
      };
    }
    setGradeClasses((prev) => prev.filter((g) => g.id !== gradeId));
    setClasses((prev) => prev.filter((c) => c.gradeId !== gradeId));
    return { success: true };
  };

  const addClassStream = (params: {
    gradeId: string;
    streamDivision: string;
    programme?: string;
    customDisplayName?: string;
    formTutorTeacherId?: string;
    classTeacherName?: string;
    roomNumber?: string;
    capacity?: number;
  }): { success: boolean; classRoom?: ClassRoom; message?: string } => {
    const grade = gradeClasses.find((g) => g.id === params.gradeId);
    if (!grade) {
      return { success: false, message: 'Please select a valid Class / Grade first.' };
    }
    const section = educationalSections.find((s) => s.id === grade.sectionId);
    const cleanDiv = params.streamDivision.trim();
    if (!cleanDiv) {
      return { success: false, message: 'Please enter a Stream / Division (e.g. A, B, C).' };
    }
    const cleanProg = params.programme?.trim() || undefined;
    const formatted = formatClassStreamDisplayName(grade, cleanDiv, cleanProg);
    const finalName = params.customDisplayName?.trim() || formatted.displayName;

    const duplicate = classes.find(
      (c) =>
        c.gradeId === grade.id &&
        c.name.trim().toLowerCase() === finalName.toLowerCase()
    );
    if (duplicate) {
      return {
        success: false,
        message: `Stream "${finalName}" already exists under ${grade.name}.`,
      };
    }

    const teacherId = params.formTutorTeacherId || staff[0]?.id || currentUser.id;
    const teacherName = resolveTeacherDisplayName(teacherId, params.classTeacherName);

    const newStream: ClassRoom = {
      id: `cls-${activeSchoolId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: finalName,
      sectionId: section?.id,
      sectionName: section?.name,
      gradeId: grade.id,
      gradeName: grade.name,
      level: grade.levelCategory,
      form: grade.formNumber,
      stream: formatted.streamLabel,
      streamLetter: cleanDiv,
      programme: cleanProg,
      formTutorTeacherId: teacherId,
      classTeacherName: teacherName,
      subjectTeachers: {},
      roomNumber: params.roomNumber?.trim() || `Rm ${grade.canonicalCode}-${cleanDiv}`,
      capacity: params.capacity && params.capacity > 0 ? params.capacity : 40,
      active: true,
    };

    setClasses((prev) => [...prev, newStream]);
    if (!grade.active) {
      setGradeClasses((prev) => prev.map((g) => (g.id === grade.id ? { ...g, active: true } : g)));
    }
    if (section && !section.active) {
      setEducationalSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, active: true } : s))
      );
    }

    return { success: true, classRoom: newStream };
  };

  const addClassStreamsBulk = (params: {
    gradeId: string;
    streamDivisions: string[];
    programme?: string;
    defaultCapacity?: number;
    roomPrefix?: string;
    formTutorTeacherId?: string;
  }): ClassRoom[] => {
    const grade = gradeClasses.find((g) => g.id === params.gradeId);
    if (!grade) return [];
    const section = educationalSections.find((s) => s.id === grade.sectionId);
    const existingNames = new Set(classes.map((c) => c.name.trim().toLowerCase()));
    const teacherId = params.formTutorTeacherId || staff[0]?.id || currentUser.id;
    const teacherName = resolveTeacherDisplayName(teacherId);
    const created: ClassRoom[] = [];

    params.streamDivisions.forEach((rawDiv, idx) => {
      const cleanDiv = rawDiv.trim();
      if (!cleanDiv) return;
      const formatted = formatClassStreamDisplayName(grade, cleanDiv, params.programme);
      if (existingNames.has(formatted.displayName.toLowerCase())) return;
      existingNames.add(formatted.displayName.toLowerCase());

      created.push({
        id: `cls-${activeSchoolId}-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        name: formatted.displayName,
        sectionId: section?.id,
        sectionName: section?.name,
        gradeId: grade.id,
        gradeName: grade.name,
        level: grade.levelCategory,
        form: grade.formNumber,
        stream: formatted.streamLabel,
        streamLetter: cleanDiv,
        programme: params.programme?.trim() || undefined,
        formTutorTeacherId: teacherId,
        classTeacherName: teacherName,
        subjectTeachers: {},
        roomNumber: `${params.roomPrefix?.trim() || `Rm ${grade.canonicalCode}`}-${cleanDiv}`,
        capacity: params.defaultCapacity || 40,
        active: true,
      });
    });

    if (created.length > 0) {
      setClasses((prev) => [...prev, ...created]);
    }
    return created;
  };

  const updateClassStream = (classId: string, updates: Partial<ClassRoom>) => {
    const resolvedTeacherName = updates.formTutorTeacherId
      ? resolveTeacherDisplayName(updates.formTutorTeacherId, updates.classTeacherName)
      : updates.classTeacherName;

    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          ...updates,
          classTeacherName: resolvedTeacherName ?? c.classTeacherName,
        };
      })
    );

    if (updates.formTutorTeacherId || resolvedTeacherName || updates.stream || updates.programme) {
      setStudents((prev) =>
        prev.map((st) => {
          if (st.classId !== classId) return st;
          return {
            ...st,
            stream: updates.stream ?? st.stream,
            programme: updates.programme ?? st.programme,
            classTeacherId: updates.formTutorTeacherId ?? st.classTeacherId,
            classTeacherName: resolvedTeacherName ?? st.classTeacherName,
          };
        })
      );
    }
  };

  const assignSubjectTeacherToStream = (classId: string, subjectId: string, teacherId: string) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        const nextMap = { ...(c.subjectTeachers || {}) };
        if (!teacherId) {
          delete nextMap[subjectId];
        } else {
          nextMap[subjectId] = teacherId;
        }
        return { ...c, subjectTeachers: nextMap };
      })
    );
  };

  const deleteClassStream = (classId: string): { success: boolean; message?: string } => {
    const activeEnrolled = students.filter(
      (s) => s.classId === classId && s.status === 'Active'
    ).length;
    if (activeEnrolled > 0) {
      return {
        success: false,
        message: `Cannot delete this stream while ${activeEnrolled} active student(s) are assigned to it. Reassign the students or deactivate the stream instead.`,
      };
    }
    setClasses((prev) => prev.filter((c) => c.id !== classId));
    setTimetable((prev) => prev.filter((t) => t.classId !== classId));
    return { success: true };
  };

  const checkDuplicateStudentEnrolment = (params: {
    firstName: string;
    lastName: string;
    otherNames?: string;
    dob?: string;
    academicYear?: string;
    nationalIdOrNHIS?: string;
    guardianPhone?: string;
    excludeStudentId?: string;
  }): { isDuplicate: boolean; matchedStudent?: Student; reason?: string } => {
    const normFirst = params.firstName.trim().toLowerCase();
    const normLast = params.lastName.trim().toLowerCase();
    const normOther = (params.otherNames || '').trim().toLowerCase();
    const normNhis = (params.nationalIdOrNHIS || '').trim().toLowerCase();
    const normDob = (params.dob || '').trim();
    const normYear = (params.academicYear || school.currentAcademicYear || '').trim();
    const normPhone = (params.guardianPhone || '').replace(/\D/g, '');

    if (!normFirst || !normLast) {
      return { isDuplicate: false };
    }

    for (const existing of students) {
      if (params.excludeStudentId && existing.id === params.excludeStudentId) continue;
      if (existing.status === 'Withdrawn' || existing.status === 'Transferred') continue;

      // 1. Exact Ghana Card / NHIS match within the institution
      const exNhis = (existing.nationalIdOrNHIS || '').trim().toLowerCase();
      if (normNhis.length >= 6 && exNhis.length >= 6 && normNhis === exNhis) {
        return {
          isDuplicate: true,
          matchedStudent: existing,
          reason: `A student with National ID / NHIS "${existing.nationalIdOrNHIS}" is already enrolled (${existing.firstName} ${existing.lastName} — ${existing.studentNumber}).`,
        };
      }

      // 2. Same full name + DOB (when provided) in the same institution & academic year
      const sameName =
        existing.firstName.trim().toLowerCase() === normFirst &&
        existing.lastName.trim().toLowerCase() === normLast &&
        ((!normOther && !(existing.otherNames || '').trim()) ||
          (existing.otherNames || '').trim().toLowerCase() === normOther);

      if (sameName) {
        const exDob = (existing.dob || '').trim();
        const bothHaveDob = Boolean(normDob && exDob);
        const dobMatches = bothHaveDob && exDob === normDob;
        const exPhone = (existing.guardianPhone || '').replace(/\D/g, '');
        const sameGuardianPhone = normPhone.length >= 9 && exPhone.length >= 9 && normPhone === exPhone;
        const existingYear = (existing.academicYear || school.currentAcademicYear || '').trim();
        const sameAcademicYear = !normYear || !existingYear || existingYear === normYear;

        if (sameAcademicYear && (bothHaveDob ? dobMatches : sameGuardianPhone || !normDob)) {
          const existingCls = classes.find((c) => c.id === existing.classId);
          return {
            isDuplicate: true,
            matchedStudent: existing,
            reason: `${existing.firstName} ${existing.lastName} (${existing.studentNumber}) is already enrolled in ${existingCls?.name || existing.stream} for ${existingYear || school.currentAcademicYear}.`,
          };
        }
      }
    }

    return { isDuplicate: false };
  };

  const enrollStudentWithPlacement = (
    data: Omit<Student, 'id' | 'studentNumber' | 'status' | 'admissionDate'> & {
      academicYear?: string;
      admissionApplicationId?: string;
    }
  ): { success: boolean; student?: Student; message?: string } => {
    if (!activeSchoolId || activeSchoolId === EMPTY_SCHOOL_ID) {
      return {
        success: false,
        message: 'Please register or select an active institution before enrolling students.',
      };
    }

    const canManageEnrolment =
      !['student', 'parent', 'graduate'].includes(currentUser.role) || isPlatformAdmin;
    if (!canManageEnrolment) {
      return {
        success: false,
        message: 'Only authorised school staff or Administrators can enrol and place students.',
      };
    }

    if (!data.sectionId) {
      return {
        success: false,
        message: 'Please select an Educational Section before completing enrolment.',
      };
    }
    if (!data.gradeId) {
      return {
        success: false,
        message: 'Please select a Class / Grade before completing enrolment.',
      };
    }

    const targetGradeObj = gradeClasses.find((g) => g.id === data.gradeId);
    let selectedClassRoom: ClassRoom | undefined = data.classId
      ? classes.find((c) => c.id === data.classId)
      : undefined;

    if (!selectedClassRoom) {
      selectedClassRoom = classes.find((c) => c.gradeId === data.gradeId && c.active !== false);
    }

    if (!selectedClassRoom && targetGradeObj) {
      const autoStreamRes = addClassStream({
        gradeId: targetGradeObj.id,
        streamDivision: data.stream || 'A',
        programme: targetGradeObj.isShs ? data.programme : undefined,
        formTutorTeacherId: data.classTeacherId,
      });
      if (autoStreamRes.success && autoStreamRes.classRoom) {
        selectedClassRoom = autoStreamRes.classRoom;
      }
    }

    if (!selectedClassRoom) {
      return {
        success: false,
        message: 'Please select or create a Stream / Division belonging to the chosen class.',
      };
    }

    if (selectedClassRoom.gradeId && selectedClassRoom.gradeId !== data.gradeId) {
      return {
        success: false,
        message: 'Selected Stream does not belong to the selected Class / Grade. Please re-select the stream.',
      };
    }

    const dupCheck = checkDuplicateStudentEnrolment({
      firstName: data.firstName,
      lastName: data.lastName,
      otherNames: data.otherNames,
      dob: data.dob,
      academicYear: data.academicYear || school.currentAcademicYear,
      nationalIdOrNHIS: data.nationalIdOrNHIS,
      guardianPhone: data.guardianPhone,
    });
    if (dupCheck.isDuplicate) {
      return {
        success: false,
        message: `Duplicate Enrolment Blocked: ${dupCheck.reason}`,
      };
    }

    const createdStudent = addStudent({
      ...data,
      classId: selectedClassRoom.id,
      stream: data.stream || selectedClassRoom.stream,
      programme: data.programme || selectedClassRoom.programme,
      classTeacherId: data.classTeacherId || selectedClassRoom.formTutorTeacherId,
      classTeacherName:
        data.classTeacherName ||
        resolveTeacherDisplayName(
          data.classTeacherId || selectedClassRoom.formTutorTeacherId,
          selectedClassRoom.classTeacherName
        ),
      _resolvedClassRoom: selectedClassRoom,
    });

    if (data.admissionApplicationId) {
      updateAdmissionStatus(data.admissionApplicationId, 'Enrolled');
    }

    return {
      success: true,
      student: createdStudent,
      message: `${createdStudent.firstName} ${createdStudent.lastName} placed in ${selectedClassRoom.name}.`,
    };
  };

  const reassignStudentClassStream = (params: {
    studentId: string;
    academicYear: string;
    sectionId: string;
    gradeId: string;
    classId: string;
    stream?: string;
    programme?: string;
    classTeacherId?: string;
    reason?: string;
  }): { success: boolean; message: string } => {
    const canReassign = ['proprietor', 'admin'].includes(currentUser.role) || isPlatformAdmin;
    if (!canReassign) {
      return {
        success: false,
        message: 'Permission denied: Only authorised Administrators can change a student’s class or stream.',
      };
    }

    if (!params.sectionId || !params.gradeId || !params.classId) {
      return {
        success: false,
        message: 'Educational Section, Class / Grade, and Stream must all be selected.',
      };
    }

    const student = students.find((s) => s.id === params.studentId);
    if (!student) {
      return { success: false, message: 'Student record not found.' };
    }

    const targetCls = classes.find((c) => c.id === params.classId);
    const targetGrade = gradeClasses.find((g) => g.id === params.gradeId);
    const targetSection = educationalSections.find((s) => s.id === params.sectionId);
    if (!targetCls || !targetGrade || !targetSection) {
      return { success: false, message: 'Selected Section, Class, or Stream is invalid.' };
    }

    if (targetCls.gradeId && targetCls.gradeId !== targetGrade.id) {
      return {
        success: false,
        message: 'Selected Stream does not belong to the chosen Class / Grade.',
      };
    }

    const prevCls = classes.find((c) => c.id === student.classId);
    const nextTeacherId = params.classTeacherId || targetCls.formTutorTeacherId;
    const nextTeacherName = resolveTeacherDisplayName(nextTeacherId, targetCls.classTeacherName);
    const todayDate = getTodayIsoDate();

    const historyEntry: StudentPlacementHistoryEntry = {
      id: `plh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      academicYear: params.academicYear || school.currentAcademicYear,
      term: school.currentTerm,
      previousAcademicYear: student.academicYear || school.currentAcademicYear,
      previousSectionName: student.sectionName || prevCls?.sectionName || prevCls?.level,
      previousGradeName: student.gradeName || prevCls?.gradeName,
      previousClassId: student.classId,
      previousClassName: prevCls?.name || 'Previous Class',
      previousStream: student.stream,
      newSectionId: targetSection.id,
      newSectionName: targetSection.name,
      newGradeId: targetGrade.id,
      newGradeName: targetGrade.name,
      newClassId: targetCls.id,
      newClassName: targetCls.name,
      newStream: params.stream || targetCls.stream,
      programme: params.programme || targetCls.programme || student.programme,
      classTeacherName: nextTeacherName,
      changeType: 'Class/Stream Reassignment',
      reason: params.reason?.trim() || 'Administrative class/stream placement update',
      changedBy: currentUser.name || 'Administrator',
      changedAt: todayDate,
    };

    const existingHistory = Array.isArray(student.placementHistory) ? student.placementHistory : [];
    updateStudent(student.id, {
      academicYear: params.academicYear || school.currentAcademicYear,
      sectionId: targetSection.id,
      sectionName: targetSection.name,
      gradeId: targetGrade.id,
      gradeName: targetGrade.name,
      classId: targetCls.id,
      stream: params.stream || targetCls.stream,
      programme: params.programme || targetCls.programme || student.programme,
      classTeacherId: nextTeacherId,
      classTeacherName: nextTeacherName,
      placementHistory: [historyEntry, ...existingHistory],
    });

    return {
      success: true,
      message: `${student.firstName} ${student.lastName} reassigned to ${targetCls.name} (${targetSection.name}).`,
    };
  };

  const promoteOrTransferStudents = (params: {
    studentIds: string[];
    sourceAcademicYear: string;
    targetAcademicYear: string;
    action: 'promote' | 'transfer' | 'graduate';
    targetSectionId?: string;
    targetGradeId?: string;
    targetClassId?: string;
    transferDestinationSchool?: string;
    reason?: string;
    advanceSchoolAcademicYear?: boolean;
  }): { success: boolean; count: number; message: string } => {
    const canPromote = ['proprietor', 'admin'].includes(currentUser.role) || isPlatformAdmin;
    if (!canPromote) {
      return {
        success: false,
        count: 0,
        message: 'Permission denied: Only authorised Administrators can execute class promotions or transfers.',
      };
    }

    if (!params.studentIds || params.studentIds.length === 0) {
      return {
        success: false,
        count: 0,
        message: 'Please select at least one student to promote, transfer, or graduate.',
      };
    }

    const selectedSet = new Set(params.studentIds);
    const todayDate = getTodayIsoDate();

    if (params.action === 'promote') {
      if (!params.targetSectionId || !params.targetGradeId || !params.targetClassId) {
        return {
          success: false,
          count: 0,
          message: 'Please select the destination Educational Section, Class / Grade, and Stream for promotion.',
        };
      }

      const targetCls = classes.find((c) => c.id === params.targetClassId);
      const targetGrade = gradeClasses.find((g) => g.id === params.targetGradeId);
      const targetSection = educationalSections.find((s) => s.id === params.targetSectionId);
      if (!targetCls || !targetGrade || !targetSection) {
        return {
          success: false,
          count: 0,
          message: 'Destination Section, Class, or Stream is invalid.',
        };
      }

      const nextTeacherName = resolveTeacherDisplayName(
        targetCls.formTutorTeacherId,
        targetCls.classTeacherName
      );

      const mutatedStudents: Student[] = [];
      const nextStudentsList = students.map((stu) => {
        if (!selectedSet.has(stu.id)) return stu;
        const idxNum = mutatedStudents.length + 1;
        const prevCls = classes.find((c) => c.id === stu.classId);
        const entry: StudentPlacementHistoryEntry = {
          id: `plh-prom-${Date.now()}-${idxNum}`,
          academicYear: params.targetAcademicYear,
          term: 'Term 1',
          previousAcademicYear: stu.academicYear || params.sourceAcademicYear,
          previousSectionName: stu.sectionName || prevCls?.sectionName || prevCls?.level,
          previousGradeName: stu.gradeName || prevCls?.gradeName,
          previousClassId: stu.classId,
          previousClassName: prevCls?.name || 'Previous Class',
          previousStream: stu.stream,
          newSectionId: targetSection.id,
          newSectionName: targetSection.name,
          newGradeId: targetGrade.id,
          newGradeName: targetGrade.name,
          newClassId: targetCls.id,
          newClassName: targetCls.name,
          newStream: targetCls.stream,
          programme: targetCls.programme || stu.programme,
          classTeacherName: nextTeacherName,
          changeType: 'Annual Promotion',
          reason:
            params.reason?.trim() ||
            `End-of-year promotion from ${params.sourceAcademicYear} to ${params.targetAcademicYear}`,
          changedBy: currentUser.name || 'Administrator',
          changedAt: todayDate,
        };

        const updatedStu: Student = {
          ...stu,
          academicYear: params.targetAcademicYear,
          sectionId: targetSection.id,
          sectionName: targetSection.name,
          gradeId: targetGrade.id,
          gradeName: targetGrade.name,
          classId: targetCls.id,
          stream: targetCls.stream,
          programme: targetCls.programme || stu.programme,
          classTeacherId: targetCls.formTutorTeacherId,
          classTeacherName: nextTeacherName,
          status: 'Active',
          placementHistory: [entry, ...(stu.placementHistory || [])],
        };
        mutatedStudents.push(updatedStu);
        return updatedStu;
      });

      const promotedCount = mutatedStudents.length;
      setStudents(nextStudentsList);

      // Update student portal accounts' assignedClassId while preserving all historical exam/attendance records
      setUsers((prev) =>
        prev.map((u) => (u.studentId && selectedSet.has(u.studentId) ? { ...u, assignedClassId: targetCls.id } : u))
      );

      if (params.advanceSchoolAcademicYear && params.targetAcademicYear) {
        updateSchoolProfile({ currentAcademicYear: params.targetAcademicYear, currentTerm: 'Term 1' });
      }

      if (canWriteSchoolAdminInCloud(activeSchoolId) && mutatedStudents.length > 0) {
        const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
        runCloudTask(
          (async () => {
            for (const st of mutatedStudents) {
              await upsertStudentInCloud(activeSchoolId, ownerUid, st);
            }
          })()
        );
      }

      return {
        success: true,
        count: promotedCount,
        message: `Successfully promoted ${promotedCount} student(s) to ${targetCls.name} (${params.targetAcademicYear}). All previous academic records and class history have been preserved.`,
      };
    }

    // Transfer Out or Graduation
    const mutatedStudents: Student[] = [];
    const isTransfer = params.action === 'transfer';

    const nextStudentsList = students.map((stu) => {
      if (!selectedSet.has(stu.id)) return stu;
      const idxNum = mutatedStudents.length + 1;
      const prevCls = classes.find((c) => c.id === stu.classId);
      const entry: StudentPlacementHistoryEntry = {
        id: `plh-trf-${Date.now()}-${idxNum}`,
        academicYear: params.targetAcademicYear || stu.academicYear || school.currentAcademicYear,
        previousAcademicYear: stu.academicYear || params.sourceAcademicYear,
        previousSectionName: stu.sectionName || prevCls?.sectionName || prevCls?.level,
        previousGradeName: stu.gradeName || prevCls?.gradeName,
        previousClassId: stu.classId,
        previousClassName: prevCls?.name || 'Previous Class',
        previousStream: stu.stream,
        newSectionName: isTransfer ? 'External Transfer' : 'Graduated Alumni',
        newClassId: stu.classId,
        newClassName: isTransfer
          ? `Transferred${params.transferDestinationSchool ? ` → ${params.transferDestinationSchool.trim()}` : ''}`
          : `Graduated (${prevCls?.name || stu.gradeName || 'Final Year'})`,
        newStream: stu.stream,
        programme: stu.programme,
        changeType: isTransfer ? 'Transfer Out' : 'Graduation',
        transferDestinationSchool: params.transferDestinationSchool?.trim() || undefined,
        reason:
          params.reason?.trim() ||
          (isTransfer ? 'Official inter-school student transfer' : 'Completed final class level and graduated'),
        changedBy: currentUser.name || 'Administrator',
        changedAt: todayDate,
      };

      const updatedStu: Student = {
        ...stu,
        status: isTransfer ? 'Transferred' : 'Graduated',
        transferDestinationSchool: isTransfer
          ? params.transferDestinationSchool?.trim() || stu.transferDestinationSchool
          : stu.transferDestinationSchool,
        placementHistory: [entry, ...(stu.placementHistory || [])],
      };
      mutatedStudents.push(updatedStu);
      return updatedStu;
    });

    const processedCount = mutatedStudents.length;
    setStudents(nextStudentsList);

    if (canWriteSchoolAdminInCloud(activeSchoolId) && mutatedStudents.length > 0) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(
        (async () => {
          for (const st of mutatedStudents) {
            await upsertStudentInCloud(activeSchoolId, ownerUid, st);
          }
        })()
      );
    }

    return {
      success: true,
      count: processedCount,
      message: isTransfer
        ? `Recorded official transfer for ${processedCount} student(s) while preserving their full academic & placement history.`
        : `Graduated ${processedCount} student(s) and archived their complete academic & class history.`,
    };
  };

  const issueBookLoan = (bookId: string, studentId: string, dueDate: string) => {
    const newLoan: BookLoan = {
      id: `ln-${Date.now()}`,
      bookId,
      studentId,
      borrowDate: new Date().toISOString().split('T')[0],
      dueDate,
      status: 'Active',
    };
    setBookLoans((prev) => [newLoan, ...prev]);
    setLibraryBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b))
    );
  };

  const returnBookLoan = (loanId: string) => {
    const loan = bookLoans.find((l) => l.id === loanId);
    if (!loan) return;
    setBookLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? { ...l, returnDate: new Date().toISOString().split('T')[0], status: 'Returned' }
          : l
      )
    );
    setLibraryBooks((prev) =>
      prev.map((b) => (b.id === loan.bookId ? { ...b, availableCopies: b.availableCopies + 1 } : b))
    );
  };

  const addAsset = (asset: Omit<SchoolAsset, 'id'>) => {
    setAssets((prev) => [{ id: `ast-${Date.now()}`, ...asset }, ...prev]);
  };

  const addHealthRecord = (record: Omit<HealthIncident, 'id'>) => {
    setHealthRecords((prev) => [{ id: `hlt-${Date.now()}`, ...record }, ...prev]);
  };

  const sendAnnouncement = (announcement: Omit<SchoolAnnouncement, 'id' | 'sentDate'>) => {
    setAnnouncements((prev) => [
      { id: `anc-${Date.now()}`, sentDate: new Date().toISOString().split('T')[0], ...announcement },
      ...prev,
    ]);
  };

  const resetToDemoData = () => {
    if (!activeSchoolId || activeSchoolId === EMPTY_SCHOOL_ID) return;
    const cleanSlate = getInitialTenantData(activeSchoolId);
    cleanSlate.school = school;
    cleanSlate.users = users;
    cleanSlate.classes = classes;
    cleanSlate.educationalSections = educationalSections;
    cleanSlate.gradeClasses = gradeClasses;
    cleanSlate.programmes = programmes;
    cleanSlate.certificateTemplates = certificateTemplates;
    applyTenantState(activeSchoolId, cleanSlate, school);
    try {
      localStorage.setItem(TENANT_STORAGE_PREFIX + activeSchoolId, JSON.stringify(cleanSlate));
    } catch (e) {
      console.error('Error clearing workspace records', e);
    }
  };

  const publishResearchArticle = (
    articleData: Omit<ResearchArticle, 'id' | 'publicationDate' | 'viewsCount' | 'downloadsCount' | 'citationsCount' | 'doi'>
  ): ResearchArticle => {
    const year = new Date().getFullYear();
    const cleanSchoolCode = (school.code || 'SCH').toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const newArticle: ResearchArticle = {
      ...articleData,
      id: `art-${activeSchoolId}-${Date.now()}`,
      schoolId: activeSchoolId,
      publicationDate: new Date().toISOString().split('T')[0],
      doi: `10.5281/edudigital.${cleanSchoolCode}.${year}.${randomSeq}`,
      viewsCount: 1,
      downloadsCount: 0,
      citationsCount: 0,
    };
    setResearchArticles((prev) => [newArticle, ...prev]);
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(upsertResearchArticleInCloud(activeSchoolId, ownerUid, newArticle));
    }
    return newArticle;
  };

  const updateResearchArticle = (id: string, data: Partial<ResearchArticle>) => {
    setResearchArticles((prev) =>
      prev.map((art) => {
        if (art.id !== id) return art;
        const updated = { ...art, ...data };
        if (canWriteSchoolAdminInCloud(activeSchoolId)) {
          const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
          runCloudTask(upsertResearchArticleInCloud(activeSchoolId, ownerUid, updated));
        }
        return updated;
      })
    );
  };

  const deleteResearchArticle = (id: string) => {
    setResearchArticles((prev) => prev.filter((art) => art.id !== id));
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      runCloudTask(deleteResearchArticleInCloud(id));
    }
  };

  const incrementExternalSchoolMetric = (
    articleId: string,
    field: 'viewsCount' | 'downloadsCount' | 'citationsCount'
  ) => {
    for (const s of schools) {
      if (s.id === activeSchoolId) continue;
      try {
        const key = TENANT_STORAGE_PREFIX + s.id;
        const storedStr = localStorage.getItem(key);
        const tenantObj: SchoolTenantData = storedStr
          ? JSON.parse(storedStr)
          : getInitialTenantData(s.id);
        const list = Array.isArray(tenantObj.researchArticles)
          ? tenantObj.researchArticles
          : getInitialResearchArticles(s.id);
        if (list.some((a) => a.id === articleId)) {
          tenantObj.researchArticles = list.map((a) =>
            a.id === articleId ? { ...a, [field]: (a[field] || 0) + 1 } : a
          );
          localStorage.setItem(key, JSON.stringify(tenantObj));
          setPublicNetworkRevision((r) => r + 1);
          return;
        }
      } catch (e) {
        console.error('Error updating cross-school article metric', e);
      }
    }
  };

  const recordArticleView = (id: string) => {
    if (researchArticles.some((art) => art.id === id)) {
      setResearchArticles((prev) =>
        prev.map((art) => (art.id === id ? { ...art, viewsCount: (art.viewsCount || 0) + 1 } : art))
      );
    } else {
      incrementExternalSchoolMetric(id, 'viewsCount');
    }
    if (auth.currentUser?.emailVerified) {
      runCloudTask(incrementArticleMetricInCloud(id, 'viewsCount'));
    }
  };

  const recordArticleDownload = (id: string) => {
    if (researchArticles.some((art) => art.id === id)) {
      setResearchArticles((prev) =>
        prev.map((art) => (art.id === id ? { ...art, downloadsCount: (art.downloadsCount || 0) + 1 } : art))
      );
    } else {
      incrementExternalSchoolMetric(id, 'downloadsCount');
    }
    if (auth.currentUser?.emailVerified) {
      runCloudTask(incrementArticleMetricInCloud(id, 'downloadsCount'));
    }
  };

  const recordArticleCitation = (id: string) => {
    if (researchArticles.some((art) => art.id === id)) {
      setResearchArticles((prev) =>
        prev.map((art) => (art.id === id ? { ...art, citationsCount: (art.citationsCount || 0) + 1 } : art))
      );
    } else {
      incrementExternalSchoolMetric(id, 'citationsCount');
    }
    if (auth.currentUser?.emailVerified) {
      runCloudTask(incrementArticleMetricInCloud(id, 'citationsCount'));
    }
  };

  const allPublicResearchArticles = React.useMemo(() => {
    const map = new Map<string, ResearchArticle>();
    researchArticles.filter((a) => a.isOpenToPublic).forEach((a) => map.set(a.id, a));

    for (const s of schools) {
      if (s.id === activeSchoolId) continue;
      try {
        const storedStr = localStorage.getItem(TENANT_STORAGE_PREFIX + s.id);
        if (storedStr) {
          const parsed: SchoolTenantData = JSON.parse(storedStr);
          if (parsed && Array.isArray(parsed.researchArticles)) {
            parsed.researchArticles.filter((a) => a.isOpenToPublic).forEach((a) => map.set(a.id, a));
          }
        } else {
          const seeds = getInitialResearchArticles(s.id);
          seeds.filter((a) => a.isOpenToPublic).forEach((a) => map.set(a.id, a));
        }
      } catch (e) {
        console.error('Error loading public articles from school', s.id, e);
      }
    }

    // Cloud open-access articles take latest metric precedence
    cloudPublicArticles.filter((a) => a.isOpenToPublic).forEach((a) => map.set(a.id, a));

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
    );
  }, [cloudPublicArticles, researchArticles, schools, activeSchoolId, publicNetworkRevision]);

  const exportDatabaseJSON = (): string => {
    const payload = {
      exportTimestamp: new Date().toISOString(),
      schoolId: activeSchoolId,
      ...buildCurrentTenantSnapshot(),
      currentUser,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.school && parsed.students) {
        const hydrated = hydrateProfessionalFields(parsed.school.id || activeSchoolId, parsed);
        applyTenantState(activeSchoolId, hydrated, hydrated.school);
        if (parsed.currentUser) setCurrentUserState(parsed.currentUser);
        return true;
      }
    } catch (e) {
      console.error('Import error', e);
    }
    return false;
  };

  const recordBiometricGateEvent = (
    event: Omit<BiometricGateLog, 'id' | 'schoolId' | 'date' | 'timestamp'> & {
      date?: string;
      timestamp?: string;
    }
  ): BiometricGateLog => {
    const newEntry: BiometricGateLog = {
      ...event,
      id: `bgl-${activeSchoolId}-${Date.now()}`,
      schoolId: activeSchoolId,
      date: event.date || getTodayIsoDate(),
      timestamp:
        event.timestamp ||
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setBiometricGateLogs((prev) => [newEntry, ...prev].slice(0, 100));
    return newEntry;
  };

  const updatePlatformOwnerProfile = (updates: Partial<Omit<PlatformOwnerProfile, 'id'>>) => {
    setPlatformOwnerProfile((prev) => {
      const nextProfile: PlatformOwnerProfile = {
        ...prev,
        ...updates,
        id: 'ownerProfile',
        updatedAt: getTodayIsoDate(),
      };
      try {
        localStorage.setItem(PLATFORM_OWNER_PROFILE_KEY, JSON.stringify(nextProfile));
      } catch {
        // Ignore storage quota errors
      }
      if (auth.currentUser?.emailVerified && isBootstrappedAdminUser(auth.currentUser)) {
        runCloudTask(upsertPlatformOwnerProfileInCloud(nextProfile));
      }
      return nextProfile;
    });
  };

  const submitStudentPhotoRequest = (params: {
    studentId: string;
    newPhoto: string;
    requestedByName?: string;
    requestedByRole?: RoleType | 'applicant';
  }): { immediateApplied: boolean; request: StudentPhotoChangeRequest } => {
    const stu = students.find((s) => s.id === params.studentId);
    const cand = !stu ? candidates.find((c) => c.id === params.studentId) : undefined;
    const targetName = stu
      ? `${stu.firstName} ${stu.lastName}`
      : cand
      ? `${cand.firstName} ${cand.lastName}`
      : params.requestedByName || 'Student';
    const targetNumber = stu?.studentNumber || cand?.candidateNumber || params.studentId;
    const previousPhoto = stu?.photo || cand?.photo || '';
    const actorRole = params.requestedByRole || currentUser.role;
    const actorName = params.requestedByName || currentUser.name;
    const isAdminActor = actorRole === 'proprietor' || actorRole === 'admin';
    const today = getTodayIsoDate();

    const reqRecord: StudentPhotoChangeRequest = {
      id: `phr-${Date.now()}`,
      schoolId: activeSchoolId,
      studentId: params.studentId,
      studentName: targetName,
      studentNumber: targetNumber,
      previousPhoto,
      newPhoto: params.newPhoto,
      requestedByName: actorName,
      requestedByRole: actorRole,
      requestedAt: today,
      status: isAdminActor ? 'Approved' : 'Pending Review',
      reviewedBy: isAdminActor ? actorName : undefined,
      reviewedAt: isAdminActor ? today : undefined,
      reviewNote: isAdminActor ? 'Uploaded and approved directly by authorised administrator.' : undefined,
    };

    setPhotoChangeRequests((prev) => [reqRecord, ...prev.slice(0, 79)]);

    if (isAdminActor) {
      if (stu) {
        updateStudent(stu.id, { photo: params.newPhoto });
      } else if (cand) {
        updateCandidate(cand.id, { photo: params.newPhoto });
      }
    }

    return { immediateApplied: isAdminActor, request: reqRecord };
  };

  const reviewStudentPhotoRequest = (requestId: string, approve: boolean, reviewNote?: string) => {
    const targetReq = photoChangeRequests.find((r) => r.id === requestId);
    if (!targetReq) return;
    const today = getTodayIsoDate();

    setPhotoChangeRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: approve ? 'Approved' : 'Declined',
              reviewedBy: currentUser.name,
              reviewedAt: today,
              reviewNote:
                reviewNote ||
                (approve
                  ? 'Approved and linked to official institutional student records.'
                  : 'Declined — please upload a recent passport photograph with clear facial visibility.'),
            }
          : r
      )
    );

    if (approve) {
      const stu = students.find((s) => s.id === targetReq.studentId);
      if (stu) {
        updateStudent(stu.id, { photo: targetReq.newPhoto });
      } else {
        const cand = candidates.find((c) => c.id === targetReq.studentId);
        if (cand) {
          updateCandidate(cand.id, { photo: targetReq.newPhoto });
        }
      }
    }
  };

  // BECE Mock Examination Management & Learning Support Actions
  const createBeceMockSeries = (
    data: Omit<BeceMockExamSeries, 'id' | 'schoolId' | 'sequenceOrder'> & { sequenceOrder?: number }
  ): BeceMockExamSeries => {
    const nextOrder =
      data.sequenceOrder ??
      (beceMockSeries.length > 0 ? Math.max(...beceMockSeries.map((s) => s.sequenceOrder)) + 1 : 1);
    const created: BeceMockExamSeries = {
      ...data,
      id: `mock-${activeSchoolId}-${Date.now()}`,
      schoolId: activeSchoolId,
      sequenceOrder: nextOrder,
    };
    setBeceMockSeries((prev) => [...prev, created].sort((a, b) => a.sequenceOrder - b.sequenceOrder));
    return created;
  };

  const updateBeceMockSeries = (id: string, updates: Partial<BeceMockExamSeries>) => {
    setBeceMockSeries((prev) =>
      prev
        .map((s) => (s.id === id ? { ...s, ...updates } : s))
        .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    );
  };

  const deleteBeceMockSeries = (id: string) => {
    setBeceMockSeries((prev) => prev.filter((s) => s.id !== id));
    setBeceMockScores((prev) => prev.filter((sc) => sc.seriesId !== id));
  };

  const saveBeceMockScore = (
    entry: Omit<BeceMockScoreRecord, 'id' | 'schoolId' | 'totalScore' | 'beceGrade' | 'gradeRemark' | 'updatedAt'> & {
      totalScore?: number;
    }
  ): BeceMockScoreRecord => {
    const secA = Math.max(0, Math.min(40, Number(entry.sectionAScore) || 0));
    const secB = Math.max(0, Math.min(60, Number(entry.sectionBScore) || 0));
    const total =
      typeof entry.totalScore === 'number'
        ? Math.max(0, Math.min(100, Math.round(entry.totalScore)))
        : Math.max(0, Math.min(100, Math.round(secA + secB)));
    const gInfo = calculateBeceGrade(total);
    const today = getTodayIsoDate();

    let savedRecord: BeceMockScoreRecord = {
      id: `bmsc-${Date.now()}-${entry.studentId}-${entry.subjectId}`,
      schoolId: activeSchoolId,
      seriesId: entry.seriesId,
      studentId: entry.studentId,
      classId: entry.classId,
      subjectId: entry.subjectId,
      subjectName: entry.subjectName,
      subjectCategory: entry.subjectCategory,
      sectionAScore: secA,
      sectionBScore: secB,
      totalScore: total,
      beceGrade: gInfo.grade,
      gradeRemark: gInfo.interpretation,
      recordedBy: entry.recordedBy || currentUser.name,
      updatedAt: today,
    };

    setBeceMockScores((prev) => {
      const idx = prev.findIndex(
        (r) =>
          r.seriesId === entry.seriesId &&
          r.studentId === entry.studentId &&
          r.subjectId === entry.subjectId
      );
      if (idx >= 0) {
        savedRecord = { ...savedRecord, id: prev[idx].id };
        const copy = [...prev];
        copy[idx] = savedRecord;
        return copy;
      }
      return [...prev, savedRecord];
    });

    // Automatically update follow-up scores on any active interventions for this student & subject
    setBeceInterventions((prev) =>
      prev.map((inv) => {
        if (
          inv.studentId === entry.studentId &&
          inv.subjectName.toLowerCase() === entry.subjectName.toLowerCase() &&
          inv.baselineSeriesId !== entry.seriesId
        ) {
          return {
            ...inv,
            followUpSeriesId: entry.seriesId,
            followUpScore: total,
          };
        }
        return inv;
      })
    );

    return savedRecord;
  };

  const assignBeceIntervention = (
    item: Omit<BeceAcademicIntervention, 'id' | 'schoolId' | 'assignedDate'>
  ): BeceAcademicIntervention => {
    const created: BeceAcademicIntervention = {
      ...item,
      id: `binv-${Date.now()}`,
      schoolId: activeSchoolId,
      assignedDate: getTodayIsoDate(),
    };
    setBeceInterventions((prev) => [created, ...prev]);
    return created;
  };

  const updateBeceIntervention = (id: string, updates: Partial<BeceAcademicIntervention>) => {
    setBeceInterventions((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv))
    );
  };

  const deleteBeceIntervention = (id: string) => {
    setBeceInterventions((prev) => prev.filter((inv) => inv.id !== id));
  };

  const saveBeceAiReport = (
    report: Omit<BeceAiReadinessReport, 'id' | 'schoolId' | 'generatedAt'>
  ): BeceAiReadinessReport => {
    const saved: BeceAiReadinessReport = {
      ...report,
      id: `bai-${report.studentId}-${Date.now()}`,
      schoolId: activeSchoolId,
      generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setBeceAiReports((prev) => [
      saved,
      ...prev.filter((r) => r.studentId !== report.studentId),
    ]);
    return saved;
  };

  return (
    <SchoolContext.Provider
      value={{
        schools,
        activeSchoolId,
        school,
        switchSchool,
        registerSchool,
        deleteSchool,
        currentUser,
        users,
        students,
        classes,
        educationalSections,
        gradeClasses,
        subjects,
        admissions,
        examResults,
        feeItems,
        feePayments,
        transactions,
        staff,
        staffAttendance,
        timetable,
        attendance,
        libraryBooks,
        bookLoans,
        assets,
        routes,
        boardingHouses,
        healthRecords,
        announcements,
        researchArticles,
        allPublicResearchArticles,
        signatories,
        programmes,
        programmeCourses,
        candidates,
        candidateAssessments,
        certificateTemplates,
        issuedCredentials,
        graduateRecords,
        replacementRequests,
        accreditations,
        verificationLogs,
        biometricGateLogs,
        recordBiometricGateEvent,
        allPublicDirectoryGraduates,
        samplePublicCredentials,
        saveUserSignature,
        upsertSignatory,
        removeSignatory,
        addProgramme,
        updateProgramme,
        deleteProgramme,
        addProgrammeCourse,
        updateProgrammeCourse,
        deleteProgrammeCourse,
        registerCandidate,
        updateCandidate,
        saveCandidateAssessment,
        evaluateCandidateProgression,
        promoteCandidateToNextLevel,
        saveCertificateTemplate,
        issueDigitalCredential,
        updateCredentialStatus,
        submitReplacementRequest,
        processReplacementRequest,
        updateGraduateProfile,
        addAccreditation,
        updateAccreditation,
        verifyCredentialPublic,
        verifyCredentialPublicAsync,
        verifyCredentialsBatch,
        publishResearchArticle,
        updateResearchArticle,
        deleteResearchArticle,
        recordArticleView,
        recordArticleDownload,
        recordArticleCitation,
        activeModule,
        setActiveModule,
        setCurrentUser,
        updateSchoolProfile,
        updateUser,
        updateCurrentUserAvatar,
        addUserAccount,
        deleteUserAccount,
        addStudent,
        updateStudent,
        addAdmission,
        updateAdmissionStatus,
        recordAttendance,
        saveExamResult,
        publishResults,
        recordFeePayment,
        recordTransaction,
        addStaff,
        updateStaff,
        issueBookLoan,
        returnBookLoan,
        addAsset,
        addHealthRecord,
        sendAnnouncement,
        isAuthenticated,
        firebaseUser,
        authReady,
        isCloudSynced,
        isPlatformAdmin,
        platformOwnerEmail,
        signInPlatformOwnerWithEmail,
        signInWithGoogle,
        enterPortalAsPlatformOwner,
        loginWithEmail,
        logout,
        deleteStudent,
        deleteStaff,
        deleteAdmission,
        deleteAnnouncement,
        deleteAsset,
        deleteBook,
        resetToDemoData,
        exportDatabaseJSON,
        importDatabaseJSON,
        isModuleEnabled,
        toggleSchoolModule,
        customFeatureRequests,
        requestCustomFeature,
        platformOwnerProfile,
        updatePlatformOwnerProfile,
        photoChangeRequests,
        submitStudentPhotoRequest,
        reviewStudentPhotoRequest,
        reviewAdmissionPhoto,
        beceMockSeries,
        beceMockScores,
        beceInterventions,
        beceAiReports,
        createBeceMockSeries,
        updateBeceMockSeries,
        deleteBeceMockSeries,
        saveBeceMockScore,
        assignBeceIntervention,
        updateBeceIntervention,
        deleteBeceIntervention,
        saveBeceAiReport,
        hasPlatformOwnerPassword,
        resetAccountPassword,
        changeCurrentUserPassword,
        courseTracks,
        addCourseTrack,
        addCourseTracksBulk,
        updateCourseTrack,
        deleteCourseTrack,
        clearAutoCourseTracks,
        restoreDefaultCourseTracks,
        addSubject,
        addSubjectsBulk,
        updateSubject,
        deleteSubject,
        clearAutoSubjects,
        restoreDefaultSubjects,
        addTimetablePeriod,
        deleteTimetablePeriod,
        resolveTeacherDisplayName,
        applyOfferedSectionsPreset,
        addEducationalSection,
        updateEducationalSection,
        deleteEducationalSection,
        addGradeClass,
        updateGradeClass,
        deleteGradeClass,
        addClassStream,
        addClassStreamsBulk,
        updateClassStream,
        assignSubjectTeacherToStream,
        deleteClassStream,
        checkDuplicateStudentEnrolment,
        enrollStudentWithPlacement,
        reassignStudentClassStream,
        promoteOrTransferStudents,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
