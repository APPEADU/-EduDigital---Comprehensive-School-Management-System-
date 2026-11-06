import {
  ClassRoom,
  EducationalSection,
  GradeClassDefinition,
  InstitutionClassificationType,
  isInstituteLevelType,
} from '../types';

export const STANDARD_STREAM_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

export const SHS_STANDARD_PROGRAMMES = [
  'General Arts',
  'General Science',
  'Business',
  'Home Economics',
  'Visual Arts',
  'Technical',
] as const;

export interface SchoolLevelPreset {
  id: string;
  label: string;
  description: string;
  sectionIds: string[];
  gradeCodes?: string[];
}

export const GHANA_EDUCATIONAL_PRESETS: SchoolLevelPreset[] = [
  {
    id: 'creche-basic6',
    label: 'Creche – Basic 6 (Pre-School & Primary)',
    description: 'Pre-School, Lower Primary, and Upper Primary only (no JHS or SHS)',
    sectionIds: ['sec-preschool', 'sec-lower-primary', 'sec-upper-primary'],
  },
  {
    id: 'kg-basic6',
    label: 'KG 1 – Basic 6 Only',
    description: 'Kindergarten 1 & 2 plus Basic 1 through Basic 6 (no Creche, JHS, or SHS)',
    sectionIds: ['sec-preschool', 'sec-lower-primary', 'sec-upper-primary'],
    gradeCodes: ['KG1', 'KG2', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6'],
  },
  {
    id: 'creche-jhs3',
    label: 'Creche – JHS 3 (Full Basic Education)',
    description: 'Pre-School, Lower Primary, Upper Primary, and Junior High School (Creche to Basic 9 / JHS 3)',
    sectionIds: ['sec-preschool', 'sec-lower-primary', 'sec-upper-primary', 'sec-jhs'],
  },
  {
    id: 'primary-jhs',
    label: 'Basic 1 – JHS 3 (Primary & JHS)',
    description: 'Lower Primary, Upper Primary, and Junior High School (Basic 1 to Basic 9 / JHS 3)',
    sectionIds: ['sec-lower-primary', 'sec-upper-primary', 'sec-jhs'],
  },
  {
    id: 'jhs-only',
    label: 'Junior High School Only (Basic 7–9 / JHS 1–3)',
    description: 'Dedicated Junior High School (Basic 7 / JHS 1 to Basic 9 / JHS 3)',
    sectionIds: ['sec-jhs'],
  },
  {
    id: 'shs-only',
    label: 'Senior High School Only (SHS 1–3)',
    description: 'Senior High School organised by GES/WAEC programmes and streams',
    sectionIds: ['sec-shs'],
  },
  {
    id: 'full-creche-shs3',
    label: 'Full K-12 (Creche – SHS 3)',
    description: 'All five Ghanaian educational sections from Creche through SHS 3',
    sectionIds: ['sec-preschool', 'sec-lower-primary', 'sec-upper-primary', 'sec-jhs', 'sec-shs'],
  },
];

export function getCanonicalSectionsForLevelType(
  levelType?: InstitutionClassificationType
): EducationalSection[] {
  if (isInstituteLevelType(levelType)) {
    return [
      {
        id: 'sec-institute-foundation',
        code: 'FOUNDATION',
        name: 'Foundation & Certificate Section',
        shortName: 'Foundation',
        order: 1,
        active: true,
        description: 'Level 1 Foundation and Standalone Certificate cohorts',
      },
      {
        id: 'sec-institute-professional',
        code: 'PROFESSIONAL',
        name: 'Intermediate & Final Qualification Section',
        shortName: 'Professional',
        order: 2,
        active: true,
        isShs: true,
        description: 'Level 2 Intermediate and Level 3 Final Chartered cohorts',
      },
    ];
  }

  const isShsOnly = levelType === 'SHS';
  const isBasicJhs = levelType === 'Basic & JHS';
  // For 'Combined' or unspecified, enable all 5 sections by default; schools can toggle any section on/off at will.
  return [
    {
      id: 'sec-preschool',
      code: 'PRE_SCHOOL',
      name: 'Pre-School',
      shortName: 'Pre-School',
      order: 1,
      active: !isShsOnly,
      description: 'Creche, KG 1, KG 2',
    },
    {
      id: 'sec-lower-primary',
      code: 'LOWER_PRIMARY',
      name: 'Lower Primary',
      shortName: 'Lower Primary',
      order: 2,
      active: !isShsOnly,
      description: 'Basic 1, Basic 2, Basic 3',
    },
    {
      id: 'sec-upper-primary',
      code: 'UPPER_PRIMARY',
      name: 'Upper Primary',
      shortName: 'Upper Primary',
      order: 3,
      active: !isShsOnly,
      description: 'Basic 4, Basic 5, Basic 6',
    },
    {
      id: 'sec-jhs',
      code: 'JHS',
      name: 'Junior High School (JHS)',
      shortName: 'JHS',
      order: 4,
      active: !isShsOnly,
      description: 'Basic 7 / JHS 1, Basic 8 / JHS 2, Basic 9 / JHS 3',
    },
    {
      id: 'sec-shs',
      code: 'SHS',
      name: 'Senior High School (SHS)',
      shortName: 'SHS',
      order: 5,
      active: !isBasicJhs,
      isShs: true,
      description: 'SHS 1, SHS 2, SHS 3 (Programme & Stream Track)',
    },
  ];
}

export function getCanonicalGradeClassesForLevelType(
  levelType?: InstitutionClassificationType,
  sections?: EducationalSection[]
): GradeClassDefinition[] {
  if (isInstituteLevelType(levelType)) {
    return [
      {
        id: 'grd-inst-cert',
        sectionId: 'sec-institute-foundation',
        canonicalCode: 'CERT',
        name: 'Certificate Programme Cohort',
        order: 1,
        formNumber: 4,
        levelCategory: 'SHS',
        nextGradeId: 'grd-inst-l1',
        active: true,
      },
      {
        id: 'grd-inst-l1',
        sectionId: 'sec-institute-foundation',
        canonicalCode: 'LEVEL1',
        name: 'Level 1 (Foundation)',
        order: 2,
        formNumber: 1,
        levelCategory: 'SHS',
        nextGradeId: 'grd-inst-l2',
        active: true,
      },
      {
        id: 'grd-inst-l2',
        sectionId: 'sec-institute-professional',
        canonicalCode: 'LEVEL2',
        name: 'Level 2 (Intermediate)',
        order: 3,
        formNumber: 2,
        levelCategory: 'SHS',
        nextGradeId: 'grd-inst-l3',
        active: true,
        isShs: true,
      },
      {
        id: 'grd-inst-l3',
        sectionId: 'sec-institute-professional',
        canonicalCode: 'LEVEL3',
        name: 'Level 3 (Advanced / Final)',
        order: 4,
        formNumber: 3,
        levelCategory: 'SHS',
        active: true,
        isShs: true,
      },
    ];
  }

  const effectiveSections = sections || getCanonicalSectionsForLevelType(levelType);
  const isSectionActive = (secId: string) =>
    effectiveSections.find((s) => s.id === secId)?.active ?? true;

  const rawGrades: GradeClassDefinition[] = [
    // Pre-School
    {
      id: 'grd-creche',
      sectionId: 'sec-preschool',
      canonicalCode: 'CRECHE',
      name: 'Creche',
      order: 1,
      formNumber: 0,
      levelCategory: 'Basic',
      nextGradeId: 'grd-kg1',
      active: isSectionActive('sec-preschool'),
    },
    {
      id: 'grd-kg1',
      sectionId: 'sec-preschool',
      canonicalCode: 'KG1',
      name: 'KG 1',
      order: 2,
      formNumber: 1,
      levelCategory: 'Basic',
      nextGradeId: 'grd-kg2',
      active: isSectionActive('sec-preschool'),
    },
    {
      id: 'grd-kg2',
      sectionId: 'sec-preschool',
      canonicalCode: 'KG2',
      name: 'KG 2',
      order: 3,
      formNumber: 2,
      levelCategory: 'Basic',
      nextGradeId: 'grd-b1',
      active: isSectionActive('sec-preschool'),
    },
    // Lower Primary
    {
      id: 'grd-b1',
      sectionId: 'sec-lower-primary',
      canonicalCode: 'B1',
      name: 'Basic 1',
      order: 4,
      formNumber: 1,
      levelCategory: 'Basic',
      nextGradeId: 'grd-b2',
      active: isSectionActive('sec-lower-primary'),
    },
    {
      id: 'grd-b2',
      sectionId: 'sec-lower-primary',
      canonicalCode: 'B2',
      name: 'Basic 2',
      order: 5,
      formNumber: 2,
      levelCategory: 'Basic',
      nextGradeId: 'grd-b3',
      active: isSectionActive('sec-lower-primary'),
    },
    {
      id: 'grd-b3',
      sectionId: 'sec-lower-primary',
      canonicalCode: 'B3',
      name: 'Basic 3',
      order: 6,
      formNumber: 3,
      levelCategory: 'Basic',
      nextGradeId: 'grd-b4',
      active: isSectionActive('sec-lower-primary'),
    },
    // Upper Primary
    {
      id: 'grd-b4',
      sectionId: 'sec-upper-primary',
      canonicalCode: 'B4',
      name: 'Basic 4',
      order: 7,
      formNumber: 4,
      levelCategory: 'Basic',
      nextGradeId: 'grd-b5',
      active: isSectionActive('sec-upper-primary'),
    },
    {
      id: 'grd-b5',
      sectionId: 'sec-upper-primary',
      canonicalCode: 'B5',
      name: 'Basic 5',
      order: 8,
      formNumber: 5,
      levelCategory: 'Basic',
      nextGradeId: 'grd-b6',
      active: isSectionActive('sec-upper-primary'),
    },
    {
      id: 'grd-b6',
      sectionId: 'sec-upper-primary',
      canonicalCode: 'B6',
      name: 'Basic 6',
      order: 9,
      formNumber: 6,
      levelCategory: 'Basic',
      nextGradeId: 'grd-b7',
      active: isSectionActive('sec-upper-primary'),
    },
    // Junior High School (JHS)
    {
      id: 'grd-b7',
      sectionId: 'sec-jhs',
      canonicalCode: 'B7_JHS1',
      name: 'Basic 7 / JHS 1',
      order: 10,
      formNumber: 1,
      levelCategory: 'JHS',
      nextGradeId: 'grd-b8',
      active: isSectionActive('sec-jhs'),
    },
    {
      id: 'grd-b8',
      sectionId: 'sec-jhs',
      canonicalCode: 'B8_JHS2',
      name: 'Basic 8 / JHS 2',
      order: 11,
      formNumber: 2,
      levelCategory: 'JHS',
      nextGradeId: 'grd-b9',
      active: isSectionActive('sec-jhs'),
    },
    {
      id: 'grd-b9',
      sectionId: 'sec-jhs',
      canonicalCode: 'B9_JHS3',
      name: 'Basic 9 / JHS 3',
      order: 12,
      formNumber: 3,
      levelCategory: 'JHS',
      nextGradeId: 'grd-shs1',
      active: isSectionActive('sec-jhs'),
    },
    // Senior High School (SHS)
    {
      id: 'grd-shs1',
      sectionId: 'sec-shs',
      canonicalCode: 'SHS1',
      name: 'SHS 1',
      order: 13,
      formNumber: 1,
      levelCategory: 'SHS',
      nextGradeId: 'grd-shs2',
      active: isSectionActive('sec-shs'),
      isShs: true,
    },
    {
      id: 'grd-shs2',
      sectionId: 'sec-shs',
      canonicalCode: 'SHS2',
      name: 'SHS 2',
      order: 14,
      formNumber: 2,
      levelCategory: 'SHS',
      nextGradeId: 'grd-shs3',
      active: isSectionActive('sec-shs'),
      isShs: true,
    },
    {
      id: 'grd-shs3',
      sectionId: 'sec-shs',
      canonicalCode: 'SHS3',
      name: 'SHS 3',
      order: 15,
      formNumber: 3,
      levelCategory: 'SHS',
      active: isSectionActive('sec-shs'),
      isShs: true,
    },
  ];

  return rawGrades;
}

/**
 * Formats official Ghanaian class + stream display name:
 * - Basic 1 + A => "Basic 1 A"
 * - Basic 7 / JHS 1 + A => "Basic 7 A / JHS 1 A"
 * - SHS 1 + General Science + A => "SHS 1 General Science A" (or "SHS 1 Science A" if programme is "Science")
 */
export function formatClassStreamDisplayName(
  grade: Pick<GradeClassDefinition, 'name' | 'canonicalCode' | 'isShs'>,
  streamDivision: string,
  programme?: string
): { displayName: string; streamLabel: string } {
  const cleanDiv = streamDivision.trim();
  const cleanProg = (programme || '').trim();

  if (grade.isShs && cleanProg) {
    const streamLabel = cleanDiv ? `${cleanProg} ${cleanDiv}` : cleanProg;
    return {
      displayName: `${grade.name} ${streamLabel}`.replace(/\s+/g, ' ').trim(),
      streamLabel,
    };
  }

  // Handle dual-named JHS classes e.g. "Basic 7 / JHS 1" + "A" => "Basic 7 A / JHS 1 A"
  if (grade.name.includes('/') && cleanDiv && cleanDiv.length <= 12) {
    const parts = grade.name.split('/').map((p) => p.trim());
    if (parts.length === 2) {
      return {
        displayName: `${parts[0]} ${cleanDiv} / ${parts[1]} ${cleanDiv}`,
        streamLabel: cleanDiv,
      };
    }
  }

  return {
    displayName: cleanDiv ? `${grade.name} ${cleanDiv}` : grade.name,
    streamLabel: cleanDiv || 'A',
  };
}

/**
 * Infers the best matching GradeClassDefinition & EducationalSection for an existing legacy ClassRoom
 * so existing schools and student placements link seamlessly without losing data.
 */
export function inferGradeForLegacyClassRoom(
  cls: ClassRoom,
  grades: GradeClassDefinition[],
  sections: EducationalSection[]
): ClassRoom {
  if (cls.gradeId && cls.sectionId) {
    const matchedGrade = grades.find((g) => g.id === cls.gradeId);
    const matchedSec = sections.find((s) => s.id === cls.sectionId);
    return {
      ...cls,
      gradeName: cls.gradeName || matchedGrade?.name,
      sectionName: cls.sectionName || matchedSec?.name,
      active: cls.active ?? true,
      subjectTeachers: cls.subjectTeachers || {},
    };
  }

  const lower = cls.name.toLowerCase();
  let matchedGrade: GradeClassDefinition | undefined;

  if (lower.includes('creche') || lower.includes('crèche') || lower.includes('nursery')) {
    matchedGrade = grades.find((g) => g.canonicalCode === 'CRECHE');
  } else if (lower.includes('kg 1') || lower.includes('kg1') || lower.includes('kindergarten 1')) {
    matchedGrade = grades.find((g) => g.canonicalCode === 'KG1');
  } else if (lower.includes('kg 2') || lower.includes('kg2') || lower.includes('kindergarten 2')) {
    matchedGrade = grades.find((g) => g.canonicalCode === 'KG2');
  } else if (lower.includes('basic 7') || lower.includes('jhs 1') || (cls.level === 'JHS' && cls.form === 1)) {
    matchedGrade = grades.find((g) => g.canonicalCode === 'B7_JHS1');
  } else if (lower.includes('basic 8') || lower.includes('jhs 2') || (cls.level === 'JHS' && cls.form === 2)) {
    matchedGrade = grades.find((g) => g.canonicalCode === 'B8_JHS2');
  } else if (lower.includes('basic 9') || lower.includes('jhs 3') || (cls.level === 'JHS' && cls.form === 3)) {
    matchedGrade = grades.find((g) => g.canonicalCode === 'B9_JHS3');
  } else if (lower.includes('shs 1') || (cls.level === 'SHS' && cls.form === 1)) {
    matchedGrade = grades.find((g) => g.canonicalCode === 'SHS1' || g.canonicalCode === 'LEVEL1');
  } else if (lower.includes('shs 2') || (cls.level === 'SHS' && cls.form === 2)) {
    matchedGrade = grades.find((g) => g.canonicalCode === 'SHS2' || g.canonicalCode === 'LEVEL2');
  } else if (lower.includes('shs 3') || (cls.level === 'SHS' && cls.form === 3)) {
    matchedGrade = grades.find((g) => g.canonicalCode === 'SHS3' || g.canonicalCode === 'LEVEL3');
  } else if (lower.includes('certificate') && grades.some((g) => g.canonicalCode === 'CERT')) {
    matchedGrade = grades.find((g) => g.canonicalCode === 'CERT');
  } else if (cls.level === 'Basic') {
    const f = Math.min(6, Math.max(1, cls.form || 1));
    matchedGrade = grades.find((g) => g.canonicalCode === `B${f}`);
  } else {
    for (let i = 1; i <= 6; i++) {
      if (lower.includes(`basic ${i}`) || lower.includes(`primary ${i}`) || lower.includes(`class ${i}`)) {
        matchedGrade = grades.find((g) => g.canonicalCode === `B${i}`);
        break;
      }
    }
  }

  if (!matchedGrade) {
    matchedGrade = grades[0];
  }

  const matchedSec = matchedGrade
    ? sections.find((s) => s.id === matchedGrade!.sectionId)
    : sections[0];

  // Infer SHS programme if not explicitly set
  let inferredProgramme = cls.programme;
  if (!inferredProgramme && matchedGrade?.isShs) {
    for (const p of SHS_STANDARD_PROGRAMMES) {
      if (lower.includes(p.toLowerCase())) {
        inferredProgramme = p;
        break;
      }
    }
    if (!inferredProgramme) {
      if (lower.includes('science')) inferredProgramme = 'General Science';
      else if (lower.includes('arts') && !lower.includes('visual')) inferredProgramme = 'General Arts';
      else if (lower.includes('business')) inferredProgramme = 'Business';
      else if (lower.includes('home econ')) inferredProgramme = 'Home Economics';
      else if (lower.includes('visual')) inferredProgramme = 'Visual Arts';
      else if (lower.includes('tech')) inferredProgramme = 'Technical';
    }
  }

  return {
    ...cls,
    sectionId: matchedSec?.id,
    sectionName: matchedSec?.name,
    gradeId: matchedGrade?.id,
    gradeName: matchedGrade?.name,
    programme: inferredProgramme,
    active: cls.active ?? true,
    subjectTeachers: cls.subjectTeachers || {},
  };
}

/**
 * Generates clean starter ClassRoom streams for newly registered or preset-initialized schools
 * based on active gradeClasses.
 */
export function buildDefaultStreamsForActiveGrades(
  schoolId: string,
  sections: EducationalSection[],
  grades: GradeClassDefinition[],
  defaultTeacherId: string,
  defaultTeacherName?: string
): ClassRoom[] {
  const activeSecIds = new Set(sections.filter((s) => s.active).map((s) => s.id));
  const activeGrades = grades
    .filter((g) => g.active && activeSecIds.has(g.sectionId))
    .sort((a, b) => a.order - b.order);

  const created: ClassRoom[] = [];
  activeGrades.forEach((grade, idx) => {
    const sec = sections.find((s) => s.id === grade.sectionId);
    if (grade.canonicalCode === 'CERT' || grade.canonicalCode.startsWith('LEVEL')) {
      created.push({
        id: `cls-${schoolId}-${grade.canonicalCode.toLowerCase()}-a`,
        name: `${grade.name} — Stream A`,
        sectionId: sec?.id,
        sectionName: sec?.name,
        gradeId: grade.id,
        gradeName: grade.name,
        level: grade.levelCategory,
        form: grade.formNumber,
        stream: 'A',
        streamLetter: 'A',
        formTutorTeacherId: defaultTeacherId,
        classTeacherName: defaultTeacherName,
        subjectTeachers: {},
        roomNumber: `Hall ${idx + 1}A`,
        capacity: 50,
        active: true,
      });
      return;
    }

    if (grade.isShs) {
      const shsDefaults: Array<{ prog: string; letter: string; room: string }> = [
        { prog: 'General Science', letter: 'A', room: `SHS ${grade.formNumber} - Sci A` },
        { prog: 'General Arts', letter: 'A', room: `SHS ${grade.formNumber} - Arts A` },
        { prog: 'Business', letter: 'A', room: `SHS ${grade.formNumber} - Bus A` },
      ];
      shsDefaults.forEach((item) => {
        const formatted = formatClassStreamDisplayName(grade, item.letter, item.prog);
        const slug = item.prog.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        created.push({
          id: `cls-${schoolId}-${grade.id}-${slug}-${item.letter.toLowerCase()}`,
          name: formatted.displayName,
          sectionId: sec?.id,
          sectionName: sec?.name,
          gradeId: grade.id,
          gradeName: grade.name,
          level: 'SHS',
          form: grade.formNumber,
          stream: formatted.streamLabel,
          streamLetter: item.letter,
          programme: item.prog,
          formTutorTeacherId: defaultTeacherId,
          classTeacherName: defaultTeacherName,
          subjectTeachers: {},
          roomNumber: item.room,
          capacity: 45,
          active: true,
        });
      });
    } else {
      ['A', 'B'].forEach((letter, sIdx) => {
        const formatted = formatClassStreamDisplayName(grade, letter);
        created.push({
          id: `cls-${schoolId}-${grade.id}-${letter.toLowerCase()}`,
          name: formatted.displayName,
          sectionId: sec?.id,
          sectionName: sec?.name,
          gradeId: grade.id,
          gradeName: grade.name,
          level: grade.levelCategory,
          form: grade.formNumber,
          stream: formatted.streamLabel,
          streamLetter: letter,
          formTutorTeacherId: defaultTeacherId,
          classTeacherName: defaultTeacherName,
          subjectTeachers: {},
          roomNumber: `Rm ${grade.canonicalCode}-${sIdx + 1}`,
          capacity: grade.sectionId === 'sec-preschool' ? 30 : 40,
          active: true,
        });
      });
    }
  });

  return created;
}

export function ensureStreamsForActiveGrades(
  schoolId: string,
  sections: EducationalSection[],
  grades: GradeClassDefinition[],
  existingClasses: ClassRoom[],
  defaultTeacherId: string,
  defaultTeacherName?: string
): ClassRoom[] {
  const normalizedExisting = existingClasses.map((cls) =>
    inferGradeForLegacyClassRoom(cls, grades, sections)
  );

  const activeSecIds = new Set(sections.filter((s) => s.active).map((s) => s.id));
  const missingGrades = grades.filter((g) => {
    if (!g.active) return false;
    const hasActiveStream = normalizedExisting.some(
      (c) => (c.gradeId === g.id || c.name.toLowerCase().includes(g.name.toLowerCase())) && c.active !== false
    );
    return !hasActiveStream;
  });

  if (missingGrades.length === 0) {
    return normalizedExisting;
  }

  const reactivatedGradeIds = new Set<string>();
  const existingIds = new Set(normalizedExisting.map((c) => c.id));
  const existingNamesByGrade = new Set(
    normalizedExisting.map((c) => `${c.gradeId || ''}::${c.name.trim().toLowerCase()}`)
  );

  const updatedExisting = normalizedExisting.map((cls) => {
    if (cls.gradeId && missingGrades.some((mg) => mg.id === cls.gradeId) && cls.active === false) {
      reactivatedGradeIds.add(cls.gradeId);
      return { ...cls, active: true };
    }
    return cls;
  });

  const stillMissingGrades = missingGrades.filter((mg) => !reactivatedGradeIds.has(mg.id));
  if (stillMissingGrades.length === 0) {
    return updatedExisting;
  }

  const generated = buildDefaultStreamsForActiveGrades(
    schoolId,
    sections,
    stillMissingGrades,
    defaultTeacherId,
    defaultTeacherName
  )
    .map((gen, idx) => {
      let finalId = gen.id;
      if (existingIds.has(finalId)) {
        finalId = `${gen.id}-${Date.now()}-${idx}`;
      }
      existingIds.add(finalId);
      return { ...gen, id: finalId };
    })
    .filter((gen) => {
      const key = `${gen.gradeId || ''}::${gen.name.trim().toLowerCase()}`;
      if (existingNamesByGrade.has(key)) return false;
      existingNamesByGrade.add(key);
      return true;
    });

  return [...updatedExisting, ...generated];
}

export function computeNextAcademicYear(currentAcademicYear: string): string {
  const match = currentAcademicYear.match(/(\d{4})\s*[/\-]\s*(\d{4})/);
  if (match) {
    const startYear = parseInt(match[1], 10);
    const endYear = parseInt(match[2], 10);
    return `${startYear + 1}/${endYear + 1}`;
  }
  const singleYear = currentAcademicYear.match(/(\d{4})/);
  if (singleYear) {
    const y = parseInt(singleYear[1], 10);
    return `${y + 1}/${y + 2}`;
  }
  return '2026/2027';
}
