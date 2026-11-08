import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { LoginScreen } from './auth/LoginScreen';
import { EmployerVerificationPortal } from './modules/EmployerVerificationPortal';
import { ResearchJournalModule } from './modules/ResearchJournalModule';
import { RegisterSchoolModal } from './modals/RegisterSchoolModal';
import { ImageUploadModal } from './modals/ImageUploadModal';
import {
  WhatsAppLogoIcon,
  PLATFORM_OWNER_WHATSAPP_RAW,
  buildWhatsAppUrl,
} from '../utils/whatsapp';
import { buildPublicShareUrl } from '../utils/shareUrl';
import heroCampusImg from '../assets/images/hero_campus_administration_1793363542493.jpg';
import instituteGraduationImg from '../assets/images/professional_institute_graduation_1793363543705.jpg';
import verificationWorkspaceImg from '../assets/images/digital_verification_workspace_1793363544156.jpg';
import heroEduDashboardImg from '../assets/images/hero_eduglobal_sis_dashboard_1794088663292.jpg';
import stemClassroomImg from '../assets/images/african_stem_classroom_1794088662516.jpg';
import modernAfricanCampusImg from '../assets/images/modern_african_campus_1794091594696.jpg';
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  FileCheck,
  FileSpreadsheet,
  GraduationCap,
  HelpCircle,
  Landmark,
  Laptop,
  Layers,
  Lock,
  LogIn,
  Mail,
  Pencil,
  Phone,
  QrCode,
  School,
  Search,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

interface PublicWebsiteLandingProps {
  embeddedInDashboard?: boolean;
}

type PublicSubView = 'website' | 'login' | 'verify' | 'journals';

type StakeholderTab = 'administrators' | 'teachers' | 'parents_students' | 'graduates';

type QualificationTierKey = 'level1' | 'level2' | 'level3' | 'certificate';

type InstitutionSegmentKey = 'basic_secondary' | 'tertiary_university' | 'professional_institute' | 'vocational_online';

interface SubmittedEnquiry {
  id: string;
  institutionName: string;
  institutionType: string;
  contactName: string;
  roleTitle: string;
  email: string;
  phone: string;
  learnerCount: string;
  enquiryType: string;
  notes: string;
  submittedAt: string;
}

const STAKEHOLDER_VIEWS: Record<
  StakeholderTab,
  {
    label: string;
    heading: string;
    summary: string;
    capabilities: string[];
  }
> = {
  administrators: {
    label: 'Proprietors & Registrars',
    heading: 'Centralised institutional governance from admission to graduation',
    summary:
      'Replace disconnected spreadsheets and paper files with unified admissions, class placement, fee billing, statutory HR payroll, and instant executive reporting.',
    capabilities: [
      'Online admission applications, automated student & candidate ID generation, and structured class or cohort placement',
      'Customisable institutional profiles, academic calendars, grading scales, user accounts, and role-based permissions',
      'Fee schedules, invoices, cash, bank transfer, and Mobile Money receipts alongside scholarship, discount, and budget tracking',
      'Staff registry, attendance monitoring, leave approvals, recruitment records, performance appraisals, and SSNIT / PAYE payroll',
    ],
  },
  teachers: {
    label: 'Teachers & Lecturers',
    heading: 'Structured academic planning, continuous assessment & AI teaching tools',
    summary:
      'Organise classes, courses, timetables, lesson notes, and examination diets while reducing manual grading and report writing workload.',
    capabilities: [
      'Class subjects, course syllabi, course flyers, rationale, learning objectives, timetables, and academic calendars',
      'Daily attendance registers, continuous assessment entry, end-of-term or diet examination marks, and automated grading',
      'AI-assisted lesson planning, assessment preparation, learning material drafting, and personalised report card comments',
      'Early identification of attendance patterns and learner academic progression across terms and levels',
    ],
  },
  parents_students: {
    label: 'Parents & Students',
    heading: 'Transparent academic, attendance & financial visibility from any device',
    summary:
      'Dedicated personal portals keep learners and guardians informed across desktop computers, laptops, tablets, and smartphones.',
    capabilities: [
      'Real-time access to daily attendance records, term examination results, continuous assessments, and assignments',
      'Clear visibility into school fee invoices, payment receipts, scholarships, and outstanding tuition balances',
      'Direct delivery of official school announcements, academic calendars, and timetable updates via portal, SMS, email, and WhatsApp',
      'Strict privacy boundaries ensuring students and parents see only their authorised personal records',
    ],
  },
  graduates: {
    label: 'Graduates & Alumni',
    heading: 'Lifelong digital credentials, transcripts & employer verification links',
    summary:
      'Upon formal completion approval, learners transition seamlessly to the institution’s searchable graduate and alumni register.',
    capabilities: [
      'Personal graduate accounts preserving complete academic histories, levels attained, and qualifications awarded',
      'Instant download of tamper-evident digital certificates featuring unique certificate numbers, authorised signatures, and QR codes',
      'Official academic transcript retrieval and multi-qualification portfolio management',
      'Shareable public verification links for prospective employers and agencies without exposing private student account data',
    ],
  },
};

const QUALIFICATION_TIERS: Record<
  QualificationTierKey,
  {
    tabLabel: string;
    title: string;
    subtitle: string;
    description: string;
    highlights: string[];
  }
> = {
  level1: {
    tabLabel: 'Level 1 · Foundation',
    title: 'Level 1 (Foundation Qualification Stage)',
    subtitle: 'Candidate onboarding · Core foundational papers · Exemption assessment',
    description:
      'Designed for new entrants into chartered and professional programmes. Manage candidate registration, foundational course syllabi, lecturer assignments, prior-learning exemptions, and diet examination sittings.',
    highlights: [
      'Structured course creation with detailed course descriptions, rationale, objectives, and downloadable course flyers',
      'Automated candidate numbering, entry qualification review, and paper-by-paper exemption recording',
      'Examination diet scheduling, continuous assessment weighting, and resit eligibility tracking',
    ],
  },
  level2: {
    tabLabel: 'Level 2 · Intermediate',
    title: 'Level 2 (Intermediate / Managerial Stage)',
    subtitle: 'Applied professional papers · Progression rules · Resit management',
    description:
      'Supports candidates advancing from foundational studies or entering with accredited diploma exemptions. Tracks multi-diet progression, lecturer allocations, and intermediate competency completion.',
    highlights: [
      'Prerequisite enforcement between Level 1 completion and Level 2 examination registration',
      'Comprehensive mark entry, moderation logs, and candidate progression audits across diets',
      'Dedicated candidate portal displaying passed papers, remaining credits, and tuition clearance status',
    ],
  },
  level3: {
    tabLabel: 'Level 3 · Advanced',
    title: 'Level 3 (Advanced / Final Professional Stage)',
    subtitle: 'Chartered & fellowship readiness · Graduation audit · Alumni induction',
    description:
      'Governs final-stage professional qualifying examinations, capstone assessments, formal graduation eligibility verification, digital certification, and induction into the graduate register.',
    highlights: [
      'Automated graduation eligibility checks verifying academic credits and financial clearance',
      'Digital certificate issuance with authorised executive signatures, unique serials, and scannable QR verification',
      'Formal transfer of approved completers to the searchable Graduate & Alumni Register by year and qualification',
    ],
  },
  certificate: {
    tabLabel: 'Certificate & Executive',
    title: 'Standalone Certificate, Diploma & Executive Programmes',
    subtitle: 'Non-chartered certificates · Vocational & short-course cohorts',
    description:
      'Caters specifically to certificate-awarding organisations, vocational centres, and executive training programmes that issue standalone certificates or diplomas outside multi-level chartered tracks.',
    highlights: [
      'Dedicated Certificate level distinct from Levels 1–3 and completely separated from basic school workspaces',
      'Customisable programme durations, modular assessments, and promotional course flyers for public intake',
      'Full QR-verifiable digital certificate issuance and alumni registry inclusion upon completion',
    ],
  },
};

const INSTITUTION_SEGMENTS: Record<
  InstitutionSegmentKey,
  {
    label: string;
    audience: string;
    summary: string;
    modules: string;
  }
> = {
  basic_secondary: {
    label: 'Nursery, Primary, JHS & SHS',
    audience: 'School Proprietors, Headteachers & Principals',
    summary:
      'Complete termly administration covering admissions, class placement, GES / BECE / WASSCE & Cambridge grading, daily attendance, biometric gate logs, boarding & transport welfare, parent portals, and Mobile Money fee collection.',
    modules: 'Admissions · Class & Subject Timetables · Report Cards · Fees & MoMo · Boarding & Transport · Parent Portal',
  },
  tertiary_university: {
    label: 'Colleges & Universities',
    audience: 'Vice-Chancellors, Provosts, Deans & Academic Registrars',
    summary:
      'Departmental and faculty organisation, semester credit-hour tracking, lecturer course assignments, open-access academic research & journal publishing, transcript generation, HR payroll, and alumni endowment management.',
    modules: 'Semester Registries · Course Credits · Research & Journal Press · Transcripts · HR & Payroll · Alumni Register',
  },
  professional_institute: {
    label: 'Professional & Chartered Institutes',
    audience: 'Institute Directors, Council Registrars & Examination Controllers',
    summary:
      'Purpose-built workspace separated from basic schools—supporting Level 1, Level 2, Level 3, and Certificate programmes, course rationale & flyer uploads, examination diets, exemptions, resits, and QR-verified digital credentials.',
    modules: 'Levels 1–3 & Certificate · Course Flyers · Exam Diets & Resits · Digital Signatures · QR Certificate Verification',
  },
  vocational_online: {
    label: 'Technical, Vocational & Online Centres',
    audience: 'Training Centre Managers & Programme Coordinators',
    summary:
      'Flexible cohort scheduling, practical competency assessments, modular fee plans, multi-device learner portals across smartphones and laptops, and verifiable completion certificates that employers can confirm online.',
    modules: 'Cohort Intakes · Practical Assessments · Flexible Billing · Multi-Device Portal · Online Credential Verification',
  },
};

export interface InstitutionTierInfo {
  id: string;
  name: string;
  levels: string;
  curriculum: string;
  description: string;
  features: string[];
  tone: string;
  borderTone: string;
}

