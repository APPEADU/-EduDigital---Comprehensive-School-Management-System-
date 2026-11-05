import {
  SchoolProfile,
  UserAccount,
  Student,
  ClassRoom,
  FeeItem,
  FeePayment,
  SchoolTransaction,
  StaffMember,
  SchoolAnnouncement,
  AuthorizedSignatory,
  ProfessionalProgramme,
  ProgrammeCourse,
  CandidateProfile,
  CandidateCourseAssessment,
  CertificateTemplateConfig,
  IssuedCredential,
  GraduateAlumniRecord,
  CertificateReplacementRequest,
  InstitutionalAccreditation,
  EmployerVerificationLog,
  isInstituteLevelType,
} from '../types';

// Clean vector calligraphic signature generator encoded as Data URL so all seeded teachers/admins
// have realistic transparent ink signatures ready for certificate & transcript printing out of the box.
export const makeCalligraphicSignatureSvg = (
  text: string,
  inkColor = '#0f172a',
  flourish = true
): string => {
  const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="96" viewBox="0 0 320 96">
    <style>
      .sig-txt { font: italic 700 27px 'Playfair Display', Georgia, serif; fill: ${inkColor}; letter-spacing: -0.4px; }
    </style>
    <text x="18" y="54" transform="rotate(-4 80 50)" class="sig-txt">${safeText}</text>
    ${
      flourish
        ? `<path d="M16 68 Q 115 54, 248 64 T 292 56" fill="none" stroke="${inkColor}" stroke-width="2.1" stroke-linecap="round" opacity="0.88" />
           <path d="M54 75 Q 140 70, 205 74" fill="none" stroke="${inkColor}" stroke-width="1.2" stroke-linecap="round" opacity="0.65" />`
        : ''
    }
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const makeCourseFlyerSvg = (params: {
  instituteName?: string;
  institutionName?: string;
  instituteCode?: string;
  courseCode: string;
  courseTitle: string;
  levelLabel: string;
  creditsLabel?: string;
  creditHours?: number;
  lecturerName?: string;
  dietLabel: string;
  accent?: 'emerald' | 'amber' | 'sky';
  accentHex?: string;
}): string => {
  const esc = (s: string) =>
    (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const resolvedAccentHex =
    params.accentHex ||
    (params.accent === 'amber' ? '#f59e0b' : params.accent === 'sky' ? '#38bdf8' : '#10b981');
  const instName = params.instituteName || params.institutionName || 'Professional Institute';
  const instHeader = params.instituteCode ? `${instName} (${params.instituteCode})` : instName;
  const creditsDisplay =
    params.creditsLabel || `${params.creditHours ?? 15} Credit Hours`;
  const words = (params.courseTitle || 'Institute Course').split(/\s+/);
  const line1 = esc(words.slice(0, 5).join(' '));
  const line2 = esc(words.slice(5, 11).join(' '));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#020617"/>
        <stop offset="55%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#064e3b"/>
      </linearGradient>
    </defs>
    <rect width="640" height="400" rx="20" fill="url(#bg)"/>
    <rect x="16" y="16" width="608" height="368" rx="14" fill="none" stroke="${resolvedAccentHex}" stroke-opacity="0.45" stroke-width="1.5"/>
    <circle cx="560" cy="70" r="95" fill="${resolvedAccentHex}" fill-opacity="0.09"/>
    <rect x="36" y="38" width="150" height="28" rx="6" fill="${resolvedAccentHex}" fill-opacity="0.18" stroke="${resolvedAccentHex}" stroke-opacity="0.6"/>
    <text x="48" y="57" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="${resolvedAccentHex}">${esc(params.levelLabel.toUpperCase())}</text>
    <text x="36" y="96" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#94a3b8">${esc(instHeader)}</text>
    <text x="36" y="142" font-family="monospace" font-size="18" font-weight="700" fill="${resolvedAccentHex}">${esc(params.courseCode)}</text>
    <text x="36" y="184" font-family="Georgia, serif" font-size="25" font-weight="700" fill="#f8fafc">${line1}</text>
    ${line2 ? `<text x="36" y="218" font-family="Georgia, serif" font-size="25" font-weight="700" fill="#f8fafc">${line2}</text>` : ''}
    <line x1="36" y1="252" x2="604" y2="252" stroke="#334155" stroke-width="1"/>
    <text x="36" y="284" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#e2e8f0">Credit Load: ${esc(creditsDisplay)}${params.lecturerName ? `  •  Faculty: ${esc(params.lecturerName)}` : ''}</text>
    <text x="36" y="314" font-family="system-ui, sans-serif" font-size="13" fill="#cbd5e1">Intake / Examination Diet: ${esc(params.dietLabel)}</text>
    <text x="36" y="354" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="${resolvedAccentHex}">OFFICIAL COURSE PROSPECTUS &amp; SYLLABUS FLYER • APPLY VIA INSTITUTE PORTAL</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// ============================================================================
// 4TH SEEDED INSTITUTION: CHARTERED INSTITUTE OF TAX LAW & FORENSIC ACCOUNTING
// ============================================================================

export const CITLFA_SIGNATORIES: AuthorizedSignatory[] = [
  {
    id: 'sig-cit-01',
    userId: 'usr-cit-01',
    name: 'Prof. Kwesi Yankah-Boateng (FCTI, PhD)',
    title: 'Rector & Chief Executive Officer',
    role: 'Head of Institution',
    signatureDataUrl: makeCalligraphicSignatureSvg('Prof. K. Yankah-Boateng', '#0f172a'),
    signatureMethod: 'uploaded',
    updatedAt: '2025-09-01',
    active: true,
  },
  {
    id: 'sig-cit-02',
    userId: 'usr-cit-02',
    name: 'Mrs. Efua Adomako-Mensah (LLM, FCA)',
    title: 'Registrar & Director of Credentials',
    role: 'Registrar',
    signatureDataUrl: makeCalligraphicSignatureSvg('Efua Adomako-Mensah', '#1e3a8a'),
    signatureMethod: 'drawn',
    updatedAt: '2025-09-02',
    active: true,
  },
  {
    id: 'sig-cit-03',
    userId: 'usr-cit-03',
    name: 'Dr. Senyo Tetteh-Klu (CFE, CPA)',
    title: 'Chief Examiner & Lead Forensic Lecturer',
    role: 'Chief Examiner',
    signatureDataUrl: makeCalligraphicSignatureSvg('Dr. S. Tetteh-Klu', '#0f172a'),
    signatureMethod: 'drawn',
    updatedAt: '2025-09-04',
    active: true,
  },
];

export const CITLFA_SCHOOL: SchoolProfile = {
  id: 'sch-citlfa-04',
  name: 'Chartered Institute of Tax Law & Forensic Accounting',
  code: 'CITLFA-GH-04',
  motto: 'Fiscal Integrity, Statutory Rigour & Forensic Truth',
  crest: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=300&q=80',
  levelType: 'Professional Institute',
  region: 'Greater Accra',
  district: 'Ridge / Financial Enclave, Accra',
  address: 'No. 14 Independence Avenue, North Ridge, P.O. Box MB 412, Accra, Ghana',
  phone: '+233 (0) 30 294 7720',
  whatsappNumber: '+233 24 894 7720',
  whatsappEnabled: true,
  email: 'registrar@citlfa.edu.gh',
  currency: 'GH₵',
  currentAcademicYear: '2025/2026',
  currentTerm: 'Semester 1',
  termStartDate: '2025-09-08',
  termEndDate: '2026-01-30',
  nextTermBegins: '2026-02-16',
  headmasterName: 'Prof. Kwesi Yankah-Boateng (FCTI, PhD)',
  headmasterSignature: 'Prof. K. Yankah-Boateng',
  headmasterSignatureDataUrl: CITLFA_SIGNATORIES[0].signatureDataUrl,
  enabledModules: ['professional_credentials', 'alumni_endowment', 'ai_analytics'],
  signatories: CITLFA_SIGNATORIES,
};

export const CITLFA_USERS: UserAccount[] = [
  {
    id: 'usr-cit-01',
    name: 'Prof. Kwesi Yankah-Boateng',
    email: 'rector@citlfa.edu.gh',
    role: 'proprietor',
    title: 'Rector & Chief Executive Officer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    schoolId: 'sch-citlfa-04',
    signatureDataUrl: CITLFA_SIGNATORIES[0].signatureDataUrl,
    signatureMethod: 'uploaded',
    signatureUpdatedAt: '2025-09-01',
  },
  {
    id: 'usr-cit-02',
    name: 'Mrs. Efua Adomako-Mensah (LLM)',
    email: 'registrar@citlfa.edu.gh',
    role: 'admin',
    title: 'Registrar & Head of Credentials',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    schoolId: 'sch-citlfa-04',
    signatureDataUrl: CITLFA_SIGNATORIES[1].signatureDataUrl,
    signatureMethod: 'drawn',
    signatureUpdatedAt: '2025-09-02',
  },
  {
    id: 'usr-cit-03',
    name: 'Dr. Senyo Tetteh-Klu (CFE)',
    email: 's.tetteh@citlfa.edu.gh',
    role: 'teacher',
    title: 'Chief Examiner & Lead Forensic Lecturer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    schoolId: 'sch-citlfa-04',
    assignedClassId: 'cls-cit-l2',
    signatureDataUrl: CITLFA_SIGNATORIES[2].signatureDataUrl,
    signatureMethod: 'drawn',
    signatureUpdatedAt: '2025-09-04',
  },
  {
    id: 'usr-cit-stu-01',
    name: 'Abena Pokua Ofori',
    email: 'abena.ofori@candidate.citlfa.edu.gh',
    role: 'student',
    title: 'Level 2 Candidate (Chartered Tax Law & Forensic Accounting)',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80',
    schoolId: 'sch-citlfa-04',
    studentId: 'stu-cit-01',
    candidateId: 'cand-cit-01',
  },
  {
    id: 'usr-cit-grad-01',
    name: 'Kofi Asante-Boadu',
    email: 'kofi.boadu@alumni.citlfa.edu.gh',
    role: 'graduate',
    title: 'Graduate Member (Level 3 Finalist • Class of 2025)',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    schoolId: 'sch-citlfa-04',
    studentId: 'stu-cit-03',
    candidateId: 'cand-cit-03',
    graduateId: 'grad-cit-01',
  },
];

export const CITLFA_CLASSES: ClassRoom[] = [
  {
    id: 'cls-cit-l1',
    name: 'Level 1 (Foundation) Cohort',
    level: 'SHS',
    form: 1,
    stream: 'Foundation',
    formTutorTeacherId: 'usr-cit-03',
    roomNumber: 'Lecture Theatre A1',
    capacity: 80,
  },
  {
    id: 'cls-cit-l2',
    name: 'Level 2 (Managerial) Cohort',
    level: 'SHS',
    form: 2,
    stream: 'Managerial',
    formTutorTeacherId: 'usr-cit-03',
    roomNumber: 'Forensic Audit Lab B2',
    capacity: 65,
  },
  {
    id: 'cls-cit-l3',
    name: 'Level 3 (Professional Final) Cohort',
    level: 'SHS',
    form: 3,
    stream: 'Professional',
    formTutorTeacherId: 'usr-cit-01',
    roomNumber: 'Executive Chamber C1',
    capacity: 50,
  },
  {
    id: 'cls-cit-cert',
    name: 'Certificate Programme (Non-Chartered) Cohort',
    level: 'SHS',
    form: 4,
    stream: 'Certificate',
    formTutorTeacherId: 'usr-cit-02',
    roomNumber: 'Seminar Suite D1',
    capacity: 75,
  },
];

export const CITLFA_STUDENTS: Student[] = [
  {
    id: 'stu-cit-01',
    studentNumber: 'CIT-CAND-2025-0041',
    firstName: 'Abena',
    lastName: 'Ofori',
    otherNames: 'Pokua',
    gender: 'Female',
    dob: '1998-03-14',
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80',
    classId: 'cls-cit-l2',
    stream: 'Level 2 Managerial',
    programme: 'Chartered Tax Law & Forensic Accounting',
    boardingStatus: 'Day',
    guardianName: 'Self-Sponsored / Deloitte Tax Practice',
    guardianPhone: '+233 24 812 3390',
    guardianEmail: 'abena.ofori@candidate.citlfa.edu.gh',
    guardianRelationship: 'Employer Sponsor',
    emergencyContact: '+233 24 812 3390',
    medicalInfo: 'None',
    nationalIdOrNHIS: 'GHA-721894012-4',
    previousSchool: 'University of Ghana Business School (B.Sc. Admin)',
    admissionDate: '2024-09-05',
    status: 'Active',
  },
  {
    id: 'stu-cit-02',
    studentNumber: 'CIT-CAND-2025-0042',
    firstName: 'Yaw',
    lastName: 'Mensah-Korsah',
    gender: 'Male',
    dob: '1999-11-22',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    classId: 'cls-cit-l1',
    stream: 'Level 1 Foundation',
    programme: 'Chartered Tax Law & Forensic Accounting',
    boardingStatus: 'Day',
    guardianName: 'Self-Sponsored Candidate',
    guardianPhone: '+233 20 654 1198',
    guardianEmail: 'yaw.korsah@gmail.com',
    guardianRelationship: 'Self',
    emergencyContact: '+233 20 654 1198',
    medicalInfo: 'None',
    nationalIdOrNHIS: 'GHA-719002841-9',
    previousSchool: 'UPSA Accra (HND Accountancy)',
    admissionDate: '2025-01-14',
    status: 'Active',
  },
  {
    id: 'stu-cit-03',
    studentNumber: 'CIT-CAND-2023-0018',
    firstName: 'Kofi',
    lastName: 'Asante-Boadu',
    gender: 'Male',
    dob: '1995-07-08',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    classId: 'cls-cit-l3',
    stream: 'Level 3 Professional',
    programme: 'Chartered Tax Law & Forensic Accounting',
    boardingStatus: 'Day',
    guardianName: 'Ghana Revenue Authority (Study Leave)',
    guardianPhone: '+233 24 301 9981',
    guardianEmail: 'kofi.boadu@alumni.citlfa.edu.gh',
    guardianRelationship: 'Sponsoring Agency',
    emergencyContact: '+233 24 301 9981',
    medicalInfo: 'None',
    nationalIdOrNHIS: 'GHA-704519823-1',
    previousSchool: 'KNUST School of Business (B.Sc. Accounting)',
    admissionDate: '2023-02-10',
    status: 'Graduated',
  },
  {
    id: 'stu-cit-04',
    studentNumber: 'CIT-CAND-2024-0029',
    firstName: 'Esi',
    lastName: 'Baiden-Quansah',
    gender: 'Female',
    dob: '1996-05-19',
    photo: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=200&q=80',
    classId: 'cls-cit-l3',
    stream: 'Level 3 Professional',
    programme: 'Chartered Tax Law & Forensic Accounting',
    boardingStatus: 'Day',
    guardianName: 'PwC Ghana Advisory',
    guardianPhone: '+233 55 710 2244',
    guardianEmail: 'esi.quansah@pwc-candidate.gh',
    guardianRelationship: 'Corporate Sponsor',
    emergencyContact: '+233 55 710 2244',
    medicalInfo: 'None',
    nationalIdOrNHIS: 'GHA-711229843-7',
    previousSchool: 'University of Cape Coast (B.Com)',
    admissionDate: '2024-01-20',
    status: 'Active',
  },
];

export const CITLFA_FEE_ITEMS: FeeItem[] = [
  { id: 'fee-cit-1', name: 'Candidate Registration & Exemption Assessment Fee', amount: 650, term: 'Semester 1', classLevel: 'All' },
  { id: 'fee-cit-2', name: 'Professional Tuition & Forensic Lab Fee (Per Level)', amount: 2850, term: 'Semester 1', classLevel: 'All' },
  { id: 'fee-cit-3', name: 'Examination Diet & Moderation Fee', amount: 900, term: 'Semester 1', classLevel: 'All' },
];

export const CITLFA_FEE_PAYMENTS: FeePayment[] = [
  {
    id: 'pay-cit-01',
    receiptNumber: 'CIT-RCP-2025-001',
    studentId: 'stu-cit-01',
    amountPaid: 4400,
    paymentMethod: 'Bank Transfer',
    transactionRef: 'GCB-CIT-883920',
    payerName: 'Deloitte Tax Practice (Sponsor)',
    payerPhone: '+233 24 812 3390',
    date: '2025-09-10',
    term: 'Semester 1',
    academicYear: '2025/2026',
    status: 'Completed',
  },
  {
    id: 'pay-cit-02',
    receiptNumber: 'CIT-RCP-2025-002',
    studentId: 'stu-cit-03',
    amountPaid: 4400,
    paymentMethod: 'Bank Transfer',
    transactionRef: 'BOG-GRA-552190',
    payerName: 'Kofi Asante-Boadu',
    payerPhone: '+233 24 301 9981',
    date: '2025-04-12',
    term: 'Semester 1',
    academicYear: '2025/2026',
    status: 'Completed',
  },
];

export const CITLFA_TRANSACTIONS: SchoolTransaction[] = [
  {
    id: 'txn-cit-01',
    type: 'Income',
    category: 'School Fees',
    amount: 8800,
    date: '2025-09-10',
    reference: 'CIT-BATCH-2025-09',
    description: 'Professional Level 2 & Level 3 Examination & Tuition Remittances',
    approvedBy: 'Mrs. Efua Adomako-Mensah (Registrar)',
  },
];

export const CITLFA_STAFF: StaffMember[] = [
  {
    id: 'stf-cit-01',
    staffId: 'CIT-FAC-001',
    fullName: 'Dr. Senyo Tetteh-Klu (CFE, CPA)',
    gender: 'Male',
    role: 'Chief Examiner & Lead Lecturer (Forensic Accounting)',
    department: 'Forensic Audit & Financial Crime',
    qualification: 'Ph.D. Forensic Accounting (Manchester), CFE',
    phone: '+233 24 700 8821',
    email: 's.tetteh@citlfa.edu.gh',
    hireDate: '2020-02-01',
    ssnitNumber: 'C1092837465',
    tinNumber: 'P004819201',
    basicSalary: 8200,
    allowances: 2100,
    activeStatus: true,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'stf-cit-02',
    staffId: 'CIT-FAC-002',
    fullName: 'Counsel AkosuaGyamfi-Boateng (LLM Tax)',
    gender: 'Female',
    role: 'Senior Lecturer in International & Corporate Tax Law',
    department: 'Statutory Tax Law',
    qualification: 'LL.M. International Tax Law (LSE), Barrister-at-Law',
    phone: '+233 20 912 4410',
    email: 'a.gyamfi@citlfa.edu.gh',
    hireDate: '2021-09-01',
    ssnitNumber: 'C1099881122',
    tinNumber: 'P005519822',
    basicSalary: 7600,
    allowances: 1800,
    activeStatus: true,
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  },
];

export const CITLFA_ANNOUNCEMENTS: SchoolAnnouncement[] = [
  {
    id: 'anc-cit-01',
    title: 'November 2025 Professional Examination Diet Registration & Exemptions',
    content: 'All Level 1, Level 2, and Level 3 candidates must verify their exempted papers and clear examination fees prior to hall docket generation.',
    targetAudience: 'Students',
    channel: 'In-App',
    sentDate: '2025-09-20',
    author: 'Mrs. Efua Adomako-Mensah (Registrar)',
  },
];

// ============================================================================
// PROFESSIONAL PROGRAMMES, COURSES, CANDIDATES, CERTIFICATES & ALUMNI SEEDS
// ============================================================================

export interface TenantProfessionalBundle {
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
}

export const CITLFA_PROFESSIONAL_BUNDLE: TenantProfessionalBundle = {
  programmes: [
    {
      id: 'prog-cit-01',
      schoolId: 'sch-citlfa-04',
      code: 'CTLFA-PRO',
      title: 'Chartered Tax Law & Forensic Accounting',
      category: 'Professional Qualification',
      qualificationAwarded: 'Professional Qualifying Diploma in Tax Law & Forensic Accounting',
      professionalDesignation: 'ACTL (Associate Chartered Tax & Forensic Accountant — Awarded by Statutory Council upon 2 yrs practice)',
      affiliatedProfessionalBody: 'West African Council of Chartered Tax & Forensic Auditors (WACCTFA)',
      awardingAuthorityModel: 'Dual: Institution Award + Professional Body Designation',
      durationLabel: '3 Levels (18 – 36 Months)',
      totalCreditHours: 90,
      entryRequirements: 'Bachelor’s degree, HND, ICAG/ACCA Part 1, or mature candidate entrance assessment (minimum age 21).',
      assessmentMethods: '30% Continuous Case Dossier + 10% Digital Forensic Lab + 60% Closed-Book Statutory Examination.',
      examinationRegulations: 'Minimum pass mark of 50% per paper. Candidates may carry at most 1 trailing paper for resit before advancing.',
      progressionRules: 'Must pass or hold approved exemption in all mandatory Level papers (50%+) and clear 80%+ of level tuition to register for next Level.',
      completionRequirements: 'Pass all Level 1, Level 2, and Level 3 papers (90 credits), Ethics Workshop completion, 100% financial clearance, and NIA identity verification.',
      feeClearanceRequired: true,
      levels: [
        {
          levelNumber: 1,
          levelTitle: 'Level 1 (Foundation)',
          creditHoursRequired: 30,
          passMarkPercent: 50,
          maxAllowedResits: 3,
          levelFeeAmount: 3800,
          awardOnLevelCompletion: 'Foundation Certificate in Tax Administration & Financial Accounting',
        },
        {
          levelNumber: 2,
          levelTitle: 'Level 2 (Intermediate / Managerial)',
          creditHoursRequired: 30,
          passMarkPercent: 50,
          maxAllowedResits: 3,
          levelFeeAmount: 4400,
          awardOnLevelCompletion: 'Advanced Diploma in Corporate Taxation & Fraud Examination',
        },
        {
          levelNumber: 3,
          levelTitle: 'Level 3 (Advanced / Professional)',
          creditHoursRequired: 30,
          passMarkPercent: 50,
          maxAllowedResits: 2,
          levelFeeAmount: 5200,
          awardOnLevelCompletion: 'Professional Qualifying Diploma in Tax Law & Forensic Accounting',
        },
        {
          levelNumber: 4,
          levelTitle: 'Certificate (Non-Chartered Track)',
          creditHoursRequired: 18,
          passMarkPercent: 50,
          maxAllowedResits: 2,
          levelFeeAmount: 2400,
          awardOnLevelCompletion: 'Certificate in Practical Tax Compliance & Payroll Accounting (Non-Chartered)',
        },
      ],
      status: 'Active',
    },
    {
      id: 'prog-cit-02',
      schoolId: 'sch-citlfa-04',
      code: 'CERT-AML',
      title: 'Certificate in Anti-Money Laundering, Compliance & Digital Asset Tracing (Non-Chartered)',
      category: 'Certificate Programme',
      qualificationAwarded: 'Certificate in AML Compliance & Financial Forensics',
      affiliatedProfessionalBody: 'Direct Institutional Certificate (Non-Chartered)',
      awardingAuthorityModel: 'Institution Direct Award',
      durationLabel: 'Certificate Track (12 Weeks)',
      totalCreditHours: 18,
      entryRequirements: 'Open to compliance officers, bank staff, legal clerks, graduates, and working professionals (no chartered prerequisites).',
      assessmentMethods: '40% Practical AML Investigation Dossier + 60% Certificate Assessment.',
      examinationRegulations: 'Overall pass mark of 50% required for direct Certificate award; 75%+ earns Distinction.',
      progressionRules: 'Standalone non-chartered Certificate programme; direct eligibility for Certificate issuance upon passing course modules.',
      completionRequirements: 'Completion of 18 credit hours, practical case submission, and full certificate tuition settlement.',
      feeClearanceRequired: true,
      levels: [
        {
          levelNumber: 4,
          levelTitle: 'Certificate',
          creditHoursRequired: 18,
          passMarkPercent: 50,
          maxAllowedResits: 2,
          levelFeeAmount: 2800,
          awardOnLevelCompletion: 'Certificate in AML Compliance & Financial Forensics',
        },
      ],
      status: 'Active',
    },
  ],
  programmeCourses: [
    {
      id: 'crs-cit-101',
      schoolId: 'sch-citlfa-04',
      programmeId: 'prog-cit-01',
      levelNumber: 1,
      levelLabel: 'Level 1',
      code: 'TXL-101',
      title: 'Principles of Direct & Indirect Taxation (Act 896)',
      creditHours: 10,
      lecturerName: 'Counsel Akosua Gyamfi-Boateng',
      caWeightPercent: 30,
      practicalWeightPercent: 0,
      examWeightPercent: 70,
      isMandatory: true,
      examScheduleDate: '2025-11-18',
      semesterOrDiet: 'Nov 2025 Diet',
      courseDetails:
        'Comprehensive statutory coverage of Ghana Income Tax Act 2015 (Act 896), Value Added Tax Act (Act 870), chargeable income computation, employment/business/investment income schedules, capital allowances, and GRA filing procedures.',
      rationale:
        'Builds a rigorous statutory tax foundation required by tax practitioners, revenue officers, and corporate accountants advising enterprises across West Africa.',
      objectives: [
        'Classify chargeable income across employment, business, and investment sources under Act 896.',
        'Compute corporate and personal tax liabilities, withholding tax schedules, and capital allowances.',
        'Prepare compliant VAT, NHIL, GETFund, and statutory return filings.',
      ],
      flyerDataUrl: makeCourseFlyerSvg({
        instituteName: 'CITLFA Ghana',
        instituteCode: 'CITLFA-GH-04',
        courseCode: 'TXL-101',
        courseTitle: 'Principles of Direct & Indirect Taxation (Act 896)',
        levelLabel: 'Level 1',
        creditsLabel: '10 Credit Hours',
        dietLabel: 'Nov 2025 Diet',
        accent: 'emerald',
      }),
    },
    {
      id: 'crs-cit-102',
      schoolId: 'sch-citlfa-04',
      programmeId: 'prog-cit-01',
      levelNumber: 1,
      levelLabel: 'Level 1',
      code: 'FOR-102',
      title: 'Financial Reporting & Internal Control Systems',
      creditHours: 10,
      lecturerName: 'Dr. Senyo Tetteh-Klu',
      caWeightPercent: 30,
      practicalWeightPercent: 0,
      examWeightPercent: 70,
      isMandatory: true,
      examScheduleDate: '2025-11-20',
      semesterOrDiet: 'Nov 2025 Diet',
      courseDetails:
        'Covers IFRS financial statement preparation, COSO internal control frameworks, treasury reconciliation controls, and early red-flag detection in corporate ledgers.',
      rationale:
        'Forensic investigators and tax auditors must master IFRS reporting rules and control weaknesses before analyzing complex financial misstatements.',
      objectives: [
        'Prepare single-entity and consolidated financial statements in line with IFRS.',
        'Evaluate internal control matrices across procurement, payroll, and revenue cycles.',
        'Identify ledger anomalies indicative of control override or misstatements.',
      ],
      flyerDataUrl: makeCourseFlyerSvg({
        instituteName: 'CITLFA Ghana',
        instituteCode: 'CITLFA-GH-04',
        courseCode: 'FOR-102',
        courseTitle: 'Financial Reporting & Internal Control Systems',
        levelLabel: 'Level 1',
        creditsLabel: '10 Credit Hours',
        dietLabel: 'Nov 2025 Diet',
        accent: 'sky',
      }),
    },
    {
      id: 'crs-cit-103',
      schoolId: 'sch-citlfa-04',
      programmeId: 'prog-cit-01',
      levelNumber: 1,
      levelLabel: 'Level 1',
      code: 'LAW-103',
      title: 'Commercial, Company & Revenue Law',
      creditHours: 10,
      lecturerName: 'Counsel Akosua Gyamfi-Boateng',
      caWeightPercent: 30,
      practicalWeightPercent: 0,
      examWeightPercent: 70,
      isMandatory: true,
      examScheduleDate: '2025-11-22',
      semesterOrDiet: 'Nov 2025 Diet',
      courseDetails:
        'Examines the Companies Act 2019 (Act 992), Revenue Administration Act 2016 (Act 915), agency, contract law, corporate governance duties, and insolvency procedures.',
      rationale:
        'Grounds candidates in the statutory powers of revenue authorities, taxpayer rights, and corporate fiduciary obligations.',
      objectives: [
        'Interpret corporate governance duties and director liabilities under Act 992.',
        'Apply administrative objection, tax assessment, and recovery rules under Act 915.',
        'Advise organizations on statutory compliance and commercial contract enforceability.',
      ],
    },
    {
      id: 'crs-cit-201',
      schoolId: 'sch-citlfa-04',
      programmeId: 'prog-cit-01',
      levelNumber: 2,
      levelLabel: 'Level 2',
      code: 'TXL-201',
      title: 'Corporate Tax Planning, Transfer Pricing & Extractive Tax',
      creditHours: 15,
      lecturerName: 'Counsel Akosua Gyamfi-Boateng',
      caWeightPercent: 30,
      practicalWeightPercent: 10,
      examWeightPercent: 60,
      isMandatory: true,
      examScheduleDate: '2025-11-24',
      semesterOrDiet: 'Nov 2025 Diet',
      courseDetails:
        'Advanced corporate restructuring, OECD & Ghana Transfer Pricing Regulations (L.I. 2412), thin capitalization, mining/petroleum fiscal regimes, and group tax optimization.',
      rationale:
        'Equips managerial-level practitioners to structure cross-border and extractive transactions lawfully while defending transfer pricing documentation.',
      objectives: [
        'Benchmark related-party transactions using OECD and L.I. 2412 arm’s-length methods.',
        'Compute mineral royalties, petroleum income tax, and ring-fencing adjustments.',
        'Design lawful corporate tax compliance strategies for mergers and reorganizations.',
      ],
      flyerDataUrl: makeCourseFlyerSvg({
        instituteName: 'CITLFA Ghana',
        instituteCode: 'CITLFA-GH-04',
        courseCode: 'TXL-201',
        courseTitle: 'Corporate Tax Planning, Transfer Pricing & Extractive Tax',
        levelLabel: 'Level 2',
        creditsLabel: '15 Credit Hours',
        dietLabel: 'Nov 2025 Diet',
        accent: 'emerald',
      }),
    },
    {
      id: 'crs-cit-202',
      schoolId: 'sch-citlfa-04',
      programmeId: 'prog-cit-01',
      levelNumber: 2,
      levelLabel: 'Level 2',
      code: 'FOR-202',
      title: 'Digital Forensics, Fraud Investigation & Evidence Law',
      creditHours: 15,
      lecturerName: 'Dr. Senyo Tetteh-Klu',
      lecturerUserId: 'usr-cit-03',
      caWeightPercent: 25,
      practicalWeightPercent: 15,
      examWeightPercent: 60,
      isMandatory: true,
      examScheduleDate: '2025-11-26',
      semesterOrDiet: 'Nov 2025 Diet',
      courseDetails:
        'Chain-of-custody preservation, electronic ledger extraction, Benford’s Law analytics, procurement & payroll fraud schemes, investigative interviewing, and Evidence Act (NRCD 323) admissibility.',
      rationale:
        'Modern financial crime leaves digital trails; practitioners need hands-on forensic lab competence that withstands courtroom scrutiny.',
      objectives: [
        'Execute forensic data imaging and preserve chain-of-custody logs.',
        'Run anomaly detection scripts on journal entries, vendor master files, and MoMo ledgers.',
        'Compile admissible forensic investigation dossiers compliant with NRCD 323.',
      ],
    },
    {
      id: 'crs-cit-301',
      schoolId: 'sch-citlfa-04',
      programmeId: 'prog-cit-01',
      levelNumber: 3,
      levelLabel: 'Level 3',
      code: 'TXL-301',
      title: 'International Tax Treaties, Tax Litigation & Revenue Audit',
      creditHours: 15,
      lecturerName: 'Prof. Kwesi Yankah-Boateng',
      lecturerUserId: 'usr-cit-01',
      caWeightPercent: 30,
      practicalWeightPercent: 10,
      examWeightPercent: 60,
      isMandatory: true,
      examScheduleDate: '2025-11-28',
      semesterOrDiet: 'Nov 2025 Diet',
      courseDetails:
        'Double Taxation Agreements (OECD & UN Models), BEPS Pillar 1 & 2, Independent Tax Appeals Board (ITAB) advocacy, High Court tax litigation, and comprehensive revenue audit defence.',
      rationale:
        'Prepares final-level chartered candidates to lead complex revenue audits and represent clients before tax tribunals.',
      objectives: [
        'Interpret Double Taxation Treaty articles on permanent establishment, royalties, and dividends.',
        'Draft formal tax objection notices and ITAB appeal memoranda.',
        'Lead end-to-end field and desk tax audits for multinational entities.',
      ],
    },
    {
      id: 'crs-cit-302',
      schoolId: 'sch-citlfa-04',
      programmeId: 'prog-cit-01',
      levelNumber: 3,
      levelLabel: 'Level 3',
      code: 'FOR-302',
      title: 'Expert Witness Testimony & Forensic Accounting Case Dossier',
      creditHours: 15,
      lecturerName: 'Dr. Senyo Tetteh-Klu',
      lecturerUserId: 'usr-cit-03',
      caWeightPercent: 30,
      practicalWeightPercent: 20,
      examWeightPercent: 50,
      isMandatory: true,
      examScheduleDate: '2025-11-30',
      semesterOrDiet: 'Nov 2025 Diet',
      courseDetails:
        'Quantum-of-loss valuation, asset recovery tracing, drafting Court-ready Expert Witness Reports, and cross-examination simulation.',
      rationale:
        'Culminating professional capstone ensuring graduates can quantify economic damages and defend findings under cross-examination.',
      objectives: [
        'Quantify economic loss, illicit enrichment, and commercial damages.',
        'Author an independent Expert Witness Report conforming to judicial standards.',
        'Defend forensic methodologies under simulated courtroom cross-examination.',
      ],
    },
    {
      id: 'crs-cit-cert-105',
      schoolId: 'sch-citlfa-04',
      programmeId: 'prog-cit-01',
      levelNumber: 4,
      levelLabel: 'Certificate',
      code: 'CERT-105',
      title: 'Certificate in Practical Tax Filing, GRA Portal & Payroll Compliance',
      creditHours: 18,
      lecturerName: 'Mrs. Efua Adomako-Mensah (LLM, FCA)',
      lecturerUserId: 'usr-cit-02',
      caWeightPercent: 40,
      practicalWeightPercent: 20,
      examWeightPercent: 40,
      isMandatory: true,
      examScheduleDate: '2025-12-03',
      semesterOrDiet: 'Certificate Cohort Q4',
      courseDetails:
        'Hands-on non-chartered certificate course covering the Ghana Taxpayers Portal, monthly PAYE & SSNIT e-filing, withholding tax credits, E-VAT invoicing, and SME bookkeeping compliance.',
      rationale:
        'Designed specifically for SME accountants, payroll officers, entrepreneurs, and administrative staff seeking a recognized practical Certificate without enrolling in the 3-level Chartered pathway.',
      objectives: [
        'Compute and file monthly PAYE, Tier 1/2 SSNIT, and withholding tax returns on taxpayers.gov.gh.',
        'Reconcile E-VAT schedules and resolve common GRA compliance desk queries.',
        'Maintain audit-ready SME tax and payroll registers.',
      ],
      flyerDataUrl: makeCourseFlyerSvg({
        instituteName: 'CITLFA Ghana',
        instituteCode: 'CITLFA-GH-04',
        courseCode: 'CERT-105',
        courseTitle: 'Certificate in Practical Tax Filing, GRA Portal & Payroll Compliance',
        levelLabel: 'Certificate',
        creditsLabel: '18 Credit Hours • Non-Chartered',
        dietLabel: 'Certificate Cohort Q4',
        accent: 'amber',
      }),
    },
    {
      id: 'crs-cit-exec-1',
      schoolId: 'sch-citlfa-04',
      programmeId: 'prog-cit-02',
      levelNumber: 4,
      levelLabel: 'Certificate',
      code: 'AML-401',
      title: 'FATF Standards, Illicit Financial Flows & Digital Asset Tracing',
      creditHours: 18,
      lecturerName: 'Dr. Senyo Tetteh-Klu',
      lecturerUserId: 'usr-cit-03',
      caWeightPercent: 40,
      practicalWeightPercent: 0,
      examWeightPercent: 60,
      isMandatory: true,
      examScheduleDate: '2025-12-05',
      semesterOrDiet: 'Certificate Cohort Q4',
      courseDetails:
        'Covers Ghana Anti-Money Laundering Act 2020 (Act 1044), Financial Intelligence Centre (FIC) Suspicious Transaction Reporting (STR), KYC/CDD risk scoring, sanctions screening, and blockchain transaction tracing.',
      rationale:
        'Provides a standalone, non-chartered professional Certificate for compliance officers, banking staff, fintech analysts, and legal practitioners.',
      objectives: [
        'Implement risk-based KYC/CDD and Politically Exposed Person (PEP) screening workflows.',
        'Draft high-quality Suspicious Transaction Reports (STRs) for Financial Intelligence Centre submission.',
        'Trace cross-border wire and virtual-asset typologies.',
      ],
      flyerDataUrl: makeCourseFlyerSvg({
        instituteName: 'CITLFA Ghana',
        instituteCode: 'CITLFA-GH-04',
        courseCode: 'AML-401',
        courseTitle: 'FATF Standards, Illicit Financial Flows & Digital Asset Tracing',
        levelLabel: 'Certificate',
        creditsLabel: '18 Credit Hours • Non-Chartered',
        dietLabel: 'Certificate Cohort Q4',
        accent: 'amber',
      }),
    },
  ],
  candidates: [
    {
      id: 'cand-cit-01',
      schoolId: 'sch-citlfa-04',
      studentId: 'stu-cit-01',
      candidateNumber: 'CIT-CAND-2025-0041',
      firstName: 'Abena',
      lastName: 'Ofori',
      otherNames: 'Pokua',
      gender: 'Female',
      dob: '1998-03-14',
      email: 'abena.ofori@candidate.citlfa.edu.gh',
      phone: '+233 24 812 3390',
      photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80',
      nationalIdNumber: 'GHA-721894012-4',
      identityVerified: true,
      identityDocumentType: 'Ghana Card (NIA)',
      previousQualifications: 'B.Sc. Administration (Accounting Option), University of Ghana — Second Class Upper',
      programmeId: 'prog-cit-01',
      currentLevel: 2,
      completedLevels: [1],
      enrollmentDate: '2024-09-05',
      status: 'Active',
      membershipStatus: 'Affiliate / Technician Member',
      membershipNumber: 'CIT-AFF-2024-119',
      totalFeesBilled: 4400,
      totalFeesPaid: 4400,
      directoryConsent: true,
      headlineOrRole: 'Senior Tax Associate • Deloitte Ghana',
    },
    {
      id: 'cand-cit-02',
      schoolId: 'sch-citlfa-04',
      studentId: 'stu-cit-02',
      candidateNumber: 'CIT-CAND-2025-0042',
      firstName: 'Yaw',
      lastName: 'Mensah-Korsah',
      gender: 'Male',
      dob: '1999-11-22',
      email: 'yaw.korsah@gmail.com',
      phone: '+233 20 654 1198',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
      nationalIdNumber: 'GHA-719002841-9',
      identityVerified: true,
      identityDocumentType: 'Ghana Card (NIA)',
      previousQualifications: 'HND Accountancy, UPSA Accra',
      programmeId: 'prog-cit-01',
      currentLevel: 1,
      completedLevels: [],
      enrollmentDate: '2025-01-14',
      status: 'Active',
      membershipStatus: 'Registered Student Candidate',
      membershipNumber: 'CIT-STU-2025-308',
      totalFeesBilled: 3800,
      totalFeesPaid: 2400,
      directoryConsent: false,
      headlineOrRole: 'Junior Accounts Officer',
    },
    {
      id: 'cand-cit-03',
      schoolId: 'sch-citlfa-04',
      studentId: 'stu-cit-03',
      candidateNumber: 'CIT-CAND-2023-0018',
      firstName: 'Kofi',
      lastName: 'Asante-Boadu',
      gender: 'Male',
      dob: '1995-07-08',
      email: 'kofi.boadu@alumni.citlfa.edu.gh',
      phone: '+233 24 301 9981',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
      nationalIdNumber: 'GHA-704519823-1',
      identityVerified: true,
      identityDocumentType: 'Ghana Card (NIA)',
      previousQualifications: 'B.Sc. Accounting, KNUST (First Class Honours)',
      programmeId: 'prog-cit-01',
      currentLevel: 3,
      completedLevels: [1, 2, 3],
      enrollmentDate: '2023-02-10',
      status: 'Completed / Graduated',
      membershipStatus: 'Associate Member (Awarded by External Professional Body)',
      membershipNumber: 'WACCTFA-ACTL-0892',
      totalFeesBilled: 5200,
      totalFeesPaid: 5200,
      directoryConsent: true,
      headlineOrRole: 'Principal Revenue Forensic Auditor • Ghana Revenue Authority',
    },
    {
      id: 'cand-cit-04',
      schoolId: 'sch-citlfa-04',
      studentId: 'stu-cit-04',
      candidateNumber: 'CIT-CAND-2024-0029',
      firstName: 'Esi',
      lastName: 'Baiden-Quansah',
      gender: 'Female',
      dob: '1996-05-19',
      email: 'esi.quansah@pwc-candidate.gh',
      phone: '+233 55 710 2244',
      photo: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=200&q=80',
      nationalIdNumber: 'GHA-711229843-7',
      identityVerified: true,
      identityDocumentType: 'Passport',
      previousQualifications: 'B.Com (Accounting & Finance), University of Cape Coast',
      programmeId: 'prog-cit-01',
      currentLevel: 3,
      completedLevels: [1, 2, 3],
      enrollmentDate: '2024-01-20',
      status: 'Active',
      membershipStatus: 'Graduate Member (Institution Complete)',
      membershipNumber: 'CIT-GRAD-2025-044',
      totalFeesBilled: 5200,
      totalFeesPaid: 5200,
      directoryConsent: true,
      headlineOrRole: 'Forensic Advisory Manager • PwC Ghana',
    },
    {
      id: 'cand-cit-05',
      schoolId: 'sch-citlfa-04',
      candidateNumber: 'CIT-CERT-2025-0088',
      firstName: 'Nana',
      lastName: 'Adjei-Boateng',
      gender: 'Male',
      dob: '1997-09-12',
      email: 'nana.adjei@compliance-gh.com',
      phone: '+233 24 519 8820',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      nationalIdNumber: 'GHA-725901122-3',
      identityVerified: true,
      identityDocumentType: 'Ghana Card (NIA)',
      previousQualifications: 'BBA Banking & Finance, UPSA Accra',
      programmeId: 'prog-cit-02',
      currentLevel: 4,
      completedLevels: [],
      enrollmentDate: '2025-09-15',
      status: 'Active',
      membershipStatus: 'Not Applicable (Academic / Vocational Only)',
      totalFeesBilled: 2800,
      totalFeesPaid: 2800,
      directoryConsent: true,
      headlineOrRole: 'AML Compliance Analyst (Certificate Programme)',
    },
  ],
  candidateAssessments: [
    // Abena (cand-cit-01): Passed/Exempted Level 1 AND Passed Level 2 -> Eligible to progress to Level 3!
    {
      id: 'ass-cit-01',
      candidateId: 'cand-cit-01',
      programmeId: 'prog-cit-01',
      courseId: 'crs-cit-102',
      levelNumber: 1,
      examDiet: 'Nov 2024 Diet',
      attendancePercent: 100,
      caScore: 0,
      practicalScore: 0,
      examScore: 0,
      totalScore: 0,
      grade: 'EXEMPT',
      paperStatus: 'Exempted',
      exemptionBasis: 'UGBS B.Sc. Administration (Accounting) Accredited Exemption',
      moderated: true,
      moderatedBy: 'Dr. Senyo Tetteh-Klu',
      resitAttemptCount: 0,
    },
    {
      id: 'ass-cit-02',
      candidateId: 'cand-cit-01',
      programmeId: 'prog-cit-01',
      courseId: 'crs-cit-201',
      levelNumber: 2,
      examDiet: 'May 2025 Diet',
      attendancePercent: 94,
      caScore: 26,
      practicalScore: 9,
      examScore: 47,
      totalScore: 82,
      grade: 'Distinction',
      paperStatus: 'Passed',
      moderated: true,
      moderatedBy: 'Prof. Kwesi Yankah-Boateng',
      resitAttemptCount: 0,
    },
    {
      id: 'ass-cit-03',
      candidateId: 'cand-cit-01',
      programmeId: 'prog-cit-01',
      courseId: 'crs-cit-202',
      levelNumber: 2,
      examDiet: 'May 2025 Diet',
      attendancePercent: 96,
      caScore: 22,
      practicalScore: 13,
      examScore: 43,
      totalScore: 78,
      grade: 'Distinction',
      paperStatus: 'Passed',
      moderated: true,
      moderatedBy: 'Dr. Senyo Tetteh-Klu',
      resitAttemptCount: 0,
    },
    // Yaw (cand-cit-02): Level 1 with 1 Resit Required + outstanding fee balance -> Restricted from progression
    {
      id: 'ass-cit-04',
      candidateId: 'cand-cit-02',
      programmeId: 'prog-cit-01',
      courseId: 'crs-cit-101',
      levelNumber: 1,
      examDiet: 'May 2025 Diet',
      attendancePercent: 88,
      caScore: 21,
      practicalScore: 0,
      examScore: 43,
      totalScore: 64,
      grade: 'Credit',
      paperStatus: 'Passed',
      moderated: true,
      moderatedBy: 'Counsel Akosua Gyamfi-Boateng',
      resitAttemptCount: 0,
    },
    {
      id: 'ass-cit-05',
      candidateId: 'cand-cit-02',
      programmeId: 'prog-cit-01',
      courseId: 'crs-cit-102',
      levelNumber: 1,
      examDiet: 'May 2025 Diet',
      attendancePercent: 76,
      caScore: 16,
      practicalScore: 0,
      examScore: 26,
      totalScore: 42,
      grade: 'Fail (Resit)',
      paperStatus: 'Resit Required',
      invigilationNotes: 'Candidate struggled in Section B consolidation schedules; scheduled for Nov resit.',
      moderated: true,
      moderatedBy: 'Dr. Senyo Tetteh-Klu',
      resitAttemptCount: 1,
    },
    {
      id: 'ass-cit-06',
      candidateId: 'cand-cit-02',
      programmeId: 'prog-cit-01',
      courseId: 'crs-cit-103',
      levelNumber: 1,
      examDiet: 'May 2025 Diet',
      attendancePercent: 84,
      caScore: 19,
      practicalScore: 0,
      examScore: 36,
      totalScore: 55,
      grade: 'Pass',
      paperStatus: 'Passed',
      moderated: true,
      moderatedBy: 'Counsel Akosua Gyamfi-Boateng',
      resitAttemptCount: 0,
    },
    // Kofi (cand-cit-03): Passed all Level 3 papers -> Graduated!
    {
      id: 'ass-cit-07',
      candidateId: 'cand-cit-03',
      programmeId: 'prog-cit-01',
      courseId: 'crs-cit-301',
      levelNumber: 3,
      examDiet: 'May 2025 Diet',
      attendancePercent: 98,
      caScore: 27,
      practicalScore: 9,
      examScore: 50,
      totalScore: 86,
      grade: 'Distinction',
      paperStatus: 'Passed',
      moderated: true,
      moderatedBy: 'Prof. Kwesi Yankah-Boateng',
      resitAttemptCount: 0,
    },
    {
      id: 'ass-cit-08',
      candidateId: 'cand-cit-03',
      programmeId: 'prog-cit-01',
      courseId: 'crs-cit-302',
      levelNumber: 3,
      examDiet: 'May 2025 Diet',
      attendancePercent: 100,
      caScore: 26,
      practicalScore: 18,
      examScore: 44,
      totalScore: 88,
      grade: 'Distinction',
      paperStatus: 'Passed',
      moderated: true,
      moderatedBy: 'Dr. Senyo Tetteh-Klu',
      resitAttemptCount: 0,
    },
    // Esi (cand-cit-04): Passed all Level 3 papers & cleared fees -> Ready for Graduation & Certificate Approval!
    {
      id: 'ass-cit-09',
      candidateId: 'cand-cit-04',
      programmeId: 'prog-cit-01',
      courseId: 'crs-cit-301',
      levelNumber: 3,
      examDiet: 'May 2025 Diet',
      attendancePercent: 95,
      caScore: 24,
      practicalScore: 8,
      examScore: 45,
      totalScore: 77,
      grade: 'Distinction',
      paperStatus: 'Passed',
      moderated: true,
      moderatedBy: 'Prof. Kwesi Yankah-Boateng',
      resitAttemptCount: 0,
    },
    {
      id: 'ass-cit-10',
      candidateId: 'cand-cit-04',
      programmeId: 'prog-cit-01',
      courseId: 'crs-cit-302',
      levelNumber: 3,
      examDiet: 'May 2025 Diet',
      attendancePercent: 97,
      caScore: 25,
      practicalScore: 17,
      examScore: 39,
      totalScore: 81,
      grade: 'Distinction',
      paperStatus: 'Passed',
      moderated: true,
      moderatedBy: 'Dr. Senyo Tetteh-Klu',
      resitAttemptCount: 0,
    },
  ],
  certificateTemplates: [
    {
      id: 'tpl-cit-default',
      schoolId: 'sch-citlfa-04',
      name: 'Official Royal Charter Diploma & Level Credential',
      themeStyle: 'royal-navy',
      orientation: 'landscape',
      headerSubtitle: 'Established Under GTEC Professional Charter • Accredited Examination & Credentialing Body',
      sealLabel: 'OFFICIAL CHARTER SEAL • CITLFA GHANA',
      showQrCode: true,
      showCandidateId: true,
      showLevelCompleted: true,
      showCreditHours: true,
      showAuthorityDisclaimer: true,
      authorityDisclaimerText:
        'AUTHORITY NOTICE: This academic & qualifying diploma is awarded directly by the Chartered Institute of Tax Law & Forensic Accounting (CITLFA). Statutory practice license and the ACTL Chartered Membership designation are conferred separately by WACCTFA upon induction.',
      primarySignatoryId: 'sig-cit-01',
      secondarySignatoryId: 'sig-cit-02',
      tertiarySignatoryId: 'sig-cit-03',
    },
  ],
  issuedCredentials: [
    // 1. Valid Full Qualification Diploma + Executive Certificate for Kofi Asante-Boadu (shows multiple credentials per graduate!)
    {
      id: 'cred-cit-01',
      schoolId: 'sch-citlfa-04',
      schoolName: 'Chartered Institute of Tax Law & Forensic Accounting',
      schoolCode: 'CITLFA-GH-04',
      schoolCrest: CITLFA_SCHOOL.crest,
      certificateNumber: 'CITLFA-2025-L3-00108',
      verificationCode: 'VRF-9K4M-772A',
      candidateId: 'cand-cit-03',
      candidateNumber: 'CIT-CAND-2023-0018',
      recipientFullName: 'Kofi Asante-Boadu',
      programmeId: 'prog-cit-01',
      programmeTitle: 'Chartered Tax Law & Forensic Accounting',
      credentialType: 'Full Qualification Certificate',
      qualificationAwarded: 'Professional Qualifying Diploma in Tax Law & Forensic Accounting',
      levelCompletedLabel: 'Level 3 (Advanced / Professional Final)',
      honoursOrDistinction: 'With Distinction',
      creditHoursCompleted: 90,
      issueDate: '2025-07-18',
      status: 'Valid',
      awardingAuthorityName: 'Chartered Institute of Tax Law & Forensic Accounting (GTEC Accredited)',
      professionalBodyAffiliationNote:
        'Qualifies holder for Associate Chartered Tax & Forensic Accountant (ACTL) induction by WACCTFA.',
      templateId: 'tpl-cit-default',
      signatoriesSnapshot: [
        {
          name: CITLFA_SIGNATORIES[0].name,
          title: CITLFA_SIGNATORIES[0].title,
          signatureDataUrl: CITLFA_SIGNATORIES[0].signatureDataUrl,
        },
        {
          name: CITLFA_SIGNATORIES[1].name,
          title: CITLFA_SIGNATORIES[1].title,
          signatureDataUrl: CITLFA_SIGNATORIES[1].signatureDataUrl,
        },
        {
          name: CITLFA_SIGNATORIES[2].name,
          title: CITLFA_SIGNATORIES[2].title,
          signatureDataUrl: CITLFA_SIGNATORIES[2].signatureDataUrl,
        },
      ],
      auditTrail: [
        {
          id: 'aud-cit-01',
          timestamp: '2025-07-15 10:15 UTC',
          actorName: 'Dr. Senyo Tetteh-Klu',
          actorRole: 'Chief Examiner',
          previousStatus: 'Draft',
          newStatus: 'Pending Approval',
          reason: 'Level 3 Senate examination board results moderated and approved.',
        },
        {
          id: 'aud-cit-02',
          timestamp: '2025-07-18 14:30 UTC',
          actorName: 'Mrs. Efua Adomako-Mensah (LLM)',
          actorRole: 'Registrar',
          previousStatus: 'Pending Approval',
          newStatus: 'Valid',
          reason: 'Full academic, ethics workshop, NIA identity, and GRA tuition clearance verified. Transferred to Alumni Register.',
        },
      ],
    },
    {
      id: 'cred-cit-02',
      schoolId: 'sch-citlfa-04',
      schoolName: 'Chartered Institute of Tax Law & Forensic Accounting',
      schoolCode: 'CITLFA-GH-04',
      schoolCrest: CITLFA_SCHOOL.crest,
      certificateNumber: 'CITLFA-2025-EX-00214',
      verificationCode: 'VRF-3P8L-910C',
      candidateId: 'cand-cit-03',
      candidateNumber: 'CIT-CAND-2023-0018',
      recipientFullName: 'Kofi Asante-Boadu',
      programmeId: 'prog-cit-02',
      programmeTitle: 'Executive Certificate in Anti-Money Laundering & Digital Asset Tracing',
      credentialType: 'Executive Programme Certificate',
      qualificationAwarded: 'Executive Certificate in AML Compliance & Financial Forensics',
      levelCompletedLabel: 'Executive Cohort (Single Level)',
      honoursOrDistinction: 'With Distinction',
      creditHoursCompleted: 18,
      issueDate: '2025-09-02',
      expiryDate: '2028-09-02',
      status: 'Valid',
      awardingAuthorityName: 'Chartered Institute of Tax Law & Forensic Accounting (Executive Wing)',
      templateId: 'tpl-cit-default',
      signatoriesSnapshot: [
        {
          name: CITLFA_SIGNATORIES[0].name,
          title: CITLFA_SIGNATORIES[0].title,
          signatureDataUrl: CITLFA_SIGNATORIES[0].signatureDataUrl,
        },
        {
          name: CITLFA_SIGNATORIES[1].name,
          title: CITLFA_SIGNATORIES[1].title,
          signatureDataUrl: CITLFA_SIGNATORIES[1].signatureDataUrl,
        },
      ],
      auditTrail: [
        {
          id: 'aud-cit-03',
          timestamp: '2025-09-02 11:00 UTC',
          actorName: 'Mrs. Efua Adomako-Mensah (LLM)',
          actorRole: 'Registrar',
          previousStatus: 'Draft',
          newStatus: 'Valid',
          reason: 'Executive AML Capstone defended with 89% score; 3-year compliance credential issued.',
        },
      ],
    },
    // 2. Valid Level 1 Foundation Certificate for Abena Ofori
    {
      id: 'cred-cit-03',
      schoolId: 'sch-citlfa-04',
      schoolName: 'Chartered Institute of Tax Law & Forensic Accounting',
      schoolCode: 'CITLFA-GH-04',
      schoolCrest: CITLFA_SCHOOL.crest,
      certificateNumber: 'CITLFA-2025-L1-00089',
      verificationCode: 'VRF-5T2W-441B',
      candidateId: 'cand-cit-01',
      candidateNumber: 'CIT-CAND-2025-0041',
      recipientFullName: 'Abena Pokua Ofori',
      programmeId: 'prog-cit-01',
      programmeTitle: 'Chartered Tax Law & Forensic Accounting',
      credentialType: 'Level Completion Certificate',
      qualificationAwarded: 'Foundation Certificate in Tax Administration & Financial Accounting',
      levelCompletedLabel: 'Level 1 (Foundation)',
      honoursOrDistinction: 'Merit',
      creditHoursCompleted: 30,
      issueDate: '2025-01-25',
      status: 'Valid',
      awardingAuthorityName: 'Chartered Institute of Tax Law & Forensic Accounting',
      templateId: 'tpl-cit-default',
      signatoriesSnapshot: [
        {
          name: CITLFA_SIGNATORIES[0].name,
          title: CITLFA_SIGNATORIES[0].title,
          signatureDataUrl: CITLFA_SIGNATORIES[0].signatureDataUrl,
        },
        {
          name: CITLFA_SIGNATORIES[1].name,
          title: CITLFA_SIGNATORIES[1].title,
          signatureDataUrl: CITLFA_SIGNATORIES[1].signatureDataUrl,
        },
      ],
      auditTrail: [
        {
          id: 'aud-cit-04',
          timestamp: '2025-01-25 09:40 UTC',
          actorName: 'Mrs. Efua Adomako-Mensah (LLM)',
          actorRole: 'Registrar',
          previousStatus: 'Pending Approval',
          newStatus: 'Valid',
          reason: 'Completed Level 1 Foundation requirements and advanced to Level 2 Managerial.',
        },
      ],
    },
    // 3. Pending Approval Certificate for Esi Baiden-Quansah (so Admin can test 1-click Approval & Alumni Transfer!)
    {
      id: 'cred-cit-04',
      schoolId: 'sch-citlfa-04',
      schoolName: 'Chartered Institute of Tax Law & Forensic Accounting',
      schoolCode: 'CITLFA-GH-04',
      schoolCrest: CITLFA_SCHOOL.crest,
      certificateNumber: 'CITLFA-2025-L3-00119',
      verificationCode: 'VRF-7M9Q-602E',
      candidateId: 'cand-cit-04',
      candidateNumber: 'CIT-CAND-2024-0029',
      recipientFullName: 'Esi Baiden-Quansah',
      programmeId: 'prog-cit-01',
      programmeTitle: 'Chartered Tax Law & Forensic Accounting',
      credentialType: 'Full Qualification Certificate',
      qualificationAwarded: 'Professional Qualifying Diploma in Tax Law & Forensic Accounting',
      levelCompletedLabel: 'Level 3 (Advanced / Professional Final)',
      honoursOrDistinction: 'With Distinction',
      creditHoursCompleted: 90,
      issueDate: '2025-10-12',
      status: 'Pending Approval',
      awardingAuthorityName: 'Chartered Institute of Tax Law & Forensic Accounting',
      professionalBodyAffiliationNote: 'Eligible for WACCTFA Associate induction upon final Rector sign-off.',
      templateId: 'tpl-cit-default',
      signatoriesSnapshot: [
        {
          name: CITLFA_SIGNATORIES[0].name,
          title: CITLFA_SIGNATORIES[0].title,
          signatureDataUrl: CITLFA_SIGNATORIES[0].signatureDataUrl,
        },
        {
          name: CITLFA_SIGNATORIES[1].name,
          title: CITLFA_SIGNATORIES[1].title,
          signatureDataUrl: CITLFA_SIGNATORIES[1].signatureDataUrl,
        },
      ],
      auditTrail: [
        {
          id: 'aud-cit-05',
          timestamp: '2025-10-12 16:05 UTC',
          actorName: 'Dr. Senyo Tetteh-Klu',
          actorRole: 'Chief Examiner',
          previousStatus: 'Draft',
          newStatus: 'Pending Approval',
          reason: 'All Level 3 papers passed with Distinction; awaiting Registrar & Rector issuance approval.',
        },
      ],
    },
    // 4. Historical Revoked Certificate (preserved in audit register — never deleted!)
    {
      id: 'cred-cit-05',
      schoolId: 'sch-citlfa-04',
      schoolName: 'Chartered Institute of Tax Law & Forensic Accounting',
      schoolCode: 'CITLFA-GH-04',
      schoolCrest: CITLFA_SCHOOL.crest,
      certificateNumber: 'CITLFA-2024-L2-00031',
      verificationCode: 'VRF-0R0K-994X',
      candidateId: 'cand-cit-revoked',
      candidateNumber: 'CIT-CAND-2023-0099',
      recipientFullName: 'Bernard Tettey-fio',
      programmeId: 'prog-cit-01',
      programmeTitle: 'Chartered Tax Law & Forensic Accounting',
      credentialType: 'Level Completion Certificate',
      qualificationAwarded: 'Advanced Diploma in Corporate Taxation & Fraud Examination',
      levelCompletedLabel: 'Level 2 (Intermediate / Managerial)',
      creditHoursCompleted: 60,
      issueDate: '2024-06-14',
      status: 'Revoked',
      revocationOrStatusReason:
        'Revoked by Academic Senate Order #SEN-2024-19 following substantiated prior-qualification transcript falsification during exemption audit.',
      awardingAuthorityName: 'Chartered Institute of Tax Law & Forensic Accounting',
      templateId: 'tpl-cit-default',
      signatoriesSnapshot: [
        {
          name: CITLFA_SIGNATORIES[0].name,
          title: CITLFA_SIGNATORIES[0].title,
          signatureDataUrl: CITLFA_SIGNATORIES[0].signatureDataUrl,
        },
      ],
      auditTrail: [
        {
          id: 'aud-cit-06',
          timestamp: '2024-06-14 12:00 UTC',
          actorName: 'Mrs. Efua Adomako-Mensah (LLM)',
          actorRole: 'Registrar',
          previousStatus: 'Pending Approval',
          newStatus: 'Valid',
          reason: 'Initial Level 2 credential issuance.',
        },
        {
          id: 'aud-cit-07',
          timestamp: '2024-11-04 15:22 UTC',
          actorName: 'Prof. Kwesi Yankah-Boateng',
          actorRole: 'Rector & CEO',
          previousStatus: 'Valid',
          newStatus: 'Revoked',
          reason: 'Revoked by Senate Order #SEN-2024-19 due to substantiated entry-exemption document falsification. Historical record preserved.',
        },
      ],
    },
  ],
  graduateRecords: [
    {
      id: 'grad-cit-01',
      schoolId: 'sch-citlfa-04',
      candidateId: 'cand-cit-03',
      candidateNumber: 'CIT-CAND-2023-0018',
      fullName: 'Kofi Asante-Boadu',
      email: 'kofi.boadu@alumni.citlfa.edu.gh',
      phone: '+233 24 301 9981',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
      programmeId: 'prog-cit-01',
      programmeTitle: 'Chartered Tax Law & Forensic Accounting',
      qualificationAwarded: 'Professional Qualifying Diploma in Tax Law & Forensic Accounting',
      levelAttained: 'Level 3 (Advanced / Professional Final)',
      graduationYear: 2025,
      completionApprovedDate: '2025-07-18',
      certificateNumber: 'CITLFA-2025-L3-00108',
      verificationCode: 'VRF-9K4M-772A',
      certificateStatus: 'Valid',
      membershipStatus: 'Associate Member (Awarded by External Professional Body)',
      professionalBodyDesignation: 'ACTL (WACCTFA Reg #0892)',
      directoryConsent: true,
      currentEmployerOrRole: 'Principal Revenue Forensic Auditor • Ghana Revenue Authority',
    },
  ],
  replacementRequests: [
    {
      id: 'rep-cit-01',
      schoolId: 'sch-citlfa-04',
      candidateId: 'cand-cit-01',
      originalCertificateId: 'cred-cit-03',
      originalCertificateNumber: 'CITLFA-2025-L1-00089',
      requesterName: 'Abena Pokua Ofori',
      reason: 'Damaged Physical Copy',
      details: 'Embossed gold seal on physical parchment copy was damaged in transit; requesting certified replacement serial.',
      requestedDate: '2025-10-08',
      status: 'Pending Review',
    },
  ],
  accreditations: [
    {
      id: 'acc-cit-01',
      schoolId: 'sch-citlfa-04',
      authorityName: 'Ghana Tertiary Education Commission (GTEC)',
      accreditationType: 'Institutional Registration',
      referenceNumber: 'GTEC/PRO-INST/2021/084',
      scopeOrProgramme: 'Institutional Charter for Post-Tertiary Professional Tax & Forensic Programmes',
      awardingPowerSummary: 'Authorised to award Foundation Certificates, Advanced Diplomas, and Professional Qualifying Diplomas.',
      issueDate: '2021-06-01',
      renewalDate: '2027-05-31',
      status: 'Active',
    },
    {
      id: 'acc-cit-02',
      schoolId: 'sch-citlfa-04',
      authorityName: 'West African Council of Chartered Tax & Forensic Auditors (WACCTFA)',
      accreditationType: 'Professional Body Affiliation',
      referenceNumber: 'WACCTFA-EXEMPT-GH-12',
      scopeOrProgramme: 'Chartered Tax Law & Forensic Accounting (Levels 1 – 3)',
      awardingPowerSummary: 'Recognises CITLFA Level 3 Diploma for statutory induction; ACTL fellowship/associate title is conferred strictly by WACCTFA.',
      issueDate: '2022-01-15',
      renewalDate: '2026-03-15',
      status: 'Renewal Due',
    },
  ],
  verificationLogs: [
    {
      id: 'vlog-cit-01',
      schoolId: 'sch-citlfa-04',
      timestamp: '2025-10-14 09:42 UTC',
      queriedReference: 'CITLFA-2025-L3-00108',
      matchedCertificateNumber: 'CITLFA-2025-L3-00108',
      recipientName: 'Kofi Asante-Boadu',
      verifierOrganization: 'KPMG West Africa — Background Screening Unit',
      verifierContactName: 'ama.mensah@kpmg.com.gh',
      verificationPurpose: 'Pre-employment Executive Credential Verification',
      lookupMode: 'Single Lookup / QR Scan',
      resultStatus: 'Valid',
    },
    {
      id: 'vlog-cit-02',
      schoolId: 'sch-citlfa-04',
      timestamp: '2025-10-16 14:18 UTC',
      queriedReference: 'CITLFA-2024-L2-00031',
      matchedCertificateNumber: 'CITLFA-2024-L2-00031',
      recipientName: 'Bernard Tettey-fio',
      verifierOrganization: 'Consolidated Bank Ghana — HR Compliance',
      verifierContactName: 'hr.vetting@cbg.com.gh',
      verificationPurpose: 'Applicant Qualification Audit',
      lookupMode: 'Employer Batch Verification',
      resultStatus: 'Revoked',
    },
  ],
};

// ============================================================================
// DEFAULT PROFESSIONAL / CREDENTIAL BUNDLES FOR KRI, PRESEC, MORNING STAR & NEW SCHOOLS
// ============================================================================

export const getDefaultSignatoriesForSchool = (school: SchoolProfile): AuthorizedSignatory[] => {
  if (school.signatories && school.signatories.length > 0) {
    return school.signatories;
  }
  if (school.id === 'sch-citlfa-04') {
    return CITLFA_SIGNATORIES;
  }
  const headSig = makeCalligraphicSignatureSvg(school.headmasterSignature || school.headmasterName, '#0f172a');
  const regSig = makeCalligraphicSignatureSvg(
    school.id === 'sch-presec-07'
      ? 'D. Kwakye (Academic)'
      : school.id === 'sch-mss-03'
      ? 'Grace Quaye'
      : 'C. Mensah-Bonsu',
    '#1e3a8a'
  );
  return [
    {
      id: `sig-${school.id}-head`,
      name: school.headmasterName,
      title: isInstituteLevelType(school.levelType) ? 'Rector / Principal' : 'Headmaster / Principal',
      role: 'Head of Institution',
      signatureDataUrl: headSig,
      signatureMethod: 'uploaded',
      updatedAt: '2025-09-01',
      active: true,
    },
    {
      id: `sig-${school.id}-reg`,
      name:
        school.id === 'sch-presec-07'
          ? 'Mr. Daniel Kwakye'
          : school.id === 'sch-mss-03'
          ? 'Miss Grace Quaye'
          : 'Mrs. Cynthia Mensah-Bonsu',
      title: 'Academic Registrar & Examinations Officer',
      role: 'Registrar',
      signatureDataUrl: regSig,
      signatureMethod: 'drawn',
      updatedAt: '2025-09-02',
      active: true,
    },
  ];
};

export const getInitialProfessionalData = (
  schoolId: string,
  schoolProfile: SchoolProfile,
  students: Student[] = []
): TenantProfessionalBundle => {
  if (schoolId === 'sch-citlfa-04') {
    return CITLFA_PROFESSIONAL_BUNDLE;
  }

  const signatories = getDefaultSignatoriesForSchool(schoolProfile);
  const templateId = `tpl-${schoolId}-main`;
  const firstStudent = students[0];
  const fullName = firstStudent
    ? `${firstStudent.firstName} ${firstStudent.otherNames ? firstStudent.otherNames + ' ' : ''}${firstStudent.lastName}`
    : 'Kwame Yakubu Mensah';
  const progId = `prog-${schoolId}-01`;
  const certPrefix = schoolProfile.code.split('-')[0] || 'INST';
  const isInst = isInstituteLevelType(schoolProfile.levelType);

  const programmes: ProfessionalProgramme[] = [
    {
      id: progId,
      schoolId,
      code: isInst ? `${certPrefix}-PRO-01` : `${certPrefix}-CERT-STEM`,
      title: isInst
        ? `${schoolProfile.name} Professional & Certificate Qualification Programme`
        : schoolId === 'sch-mss-03'
        ? 'Junior Robotics, Coding & Digital Literacy Certificate Programme'
        : 'Applied Data Science, Robotics & Ethical Leadership Certificate Programme',
      category: isInst ? 'Professional Qualification' : 'Certificate Programme',
      qualificationAwarded: isInst
        ? `Professional Diploma & Institutional Certificate (${schoolProfile.code})`
        : schoolId === 'sch-mss-03'
        ? 'Certificate of Proficiency in Coding & Junior Robotics'
        : 'Diploma Certificate in Applied STEM, AI & Leadership',
      affiliatedProfessionalBody: isInst
        ? 'Ghana Tertiary Education Commission (GTEC) / CTVET'
        : 'Ghana Education Service (GES) / CTVET STEM Directorate',
      awardingAuthorityModel: 'Institution Direct Award',
      durationLabel: isInst ? 'Levels 1, 2, 3 & Certificate Track' : '3 Progressive Levels (3 Terms)',
      totalCreditHours: 48,
      entryRequirements: isInst
        ? 'WASSCE / SSSCE passes, recognised Diploma/Degree, or mature applicant experience for Certificate entry.'
        : 'Active institutional enrolment and foundational mathematics clearance.',
      assessmentMethods: '30% Continuous Assessment & Practical Portfolio + 70% Diet Examination.',
      examinationRegulations: 'Minimum score of 50% per course required for progression or certificate conferment.',
      progressionRules:
        'Pass all mandatory courses (50%+) and clear fees to advance across Level 1, Level 2, and Level 3; standalone Certificate track completes in a single diet.',
      completionRequirements:
        'Completion of Level 1–3 (Chartered/Diploma track) or all Certificate track courses plus Academic Board approval.',
      feeClearanceRequired: true,
      levels: [
        {
          levelNumber: 1,
          levelTitle: 'Level 1 (Foundation)',
          creditHoursRequired: 12,
          passMarkPercent: 50,
          maxAllowedResits: 3,
          levelFeeAmount: isInst ? 1800 : 650,
          awardOnLevelCompletion: 'Level 1 Foundation Certificate',
        },
        {
          levelNumber: 2,
          levelTitle: 'Level 2 (Intermediate)',
          creditHoursRequired: 12,
          passMarkPercent: 50,
          maxAllowedResits: 3,
          levelFeeAmount: isInst ? 2200 : 650,
          awardOnLevelCompletion: 'Level 2 Intermediate Certificate',
        },
        {
          levelNumber: 3,
          levelTitle: 'Level 3 (Advanced / Final)',
          creditHoursRequired: 12,
          passMarkPercent: 50,
          maxAllowedResits: 3,
          levelFeeAmount: isInst ? 2600 : 750,
          awardOnLevelCompletion: 'Full Professional Diploma Certificate',
        },
        {
          levelNumber: 4,
          levelTitle: 'Certificate (Non-Chartered Track)',
          creditHoursRequired: 12,
          passMarkPercent: 50,
          maxAllowedResits: 2,
          levelFeeAmount: isInst ? 1450 : 550,
          awardOnLevelCompletion: 'Executive / Vocational Certificate of Competence (Non-Chartered)',
        },
      ],
      status: 'Active',
    },
  ];

  const dietLabel = `${schoolProfile.currentTerm} ${schoolProfile.currentAcademicYear}`;
  const leadLecturer = signatories[1]?.name || schoolProfile.headmasterName;

  const programmeCourses: ProgrammeCourse[] = [
    {
      id: `crs-${schoolId}-101`,
      schoolId,
      programmeId: progId,
      levelNumber: 1,
      levelLabel: 'Level 1',
      code: `${certPrefix}-101`,
      title: isInst
        ? 'Foundations of Professional Practice, Ethics & Regulatory Compliance'
        : 'Computational Thinking, Python & Embedded Sensors',
      creditHours: 12,
      lecturerName: leadLecturer,
      caWeightPercent: 30,
      practicalWeightPercent: 20,
      examWeightPercent: 50,
      isMandatory: true,
      examScheduleDate: '2025-11-28',
      semesterOrDiet: dietLabel,
      courseDetails:
        'Covers core foundational concepts, statutory ethics, analytical problem-solving, and structured documentation standards required at Level 1 entry.',
      rationale:
        'Equips incoming Level 1 candidates with a rigorous ethical and technical foundation prior to intermediate specialization.',
      objectives: [
        'Apply foundational principles and regulatory frameworks to real-world institutional scenarios.',
        'Prepare structured analytical reports meeting professional examination standards.',
        'Demonstrate ethical judgment and statutory compliance across core workflows.',
      ],
      flyerDataUrl: makeCourseFlyerSvg({
        institutionName: schoolProfile.name,
        courseCode: `${certPrefix}-101`,
        courseTitle: isInst
          ? 'Foundations of Professional Practice & Regulatory Compliance'
          : 'Computational Thinking, Python & Embedded Sensors',
        levelLabel: 'Level 1',
        dietLabel,
        creditHours: 12,
        lecturerName: leadLecturer,
        accentHex: '#10b981',
      }),
    },
    {
      id: `crs-${schoolId}-201`,
      schoolId,
      programmeId: progId,
      levelNumber: 2,
      levelLabel: 'Level 2',
      code: `${certPrefix}-201`,
      title: isInst
        ? 'Applied Managerial Systems, Case Analytics & Risk Governance'
        : 'Applied Robotics, Circuitry & Quantitative Analytics',
      creditHours: 12,
      lecturerName: leadLecturer,
      caWeightPercent: 30,
      practicalWeightPercent: 20,
      examWeightPercent: 50,
      isMandatory: true,
      examScheduleDate: '2025-12-04',
      semesterOrDiet: dietLabel,
      courseDetails:
        'Intermediate applied coursework integrating quantitative evaluation, operational controls, and case-study problem solving.',
      rationale:
        'Bridges foundational theory with mid-level practitioner execution and supervisory decision-making.',
      objectives: [
        'Evaluate complex operational case studies using quantitative and regulatory tools.',
        'Design internal risk controls and quality assurance checklists.',
        'Present evidence-backed recommendations to executive stakeholders.',
      ],
      flyerDataUrl: makeCourseFlyerSvg({
        institutionName: schoolProfile.name,
        courseCode: `${certPrefix}-201`,
        courseTitle: isInst
          ? 'Applied Managerial Systems, Case Analytics & Risk Governance'
          : 'Applied Robotics, Circuitry & Quantitative Analytics',
        levelLabel: 'Level 2',
        dietLabel,
        creditHours: 12,
        lecturerName: leadLecturer,
        accentHex: '#0ea5e9',
      }),
    },
    {
      id: `crs-${schoolId}-301`,
      schoolId,
      programmeId: progId,
      levelNumber: 3,
      levelLabel: 'Level 3',
      code: `${certPrefix}-301`,
      title: isInst
        ? 'Advanced Strategic Practice & Finalist Capstone Defence'
        : 'Innovation Capstone Project & Research Defence',
      creditHours: 12,
      lecturerName: schoolProfile.headmasterName,
      caWeightPercent: 40,
      practicalWeightPercent: 20,
      examWeightPercent: 40,
      isMandatory: true,
      examScheduleDate: '2025-12-12',
      semesterOrDiet: dietLabel,
      courseDetails:
        'Finalist synthesis paper combining advanced policy advisory, independent research portfolio, and oral/written capstone defence.',
      rationale:
        'Validates mastery across all multi-level competencies prior to full qualification conferment.',
      objectives: [
        'Synthesize multi-disciplinary frameworks into an independent capstone dossier.',
        'Defend strategic findings before the institutional Examination Board.',
        'Fulfil professional ethics and leadership readiness requirements.',
      ],
      flyerDataUrl: makeCourseFlyerSvg({
        institutionName: schoolProfile.name,
        courseCode: `${certPrefix}-301`,
        courseTitle: isInst
          ? 'Advanced Strategic Practice & Finalist Capstone Defence'
          : 'Innovation Capstone Project & Research Defence',
        levelLabel: 'Level 3',
        dietLabel,
        creditHours: 12,
        lecturerName: schoolProfile.headmasterName,
        accentHex: '#f59e0b',
      }),
    },
    {
      id: `crs-${schoolId}-cert-401`,
      schoolId,
      programmeId: progId,
      levelNumber: 4,
      levelLabel: 'Certificate',
      code: `${certPrefix}-CERT-401`,
      title: 'Applied Executive & Practitioner Certificate Intensive (Non-Chartered)',
      creditHours: 12,
      lecturerName: schoolProfile.headmasterName,
      caWeightPercent: 40,
      practicalWeightPercent: 20,
      examWeightPercent: 40,
      isMandatory: true,
      examScheduleDate: '2025-12-16',
      semesterOrDiet: dietLabel,
      courseDetails:
        'Standalone intensive certificate module designed for working professionals and vocational learners seeking direct institutional certification without multi-level chartered examinations.',
      rationale:
        'Provides a focused, job-ready non-chartered Certificate pathway for practitioners who need immediate applied competence and verifiable certification.',
      objectives: [
        'Master practical tools and templates for immediate workplace deployment.',
        'Complete a supervised applied project evaluated by industry faculty.',
        'Earn a verifiable institutional Certificate of Competence upon completion.',
      ],
      flyerDataUrl: makeCourseFlyerSvg({
        institutionName: schoolProfile.name,
        courseCode: `${certPrefix}-CERT-401`,
        courseTitle: 'Applied Executive & Practitioner Certificate Intensive (Non-Chartered)',
        levelLabel: 'Certificate',
        dietLabel,
        creditHours: 12,
        lecturerName: schoolProfile.headmasterName,
        accentHex: '#a855f7',
      }),
    },
  ];

  const candidates: CandidateProfile[] = students.slice(0, 3).map((stu, idx) => ({
    id: `cand-${schoolId}-${stu.id}`,
    schoolId,
    studentId: stu.id,
    candidateNumber: stu.studentNumber,
    firstName: stu.firstName,
    lastName: stu.lastName,
    otherNames: stu.otherNames,
    gender: stu.gender,
    dob: stu.dob,
    email: `${stu.firstName.toLowerCase().replace(/\s+/g, '.')}.${stu.lastName.toLowerCase().replace(/\s+/g, '.')}@student.${certPrefix.toLowerCase()}.edu.gh`,
    phone: stu.guardianPhone,
    photo: stu.photo,
    nationalIdNumber: stu.nationalIdOrNHIS || `GHA-71029384${idx}-1`,
    identityVerified: true,
    identityDocumentType: 'Ghana Card (NIA)',
    previousQualifications: stu.previousSchool || 'GES Junior High BECE Aggregate 07',
    programmeId: progId,
    currentLevel: idx === 0 ? 3 : idx === 1 ? 2 : 1,
    completedLevels: idx === 0 ? [1, 2, 3] : idx === 1 ? [1] : [],
    enrollmentDate: stu.admissionDate,
    status: idx === 0 ? 'Completed / Graduated' : 'Active',
    membershipStatus: idx === 0 ? 'Graduate Member (Institution Complete)' : 'Registered Student Candidate',
    totalFeesBilled: 750,
    totalFeesPaid: idx === 2 ? 400 : 750,
    directoryConsent: idx === 0,
    headlineOrRole: idx === 0 ? `${schoolProfile.name} Honours Scholar` : `Level ${idx === 1 ? 2 : 1} Candidate`,
  }));

  const candidateAssessments: CandidateCourseAssessment[] = candidates.length > 0
    ? [
        {
          id: `ass-${schoolId}-01`,
          candidateId: candidates[0].id,
          programmeId: progId,
          courseId: `crs-${schoolId}-301`,
          levelNumber: 3,
          examDiet: `${schoolProfile.currentTerm} ${schoolProfile.currentAcademicYear}`,
          attendancePercent: 98,
          caScore: 36,
          practicalScore: 19,
          examScore: 37,
          totalScore: 92,
          grade: 'A1 (Distinction)',
          paperStatus: 'Passed',
          moderated: true,
          moderatedBy: schoolProfile.headmasterName,
          resitAttemptCount: 0,
        },
      ]
    : [];

  const certificateTemplates: CertificateTemplateConfig[] = [
    {
      id: templateId,
      schoolId,
      name: `${schoolProfile.name} Official Honours & Completion Certificate`,
      themeStyle: 'emerald-gold',
      orientation: 'landscape',
      headerSubtitle: 'Ghana Education Service (GES) & National Credentialing Registry • Official Award',
      sealLabel: `OFFICIAL SEAL • ${schoolProfile.code}`,
      showQrCode: true,
      showCandidateId: true,
      showLevelCompleted: true,
      showCreditHours: true,
      showAuthorityDisclaimer: true,
      authorityDisclaimerText: `Issued under the institutional seal and authority of ${schoolProfile.name} (${schoolProfile.code}). Verify authenticity online via certificate number or QR scan.`,
      primarySignatoryId: signatories[0]?.id,
      secondarySignatoryId: signatories[1]?.id,
    },
  ];

  const issuedCertNumber = `${certPrefix}-CERT-2025-0001`;
  const issuedVrfCode = `VRF-${certPrefix.slice(0, 3).toUpperCase()}9-2025`;

  const issuedCredentials: IssuedCredential[] = candidates[0]
    ? [
        {
          id: `cred-${schoolId}-01`,
          schoolId,
          schoolName: schoolProfile.name,
          schoolCode: schoolProfile.code,
          schoolCrest: schoolProfile.crest,
          certificateNumber: issuedCertNumber,
          verificationCode: issuedVrfCode,
          candidateId: candidates[0].id,
          candidateNumber: candidates[0].candidateNumber,
          recipientFullName: fullName,
          programmeId: progId,
          programmeTitle: programmes[0].title,
          credentialType: 'Full Qualification Certificate',
          qualificationAwarded: programmes[0].qualificationAwarded,
          levelCompletedLabel: 'Level 3 (Advanced Capstone) — Full Completion',
          honoursOrDistinction: 'With Distinction',
          creditHoursCompleted: 36,
          issueDate: '2025-09-28',
          status: 'Valid',
          awardingAuthorityName: `${schoolProfile.name} (GES / CTVET Accredited)`,
          templateId,
          signatoriesSnapshot: signatories.map((s) => ({
            name: s.name,
            title: s.title,
            signatureDataUrl: s.signatureDataUrl,
          })),
          auditTrail: [
            {
              id: `aud-${schoolId}-01`,
              timestamp: '2025-09-28 11:20 UTC',
              actorName: schoolProfile.headmasterName,
              actorRole: 'Head of Institution',
              previousStatus: 'Draft',
              newStatus: 'Valid',
              reason: 'Approved upon completion of all 3 programme levels and academic/financial verification.',
            },
          ],
        },
      ]
    : [];

  const graduateRecords: GraduateAlumniRecord[] = candidates[0]
    ? [
        {
          id: `grad-${schoolId}-01`,
          schoolId,
          candidateId: candidates[0].id,
          candidateNumber: candidates[0].candidateNumber,
          fullName,
          email: candidates[0].email,
          phone: candidates[0].phone,
          photo: candidates[0].photo,
          programmeId: progId,
          programmeTitle: programmes[0].title,
          qualificationAwarded: programmes[0].qualificationAwarded,
          levelAttained: 'Level 3 (Advanced Capstone)',
          graduationYear: 2025,
          completionApprovedDate: '2025-09-28',
          certificateNumber: issuedCertNumber,
          verificationCode: issuedVrfCode,
          certificateStatus: 'Valid',
          membershipStatus: 'Graduate Member (Institution Complete)',
          directoryConsent: true,
          currentEmployerOrRole: `${schoolProfile.name} Honours Alumnus`,
        },
      ]
    : [];

  const accreditations: InstitutionalAccreditation[] = [
    {
      id: `acc-${schoolId}-01`,
      schoolId,
      authorityName: 'Ghana Education Service (GES) & NaSIA',
      accreditationType: 'Institutional Registration',
      referenceNumber: `NaSIA/REG/${certPrefix}/2022`,
      scopeOrProgramme: `${schoolProfile.levelType} Academic & Certificate Programmes`,
      awardingPowerSummary: `Authorised to conduct academic instruction, continuous assessment, and issue institutional completion certificates.`,
      issueDate: '2022-09-01',
      renewalDate: '2027-08-31',
      status: 'Active',
    },
  ];

  return {
    programmes,
    programmeCourses,
    candidates,
    candidateAssessments,
    certificateTemplates,
    issuedCredentials,
    graduateRecords,
    replacementRequests: [],
    accreditations,
    verificationLogs: [],
  };
};
