// Grading & Calculation Utilities for Ghanaian Educational Institutions

export interface GradeInfo {
  grade: 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'E8' | 'F9';
  numericValue: number;
  interpretation: string;
  badgeColor: string;
}

export function calculateWassceGrade(score: number): GradeInfo {
  const rounded = Math.round(score);
  if (rounded >= 75) {
    return { grade: 'A1', numericValue: 1, interpretation: 'Excellent', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  } else if (rounded >= 70) {
    return { grade: 'B2', numericValue: 2, interpretation: 'Very Good', badgeColor: 'bg-teal-100 text-teal-800 border-teal-300' };
  } else if (rounded >= 65) {
    return { grade: 'B3', numericValue: 3, interpretation: 'Good', badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
  } else if (rounded >= 60) {
    return { grade: 'C4', numericValue: 4, interpretation: 'Credit', badgeColor: 'bg-blue-100 text-blue-800 border-blue-300' };
  } else if (rounded >= 55) {
    return { grade: 'C5', numericValue: 5, interpretation: 'Credit', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
  } else if (rounded >= 50) {
    return { grade: 'C6', numericValue: 6, interpretation: 'Credit', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300' };
  } else if (rounded >= 45) {
    return { grade: 'D7', numericValue: 7, interpretation: 'Pass', badgeColor: 'bg-orange-100 text-orange-800 border-orange-300' };
  } else if (rounded >= 40) {
    return { grade: 'E8', numericValue: 8, interpretation: 'Weak Pass', badgeColor: 'bg-rose-100 text-rose-800 border-rose-300' };
  } else {
    return { grade: 'F9', numericValue: 9, interpretation: 'Fail', badgeColor: 'bg-red-100 text-red-800 border-red-300' };
  }
}

export function formatOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatGHS(amount: number): string {
  return `GH₵ ${Number(amount).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ============================================================================
// GES / WAEC BECE STANINE GRADING & BEST 6 AGGREGATE CALCULATOR
// ============================================================================

export interface BeceGradeInfo {
  grade: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  interpretation: string;
  toneClass: string;
}

export function calculateBeceGrade(score: number): BeceGradeInfo {
  const rounded = Math.round(Math.max(0, Math.min(100, score)));
  if (rounded >= 80) {
    return { grade: 1, interpretation: 'Highest Distinction', toneClass: 'text-emerald-700' };
  } else if (rounded >= 70) {
    return { grade: 2, interpretation: 'Higher Distinction', toneClass: 'text-emerald-600' };
  } else if (rounded >= 60) {
    return { grade: 3, interpretation: 'High Credit', toneClass: 'text-teal-700' };
  } else if (rounded >= 55) {
    return { grade: 4, interpretation: 'High Average', toneClass: 'text-sky-700' };
  } else if (rounded >= 50) {
    return { grade: 5, interpretation: 'Average', toneClass: 'text-blue-700' };
  } else if (rounded >= 45) {
    return { grade: 6, interpretation: 'Low Average', toneClass: 'text-amber-700' };
  } else if (rounded >= 40) {
    return { grade: 7, interpretation: 'Low Pass', toneClass: 'text-orange-700' };
  } else if (rounded >= 35) {
    return { grade: 8, interpretation: 'Lower Pass', toneClass: 'text-rose-600' };
  } else {
    return { grade: 9, interpretation: 'Minimum / Fail', toneClass: 'text-red-700' };
  }
}

export interface BeceSubjectSummaryItem {
  subjectId: string;
  subjectName: string;
  isCoreBece: boolean;
  score: number;
  grade: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  interpretation: string;
}

export interface BeceAggregateBreakdown {
  aggregate: number; // Best 6 sum (6 to 54)
  averageScore: number;
  subjectsCount: number;
  isCompleteSix: boolean;
  coreSubjectsUsed: BeceSubjectSummaryItem[];
  bestElectivesUsed: BeceSubjectSummaryItem[];
  allSubjects: BeceSubjectSummaryItem[];
}

const CORE_BECE_SUBJECT_MATCHERS = [
  'english',
  'math',
  'integrated science',
  'science',
  'social studies',
];

export function isBeceCoreFourSubject(subjectName: string, category?: string): boolean {
  const lower = subjectName.toLowerCase();
  if (lower.includes('english')) return true;
  if (lower.includes('math') && !lower.includes('elective') && !lower.includes('additional')) return true;
  if (lower.includes('integrated science') || lower === 'science') return true;
  if (lower.includes('social studies')) return true;
  return category === 'Core' && CORE_BECE_SUBJECT_MATCHERS.some((k) => lower.includes(k));
}

export function calculateBeceAggregate(
  entries: { subjectId: string; subjectName: string; subjectCategory?: 'Core' | 'Elective'; totalScore: number }[]
): BeceAggregateBreakdown {
  if (!entries || entries.length === 0) {
    return {
      aggregate: 0,
      averageScore: 0,
      subjectsCount: 0,
      isCompleteSix: false,
      coreSubjectsUsed: [],
      bestElectivesUsed: [],
      allSubjects: [],
    };
  }

  const mapped: BeceSubjectSummaryItem[] = entries.map((item) => {
    const g = calculateBeceGrade(item.totalScore);
    return {
      subjectId: item.subjectId,
      subjectName: item.subjectName,
      isCoreBece: isBeceCoreFourSubject(item.subjectName, item.subjectCategory),
      score: Math.round(item.totalScore * 10) / 10,
      grade: g.grade,
      interpretation: g.interpretation,
    };
  });

  // Sort cores by best grade (lowest number, then highest score), take up to 4 distinct core areas
  const corePool = mapped
    .filter((m) => m.isCoreBece)
    .sort((a, b) => a.grade - b.grade || b.score - a.score);

  const coreUsed = corePool.slice(0, 4);
  const usedIds = new Set(coreUsed.map((c) => c.subjectId));

  const remainingSorted = mapped
    .filter((m) => !usedIds.has(m.subjectId))
    .sort((a, b) => a.grade - b.grade || b.score - a.score);

  const slotsNeeded = Math.max(0, 6 - coreUsed.length);
  const electivesUsed = remainingSorted.slice(0, slotsNeeded);

  const bestSix = [...coreUsed, ...electivesUsed];
  const aggregate = bestSix.reduce((acc, s) => acc + s.grade, 0);
  const totalMarks = mapped.reduce((acc, s) => acc + s.score, 0);
  const averageScore = Math.round((totalMarks / mapped.length) * 10) / 10;

  return {
    aggregate,
    averageScore,
    subjectsCount: mapped.length,
    isCompleteSix: bestSix.length >= 6 && coreUsed.length === 4,
    coreSubjectsUsed: coreUsed,
    bestElectivesUsed: electivesUsed,
    allSubjects: mapped,
  };
}

// Ghana Statutory Payroll Computation (SSNIT Act 766 & GRA Income Tax Act 2015 Act 896 as amended)
export interface PayrollBreakdown {
  basicSalary: number;
  allowances: number;
  grossSalary: number;
  ssnitEmployee: number; // 5.5% Tier 1 & 2
  ssnitEmployer: number; // 13.0% Tier 1
  taxableIncome: number;
  graPayeTax: number;
  totalDeductions: number;
  netSalary: number;
}

export function calculateGhanaPayroll(basicSalary: number, allowances: number = 0): PayrollBreakdown {
  const grossSalary = basicSalary + allowances;
  const ssnitEmployee = basicSalary * 0.055;
  const ssnitEmployer = basicSalary * 0.130;
  
  // Taxable income is Gross Salary minus Employee SSNIT
  const taxableIncome = Math.max(0, grossSalary - ssnitEmployee);

  // GRA PAYE Monthly Tax Bands
  let remaining = taxableIncome;
  let tax = 0;

  // Band 1: First GH₵ 490 @ 0%
  const b1 = Math.min(remaining, 490);
  tax += b1 * 0.0;
  remaining -= b1;

  // Band 2: Next GH₵ 110 @ 5%
  if (remaining > 0) {
    const b2 = Math.min(remaining, 110);
    tax += b2 * 0.05;
    remaining -= b2;
  }

  // Band 3: Next GH₵ 130 @ 10%
  if (remaining > 0) {
    const b3 = Math.min(remaining, 130);
    tax += b3 * 0.10;
    remaining -= b3;
  }

  // Band 4: Next GH₵ 3,166.67 @ 17.5%
  if (remaining > 0) {
    const b4 = Math.min(remaining, 3166.67);
    tax += b4 * 0.175;
    remaining -= b4;
  }

  // Band 5: Next GH₵ 16,000 @ 25%
  if (remaining > 0) {
    const b5 = Math.min(remaining, 16000);
    tax += b5 * 0.25;
    remaining -= b5;
  }

  // Band 6: Next GH₵ 30,520 @ 30%
  if (remaining > 0) {
    const b6 = Math.min(remaining, 30520);
    tax += b6 * 0.30;
    remaining -= b6;
  }

  // Band 7: Exceeding GH₵ 50,416.67 @ 35%
  if (remaining > 0) {
    tax += remaining * 0.35;
  }

  const graPayeTax = Math.round(tax * 100) / 100;
  const totalDeductions = Math.round((ssnitEmployee + graPayeTax) * 100) / 100;
  const netSalary = Math.round((grossSalary - totalDeductions) * 100) / 100;

  return {
    basicSalary,
    allowances,
    grossSalary,
    ssnitEmployee: Math.round(ssnitEmployee * 100) / 100,
    ssnitEmployer: Math.round(ssnitEmployer * 100) / 100,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    graPayeTax,
    totalDeductions,
    netSalary,
  };
}
