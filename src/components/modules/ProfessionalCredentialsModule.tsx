import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  ProfessionalProgramme,
  ProgrammeCourse,
  ProgrammeCategoryType,
  AwardingAuthorityModel,
  ProgrammeLevelConfig,
  CandidatePaperStatus,
  ProfessionalMembershipStatus,
  CredentialDocumentType,
  CertificateValidityStatus,
  CertificateTemplateConfig,
  IssuedCredential,
  AuthorizedSignatory,
  InstitutionalAccreditation,
  INSTITUTE_CERTIFICATE_LEVEL,
  formatInstituteLevelShort,
} from '../../types';
import { SignaturePadModal } from '../modals/SignaturePadModal';
import { CertificateDocumentModal } from '../modals/CertificateDocumentModal';
import { CourseUploadModal } from '../modals/CourseUploadModal';
import { CourseDetailFlyerModal } from '../modals/CourseDetailFlyerModal';
import {
  Award,
  BookOpen,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  PenTool,
  ShieldCheck,
  GraduationCap,
  Plus,
  Search,
  Download,
  Printer,
  ArrowUpRight,
  History,
  RefreshCw,
  Trash2,
  Eye,
  FileText,
  Landmark,
  Sliders,
  X,
  Check,
  Upload,
  Edit3,
  Image as ImageIcon,
} from 'lucide-react';

type ActiveWorkspaceTab =
  | 'analytics'
  | 'programmes'
  | 'candidates'
  | 'progression'
  | 'certificates'
  | 'signatures'
  | 'alumni';

