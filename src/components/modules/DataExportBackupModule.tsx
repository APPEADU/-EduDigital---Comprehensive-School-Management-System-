import React, { useMemo, useRef, useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { formatInstituteLevelShort, isInstituteLevelType } from '../../types';
import { calculateGhanaPayroll } from '../../utils/academicCalculations';
import {
  ExportColumn,
  SummaryMetricPair,
  buildSafeFilename,
  downloadComprehensiveExecutivePdf,
  downloadCsvReport,
  downloadPdfReport,
} from '../../utils/dataExporters';
import {
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Upload,
  Search,
  Eye,
  RefreshCw,
  CheckCircle,
  ArrowRight,
  HardDriveDownload,
  X,
} from 'lucide-react';

type ExportCategoryFilter = 'all' | 'student' | 'academic' | 'financial' | 'backup';

interface DatasetDefinition {
  id: string;
  slug: string;
  title: string;
  category: 'student' | 'academic' | 'financial';
  categoryLabel: string;
  description: string;
  sourceModuleId: string;
  sourceModuleLabel: string;
  columns: ExportColumn[];
  rows: Record<string, string | number>[];
  summaryMetrics: SummaryMetricPair[];
}

interface ExportLogEntry {
  id: string;
  datasetTitle: string;
  filename: string;
  format: 'CSV' | 'PDF' | 'JSON';
  rowCount: number;
  timestamp: string;
}

export const DataExportBackupModule: React.FC = () => {
  const {
    school,
    currentUser,
    students,
    candidates,
    admissions,
    attendance,
    classes,
    subjects,
    examResults,
    programmes,
    programmeCourses,
    candidateAssessments,
    issuedCredentials,
    feePayments,
    transactions,
    staff,
    isCloudSynced,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetToDemoData,
    setActiveModule,
  } = useSchool();

  const isInstitute = isInstituteLevelType(school.levelType);
  const currencyLabel = school.currency || 'GHS';

  const [categoryFilter, setCategoryFilter] = useState<ExportCategoryFilter>('all');
  const [termScope, setTermScope] = useState<'all' | 'current'>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(
    isInstitute ? 'institute-candidates' : 'student-registry'
  );
  const [exportLogs, setExportLogs] = useState<ExportLogEntry[]>([]);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Full JSON Backup & Restore state
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [confirmClearRecords, setConfirmClearRecords] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatMoney = (amount: number): string =>
    `${currencyLabel} ${Number(amount || 0).toLocaleString('en-GH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const matchesDateRange = (isoDate?: string): boolean => {
    if (!isoDate) return true;
    const clean = isoDate.slice(0, 10);
    if (dateFrom && clean < dateFrom) return false;
    if (dateTo && clean > dateTo) return false;
    return true;
  };

  const classMap = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [classes]);

  const subjectMap = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    subjects.forEach((s) => map.set(s.id, { code: s.code, name: s.name }));
    return map;
  }, [subjects]);

  const studentMap = useMemo(() => {
    const map = new Map<string, { number: string; fullName: string }>();
    students.forEach((s) =>
      map.set(s.id, {
        number: s.studentNumber,
        fullName: `${s.firstName} ${s.lastName}`.trim(),
      })
    );
    return map;
  }, [students]);

  const programmeMap = useMemo(() => {
    const map = new Map<string, { code: string; title: string }>();
    programmes.forEach((p) => map.set(p.id, { code: p.code, title: p.title }));
    return map;
  }, [programmes]);

  const courseMap = useMemo(() => {
    const map = new Map<string, { code: string; title: string }>();
    programmeCourses.forEach((c) => map.set(c.id, { code: c.code, title: c.title }));
    return map;
  }, [programmeCourses]);

  const candidateMap = useMemo(() => {
    const map = new Map<string, { number: string; fullName: string }>();
    candidates.forEach((c) =>
      map.set(c.id, {
        number: c.candidateNumber,
        fullName: `${c.firstName} ${c.lastName}`.trim(),
      })
    );
    return map;
  }, [candidates]);

  // Build all institutional datasets dynamically with date & term filters applied
  const datasets: DatasetDefinition[] = useMemo(() => {
    // 1. Student Registry
    const filteredStudents = students.filter((s) => matchesDateRange(s.admissionDate));
    const studentDataset: DatasetDefinition = {
      id: 'student-registry',
      slug: 'student_registry',
      title: 'Student Registry & Guardian Directory',
      category: 'student',
      categoryLabel: 'Student Records',
      description:
        'Enrolled student index numbers, demographics, class/stream placement, boarding status, and parent/guardian contacts.',
      sourceModuleId: 'students',
      sourceModuleLabel: 'Student Registry',
      columns: [
        { key: 'studentNumber', header: 'Student ID' },
        { key: 'fullName', header: 'Full Name' },
        { key: 'gender', header: 'Gender' },
        { key: 'dob', header: 'Date of Birth' },
        { key: 'className', header: 'Class / Form' },
        { key: 'boardingStatus', header: 'Residence' },
        { key: 'guardianName', header: 'Guardian Name' },
        { key: 'guardianPhone', header: 'Guardian Phone' },
        { key: 'admissionDate', header: 'Admission Date' },
        { key: 'status', header: 'Status' },
      ],
      rows: filteredStudents.map((s) => ({
        studentNumber: s.studentNumber,
        fullName: [s.firstName, s.otherNames, s.lastName].filter(Boolean).join(' '),
        gender: s.gender,
        dob: s.dob,
        className: classMap.get(s.classId) || s.programme || s.stream || 'Assigned',
        boardingStatus: s.boardingStatus,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        admissionDate: s.admissionDate,
        status: s.status,
      })),
      summaryMetrics: [
        { label: 'Total Students', value: String(filteredStudents.length) },
        {
          label: 'Active Students',
          value: String(filteredStudents.filter((s) => s.status === 'Active').length),
        },
        {
          label: 'Boarders / Day',
          value: `${filteredStudents.filter((s) => s.boardingStatus === 'Boarding').length} / ${
            filteredStudents.filter((s) => s.boardingStatus === 'Day').length
          }`,
        },
      ],
    };

    // 2. Institute Candidates & Level Progression
    const filteredCandidates = candidates.filter((c) => matchesDateRange(c.enrollmentDate));
    const totalCandBilled = filteredCandidates.reduce((sum, c) => sum + (c.totalFeesBilled || 0), 0);
    const totalCandPaid = filteredCandidates.reduce((sum, c) => sum + (c.totalFeesPaid || 0), 0);
    const candidateDataset: DatasetDefinition = {
      id: 'institute-candidates',
      slug: 'candidate_registry',
      title: 'Institute Candidates & Level Progression',
      category: 'student',
      categoryLabel: 'Student Records',
      description:
        'Professional & Certificate candidate IDs, programme tracks (Levels 1–3 & Certificate), identity verification, and tuition balances.',
      sourceModuleId: 'students',
      sourceModuleLabel: 'Candidate Registry',
      columns: [
        { key: 'candidateNumber', header: 'Candidate ID' },
        { key: 'fullName', header: 'Full Name' },
        { key: 'programme', header: 'Programme' },
        { key: 'currentLevel', header: 'Current Level' },
        { key: 'idVerified', header: 'ID Verified' },
        { key: 'feesBilled', header: 'Fees Billed', align: 'right' },
        { key: 'feesPaid', header: 'Fees Paid', align: 'right' },
        { key: 'balance', header: 'Balance', align: 'right' },
        { key: 'status', header: 'Status' },
      ],
      rows: filteredCandidates.map((c) => {
        const prog = programmeMap.get(c.programmeId);
        const balance = Math.max(0, (c.totalFeesBilled || 0) - (c.totalFeesPaid || 0));
        return {
          candidateNumber: c.candidateNumber,
          fullName: [c.firstName, c.otherNames, c.lastName].filter(Boolean).join(' '),
          programme: prog ? `${prog.code} - ${prog.title}` : c.programmeId,
          currentLevel: formatInstituteLevelShort(c.currentLevel),
          idVerified: c.identityVerified ? 'Verified' : 'Pending',
          feesBilled: formatMoney(c.totalFeesBilled || 0),
          feesPaid: formatMoney(c.totalFeesPaid || 0),
          balance: formatMoney(balance),
          status: c.status,
        };
      }),
      summaryMetrics: [
        { label: 'Total Candidates', value: String(filteredCandidates.length) },
        { label: 'Tuition Billed', value: formatMoney(totalCandBilled) },
        { label: 'Tuition Collected', value: formatMoney(totalCandPaid) },
        {
          label: 'Outstanding Arrears',
          value: formatMoney(Math.max(0, totalCandBilled - totalCandPaid)),
        },
      ],
    };

    // 3. Admissions & Intake Applications
    const filteredAdmissions = admissions.filter((a) => matchesDateRange(a.submittedDate));
    const admissionsDataset: DatasetDefinition = {
      id: 'admissions-pipeline',
      slug: 'admissions_applications',
      title: 'Admissions & Intake Applications',
      category: 'student',
      categoryLabel: 'Student Records',
      description:
        'Prospective student and candidate intake applications, entry scores, guardian/sponsor contacts, and placement decisions.',
      sourceModuleId: 'admissions',
      sourceModuleLabel: 'Admissions Pipeline',
      columns: [
        { key: 'applicationNumber', header: 'Application No.' },
        { key: 'applicantName', header: 'Applicant Name' },
        { key: 'gender', header: 'Gender' },
        { key: 'applyingForClass', header: 'Target Class / Track' },
        { key: 'previousSchool', header: 'Previous Institution' },
        { key: 'beceScore', header: 'Entry Score', align: 'right' },
        { key: 'parentName', header: 'Parent / Sponsor' },
        { key: 'parentPhone', header: 'Contact Phone' },
        { key: 'submittedDate', header: 'Submitted' },
        { key: 'status', header: 'Decision' },
      ],
      rows: filteredAdmissions.map((a) => ({
        applicationNumber: a.applicationNumber,
        applicantName: a.applicantName,
        gender: a.gender,
        applyingForClass: a.programme ? `${a.applyingForClass} (${a.programme})` : a.applyingForClass,
        previousSchool: a.previousSchool,
        beceScore: a.beceScore,
        parentName: a.parentName,
        parentPhone: a.parentPhone,
        submittedDate: a.submittedDate,
        status: a.status,
      })),
      summaryMetrics: [
        { label: 'Total Applications', value: String(filteredAdmissions.length) },
        {
          label: 'Approved / Enrolled',
          value: String(
            filteredAdmissions.filter((a) => a.status === 'Approved' || a.status === 'Enrolled').length
          ),
        },
        {
          label: 'Pending Review',
          value: String(filteredAdmissions.filter((a) => a.status === 'Pending').length),
        },
      ],
    };

    // 4. Student Attendance Register
    const filteredAttendance = attendance.filter((att) => matchesDateRange(att.date));
    const attendanceDataset: DatasetDefinition = {
      id: 'student-attendance',
      slug: 'attendance_register',
      title: 'Daily Student Attendance Register',
      category: 'student',
      categoryLabel: 'Student Records',
      description:
        'Chronological roll-call register with Present, Absent, Late, and Excused attendance records across classes.',
      sourceModuleId: 'attendance',
      sourceModuleLabel: 'Attendance Register',
      columns: [
        { key: 'date', header: 'Date' },
        { key: 'studentNumber', header: 'Student ID' },
        { key: 'studentName', header: 'Student Name' },
        { key: 'className', header: 'Class' },
        { key: 'status', header: 'Attendance Status' },
        { key: 'reason', header: 'Remarks / Reason' },
      ],
      rows: filteredAttendance.map((att) => {
        const stu = studentMap.get(att.studentId);
        return {
          date: att.date,
          studentNumber: stu?.number || att.studentId,
          studentName: stu?.fullName || 'Student Record',
          className: classMap.get(att.classId) || att.classId,
          status: att.status,
          reason: att.reason || '-',
        };
      }),
      summaryMetrics: [
        { label: 'Attendance Entries', value: String(filteredAttendance.length) },
        {
          label: 'Present Count',
          value: String(filteredAttendance.filter((a) => a.status === 'Present').length),
        },
        {
          label: 'Absent / Late',
          value: String(
            filteredAttendance.filter((a) => a.status === 'Absent' || a.status === 'Late').length
          ),
        },
      ],
    };

    // 5. Term Examinations & Report Card Grades
    const filteredExams = examResults.filter((r) =>
      termScope === 'current'
        ? r.term === school.currentTerm && r.academicYear === school.currentAcademicYear
        : true
    );
    const avgExamScore =
      filteredExams.length > 0
        ? (filteredExams.reduce((sum, r) => sum + r.totalScore, 0) / filteredExams.length).toFixed(1)
        : '0.0';
    const examResultsDataset: DatasetDefinition = {
      id: 'exam-results',
      slug: 'academic_exam_results',
      title: 'Term Examinations & WASSCE / BECE Grades',
      category: 'academic',
      categoryLabel: 'Academic Records',
      description:
        'Continuous assessment scores, examination marks, composite totals, WAEC letter/numeric grades, and publication states.',
      sourceModuleId: 'examinations',
      sourceModuleLabel: 'Examinations & Reports',
      columns: [
        { key: 'studentNumber', header: 'Student ID' },
        { key: 'studentName', header: 'Student Name' },
        { key: 'className', header: 'Class' },
        { key: 'subject', header: 'Subject' },
        { key: 'termCycle', header: 'Academic Term' },
        { key: 'classScore', header: 'CA Score', align: 'right' },
        { key: 'examScore', header: 'Exam Score', align: 'right' },
        { key: 'totalScore', header: 'Total (%)', align: 'right' },
        { key: 'grade', header: 'Grade', align: 'center' },
        { key: 'remarks', header: 'Remarks' },
        { key: 'published', header: 'Published' },
      ],
      rows: filteredExams.map((r) => {
        const stu = studentMap.get(r.studentId);
        const sub = subjectMap.get(r.subjectId);
        return {
          studentNumber: stu?.number || r.studentId,
          studentName: stu?.fullName || 'Student',
          className: classMap.get(r.classId) || r.classId,
          subject: sub ? `${sub.code} - ${sub.name}` : r.subjectId,
          termCycle: `${r.academicYear} ${r.term}`,
          classScore: r.classScore,
          examScore: r.examScore,
          totalScore: r.totalScore,
          grade: r.grade,
          remarks: r.remarks,
          published: r.published ? 'Published' : 'Draft',
        };
      }),
      summaryMetrics: [
        { label: 'Graded Subject Entries', value: String(filteredExams.length) },
        { label: 'Mean Total Score', value: `${avgExamScore}%` },
        {
          label: 'Published Entries',
          value: String(filteredExams.filter((r) => r.published).length),
        },
      ],
    };

    // 6. Institute Courses & Syllabus Catalogue
    const coursesDataset: DatasetDefinition = {
      id: 'institute-courses',
      slug: 'institute_courses_syllabus',
      title: 'Institute Courses, Credits & Syllabus Catalogue',
      category: 'academic',
      categoryLabel: 'Academic Records',
      description:
        'Uploaded institute courses across Level 1, Level 2, Level 3, and Certificate tracks with credit hours, weights, rationale, and objectives.',
      sourceModuleId: 'professional-credentials',
      sourceModuleLabel: 'Programmes & Courses',
      columns: [
        { key: 'code', header: 'Course Code' },
        { key: 'title', header: 'Course Title' },
        { key: 'programme', header: 'Programme' },
        { key: 'level', header: 'Level / Track' },
        { key: 'creditHours', header: 'Credits', align: 'right' },
        { key: 'weights', header: 'CA / Prac / Exam' },
        { key: 'lecturerName', header: 'Lead Lecturer' },
        { key: 'semesterOrDiet', header: 'Diet / Schedule' },
        { key: 'rationaleSummary', header: 'Rationale / Objectives' },
      ],
      rows: programmeCourses.map((c) => {
        const prog = programmeMap.get(c.programmeId);
        const objCount = Array.isArray(c.objectives) ? c.objectives.length : 0;
        return {
          code: c.code,
          title: c.title,
          programme: prog ? prog.code : c.programmeId,
          level: c.levelLabel || formatInstituteLevelShort(c.levelNumber),
          creditHours: c.creditHours,
          weights: `${c.caWeightPercent}% / ${c.practicalWeightPercent}% / ${c.examWeightPercent}%`,
          lecturerName: c.lecturerName || 'Assigned Faculty',
          semesterOrDiet: c.semesterOrDiet || c.examScheduleDate || '-',
          rationaleSummary: c.rationale
            ? `${c.rationale.slice(0, 65)}${c.rationale.length > 65 ? '...' : ''} (${objCount} obj.)`
            : `${objCount} learning objectives`,
        };
      }),
      summaryMetrics: [
        { label: 'Total Courses', value: String(programmeCourses.length) },
        { label: 'Active Programmes', value: String(programmes.length) },
        {
          label: 'Total Credit Hours',
          value: String(programmeCourses.reduce((s, c) => s + (c.creditHours || 0), 0)),
        },
      ],
    };

    // 7. Candidate Course Assessments (Institute Diet Results)
    const candidateAssessmentsDataset: DatasetDefinition = {
      id: 'candidate-assessments',
      slug: 'candidate_course_assessments',
      title: 'Candidate Examination Diet Assessments',
      category: 'academic',
      categoryLabel: 'Academic Records',
      description:
        'Moderated candidate paper marks (CA, Practical, Final Exam), grades, exemptions, and resit statuses across examination diets.',
      sourceModuleId: 'professional-credentials',
      sourceModuleLabel: 'Programmes & Assessments',
      columns: [
        { key: 'candidateNumber', header: 'Candidate ID' },
        { key: 'candidateName', header: 'Candidate Name' },
        { key: 'course', header: 'Course' },
        { key: 'level', header: 'Level' },
        { key: 'examDiet', header: 'Exam Diet' },
        { key: 'caScore', header: 'CA', align: 'right' },
        { key: 'practicalScore', header: 'Practical', align: 'right' },
        { key: 'examScore', header: 'Exam', align: 'right' },
        { key: 'totalScore', header: 'Total (%)', align: 'right' },
        { key: 'grade', header: 'Grade', align: 'center' },
        { key: 'paperStatus', header: 'Paper Status' },
      ],
      rows: candidateAssessments.map((a) => {
        const cand = candidateMap.get(a.candidateId);
        const crs = courseMap.get(a.courseId);
        return {
          candidateNumber: cand?.number || a.candidateId,
          candidateName: cand?.fullName || 'Candidate',
          course: crs ? `${crs.code} - ${crs.title}` : a.courseId,
          level: formatInstituteLevelShort(a.levelNumber),
          examDiet: a.examDiet,
          caScore: a.caScore,
          practicalScore: a.practicalScore,
          examScore: a.examScore,
          totalScore: a.totalScore,
          grade: a.grade,
          paperStatus: a.paperStatus,
        };
      }),
      summaryMetrics: [
        { label: 'Assessed Papers', value: String(candidateAssessments.length) },
        {
          label: 'Passed / Exempt',
          value: String(
            candidateAssessments.filter(
              (a) => a.paperStatus === 'Passed' || a.paperStatus === 'Exempted'
            ).length
          ),
        },
        {
          label: 'Resits Required',
          value: String(candidateAssessments.filter((a) => a.paperStatus === 'Resit Required').length),
        },
      ],
    };

    // 8. Issued Certificates & Digital Credentials
    const filteredCredentials = issuedCredentials.filter((c) => matchesDateRange(c.issueDate));
    const credentialsDataset: DatasetDefinition = {
      id: 'issued-credentials',
      slug: 'issued_certificates_registry',
      title: 'Issued Certificates & Verification Registry',
      category: 'academic',
      categoryLabel: 'Academic Records',
      description:
        'Official serial numbers, QR verification codes, qualification titles, honours classifications, and validity audit status.',
      sourceModuleId: 'professional-credentials',
      sourceModuleLabel: 'Credentials Registry',
      columns: [
        { key: 'certificateNumber', header: 'Certificate Serial' },
        { key: 'verificationCode', header: 'Verification Code' },
        { key: 'recipientFullName', header: 'Recipient Name' },
        { key: 'candidateNumber', header: 'Candidate / Student ID' },
        { key: 'qualificationAwarded', header: 'Qualification Awarded' },
        { key: 'levelCompletedLabel', header: 'Level Attained' },
        { key: 'honours', header: 'Honours' },
        { key: 'issueDate', header: 'Issue Date' },
        { key: 'status', header: 'Validity Status' },
      ],
      rows: filteredCredentials.map((cred) => ({
        certificateNumber: cred.certificateNumber,
        verificationCode: cred.verificationCode,
        recipientFullName: cred.recipientFullName,
        candidateNumber: cred.candidateNumber,
        qualificationAwarded: cred.qualificationAwarded,
        levelCompletedLabel: cred.levelCompletedLabel,
        honours: cred.honoursOrDistinction || 'Standard Pass',
        issueDate: cred.issueDate,
        status: cred.status,
      })),
      summaryMetrics: [
        { label: 'Total Credentials', value: String(filteredCredentials.length) },
        {
          label: 'Valid Active',
          value: String(filteredCredentials.filter((c) => c.status === 'Valid').length),
        },
        {
          label: 'Revoked / Replaced',
          value: String(
            filteredCredentials.filter((c) => c.status === 'Revoked' || c.status === 'Replaced').length
          ),
        },
      ],
    };

    // 9. Fee & Tuition Payment Receipts
    const filteredPayments = feePayments.filter((p) => {
      if (!matchesDateRange(p.date)) return false;
      if (termScope === 'current') {
        return p.term === school.currentTerm && p.academicYear === school.currentAcademicYear;
      }
      return true;
    });
    const completedFeeSum = filteredPayments
      .filter((p) => p.status === 'Completed')
      .reduce((sum, p) => sum + p.amountPaid, 0);

    const feePaymentsDataset: DatasetDefinition = {
      id: 'fee-payments',
      slug: 'fee_tuition_receipts',
      title: 'Fee & Tuition Payment Receipts (MoMo / Bank / Cash)',
      category: 'financial',
      categoryLabel: 'Financial Records',
      description:
        'Itemized tuition and school fee receipts across MTN MoMo, Telecel Cash, AT Money, Bank Transfers, and Cash desk collections.',
      sourceModuleId: 'finance',
      sourceModuleLabel: 'Finance & Billing',
      columns: [
        { key: 'receiptNumber', header: 'Receipt No.' },
        { key: 'date', header: 'Payment Date' },
        { key: 'studentRef', header: 'Student / Candidate' },
        { key: 'termCycle', header: 'Term / Year' },
        { key: 'paymentMethod', header: 'Payment Channel' },
        { key: 'transactionRef', header: 'Transaction Ref' },
        { key: 'payerName', header: 'Payer Name' },
        { key: 'status', header: 'Status' },
        { key: 'amountPaid', header: `Amount (${currencyLabel})`, align: 'right' },
      ],
      rows: filteredPayments.map((p) => {
        const stu = studentMap.get(p.studentId) || candidateMap.get(p.studentId);
        return {
          receiptNumber: p.receiptNumber,
          date: p.date,
          studentRef: stu ? `${stu.fullName} (${stu.number})` : p.studentId,
          termCycle: `${p.academicYear} ${p.term}`,
          paymentMethod: p.paymentMethod,
          transactionRef: p.transactionRef,
          payerName: `${p.payerName} (${p.payerPhone})`,
          status: p.status,
          amountPaid: formatMoney(p.amountPaid),
        };
      }),
      summaryMetrics: [
        { label: 'Total Receipts', value: String(filteredPayments.length) },
        { label: 'Completed Revenue', value: formatMoney(completedFeeSum) },
        {
          label: 'Mobile Money Txns',
          value: String(
            filteredPayments.filter((p) =>
              ['MTN Mobile Money', 'Telecel Cash', 'AT Money'].includes(p.paymentMethod)
            ).length
          ),
        },
      ],
    };

    // 10. General Income & Expense Ledger
    const filteredTransactions = transactions.filter((t) => matchesDateRange(t.date));
    const totalIncome = filteredTransactions
      .filter((t) => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions
      .filter((t) => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const ledgerDataset: DatasetDefinition = {
      id: 'general-ledger',
      slug: 'income_expense_ledger',
      title: 'Institutional Income & Expense General Ledger',
      category: 'financial',
      categoryLabel: 'Financial Records',
      description:
        'Complete accounting cashbook of institutional revenues, operational expenditures, voucher references, and approving officers.',
      sourceModuleId: 'finance',
      sourceModuleLabel: 'General Ledger',
      columns: [
        { key: 'date', header: 'Date' },
        { key: 'reference', header: 'Voucher / Ref' },
        { key: 'type', header: 'Entry Type' },
        { key: 'category', header: 'Account Category' },
        { key: 'description', header: 'Description' },
        { key: 'approvedBy', header: 'Approved By' },
        { key: 'amount', header: `Amount (${currencyLabel})`, align: 'right' },
      ],
      rows: filteredTransactions.map((t) => ({
        date: t.date,
        reference: t.reference,
        type: t.type,
        category: t.category,
        description: t.description,
        approvedBy: t.approvedBy,
        amount: formatMoney(t.amount),
      })),
      summaryMetrics: [
        { label: 'Total Income', value: formatMoney(totalIncome) },
        { label: 'Total Expenditure', value: formatMoney(totalExpense) },
        { label: 'Net Operating Position', value: formatMoney(totalIncome - totalExpense) },
      ],
    };

    // 11. Staff Statutory SSNIT & GRA PAYE Payroll Schedule
    const payrollComputed = staff.map((member) => ({
      member,
      calc: calculateGhanaPayroll(member.basicSalary, member.allowances),
    }));
    const totalGrossPayroll = payrollComputed.reduce((sum, item) => sum + item.calc.grossSalary, 0);
    const totalNetPayroll = payrollComputed.reduce((sum, item) => sum + item.calc.netSalary, 0);
    const totalPayeTax = payrollComputed.reduce((sum, item) => sum + item.calc.graPayeTax, 0);

    const payrollDataset: DatasetDefinition = {
      id: 'staff-payroll',
      slug: 'staff_ssnit_paye_payroll',
      title: 'Staff Statutory SSNIT & GRA PAYE Payroll Schedule',
      category: 'financial',
      categoryLabel: 'Financial Records',
      description:
        'Monthly staff remuneration schedule with SSNIT Tier 1/2 (5.5% employee / 13% employer) and GRA PAYE tax computations.',
      sourceModuleId: 'payroll',
      sourceModuleLabel: 'Staff & Payroll',
      columns: [
        { key: 'staffId', header: 'Staff ID' },
        { key: 'fullName', header: 'Staff Name' },
        { key: 'roleDept', header: 'Role / Department' },
        { key: 'ssnitNumber', header: 'SSNIT No.' },
        { key: 'tinNumber', header: 'GRA TIN' },
        { key: 'grossSalary', header: 'Gross Pay', align: 'right' },
        { key: 'ssnitEmployee', header: 'SSNIT (5.5%)', align: 'right' },
        { key: 'graPayeTax', header: 'GRA PAYE', align: 'right' },
        { key: 'netSalary', header: 'Net Salary', align: 'right' },
      ],
      rows: payrollComputed.map(({ member, calc }) => ({
        staffId: member.staffId,
        fullName: member.fullName,
        roleDept: `${member.role} (${member.department})`,
        ssnitNumber: member.ssnitNumber || '-',
        tinNumber: member.tinNumber || '-',
        grossSalary: formatMoney(calc.grossSalary),
        ssnitEmployee: formatMoney(calc.ssnitEmployee),
        graPayeTax: formatMoney(calc.graPayeTax),
        netSalary: formatMoney(calc.netSalary),
      })),
      summaryMetrics: [
        { label: 'Staff Count', value: String(staff.length) },
        { label: 'Monthly Gross Pay', value: formatMoney(totalGrossPayroll) },
        { label: 'GRA PAYE Remittance', value: formatMoney(totalPayeTax) },
        { label: 'Monthly Net Disbursed', value: formatMoney(totalNetPayroll) },
      ],
    };

    if (isInstitute) {
      return [
        candidateDataset,
        coursesDataset,
        candidateAssessmentsDataset,
        credentialsDataset,
        feePaymentsDataset,
        ledgerDataset,
        payrollDataset,
        admissionsDataset,
        studentDataset,
        examResultsDataset,
        attendanceDataset,
      ];
    }

    return [
      studentDataset,
      admissionsDataset,
      attendanceDataset,
      examResultsDataset,
      feePaymentsDataset,
      ledgerDataset,
      payrollDataset,
      credentialsDataset,
      candidateDataset,
      coursesDataset,
      candidateAssessmentsDataset,
    ];
  }, [
    isInstitute,
    students,
    candidates,
    admissions,
    attendance,
    examResults,
    programmes,
    programmeCourses,
    candidateAssessments,
    issuedCredentials,
    feePayments,
    transactions,
    staff,
    termScope,
    dateFrom,
    dateTo,
    school.currentTerm,
    school.currentAcademicYear,
    currencyLabel,
    classMap,
    subjectMap,
    studentMap,
    programmeMap,
    courseMap,
    candidateMap,
  ]);

  const visibleDatasets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return datasets.filter((d) => {
      if (categoryFilter !== 'all' && categoryFilter !== 'backup' && d.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [datasets, categoryFilter, searchQuery]);

  const activePreviewDataset = useMemo(
    () => datasets.find((d) => d.id === selectedDatasetId) || visibleDatasets[0] || datasets[0],
    [datasets, visibleDatasets, selectedDatasetId]
  );

  const previewRowsFiltered = useMemo(() => {
    if (!activePreviewDataset) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activePreviewDataset.rows;
    return activePreviewDataset.rows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [activePreviewDataset, searchQuery]);

  const recordLog = (datasetTitle: string, filename: string, format: 'CSV' | 'PDF' | 'JSON', rowCount: number) => {
    setExportLogs((prev) => [
      {
        id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        datasetTitle,
        filename,
        format,
        rowCount,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
      ...prev.slice(0, 14),
    ]);
  };

  const handleExportDatasetCsv = (dataset: DatasetDefinition) => {
    const filename = buildSafeFilename(school.code, dataset.slug, 'csv');
    downloadCsvReport({
      filename,
      title: dataset.title,
      subtitle: `${school.currentAcademicYear} · ${
        termScope === 'current' ? school.currentTerm : 'All Academic Terms'
      }`,
      school,
      generatedBy: `${currentUser.name} (${currentUser.title})`,
      summaryMetrics: dataset.summaryMetrics,
      columns: dataset.columns,
      rows: dataset.rows,
    });
    recordLog(dataset.title, filename, 'CSV', dataset.rows.length);
    setStatusBanner({
      type: 'success',
      text: `Downloaded ${filename} (${dataset.rows.length} rows in CSV format).`,
    });
  };

  const handleExportDatasetPdf = (dataset: DatasetDefinition) => {
    const filename = buildSafeFilename(school.code, dataset.slug, 'pdf');
    downloadPdfReport({
      filename,
      title: dataset.title,
      subtitle: `${dataset.categoryLabel}  |  Cycle: ${school.currentAcademicYear} (${
        termScope === 'current' ? school.currentTerm : 'All Terms'
      })`,
      school,
      generatedBy: `${currentUser.name} (${currentUser.title})`,
      summaryMetrics: dataset.summaryMetrics,
      columns: dataset.columns,
      rows: dataset.rows,
    });
    recordLog(dataset.title, filename, 'PDF', dataset.rows.length);
    setStatusBanner({
      type: 'success',
      text: `Downloaded ${filename} (${dataset.rows.length} rows in PDF format).`,
    });
  };

  const handleExportExecutiveMasterPdf = () => {
    const filename = buildSafeFilename(school.code, 'executive_master_report', 'pdf');
    const primaryStudentDataset = datasets.find(
      (d) => d.id === (isInstitute ? 'institute-candidates' : 'student-registry')
    )!;
    const primaryAcademicDataset = datasets.find(
      (d) => d.id === (isInstitute ? 'candidate-assessments' : 'exam-results')
    )!;
    const credentialsDataset = datasets.find((d) => d.id === 'issued-credentials')!;
    const feeDataset = datasets.find((d) => d.id === 'fee-payments')!;
    const ledgerDataset = datasets.find((d) => d.id === 'general-ledger')!;
    const payrollDataset = datasets.find((d) => d.id === 'staff-payroll')!;

    const totalRevenue = feePayments
      .filter((p) => p.status === 'Completed')
      .reduce((s, p) => s + p.amountPaid, 0);

    const sections = [
      {
        sectionTitle: primaryStudentDataset.title,
        sectionSubtitle: primaryStudentDataset.description,
        columns: primaryStudentDataset.columns,
        rows: primaryStudentDataset.rows,
      },
      {
        sectionTitle: primaryAcademicDataset.title,
        sectionSubtitle: primaryAcademicDataset.description,
        columns: primaryAcademicDataset.columns,
        rows: primaryAcademicDataset.rows,
      },
      {
        sectionTitle: credentialsDataset.title,
        sectionSubtitle: credentialsDataset.description,
        columns: credentialsDataset.columns,
        rows: credentialsDataset.rows,
      },
      {
        sectionTitle: feeDataset.title,
        sectionSubtitle: feeDataset.description,
        columns: feeDataset.columns,
        rows: feeDataset.rows,
      },
      {
        sectionTitle: ledgerDataset.title,
        sectionSubtitle: ledgerDataset.description,
        columns: ledgerDataset.columns,
        rows: ledgerDataset.rows,
      },
      {
        sectionTitle: payrollDataset.title,
        sectionSubtitle: payrollDataset.description,
        columns: payrollDataset.columns,
        rows: payrollDataset.rows,
      },
    ];

    const totalCombinedRows = sections.reduce((sum, s) => sum + s.rows.length, 0);

    downloadComprehensiveExecutivePdf({
      filename,
      school,
      generatedBy: `${currentUser.name} (${currentUser.title})`,
      summaryMetrics: [
        {
          label: isInstitute ? 'Registered Candidates' : 'Enrolled Students',
          value: String(isInstitute ? candidates.length : students.length),
        },
        {
          label: isInstitute ? 'Courses & Assessments' : 'Exam Grade Entries',
          value: String(
            isInstitute ? programmeCourses.length + candidateAssessments.length : examResults.length
          ),
        },
        { label: 'Issued Credentials', value: String(issuedCredentials.length) },
        { label: 'Completed Fee Revenue', value: formatMoney(totalRevenue) },
      ],
      sections,
    });

    recordLog('Executive Master Report (All Categories)', filename, 'PDF', totalCombinedRows);
    setStatusBanner({
      type: 'success',
      text: `Downloaded comprehensive PDF report: ${filename} (${totalCombinedRows} total records).`,
    });
  };

  const handleExportFullJsonBackup = () => {
    const jsonPayload = exportDatabaseJSON();
    const filename = buildSafeFilename(school.code, 'full_workspace_backup', 'json');
    const blob = new Blob([jsonPayload], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);

    const totalRecords = datasets.reduce((sum, d) => sum + d.rows.length, 0);
    recordLog('Full Workspace Snapshot Backup', filename, 'JSON', totalRecords);
    setStatusBanner({
      type: 'success',
      text: `Exported lossless JSON workspace snapshot: ${filename}.`,
    });
  };

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setImportJsonText(content);
      const restored = importDatabaseJSON(content);
      if (restored) {
        setStatusBanner({
          type: 'success',
          text: `Workspace database successfully restored from backup file "${file.name}".`,
        });
      } else {
        setStatusBanner({
          type: 'error',
          text: `Could not restore "${file.name}". Ensure it is a valid InfoDigital JSON backup.`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleManualJsonRestore = () => {
    if (!importJsonText.trim()) return;
    const ok = importDatabaseJSON(importJsonText);
    if (ok) {
      setStatusBanner({
        type: 'success',
        text: 'Workspace database successfully restored from pasted JSON snapshot.',
      });
      setImportJsonText('');
    } else {
      setStatusBanner({
        type: 'error',
        text: 'Invalid backup JSON format. Please paste an unmodified JSON export file.',
      });
    }
  };

  const studentRecordsTotal =
    students.length + candidates.length + admissions.length + attendance.length;
  const academicRecordsTotal =
    examResults.length +
    programmeCourses.length +
    candidateAssessments.length +
    issuedCredentials.length;
  const financialRecordsTotal = feePayments.length + transactions.length + staff.length;
  const totalFeeCollected = feePayments
    .filter((p) => p.status === 'Completed')
    .reduce((sum, p) => sum + p.amountPaid, 0);

  const hasActiveFilters = termScope !== 'all' || Boolean(dateFrom) || Boolean(dateTo) || Boolean(searchQuery);

  return (
    <div className="space-y-6">
      {/* Top Workspace Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Data Export &amp; Institutional Backup Center</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 tabular-nums">
            <span className="text-slate-200 font-medium">{school.name}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-400">{school.code}</span>
            <span aria-hidden="true">·</span>
            <span>
              {school.currentAcademicYear} ({school.currentTerm})
            </span>
            <span aria-hidden="true">·</span>
            <span>{isCloudSynced ? 'Cloud Firestore Synced' : 'Local Browser Storage'}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportExecutiveMasterPdf}
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Download Executive Master PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportFullJsonBackup}
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <HardDriveDownload className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Export Full JSON Snapshot</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {statusBanner && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs ${
            statusBanner.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-200'
              : 'bg-rose-950/50 border-rose-700/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="truncate">{statusBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-slate-400 hover:text-white cursor-pointer shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4-Column Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400">Student &amp; Candidate Records</span>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {studentRecordsTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 tabular-nums">
            {students.length} students · {candidates.length} candidates · {admissions.length} intake
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400">Academic &amp; Credential Records</span>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {academicRecordsTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 tabular-nums">
            {examResults.length} grades · {programmeCourses.length} courses · {issuedCredentials.length} certs
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400">Financial &amp; Payroll Records</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {formatMoney(totalFeeCollected)}
          </div>
          <p className="text-[11px] text-slate-400 tabular-nums">
            {financialRecordsTotal} entries ({feePayments.length} receipts · {staff.length} staff)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400">Session Exports &amp; Cloud Sync</span>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {exportLogs.length}
          </div>
          <p className="text-[11px] text-slate-400">
            {isCloudSynced ? 'Real-time Cloud Firestore active' : 'Sign in with Google for cloud backup'}
          </p>
        </div>
      </div>

      {/* Category Tabs + Scope & Date Range Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Interactive Segmented Category Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All Datasets' },
                { id: 'student', label: 'Student Records' },
                { id: 'academic', label: 'Academic & Credentials' },
                { id: 'financial', label: 'Financial & Payroll' },
                { id: 'backup', label: 'Full JSON Backup & Restore' },
              ] as { id: ExportCategoryFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  categoryFilter === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full xl:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter datasets or preview rows..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Date & Term Scope Filters */}
        {categoryFilter !== 'backup' && (
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-end gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Academic Term Scope</label>
              <select
                value={termScope}
                onChange={(e) => setTermScope(e.target.value as 'all' | 'current')}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Academic Years &amp; Terms</option>
                <option value="current">
                  Active Cycle Only ({school.currentAcademicYear} · {school.currentTerm})
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Date From (Optional)</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Date To (Optional)</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setTermScope('all');
                  setDateFrom('');
                  setDateTo('');
                  setSearchQuery('');
                }}
                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer whitespace-nowrap"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* CSV & PDF Dataset Export Table + Live Preview Inspector */}
      {categoryFilter !== 'backup' && (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white">Institutional Export Datasets (CSV &amp; PDF)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select any academic, financial, or student register below to preview rows or download formatted CSV spreadsheets and printable PDF reports.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono tabular-nums whitespace-nowrap">
                {visibleDatasets.length} datasets available
              </span>
            </div>

            {visibleDatasets.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm font-semibold text-white">No datasets match "{searchQuery}"</p>
                <p className="text-xs text-slate-400">Clear the search box to see all exportable registers.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                      <th className="py-3 px-4 font-semibold">Dataset &amp; Included Fields</th>
                      <th className="py-3 px-4 font-semibold whitespace-nowrap">Domain</th>
                      <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Records</th>
                      <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Export Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {visibleDatasets.map((dataset) => {
                      const isSelected = activePreviewDataset?.id === dataset.id;
                      return (
                        <tr
                          key={dataset.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-emerald-950/20' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3.5 px-4 max-w-xl">
                            <div className="font-bold text-white text-xs">{dataset.title}</div>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                              {dataset.description}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                            {dataset.categoryLabel}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-white font-semibold whitespace-nowrap">
                            {dataset.rows.length.toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedDatasetId(dataset.id)}
                                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                                  isSelected
                                    ? 'bg-slate-800 border-emerald-500/60 text-emerald-300'
                                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5 shrink-0" />
                                <span>Preview</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleExportDatasetCsv(dataset)}
                                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Download CSV</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleExportDatasetPdf(dataset)}
                                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0"
                              >
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span>Download PDF</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Live Tabular Preview Inspector */}
          {activePreviewDataset && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 tabular-nums">
                    <span className="text-emerald-400 font-semibold">Live Dataset Preview</span>
                    <span aria-hidden="true">·</span>
                    <span>{activePreviewDataset.categoryLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{previewRowsFiltered.length} rows shown</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{activePreviewDataset.title}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleExportDatasetCsv(activePreviewDataset)}
                    className="flex items-center gap-1.5 py-2 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Export CSV ({activePreviewDataset.rows.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportDatasetPdf(activePreviewDataset)}
                    className="flex items-center gap-1.5 py-2 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>Export PDF ({activePreviewDataset.rows.length})</span>
                  </button>
                </div>
              </div>

              {/* Dataset Summary Strip */}
              <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs tabular-nums">
                {activePreviewDataset.summaryMetrics.map((m) => (
                  <div key={m.label} className="flex items-center gap-2">
                    <span className="text-slate-400">{m.label}:</span>
                    <span className="font-mono font-bold text-white">{m.value}</span>
                  </div>
                ))}
              </div>

              {previewRowsFiltered.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-sm font-bold text-white">
                    No records in {activePreviewDataset.title} yet
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Once entries are recorded in {activePreviewDataset.sourceModuleLabel}, they will appear here automatically for CSV and PDF export.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveModule(activePreviewDataset.sourceModuleId)}
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 text-xs font-bold transition cursor-pointer whitespace-nowrap"
                  >
                    <span>Open {activePreviewDataset.sourceModuleLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400">
                      <tr>
                        {activePreviewDataset.columns.map((col) => (
                          <th
                            key={col.key}
                            className={`py-2.5 px-4 font-semibold whitespace-nowrap ${
                              col.align === 'right'
                                ? 'text-right'
                                : col.align === 'center'
                                ? 'text-center'
                                : 'text-left'
                            }`}
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {previewRowsFiltered.slice(0, 50).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          {activePreviewDataset.columns.map((col) => (
                            <td
                              key={col.key}
                              className={`py-2.5 px-4 whitespace-nowrap ${
                                col.align === 'right'
                                  ? 'text-right font-mono tabular-nums text-slate-100'
                                  : col.align === 'center'
                                  ? 'text-center font-mono tabular-nums text-slate-200'
                                  : 'text-slate-300'
                              }`}
                            >
                              {row[col.key]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Full Institution JSON Backup, File Upload Restore & Reset Section */}
      {(categoryFilter === 'all' || categoryFilter === 'backup') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Complete JSON Snapshot Export & File Upload Restore */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 text-xs">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">
                Complete Workspace JSON Backup &amp; Restore
              </h3>
              <p className="text-slate-400 leading-relaxed">
                In addition to formatted CSV spreadsheets and PDF reports, administrators can archive a lossless JSON snapshot containing all programmes, courses, student profiles, digital signatures, and settings for <strong className="text-white">{school.name}</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleExportFullJsonBackup}
                className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Download Full JSON Backup</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleJsonFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold transition cursor-pointer whitespace-nowrap"
              >
                <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Restore from .JSON File</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="block font-semibold text-slate-300">
                Or Paste JSON Snapshot Payload to Restore:
              </label>
              <textarea
                rows={4}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{"exportTimestamp": "...", "school": {...}, "students": [...]}'
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={!importJsonText.trim()}
                  onClick={handleManualJsonRestore}
                  className="flex items-center gap-2 py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-white font-semibold transition cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span>Restore Pasted JSON</span>
                </button>

                {confirmClearRecords ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetToDemoData();
                        setConfirmClearRecords(false);
                        setStatusBanner({
                          type: 'success',
                          text: `Cleared operational student, exam, and fee records for ${school.name}.`,
                        });
                      }}
                      className="py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition cursor-pointer whitespace-nowrap"
                    >
                      Confirm Clear Records
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearRecords(false)}
                      className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearRecords(true)}
                    className="flex items-center gap-1.5 py-2 px-3 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/60 text-rose-300 font-semibold transition cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    <span>Clear Operational Records</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Session Export Audit Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white">Session Export Audit Log</h3>
                <p className="text-slate-400 mt-0.5">
                  Recent CSV, PDF, and JSON archives generated during your active administrator session.
                </p>
              </div>
              <span className="font-mono tabular-nums text-slate-400 whitespace-nowrap">
                {exportLogs.length} files
              </span>
            </div>

            {exportLogs.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-800 rounded-xl space-y-1.5">
                <p className="font-semibold text-slate-300">No files exported yet in this session</p>
                <p className="text-[11px] text-slate-500">
                  Click any "Download CSV", "Download PDF", or "Executive Master PDF" button to generate an instant download.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="py-2 pr-3 font-semibold">Dataset</th>
                      <th className="py-2 px-3 font-semibold">Format</th>
                      <th className="py-2 px-3 font-semibold text-right">Rows</th>
                      <th className="py-2 pl-3 font-semibold text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {exportLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2.5 pr-3">
                          <div className="font-semibold text-white truncate max-w-[200px]">
                            {log.datasetTitle}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500 truncate max-w-[200px]">
                            {log.filename}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                          {log.format}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-200 whitespace-nowrap">
                          {log.rowCount.toLocaleString()}
                        </td>
                        <td className="py-2.5 pl-3 text-right font-mono tabular-nums text-slate-400 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
