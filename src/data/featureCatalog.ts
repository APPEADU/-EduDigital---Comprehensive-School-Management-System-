import { CustomSchoolFeature, CustomFeatureRequest } from '../types';

export const FEATURE_CATALOG: CustomSchoolFeature[] = [
  {
    id: 'boarding_house',
    moduleId: 'boarding_house',
    name: 'Boarding House & Exeat Management',
    tagline: 'Dormitory rooming matrix, housemaster logs, and biometric exeat gatepass.',
    description: 'Complete boarding operations module designed for residential SHS institutions. Includes bed allocations, roll-call attendance, dining hall heads, exeat approval workflow with SMS authorization to guardians, and house competition cups.',
    category: 'Operations',
    icon: 'Building2',
    tier: 'Enterprise Add-On',
    targetAudience: 'Senior High & Residential Boarding Schools',
    typicalClients: 'PRESEC Legon, Achimota School, Mfantsipim',
    badge: 'SHS Boarding',
  },
  {
    id: 'transport_fleet',
    moduleId: 'transport_fleet',
    name: 'Fleet Logistics & Yellow Bus Tracking',
    tagline: 'Multi-route school bus dispatch, live pickup manifests, and fuel ledger.',
    description: 'Designed specifically for Day, Basic & JHS institutions running school bus shuttles. Provides live morning/afternoon pickup manifests, driver duty rosters, emergency SOS push to parents, and bus maintenance logs.',
    category: 'Operations',
    icon: 'Bus',
    tier: 'Enterprise Add-On',
    targetAudience: 'Day Schools & Basic/JHS Campuses with Shuttles',
    typicalClients: 'Morning Star School, SOS-HGIC, Galaxy Int.',
    badge: 'Fleet Ops',
  },
  {
    id: 'cambridge_curriculum',
    moduleId: 'cambridge_curriculum',
    name: 'Cambridge & IGCSE Dual-Stream Stream',
    tagline: 'Simultaneous WASSCE and Cambridge Primary / Checkpoint / IGCSE grading.',
    description: 'Allows international & dual-stream schools to configure simultaneous British Cambridge and Ghanaian GES/WAEC curricula. Features GPA calculation (4.0 scale), A* to G grading rubrics, and Cambridge Examination Board entry reports.',
    category: 'Academic',
    icon: 'GraduationCap',
    tier: 'Bespoke Custom',
    targetAudience: 'International, Bilingual & Dual-Accreditation Schools',
    typicalClients: 'Lincoln Community, SOS-HGIC, Roman Ridge',
    badge: 'Dual Stream',
  },
  {
    id: 'canteen_pos',
    moduleId: 'canteen_pos',
    name: 'Cashless Canteen & RFID Meal Card POS',
    tagline: 'Prepaid student meal wallets, dietary restriction flags, and cafeteria checkout.',
    description: 'Replaces cash handling in school dining halls and cafeterias. Parents load funds via Mobile Money (MTN/Telecel/AT); students tap NFC or barcode student ID cards at POS registers with instant balance calculation and allergy alerts.',
    category: 'Finance & Commerce',
    icon: 'UtensilsCrossed',
    tier: 'Enterprise Add-On',
    targetAudience: 'All Modern Day & Boarding Schools',
    typicalClients: 'Morning Star School, GIS, Tema International',
    badge: 'Cashless Campus',
  },
  {
    id: 'biometric_gate',
    moduleId: 'biometric_gate',
    name: 'Biometric Turnstiles & Visitor Security Pass',
    tagline: 'Live gate access clocking, parent pickup QR code validation, and perimeter logs.',
    description: 'Integrates with hardware turnstiles, optical barrier gates, and security tablets. Records timestamped student ingress/egress, prevents unauthorized pickups with guardian photo matching, and prints digital visitor badges.',
    category: 'Security & IoT',
    icon: 'ShieldCheck',
    tier: 'Bespoke Custom',
    targetAudience: 'High-Density Campuses & Urban Security Zones',
    typicalClients: 'PRESEC Legon, Morning Star, Achimota',
    badge: 'IoT Security',
  },
  {
    id: 'alumni_endowment',
    moduleId: 'alumni_endowment',
    name: 'Old Students & Alumni Endowment Hub',
    tagline: 'Year-group chapter registers, legacy project donations, and homecoming dues.',
    description: 'Dedicated portal for vibrant institutional alumni networks (e.g. Odadeɛ, Akoras, Mfanstipim MOBA). Tracks global chapters, recurring endowment fund pledges, capital projects (science labs, solar grids), and reunion dues.',
    category: 'Community & Alumni',
    icon: 'Landmark',
    tier: 'Enterprise Add-On',
    targetAudience: 'Established Institutions with Active Alumni Associations',
    typicalClients: 'PRESEC Odadeɛ, Achimota Akoras, Wey Gey Hey',
    badge: 'Endowments',
  },
  {
    id: 'ai_analytics',
    moduleId: 'ai_analytics',
    name: 'Gemini AI Diagnostic Exam & Syllabus Engine',
    tagline: 'Automated WAEC marking schemes, diagnostic question sets, and student remediation.',
    description: 'Harnesses server-side Gemini intelligence grounded in the GES and WAEC syllabi. Instantly generates multi-tier mock examination papers, step-by-step marking rubrics, and personalized diagnostic improvement reports.',
    category: 'Academic',
    icon: 'Sparkles',
    tier: 'Core Included',
    targetAudience: 'All Basic, JHS & SHS Academic Teams',
    typicalClients: 'All Partner Schools',
    badge: 'Gemini AI',
  },
  {
    id: 'professional_credentials',
    moduleId: 'professional_credentials',
    name: 'Professional Institution, Certificate Programme & Digital Credential Suite',
    tagline: 'Multi-level qualifications (Levels 1–3), digital signatures, QR certificates & employer verification.',
    description:
      'Enables schools, colleges, vocational centres, and professional institutes to manage multi-level certification programmes, candidate memberships, progression rules, digital teacher/admin signatures, printable PDF certificates with QR codes, alumni registers, and third-party employer verification.',
    category: 'Academic',
    icon: 'GraduationCap',
    tier: 'Core Included',
    targetAudience: 'Professional Institutes, Colleges, Vocational Centres & Secondary Schools',
    typicalClients: 'CITLFA, Kingdom Royal Institute, PRESEC, Polytechnics & Executive Centres',
    badge: 'QR Verified',
  },
];

export const getDefaultModulesForLevelType = (levelType: string): string[] => {
  if (
    [
      'Professional Institute',
      'Vocational Training Centre',
      'College / Polytechnic',
      'Executive Education',
    ].includes(levelType)
  ) {
    return ['professional_credentials', 'alumni_endowment', 'ai_analytics'];
  }
  if (levelType === 'Basic & JHS') {
    return ['transport_fleet', 'canteen_pos', 'biometric_gate', 'ai_analytics'];
  }
  // SHS or Combined Basic/SHS
  return ['boarding_house', 'transport_fleet', 'canteen_pos', 'ai_analytics'];
};

export const getDefaultModulesForSchool = (_schoolId: string): string[] => {
  return [
    'boarding_house',
    'transport_fleet',
    'canteen_pos',
    'ai_analytics',
  ];
};

export const INITIAL_CUSTOM_REQUESTS: CustomFeatureRequest[] = [];