export const ProfessionalCredentialsModule: React.FC = () => {
  const {
    school,
    currentUser,
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
    processReplacementRequest,
    addAccreditation,
    updateAccreditation,
    setActiveModule,
  } = useSchool();

  const [activeTab, setActiveTab] = useState<ActiveWorkspaceTab>('analytics');
  const [bannerFeedback, setBannerFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    setBannerFeedback({ type, text });
    setTimeout(() => {
      setBannerFeedback((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Document viewer modal state
  const [viewingCredential, setViewingCredential] = useState<IssuedCredential | null>(null);
  const [viewingDocMode, setViewingDocMode] = useState<'certificate' | 'transcript' | 'letter' | 'badge'>('certificate');

  // Signature pad modal state
  const [sigModalOpen, setSigModalOpen] = useState(false);
  const [sigTargetMode, setSigTargetMode] = useState<'self' | 'signatory'>('self');
  const [editingSignatory, setEditingSignatory] = useState<AuthorizedSignatory | null>(null);
  const [newSignerName, setNewSignerName] = useState('');
  const [newSignerTitle, setNewSignerTitle] = useState('');
  const [newSignerRole, setNewSignerRole] = useState<AuthorizedSignatory['role']>('Lead Lecturer / Teacher');

  // ============================================================================
  // TAB 2: PROGRAMMES & COURSES STATE
  // ============================================================================
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>(programmes[0]?.id || '');
  const [selectedCourseLevel, setSelectedCourseLevel] = useState<number>(1);
  const [showCreateProgramme, setShowCreateProgramme] = useState(false);
  const [progForm, setProgForm] = useState({
    code: '',
    title: '',
    category: 'Professional Qualification' as ProgrammeCategoryType,
    qualificationAwarded: '',
    professionalDesignation: '',
    affiliatedProfessionalBody: '',
    awardingAuthorityModel: 'Dual: Institution Award + Professional Body Designation' as AwardingAuthorityModel,
    durationLabel: '3 Levels (18 - 36 Months)',
    entryRequirements: 'WASSCE / SSSCE passes in 5 subjects including English & Mathematics, or recognised Diploma/Degree.',
    assessmentMethods: '30% Continuous Assessment & Case Practicals, 70% Proctored Diet Examination.',
    examinationRegulations: 'Minimum 75% lecture attendance and identity verification required prior to examination sitting.',
    progressionRules: 'Candidates must pass or hold approved exemptions in all mandatory level papers before advancing.',
    completionRequirements: 'Successful completion of all programme levels, full fee clearance, and Senate/Board ratification.',
    feeClearanceRequired: true,
    structureMode: 'full_with_cert' as 'full_with_cert' | 'chartered_3' | 'cert_only' | 'diploma_2',
    passMarkPercent: 50,
    level1Fee: 2400,
    level2Fee: 2800,
    level3Fee: 3200,
    certFee: 1650,
  });

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ProgrammeCourse | null>(null);
  const [viewingCourseDetails, setViewingCourseDetails] = useState<ProgrammeCourse | null>(null);

  const activeProgramme: ProfessionalProgramme | undefined = useMemo(
    () => programmes.find((p) => p.id === selectedProgrammeId) || programmes[0],
    [programmes, selectedProgrammeId]
  );

  // ============================================================================
  // TAB 3: CANDIDATE REGISTRATION & MEMBERSHIP STATE
  // ============================================================================
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateLevelFilter, setCandidateLevelFilter] = useState<string>('All');
  const [showRegisterCandidate, setShowRegisterCandidate] = useState(false);
  const [candForm, setCandForm] = useState({
    firstName: '',
    lastName: '',
    gender: 'Female' as 'Male' | 'Female',
    dob: '1999-04-12',
    email: '',
    phone: '+233 24 000 0000',
    nationalIdNumber: 'GHA-721000000-1',
    identityDocumentType: 'Ghana Card (NIA)' as 'Ghana Card (NIA)' | 'Passport' | 'Birth Certificate / GES Index',
    identityVerified: true,
    previousQualifications: 'B.Sc. Administration (Accounting Option)',
    programmeId: programmes[0]?.id || '',
    currentLevel: 1,
    membershipStatus: 'Registered Student Candidate' as ProfessionalMembershipStatus,
    membershipNumber: '',
    totalFeesBilled: 2400,
    totalFeesPaid: 2400,
    directoryConsent: true,
    headlineOrRole: '',
  });

  // ============================================================================
  // TAB 4: EXAMINATIONS, MODERATION & PROGRESSION STATE
  // ============================================================================
  const [progExamFilterId, setProgExamFilterId] = useState<string>(programmes[0]?.id || '');
  const [levelExamFilter, setLevelExamFilter] = useState<number>(1);
  const [editingAssessmentKey, setEditingAssessmentKey] = useState<string | null>(null);
  const [assessmentDraft, setAssessmentDraft] = useState({
    candidateId: '',
    programmeId: '',
    courseId: '',
    levelNumber: 1,
    examDiet: 'May 2026 Diet',
    attendancePercent: 88,
    caScore: 24,
    practicalScore: 8,
    examScore: 44,
    paperStatus: 'Passed' as CandidatePaperStatus,
    exemptionBasis: '',
    invigilationNotes: '',
    moderated: true,
    appealNote: '',
    resitAttemptCount: 0,
  });

  // ============================================================================
  // TAB 5: DIGITAL CERTIFICATE ISSUANCE & AUDIT STATE
  // ============================================================================
  const [certSearch, setCertSearch] = useState('');
  const [certStatusFilter, setCertStatusFilter] = useState<string>('All');
  const [showIssuePanel, setShowIssuePanel] = useState(false);
  const [issueForm, setIssueForm] = useState({
    candidateId: candidates[0]?.id || '',
    credentialType: 'Full Qualification Certificate' as CredentialDocumentType,
    qualificationAwarded: programmes[0]?.qualificationAwarded || '',
    levelCompletedLabel: 'Full Programme Completed',
    honoursOrDistinction: 'With Merit',
    status: 'Valid' as CertificateValidityStatus,
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    customSerial: '',
    templateId: certificateTemplates[0]?.id || '',
    primarySignatoryId: signatories[0]?.id || '',
    secondarySignatoryId: signatories[1]?.id || '',
    approvalNote: 'Academic Senate & Examination Board verified completion of all required modules and financial clearance.',
  });

  const [statusModalCred, setStatusModalCred] = useState<IssuedCredential | null>(null);
  const [newStatusTarget, setNewStatusTarget] = useState<CertificateValidityStatus>('Valid');
  const [statusReasonInput, setStatusReasonInput] = useState('');
  const [auditDrawerCred, setAuditDrawerCred] = useState<IssuedCredential | null>(null);

  // ============================================================================
  // TAB 6: TEMPLATE DESIGNER STATE
  // ============================================================================
  const activeTemplate: CertificateTemplateConfig = certificateTemplates[0] || {
    id: `tpl-${school.id}`,
    schoolId: school.id,
    name: `${school.name} Official Charter Template`,
    themeStyle: 'emerald-gold',
    orientation: 'landscape',
    headerSubtitle: 'Official Credential & Academic Charter',
    sealLabel: `${school.code.split('-')[0]} OFFICIAL SEAL`,
    showQrCode: true,
    showCandidateId: true,
    showLevelCompleted: true,
    showCreditHours: true,
    showAuthorityDisclaimer: true,
    authorityDisclaimerText:
      'Academic qualification conferred under the charter of the issuing institution. Professional body statutory designations remain governed by the relevant professional regulatory council.',
    primarySignatoryId: signatories[0]?.id,
    secondarySignatoryId: signatories[1]?.id,
  };

  const [tplDraft, setTplDraft] = useState<CertificateTemplateConfig>(activeTemplate);

  // ============================================================================
  // TAB 7: ALUMNI REGISTER & ACCREDITATION STATE
  // ============================================================================
  const [alumniSearch, setAlumniSearch] = useState('');
  const [alumniYearFilter, setAlumniYearFilter] = useState<string>('All');
  const [alumniProgFilter, setAlumniProgFilter] = useState<string>('All');
  const [showAddAccreditation, setShowAddAccreditation] = useState(false);
  const [accForm, setAccForm] = useState({
    authorityName: 'Ghana Tertiary Education Commission (GTEC)',
    accreditationType: 'Programme Accreditation' as InstitutionalAccreditation['accreditationType'],
    referenceNumber: '',
    scopeOrProgramme: '',
    awardingPowerSummary: 'Authorised to instruct, examine, and award institutional diplomas and professional certificates.',
    issueDate: '2025-01-15',
    renewalDate: '2030-01-14',
    status: 'Active' as InstitutionalAccreditation['status'],
  });

  // ============================================================================
  // COMPUTED ANALYTICS & EVALUATIONS
  // ============================================================================
  const candidateEvaluations = useMemo(() => {
    const map = new Map<string, ReturnType<typeof evaluateCandidateProgression>>();
    candidates.forEach((c) => {
      map.set(c.id, evaluateCandidateProgression(c.id));
    });
    return map;
  }, [candidates, candidateAssessments, programmes, programmeCourses]);

  const analyticsMetrics = useMemo(() => {
    const totalCandidates = candidates.length;
    const activeCandidates = candidates.filter((c) => c.status === 'Active').length;
    const totalAssessments = candidateAssessments.length;
    const passedOrExempt = candidateAssessments.filter(
      (a) => a.paperStatus === 'Passed' || a.paperStatus === 'Exempted'
    ).length;
    const passRate = totalAssessments > 0 ? Math.round((passedOrExempt / totalAssessments) * 100) : 0;

    const validCerts = issuedCredentials.filter((c) => c.status === 'Valid').length;
    const pendingCerts = issuedCredentials.filter((c) => c.status === 'Pending Approval').length;
    const revokedOrReplaced = issuedCredentials.filter(
      (c) => c.status === 'Revoked' || c.status === 'Replaced' || c.status === 'Expired'
    ).length;

    const level1Count = candidates.filter((c) => c.currentLevel === 1 && c.status === 'Active').length;
    const level2Count = candidates.filter((c) => c.currentLevel === 2 && c.status === 'Active').length;
    const level3Count = candidates.filter((c) => c.currentLevel === 3 && c.status === 'Active').length;
    const certificateCount = candidates.filter(
      (c) => c.currentLevel === INSTITUTE_CERTIFICATE_LEVEL && c.status === 'Active'
    ).length;

    const gradEligible = candidates.filter((c) => candidateEvaluations.get(c.id)?.eligibleForGraduation && c.status !== 'Completed / Graduated');
    const nextLevelEligible = candidates.filter((c) => candidateEvaluations.get(c.id)?.eligibleForNextLevel);
    const outstandingCandidates = candidates.filter((c) => {
      const ev = candidateEvaluations.get(c.id);
      return c.status === 'Active' && ev && !ev.eligibleForGraduation && !ev.eligibleForNextLevel;
    });

    return {
      totalCandidates,
      activeCandidates,
      totalAssessments,
      passRate,
      validCerts,
      pendingCerts,
      revokedOrReplaced,
      level1Count,
      level2Count,
      level3Count,
      certificateCount,
      gradEligible,
      nextLevelEligible,
      outstandingCandidates,
    };
  }, [candidates, candidateAssessments, issuedCredentials, candidateEvaluations]);

  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================
  const handleCreateProgramme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progForm.code.trim() || !progForm.title.trim() || !progForm.qualificationAwarded.trim()) {
      notify('Please provide Programme Code, Title, and Institutional Qualification Awarded.', 'error');
      return;
    }
    const levels: ProgrammeLevelConfig[] = [];
    if (progForm.structureMode === 'cert_only') {
      levels.push({
        levelNumber: INSTITUTE_CERTIFICATE_LEVEL,
        levelTitle: 'Certificate (Non-Chartered Programme)',
        creditHoursRequired: 36,
        passMarkPercent: progForm.passMarkPercent,
        maxAllowedResits: 2,
        levelFeeAmount: progForm.certFee,
        awardOnLevelCompletion: progForm.qualificationAwarded.trim(),
      });
    } else {
      const maxTier = progForm.structureMode === 'diploma_2' ? 2 : 3;
      for (let i = 1; i <= maxTier; i++) {
        const label =
          i === 1
            ? 'Level 1 (Foundation)'
            : i === 2
            ? 'Level 2 (Intermediate / Managerial)'
            : 'Level 3 (Advanced / Professional)';
        const fee = i === 1 ? progForm.level1Fee : i === 2 ? progForm.level2Fee : progForm.level3Fee;
        levels.push({
          levelNumber: i,
          levelTitle: label,
          creditHoursRequired: 45,
          passMarkPercent: progForm.passMarkPercent,
          maxAllowedResits: 3,
          levelFeeAmount: fee,
          awardOnLevelCompletion: `${label} Certificate — ${progForm.title}`,
        });
      }
      if (progForm.structureMode === 'full_with_cert') {
        levels.push({
          levelNumber: INSTITUTE_CERTIFICATE_LEVEL,
          levelTitle: 'Certificate (Non-Chartered Track)',
          creditHoursRequired: 36,
          passMarkPercent: progForm.passMarkPercent,
          maxAllowedResits: 2,
          levelFeeAmount: progForm.certFee,
          awardOnLevelCompletion: `Certificate of Competence — ${progForm.title} (Non-Chartered)`,
        });
      }
    }

    const totalCredits = levels.reduce((sum, l) => sum + l.creditHoursRequired, 0);

    const created = addProgramme({
      code: progForm.code.trim().toUpperCase(),
      title: progForm.title.trim(),
      category: progForm.structureMode === 'cert_only' ? 'Certificate Programme' : progForm.category,
      qualificationAwarded: progForm.qualificationAwarded.trim(),
      professionalDesignation: progForm.professionalDesignation.trim() || undefined,
      affiliatedProfessionalBody: progForm.affiliatedProfessionalBody.trim() || undefined,
      awardingAuthorityModel: progForm.awardingAuthorityModel,
      durationLabel: progForm.durationLabel,
      totalCreditHours: totalCredits,
      entryRequirements: progForm.entryRequirements,
      assessmentMethods: progForm.assessmentMethods,
      examinationRegulations: progForm.examinationRegulations,
      progressionRules: progForm.progressionRules,
      completionRequirements: progForm.completionRequirements,
      feeClearanceRequired: progForm.feeClearanceRequired,
      levels,
      status: 'Active',
    });

    setSelectedProgrammeId(created.id);
    setSelectedCourseLevel(levels[0]?.levelNumber || 1);
    setShowCreateProgramme(false);
    notify(`Programme "${created.title}" (${created.code}) created with ${levels.map((l) => formatInstituteLevelShort(l.levelNumber)).join(', ')}.`);
  };

  const handleSaveCourseFromModal = (
    courseData: Omit<ProgrammeCourse, 'id' | 'schoolId'>,
    existingId?: string
  ) => {
    const targetProg = programmes.find((p) => p.id === courseData.programmeId);
    if (targetProg && !targetProg.levels.some((l) => l.levelNumber === courseData.levelNumber)) {
      const addedLevel: ProgrammeLevelConfig =
        courseData.levelNumber === INSTITUTE_CERTIFICATE_LEVEL
          ? {
              levelNumber: INSTITUTE_CERTIFICATE_LEVEL,
              levelTitle: 'Certificate (Non-Chartered Track)',
              creditHoursRequired: 36,
              passMarkPercent: 50,
              maxAllowedResits: 2,
              levelFeeAmount: 1650,
              awardOnLevelCompletion: `Certificate of Competence — ${targetProg.title} (Non-Chartered)`,
            }
          : {
              levelNumber: courseData.levelNumber,
              levelTitle: `Level ${courseData.levelNumber}`,
              creditHoursRequired: 45,
              passMarkPercent: 50,
              maxAllowedResits: 3,
              levelFeeAmount: 2400,
              awardOnLevelCompletion: `Level ${courseData.levelNumber} Certificate`,
            };
      updateProgramme(targetProg.id, {
        levels: [...targetProg.levels, addedLevel].sort((a, b) => a.levelNumber - b.levelNumber),
      });
    }

    if (existingId) {
      updateProgrammeCourse(existingId, courseData);
      notify(
        `Updated course ${courseData.code} (${formatInstituteLevelShort(courseData.levelNumber)}) with details, rationale, objectives & flyer.`
      );
    } else {
      const created = addProgrammeCourse(courseData);
      setSelectedProgrammeId(created.programmeId);
      setSelectedCourseLevel(created.levelNumber);
      notify(
        `Uploaded course ${created.code} to ${formatInstituteLevelShort(created.levelNumber)} with syllabus details, objectives & flyer.`
      );
    }
    setEditingCourse(null);
  };

  const handleBulkImportCourses = (imported: Omit<ProgrammeCourse, 'id' | 'schoolId'>[]) => {
    imported.forEach((item) => {
      addProgrammeCourse(item);
    });
    notify(`Imported ${imported.length} course(s) with rationale, objectives, and branded flyers.`);
  };

  const handleRegisterCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candForm.firstName.trim() || !candForm.lastName.trim() || !candForm.programmeId) {
      notify('Candidate first name, last name, and programme selection are required.', 'error');
      return;
    }
    const email =
      candForm.email.trim() ||
      `${candForm.firstName.toLowerCase()}.${candForm.lastName.toLowerCase()}@candidate.${school.code.split('-')[0].toLowerCase()}.edu.gh`;

    const created = registerCandidate({
      firstName: candForm.firstName.trim(),
      lastName: candForm.lastName.trim(),
      gender: candForm.gender,
      dob: candForm.dob,
      email,
      phone: candForm.phone,
      photo:
        candForm.gender === 'Female'
          ? 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80'
          : 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=200&q=80',
      nationalIdNumber: candForm.nationalIdNumber,
      identityDocumentType: candForm.identityDocumentType,
      identityVerified: candForm.identityVerified,
      previousQualifications: candForm.previousQualifications,
      programmeId: candForm.programmeId,
      currentLevel: Number(candForm.currentLevel),
      completedLevels:
        Number(candForm.currentLevel) === INSTITUTE_CERTIFICATE_LEVEL
          ? []
          : Number(candForm.currentLevel) > 1
          ? Array.from({ length: Number(candForm.currentLevel) - 1 }, (_, idx) => idx + 1)
          : [],
      status: 'Active',
      membershipStatus: candForm.membershipStatus,
      membershipNumber: candForm.membershipNumber.trim() || undefined,
      totalFeesBilled: Number(candForm.totalFeesBilled) || 0,
      totalFeesPaid: Number(candForm.totalFeesPaid) || 0,
      directoryConsent: candForm.directoryConsent,
      headlineOrRole: candForm.headlineOrRole.trim() || undefined,
    });

    setShowRegisterCandidate(false);
    setCandForm({ ...candForm, firstName: '', lastName: '', email: '', membershipNumber: '' });
    notify(`Candidate ${created.firstName} ${created.lastName} registered with unique ID ${created.candidateNumber}. Student portal login enabled.`);
  };

  const openAssessmentEditor = (candidateId: string, programmeId: string, courseId: string, levelNumber: number) => {
    const existing = candidateAssessments.find(
      (a) => a.candidateId === candidateId && a.courseId === courseId
    );
    setEditingAssessmentKey(`${candidateId}::${courseId}`);
    if (existing) {
      setAssessmentDraft({
        candidateId,
        programmeId,
        courseId,
        levelNumber,
        examDiet: existing.examDiet,
        attendancePercent: existing.attendancePercent,
        caScore: existing.caScore,
        practicalScore: existing.practicalScore,
        examScore: existing.examScore,
        paperStatus: existing.paperStatus,
        exemptionBasis: existing.exemptionBasis || '',
        invigilationNotes: existing.invigilationNotes || '',
        moderated: existing.moderated,
        appealNote: existing.appealNote || '',
        resitAttemptCount: existing.resitAttemptCount,
      });
    } else {
      setAssessmentDraft({
        candidateId,
        programmeId,
        courseId,
        levelNumber,
        examDiet: 'May 2026 Diet',
        attendancePercent: 85,
        caScore: 22,
        practicalScore: 8,
        examScore: 42,
        paperStatus: 'Passed',
        exemptionBasis: '',
        invigilationNotes: '',
        moderated: true,
        appealNote: '',
        resitAttemptCount: 0,
      });
    }
  };

  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const total =
      assessmentDraft.paperStatus === 'Exempted'
        ? 0
        : Math.min(100, Number(assessmentDraft.caScore) + Number(assessmentDraft.practicalScore) + Number(assessmentDraft.examScore));
    const grade =
      assessmentDraft.paperStatus === 'Exempted'
        ? 'EXEMPT'
        : total >= 75
        ? 'Distinction'
        : total >= 65
        ? 'Merit'
        : total >= 50
        ? 'Pass'
        : 'Fail / Resit';

    const autoStatus: CandidatePaperStatus =
      assessmentDraft.paperStatus === 'Exempted' ||
      assessmentDraft.paperStatus === 'Deferred' ||
      assessmentDraft.paperStatus === 'Under Moderation' ||
      assessmentDraft.paperStatus === 'Appeal Lodged'
        ? assessmentDraft.paperStatus
        : total >= 50
        ? 'Passed'
        : 'Resit Required';

    saveCandidateAssessment({
      candidateId: assessmentDraft.candidateId,
      programmeId: assessmentDraft.programmeId,
      courseId: assessmentDraft.courseId,
      levelNumber: assessmentDraft.levelNumber,
      examDiet: assessmentDraft.examDiet,
      attendancePercent: Number(assessmentDraft.attendancePercent),
      caScore: Number(assessmentDraft.caScore),
      practicalScore: Number(assessmentDraft.practicalScore),
      examScore: Number(assessmentDraft.examScore),
      totalScore: total,
      grade,
      paperStatus: autoStatus,
      exemptionBasis: assessmentDraft.exemptionBasis.trim() || undefined,
      invigilationNotes: assessmentDraft.invigilationNotes.trim() || undefined,
      moderated: assessmentDraft.moderated,
      moderatedBy: assessmentDraft.moderated ? currentUser.name : undefined,
      appealNote: assessmentDraft.appealNote.trim() || undefined,
      resitAttemptCount: Number(assessmentDraft.resitAttemptCount) || 0,
    });

    setEditingAssessmentKey(null);
    notify('Candidate examination paper marks and moderation record saved.');
  };

  const openIssueModalForCandidate = (candidateId: string) => {
    const cand = candidates.find((c) => c.id === candidateId);
    const prog = programmes.find((p) => p.id === cand?.programmeId);
    setIssueForm({
      ...issueForm,
      candidateId,
      qualificationAwarded: prog?.qualificationAwarded || 'Professional Qualification Certificate',
      levelCompletedLabel: prog
        ? cand?.currentLevel === INSTITUTE_CERTIFICATE_LEVEL
          ? 'Certificate Programme (Non-Chartered) — Full Completion'
          : `${formatInstituteLevelShort(cand?.currentLevel || 3)} — Full Programme Completion`
        : 'Full Programme Completion',
      templateId: certificateTemplates[0]?.id || '',
      primarySignatoryId: signatories[0]?.id || '',
      secondarySignatoryId: signatories[1]?.id || '',
    });
    setActiveTab('certificates');
    setShowIssuePanel(true);
  };

  const handleIssueCredential = (e: React.FormEvent) => {
    e.preventDefault();
    const cand = candidates.find((c) => c.id === issueForm.candidateId);
    if (!cand) {
      notify('Please select a registered candidate.', 'error');
      return;
    }
    const prog = programmes.find((p) => p.id === cand.programmeId);
    const selectedSigs: IssuedCredential['signatoriesSnapshot'] = [];
    const s1 = signatories.find((s) => s.id === issueForm.primarySignatoryId);
    const s2 = signatories.find((s) => s.id === issueForm.secondarySignatoryId);
    if (s1) selectedSigs.push({ name: s1.name, title: s1.title, signatureDataUrl: s1.signatureDataUrl });
    if (s2 && s2.id !== s1?.id) {
      selectedSigs.push({ name: s2.name, title: s2.title, signatureDataUrl: s2.signatureDataUrl });
    }
    if (selectedSigs.length === 0 && currentUser.signatureDataUrl) {
      selectedSigs.push({
        name: currentUser.name,
        title: currentUser.title,
        signatureDataUrl: currentUser.signatureDataUrl,
      });
    }

    const res = issueDigitalCredential({
      candidateId: cand.id,
      candidateNumber: cand.candidateNumber,
      recipientFullName: `${cand.firstName} ${cand.lastName}`,
      programmeId: prog?.id || cand.programmeId,
      programmeTitle: prog?.title || 'Institutional Certification Programme',
      credentialType: issueForm.credentialType,
      qualificationAwarded: issueForm.qualificationAwarded.trim() || prog?.qualificationAwarded || 'Official Certificate',
      levelCompletedLabel: issueForm.levelCompletedLabel,
      honoursOrDistinction: issueForm.honoursOrDistinction.trim() || undefined,
      creditHoursCompleted: prog?.totalCreditHours || 120,
      issueDate: issueForm.issueDate,
      expiryDate: issueForm.expiryDate || undefined,
      status: issueForm.status,
      awardingAuthorityName: school.name,
      professionalBodyAffiliationNote: prog?.affiliatedProfessionalBody
        ? `Institutional qualification conferred by ${school.name}. Professional designation (${prog.professionalDesignation || 'Chartered Membership'}) is regulated by ${prog.affiliatedProfessionalBody}.`
        : undefined,
      templateId: issueForm.templateId || activeTemplate.id,
      signatoriesSnapshot: selectedSigs,
      certificateNumber: issueForm.customSerial.trim() || undefined,
      approvalNote: issueForm.approvalNote,
    });

    if (!res.success || !res.credential) {
      notify(res.error || 'Unable to issue credential.', 'error');
      return;
    }

    setShowIssuePanel(false);
    setViewingDocMode('certificate');
    setViewingCredential(res.credential);
    notify(
      `Issued ${res.credential.certificateNumber} (Verification: ${res.credential.verificationCode}). ${
        res.credential.status === 'Valid' ? 'Graduate transferred to permanent Alumni Register.' : 'Queued for final approval.'
      }`
    );
  };

  const handleConfirmStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalCred) return;
    if (!statusReasonInput.trim()) {
      notify('An explicit authorisation reason is mandatory for the audit log.', 'error');
      return;
    }
    updateCredentialStatus(statusModalCred.id, newStatusTarget, statusReasonInput.trim());
    notify(`Certificate ${statusModalCred.certificateNumber} status updated to "${newStatusTarget}" and recorded in audit trail.`);
    setStatusModalCred(null);
    setStatusReasonInput('');
  };

  const exportCsvFile = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escapeCell = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAlumniCsv = () => {
    exportCsvFile(
      `${school.code.toLowerCase()}_alumni_register_${new Date().toISOString().split('T')[0]}.csv`,
      [
        'Candidate Number',
        'Graduate Full Name',
        'Programme Completed',
        'Qualification Awarded',
        'Level Attained',
        'Graduation Year',
        'Certificate Serial',
        'Verification Code',
        'Certificate Status',
        'Professional Membership Status',
        'Directory Consent',
      ],
      filteredAlumni.map((g) => [
        g.candidateNumber,
        g.fullName,
        g.programmeTitle,
        g.qualificationAwarded,
        g.levelAttained,
        g.graduationYear,
        g.certificateNumber,
        g.verificationCode,
        g.certificateStatus,
        g.membershipStatus,
        g.directoryConsent ? 'Public Opt-In' : 'Private',
      ])
    );
    notify('Exported Graduate & Alumni Register CSV.');
  };

  const handleExportAnalyticsCsv = () => {
    exportCsvFile(
      `${school.code.toLowerCase()}_credential_analytics_${new Date().toISOString().split('T')[0]}.csv`,
      ['Metric', 'Value', 'Institution', 'Academic Year'],
      [
        ['Active Programmes', programmes.length, school.name, school.currentAcademicYear],
        ['Registered Candidates', analyticsMetrics.totalCandidates, school.name, school.currentAcademicYear],
        ['Course Assessments Logged', analyticsMetrics.totalAssessments, school.name, school.currentAcademicYear],
        ['Overall Examination Pass Rate (%)', analyticsMetrics.passRate, school.name, school.currentAcademicYear],
        ['Valid Issued Credentials', analyticsMetrics.validCerts, school.name, school.currentAcademicYear],
        ['Pending Approval Credentials', analyticsMetrics.pendingCerts, school.name, school.currentAcademicYear],
        ['Permanent Alumni Records', graduateRecords.length, school.name, school.currentAcademicYear],
        ['Employer Verification Queries Logged', verificationLogs.length, school.name, school.currentAcademicYear],
      ]
    );
    notify('Exported institutional analytics summary CSV.');
  };

  // Filtered Lists
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const q = candidateSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.candidateNumber.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);
      const matchLevel = candidateLevelFilter === 'All' || String(c.currentLevel) === candidateLevelFilter;
      return matchQuery && matchLevel;
    });
  }, [candidates, candidateSearch, candidateLevelFilter]);

  const filteredCredentials = useMemo(() => {
    return issuedCredentials.filter((cred) => {
      const q = certSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        cred.certificateNumber.toLowerCase().includes(q) ||
        cred.verificationCode.toLowerCase().includes(q) ||
        cred.recipientFullName.toLowerCase().includes(q) ||
        cred.candidateNumber.toLowerCase().includes(q);
      const matchStatus = certStatusFilter === 'All' || cred.status === certStatusFilter;
      return matchQuery && matchStatus;
    });
  }, [issuedCredentials, certSearch, certStatusFilter]);

  const filteredAlumni = useMemo(() => {
    return graduateRecords.filter((g) => {
      const q = alumniSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        g.fullName.toLowerCase().includes(q) ||
        g.candidateNumber.toLowerCase().includes(q) ||
        g.certificateNumber.toLowerCase().includes(q) ||
        g.qualificationAwarded.toLowerCase().includes(q);
      const matchYear = alumniYearFilter === 'All' || String(g.graduationYear) === alumniYearFilter;
      const matchProg = alumniProgFilter === 'All' || g.programmeId === alumniProgFilter;
      return matchQuery && matchYear && matchProg;
    });
  }, [graduateRecords, alumniSearch, alumniYearFilter, alumniProgFilter]);

  const selectedCandidateEvaluation = issueForm.candidateId
    ? candidateEvaluations.get(issueForm.candidateId)
    : null;

  const statusTextColor = (status: CertificateValidityStatus) => {
    switch (status) {
      case 'Valid':
        return 'text-emerald-400';
      case 'Pending Approval':
        return 'text-amber-400';
      case 'Revoked':
        return 'text-rose-400';
      case 'Replaced':
        return 'text-sky-400';
      case 'Expired':
        return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Contextual Workspace Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>{school.levelType}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{school.code}</span>
            <span aria-hidden="true">·</span>
            <span>Digital Credentials &amp; Certification Governance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Programmes, Digital Signatures &amp; Credential Registry
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSigTargetMode('self');
              setEditingSignatory(null);
              setSigModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <PenTool className="w-3.5 h-3.5 text-emerald-400" />
            <span>My Signature ({currentUser.signatureDataUrl ? 'Saved' : 'Sign Now'})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('employer-verification')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Public Verification Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('certificates');
              setShowIssuePanel(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Issue &amp; Print Certificate</span>
          </button>
        </div>
      </div>

      {/* Feedback Notification Banner */}
      {bannerFeedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
            bannerFeedback.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/50 border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{bannerFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerFeedback(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Segmented Navigation Bar */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        {[
          { id: 'analytics', label: 'Analytics & Reports', icon: Sliders },
          { id: 'programmes', label: `Programmes & Courses (${programmes.length})`, icon: BookOpen },
          { id: 'candidates', label: `Candidates & Membership (${candidates.length})`, icon: Users },
          { id: 'progression', label: 'Exams & Level Progression', icon: FileSpreadsheet },
          {
            id: 'certificates',
            label: `Certificates & Audit (${issuedCredentials.length})`,
            icon: Award,
          },
          { id: 'signatures', label: `Signatures & Templates (${signatories.length})`, icon: PenTool },
          { id: 'alumni', label: `Alumni & Accreditation (${graduateRecords.length})`, icon: GraduationCap },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ActiveWorkspaceTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ====================================================================== */}
      {/* TAB 1: ANALYTICS & INSTITUTIONAL REPORTS                               */}
      {/* ====================================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* 4-Column Flat KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-xs text-slate-400 font-medium">Programmes &amp; Curriculum</p>
              <p className="text-2xl font-bold text-white mt-2 font-mono tabular-nums">
                {programmes.length} <span className="text-sm font-normal text-slate-400">Programmes</span>
              </p>
              <div className="mt-2 text-xs text-slate-400 tabular-nums">
                <span>{programmeCourses.length} Scheduled Courses</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>{accreditations.length} Charters</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-xs text-slate-400 font-medium">Candidate Enrolment</p>
              <p className="text-2xl font-bold text-white mt-2 font-mono tabular-nums">
                {analyticsMetrics.totalCandidates}
              </p>
              <div className="mt-2 text-xs text-slate-400 tabular-nums">
                <span className="text-emerald-400">{analyticsMetrics.activeCandidates} Active</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>{graduateRecords.length} Alumni</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-xs text-slate-400 font-medium">Exam Participation &amp; Pass Rate</p>
              <p className="text-2xl font-bold text-emerald-400 mt-2 font-mono tabular-nums">
                {analyticsMetrics.passRate}%
              </p>
              <div className="mt-2 text-xs text-slate-400 tabular-nums">
                <span>{analyticsMetrics.totalAssessments} Paper Sittings</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>{analyticsMetrics.nextLevelEligible.length} Ready to Advance</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-xs text-slate-400 font-medium">Credentials &amp; Verifications</p>
              <p className="text-2xl font-bold text-white mt-2 font-mono tabular-nums">
                {issuedCredentials.length}
              </p>
              <div className="mt-2 text-xs text-slate-400 tabular-nums">
                <span className="text-emerald-400">{analyticsMetrics.validCerts} Valid</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>{verificationLogs.length} Employer Checks</span>
              </div>
            </div>
          </div>

          {/* Progression Pipeline + Credential Governance Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-sm font-bold text-white">Multi-Level Candidate Progression Pipeline</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Real-time distribution across Foundation, Intermediate, Advanced levels, and Permanent Alumni
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('progression')}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>Open Progression Engine</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-800 mt-2">
                  {[
                    {
                      stage: '01. Level 1 (Foundation Cohort)',
                      count: analyticsMetrics.level1Count,
                      note: 'Entry curriculum & core principles',
                    },
                    {
                      stage: '02. Level 2 (Intermediate / Managerial)',
                      count: analyticsMetrics.level2Count,
                      note: 'Applied practice & case assessments',
                    },
                    {
                      stage: '03. Level 3 (Advanced / Chartered Finalists)',
                      count: analyticsMetrics.level3Count,
                      note: `${analyticsMetrics.gradEligible.length} eligible for immediate graduation`,
                    },
                    {
                      stage: '04. Certificate (Standalone Non-Chartered Track)',
                      count: analyticsMetrics.certificateCount,
                      note: 'Direct executive & vocational certificate cohort',
                    },
                    {
                      stage: '05. Completed & Transferred to Alumni Register',
                      count: graduateRecords.length,
                      note: 'Permanent verifiable digital credentials issued',
                    },
                  ].map((row) => {
                    const denom = Math.max(1, analyticsMetrics.totalCandidates + graduateRecords.length);
                    const pct = Math.min(100, Math.round((row.count / denom) * 100));
                    return (
                      <div key={row.stage} className="py-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-100">{row.stage}</span>
                            <span className="mx-2 text-slate-600" aria-hidden="true">·</span>
                            <span className="text-slate-400">{row.note}</span>
                          </div>
                          <span className="font-mono tabular-nums font-bold text-white">
                            {row.count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.max(pct, row.count > 0 ? 8 : 0)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-slate-400 tabular-nums">
                  <span>Pending Replacement Requests: {replacementRequests.filter((r) => r.status === 'Pending Review').length}</span>
                  <span className="mx-2" aria-hidden="true">·</span>
                  <span>Pending Approval Certificates: {analyticsMetrics.pendingCerts}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportAnalyticsCsv}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Print Summary</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Recent Employer & Third-Party Verification Activity */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-sm font-bold text-white">Employer Verification Audit Log</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Third-party authenticity checks logged under Act 843 privacy rules
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-emerald-400">
                    {verificationLogs.length} Queries
                  </span>
                </div>

                {verificationLogs.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    No external verification queries logged yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800 mt-1 max-h-72 overflow-y-auto">
                    {verificationLogs.slice(0, 6).map((log) => (
                      <div key={log.id} className="py-3 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-white truncate">{log.verifierOrganization}</span>
                          <span
                            className={`font-mono tabular-nums font-semibold shrink-0 ${
                              log.resultStatus === 'Valid'
                                ? 'text-emerald-400'
                                : log.resultStatus === 'Not Found' || log.resultStatus === 'Revoked'
                                ? 'text-rose-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {log.resultStatus}
                          </span>
                        </div>
                        <div className="text-slate-400 flex items-center gap-1.5 flex-wrap font-mono tabular-nums text-[11px]">
                          <span>{log.queriedReference}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-sans">{log.lookupMode}</span>
                          <span aria-hidden="true">·</span>
                          <span>{log.timestamp.replace('T', ' ').slice(0, 16)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Marks &amp; financial records are redacted on public checks</span>
                <button
                  type="button"
                  onClick={() => setActiveModule('employer-verification')}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  Test Lookup
                </button>
              </div>
            </div>
          </div>

          {/* Outstanding Requirements & Graduation Action Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Candidate Progression &amp; Graduation Readiness Snapshot
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated evaluation of mandatory courses, resits, identity checks, and financial clearance
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('candidates')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer whitespace-nowrap shrink-0"
              >
                Manage All Candidates
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                    <th className="py-3 px-4 font-semibold">Candidate</th>
                    <th className="py-3 px-4 font-semibold">Candidate ID</th>
                    <th className="py-3 px-4 font-semibold">Current Level</th>
                    <th className="py-3 px-4 font-semibold text-right">Papers Passed</th>
                    <th className="py-3 px-4 font-semibold text-right">Fee Balance (GHS)</th>
                    <th className="py-3 px-4 font-semibold">Progression Determination</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {candidates.slice(0, 8).map((cand) => {
                    const ev = candidateEvaluations.get(cand.id);
                    const feeBal = Math.max(0, cand.totalFeesBilled - cand.totalFeesPaid);
                    return (
                      <tr key={cand.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          {cand.firstName} {cand.lastName}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-300">
                          {cand.candidateNumber}
                        </td>
                        <td className="py-3 px-4 tabular-nums text-slate-300">
                          {formatInstituteLevelShort(cand.currentLevel)} · {cand.status}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-200">
                          {ev ? `${ev.passedOrExemptCount}/${ev.mandatoryCoursesCount}` : '0/0'}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono tabular-nums font-semibold ${
                            feeBal === 0 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {feeBal.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={ev?.statusSummary}>
                          {ev?.statusSummary || 'Enrolled'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {cand.status === 'Completed / Graduated' ? (
                            <span className="text-emerald-400 font-semibold">Graduated</span>
                          ) : ev?.eligibleForGraduation ? (
                            <button
                              type="button"
                              onClick={() => openIssueModalForCandidate(cand.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-semibold cursor-pointer whitespace-nowrap"
                            >
                              Issue Certificate
                            </button>
                          ) : ev?.eligibleForNextLevel ? (
                            <button
                              type="button"
                              onClick={() => {
                                const ok = promoteCandidateToNextLevel(cand.id);
                                if (ok) notify(`${cand.firstName} ${cand.lastName} promoted to Level ${cand.currentLevel + 1}.`);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-md font-semibold cursor-pointer whitespace-nowrap"
                            >
                              Promote to L{cand.currentLevel + 1}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setProgExamFilterId(cand.programmeId);
                                setLevelExamFilter(cand.currentLevel);
                                setActiveTab('progression');
                              }}
                              className="text-slate-400 hover:text-white underline cursor-pointer whitespace-nowrap"
                            >
                              Review Papers
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 2: MULTI-LEVEL PROGRAMMES & COURSE ADMINISTRATION                  */}
      {/* ====================================================================== */}
      {activeTab === 'programmes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {programmes.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedProgrammeId(p.id);
                    setSelectedCourseLevel(p.levels[0]?.levelNumber || 1);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap shrink-0 ${
                    activeProgramme?.id === p.id
                      ? 'bg-emerald-950/70 border-emerald-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="font-mono mr-1.5 text-emerald-400">{p.code}</span>
                  <span>{p.title}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {activeProgramme && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCourse(null);
                    setCourseModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-600/50 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Course &amp; Flyer</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowCreateProgramme(!showCreateProgramme)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Programme</span>
              </button>
            </div>
          </div>

          {/* Create Programme Collapsible Form */}
          {showCreateProgramme && (
            <form
              onSubmit={handleCreateProgramme}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Configure Multi-Level Certification / Academic Programme</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateProgramme(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Programme Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CFA-PRO-02"
                    value={progForm.code}
                    onChange={(e) => setProgForm({ ...progForm, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Programme Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Post-Graduate Diploma in Forensic Audit & Cyber Compliance"
                    value={progForm.title}
                    onChange={(e) => setProgForm({ ...progForm, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Programme Classification</label>
                  <select
                    value={progForm.category}
                    onChange={(e) => setProgForm({ ...progForm, category: e.target.value as ProgrammeCategoryType })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Professional Qualification">Professional Qualification</option>
                    <option value="Diploma Programme">Diploma Programme</option>
                    <option value="Certificate Programme">Certificate Programme</option>
                    <option value="Executive Education">Executive Education</option>
                    <option value="Vocational & Technical">Vocational &amp; Technical</option>
                    <option value="Short Course">Short Course</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Qualification Awarded by Institution
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Professional Diploma in Forensic Audit & Tax Investigation"
                    value={progForm.qualificationAwarded}
                    onChange={(e) => setProgForm({ ...progForm, qualificationAwarded: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Awarding Authority Model</label>
                  <select
                    value={progForm.awardingAuthorityModel}
                    onChange={(e) =>
                      setProgForm({ ...progForm, awardingAuthorityModel: e.target.value as AwardingAuthorityModel })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Institution Direct Award">Institution Direct Award</option>
                    <option value="Affiliated Awarding Body">Affiliated Awarding Body</option>
                    <option value="Dual: Institution Award + Professional Body Designation">
                      Dual: Institution Award + Professional Body Designation
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Affiliated Professional Body (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chartered Institute of Taxation, Ghana"
                    value={progForm.affiliatedProfessionalBody}
                    onChange={(e) => setProgForm({ ...progForm, affiliatedProfessionalBody: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    External Body Designation (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ACTG (Awarded by Statutory Council)"
                    value={progForm.professionalDesignation}
                    onChange={(e) => setProgForm({ ...progForm, professionalDesignation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Programme Levels (Levels 1–3 &amp; Certificate)
                  </label>
                  <select
                    value={progForm.structureMode}
                    onChange={(e) =>
                      setProgForm({
                        ...progForm,
                        structureMode: e.target.value as typeof progForm.structureMode,
                        category:
                          e.target.value === 'cert_only' ? 'Certificate Programme' : progForm.category,
                        awardingAuthorityModel:
                          e.target.value === 'cert_only'
                            ? 'Institution Direct Award'
                            : progForm.awardingAuthorityModel,
                        durationLabel:
                          e.target.value === 'cert_only'
                            ? 'Certificate Track (3 - 6 Months)'
                            : 'Levels 1, 2, 3 & Certificate Track',
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white tabular-nums"
                  >
                    <option value="full_with_cert">
                      Level 1, Level 2, Level 3 &amp; Certificate (Full Institute Track)
                    </option>
                    <option value="cert_only">
                      Certificate Only (Non-Chartered Certificate Programme)
                    </option>
                    <option value="chartered_3">
                      3 Levels Only (Level 1, Level 2, Level 3 — Chartered)
                    </option>
                    <option value="diploma_2">2 Levels (Level 1 &amp; Level 2 — Diploma)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pass Mark Threshold (%)</label>
                  <input
                    type="number"
                    min={40}
                    max={80}
                    value={progForm.passMarkPercent}
                    onChange={(e) => setProgForm({ ...progForm, passMarkPercent: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration Summary</label>
                  <input
                    type="text"
                    value={progForm.durationLabel}
                    onChange={(e) => setProgForm({ ...progForm, durationLabel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Entry Requirements</label>
                  <textarea
                    rows={2}
                    value={progForm.entryRequirements}
                    onChange={(e) => setProgForm({ ...progForm, entryRequirements: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Progression &amp; Exemption Rules</label>
                  <textarea
                    rows={2}
                    value={progForm.progressionRules}
                    onChange={(e) => setProgForm({ ...progForm, progressionRules: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateProgramme(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Save Programme Structure
                </button>
              </div>
            </form>
          )}

          {/* Active Programme Specification & Curriculum Table */}
          {activeProgramme ? (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono text-emerald-400 font-semibold">{activeProgramme.code}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activeProgramme.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activeProgramme.durationLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{activeProgramme.totalCreditHours} Credit Hours</span>
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1">{activeProgramme.title}</h2>
                    <p className="text-xs text-slate-300 mt-1">
                      <span className="text-slate-400">Institutional Qualification:</span>{' '}
                      <strong className="text-white">{activeProgramme.qualificationAwarded}</strong>
                    </p>
                    {activeProgramme.affiliatedProfessionalBody && (
                      <p className="text-xs text-amber-300/90 mt-1">
                        Authority Distinction: {activeProgramme.awardingAuthorityModel} — External Professional Body:{' '}
                        <strong>{activeProgramme.affiliatedProfessionalBody}</strong>
                        {activeProgramme.professionalDesignation
                          ? ` (${activeProgramme.professionalDesignation})`
                          : ''}
                      </p>
                    )}
                  </div>

                  {programmes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteProgramme(activeProgramme.id);
                        setSelectedProgrammeId(programmes.find((p) => p.id !== activeProgramme.id)?.id || '');
                        notify(`Archived & removed programme ${activeProgramme.code}.`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 rounded-lg text-xs cursor-pointer self-start whitespace-nowrap shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Programme</span>
                    </button>
                  )}
                </div>

                {/* Governance Rules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-slate-200 mb-1">Entry &amp; Exemption Criteria</p>
                    <p className="text-slate-400 leading-relaxed">{activeProgramme.entryRequirements}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200 mb-1">Assessment &amp; Exam Regulations</p>
                    <p className="text-slate-400 leading-relaxed">
                      {activeProgramme.assessmentMethods} {activeProgramme.examinationRegulations}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200 mb-1">Progression &amp; Graduation Rules</p>
                    <p className="text-slate-400 leading-relaxed">
                      {activeProgramme.progressionRules} {activeProgramme.completionRequirements}
                    </p>
                  </div>
                </div>

                {/* Level Selector Tabs (Level 1, Level 2, Level 3, Certificate) */}
                <div className="pt-4 border-t border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeProgramme.levels.map((lvl) => (
                      <button
                        key={lvl.levelNumber}
                        type="button"
                        onClick={() => setSelectedCourseLevel(lvl.levelNumber)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                          selectedCourseLevel === lvl.levelNumber
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {lvl.levelTitle} · Pass {lvl.passMarkPercent}% · GHS {lvl.levelFeeAmount.toLocaleString()}
                      </button>
                    ))}

                    {!activeProgramme.levels.some((l) => l.levelNumber === INSTITUTE_CERTIFICATE_LEVEL) && (
                      <button
                        type="button"
                        onClick={() => {
                          const certLvl: ProgrammeLevelConfig = {
                            levelNumber: INSTITUTE_CERTIFICATE_LEVEL,
                            levelTitle: 'Certificate (Non-Chartered Track)',
                            creditHoursRequired: 36,
                            passMarkPercent: 50,
                            maxAllowedResits: 2,
                            levelFeeAmount: 1650,
                            awardOnLevelCompletion: `Certificate of Competence — ${activeProgramme.title} (Non-Chartered)`,
                          };
                          updateProgramme(activeProgramme.id, {
                            levels: [...activeProgramme.levels, certLvl],
                          });
                          setSelectedCourseLevel(INSTITUTE_CERTIFICATE_LEVEL);
                          notify(`Enabled Certificate (Non-Chartered) level on ${activeProgramme.code}.`);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-amber-300 border border-dashed border-amber-500/50 cursor-pointer whitespace-nowrap"
                      >
                        + Add Certificate Level
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCourse(null);
                      setCourseModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      Upload Course &amp; Flyer to {formatInstituteLevelShort(selectedCourseLevel)}
                    </span>
                  </button>
                </div>

                {/* Courses Table for Selected Level — Includes Flyer Thumbnail, Rationale, Objectives & Details Viewer */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                        <th className="py-2.5 px-3 font-semibold">Flyer</th>
                        <th className="py-2.5 px-3 font-semibold">Code</th>
                        <th className="py-2.5 px-3 font-semibold">Course Title, Rationale &amp; Objectives</th>
                        <th className="py-2.5 px-3 font-semibold">Assigned Lecturer</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Credits</th>
                        <th className="py-2.5 px-3 font-semibold">Exam Diet &amp; Date</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {programmeCourses
                        .filter(
                          (c) => c.programmeId === activeProgramme.id && c.levelNumber === selectedCourseLevel
                        )
                        .map((course) => (
                          <tr key={course.id} className="hover:bg-slate-800/40">
                            <td className="py-3 px-3">
                              {course.flyerDataUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setViewingCourseDetails(course)}
                                  className="w-16 h-10 rounded-md overflow-hidden border border-slate-700 hover:border-emerald-400 block bg-slate-950 cursor-pointer"
                                  title="View Course Flyer & Syllabus"
                                >
                                  <img
                                    src={course.flyerDataUrl}
                                    alt={`${course.code} flyer`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCourse(course);
                                    setCourseModalOpen(true);
                                  }}
                                  className="w-16 h-10 rounded-md border border-dashed border-slate-700 hover:border-emerald-500 flex items-center justify-center text-slate-500 hover:text-emerald-400 cursor-pointer"
                                  title="Upload Flyer"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                              {course.code}
                            </td>
                            <td className="py-3 px-3 max-w-md">
                              <div className="font-semibold text-white">
                                {course.title}
                                <span className="ml-2 text-slate-400 font-normal">
                                  · {course.isMandatory ? 'Mandatory' : 'Elective'}
                                </span>
                              </div>
                              {(course.rationale || (course.objectives && course.objectives.length > 0)) && (
                                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                  {course.objectives && course.objectives.length > 0
                                    ? `${course.objectives.length} Learning Objectives`
                                    : 'Syllabus Details'}
                                  {course.rationale ? ` · ${course.rationale}` : ''}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-slate-300">{course.lecturerName}</td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-200">
                              {course.creditHours}
                            </td>
                            <td className="py-3 px-3 font-mono tabular-nums text-slate-300 whitespace-nowrap">
                              {course.semesterOrDiet} · {course.examScheduleDate || 'TBA'}
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setViewingCourseDetails(course)}
                                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-slate-700 rounded-md font-semibold cursor-pointer inline-flex items-center gap-1"
                                  title="View Course Details, Rationale, Objectives & Flyer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Details &amp; Flyer</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCourse(course);
                                    setCourseModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-md cursor-pointer"
                                  title="Edit Course & Upload Flyer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteProgrammeCourse(course.id);
                                    notify(`Removed course ${course.code}.`);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-md cursor-pointer"
                                  title="Remove Course"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {programmeCourses.filter(
                        (c) => c.programmeId === activeProgramme.id && c.levelNumber === selectedCourseLevel
                      ).length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 px-4 text-center text-slate-400">
                            No courses uploaded yet for {formatInstituteLevelShort(selectedCourseLevel)}. Click{' '}
                            <strong className="text-emerald-400">
                              Upload Course &amp; Flyer to {formatInstituteLevelShort(selectedCourseLevel)}
                            </strong>{' '}
                            to add course details, rationale, objectives, and a course flyer.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-xs text-slate-400">
              No programmes configured yet. Click "Create Programme" above to establish your first multi-level curriculum.
            </div>
          )}
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 3: CANDIDATE REGISTRATION & PROFESSIONAL MEMBERSHIP                */}
      {/* ====================================================================== */}
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  placeholder="Search by Candidate ID, name, or email..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                {[
                  { val: 'All', label: 'All Levels' },
                  { val: '1', label: 'Level 1' },
                  { val: '2', label: 'Level 2' },
                  { val: '3', label: 'Level 3' },
                  { val: String(INSTITUTE_CERTIFICATE_LEVEL), label: 'Certificate' },
                ].map((lvl) => (
                  <button
                    key={lvl.val}
                    type="button"
                    onClick={() => setCandidateLevelFilter(lvl.val)}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer whitespace-nowrap ${
                      candidateLevelFilter === lvl.val
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRegisterCandidate(!showRegisterCandidate)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Candidate</span>
            </button>
          </div>

          {showRegisterCandidate && (
            <form
              onSubmit={handleRegisterCandidate}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    New Candidate Enrolment &amp; Professional Membership Record
                  </h3>
                  <p className="text-slate-400 mt-0.5">
                    Assigns a unique Candidate Identification Number and provisions personal portal login credentials
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRegisterCandidate(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={candForm.firstName}
                    onChange={(e) => setCandForm({ ...candForm, firstName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Last Name / Surname</label>
                  <input
                    type="text"
                    required
                    value={candForm.lastName}
                    onChange={(e) => setCandForm({ ...candForm, lastName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email (Student Login)</label>
                  <input
                    type="email"
                    placeholder="Auto-generated if blank"
                    value={candForm.email}
                    onChange={(e) => setCandForm({ ...candForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={candForm.phone}
                    onChange={(e) => setCandForm({ ...candForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Identity Document Type</label>
                  <select
                    value={candForm.identityDocumentType}
                    onChange={(e) =>
                      setCandForm({
                        ...candForm,
                        identityDocumentType: e.target.value as typeof candForm.identityDocumentType,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Ghana Card (NIA)">Ghana Card (NIA)</option>
                    <option value="Passport">Passport</option>
                    <option value="Birth Certificate / GES Index">Birth Certificate / GES Index</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">National ID / Index Ref</label>
                  <input
                    type="text"
                    required
                    value={candForm.nationalIdNumber}
                    onChange={(e) => setCandForm({ ...candForm, nationalIdNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Previous Qualifications (Entry Basis)</label>
                  <input
                    type="text"
                    required
                    value={candForm.previousQualifications}
                    onChange={(e) => setCandForm({ ...candForm, previousQualifications: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Enrolled Programme</label>
                  <select
                    value={candForm.programmeId}
                    onChange={(e) => setCandForm({ ...candForm, programmeId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Starting Level / Track</label>
                  <select
                    value={candForm.currentLevel}
                    onChange={(e) => {
                      const nextLvl = Number(e.target.value);
                      setCandForm({
                        ...candForm,
                        currentLevel: nextLvl,
                        membershipStatus:
                          nextLvl === INSTITUTE_CERTIFICATE_LEVEL
                            ? 'Not Applicable (Academic / Vocational Only)'
                            : candForm.membershipStatus,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white tabular-nums"
                  >
                    <option value={1}>Level 1 (Foundation)</option>
                    <option value={2}>Level 2 (Direct / Exempt Entry)</option>
                    <option value={3}>Level 3 (Finalist Entry)</option>
                    <option value={INSTITUTE_CERTIFICATE_LEVEL}>
                      Certificate (Non-Chartered Programme)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Professional Body Status</label>
                  <select
                    value={candForm.membershipStatus}
                    onChange={(e) =>
                      setCandForm({
                        ...candForm,
                        membershipStatus: e.target.value as ProfessionalMembershipStatus,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Registered Student Candidate">Registered Student Candidate</option>
                    <option value="Affiliate / Technician Member">Affiliate / Technician Member</option>
                    <option value="Graduate Member (Institution Complete)">Graduate Member (Institution Complete)</option>
                    <option value="Associate Member (Awarded by External Professional Body)">
                      Associate Member (External Body)
                    </option>
                    <option value="Not Applicable (Academic / Vocational Only)">Not Applicable (Academic Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Total Fees Billed (GHS)</label>
                  <input
                    type="number"
                    min={0}
                    value={candForm.totalFeesBilled}
                    onChange={(e) => setCandForm({ ...candForm, totalFeesBilled: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fees Paid to Date (GHS)</label>
                  <input
                    type="number"
                    min={0}
                    value={candForm.totalFeesPaid}
                    onChange={(e) => setCandForm({ ...candForm, totalFeesPaid: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={candForm.identityVerified}
                    onChange={(e) => setCandForm({ ...candForm, identityVerified: e.target.checked })}
                    className="rounded border-slate-700"
                  />
                  <span>Identity document inspected and verified by Admissions / Registrar</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisterCandidate(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer"
                  >
                    Confirm Registration
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Candidates Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                    <th className="py-3 px-4 font-semibold">Candidate &amp; Entry Basis</th>
                    <th className="py-3 px-4 font-semibold">Candidate ID</th>
                    <th className="py-3 px-4 font-semibold">Programme &amp; Level</th>
                    <th className="py-3 px-4 font-semibold">Identity Check</th>
                    <th className="py-3 px-4 font-semibold">Institutional vs. Professional Body Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Fee Clearance</th>
                    <th className="py-3 px-4 font-semibold text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredCandidates.map((cand) => {
                    const prog = programmes.find((p) => p.id === cand.programmeId);
                    const arrears = Math.max(0, cand.totalFeesBilled - cand.totalFeesPaid);
                    return (
                      <tr key={cand.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">
                            {cand.firstName} {cand.lastName}
                          </div>
                          <div className="text-slate-400 text-[11px] truncate max-w-[230px]">
                            {cand.previousQualifications}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums font-semibold text-emerald-400">
                          {cand.candidateNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-200 font-medium">
                            {prog?.code || 'PROG'} · {formatInstituteLevelShort(cand.currentLevel)}
                          </div>
                          <div className="text-slate-400 text-[11px]">{cand.status}</div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => {
                              updateCandidate(cand.id, { identityVerified: !cand.identityVerified });
                              notify(
                                `Updated identity verification for ${cand.candidateNumber} to ${
                                  !cand.identityVerified ? 'Verified' : 'Pending'
                                }.`
                              );
                            }}
                            className={`font-semibold cursor-pointer ${
                              cand.identityVerified ? 'text-emerald-400' : 'text-amber-400 underline'
                            }`}
                          >
                            {cand.identityVerified ? 'Verified' : 'Verify ID'}
                          </button>
                          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                            {cand.nationalIdNumber}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={cand.membershipStatus}
                            onChange={(e) => {
                              updateCandidate(cand.id, {
                                membershipStatus: e.target.value as ProfessionalMembershipStatus,
                              });
                              notify(`Updated membership classification for ${cand.candidateNumber}.`);
                            }}
                            className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-[11px] text-slate-200 max-w-[220px]"
                          >
                            <option value="Registered Student Candidate">Registered Student Candidate</option>
                            <option value="Affiliate / Technician Member">Affiliate / Technician Member</option>
                            <option value="Graduate Member (Institution Complete)">
                              Graduate Member (Institution Complete)
                            </option>
                            <option value="Associate Member (Awarded by External Professional Body)">
                              Associate Member (External Body)
                            </option>
                            <option value="Fellow (Awarded by External Professional Body)">
                              Fellow (External Body)
                            </option>
                            <option value="Not Applicable (Academic / Vocational Only)">
                              Not Applicable (Academic Only)
                            </option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {arrears === 0 ? (
                            <span className="text-emerald-400 font-semibold">Cleared</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                updateCandidate(cand.id, { totalFeesPaid: cand.totalFeesBilled });
                                notify(`Cleared GHS ${arrears.toLocaleString()} balance for ${cand.candidateNumber}.`);
                              }}
                              className="text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                              title="Click to record full fee clearance"
                            >
                              GHS {arrears.toLocaleString()} Due
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openIssueModalForCandidate(cand.id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-md font-semibold transition cursor-pointer whitespace-nowrap"
                          >
                            Issue Credential
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 4: EXAMINATIONS, MODERATION & PROGRESSION ENGINE                   */}
      {/* ====================================================================== */}
      {activeTab === 'progression' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <span className="text-slate-400 mr-2">Programme:</span>
                <select
                  value={progExamFilterId || programmes[0]?.id || ''}
                  onChange={(e) => {
                    const nextProg = programmes.find((p) => p.id === e.target.value);
                    setProgExamFilterId(e.target.value);
                    setLevelExamFilter(nextProg?.levels[0]?.levelNumber || 1);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-semibold"
                >
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                {(programmes.find((p) => p.id === (progExamFilterId || programmes[0]?.id))?.levels || []).map(
                  (lvl) => (
                    <button
                      key={lvl.levelNumber}
                      type="button"
                      onClick={() => setLevelExamFilter(lvl.levelNumber)}
                      className={`px-3 py-1 rounded-md font-semibold cursor-pointer whitespace-nowrap ${
                        levelExamFilter === lvl.levelNumber
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {formatInstituteLevelShort(lvl.levelNumber)}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="text-slate-400 tabular-nums">
              <span>Graduation-Ready: <strong className="text-emerald-400">{analyticsMetrics.gradEligible.length}</strong></span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Level-Up Eligible: <strong className="text-white">{analyticsMetrics.nextLevelEligible.length}</strong></span>
            </div>
          </div>

          {/* Inline Paper Score & Moderation Modal / Drawer */}
          {editingAssessmentKey && (
            <form
              onSubmit={handleSaveAssessment}
              className="bg-slate-900 border border-emerald-600/60 rounded-xl p-5 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">
                  Record Examination Marks, Exemption, Resit or Moderation Decision
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingAssessmentKey(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Paper Status</label>
                  <select
                    value={assessmentDraft.paperStatus}
                    onChange={(e) =>
                      setAssessmentDraft({
                        ...assessmentDraft,
                        paperStatus: e.target.value as CandidatePaperStatus,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-semibold"
                  >
                    <option value="Passed">Standard Graded Sitting</option>
                    <option value="Exempted">Exempted (Prior Qualification)</option>
                    <option value="Resit Required">Resit Required</option>
                    <option value="Deferred">Deferred Examination</option>
                    <option value="Under Moderation">Under Moderation</option>
                    <option value="Appeal Lodged">Appeal Lodged</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Attendance (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={assessmentDraft.attendancePercent}
                    onChange={(e) =>
                      setAssessmentDraft({ ...assessmentDraft, attendancePercent: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">CA Score (Max 30)</label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    disabled={assessmentDraft.paperStatus === 'Exempted'}
                    value={assessmentDraft.caScore}
                    onChange={(e) => setAssessmentDraft({ ...assessmentDraft, caScore: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-mono tabular-nums disabled:opacity-40"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Practical (Max 10)</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    disabled={assessmentDraft.paperStatus === 'Exempted'}
                    value={assessmentDraft.practicalScore}
                    onChange={(e) =>
                      setAssessmentDraft({ ...assessmentDraft, practicalScore: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-mono tabular-nums disabled:opacity-40"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Exam Score (Max 60–70)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={assessmentDraft.paperStatus === 'Exempted'}
                    value={assessmentDraft.examScore}
                    onChange={(e) => setAssessmentDraft({ ...assessmentDraft, examScore: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-mono tabular-nums disabled:opacity-40"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Resit Attempt #</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={assessmentDraft.resitAttemptCount}
                    onChange={(e) =>
                      setAssessmentDraft({ ...assessmentDraft, resitAttemptCount: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Exemption Basis / Invigilation / Appeal Remark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.Sc. Accounting Exemption approved by Academic Board"
                    value={assessmentDraft.exemptionBasis || assessmentDraft.appealNote}
                    onChange={(e) =>
                      setAssessmentDraft({ ...assessmentDraft, exemptionBasis: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div className="flex items-end justify-between gap-3">
                  <label className="flex items-center gap-2 text-slate-200 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={assessmentDraft.moderated}
                      onChange={(e) => setAssessmentDraft({ ...assessmentDraft, moderated: e.target.checked })}
                    />
                    <span>External Examiner / Board Moderated &amp; Ratified</span>
                  </label>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Save Paper Result
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Candidate x Level Courses Assessment Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Level {levelExamFilter} Examination Ledger, Moderation &amp; Progression Controls
              </h3>
              <span className="text-xs text-slate-400">Click any course score cell to enter marks, exemptions, or resits</span>
            </div>

            <div className="overflow-x-auto">
              {(() => {
                const targetProgId = progExamFilterId || programmes[0]?.id || '';
                const levelCourses = programmeCourses.filter(
                  (c) => c.programmeId === targetProgId && c.levelNumber === levelExamFilter
                );
                const progCandidates = candidates.filter((c) => c.programmeId === targetProgId);

                if (progCandidates.length === 0) {
                  return (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No candidates enrolled in this programme yet.
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                        <th className="py-3 px-4 font-semibold">Candidate</th>
                        <th className="py-3 px-4 font-semibold">Current Stage</th>
                        {levelCourses.map((crs) => (
                          <th key={crs.id} className="py-3 px-3 font-semibold text-right">
                            <span className="font-mono text-slate-200">{crs.code}</span>
                          </th>
                        ))}
                        <th className="py-3 px-4 font-semibold">Progression Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {progCandidates.map((cand) => {
                        const ev = candidateEvaluations.get(cand.id);
                        return (
                          <tr key={cand.id} className="hover:bg-slate-800/40">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">
                                {cand.firstName} {cand.lastName}
                              </div>
                              <div className="font-mono tabular-nums text-[11px] text-slate-400">
                                {cand.candidateNumber}
                              </div>
                            </td>
                            <td className="py-3 px-4 tabular-nums text-slate-300">
                              Level {cand.currentLevel}
                            </td>
                            {levelCourses.map((crs) => {
                              const rec = candidateAssessments.find(
                                (a) => a.candidateId === cand.id && a.courseId === crs.id
                              );
                              return (
                                <td key={crs.id} className="py-3 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openAssessmentEditor(cand.id, targetProgId, crs.id, levelExamFilter)
                                    }
                                    className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 font-mono tabular-nums cursor-pointer"
                                  >
                                    {rec ? (
                                      rec.paperStatus === 'Exempted' ? (
                                        <span className="text-sky-400 font-semibold">EXEMPT</span>
                                      ) : (
                                        <span
                                          className={
                                            rec.paperStatus === 'Passed'
                                              ? 'text-emerald-400 font-semibold'
                                              : rec.paperStatus === 'Resit Required'
                                              ? 'text-rose-400 font-semibold'
                                              : 'text-amber-400'
                                          }
                                        >
                                          {rec.totalScore}% ({rec.paperStatus === 'Passed' ? 'P' : rec.paperStatus.slice(0, 3).toUpperCase()})
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-slate-500">+ Record</span>
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                            <td className="py-3 px-4 text-slate-300 max-w-[240px] truncate" title={ev?.statusSummary}>
                              {ev?.statusSummary}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {cand.status === 'Completed / Graduated' ? (
                                <span className="text-emerald-400 font-semibold">Alumni</span>
                              ) : ev?.eligibleForGraduation ? (
                                <button
                                  type="button"
                                  onClick={() => openIssueModalForCandidate(cand.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-semibold cursor-pointer whitespace-nowrap"
                                >
                                  Approve Graduation
                                </button>
                              ) : ev?.eligibleForNextLevel ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (promoteCandidateToNextLevel(cand.id)) {
                                      notify(`Promoted ${cand.firstName} ${cand.lastName} to Level ${cand.currentLevel + 1}.`);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-md font-semibold cursor-pointer whitespace-nowrap"
                                >
                                  Advance to L{cand.currentLevel + 1}
                                </button>
                              ) : (
                                <span className="text-slate-500">Restricted</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 5: DIGITAL CERTIFICATE ISSUANCE, STATUS LIFECYCLE & AUDIT TRAIL    */}
      {/* ====================================================================== */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={certSearch}
                  onChange={(e) => setCertSearch(e.target.value)}
                  placeholder="Search certificate serial, verification code, or recipient..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs overflow-x-auto">
                {['All', 'Valid', 'Pending Approval', 'Revoked', 'Replaced', 'Expired'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setCertStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                      certStatusFilter === st
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIssuePanel(!showIssuePanel)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Approve &amp; Issue Digital Credential</span>
            </button>
          </div>

          {/* Issue New Digital Credential Form */}
          {showIssuePanel && (
            <form
              onSubmit={handleIssueCredential}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Digital Certificate Issuance &amp; Signatory Authorisation
                  </h3>
                  <p className="text-slate-400 mt-0.5">
                    Assigns a unique Certificate Serial Number, cryptographic Verification Code, embedded QR link, and authorised ink signatures
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIssuePanel(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Pre-Issuance Requirement Verification Strip */}
              {selectedCandidateEvaluation && (
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-white">
                      Pre-Issuance Clearance Check:{' '}
                      <span className="text-emerald-400">{selectedCandidateEvaluation.statusSummary}</span>
                    </p>
                    <div className="text-slate-400 tabular-nums flex flex-wrap items-center gap-2">
                      <span>
                        Mandatory Papers: {selectedCandidateEvaluation.passedOrExemptCount}/
                        {selectedCandidateEvaluation.mandatoryCoursesCount}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Identity Verified: {selectedCandidateEvaluation.identityVerified ? 'Yes' : 'Pending'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Fee Arrears: GHS {selectedCandidateEvaluation.feeBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select Candidate / Student</label>
                  <select
                    value={issueForm.candidateId}
                    onChange={(e) => {
                      const cand = candidates.find((c) => c.id === e.target.value);
                      const prog = programmes.find((p) => p.id === cand?.programmeId);
                      setIssueForm({
                        ...issueForm,
                        candidateId: e.target.value,
                        qualificationAwarded: prog?.qualificationAwarded || issueForm.qualificationAwarded,
                        levelCompletedLabel: `Level ${cand?.currentLevel || 1} Completed`,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.candidateNumber} — {c.firstName} {c.lastName} (L{c.currentLevel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Credential Document Type</label>
                  <select
                    value={issueForm.credentialType}
                    onChange={(e) =>
                      setIssueForm({ ...issueForm, credentialType: e.target.value as CredentialDocumentType })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Full Qualification Certificate">Full Qualification Certificate</option>
                    <option value="Level Completion Certificate">Level Completion Certificate</option>
                    <option value="Diploma Certificate">Diploma Certificate</option>
                    <option value="Executive Programme Certificate">Executive Programme Certificate</option>
                    <option value="Short Course Certificate">Short Course Certificate</option>
                    <option value="Professional Examination Pass Certificate">
                      Professional Examination Pass Certificate
                    </option>
                    <option value="Official Academic Transcript">Official Academic Transcript</option>
                    <option value="Statement of Results">Statement of Results</option>
                    <option value="Letter of Completion">Letter of Completion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Validity Status</label>
                  <select
                    value={issueForm.status}
                    onChange={(e) =>
                      setIssueForm({ ...issueForm, status: e.target.value as CertificateValidityStatus })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Valid">Valid (Immediate Senate Approval)</option>
                    <option value="Pending Approval">Pending Approval (Registrar Queue)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Qualification Title Conferred</label>
                  <input
                    type="text"
                    required
                    value={issueForm.qualificationAwarded}
                    onChange={(e) => setIssueForm({ ...issueForm, qualificationAwarded: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Level / Stage Completed</label>
                  <input
                    type="text"
                    required
                    value={issueForm.levelCompletedLabel}
                    onChange={(e) => setIssueForm({ ...issueForm, levelCompletedLabel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Classification / Honours</label>
                  <input
                    type="text"
                    placeholder="e.g. With Distinction / Merit / Pass"
                    value={issueForm.honoursOrDistinction}
                    onChange={(e) => setIssueForm({ ...issueForm, honoursOrDistinction: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Primary Authorised Signatory</label>
                  <select
                    value={issueForm.primarySignatoryId}
                    onChange={(e) => setIssueForm({ ...issueForm, primarySignatoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    {signatories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.title})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Secondary Authorised Signatory</label>
                  <select
                    value={issueForm.secondarySignatoryId}
                    onChange={(e) => setIssueForm({ ...issueForm, secondarySignatoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Single Signatory Only</option>
                    {signatories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.title})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date of Award</label>
                  <input
                    type="date"
                    required
                    value={issueForm.issueDate}
                    onChange={(e) => setIssueForm({ ...issueForm, issueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Expiry Date (Optional — Renewable Licences)
                  </label>
                  <input
                    type="date"
                    value={issueForm.expiryDate}
                    onChange={(e) => setIssueForm({ ...issueForm, expiryDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Serial Number (Leave blank to auto-assign)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated unique serial"
                    value={issueForm.customSerial}
                    onChange={(e) => setIssueForm({ ...issueForm, customSerial: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIssuePanel(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Generate Digital Certificate &amp; QR</span>
                </button>
              </div>
            </form>
          )}

          {/* Central Certificate Register Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Central Digital Certificate Register</h3>
              <span className="text-xs text-slate-400 tabular-nums">
                Showing {filteredCredentials.length} of {issuedCredentials.length} permanent records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                    <th className="py-3 px-4 font-semibold">Serial &amp; Verification Code</th>
                    <th className="py-3 px-4 font-semibold">Graduate / Recipient</th>
                    <th className="py-3 px-4 font-semibold">Qualification &amp; Level</th>
                    <th className="py-3 px-4 font-semibold">Issue Date</th>
                    <th className="py-3 px-4 font-semibold">Validity Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Documents &amp; Governance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredCredentials.map((cred) => (
                    <tr key={cred.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono tabular-nums">
                        <div className="font-bold text-white">{cred.certificateNumber}</div>
                        <div className="text-[11px] text-emerald-400">{cred.verificationCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{cred.recipientFullName}</div>
                        <div className="font-mono tabular-nums text-[11px] text-slate-400">
                          {cred.candidateNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200 max-w-[260px] truncate">
                          {cred.qualificationAwarded}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {cred.levelCompletedLabel}
                          {cred.honoursOrDistinction ? ` · ${cred.honoursOrDistinction}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-300">
                        <div>{cred.issueDate}</div>
                        {cred.expiryDate && (
                          <div className="text-[11px] text-slate-500">Exp: {cred.expiryDate}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className={`font-semibold ${statusTextColor(cred.status)}`}>{cred.status}</div>
                        {cred.replacedByCertificateNumber && (
                          <div className="text-[10px] font-mono text-sky-400">
                            → {cred.replacedByCertificateNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setViewingDocMode('certificate');
                              setViewingCredential(cred);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-semibold cursor-pointer whitespace-nowrap"
                            title="View & Print Official Certificate PDF"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Certificate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setViewingDocMode('transcript');
                              setViewingCredential(cred);
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md font-medium cursor-pointer whitespace-nowrap"
                          >
                            Transcript
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setStatusModalCred(cred);
                              setNewStatusTarget(cred.status === 'Pending Approval' ? 'Valid' : 'Revoked');
                              setStatusReasonInput('');
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-md font-medium cursor-pointer whitespace-nowrap"
                          >
                            Status
                          </button>

                          <button
                            type="button"
                            onClick={() => setAuditDrawerCred(cred)}
                            className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-md cursor-pointer whitespace-nowrap"
                            title="Inspect Immutable Audit Trail"
                          >
                            <History className="w-3.5 h-3.5 inline" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Replacement Certificate Requests Queue */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Graduate Certificate Replacement Requests</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Approved replacements preserve the original serial as "Replaced" and issue a linked successor credential
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-amber-400">
                {replacementRequests.filter((r) => r.status === 'Pending Review').length} Pending
              </span>
            </div>

            {replacementRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No replacement certificate requests submitted.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {replacementRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{req.requesterName}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="font-mono text-emerald-400">{req.originalCertificateNumber}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-amber-300">{req.reason}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="font-mono tabular-nums text-slate-400">{req.requestedDate}</span>
                      </div>
                      <p className="text-slate-400">{req.details}</p>
                      {req.newCertificateNumber && (
                        <p className="text-sky-400 font-mono">
                          Re-issued Serial: {req.newCertificateNumber}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'Pending Review' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const reissued = processReplacementRequest(
                                req.id,
                                true,
                                `Approved replacement (${req.reason}) by ${currentUser.name}`
                              );
                              if (reissued) {
                                notify(
                                  `Approved replacement. Original marked Replaced; new serial ${reissued.certificateNumber} issued.`
                                );
                              }
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer whitespace-nowrap"
                          >
                            Approve &amp; Re-issue
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              processReplacementRequest(req.id, false, `Declined by ${currentUser.name}`);
                              notify('Replacement request declined.');
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 rounded-lg font-semibold cursor-pointer whitespace-nowrap"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <span className="font-semibold text-slate-300">{req.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 6: DIGITAL SIGNATURES & CERTIFICATE TEMPLATE DESIGNER              */}
      {/* ====================================================================== */}
      {activeTab === 'signatures' && (
        <div className="space-y-6">
          {/* Logged-In Teacher / Administrator Personal Signature Studio */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="space-y-1.5">
              <div className="text-xs text-slate-400">
                <span>Logged-In Officer</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span className="capitalize">{currentUser.role}</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>{currentUser.title}</span>
              </div>
              <h2 className="text-base font-bold text-white">
                {currentUser.name} — Personal Digital Signature
              </h2>
              <p className="text-xs text-slate-400 max-w-xl">
                Sign directly on the interactive pen canvas or upload an image of your wet-ink signature (with automatic white-paper background removal) for certificates, transcripts, and terminal report cards.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="w-48 h-20 bg-white rounded-lg border border-slate-300 flex items-center justify-center p-2 overflow-hidden">
                {currentUser.signatureDataUrl ? (
                  <img
                    src={currentUser.signatureDataUrl}
                    alt={`${currentUser.name} signature`}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[11px] text-slate-400">No signature saved</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSigTargetMode('self');
                  setEditingSignatory(null);
                  setSigModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
              >
                <PenTool className="w-4 h-4" />
                <span>Sign or Upload Signature</span>
              </button>
            </div>
          </div>

          {/* Authorised Institutional Signatories Registry */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Authorised Institutional Signatories</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage Principals, Registrars, Examination Officers, and Lead Lecturers authorised to sign official credentials
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Officer Name (e.g. Dr. Esi Mensah)"
                  value={newSignerName}
                  onChange={(e) => setNewSignerName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Title (e.g. Chief Examiner)"
                  value={newSignerTitle}
                  onChange={(e) => setNewSignerTitle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newSignerName.trim()) {
                      notify('Enter the officer name first, then sign or upload their signature.', 'error');
                      return;
                    }
                    setSigTargetMode('signatory');
                    setEditingSignatory(null);
                    setSigModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Signatory</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {signatories.map((sig) => (
                <div
                  key={sig.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-white">{sig.name}</p>
                      <p className="text-slate-400">{sig.title}</p>
                      <p className="text-[11px] text-emerald-400 mt-0.5">
                        {sig.role} · {sig.signatureMethod === 'uploaded' ? 'Uploaded Scan' : 'Digital Ink'}
                      </p>
                    </div>
                    {signatories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          removeSignatory(sig.id);
                          notify(`Removed signatory ${sig.name}.`);
                        }}
                        className="text-slate-500 hover:text-rose-400 cursor-pointer"
                        title="Remove Signatory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="h-16 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-2">
                    <img
                      src={sig.signatureDataUrl}
                      alt={sig.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono tabular-nums">Updated {sig.updatedAt}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSigTargetMode('signatory');
                        setEditingSignatory(sig);
                        setNewSignerName(sig.name);
                        setNewSignerTitle(sig.title);
                        setNewSignerRole(sig.role);
                        setSigModalOpen(true);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                    >
                      Re-sign / Upload
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certificate Template Customisation Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Institutional Certificate Template &amp; Layout Configuration
                </h3>
                <p className="text-slate-400 mt-0.5">
                  Customise border heraldry, orientation, official seal wording, QR verification display, and awarding-authority disclaimers
                </p>
              </div>
              {issuedCredentials[0] && (
                <button
                  type="button"
                  onClick={() => {
                    saveCertificateTemplate(tplDraft);
                    setViewingDocMode('certificate');
                    setViewingCredential(issuedCredentials[0]);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Live Certificate</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Guilloché Theme Palette</label>
                <select
                  value={tplDraft.themeStyle}
                  onChange={(e) =>
                    setTplDraft({
                      ...tplDraft,
                      themeStyle: e.target.value as CertificateTemplateConfig['themeStyle'],
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                >
                  <option value="emerald-gold">Emerald Charter &amp; Gold</option>
                  <option value="royal-navy">Royal Navy &amp; Sovereign Gold</option>
                  <option value="crimson-charter">Crimson Senate &amp; Brass</option>
                  <option value="classic-ivory">Classic Archival Ivory</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Page Orientation</label>
                <select
                  value={tplDraft.orientation}
                  onChange={(e) =>
                    setTplDraft({
                      ...tplDraft,
                      orientation: e.target.value as 'landscape' | 'portrait',
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                >
                  <option value="landscape">A4 Landscape (Diplomas &amp; Charters)</option>
                  <option value="portrait">A4 Portrait (Executive Certificates)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Charter Header Subtitle</label>
                <input
                  type="text"
                  value={tplDraft.headerSubtitle}
                  onChange={(e) => setTplDraft({ ...tplDraft, headerSubtitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Official Seal Inscription</label>
                <input
                  type="text"
                  value={tplDraft.sealLabel}
                  onChange={(e) => setTplDraft({ ...tplDraft, sealLabel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Awarding-Authority &amp; Professional Body Distinction Disclaimer
              </label>
              <textarea
                rows={2}
                value={tplDraft.authorityDisclaimerText}
                onChange={(e) => setTplDraft({ ...tplDraft, authorityDisclaimerText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
              <div className="flex flex-wrap items-center gap-4 text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tplDraft.showQrCode}
                    onChange={(e) => setTplDraft({ ...tplDraft, showQrCode: e.target.checked })}
                  />
                  <span>Print QR Verification Code</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tplDraft.showCandidateId}
                    onChange={(e) => setTplDraft({ ...tplDraft, showCandidateId: e.target.checked })}
                  />
                  <span>Show Candidate ID</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tplDraft.showCreditHours}
                    onChange={(e) => setTplDraft({ ...tplDraft, showCreditHours: e.target.checked })}
                  />
                  <span>Show Credit Hours</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tplDraft.showAuthorityDisclaimer}
                    onChange={(e) => setTplDraft({ ...tplDraft, showAuthorityDisclaimer: e.target.checked })}
                  />
                  <span>Print Authority Footnote</span>
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  saveCertificateTemplate(tplDraft);
                  notify('Saved institutional certificate template design.');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer whitespace-nowrap"
              >
                Save Template Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 7: PERMANENT GRADUATE & ALUMNI REGISTER + ACCREDITATIONS           */}
      {/* ====================================================================== */}
      {activeTab === 'alumni' && (
        <div className="space-y-6">
          {/* Alumni Filter & Export Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={alumniSearch}
                  onChange={(e) => setAlumniSearch(e.target.value)}
                  placeholder="Search alumni name, ID, qualification, or certificate serial..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={alumniProgFilter}
                onChange={(e) => setAlumniProgFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="All">All Programmes</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.title}
                  </option>
                ))}
              </select>

              <select
                value={alumniYearFilter}
                onChange={(e) => setAlumniYearFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white tabular-nums"
              >
                <option value="All">All Graduation Years</option>
                {Array.from(new Set(graduateRecords.map((g) => g.graduationYear)))
                  .sort((a, b) => b - a)
                  .map((yr) => (
                    <option key={yr} value={String(yr)}>
                      Class of {yr}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportAlumniCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Graduate CSV</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print Graduation List</span>
              </button>
            </div>
          </div>

          {/* Permanent Graduate & Alumni Register Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Permanent Completed-Students &amp; Alumni Register</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Graduates are automatically transferred here upon formal completion approval and retain permanent credential verifiability
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-emerald-400">
                {filteredAlumni.length} Alumni
              </span>
            </div>

            {filteredAlumni.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No alumni records match your current filter. Approve &amp; issue a full qualification certificate to populate the Alumni Register.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                      <th className="py-3 px-4 font-semibold">Graduate &amp; Candidate ID</th>
                      <th className="py-3 px-4 font-semibold">Qualification &amp; Level Attained</th>
                      <th className="py-3 px-4 font-semibold text-right">Year</th>
                      <th className="py-3 px-4 font-semibold">Certificate Serial</th>
                      <th className="py-3 px-4 font-semibold">Membership &amp; Directory</th>
                      <th className="py-3 px-4 font-semibold text-right">Credential</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredAlumni.map((grad) => {
                      const linkedCred = issuedCredentials.find(
                        (c) => c.certificateNumber === grad.certificateNumber
                      );
                      return (
                        <tr key={grad.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{grad.fullName}</div>
                            <div className="font-mono tabular-nums text-[11px] text-slate-400">
                              {grad.candidateNumber}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-200">{grad.qualificationAwarded}</div>
                            <div className="text-[11px] text-slate-400">{grad.levelAttained}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-200">
                            {grad.graduationYear}
                          </td>
                          <td className="py-3 px-4 font-mono tabular-nums">
                            <div className="text-emerald-400 font-semibold">{grad.certificateNumber}</div>
                            <div className="text-[11px] text-slate-400">{grad.certificateStatus}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <div>{grad.membershipStatus}</div>
                            <div className="text-[11px] text-slate-400">
                              Employer Directory: {grad.directoryConsent ? 'Public Opt-In' : 'Private Link Only'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {linkedCred && (
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingDocMode('certificate');
                                  setViewingCredential(linkedCred);
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-md font-semibold cursor-pointer whitespace-nowrap"
                              >
                                View / Print
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Accreditation, Affiliation & Awarding-Authority Registry */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <span>Institutional Accreditation, Affiliation &amp; Awarding-Authority Registry</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Documents statutory charters, regulatory accreditations (GTEC, CTVET, GES/WAEC), and external professional body affiliations
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAccreditation(!showAddAccreditation)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Charter / Accreditation</span>
              </button>
            </div>

            {showAddAccreditation && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!accForm.referenceNumber.trim() || !accForm.scopeOrProgramme.trim()) {
                    notify('Reference number and accredited scope are required.', 'error');
                    return;
                  }
                  addAccreditation(accForm);
                  setShowAddAccreditation(false);
                  setAccForm({ ...accForm, referenceNumber: '', scopeOrProgramme: '' });
                  notify('Added statutory accreditation / affiliation record.');
                }}
                className="p-5 border-b border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs"
              >
                <div>
                  <label className="block text-slate-400 mb-1">Accrediting / Affiliating Body</label>
                  <input
                    type="text"
                    required
                    value={accForm.authorityName}
                    onChange={(e) => setAccForm({ ...accForm, authorityName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Classification</label>
                  <select
                    value={accForm.accreditationType}
                    onChange={(e) =>
                      setAccForm({
                        ...accForm,
                        accreditationType: e.target.value as InstitutionalAccreditation['accreditationType'],
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Institutional Registration">Institutional Registration</option>
                    <option value="Programme Accreditation">Programme Accreditation</option>
                    <option value="Professional Body Affiliation">Professional Body Affiliation</option>
                    <option value="Examination Charter">Examination Charter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Charter / Certificate Reference</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GTEC/PRO/2025/094"
                    value={accForm.referenceNumber}
                    onChange={(e) => setAccForm({ ...accForm, referenceNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Scope &amp; Awarding Power Summary</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chartered Tax Law Levels 1–3; Institutional Diploma awarding authority"
                    value={accForm.scopeOrProgramme}
                    onChange={(e) => setAccForm({ ...accForm, scopeOrProgramme: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div className="flex items-end justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAccreditation(false)}
                    className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer"
                  >
                    Save Charter
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                    <th className="py-3 px-4 font-semibold">Regulatory / Professional Body</th>
                    <th className="py-3 px-4 font-semibold">Reference No.</th>
                    <th className="py-3 px-4 font-semibold">Scope &amp; Awarding Authority</th>
                    <th className="py-3 px-4 font-semibold">Validity Window</th>
                    <th className="py-3 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {accreditations.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{acc.authorityName}</div>
                        <div className="text-[11px] text-slate-400">{acc.accreditationType}</div>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-emerald-400">
                        {acc.referenceNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-medium">{acc.scopeOrProgramme}</div>
                        <div className="text-[11px] text-slate-400 max-w-md">{acc.awardingPowerSummary}</div>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-300">
                        {acc.issueDate} → {acc.renewalDate}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const next = acc.status === 'Active' ? 'Renewal Due' : 'Active';
                            updateAccreditation(acc.id, { status: next });
                            notify(`Updated ${acc.referenceNumber} status to ${next}.`);
                          }}
                          className={`font-semibold cursor-pointer ${
                            acc.status === 'Active' ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {acc.status}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL: AUTHORISED STATUS TRANSITION (APPROVE / REVOKE / EXPIRE)        */}
      {/* ====================================================================== */}
      {statusModalCred && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmStatusUpdate}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Authorise Credential Status Change</h3>
              <button
                type="button"
                onClick={() => setStatusModalCred(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="font-mono font-bold text-emerald-400">{statusModalCred.certificateNumber}</div>
              <div className="text-white font-semibold">{statusModalCred.recipientFullName}</div>
              <div className="text-slate-400">Current Status: {statusModalCred.status}</div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">New Credential Status</label>
              <select
                value={newStatusTarget}
                onChange={(e) => setNewStatusTarget(e.target.value as CertificateValidityStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-semibold"
              >
                <option value="Valid">Valid (Authentic &amp; Active)</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Revoked">Revoked (Preserve Historical Record with Warning)</option>
                <option value="Replaced">Replaced</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Mandatory Governance &amp; Audit Reason
              </label>
              <textarea
                rows={3}
                required
                placeholder="State Senate minute reference, administrative correction basis, or disciplinary finding..."
                value={statusReasonInput}
                onChange={(e) => setStatusReasonInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Credentials are never silently deleted. Status changes are permanently logged and reflected on public verification.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStatusModalCred(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer"
              >
                Confirm &amp; Log Audit Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL: IMMUTABLE AUDIT LOG VIEWER                                      */}
      {/* ====================================================================== */}
      {auditDrawerCred && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Credential Governance Audit Log</h3>
                <p className="font-mono text-emerald-400 mt-0.5">{auditDrawerCred.certificateNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setAuditDrawerCred(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
              {auditDrawerCred.auditTrail.map((entry) => (
                <div key={entry.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between font-mono tabular-nums text-[11px] text-slate-400">
                    <span>{entry.timestamp.replace('T', ' ').slice(0, 19)}</span>
                    <span>
                      {entry.previousStatus} → <strong className="text-white">{entry.newStatus}</strong>
                    </span>
                  </div>
                  <div className="font-semibold text-slate-200">
                    {entry.actorName} <span className="text-slate-400 font-normal">({entry.actorRole})</span>
                  </div>
                  <p className="text-slate-400">{entry.reason}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAuditDrawerCred(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold cursor-pointer"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* DIGITAL SIGNATURE PAD & UPLOAD MODAL                                   */}
      {/* ====================================================================== */}
      <SignaturePadModal
        isOpen={sigModalOpen}
        onClose={() => setSigModalOpen(false)}
        signerName={
          sigTargetMode === 'self'
            ? currentUser.name
            : editingSignatory?.name || newSignerName || 'Authorised Signatory'
        }
        signerDefaultTitle={
          sigTargetMode === 'self'
            ? currentUser.title
            : editingSignatory?.title || newSignerTitle || 'Registrar / Examiner'
        }
        signerDefaultRole={
          sigTargetMode === 'self'
            ? currentUser.role === 'proprietor'
              ? 'Head of Institution'
              : currentUser.role === 'admin'
              ? 'Registrar'
              : 'Lead Lecturer / Teacher'
            : editingSignatory?.role || newSignerRole
        }
        existingSignatureUrl={
          sigTargetMode === 'self' ? currentUser.signatureDataUrl : editingSignatory?.signatureDataUrl
        }
        onSaveSignature={(dataUrl, method, role, customTitle) => {
          if (sigTargetMode === 'self') {
            saveUserSignature(currentUser.id, dataUrl, method, role, customTitle);
            notify(`Saved digital signature for ${currentUser.name}. Ready for certificate & report printing.`);
          } else {
            const saved = upsertSignatory({
              id: editingSignatory?.id,
              name: editingSignatory?.name || newSignerName.trim(),
              title: customTitle || newSignerTitle.trim() || role,
              role,
              signatureDataUrl: dataUrl,
              signatureMethod: method,
              active: true,
            });
            setNewSignerName('');
            setNewSignerTitle('');
            notify(`Saved authorised signatory signature for ${saved.name}.`);
          }
          setSigModalOpen(false);
        }}
      />

      {/* ====================================================================== */}
      {/* PRINTABLE / PDF DIGITAL CERTIFICATE, TRANSCRIPT, LETTER & BADGE MODAL  */}
      {/* ====================================================================== */}
      <CertificateDocumentModal
        credential={viewingCredential}
        initialDocMode={viewingDocMode}
        onClose={() => setViewingCredential(null)}
      />

      {/* ====================================================================== */}
      {/* COURSE UPLOAD, RATIONALE, OBJECTIVES & FLYER MODAL                     */}
      {/* ====================================================================== */}
      <CourseUploadModal
        isOpen={courseModalOpen}
        onClose={() => {
          setCourseModalOpen(false);
          setEditingCourse(null);
        }}
        institutionName={school.name}
        programmes={programmes}
        defaultProgrammeId={activeProgramme?.id || programmes[0]?.id || ''}
        defaultLevelNumber={selectedCourseLevel}
        defaultLecturerName={currentUser.name}
        editingCourse={editingCourse}
        onSaveCourse={handleSaveCourseFromModal}
        onBulkImportCourses={handleBulkImportCourses}
      />

      {/* ====================================================================== */}
      {/* COURSE SYLLABUS, RATIONALE, OBJECTIVES & FLYER VIEWER MODAL            */}
      {/* ====================================================================== */}
      <CourseDetailFlyerModal
        course={viewingCourseDetails}
        programmeTitle={
          viewingCourseDetails
            ? programmes.find((p) => p.id === viewingCourseDetails.programmeId)?.title
            : undefined
        }
        institutionName={school.name}
        onClose={() => setViewingCourseDetails(null)}
        onEditCourse={(crs) => {
          setEditingCourse(crs);
          setCourseModalOpen(true);
        }}
      />
    </div>
  );
};
