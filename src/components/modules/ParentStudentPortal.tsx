import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  Student,
  IssuedCredential,
  CertificateReplacementRequest,
  ProgrammeCourse,
  INSTITUTE_CERTIFICATE_LEVEL,
  formatInstituteLevelShort,
  isInstituteLevelType,
} from '../../types';
import { formatGHS, calculateWassceGrade, calculateBeceAggregate } from '../../utils/academicCalculations';
import { buildPublicShareUrl } from '../../utils/shareUrl';
import { ReportCardModal } from '../modals/ReportCardModal';
import { CertificateDocumentModal } from '../modals/CertificateDocumentModal';
import { CourseDetailFlyerModal } from '../modals/CourseDetailFlyerModal';
import { ImageUploadModal } from '../modals/ImageUploadModal';
import {
  HeartHandshake,
  Award,
  Smartphone,
  BookOpen,
  CheckCircle,
  GraduationCap,
  FileText,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Lock,
  Globe,
  AlertCircle,
  Eye,
  Camera,
  TrendingUp,
} from 'lucide-react';

export const ParentStudentPortal: React.FC = () => {
  const {
    students,
    classes,
    subjects,
    examResults,
    feePayments,
    school,
    attendance,
    currentUser,
    recordFeePayment,
    candidates,
    programmes,
    programmeCourses,
    candidateAssessments,
    issuedCredentials,
    graduateRecords,
    replacementRequests,
    evaluateCandidateProgression,
    submitReplacementRequest,
    updateGraduateProfile,
    updateCandidate,
    photoChangeRequests,
    submitStudentPhotoRequest,
    beceMockSeries,
    beceMockScores,
    beceInterventions,
    beceAiReports,
    timetable,
    resolveTeacherDisplayName,
  } = useSchool();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    currentUser.studentId || students[0]?.id || ''
  );

  useEffect(() => {
    if (currentUser.studentId) {
      setSelectedStudentId(currentUser.studentId);
    } else if (students.length > 0 && !students.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(students[0].id);
    }
  }, [currentUser.id, currentUser.studentId, students, selectedStudentId]);

  const [portalSection, setPortalSection] = useState<'overview' | 'bece-mocks' | 'courses' | 'credentials' | 'profile'>('overview');
  const [activeReportStudent, setActiveReportStudent] = useState<Student | null>(null);
  const [selectedCredentialModal, setSelectedCredentialModal] = useState<{
    cred: IssuedCredential;
    mode: 'certificate' | 'transcript' | 'letter' | 'badge';
  } | null>(null);
  const [viewingCourseFlyer, setViewingCourseFlyer] = useState<ProgrammeCourse | null>(null);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [photoFeedbackMsg, setPhotoFeedbackMsg] = useState<string | null>(null);

  // MoMo payment state
  const [showMomoModal, setShowMomoModal] = useState(false);
  const [momoNetwork, setMomoNetwork] = useState<'MTN Mobile Money' | 'Telecel Cash' | 'AT Money'>('MTN Mobile Money');
  const [momoNumber, setMomoNumber] = useState('0244567890');
  const [momoAmount, setMomoAmount] = useState(1200);
  const [momoPromptSent, setMomoPromptSent] = useState(false);

  // Replacement Certificate Request Modal state
  const [replacementTargetCred, setReplacementTargetCred] = useState<IssuedCredential | null>(null);
  const [repReason, setRepReason] = useState<CertificateReplacementRequest['reason']>('Damaged Physical Copy');
  const [repDetails, setRepDetails] = useState('');
  const [repUpdatedName, setRepUpdatedName] = useState('');
  const [copiedCertId, setCopiedCertId] = useState<string | null>(null);
  const [profileSavedNotice, setProfileSavedNotice] = useState(false);

  const activeStudent =
    students.find((s) => s.id === selectedStudentId) ||
    students[0] ||
    undefined;

  const matchedCandidate = candidates.find(
    (c) =>
      (currentUser.candidateId && c.id === currentUser.candidateId) ||
      (activeStudent && c.studentId === activeStudent.id) ||
      (activeStudent && c.candidateNumber === activeStudent.studentNumber) ||
      c.email.toLowerCase() === currentUser.email.toLowerCase() ||
      c.candidateNumber.toLowerCase() === currentUser.email.toLowerCase()
  );

  const activeCandidate = matchedCandidate || candidates[0];

  const activeProgramme = programmes.find((p) => p.id === activeCandidate?.programmeId);
  const progressionEval = activeCandidate ? evaluateCandidateProgression(activeCandidate.id) : null;
  const studentClass = classes.find((c) => c.id === activeStudent?.classId);

  // Candidate registered courses & assessments
  const candidateProgrammeCourses = programmeCourses.filter((c) => c.programmeId === activeCandidate?.programmeId);
  const myCandidateAssessments = candidateAssessments.filter((a) => a.candidateId === activeCandidate?.id);

  // Credentials belonging to this student / candidate / graduate (supports multiple completed qualifications!)
  const myCredentials = issuedCredentials.filter(
    (cred) =>
      (activeCandidate && cred.candidateId === activeCandidate.id) ||
      (activeStudent && cred.candidateNumber === activeStudent.studentNumber) ||
      cred.recipientFullName.toLowerCase() === currentUser.name.toLowerCase()
  );

  const myGraduateRecord = graduateRecords.find(
    (g) =>
      (activeCandidate && g.candidateId === activeCandidate.id) ||
      g.email.toLowerCase() === currentUser.email.toLowerCase()
  );

  const myReplacementRequests = replacementRequests.filter(
    (r) => activeCandidate && r.candidateId === activeCandidate.id
  );

  // Editable personal profile state for student/graduate
  const [editEmail, setEditEmail] = useState(activeCandidate?.email || currentUser.email);
  const [editPhone, setEditPhone] = useState(activeCandidate?.phone || activeStudent?.guardianPhone || '');
  const [editHeadline, setEditHeadline] = useState(
    myGraduateRecord?.currentEmployerOrRole || activeCandidate?.headlineOrRole || ''
  );
  const [editDirectoryConsent, setEditDirectoryConsent] = useState<boolean>(
    myGraduateRecord?.directoryConsent ?? activeCandidate?.directoryConsent ?? true
  );

  useEffect(() => {
    setEditEmail(activeCandidate?.email || currentUser.email);
    setEditPhone(activeCandidate?.phone || activeStudent?.guardianPhone || '');
    setEditHeadline(myGraduateRecord?.currentEmployerOrRole || activeCandidate?.headlineOrRole || '');
    setEditDirectoryConsent(myGraduateRecord?.directoryConsent ?? activeCandidate?.directoryConsent ?? true);
  }, [activeCandidate?.id, myGraduateRecord?.id]);

  // Standard school results & fees
  const studentResults = examResults.filter(
    (r) =>
      r.studentId === activeStudent?.id &&
      r.term === school.currentTerm &&
      r.academicYear === school.currentAcademicYear
  );

  const studentPayments = feePayments.filter((p) => p.studentId === activeStudent?.id);
  const schoolPaid = studentPayments.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalFeeBilled = activeCandidate
    ? activeCandidate.totalFeesBilled
    : activeStudent?.boardingStatus === 'Boarding'
    ? 3870
    : 2320;
  const totalPaid = activeCandidate ? activeCandidate.totalFeesPaid : schoolPaid;
  const balanceRemaining = Math.max(0, totalFeeBilled - totalPaid);

  const studentAttendance = attendance.filter((a) => a.studentId === activeStudent?.id);
  const presentDays = studentAttendance.filter((a) => a.status === 'Present').length;
  const attendancePercent =
    studentAttendance.length > 0 ? Math.round((presentDays / studentAttendance.length) * 100) : 96;

  const handleSendMomo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent && !activeCandidate) return;
    setMomoPromptSent(true);
    setTimeout(() => {
      recordFeePayment({
        studentId: activeStudent?.id || activeCandidate!.id,
        amountPaid: Number(momoAmount),
        paymentMethod: momoNetwork,
        networkNumber: momoNumber,
        transactionRef: `${momoNetwork.slice(0, 3).toUpperCase()}-MM-${Date.now().toString().slice(-8)}`,
        payerName: currentUser.name,
        payerPhone: momoNumber,
        term: school.currentTerm,
        academicYear: school.currentAcademicYear,
        status: 'Completed',
        notes: `Portal fee settlement`,
      });
      setMomoPromptSent(false);
      setShowMomoModal(false);
    }, 900);
  };

  const handleCopyShareLink = (cred: IssuedCredential) => {
    const link = buildPublicShareUrl(`?verify=${encodeURIComponent(cred.certificateNumber)}`);
    navigator.clipboard?.writeText(link);
    setCopiedCertId(cred.id);
    setTimeout(() => setCopiedCertId(null), 2200);
  };

  const handleSubmitReplacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacementTargetCred || !activeCandidate) return;
    submitReplacementRequest({
      candidateId: activeCandidate.id,
      originalCertificateId: replacementTargetCred.id,
      originalCertificateNumber: replacementTargetCred.certificateNumber,
      requesterName: repUpdatedName.trim() || replacementTargetCred.recipientFullName,
      reason: repReason,
      details: repDetails.trim() || 'Requested via Personal Student & Graduate Portal.',
    });
    setReplacementTargetCred(null);
    setRepDetails('');
  };

  const handleSavePersonalDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (myGraduateRecord) {
      updateGraduateProfile(myGraduateRecord.id, {
        email: editEmail,
        phone: editPhone,
        directoryConsent: editDirectoryConsent,
        currentEmployerOrRole: editHeadline,
      });
    } else if (activeCandidate) {
      updateCandidate(activeCandidate.id, {
        email: editEmail,
        phone: editPhone,
        directoryConsent: editDirectoryConsent,
        headlineOrRole: editHeadline,
      });
    }
    setProfileSavedNotice(true);
    setTimeout(() => setProfileSavedNotice(false), 2500);
  };

  const displayName = activeCandidate
    ? `${activeCandidate.firstName} ${activeCandidate.otherNames ? activeCandidate.otherNames + ' ' : ''}${activeCandidate.lastName}`
    : activeStudent
    ? `${activeStudent.firstName} ${activeStudent.lastName}`
    : currentUser.name;
  const displayIdNumber = activeCandidate?.candidateNumber || activeStudent?.studentNumber || 'CAND-001';
  const displayPhoto = activeCandidate?.photo || activeStudent?.photo || currentUser.avatar;

  const targetPhotoEntityId = activeStudent?.id || activeCandidate?.id || '';
  const myPhotoRequests = photoChangeRequests.filter((r) => r.studentId === targetPhotoEntityId);
  const latestPendingPhotoReq = myPhotoRequests.find((r) => r.status === 'Pending Review');

  const isBasicOrCombinedSchool =
    !isInstituteLevelType(school.levelType) &&
    (school.levelType === 'Basic & JHS' || school.levelType === 'Combined');

  const publishedMockSeries = beceMockSeries
    .filter((s) => s.publishedToPortals)
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  const myMockSeriesSummaries = publishedMockSeries.map((ser) => {
    const scores = beceMockScores.filter(
      (sc) => sc.seriesId === ser.id && sc.studentId === activeStudent?.id
    );
    const agg = calculateBeceAggregate(scores);
    return { series: ser, scores, agg };
  });

  const myBeceAiReport = beceAiReports.find((r) => r.studentId === activeStudent?.id);
  const myBeceInterventions = beceInterventions.filter((inv) => inv.studentId === activeStudent?.id);

  const portalTabs = [
    { id: 'overview', label: 'Academic Overview' },
    ...(isBasicOrCombinedSchool ? [{ id: 'bece-mocks', label: 'BECE Mock & Study Plan' }] : []),
    { id: 'courses', label: 'Courses & Progression' },
    { id: 'credentials', label: `Certificates & Transcripts (${myCredentials.length})` },
    { id: 'profile', label: 'Profile & Passport Photo' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Student Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-fuchsia-400" />
            <span>Student, Parent &amp; Graduate Personal Portal</span>
          </h2>
          <p className="text-xs text-sky-200/80">
            Personal academic records, passport photo management, BECE mock tracking, fee standing, and official credentials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role !== 'student' &&
            currentUser.role !== 'graduate' &&
            students.length > 0 && (
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-indigo-950/80 border border-indigo-400/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {currentUser.role === 'parent' ? 'Ward' : 'Viewing'}: {s.firstName} {s.lastName} ({s.studentNumber})
                  </option>
                ))}
              </select>
            )}

          <div className="flex flex-wrap items-center gap-1 bg-slate-950/80 border border-indigo-500/30 p-1 rounded-xl text-xs">
            {portalTabs.map((tab) => {
              const activeTabTone =
                tab.id === 'overview'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white'
                  : tab.id === 'bece-mocks'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                  : tab.id === 'courses'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                  : tab.id === 'credentials'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                  : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white';
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPortalSection(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                    portalSection === tab.id
                      ? activeTabTone
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Personal Identity & Passport Photograph Banner */}
      <div className="bg-gradient-to-r from-indigo-950/90 via-purple-950/75 to-teal-950/85 border border-indigo-400/35 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <img
              src={displayPhoto}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-16 h-20 rounded-xl object-cover border-2 border-amber-400"
            />
            {targetPhotoEntityId && (
              <button
                type="button"
                onClick={() => setShowPhotoUploadModal(true)}
                title="Upload or update official passport photograph"
                className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 border-2 border-slate-900 shadow cursor-pointer"
              >
                <Camera className="w-3 h-3" />
              </button>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-white">{displayName}</h3>
              <span className="text-xs font-mono font-bold text-amber-300 tabular-nums">
                {displayIdNumber}
              </span>
              {activeCandidate && (
                <span className="text-[11px] text-slate-300">
                  ·{' '}
                  {activeCandidate.status === 'Completed / Graduated'
                    ? 'Verified Alumnus / Graduate'
                    : `${formatInstituteLevelShort(activeCandidate.currentLevel)} Candidate`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {activeProgramme ? (
                <>
                  Programme: <strong>{activeProgramme.title}</strong> · Stage:{' '}
                  {activeCandidate?.currentLevel === INSTITUTE_CERTIFICATE_LEVEL
                    ? 'Certificate Track (Non-Chartered)'
                    : `${formatInstituteLevelShort(activeCandidate?.currentLevel || 1)}`}
                </>
              ) : (
                <>
                  Section:{' '}
                  <strong>
                    {activeStudent?.sectionName || studentClass?.sectionName || 'Academic'}
                  </strong>{' '}
                  · Class &amp; Stream: <strong>{studentClass?.name || 'Assigned Stream'}</strong> ·{' '}
                  {activeStudent?.programme || 'General'} · Class Teacher:{' '}
                  <strong>
                    {resolveTeacherDisplayName(
                      activeStudent?.classTeacherId || studentClass?.formTutorTeacherId,
                      activeStudent?.classTeacherName || studentClass?.classTeacherName
                    )}
                  </strong>
                </>
              )}
            </p>
            {latestPendingPhotoReq && (
              <p className="text-[11px] text-amber-400 mt-1">
                Passport photo change submitted on {latestPendingPhotoReq.requestedAt} — Pending Administrator Approval
              </p>
            )}
            {photoFeedbackMsg && (
              <p className="text-[11px] text-emerald-400 mt-1 font-semibold">{photoFeedbackMsg}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {targetPhotoEntityId && (
            <button
              type="button"
              onClick={() => setShowPhotoUploadModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Update Photo</span>
            </button>
          )}
          {activeStudent && (
            <button
              type="button"
              onClick={() => setActiveReportStudent(activeStudent)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              <span>Report Card</span>
            </button>
          )}
          {myCredentials[0] && (
            <button
              type="button"
              onClick={() => setSelectedCredentialModal({ cred: myCredentials[0], mode: 'certificate' })}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer whitespace-nowrap"
            >
              <Award className="w-4 h-4" />
              <span>View / Print Certificate</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowMomoModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
          >
            <Smartphone className="w-4 h-4" />
            <span>Pay Fees via MoMo</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: ACADEMIC OVERVIEW */}
      {portalSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 tabular-nums">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Financial &amp; Tuition Standing
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {formatGHS(totalPaid)}
                </span>
                <span className="text-xs text-slate-400 font-mono">Billed: {formatGHS(totalFeeBilled)}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Outstanding Balance:</span>
                <span className={`font-mono font-bold ${balanceRemaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {balanceRemaining > 0 ? formatGHS(balanceRemaining) : 'Cleared in Full'}
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Level Progression &amp; Eligibility
              </span>
              <div className="mt-2">
                <span className="text-lg font-bold text-white block">
                  {progressionEval
                    ? progressionEval.currentLevel === INSTITUTE_CERTIFICATE_LEVEL
                      ? 'Certificate Track (Non-Chartered)'
                      : `${formatInstituteLevelShort(progressionEval.currentLevel)} of ${progressionEval.maxProgrammeLevel}`
                    : studentClass?.name || 'Active Cohort'}
                </span>
                <span className="text-xs text-emerald-400 font-semibold block mt-0.5">
                  {progressionEval ? progressionEval.statusSummary : `${attendancePercent}% Attendance Rate`}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Identity Verification:</span>
                <span className="text-emerald-400 font-semibold">
                  {activeCandidate?.identityVerified !== false ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Issued Credentials &amp; Awards
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-amber-300">{myCredentials.length}</span>
                <span className="text-xs text-slate-300">Digital Credentials on Register</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Employer Directory:</span>
                <button
                  type="button"
                  onClick={() => setPortalSection('credentials')}
                  className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  Open Credentials Vault &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Assigned Class Stream Timetable & Placement History Summary */}
          {activeStudent && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    Assigned Class Stream Timetable ({studentClass?.name || 'Stream'})
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono tabular-nums">
                    {activeStudent.academicYear || school.currentAcademicYear}
                  </span>
                </div>
                {timetable.filter((tp) => tp.classId === activeStudent.classId).length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {timetable
                      .filter((tp) => tp.classId === activeStudent.classId)
                      .map((tp) => {
                        const sbj = subjects.find((s) => s.id === tp.subjectId);
                        return (
                          <div
                            key={tp.id}
                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800"
                          >
                            <div>
                              <span className="font-semibold text-white">
                                {tp.dayOfWeek} · {sbj?.name || 'Period'}
                              </span>
                              <span className="block text-[11px] text-slate-400">
                                Teacher: {resolveTeacherDisplayName(tp.teacherId)} · {tp.room}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-emerald-400 tabular-nums">
                              {tp.startTime}–{tp.endTime}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 bg-slate-950 border border-slate-800 rounded-xl p-3">
                    Connected to {studentClass?.name || 'assigned stream'} register &amp; timetable. Class Teacher:{' '}
                    {resolveTeacherDisplayName(
                      activeStudent.classTeacherId || studentClass?.formTutorTeacherId,
                      activeStudent.classTeacherName || studentClass?.classTeacherName
                    )}
                    .
                  </p>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    Class, Stream &amp; Promotion History
                  </span>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {(activeStudent.placementHistory || []).length} Record(s)
                  </span>
                </div>
                {activeStudent.placementHistory && activeStudent.placementHistory.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {[...activeStudent.placementHistory].reverse().map((ph) => (
                      <div
                        key={ph.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800"
                      >
                        <div>
                          <span className="font-semibold text-emerald-400">{ph.changeType}</span>{' '}
                          <span className="text-white font-semibold">· {ph.newClassName}</span>
                          <span className="block text-[11px] text-slate-400">
                            {ph.newSectionName} · Stream {ph.newStream}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-300 tabular-nums">
                          {ph.academicYear}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 bg-slate-950 border border-slate-800 rounded-xl p-3">
                    Current Placement: {studentClass?.name || activeStudent.gradeName} (
                    {activeStudent.academicYear || school.currentAcademicYear}). All promotions and stream changes are preserved here.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Standard School Subject Grades (if present) */}
          {studentResults.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-white text-sm">
                  {school.currentTerm} Terminal Subject Marks ({activeStudent?.firstName})
                </span>
                <span className="text-slate-400 text-[11px]">Continuous Assessment (30%) + Terminal Exam (70%)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 tabular-nums">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-2 text-right">Class (30%)</th>
                      <th className="py-3 px-2 text-right">Exam (70%)</th>
                      <th className="py-3 px-2 text-right font-bold">Total</th>
                      <th className="py-3 px-3 text-center font-bold">Grade</th>
                      <th className="py-3 px-4">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {studentResults.map((r) => {
                      const sbj = subjects.find((s) => s.id === r.subjectId);
                      const gradeInfo = calculateWassceGrade(r.totalScore);
                      return (
                        <tr key={r.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-bold text-white">{sbj?.name || 'Subject'}</td>
                          <td className="py-2.5 px-2 text-right font-mono">{r.classScore}</td>
                          <td className="py-2.5 px-2 text-right font-mono">{r.examScore}</td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-white">{r.totalScore}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${gradeInfo.badgeColor}`}>
                              {r.grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-300">{r.remarks}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Programme Level Coursework Summary */}
          {candidateProgrammeCourses.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-white text-sm">
                  Programme Curriculum &amp; Examination Standing — {activeProgramme?.title}
                </span>
                <span className="text-emerald-400 font-mono text-[11px] tabular-nums">
                  {myCandidateAssessments.filter((a) => a.paperStatus === 'Passed' || a.paperStatus === 'Exempted').length} /{' '}
                  {candidateProgrammeCourses.length} Modules Cleared
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 tabular-nums">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Level</th>
                      <th className="py-3 px-3">Code</th>
                      <th className="py-3 px-4">Course / Module Title &amp; Syllabus</th>
                      <th className="py-3 px-2 text-right">Credits</th>
                      <th className="py-3 px-3 text-right">Score</th>
                      <th className="py-3 px-4">Paper Status</th>
                      <th className="py-3 px-4 text-right">Flyer &amp; Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {candidateProgrammeCourses.map((crs) => {
                      const rec = myCandidateAssessments.find((a) => a.courseId === crs.id);
                      const isCompletedPriorLevel = activeCandidate?.completedLevels.includes(crs.levelNumber);
                      return (
                        <tr key={crs.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-semibold text-slate-200 whitespace-nowrap">
                            {crs.levelLabel || formatInstituteLevelShort(crs.levelNumber)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{crs.code}</td>
                          <td className="py-2.5 px-4">
                            <span className="font-semibold text-white block">{crs.title}</span>
                            <span className="text-[10px] text-slate-400">
                              Lecturer: {crs.lecturerName} • Exam: {crs.examScheduleDate || 'TBA'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono">{crs.creditHours}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                            {rec
                              ? rec.paperStatus === 'Exempted'
                                ? 'EXEMPT'
                                : `${rec.totalScore}%`
                              : isCompletedPriorLevel
                              ? 'Cleared'
                              : '—'}
                          </td>
                          <td className="py-2.5 px-4">
                            {rec ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                  rec.paperStatus === 'Passed' || rec.paperStatus === 'Exempted'
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                                    : rec.paperStatus === 'Resit Required'
                                    ? 'bg-rose-950 text-rose-300 border-rose-700/60'
                                    : 'bg-amber-950 text-amber-300 border-amber-700/60'
                                }`}
                              >
                                {rec.paperStatus}
                              </span>
                            ) : isCompletedPriorLevel ? (
                              <span className="text-emerald-400 font-semibold text-[11px]">Level Completed</span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Registered / Upcoming</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setViewingCourseFlyer(crs)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-slate-700 rounded-md font-semibold cursor-pointer whitespace-nowrap"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Syllabus &amp; Flyer</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: COURSES, EXEMPTIONS, RESITS & PROGRESSION ELIGIBILITY */}
      {portalSection === 'courses' && (
        <div className="space-y-5">
          {progressionEval && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Automated Progression &amp; Graduation Eligibility Check
                    </h3>
                    <p className="text-slate-400 text-[11px]">
                      Evaluates passed modules, approved exemptions, resits, identity verification, and fee clearance.
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg font-bold ${
                    progressionEval.eligibleForGraduation || progressionEval.eligibleForNextLevel
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}
                >
                  {progressionEval.statusSummary}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 tabular-nums">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Current Level Papers</span>
                  <strong className="text-base text-white font-mono">
                    {progressionEval.passedOrExemptCount} / {progressionEval.mandatoryCoursesCount} Passed
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Outstanding Resits</span>
                  <strong
                    className={`text-base font-mono ${
                      progressionEval.resitRequiredCourses.length > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {progressionEval.resitRequiredCourses.length} Paper(s)
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Financial Clearance</span>
                  <strong
                    className={`text-base font-mono ${
                      progressionEval.feeClearedForGraduation ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {progressionEval.feeBalance === 0 ? '100% Cleared' : `Bal: ${formatGHS(progressionEval.feeBalance)}`}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Next Milestone</span>
                  <strong className="text-sm text-white block mt-0.5">
                    {progressionEval.currentLevel !== INSTITUTE_CERTIFICATE_LEVEL &&
                    progressionEval.currentLevel < progressionEval.maxProgrammeLevel
                      ? `Level ${progressionEval.currentLevel + 1} Registration`
                      : 'Final Graduation & Award'}
                  </strong>
                </div>
              </div>

              {progressionEval.resitRequiredCourses.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Outstanding Resit Requirement:</strong> {progressionEval.resitRequiredCourses.join(', ')}. You must pass all mandatory papers at this level before advancing.
                  </span>
                </div>
              )}
            </div>
          )}

          {activeProgramme && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
              <h4 className="font-bold text-sm text-white">Programme Structure &amp; Awarding Authority</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {activeProgramme.levels.map((lvl) => {
                  const isDone = activeCandidate?.completedLevels.includes(lvl.levelNumber);
                  const isCurrent = activeCandidate?.currentLevel === lvl.levelNumber;
                  return (
                    <div
                      key={lvl.levelNumber}
                      className={`p-4 rounded-xl border ${
                        isDone
                          ? 'bg-emerald-950/30 border-emerald-700/50'
                          : isCurrent
                          ? 'bg-slate-950 border-emerald-500'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-white">{lvl.levelTitle}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 tabular-nums">
                          {lvl.creditHoursRequired} Credits
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Pass Mark: {lvl.passMarkPercent}% • Level Tuition: {formatGHS(lvl.levelFeeAmount)}
                      </p>
                      {lvl.awardOnLevelCompletion && (
                        <p className="text-[11px] text-emerald-400 mt-2 font-medium">
                          Stage Award: {lvl.awardOnLevelCompletion}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              {activeProgramme.affiliatedProfessionalBody && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                  <strong className="text-white">Authority Distinction:</strong> Qualification{' '}
                  <em>({activeProgramme.qualificationAwarded})</em> is awarded by <strong>{school.name}</strong>.{' '}
                  {activeProgramme.professionalDesignation
                    ? `Professional designation (${activeProgramme.professionalDesignation}) is awarded separately by ${activeProgramme.affiliatedProfessionalBody}.`
                    : `Affiliated with ${activeProgramme.affiliatedProfessionalBody}.`}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: PERSONAL GRADUATE CREDENTIALS VAULT */}
      {portalSection === 'credentials' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">
                  My Digital Certificates, Official Transcripts &amp; Completion Letters
                </h3>
                <p className="text-xs text-slate-400">
                  Each completed programme or level credential is listed separately with its unique serial and shareable employer verification link.
                </p>
              </div>
            </div>

            {myCredentials.length > 0 ? (
              <div className="space-y-3">
                {myCredentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-white">{cred.qualificationAwarded}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            cred.status === 'Valid'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : cred.status === 'Pending Approval'
                              ? 'bg-amber-950 text-amber-300 border border-amber-700'
                              : 'bg-rose-950 text-rose-300 border border-rose-700'
                          }`}
                        >
                          {cred.status}
                        </span>
                      </div>
                      <p className="text-slate-300">
                        {cred.programmeTitle} • <strong>{cred.levelCompletedLabel}</strong>
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 tabular-nums pt-0.5">
                        <span>Serial: <strong className="text-emerald-400">{cred.certificateNumber}</strong></span>
                        <span>Verify Code: <strong className="text-white">{cred.verificationCode}</strong></span>
                        <span>Issued: {cred.issueDate}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCredentialModal({ cred, mode: 'certificate' })}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer whitespace-nowrap"
                      >
                        Certificate PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCredentialModal({ cred, mode: 'transcript' })}
                        className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer whitespace-nowrap"
                      >
                        Transcript
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCredentialModal({ cred, mode: 'letter' })}
                        className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer whitespace-nowrap"
                      >
                        Completion Letter
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyShareLink(cred)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-800/60 font-semibold cursor-pointer whitespace-nowrap"
                      >
                        {copiedCertId === cred.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCertId === cred.id ? 'Link Copied' : 'Share Employer Link'}</span>
                      </button>
                      {cred.status === 'Valid' && (
                        <button
                          type="button"
                          onClick={() => {
                            setReplacementTargetCred(cred);
                            setRepUpdatedName(cred.recipientFullName);
                          }}
                          className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium cursor-pointer whitespace-nowrap"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Request Replacement</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-950 rounded-xl border border-slate-800">
                No digital certificates have been issued to this account yet. Once all academic, examination, and financial graduation requirements are approved by the Registrar, your PDF certificate and verification link will appear here automatically.
              </div>
            )}
          </div>

          {myReplacementRequests.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-xs space-y-3">
              <h4 className="font-bold text-white">My Certificate Replacement Requests</h4>
              {myReplacementRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="font-mono font-bold text-white">{req.originalCertificateNumber}</span>
                    <span className="text-slate-400 ml-2">• {req.reason} ({req.requestedDate})</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{req.details}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-slate-800 text-emerald-300 font-bold whitespace-nowrap">
                    {req.status} {req.newCertificateNumber ? `(${req.newCertificateNumber})` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION: CONFIDENTIAL BECE MOCK EXAM PROGRESS & AI STUDY PLAN */}
      {portalSection === 'bece-mocks' && (
        <div className="space-y-6 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Confidential BECE Mock Examination Progress — {displayName}
            </h3>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Longitudinal mock examination results, Best-6 BECE aggregates (4 Core + 2 Best Electives), personalised revision plan, and school support interventions.
            </p>

            {myMockSeriesSummaries.some((m) => m.scores.length > 0) ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 tabular-nums">
                {myMockSeriesSummaries
                  .filter((m) => m.scores.length > 0)
                  .map(({ series, agg }) => (
                    <div key={series.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-semibold text-white">{series.shortLabel}</span>
                        <span>{series.dateConducted}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black font-mono text-emerald-400">
                          Aggregate {String(agg.aggregate).padStart(2, '0')}
                        </span>
                        <span className="text-slate-400 font-mono">Avg: {agg.averageScore}%</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80 space-y-1">
                        {agg.allSubjects.map((sub) => (
                          <div key={sub.subjectId} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-300 truncate pr-2">{sub.subjectName}</span>
                            <span className="font-mono text-white shrink-0">
                              {sub.score}% · Grade {sub.grade}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="mt-4 text-slate-400 py-4">
                No published BECE mock examination scores are recorded for {displayName} yet.
              </p>
            )}
          </div>

          {myBeceAiReport && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Personalised BECE Readiness &amp; Revision Study Plan
                  </h4>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                    {myBeceAiReport.readinessLevel} · {myBeceAiReport.predictedAggregateBand}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Generated: {myBeceAiReport.generatedAt}
                </span>
              </div>

              <p className="text-slate-300 leading-relaxed">{myBeceAiReport.executiveSummary}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myBeceAiReport.weeklyStudyPlan.map((slot, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>{slot.day}</span>
                      <span className="text-emerald-400 font-mono tabular-nums">{slot.durationMinutes} mins</span>
                    </div>
                    <div className="text-slate-200 font-semibold">{slot.focusSubject}</div>
                    <div className="text-[11px] text-slate-400">{slot.topics}</div>
                    <div className="text-[11px] text-slate-300 pt-1">{slot.activity}</div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-amber-300/90 bg-slate-950 border border-slate-800 rounded-xl p-3">
                {myBeceAiReport.guidanceDisclaimer}
              </p>
            </div>
          )}

          {myBeceInterventions.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="font-bold text-sm text-white">Assigned Academic Support &amp; Interventions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myBeceInterventions.map((inv) => (
                  <div key={inv.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{inv.subjectName} — {inv.interventionType}</span>
                      <span className="text-emerald-400 font-semibold">{inv.status}</span>
                    </div>
                    <p className="text-slate-400">{inv.focusTopics}</p>
                    <p className="text-[11px] text-slate-300 font-mono tabular-nums">
                      Baseline Score: {inv.baselineScore}%
                      {typeof inv.followUpScore === 'number'
                        ? ` → Follow-up Score: ${inv.followUpScore}% (${inv.followUpScore - inv.baselineScore >= 0 ? '+' : ''}${inv.followUpScore - inv.baselineScore}%)`
                        : ' · Awaiting next mock comparison'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: PERMITTED PERSONAL DETAILS, PASSPORT PHOTOGRAPH & DIRECTORY CONSENT */}
      {portalSection === 'profile' && (
        <div className="space-y-6 max-w-3xl text-xs">
          {/* Student / Guardian Passport Photograph Management Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={displayPhoto}
                  alt={displayName}
                  className="w-20 h-26 rounded-xl object-cover border-2 border-emerald-500 shrink-0"
                />
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    Official Student Passport Photograph
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                    Displayed across student ID cards, class registers, attendance sheets, examination records, and terminal report cards. Photograph updates by students or parents are logged and reviewed by school administrators for accountability.
                  </p>
                </div>
              </div>
              {targetPhotoEntityId && (
                <button
                  type="button"
                  onClick={() => setShowPhotoUploadModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer whitespace-nowrap self-start sm:self-center"
                >
                  Upload / Crop New Photo
                </button>
              )}
            </div>

            {myPhotoRequests.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300 block">
                  Photograph Change &amp; Verification History
                </span>
                {myPhotoRequests.slice(0, 4).map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={req.newPhoto}
                        alt="Submitted"
                        className="w-9 h-12 rounded object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-white font-semibold">
                          Submitted {req.requestedAt} by {req.requestedByName}
                        </div>
                        {req.reviewNote && (
                          <div className="text-[11px] text-slate-400 truncate">{req.reviewNote}</div>
                        )}
                      </div>
                    </div>
                    <span
                      className={`font-semibold whitespace-nowrap ${
                        req.status === 'Approved'
                          ? 'text-emerald-400'
                          : req.status === 'Declined'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={handleSavePersonalDetails}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5"
          >
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Permitted Personal Profile &amp; Employer Directory Consent
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Legal name, date of birth, and examination records are locked by the Registrar. You may update your contact details and control whether employers can find you in the Public Graduate Directory.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Official Registered Name (Registrar Locked)</label>
                <input
                  type="text"
                  disabled
                  value={displayName}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Candidate / Student ID (Permanent)</label>
                <input
                  type="text"
                  disabled
                  value={displayIdNumber}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-400 cursor-not-allowed tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Personal Contact Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mobile / Telephone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">
                  Professional Title / Current Organisation (Shown in Alumni Directory if consented)
                </label>
                <input
                  type="text"
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  placeholder="e.g. Senior Tax Associate • Deloitte Ghana"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <label className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div className="flex items-start gap-3">
                {editDirectoryConsent ? (
                  <Globe className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold text-white block">
                    Consent to Appear in Public Employer Graduate Directory
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    When enabled, prospective employers and recruitment agencies may discover your name, qualification awarded, graduation year, and professional profile in public directory searches. If disabled, you are hidden from public search, while your individual certificate verification links still remain active whenever you choose to share them.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={editDirectoryConsent}
                onChange={(e) => setEditDirectoryConsent(e.target.checked)}
                className="accent-emerald-500 w-4 h-4 mt-1 shrink-0"
              />
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              {profileSavedNotice && (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Preferences saved
                </span>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer whitespace-nowrap"
              >
                Save Profile &amp; Privacy Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Replacement Certificate Request Modal */}
      {replacementTargetCred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <form
            onSubmit={handleSubmitReplacement}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-slate-200 space-y-4 text-xs"
          >
            <div>
              <h3 className="font-bold text-base text-white">Request Official Replacement Certificate</h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Original Serial: <strong className="font-mono text-emerald-400">{replacementTargetCred.certificateNumber}</strong>. Once approved by the Registrar, the original serial will be marked <em>Replaced</em> in the audit log and superseded by a new serial.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Reason for Replacement *</label>
              <select
                value={repReason}
                onChange={(e) => setRepReason(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              >
                <option value="Damaged Physical Copy">Damaged Physical Copy</option>
                <option value="Legal Name Correction">Gazetted Legal Name Correction</option>
                <option value="Lost Credential Re-issue">Lost Credential Re-issue</option>
                <option value="Signatory / Administrative Update">Administrative Update</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Confirmed Recipient Name</label>
              <input
                type="text"
                required
                value={repUpdatedName}
                onChange={(e) => setRepUpdatedName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Supporting Details / Gazette Reference *</label>
              <textarea
                required
                rows={3}
                value={repDetails}
                onChange={(e) => setRepDetails(e.target.value)}
                placeholder="Provide brief justification for the Registrar..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReplacementTargetCred(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Money Settlement Modal */}
      {showMomoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-slate-200 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-lg text-white">Instant Mobile Money Fee Settlement</h3>
            </div>
            <form onSubmit={handleSendMomo} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2">
                {(['MTN Mobile Money', 'Telecel Cash', 'AT Money'] as const).map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setMomoNetwork(net)}
                    className={`p-2 rounded-xl text-center font-bold border transition cursor-pointer ${
                      momoNetwork === net
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {net.split(' ')[0]}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Mobile Money Number *</label>
                <input
                  type="tel"
                  required
                  value={momoNumber}
                  onChange={(e) => setMomoNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Amount ({school.currency}) *</label>
                <input
                  type="number"
                  required
                  value={momoAmount}
                  onChange={(e) => setMomoAmount(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm"
                />
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMomoModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={momoPromptSent}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {momoPromptSent ? 'Processing...' : `Approve & Pay ${school.currency} ${momoAmount}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeReportStudent && (
        <ReportCardModal student={activeReportStudent} onClose={() => setActiveReportStudent(null)} />
      )}

      <CertificateDocumentModal
        credential={selectedCredentialModal?.cred || null}
        initialDocMode={selectedCredentialModal?.mode || 'certificate'}
        onClose={() => setSelectedCredentialModal(null)}
      />

      <CourseDetailFlyerModal
        course={viewingCourseFlyer}
        programmeTitle={activeProgramme?.title}
        institutionName={school.name}
        onClose={() => setViewingCourseFlyer(null)}
      />

      <ImageUploadModal
        isOpen={showPhotoUploadModal}
        onClose={() => setShowPhotoUploadModal(false)}
        targetType="student"
        currentImage={displayPhoto}
        title="Upload & Crop Student Passport Photograph"
        entityName={displayName}
        entityRoleOrCode={displayIdNumber}
        onSave={(newPhotoUrl) => {
          if (!targetPhotoEntityId) return;
          const result = submitStudentPhotoRequest({
            studentId: targetPhotoEntityId,
            newPhoto: newPhotoUrl,
          });
          setPhotoFeedbackMsg(
            result.immediateApplied
              ? 'Passport photograph updated and applied to institutional records.'
              : 'Passport photograph submitted for school administrator verification.'
          );
          setTimeout(() => setPhotoFeedbackMsg(null), 4500);
        }}
      />
    </div>
  );
};