export const NINE_INSTITUTION_TIERS: InstitutionTierInfo[] = [
  {
    id: 'creche_nursery',
    name: 'Creche & Nursery',
    levels: 'Infant Daycare & Early Toddler (Ages 6m – 3y)',
    curriculum: 'Early Childhood Development (ECD) Care',
    description:
      'Specialised infant care administration with daily feeding logs, sleep schedules, immunization milestones, and direct parent WhatsApp check-in.',
    features: [
      'Infant care & feeding logs',
      'Emergency guardian linkages',
      'Milestone development cards',
      'Pick-up authorization tracking',
    ],
    tone: 'from-amber-500/20 via-slate-900 to-amber-950/40 text-amber-300',
    borderTone: 'border-amber-500/35',
  },
  {
    id: 'kindergarten',
    name: 'Kindergarten (KG 1 & 2)',
    levels: 'KG 1 & KG 2 (Ages 4 – 5)',
    curriculum: 'NaCCA Early Years Standard-Based Curriculum',
    description:
      'Foundational literacy, phonics, numeracy and creative activity tracking with pictorial student badges, safety tracking, and termly early-years assessments.',
    features: [
      'Standard-based literacy & numeracy',
      'Pictorial identification badges',
      'Play-based activity scoring',
      'Guardian communication register',
    ],
    tone: 'from-emerald-500/20 via-slate-900 to-teal-950/40 text-emerald-300',
    borderTone: 'border-emerald-500/35',
  },
  {
    id: 'primary',
    name: 'Primary Schools',
    levels: 'Classes 1 through 6 (Ages 6 – 12)',
    curriculum: 'GES / NaCCA National Curriculum & SBA',
    description:
      'Full continuous assessment administration (SBA 30% / Exam 70%), class stream assignments, daily attendance registers, and automated terminal report cards.',
    features: [
      'GES continuous assessment (SBA)',
      'Automated class position & grading',
      'Subject teacher allocations',
      'Termly fees & parent portal',
    ],
    tone: 'from-sky-500/20 via-slate-900 to-indigo-950/40 text-sky-300',
    borderTone: 'border-sky-500/35',
  },
  {
    id: 'jhs',
    name: 'Junior High Schools (JHS)',
    levels: 'JHS 1, JHS 2 & JHS 3 / Form 1–3',
    curriculum: 'GES Common Core Programme (CCP) & Pre-BECE',
    description:
      'Specialist subject teaching, national Stanine 1–9 grading, BECE candidate index numbering, continuous mock assessment series, and AI intervention tracking.',
    features: [
      'Common Core Programme subjects',
      'Stanine 1–9 national mock grading',
      'BECE index number tracking',
      'Diagnostic AI student readiness',
    ],
    tone: 'from-cyan-500/20 via-slate-900 to-blue-950/40 text-cyan-300',
    borderTone: 'border-cyan-500/35',
  },
  {
    id: 'shs',
    name: 'Senior High Schools (SHS)',
    levels: 'SHS 1, SHS 2 & SHS 3 (Streams A, B, C, D...)',
    curriculum: 'WAEC / WASSCE & GES SHS Syllabus',
    description:
      'Departmental streams across General Science, General Arts, Business, Visual Arts, Home Economics, and Technical programmes with boarding & dormitory management.',
    features: [
      'Streams A, B, C, D division management',
      '6 academic programme tracks',
      'Boarding house & bed allocation',
      'School bus fleet route tracking',
    ],
    tone: 'from-violet-500/20 via-slate-900 to-purple-950/40 text-violet-300',
    borderTone: 'border-violet-500/35',
  },
  {
    id: 'tertiary',
    name: 'Colleges & Universities',
    levels: 'Undergraduate, Diploma & Postgraduate Degrees',
    curriculum: 'Accredited Tertiary Semester & Credit-Hour Framework',
    description:
      'Semester course catalogue registration, credit hour weighting, lecture timetable coordination, continuous assessment, and automated GPA/CWA transcript processing.',
    features: [
      'Semester modular course registration',
      'Credit hour weighting & GPA / CWA',
      'Faculty & departmental governance',
      'Online candidate clearance',
    ],
    tone: 'from-indigo-500/20 via-slate-900 to-slate-950 text-indigo-300',
    borderTone: 'border-indigo-500/35',
  },
  {
    id: 'professional',
    name: 'Professional & Chartered Institutes',
    levels: 'Levels 1, 2, 3 & Professional Diploma / Fellowship',
    curriculum: 'Chartered Professional Qualification Frameworks',
    description:
      'Candidate diet registration, syllabus flyers, exemption reviews, diet exam sittings, tamper-evident digital certificate generation, and employer QR verification.',
    features: [
      'Levels 1–3 progression stages',
      'Examination diet scheduling & resits',
      'Tamper-evident digital certificates',
      'Instant QR code verification',
    ],
    tone: 'from-amber-500/20 via-slate-900 to-orange-950/40 text-amber-300',
    borderTone: 'border-amber-500/35',
  },
  {
    id: 'tvet',
    name: 'Technical & Vocational (TVET)',
    levels: 'National Certificate I & II / HND / Competency B-Tech',
    curriculum: 'CTVET Competency-Based Training (CBT) Framework',
    description:
      'Hands-on trade modular scoring, workshop tool asset inventory, industrial attachment logging, and practical trade certification.',
    features: [
      'Competency-Based Training (CBT)',
      'Workshop equipment inventory',
      'Industrial attachment tracking',
      'Technical craft qualification certificates',
    ],
    tone: 'from-rose-500/20 via-slate-900 to-pink-950/40 text-rose-300',
    borderTone: 'border-rose-500/35',
  },
  {
    id: 'training_centre',
    name: 'Training Centres & Academy Hubs',
    levels: 'Executive Masterclasses, CPD & Short Courses',
    curriculum: 'Modular Corporate & Skills Development Tracks',
    description:
      'Fast-paced cohort admissions, corporate invoicing, attendance verification, modular workshop certificates, and credential delivery.',
    features: [
      'Cohort enrollment & sponsor billing',
      'Executive attendance tracking',
      'Digital Certificate of Participation',
      'Public employer verification links',
    ],
    tone: 'from-teal-500/20 via-slate-900 to-emerald-950/40 text-teal-300',
    borderTone: 'border-teal-500/35',
  },
];

export const SUBSCRIPTION_PACKAGES = [
  {
    id: 'basic_tier',
    name: 'Basic & JHS School Tier',
    target: 'Creche, Nursery, Kindergarten, Primary & Junior High Schools',
    pricing: 'Flexible Termly Institutional Billing',
    badge: 'Popular for Basic Schools',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    highlight:
      'Everything required to run a modern Ghanaian basic school from admissions to GES terminal report cards.',
    features: [
      'Student admissions, digital profiles & unique Student IDs',
      'GES/NaCCA Standard-Based Curriculum continuous assessment',
      'Automated terminal report cards & class position rankings',
      'Daily morning/afternoon attendance & guardian SMS alerts',
      'Termly fee invoicing, cash & Mobile Money payment receipts',
      'Staff registry, teaching timetables & payroll slips',
      'Parent & student self-service portal access',
    ],
  },
  {
    id: 'shs_tier',
    name: 'Senior High School Tier',
    target: 'Senior High Schools, Technical Institutes & International Academies',
    pricing: 'Full Campus Scaled Enterprise',
    badge: 'SHS & Boarding Standard',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    highlight:
      'Engineered for large multi-stream senior high schools with complex subject tracks, boarding, and BECE mock preparation.',
    features: [
      'Everything in Basic School Tier plus:',
      'Multi-stream class division management (Streams A, B, C, D...)',
      'Academic programme tracks (Science, Arts, Business, Home Econs, Tech)',
      'Boarding house & dormitory bed management',
      'Transport fleet & school bus route monitoring',
      'BECE mock exam series with national Stanine 1–9 grading',
      'Diagnostic AI academic intervention reports',
      'Biometric turnstile gate logs & canteen POS',
    ],
  },
  {
    id: 'tertiary_tier',
    name: 'Tertiary & Professional Tier',
    target: 'Colleges, Universities, Chartered Institutes & Vocational Training Centres',
    pricing: 'Modular Enterprise Licensing',
    badge: 'Chartered & Tertiary',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    highlight:
      'Advanced academic and professional governance with modular course catalogues, examination diets, and employer-verifiable digital certificates.',
    features: [
      'Everything in Senior High School Tier plus:',
      'Modular semester course catalogue & downloadable course flyers',
      'Candidate exam diet scheduling & exemption management',
      'Levels 1–3 progression tracking (Foundation to Advanced)',
      'Tamper-evident digital certificates with unique serial numbers',
      'Instant online employer QR code verification portal',
      'Lifelong searchable graduate & alumni register',
      'Dedicated Super Administrator multi-institution control plane',
    ],
  },
];

export const PublicWebsiteLanding: React.FC<PublicWebsiteLandingProps> = ({
  embeddedInDashboard = false,
}) => {
  const {
    school,
    schools,
    isAuthenticated,
    isPlatformAdmin,
    firebaseUser,
    platformOwnerEmail,
    signInPlatformOwnerWithEmail,
    signInWithGoogle,
    enterPortalAsPlatformOwner,
    logout,
    allPublicResearchArticles,
    samplePublicCredentials,
    setActiveModule,
    platformOwnerProfile,
    updatePlatformOwnerProfile,
  } = useSchool();

  const initialVerifyParam = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('verify') || '';
    } catch {
      return '';
    }
  }, []);

  const [subView, setSubView] = useState<PublicSubView>(
    initialVerifyParam && !embeddedInDashboard ? 'verify' : 'website'
  );
  const [loginInitialMode, setLoginInitialMode] = useState<'staff' | 'student' | 'owner'>('staff');
  const [verifySerialQuery, setVerifySerialQuery] = useState(initialVerifyParam);
  const [stakeholderTab, setStakeholderTab] = useState<StakeholderTab>('administrators');
  const [qualificationTier, setQualificationTier] = useState<QualificationTierKey>('level1');
  const [institutionSegment, setInstitutionSegment] = useState<InstitutionSegmentKey>('professional_institute');

  // Image resilience states (Zero-Broken-Image Policy)
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [gradImgFailed, setGradImgFailed] = useState(false);
  const [verifyImgFailed, setVerifyImgFailed] = useState(false);
  const [ownerPhotoFallback, setOwnerPhotoFallback] = useState(false);

  // Platform Owner quick registration & owner profile editor modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showOwnerPhotoModal, setShowOwnerPhotoModal] = useState(false);
  const [showOwnerBioModal, setShowOwnerBioModal] = useState(false);
  const [ownerDraftName, setOwnerDraftName] = useState(platformOwnerProfile.name);
  const [ownerDraftRole, setOwnerDraftRole] = useState(platformOwnerProfile.roleTitle);
  const [ownerDraftSubtitle, setOwnerDraftSubtitle] = useState(platformOwnerProfile.subtitle);
  const [ownerDraftBio, setOwnerDraftBio] = useState(platformOwnerProfile.bio);
  const [ownerDraftWhatsApp, setOwnerDraftWhatsApp] = useState(platformOwnerProfile.whatsappNumber);
  const [isOwnerSigningIn, setIsOwnerSigningIn] = useState(false);
  const [showWebsiteOwnerForm, setShowWebsiteOwnerForm] = useState(false);
  const [ownerEmailInput, setOwnerEmailInput] = useState('');
  const [ownerPasswordInput, setOwnerPasswordInput] = useState('');
  const [ownerAuthError, setOwnerAuthError] = useState<string | null>(null);
  const [copiedSiteLink, setCopiedSiteLink] = useState(false);

  // Institutional Registration, Demo & Subscription Enquiry Form state
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('Professional / Chartered Institute');
  const [contactName, setContactName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Proprietor / Director');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [learnerCount, setLearnerCount] = useState('100 – 500 Students / Candidates');
  const [enquiryType, setEnquiryType] = useState('Institutional Registration & Onboarding');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<SubmittedEnquiry | null>(null);

  const formattedOwnerWhatsApp = platformOwnerProfile.whatsappNumber || '+233 207 615 941';
  const effectiveOwnerWhatsAppRaw = platformOwnerProfile.whatsappNumber || PLATFORM_OWNER_WHATSAPP_RAW;
  const effectiveOwnerPhotoSrc = ownerPhotoFallback
    ? '/assets/aistudio/PASSPORT_PICTURE_af7dd76f.jpg'
    : platformOwnerProfile.photoUrl || '/assets/aistudio/PASSPORT_PICTURE_af7dd76f.jpg';

  const handleCopyWebsiteUrl = () => {
    const url = buildPublicShareUrl();
    navigator.clipboard?.writeText(url);
    setCopiedSiteLink(true);
    setTimeout(() => setCopiedSiteLink(false), 2400);
  };

  const handleVerifyLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (embeddedInDashboard) {
      setActiveModule('employer-verification');
      return;
    }
    setSubView('verify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPortalAction = (mode: 'staff' | 'student' | 'owner' = 'staff') => {
    if (embeddedInDashboard) {
      setActiveModule('dashboard');
      return;
    }
    setLoginInitialMode(mode);
    setSubView('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOwnerEmailSignInOnWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerAuthError(null);
    if (!ownerEmailInput.trim()) {
      setOwnerAuthError('Please enter your Platform Owner email address.');
      return;
    }
    const res = signInPlatformOwnerWithEmail(ownerEmailInput, ownerPasswordInput, {
      stayOnWebsite: true,
    });
    if (res.success && res.isPlatformAdmin) {
      setOwnerAuthError(null);
      setShowWebsiteOwnerForm(false);
      setOwnerEmailInput('');
      setOwnerPasswordInput('');
    } else if (res.message) {
      setOwnerAuthError(res.message);
    }
  };

  const handleOwnerSignInOnWebsite = async () => {
    setOwnerAuthError(null);
    if (isPlatformAdmin) {
      if (schools.length > 0) {
        enterPortalAsPlatformOwner();
      } else {
        setShowRegisterModal(true);
      }
      return;
    }
    setIsOwnerSigningIn(true);
    try {
      const res = await signInWithGoogle('owner', { stayOnWebsite: true });
      if (res.success && res.isPlatformAdmin) {
        setOwnerAuthError(null);
        setShowWebsiteOwnerForm(false);
      } else if (res.message) {
        setOwnerAuthError(res.message);
      }
    } finally {
      setIsOwnerSigningIn(false);
    }
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!institutionName.trim() || !contactName.trim()) {
      setFormError('Please provide your institution name and contact person full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid official or personal email address.');
      return;
    }

    const digitsOnly = phone.replace(/[^\d]/g, '');
    if (digitsOnly.length < 9) {
      setFormError('Please enter a valid telephone or WhatsApp number (at least 9 digits).');
      return;
    }

    const payload: SubmittedEnquiry = {
      id: `ENQ-${Date.now().toString().slice(-6)}`,
      institutionName: institutionName.trim(),
      institutionType,
      contactName: contactName.trim(),
      roleTitle,
      email: email.trim(),
      phone: phone.trim(),
      learnerCount,
      enquiryType,
      notes: notes.trim(),
      submittedAt: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    try {
      const existingRaw =
        localStorage.getItem('edudigital_platform_enquiries_v1') ??
        localStorage.getItem('edughana_platform_enquiries_v1');
      const existing: SubmittedEnquiry[] = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem(
        'edudigital_platform_enquiries_v1',
        JSON.stringify([payload, ...existing].slice(0, 50))
      );
    } catch {
      // Ignore storage quota issues
    }

    setSubmittedEnquiry(payload);
  };

  const handleDownloadBrochureTxt = () => {
    const content = [
      'EDUDIGITAL SIS — ALL-IN-ONE SCHOOL AND INSTITUTION MANAGEMENT SYSTEM',
      'One Platform. Every Institution. Complete Management.',
      '========================================================================',
      '',
      'OVERVIEW',
      'Our All-in-One School and Institution Management System transforms how schools,',
      'colleges, universities, professional institutes, vocational institutions, and',
      'training centres operate. From student admission to graduation, staff administration',
      'to payroll, and examination management to digital certification, everything is',
      'connected in one secure digital platform.',
      '',
      'INSTITUTIONS SUPPORTED',
      '- Nursery, Kindergarten, Primary, Junior High (JHS) & Senior High Schools (SHS)',
      '- Colleges, Universities & Technical Institutions',
      '- Professional & Chartered Institutes (Level 1, Level 2, Level 3 & Certificate)',
      '- Vocational Institutions & Online Training Centres',
      '',
      'CORE CAPABILITIES',
      '1. Student Admission, Records & Portals (Parent, Student, Candidate & Graduate)',
      '2. Academic Management (Classes, Courses, Flyers, Timetables, Attendance, Exams)',
      '3. Financial & HR Management (Fees, Mobile Money, Budgets, SSNIT/PAYE Payroll)',
      '4. Professional Qualifications (Levels 1–3 & Certificate, Diets, Exemptions, Resits)',
      '5. Digital Certificate Issuance & Online QR / Serial Verification',
      '6. Searchable Graduate & Alumni Register with Personal Credential Accounts',
      '7. Super Administrator Governance, Multi-Tenant Security, AI Analytics & Backups',
      '',
      'OUR VISION',
      'To become a leading digital education and institutional management platform that',
      'transforms educational administration, strengthens academic excellence, and promotes',
      'credible professional certification through innovative technology.',
      '',
      'OUR MISSION',
      'To empower educational institutions and professional training organisations with',
      'secure, intelligent, accessible, and integrated digital solutions that simplify',
      'administration, improve accountability, enhance teaching and learning, and',
      'strengthen the credibility of academic and professional qualifications.',
      '',
      'OUR PROMISE',
      'Simplifying Education. Empowering Institutions. Verifying Excellence.',
      '',
      `DIRECT WHATSAPP ENQUIRIES & DEMO REQUESTS: ${formattedOwnerWhatsApp}`,
      `WEBSITE PORTAL: ${buildPublicShareUrl()}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'All_In_One_Institution_Management_Overview.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sub-views when running as standalone public front door
  if (!embeddedInDashboard && subView === 'login') {
    return (
      <LoginScreen
        initialMode={loginInitialMode}
        onBackToWebsite={() => setSubView('website')}
      />
    );
  }

  if (!embeddedInDashboard && subView === 'verify') {
    return (
      <div className="min-h-screen edu-aurora-canvas text-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <EmployerVerificationPortal
            publicStandaloneMode={true}
            initialQuery={verifySerialQuery}
            onBackToLogin={() => {
              if (window.location.search.includes('verify=')) {
                window.history.replaceState({}, '', window.location.pathname);
              }
              setSubView('website');
            }}
          />
        </div>
      </div>
    );
  }

  if (!embeddedInDashboard && subView === 'journals') {
    return (
      <div className="min-h-screen edu-aurora-canvas text-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <ResearchJournalModule
            readOnlyPublicMode={true}
            onBackToLogin={() => setSubView('website')}
          />
        </div>
      </div>
    );
  }

  const activeStakeholder = STAKEHOLDER_VIEWS[stakeholderTab];
  const activeTier = QUALIFICATION_TIERS[qualificationTier];
  const activeSegment = INSTITUTION_SEGMENTS[institutionSegment];

  const enquiryWhatsAppPrefill = submittedEnquiry
    ? [
        `Hello Platform Owner, I have submitted an institutional enquiry (${submittedEnquiry.id}):`,
        `• Institution: ${submittedEnquiry.institutionName} (${submittedEnquiry.institutionType})`,
        `• Contact: ${submittedEnquiry.contactName} (${submittedEnquiry.roleTitle})`,
        `• Size: ${submittedEnquiry.learnerCount}`,
        `• Request: ${submittedEnquiry.enquiryType}`,
        `• Email: ${submittedEnquiry.email} | Tel: ${submittedEnquiry.phone}`,
        submittedEnquiry.notes ? `• Details: ${submittedEnquiry.notes}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    : 'Hello Platform Owner, I am visiting your website and would like to enquire about institutional registration, subscription packages, or a product demonstration.';

  return (
    <div
      className={`${
        embeddedInDashboard
          ? 'edu-aurora-canvas text-slate-100 rounded-2xl border border-indigo-500/30 overflow-hidden'
          : 'min-h-screen edu-aurora-canvas text-slate-100'
      } font-sans selection:bg-emerald-500 selection:text-white`}
    >
      {/* Top Bar — Strict 3-Zone Contract when Standalone Public Website */}
      {!embeddedInDashboard ? (
        <header className="sticky top-0 z-40 h-16 bg-gradient-to-r from-[#09122e]/95 via-[#0f172a]/95 to-[#062925]/95 backdrop-blur-md border-b border-indigo-400/25 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-6">
            {/* Zone 1: Single wordmark */}
            <a
              href="#top"
              className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-amber-300 via-emerald-300 to-sky-300 bg-clip-text text-transparent whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
            >
              EduDigital
            </a>

            {/* Zone 2: Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-sky-100/90">
              <a
                href="#solutions"
                className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Solutions
              </a>
              <a
                href="#sis"
                className="hover:text-emerald-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                SIS &amp; Admissions
              </a>
              <a
                href="#academics"
                className="hover:text-sky-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Academics &amp; Exams
              </a>
              <a
                href="#institutes"
                className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Professional Institutes
              </a>
              <a
                href="#pricing"
                className="hover:text-emerald-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Pricing
              </a>
              <button
                type="button"
                onClick={() => {
                  setVerifySerialQuery('');
                  setSubView('verify');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-sky-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Verify Certificate
              </button>
              <a
                href="#enquiries"
                className="hover:text-emerald-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Contact &amp; Demo
              </a>
            </nav>

            {/* Zone 3: Register School & Portal Sign-In actions */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>Register School</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenPortalAction('staff')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 rounded-lg transition-all shadow-md whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenPortalAction('owner')}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/45 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer"
                title="Platform Owner Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="sr-only sm:not-sr-only">Owner</span>
              </button>
            </div>
          </div>
        </header>
      ) : (
        <div className="px-6 py-4 bg-gradient-to-r from-[#0c1638] via-[#0f172a] to-[#082c26] border-b border-indigo-400/25 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-sky-200/80">
              <span>Public Website &amp; Institutional Charter</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-300 font-medium">Shared Visitor Landing View</span>
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              All-in-One School and Institution Management System
            </h2>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyWebsiteUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/35 text-xs font-semibold text-sky-200 transition cursor-pointer whitespace-nowrap"
            >
              {copiedSiteLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>Website Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span>Copy Public Website Link</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadBrochureTxt}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-xs font-semibold text-white transition shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Download Overview</span>
            </button>
          </div>
        </div>
      )}

      {/* Platform Owner Active Bar (Only when Owner is signed into Google or has active admin session) */}
      {!embeddedInDashboard && isPlatformAdmin && (
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-8 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Platform Owner session active ({firebaseUser?.email || platformOwnerEmail})</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="tabular-nums text-emerald-400">
                {schools.length} registered {schools.length === 1 ? 'institution' : 'institutions'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {schools.length > 0 && (
                <button
                  type="button"
                  onClick={() => enterPortalAsPlatformOwner()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition cursor-pointer whitespace-nowrap"
                >
                  Enter Workspace as Owner
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                  schools.length > 0
                    ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                Register Institute or School
              </button>
              <button
                type="button"
                onClick={() => handleOpenPortalAction('owner')}
                className="text-slate-300 hover:text-white underline underline-offset-4 font-medium transition cursor-pointer whitespace-nowrap"
              >
                Open Portal Switcher
              </button>
              <button
                type="button"
                onClick={logout}
                className="text-slate-400 hover:text-rose-400 font-medium transition cursor-pointer whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          HERO SECTION — 2-Column Balanced Split + Full-Width 4-Column Proof Row
         ===================================================================== */}
      <section
        id="top"
        className="px-4 sm:px-8 pt-10 sm:pt-14 pb-12 sm:pb-16 bg-gradient-to-br from-indigo-950/60 via-transparent to-teal-950/45 border-b border-indigo-500/20"
      >
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Proposition Column */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-300">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-400/10 border border-amber-400/30">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Ghanaian &amp; African Educational Management System
                  </span>
                  <span aria-hidden="true" className="text-indigo-400">·</span>
                  <span className="text-sky-300">Creche through University &amp; Professional Institutes</span>
                </div>

                <h1 className="font-serif text-[clamp(2.25rem,4vw,3.75rem)] font-bold text-white leading-[1.1] tracking-tight text-balance">
                  One Platform.{' '}
                  <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-sky-300 bg-clip-text text-transparent">
                    Every Institution. Complete Educational Management.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-emerald-200 font-medium leading-relaxed max-w-[65ch]">
                  Transform the way your institution manages students, teachers, academics, finances and institutional operations with one integrated digital platform.
                </p>

                <p className="text-sm text-slate-300 leading-relaxed max-w-[65ch]">
                  From student admission and enrolment to graduation, daily biometric attendance to
                  GES terminal reports, school fee billing to Mobile Money reconciliations, and BECE mock
                  preparation to QR-verifiable digital qualifications—everything runs in one secure,
                  cloud-synchronized system accessible across computers, tablets, and smartphones.
                </p>
              </div>

              {/* Focused CTA Decision Block */}
              <div className="space-y-5 pt-2">
                <div className="flex flex-wrap items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>Get Started</span>
                  </button>

                  <a
                    href="#enquiries"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/90 border border-indigo-400/40 text-sky-100 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Request a Demo</span>
                    <ArrowRight className="w-4 h-4 text-sky-300 shrink-0" />
                  </a>

                  {!embeddedInDashboard && (
                    <button
                      type="button"
                      onClick={() => handleOpenPortalAction('staff')}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Portal Sign-In</span>
                    </button>
                  )}
                </div>

                {/* Unboxed Institution Coverage Metadata */}
                <div className="pt-4 border-t border-indigo-500/25 text-xs text-slate-300 leading-relaxed flex flex-wrap items-center gap-1.5">
                  <span className="text-amber-300 font-semibold">9 Institution Types: </span>
                  <span className="text-sky-200">Creche &amp; Nursery</span>
                  <span aria-hidden="true" className="text-indigo-400">·</span>
                  <span className="text-emerald-200">Kindergarten</span>
                  <span aria-hidden="true" className="text-indigo-400">·</span>
                  <span className="text-amber-200">Primary</span>
                  <span aria-hidden="true" className="text-indigo-400">·</span>
                  <span className="text-cyan-200">JHS</span>
                  <span aria-hidden="true" className="text-indigo-400">·</span>
                  <span className="text-pink-200">SHS 1–3</span>
                  <span aria-hidden="true" className="text-indigo-400">·</span>
                  <span className="text-violet-200">Colleges &amp; Universities</span>
                  <span aria-hidden="true" className="text-indigo-400">·</span>
                  <span className="text-teal-200">Professional Institutes</span>
                  <span aria-hidden="true" className="text-indigo-400">·</span>
                  <span className="text-rose-200">TVET</span>
                  <span aria-hidden="true" className="text-indigo-400">·</span>
                  <span className="text-orange-200">Training Centres</span>
                </div>
              </div>
            </div>

            {/* Right Visual Anchor Column — High-Fidelity Educational SIS Dashboard */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="relative flex-1 min-h-[320px] sm:min-h-[400px] lg:h-full rounded-2xl overflow-hidden border border-amber-400/35 bg-slate-950 shadow-2xl group">
                <img
                  src={heroEduDashboardImg}
                  alt="EduDigital SIS Dashboard on Apple display showing Ghanaian student metrics, fee collection in GHS, BECE mock exams and attendance analytics"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                {/* Measured Contrast Scrim with Live Metric Highlights */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-indigo-950/40 to-transparent flex flex-col justify-end p-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-amber-300 font-semibold tracking-wide uppercase">
                      Live Cloud SIS Environment
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-serif font-bold text-white">
                    Simplifying Education. Empowering Institutions. Verifying Excellence.
                  </p>
                  <p className="text-xs text-sky-100/90 mt-1 leading-relaxed">
                    Integrated Ghanaian educational curricula (GES/NaCCA, BECE, WASSCE, TVET) and
                    international professional institute qualification frameworks in one synchronized database.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width 4-Column Architectural Summary Row — Jewel-Toned Surfaces */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="bg-gradient-to-br from-sky-950/80 via-slate-900/90 to-indigo-950/70 border border-sky-500/35 rounded-xl p-5 space-y-1.5">
              <div className="text-xs font-semibold text-sky-300">Institutional Scope</div>
              <div className="text-xl font-bold text-white tabular-nums">10+ Institution Types</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                From nursery and basic schools to universities, chartered bodies, and vocational centres.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-950/75 via-slate-900/90 to-orange-950/65 border border-amber-500/35 rounded-xl p-5 space-y-1.5">
              <div className="text-xs font-semibold text-amber-300">Professional Progression</div>
              <div className="text-xl font-bold text-white tabular-nums">Levels 1–3 &amp; Cert</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Foundation, Intermediate, Advanced, and standalone Certificate &amp; Diploma tracks.
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900/90 to-teal-950/70 border border-emerald-500/35 rounded-xl p-5 space-y-1.5">
              <div className="text-xs font-semibold text-emerald-300">Digital Credentials</div>
              <div className="text-xl font-bold text-white tabular-nums">QR &amp; Serial Lookup</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Authorised digital signatures, unique certificate numbers, and instant employer verification.
              </p>
            </div>

            <div className="bg-gradient-to-br from-violet-950/80 via-slate-900/90 to-fuchsia-950/65 border border-violet-500/35 rounded-xl p-5 space-y-1.5">
              <div className="text-xs font-semibold text-violet-300">Governance &amp; Continuity</div>
              <div className="text-xl font-bold text-white tabular-nums">CSV · PDF · Cloud</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Independent multi-tenant records, encrypted sync, activity logs, and complete data exports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 01 — ABOUT EDUDIGITAL SIS / EDUGHANA SIS & 9 INSTITUTION TIERS
         ===================================================================== */}
      <section id="about" className="px-4 sm:px-8 py-14 sm:py-20 border-b border-indigo-500/20 bg-slate-950/70">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <School className="w-4 h-4 text-amber-300" />
                <span>Section 01 · Institutional Ecosystem</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
                About EduDigital
              </h2>
              <p className="text-[15px] sm:text-base text-slate-200 leading-relaxed">
                EduDigital is the unified school and institutional management system built specifically
                for modern educational landscapes. From grassroots basic schools in Accra, Kumasi,
                and Tamale to prestigious senior high schools, universities, chartered professional bodies, and vocational
                centres, our platform eliminates administrative fragmentation, guarantees multi-device synchronisation,
                and elevates institutional credibility.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
                  <div className="text-emerald-400 font-bold text-lg">9 Tiers</div>
                  <div className="text-[11px] text-slate-400">Creche to University</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
                  <div className="text-amber-400 font-bold text-lg">100% Cloud</div>
                  <div className="text-[11px] text-slate-400">Cross-Device Sync</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-left col-span-2 sm:col-span-1">
                  <div className="text-sky-400 font-bold text-lg">WAEC / GES</div>
                  <div className="text-[11px] text-slate-400">Curriculum Aligned</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative group">
              <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl bg-slate-900/80">
                <img
                  src={modernAfricanCampusImg}
                  alt="Modern EduDigital school campus with students in uniform"
                  className="w-full h-64 sm:h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200 bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                  <span className="font-semibold text-emerald-300">Modern Campus Environment</span>
                  <span className="text-[11px] text-slate-400">Integrated Student Life</span>
                </div>
              </div>
            </div>
          </div>

          {/* 9 Educational Institution Categories Showcase */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <span>The 9 Institutional Categories</span>
                </h3>
                <p className="text-xs text-sky-200/80 mt-0.5">
                  Select any category to explore tailored curriculum alignments, level structures, and specialized capabilities.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-3 py-1 rounded-full w-fit">
                Full 9-Tier Coverage
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {NINE_INSTITUTION_TIERS.map((tier, idx) => (
                <div
                  key={tier.id}
                  className={`bg-gradient-to-br ${tier.tone} border ${tier.borderTone} rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-lg hover:border-amber-400/60 transition-all group`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        Tier 0{idx + 1}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                        {tier.curriculum.split(' ')[0]} Track
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-amber-200 transition-colors">
                        {tier.name}
                      </h4>
                      <p className="text-xs text-sky-200/90 font-medium mt-0.5">
                        {tier.levels}
                      </p>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {tier.description}
                    </p>

                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      {tier.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-1.5 text-[11px] text-slate-200">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setInstitutionType(tier.name);
                        const el = document.getElementById('enquiries');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-xs font-semibold text-amber-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Enquire for {tier.name.split(' ')[0]}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRegisterModal(true)}
                      className="text-[11px] font-bold text-emerald-300 hover:underline cursor-pointer"
                    >
                      Register Now →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 02 — SCHOOL MANAGEMENT SOLUTIONS & WHOLE-CAMPUS GOVERNANCE
         ===================================================================== */}
      <section id="solutions" className="px-4 sm:px-8 py-14 sm:py-20 border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-semibold text-sky-300">
              Section 02 · School Management Solutions
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
              Eliminate disconnected spreadsheets, paper files, and fragmented administration
            </h2>
            <p className="text-[15px] text-slate-200 leading-relaxed">
              Managing an educational institution involves student registration, academic planning,
              attendance monitoring, examination administration, financial management, human
              resource administration, communication, and institutional reporting. Our platform
              connects every department in one accurate, accountable system.
            </p>
          </div>

          {/* Interactive Stakeholder Perspective Explorer (Marquee Full-Width Surface) */}
          <div className="bg-gradient-to-br from-indigo-950/75 via-slate-900/90 to-teal-950/65 border border-indigo-400/30 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-indigo-500/25">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Dedicated Portals for Every Institutional Stakeholder
                </h3>
                <p className="text-xs text-sky-200/80 mt-0.5">
                  Select a role below to inspect how proprietors, teachers, parents, students, and graduates work together.
                </p>
              </div>

              {/* Functional Segmented Filter Control */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950/90 border border-indigo-500/30 rounded-xl">
                {(Object.keys(STAKEHOLDER_VIEWS) as StakeholderTab[]).map((key) => {
                  const isSelected = stakeholderTab === key;
                  const tabGradient =
                    key === 'administrators'
                      ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white'
                      : key === 'teachers'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                      : key === 'parents_students'
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white';
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setStakeholderTab(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isSelected
                          ? tabGradient
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {STAKEHOLDER_VIEWS[key].label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 space-y-3">
                <h4 className="text-lg sm:text-xl font-bold text-white text-balance">
                  {activeStakeholder.heading}
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {activeStakeholder.summary}
                </p>
                {!embeddedInDashboard && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenPortalAction(
                          stakeholderTab === 'parents_students' || stakeholderTab === 'graduates'
                            ? 'student'
                            : 'staff'
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-white transition cursor-pointer whitespace-nowrap"
                    >
                      <span>Open {activeStakeholder.label} Portal</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>
                )}
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeStakeholder.capabilities.map((item, idx) => {
                  const numColors = ['text-sky-300', 'text-amber-300', 'text-emerald-300', 'text-rose-300'];
                  const borderColors = [
                    'border-sky-500/30',
                    'border-amber-500/30',
                    'border-emerald-500/30',
                    'border-rose-500/30',
                  ];
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl bg-slate-950/75 border ${borderColors[idx % borderColors.length]} text-xs text-slate-200 leading-relaxed`}
                    >
                      <span className={`font-mono ${numColors[idx % numColors.length]} font-bold tabular-nums mr-1.5`}>
                        0{idx + 1}.
                      </span>
                      {item}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Asymmetric Bento Grid — 7 Numbered Jewel-Toned Institutional Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 01 — col-span-2 on large screens — Sapphire / Sky */}
            <div className="lg:col-span-2 bg-gradient-to-br from-sky-950/75 via-slate-900/90 to-indigo-950/70 border border-sky-500/35 rounded-2xl p-6 sm:p-7 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    <span className="text-sky-300 font-mono mr-1.5">01.</span>
                    Student Admission, Records &amp; Academic Administration
                  </h3>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    Receive online applications, register learners, generate unique identification
                    numbers, maintain complete student profiles, manage class placement, record academic
                    histories, and monitor progression from intake to completion.
                  </p>
                  <p className="text-xs text-sky-200/80 leading-relaxed pt-1">
                    Administrators and teachers organise classes, subjects, timetables, lesson notes,
                    assignments, academic calendars, attendance registers, continuous assessments, and
                    end-of-term examination marks in one unified workflow.
                  </p>
                </div>
                <div className="md:col-span-5 relative rounded-xl overflow-hidden border border-sky-500/30 shadow-lg group">
                  <img
                    src={heroCampusImg}
                    alt="Campus Administration & Institutional Facilities"
                    className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 text-[10px] font-semibold text-sky-300 bg-slate-950/80 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-sky-500/20 truncate">
                    Campus Facilities &amp; Administration
                  </div>
                </div>
              </div>
            </div>

            {/* 02 — Emerald / Mint */}
            <div className="bg-gradient-to-br from-emerald-950/75 via-slate-900/90 to-teal-950/70 border border-emerald-500/35 rounded-2xl p-6 sm:p-7 space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white">
                <span className="text-emerald-300 font-mono mr-1.5">02.</span>
                Financial &amp; Mobile Money Billing
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                Manage school fees, invoices, receipts, outstanding balances, scholarships,
                discounts, expenditure, and institutional budgets. Record cash payments, bank
                transfers, and approved electronic transactions including Mobile Money integrations.
              </p>
            </div>

            {/* 03 — Amber / Gold */}
            <div className="bg-gradient-to-br from-amber-950/75 via-slate-900/90 to-orange-950/65 border border-amber-500/35 rounded-2xl p-6 sm:p-7 space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white">
                <span className="text-amber-300 font-mono mr-1.5">03.</span>
                Human Resources &amp; Statutory Payroll
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                Maintain comprehensive staff records, monitor daily attendance, manage leave
                applications, organise recruitment, conduct performance appraisals, and administer
                monthly salaries with automated statutory deductions and payslips.
              </p>
            </div>

            {/* 04 — Rose / Coral */}
            <div className="bg-gradient-to-br from-rose-950/70 via-slate-900/90 to-pink-950/60 border border-rose-500/35 rounded-2xl p-6 sm:p-7 space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white">
                <span className="text-rose-300 font-mono mr-1.5">04.</span>
                Library, Transport, Boarding &amp; Welfare
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                Coordinate essential campus operations including library cataloguing and borrowing,
                institutional asset inventory, school bus routes, boarding house allocation, canteen
                point-of-sale, biometric turnstile gate logs, and student health welfare.
              </p>
            </div>

            {/* 05 — Violet / Fuchsia */}
            <div className="bg-gradient-to-br from-violet-950/75 via-slate-900/90 to-fuchsia-950/65 border border-violet-500/35 rounded-2xl p-6 sm:p-7 space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white">
                <span className="text-violet-300 font-mono mr-1.5">05.</span>
                AI Assistance &amp; Management Analytics
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                Support teachers with lesson planning, assessment preparation, learning materials,
                and report comments—while giving leaders real-time analytics on student performance,
                attendance trends, fee collection rates, and downloadable CSV or PDF reports.
              </p>
            </div>

            {/* 06 & 07 — Full-width Super Admin & Security Governance Banner */}
            <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-cyan-950/75 border border-cyan-500/35 rounded-2xl p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  <span className="text-amber-300 font-mono mr-1.5">06.</span>
                  Super Administrator Oversight &amp; Delegated Governance
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Through the dedicated Super Administrator control plane, the Platform Owner
                  registers institutions, approves applications, manages flexible subscription
                  packages, monitors platform activity, and configures system settings. Specific
                  responsibilities—institutional registration, customer support, technical
                  assistance, financial administration, and certificate management—can be assigned,
                  updated, suspended, reactivated, or revoked without compromising the Platform
                  Owner’s ultimate authority.
                </p>
              </div>

              <div className="space-y-2.5 lg:border-l lg:border-cyan-500/25 lg:pl-6">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  <span className="text-cyan-300 font-mono mr-1.5">07.</span>
                  Multi-Tenant Security, Data Protection &amp; Recovery
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Each institution operates within its own isolated workspace so student, staff,
                  financial, and examination records remain protected from unauthorised access by
                  other organisations. Role-based permissions, authenticated cloud sessions,
                  activity logs, and instant CSV, PDF, and JSON backup/restore mechanisms safeguard
                  institutional accountability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 03 — STUDENT INFORMATION SYSTEM (SIS)
         ===================================================================== */}
      <section id="sis" className="px-4 sm:px-8 py-14 sm:py-20 border-b border-indigo-500/20 bg-slate-950/80">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Section 03 · Student Information System (SIS)</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
              Complete Student Lifecycle Records &amp; Profiles
            </h2>
            <p className="text-[15px] text-slate-200 leading-relaxed">
              Maintain permanent, tamper-proof student records from initial admission inquiry to graduation.
              Every enrolled learner receives an automated institutional student number, full biodata profile,
              uploaded photograph badge, and linked emergency contacts accessible across authorized devices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-gradient-to-br from-sky-950/70 via-slate-900 to-indigo-950/60 border border-sky-500/30 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold">
                ID
              </div>
              <h3 className="text-base font-bold text-white">Unique Student Identification</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automated index and student numbering (e.g. KRI-2025-0104) prevents record duplication across multi-campus institutions.
              </p>
              <div className="text-[11px] text-sky-300 font-mono">Format: [CODE]-[YEAR]-[SEQ]</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-teal-950/60 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Digital Photo &amp; Biodata Badges</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Direct camera capture or image uploads stored permanently in the central cloud for report cards and printable ID cards.
              </p>
              <div className="text-[11px] text-emerald-300 font-mono">Persistent Cloud Storage</div>
            </div>

            <div className="bg-gradient-to-br from-amber-950/70 via-slate-900 to-orange-950/60 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Parent &amp; Guardian Linkages</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect multiple guardians with verified WhatsApp numbers, relationship tags, and emergency authorization rights.
              </p>
              <div className="text-[11px] text-amber-300 font-mono">Real-time SMS / MoMo Sync</div>
            </div>

            <div className="bg-gradient-to-br from-rose-950/70 via-slate-900 to-pink-950/60 border border-rose-500/30 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Medical &amp; Safeguarding Notes</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Confidential logging of allergies, chronic conditions, emergency medical contacts, and dietary needs.
              </p>
              <div className="text-[11px] text-rose-300 font-mono">RBAC Health Isolation</div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 04 — ADMISSION AND ENROLMENT (CRECHE TO SHS 3 & STREAMS)
         ===================================================================== */}
      <section id="admissions" className="px-4 sm:px-8 py-14 sm:py-20 border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                <ClipboardList className="w-4 h-4 text-sky-400" />
                <span>Section 04 · Admission &amp; Enrolment</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
                Streamlined Admission with Intelligent Class &amp; Stream Placement
              </h2>
              <p className="text-[15px] text-slate-200 leading-relaxed">
                Whether admitting a toddler to Creche or placing an SHS 1 student into General Science Stream B,
                EduDigital SIS ensures student registration is seamless. The system dynamically assigns classes
                and divisions, creating active streams on the fly to eliminate registration lockups.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dynamic Stream Placements</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Supports Streams A, B, C, D, E and custom divisions with automated class teacher assignment.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>6 Academic Programme Tracks</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    General Science, General Arts, Business, Visual Arts, Home Economics, and Technical Education.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span>Live Enrolment Flow</span>
              </h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-mono text-emerald-400 font-bold">01.</span>
                  <div>
                    <span className="font-semibold text-white">Application Received:</span> Online portal or front-desk walk-in with guardian contact verification.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-mono text-sky-400 font-bold">02.</span>
                  <div>
                    <span className="font-semibold text-white">Level &amp; Stream Selected:</span> Form tutor assigned, subject syllabus linked, and billing generated.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-mono text-amber-400 font-bold">03.</span>
                  <div>
                    <span className="font-semibold text-white">Central Cloud Persistence:</span> Student is immediately visible across all authorized laptops and phones.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 05 — ACADEMIC AND EXAMINATION MANAGEMENT (GES SBA & REPORTS)
         ===================================================================== */}
      <section id="academics" className="px-4 sm:px-8 py-14 sm:py-20 border-b border-indigo-500/20 bg-slate-950/60">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Visual: Ghanaian Students & Teacher in Modern STEM Laboratory */}
            <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-emerald-500/35 bg-slate-950 shadow-2xl group">
              <div className="relative aspect-[4/3] w-full">
                <img
                  src={stemClassroomImg}
                  alt="Ghanaian students and teacher engaged in a modern STEM computer science laboratory"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-5">
                  <div className="text-xs text-amber-300 font-semibold">STEM &amp; National Curriculum</div>
                  <div className="text-sm font-bold text-white">Hands-on Digital &amp; Scientific Excellence</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Award className="w-4 h-4 text-amber-300" />
                <span>Section 05 · Academic &amp; Examination Management</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
                GES Continuous Assessment, Grading &amp; Terminal Reports
              </h2>
              <p className="text-[15px] text-slate-200 leading-relaxed">
                Fully aligned with the Ghana Education Service (GES) and National Council for Curriculum and
                Assessment (NaCCA) standards. Teachers enter continuous assessment marks (Class Score 30% / Exam 70%),
                generate automated terminal report cards with accurate grade scales (1 to 9), and print official transcripts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white">SBA Continuous Score</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">30% / 70%</div>
                  <p className="text-[11px] text-slate-400">Class exercises, projects &amp; exams</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white">Stanine 1–9 Grading</div>
                  <div className="text-lg font-bold text-sky-400 font-mono">Grade 1 = High</div>
                  <p className="text-[11px] text-slate-400">BECE &amp; WASSCE performance scales</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white">Terminal Reports</div>
                  <div className="text-lg font-bold text-amber-400 font-mono">Instant PDF</div>
                  <p className="text-[11px] text-slate-400">With digital signature &amp; crest</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 06 — ATTENDANCE MANAGEMENT & BIOMETRICS
         ===================================================================== */}
      <section id="attendance" className="px-4 sm:px-8 py-14 sm:py-20 border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Section 06 · Attendance Management</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
              Daily Class Roll-Calls, Teacher Registers &amp; Biometric Gate Logs
            </h2>
            <p className="text-[15px] text-slate-200 leading-relaxed">
              Eliminate truancy and manual register tallying. Teachers take attendance in seconds via mobile phones
              or tablets. Optional integration with campus biometric turnstiles logs exact gate entry and departure times.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/60 via-slate-900 to-slate-950 border border-cyan-500/30 space-y-2.5">
              <div className="text-xs font-bold text-cyan-300">Daily Morning &amp; Afternoon Rolls</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Stream teachers mark present, late, excused, or absent with one-tap batch selection.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-2.5">
              <div className="text-xs font-bold text-emerald-300">Biometric Gate Turnstiles</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Card RFID or fingerprint hardware syncs real-time arrival logs to administrator dashboards.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/30 space-y-2.5">
              <div className="text-xs font-bold text-amber-300">Automated Guardian Notifications</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Instant WhatsApp or SMS alert dispatched to parents when a learner is recorded absent or leaves campus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 07 — FEES AND FINANCIAL MANAGEMENT
         ===================================================================== */}
      <section id="finance" className="px-4 sm:px-8 py-14 sm:py-20 border-b border-indigo-500/20 bg-slate-950/80">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Section 07 · Fees &amp; Financial Management</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
              Automated Fee Billing, Mobile Money Receipts &amp; Ledger Tracking
            </h2>
            <p className="text-[15px] text-slate-200 leading-relaxed">
              Full institutional accounting in Ghanaian Cedis (GH₵). Issue itemised termly invoices, record cash,
              bank deposit slips, and electronic Mobile Money transactions (MTN MoMo, Telecel Cash, AT Money),
              and maintain an airtight institutional expense ledger.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-2">
              <div className="text-xs font-bold text-emerald-400">Mobile Money Integration</div>
              <p className="text-xs text-slate-300">
                Direct recording of MTN MoMo, Telecel Cash, and AT Money transaction reference numbers.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-sky-500/30 space-y-2">
              <div className="text-xs font-bold text-sky-400">Official Electronic Receipts</div>
              <p className="text-xs text-slate-300">
                Instantly printable and shareable payment receipts with QR verification stamps.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-2">
              <div className="text-xs font-bold text-amber-400">Arrears &amp; Defaulter Tracking</div>
              <p className="text-xs text-slate-300">
                Live visibility into outstanding fee balances per class, stream, or individual student.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-violet-500/30 space-y-2">
              <div className="text-xs font-bold text-violet-400">Institutional Expense Ledger</div>
              <p className="text-xs text-slate-300">
                Record operational costs, teacher travel allowances, textbook procurement, and maintenance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 08 — TEACHER AND STAFF MANAGEMENT & PAYROLL
         ===================================================================== */}
      <section id="staff" className="px-4 sm:px-8 py-14 sm:py-20 border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
              <Users className="w-4 h-4 text-violet-400" />
              <span>Section 08 · Teacher &amp; Staff Management</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
              Staff Directory, Teaching Loads &amp; Statutory SSNIT / PAYE Payroll
            </h2>
            <p className="text-[15px] text-slate-200 leading-relaxed">
              Manage non-teaching and academic personnel. Assign subject teaching allocations across classes and streams,
              track qualifications and NTC teacher licenses, and automate monthly salary calculations with Ghana GRA
              PAYE and SSNIT Tier 1 &amp; Tier 2 statutory deductions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white">Teacher Workload &amp; Allocation</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Assign form masters/mistresses and subject specialists to exact classes and streams.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white">Statutory Deductions</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automated SSNIT Tier 1 &amp; 2 (13.5% employer / 5.5% employee) and GRA income tax tables.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white">Automated Payslips</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Generate clean, confidential employee monthly payslips downloadable in PDF or printable format.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 09 — PARENT AND STUDENT PORTALS
         ===================================================================== */}
      <section id="portals" className="px-4 sm:px-8 py-14 sm:py-20 border-b border-indigo-500/20 bg-slate-950/70">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
              <Users className="w-4 h-4 text-rose-400" />
              <span>Section 09 · Parent &amp; Student Portals</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
              Dedicated Self-Service Portals for Guardians &amp; Learners
            </h2>
            <p className="text-[15px] text-slate-200 leading-relaxed">
              Parents no longer have to wait until end of term to know their child’s progress. From any phone,
              parents can check live attendance, view continuous assessments, download report cards, and pay fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border border-rose-500/30 space-y-3">
              <h3 className="text-base font-bold text-white">Parent Portal Features</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time daily attendance and punctuality status</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Itemised fee statements and Mobile Money payment confirmation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Direct download of signed terminal report cards</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Direct messaging and official institutional circulars</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-950 border border-sky-500/30 space-y-3">
              <h3 className="text-base font-bold text-white">Student Portal Features</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Personal weekly timetable and classroom room allocations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Homework assignments, learning notes and teacher feedback</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Continuous assessment marks and exam revision materials</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Library borrowed books and return schedule tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 10 — MOCK EXAMINATION & BECE PREPARATION
         ===================================================================== */}
      <section id="bece-prep" className="px-4 sm:px-8 py-14 sm:py-20 border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Section 10 · Mock Examination &amp; BECE Preparation</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
              BECE Mock Diets, Stanine 1–9 Analysis &amp; AI Diagnostic Interventions
            </h2>
            <p className="text-[15px] text-slate-200 leading-relaxed">
              Prepare candidates for the Basic Education Certificate Examination (BECE) with institutional mock series.
              Evaluate students across core subjects (Mathematics, English Language, Integrated Science, Social Studies)
              using the national Stanine grading framework, with AI-powered diagnostic weakness analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-2.5">
              <h3 className="text-sm font-bold text-amber-300">National Stanine 1–9 System</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automated aggregate calculation (Best 6 subjects) matching WAEC BECE placement criteria.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-sky-500/30 space-y-2.5">
              <h3 className="text-sm font-bold text-sky-300">Multi-Series Mock Diets</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Track progression across Series 1, Series 2, and Final Mock with comparative trend charts.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-2.5">
              <h3 className="text-sm font-bold text-emerald-300">AI Readiness Reports</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pinpoint high-risk candidates needing immediate remedial revision before official exam sittings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 11 — PROFESSIONAL INSTITUTES & CANDIDATE DIETS
         ===================================================================== */}
      <section
        id="institutes"
        className="px-4 sm:px-8 py-14 sm:py-20 bg-gradient-to-b from-indigo-950/45 via-slate-950/60 to-teal-950/40 border-b border-indigo-500/20"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-xs font-semibold text-amber-300">
                  Chartered Bodies, Certificate Organisations &amp; Vocational Centres
                </div>
                <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
                  Specialised academic progression from Foundation Level 1 to QR-verified graduation
                </h2>
                <p className="text-[15px] text-slate-200 leading-relaxed">
                  Beyond conventional school administration, our platform provides a dedicated
                  environment for professional institutions, chartered institutes,
                  certificate-awarding organisations, and vocational training centres—cleanly
                  separated from basic school workspaces.
                </p>
              </div>

              {/* Qualification Level Interactive Explorer */}
              <div className="bg-slate-900/90 border border-indigo-400/30 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950/90 border border-indigo-500/25 rounded-xl">
                  {(Object.keys(QUALIFICATION_TIERS) as QualificationTierKey[]).map((tierKey) => {
                    const isSelected = qualificationTier === tierKey;
                    const tierTone =
                      tierKey === 'level1'
                        ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white'
                        : tierKey === 'level2'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                        : tierKey === 'level3'
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white';
                    return (
                      <button
                        key={tierKey}
                        type="button"
                        onClick={() => setQualificationTier(tierKey)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isSelected
                            ? tierTone
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {QUALIFICATION_TIERS[tierKey].tabLabel}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs text-amber-300 font-semibold">
                    {activeTier.subtitle}
                  </div>
                  <h3 className="text-lg font-bold text-white">{activeTier.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {activeTier.description}
                  </p>
                  <ul className="space-y-2 pt-2 border-t border-indigo-500/20">
                    {activeTier.highlights.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Visual Showcase — Institute Graduation */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="relative flex-1 min-h-[280px] lg:h-full rounded-2xl overflow-hidden border border-violet-400/35 bg-slate-900 shadow-xl">
                {!gradImgFailed ? (
                  <img
                    src={instituteGraduationImg}
                    alt="Professional institute fellows and graduates holding official embossed qualification certificates"
                    referrerPolicy="no-referrer"
                    onError={() => setGradImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-violet-950/60 to-slate-900 flex flex-col items-center justify-center p-8 text-center">
                    <GraduationCap className="w-12 h-12 text-amber-300 mb-3" />
                    <p className="text-sm font-semibold text-white">
                      Professional Qualifications &amp; Graduate Register
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-indigo-950/40 to-transparent flex flex-col justify-end p-6">
                  <div className="text-xs text-amber-300 font-semibold">
                    Searchable Graduate &amp; Alumni Register
                  </div>
                  <p className="text-sm font-bold text-white mt-0.5">
                    Organised by programme, qualification, level attained, and year of completion
                  </p>
                  <p className="text-xs text-sky-100/90 mt-1 leading-relaxed">
                    Approved completers receive personal alumni accounts to download certificates,
                    obtain transcripts, and share verification links with employers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Digital Certificate Verification Interactive Bar + Visual */}
          <div
            id="verification"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-gradient-to-r from-indigo-950/80 via-slate-900/95 to-emerald-950/75 border border-teal-400/35 rounded-2xl p-6 sm:p-8 shadow-xl"
          >
            <div className="lg:col-span-5 rounded-xl overflow-hidden border border-teal-400/30 bg-slate-950 min-h-[230px]">
              {!verifyImgFailed ? (
                <img
                  src={verificationWorkspaceImg}
                  alt="Registrar verification portal displaying an academic record next to a QR-sealed certificate"
                  referrerPolicy="no-referrer"
                  onError={() => setVerifyImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <QrCode className="w-10 h-10 text-emerald-400 mb-2" />
                  <span className="text-xs font-semibold text-white">
                    QR &amp; Certificate Serial Verification
                  </span>
                </div>
              )}
            </div>

            <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-emerald-300">
                  Digital Certificate Issuance &amp; Employer Verification
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white text-balance">
                  Instant online verification by QR code or certificate number
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Institutions issue professionally designed digital certificates containing unique
                  certificate numbers, authorised signatures, and scannable QR codes. Employers,
                  recruitment agencies, universities, and embassies can confirm qualification
                  authenticity directly against official issuing records without exposing a
                  graduate’s confidential academic account.
                </p>
              </div>

              <form onSubmit={handleVerifyLookupSubmit} className="space-y-2.5">
                <label className="block text-xs font-semibold text-amber-200">
                  Verify an Official Certificate Number Online
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-sky-300 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={verifySerialQuery}
                      onChange={(e) => setVerifySerialQuery(e.target.value)}
                      placeholder="Enter certificate serial number or candidate ID..."
                      className="w-full bg-slate-950/90 border border-teal-500/40 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white text-xs font-bold shadow-md transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <QrCode className="w-4 h-4 shrink-0" />
                    <span>Open Verification Portal</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 03 — VISION, MISSION, PROMISE & INSTITUTION TYPES
         ===================================================================== */}
      <section id="vision" className="px-4 sm:px-8 py-14 sm:py-20 border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-sky-950/80 via-slate-900/90 to-indigo-950/70 border border-sky-500/35 rounded-2xl p-6 sm:p-7 space-y-3">
              <div className="text-xs font-semibold text-sky-300">Our Vision</div>
              <h3 className="font-serif text-xl font-bold text-white">
                Transforming Educational Administration &amp; Certification
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                To become a leading digital education and institutional management platform that
                transforms educational administration, strengthens academic excellence, and promotes
                credible professional certification through innovative technology.
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900/90 to-teal-950/70 border border-emerald-500/35 rounded-2xl p-6 sm:p-7 space-y-3">
              <div className="text-xs font-semibold text-emerald-300">Our Mission</div>
              <h3 className="font-serif text-xl font-bold text-white">
                Secure, Intelligent &amp; Accessible Institutional Solutions
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                To empower educational institutions and professional training organisations with
                secure, intelligent, accessible, and integrated digital solutions that simplify
                administration, improve accountability, enhance teaching and learning, and
                strengthen the credibility of academic and professional qualifications.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-950/75 via-slate-900/90 to-orange-950/65 border border-amber-500/35 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-amber-300">Our Promise</div>
                <h3 className="font-serif text-2xl font-bold text-white leading-snug text-balance">
                  Simplifying Education. Empowering Institutions. Verifying Excellence.
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Flexible subscription arrangements and configurable service packages tailored to
                  your institution’s size, student population, active users, and required modules.
                </p>
              </div>
              <div className="pt-3 border-t border-amber-500/25 text-xs text-amber-200/85">
                SMS · Email · WhatsApp · Mobile Money · Cloud Sync
              </div>
            </div>
          </div>

          {/* Built for Every Institutional Leader — Interactive Segment Selector */}
          <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-purple-950/55 border border-indigo-400/30 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-indigo-500/25">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Tailored for Every Educational &amp; Training Institution
                </h3>
                <p className="text-xs text-sky-200/80">
                  Are you a school proprietor, headteacher, principal, university administrator, professional institute director, or training centre manager?
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950/90 border border-indigo-500/30 rounded-xl">
                {(Object.keys(INSTITUTION_SEGMENTS) as InstitutionSegmentKey[]).map((segKey) => {
                  const isSelected = institutionSegment === segKey;
                  const segTone =
                    segKey === 'basic_secondary'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                      : segKey === 'tertiary_university'
                      ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white'
                      : segKey === 'professional_institute'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                      : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white';
                  return (
                    <button
                      key={segKey}
                      type="button"
                      onClick={() => setInstitutionSegment(segKey)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isSelected
                          ? segTone
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {INSTITUTION_SEGMENTS[segKey].label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-2.5">
                <div className="text-xs font-semibold text-amber-300">
                  Built for {activeSegment.audience}
                </div>
                <h4 className="text-lg font-bold text-white">{activeSegment.label}</h4>
                <p className="text-sm text-slate-200 leading-relaxed">{activeSegment.summary}</p>
                <p className="text-xs text-sky-300 pt-1">{activeSegment.modules}</p>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
                <a
                  href="#enquiries"
                  onClick={() => {
                    setInstitutionType(activeSegment.label);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-md transition whitespace-nowrap"
                >
                  <span>Enquire for {activeSegment.label.split(',')[0]}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </a>
                <button
                  type="button"
                  onClick={handleDownloadBrochureTxt}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950/85 hover:bg-slate-800 border border-indigo-400/40 text-sky-100 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>Download Platform Summary</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 03B — MEET THE PLATFORM OWNER AND DEVELOPER
         ===================================================================== */}
      <section
        id="owner"
        className="px-4 sm:px-8 py-14 sm:py-20 bg-gradient-to-b from-amber-950/20 via-indigo-950/35 to-slate-950/60 border-b border-indigo-500/20"
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-950/85 via-slate-900/95 to-emerald-950/75 border border-amber-400/35 rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center shadow-2xl">
            {/* Left Framed Passport Portrait */}
            <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
              <div className="relative w-56 sm:w-64 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-400/75 bg-slate-950 shadow-xl">
                <img
                  src={effectiveOwnerPhotoSrc}
                  alt={`${platformOwnerProfile.name} — ${platformOwnerProfile.roleTitle}`}
                  referrerPolicy="no-referrer"
                  onError={() => {
                    if (!ownerPhotoFallback) setOwnerPhotoFallback(true);
                  }}
                  className="w-full h-full object-cover object-top"
                />
                {isPlatformAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowOwnerPhotoModal(true)}
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-amber-500 hover:text-slate-950 border border-amber-400/50 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap shadow-lg"
                  >
                    <Camera className="w-3.5 h-3.5 shrink-0" />
                    <span>Replace Photo</span>
                  </button>
                )}
              </div>
              <div className="mt-3 text-center lg:text-left">
                <div className="text-sm font-bold text-white">{platformOwnerProfile.name}</div>
                <div className="text-xs text-amber-300 font-semibold">{platformOwnerProfile.roleTitle}</div>
              </div>
            </div>

            {/* Right Leadership Introduction & Direct WhatsApp Contact */}
            <div className="lg:col-span-8 space-y-5">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-amber-300">
                    Leadership, Trust &amp; Direct Accountability
                  </span>
                  {isPlatformAdmin ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowOwnerPhotoModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer whitespace-nowrap"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Upload / Crop Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOwnerDraftName(platformOwnerProfile.name);
                          setOwnerDraftRole(platformOwnerProfile.roleTitle);
                          setOwnerDraftSubtitle(platformOwnerProfile.subtitle);
                          setOwnerDraftBio(platformOwnerProfile.bio);
                          setOwnerDraftWhatsApp(platformOwnerProfile.whatsappNumber);
                          setShowOwnerBioModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer whitespace-nowrap"
                      >
                        <Pencil className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Edit Owner Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRegisterModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition cursor-pointer whitespace-nowrap"
                      >
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Register School / Institute</span>
                      </button>
                    </div>
                  ) : (
                    !embeddedInDashboard && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowWebsiteOwnerForm((prev) => !prev);
                          setOwnerAuthError(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-emerald-500/50 text-xs font-semibold text-emerald-300 hover:text-white transition cursor-pointer whitespace-nowrap"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Platform Owner Sign-In</span>
                      </button>
                    )
                  )}
                </div>

                {!embeddedInDashboard && !isPlatformAdmin && showWebsiteOwnerForm && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Sign In as Platform Owner</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowWebsiteOwnerForm(false);
                          setOwnerAuthError(null);
                        }}
                        aria-label="Close Platform Owner Sign-In"
                        className="text-slate-400 hover:text-white p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleOwnerEmailSignInOnWebsite} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-5 relative">
                        <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={ownerEmailInput}
                          onChange={(e) => {
                            setOwnerEmailInput(e.target.value);
                            setOwnerAuthError(null);
                          }}
                          placeholder="Platform Owner email address"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-4 relative">
                        <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          value={ownerPasswordInput}
                          onChange={(e) => {
                            setOwnerPasswordInput(e.target.value);
                            setOwnerAuthError(null);
                          }}
                          placeholder="Password (if set)"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <button
                          type="submit"
                          className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer whitespace-nowrap"
                        >
                          Sign In with Email
                        </button>
                      </div>
                    </form>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                      <button
                        type="button"
                        disabled={isOwnerSigningIn}
                        onClick={handleOwnerSignInOnWebsite}
                        className="text-slate-300 hover:text-white underline underline-offset-4 font-semibold cursor-pointer disabled:opacity-60"
                      >
                        {isOwnerSigningIn ? 'Connecting to Google...' : 'Or Sign In with Google'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenPortalAction('owner')}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                      >
                        Open Full Owner Portal →
                      </button>
                    </div>
                  </div>
                )}

                {ownerAuthError && (
                  <div
                    role="alert"
                    className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs"
                  >
                    {ownerAuthError}
                  </div>
                )}

                <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
                  Meet the Platform Owner and Developer
                </h2>

                <p className="text-sm sm:text-base font-medium text-emerald-300 leading-snug">
                  {platformOwnerProfile.subtitle}
                </p>
              </div>

              <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed max-w-[68ch]">
                {platformOwnerProfile.bio}
              </p>

              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-3 sm:gap-4">
                <a
                  href={buildWhatsAppUrl(
                    effectiveOwnerWhatsAppRaw,
                    'Hello Platform Owner, I am reaching out from the website regarding institutional registration, a live demonstration, or partnership enquiries.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Contact Owner on WhatsApp (${formattedOwnerWhatsApp})`}
                  aria-label={`Contact Owner on WhatsApp (${formattedOwnerWhatsApp})`}
                  className="w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 text-white shadow-md shadow-[#25D366]/25 ring-2 ring-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer shrink-0"
                >
                  <WhatsAppLogoIcon className="w-6 h-6" />
                </a>

                <a
                  href="#enquiries"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition whitespace-nowrap"
                >
                  <span>Request Institutional Onboarding</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                </a>

                {!embeddedInDashboard && !isPlatformAdmin && (
                  <button
                    type="button"
                    onClick={() => handleOpenPortalAction('owner')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Owner Portal Sign-In</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 13 — AI-POWERED ACADEMIC ANALYTICS
         ===================================================================== */}
      <section id="ai-analytics" className="px-4 sm:px-8 py-14 sm:py-20 border-b border-indigo-500/20 bg-slate-950/70">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Section 13 · AI-Powered Academic Analytics</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
              Predictive Insights, Weakness Diagnostics &amp; Automated Commentary
            </h2>
            <p className="text-[15px] text-slate-200 leading-relaxed">
              Equip leadership and teachers with actionable intelligence. Our embedded educational analytics
              identify students falling behind in core competencies, suggest targeted remedial interventions,
              and assist teachers in drafting constructive, personalized terminal report card comments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-3">
              <h3 className="text-base font-bold text-white">Diagnostic Learning Interventions</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Flags specific topic deficits in Mathematics, Science, and English before national exams.
              </p>
              <div className="text-[11px] text-emerald-300 font-mono">Stanine Risk Assessment</div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-950/60 via-slate-900 to-slate-950 border border-sky-500/30 space-y-3">
              <h3 className="text-base font-bold text-white">Automated Teacher Comments</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Drafts thoughtful, professional terminal observations tailored to each learner’s strengths and effort.
              </p>
              <div className="text-[11px] text-sky-300 font-mono">Teacher Time Saver</div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/30 space-y-3">
              <h3 className="text-base font-bold text-white">Executive Retention Analytics</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Visualizes attendance trends, enrollment progression, and fee revenue forecasts in real time.
              </p>
              <div className="text-[11px] text-amber-300 font-mono">Proprietor Dashboard</div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 14 — SECURITY AND DATA PROTECTION
         ===================================================================== */}
      <section id="security" className="px-4 sm:px-8 py-14 sm:py-20 border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
              <Shield className="w-4 h-4 text-sky-400" />
              <span>Section 14 · Security &amp; Data Protection</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
              Multi-Tenant Architecture, Hashed Passwords &amp; Statutory Compliance
            </h2>
            <p className="text-[15px] text-slate-200 leading-relaxed">
              Institutional autonomy is guaranteed. Every institution operates with a unique institution ID
              and isolated cloud database partition. User passwords are encrypted with SHA-256 cryptographic salts,
              and all processing aligns strictly with the Ghana Data Protection Act, 2012 (Act 843).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-white">Unique Institution ID</h3>
              <p className="text-xs text-slate-300">Strict RBAC boundaries ensure School A never sees School B records.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-white">Cryptographic Hashes</h3>
              <p className="text-xs text-slate-300">Zero plain-text password storage across database, network, or server disks.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-white">Ghana DPA Act 843</h3>
              <p className="text-xs text-slate-300">Audited compliance with statutory West African personal data privacy regulations.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-white">Multi-Device Cloud Sync</h3>
              <p className="text-xs text-slate-300">Continuous cloud reconciliation keeps phones, tablets, and laptops in exact lockstep.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 15 — SUBSCRIPTION PACKAGES
         ===================================================================== */}
      <section id="pricing" className="px-4 sm:px-8 py-14 sm:py-20 border-b border-indigo-500/20 bg-slate-950/80">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <DollarSign className="w-4 h-4 text-amber-300" />
              <span>Section 15 · Transparent Subscription Packages</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
              Tailored Institutional Tiers for Every Stage of Education
            </h2>
            <p className="text-[15px] text-slate-200 leading-relaxed">
              Transparent institutional packages with zero hidden fees. Select your tier below to begin onboarding
              or request a customized demonstration for your management board.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {SUBSCRIPTION_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-xl hover:border-amber-400/50 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold border px-3 py-1 rounded-full ${pkg.badgeColor}`}>
                      {pkg.badge}
                    </span>
                    <span className="text-xs font-mono text-slate-400">Termly / Diet</span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                    <p className="text-xs text-emerald-300 font-medium mt-1">{pkg.target}</p>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{pkg.highlight}</p>

                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-amber-300">Included Modules &amp; Capabilities:</div>
                    {pkg.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
                  <a
                    href="#enquiries"
                    onClick={() => {
                      setInstitutionType(pkg.name);
                      setEnquiryType('Subscription Package & Pricing Quote');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs text-center shadow-md transition whitespace-nowrap cursor-pointer"
                  >
                    Select {pkg.name.split(' ')[0]} Package
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(true)}
                    className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold text-center transition cursor-pointer"
                  >
                    Register School Directly
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 16 — INSTITUTIONAL REGISTRATION, SUBSCRIPTION & DEMO ENQUIRIES
         ===================================================================== */}
      <section id="enquiries" className="px-4 sm:px-8 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Direct Contact & Onboarding Guidance */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-amber-300">
                Onboarding, Demonstrations &amp; Subscriptions
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
                Ready to transform your institution? Let us help you manage smarter, operate better, and achieve more.
              </h2>
              <p className="text-sm text-slate-200 leading-relaxed">
                Whether you are establishing a new institution or transforming an existing one, we
                are ready to support your digital journey. Contact us to discuss your institutional
                requirements, request a product demonstration, explore available features, and
                select a suitable subscription package.
              </p>
            </div>

            {/* Direct WhatsApp Quick Contact (Compact Rounded Style) */}
            <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-teal-950/50 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shrink-0">
                  <WhatsAppLogoIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white">
                    Direct WhatsApp Registration &amp; Support
                  </div>
                  <div className="text-xs font-mono font-bold text-[#25D366] tabular-nums">
                    {formattedOwnerWhatsApp}
                  </div>
                </div>
              </div>

              <a
                href={buildWhatsAppUrl(effectiveOwnerWhatsAppRaw, enquiryWhatsAppPrefill)}
                target="_blank"
                rel="noopener noreferrer"
                title={`Chat on WhatsApp (${formattedOwnerWhatsApp})`}
                aria-label={`Chat on WhatsApp (${formattedOwnerWhatsApp})`}
                className="w-11 h-11 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 text-white shadow-md shadow-[#25D366]/25 ring-2 ring-white/20 flex items-center justify-center transition-all hover:scale-105 cursor-pointer shrink-0"
              >
                <WhatsAppLogoIcon className="w-5 h-5" />
              </a>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-amber-300">What happens when you enquire:</p>
              <p><span className="text-sky-300 font-mono mr-1">01.</span>Consultation on your academic structure, levels, and required modules.</p>
              <p><span className="text-emerald-300 font-mono mr-1">02.</span>Live product demonstration for your proprietor, board, or academic team.</p>
              <p><span className="text-violet-300 font-mono mr-1">03.</span>Provisioning of your isolated institutional portal and administrator accounts.</p>
            </div>
          </div>

          {/* Right Validated Enquiry & Demo Request Form */}
          <div className="lg:col-span-7 bg-gradient-to-br from-indigo-950/75 via-slate-900/95 to-slate-900 border border-indigo-400/35 rounded-2xl p-6 sm:p-8 shadow-xl">
            {submittedEnquiry ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3 pb-4 border-b border-slate-800">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-mono text-emerald-400 tabular-nums">
                      Reference {submittedEnquiry.id} · {submittedEnquiry.submittedAt}
                    </div>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      Institutional Enquiry Prepared
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Thank you, {submittedEnquiry.contactName}. Your details for{' '}
                      <strong className="text-white">{submittedEnquiry.institutionName}</strong> are
                      ready. Click below to send this formatted brief directly to our team on
                      WhatsApp ({formattedOwnerWhatsApp}) for immediate onboarding assistance.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-1.5 text-slate-300">
                  <div>
                    <span className="text-slate-500">Institution: </span>
                    <span className="font-semibold text-white">{submittedEnquiry.institutionName}</span>
                    <span> · {submittedEnquiry.institutionType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Contact: </span>
                    <span>
                      {submittedEnquiry.contactName} ({submittedEnquiry.roleTitle})
                    </span>
                  </div>
                  <div className="tabular-nums">
                    <span className="text-slate-500">Email &amp; Phone: </span>
                    <span>
                      {submittedEnquiry.email} · {submittedEnquiry.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Enquiry &amp; Scale: </span>
                    <span>
                      {submittedEnquiry.enquiryType} · {submittedEnquiry.learnerCount}
                    </span>
                  </div>
                  {submittedEnquiry.notes && (
                    <div className="pt-1 text-slate-400">
                      <span className="text-slate-500">Notes: </span>
                      {submittedEnquiry.notes}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={buildWhatsAppUrl(PLATFORM_OWNER_WHATSAPP_RAW, enquiryWhatsAppPrefill)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 text-xs font-bold transition whitespace-nowrap"
                  >
                    <WhatsAppLogoIcon className="w-4 h-4 shrink-0" />
                    <span className="tabular-nums">Send Enquiry via WhatsApp ({formattedOwnerWhatsApp})</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setSubmittedEnquiry(null)}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                  >
                    Edit or Submit Another Enquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-4 text-xs">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Request a Product Demonstration or Institutional Registration
                  </h3>
                  <p className="text-slate-400 mt-0.5">
                    Complete your institutional details below to prepare an onboarding or subscription package request.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Institution Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      placeholder="e.g. Chartered Institute of Management / Royal Academy"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Institution Category *
                    </label>
                    <select
                      value={institutionType}
                      onChange={(e) => setInstitutionType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Professional / Chartered Institute">
                        Professional / Chartered Institute (Levels 1–3 &amp; Certificate)
                      </option>
                      <option value="Certificate / Vocational Training Centre">
                        Certificate / Vocational / Online Training Centre
                      </option>
                      <option value="Nursery, Primary & Junior High School">
                        Nursery, Kindergarten, Primary &amp; JHS
                      </option>
                      <option value="Senior High / International School">
                        Senior High / International School
                      </option>
                      <option value="College / University">
                        College / University / Tertiary Institution
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Full name of contact person"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Leadership Role
                    </label>
                    <select
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Proprietor / School Owner">Proprietor / School Owner</option>
                      <option value="Institute Director / Registrar">Institute Director / Registrar</option>
                      <option value="Headteacher / Principal">Headteacher / Principal</option>
                      <option value="University / College Administrator">University / College Administrator</option>
                      <option value="Training Centre Manager">Training Centre Manager</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@institution.edu.gh"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +233 24 000 0000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Estimated Student / Candidate Population
                    </label>
                    <select
                      value={learnerCount}
                      onChange={(e) => setLearnerCount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Under 100 Learners">Under 100 Learners</option>
                      <option value="100 – 500 Students / Candidates">100 – 500 Students / Candidates</option>
                      <option value="500 – 1,500 Students / Candidates">500 – 1,500 Students / Candidates</option>
                      <option value="1,500+ Multi-Campus / National Cohort">1,500+ Multi-Campus / National Cohort</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Primary Enquiry Type
                    </label>
                    <select
                      value={enquiryType}
                      onChange={(e) => setEnquiryType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Institutional Registration & Onboarding">
                        Institutional Registration &amp; Onboarding
                      </option>
                      <option value="Live Product Demonstration">Live Product Demonstration</option>
                      <option value="Subscription Package & Pricing Quote">
                        Subscription Package &amp; Pricing Quote
                      </option>
                      <option value="Digital Certificate & Verification Setup">
                        Digital Certificate &amp; Verification Setup
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Institutional Requirements or Questions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Share your programmes, academic levels, or specific operational goals..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                    {formError}
                  </div>
                )}

                <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold text-xs shadow-lg transition cursor-pointer whitespace-nowrap"
                  >
                    <span>Submit Institutional Enquiry</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>

                  <span className="text-[11px] text-sky-200/70">
                    Protected under Ghana Data Protection Act, 2012 (Act 843)
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          QUIET EDITORIAL FOOTER
         ===================================================================== */}
      <footer className="bg-[#050b1a] border-t border-indigo-500/25 px-4 sm:px-8 py-10 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="text-sm font-bold bg-gradient-to-r from-amber-300 via-emerald-300 to-sky-300 bg-clip-text text-transparent">
              EduDigital SIS · One Platform. Every Institution. Complete Management.
            </div>
            <p className="text-slate-300">
              Simplifying Education. Empowering Institutions. Verifying Excellence.
            </p>
            <p className="text-[11px] text-sky-200/75 tabular-nums">
              Direct WhatsApp Enquiries: {formattedOwnerWhatsApp} · Multi-Tenant Institutional Cloud
            </p>
          </div>

          {!embeddedInDashboard && (
            <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-slate-300">
              <a href="#capabilities" className="hover:text-white transition whitespace-nowrap">
                Capabilities
              </a>
              <a href="#institutes" className="hover:text-white transition whitespace-nowrap">
                Professional Institutes
              </a>
              <button
                type="button"
                onClick={() => {
                  setVerifySerialQuery('');
                  setSubView('verify');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition cursor-pointer whitespace-nowrap"
              >
                Verify Certificate
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubView('journals');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition cursor-pointer whitespace-nowrap"
              >
                Research Journals
              </button>
              <button
                type="button"
                onClick={() => handleOpenPortalAction('owner')}
                className="text-slate-300 hover:text-emerald-300 font-semibold transition cursor-pointer whitespace-nowrap"
              >
                Platform Owner Sign-In
              </button>
              <button
                type="button"
                onClick={() => handleOpenPortalAction('staff')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold transition cursor-pointer whitespace-nowrap"
              >
                {isAuthenticated && schools.length > 0 ? 'Return to Dashboard' : 'Portal Sign-In'}
              </button>
            </div>
          )}
        </div>
      </footer>

      {isPlatformAdmin && (
        <RegisterSchoolModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
        />
      )}

      {isPlatformAdmin && (
        <ImageUploadModal
          isOpen={showOwnerPhotoModal}
          onClose={() => setShowOwnerPhotoModal(false)}
          targetType="platform_owner"
          currentImage={effectiveOwnerPhotoSrc}
          title="Update Platform Owner & Developer Portrait"
          subtitle="Upload, crop, resize, or replace the official passport photograph displayed on the public website"
          entityName={platformOwnerProfile.name}
          entityRoleOrCode={platformOwnerProfile.roleTitle}
          onSave={(newPhotoUrl) => {
            setOwnerPhotoFallback(false);
            updatePlatformOwnerProfile({ photoUrl: newPhotoUrl });
            setShowOwnerPhotoModal(false);
          }}
        />
      )}

      {isPlatformAdmin && showOwnerBioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                Edit Platform Owner &amp; Developer Website Profile
              </h3>
              <button
                type="button"
                onClick={() => setShowOwnerBioModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updatePlatformOwnerProfile({
                  name: ownerDraftName.trim() || platformOwnerProfile.name,
                  roleTitle: ownerDraftRole.trim() || platformOwnerProfile.roleTitle,
                  subtitle: ownerDraftSubtitle.trim() || platformOwnerProfile.subtitle,
                  bio: ownerDraftBio.trim() || platformOwnerProfile.bio,
                  whatsappNumber: ownerDraftWhatsApp.trim() || '+233 207 615 941',
                });
                setShowOwnerBioModal(false);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={ownerDraftName}
                    onChange={(e) => setOwnerDraftName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Role / Title *</label>
                  <input
                    type="text"
                    required
                    value={ownerDraftRole}
                    onChange={(e) => setOwnerDraftRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Vision Subtitle *</label>
                <input
                  type="text"
                  required
                  value={ownerDraftSubtitle}
                  onChange={(e) => setOwnerDraftSubtitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Professional Introduction *
                </label>
                <textarea
                  rows={4}
                  required
                  value={ownerDraftBio}
                  onChange={(e) => setOwnerDraftBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Direct WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={ownerDraftWhatsApp}
                  onChange={(e) => setOwnerDraftWhatsApp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOwnerBioModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer whitespace-nowrap"
                >
                  Save Owner Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
