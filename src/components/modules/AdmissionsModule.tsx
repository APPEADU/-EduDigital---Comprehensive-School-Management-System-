import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { AdmissionApplication, isInstituteLevelType } from '../../types';
import { ImageUploadModal } from '../modals/ImageUploadModal';
import {
  UserPlus,
  FileText,
  CheckCircle,
  XCircle,
  Printer,
  Search,
  Plus,
  Trash2,
  Camera,
  ShieldCheck,
  User,
  Layers,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

export const AdmissionsModule: React.FC = () => {
  const {
    school,
    schools,
    currentUser,
    isPlatformAdmin,
    admissions,
    addAdmission,
    updateAdmissionStatus,
    deleteAdmission,
    classes,
    educationalSections,
    gradeClasses,
    staff,
    users,
    courseTracks,
    addCourseTrack,
    reviewAdmissionPhoto,
    photoChangeRequests,
    reviewStudentPhotoRequest,
    resolveTeacherDisplayName,
    checkDuplicateStudentEnrolment,
    enrollStudentWithPlacement,
    addClassStream,
  } = useSchool();

  const isAdminReviewer =
    currentUser.role === 'proprietor' || currentUser.role === 'admin' || isPlatformAdmin;
  const isInstitute = isInstituteLevelType(school.levelType);
  const isSchoolUninitialized = school.id === 'sch-uninitialized' && schools.length === 0;

  const activeSections = useMemo(
    () =>
      [...educationalSections]
        .filter((s) => s.active)
        .sort((a, b) => a.order - b.order),
    [educationalSections]
  );

  const activeGrades = useMemo(
    () =>
      [...gradeClasses]
        .filter((g) => g.active && activeSections.some((s) => s.id === g.sectionId))
        .sort((a, b) => a.order - b.order),
    [gradeClasses, activeSections]
  );

  const activeStreams = useMemo(
    () => classes.filter((c) => c.active !== false),
    [classes]
  );

  const teacherOptions = useMemo(() => {
    const map = new Map<string, string>();
    users
      .filter((u) => u.role === 'teacher' || u.role === 'admin' || u.role === 'proprietor')
      .forEach((u) => {
        map.set(u.id, `${u.name} (${u.title || u.role})`);
      });
    staff
      .filter((st) => st.activeStatus !== false)
      .forEach((st) => {
        if (!map.has(st.id)) {
          map.set(st.id, `${st.fullName} (${st.role})`);
        }
      });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [users, staff]);

  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [activeAdmissionLetter, setActiveAdmissionLetter] = useState<AdmissionApplication | null>(
    null
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Passport photograph upload states
  const [showFormPhotoModal, setShowFormPhotoModal] = useState(false);
  const [editingApplicantPhotoTarget, setEditingApplicantPhotoTarget] =
    useState<AdmissionApplication | null>(null);
  const [photoReviewModalApp, setPhotoReviewModalApp] = useState<AdmissionApplication | null>(null);
  const [photoReviewNote, setPhotoReviewNote] = useState('');

  const defaultProgramme =
    courseTracks[0]?.name ||
    (isInstitute
      ? 'Certificate Programme'
      : school.levelType === 'Basic & JHS'
      ? 'GES Standard Curriculum'
      : 'General Science');

  // New Admission Form State with linked Section -> Class/Grade -> Stream -> Teacher
  const [useCustomCourseInput, setUseCustomCourseInput] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [showInlineApplyStream, setShowInlineApplyStream] = useState(false);
  const [inlineApplyStreamDiv, setInlineApplyStreamDiv] = useState('A');
  const [formData, setFormData] = useState({
    academicYear: school.currentAcademicYear || '2025/2026',
    sectionId: '',
    gradeId: '',
    applyingForClassId: '',
    applyingForStream: '',
    assignedClassTeacherId: '',
    applicantName: '',
    gender: 'Male' as 'Male' | 'Female',
    dob: '',
    programme: defaultProgramme,
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    previousSchool: '',
    beceScore: 8,
    photo: '',
  });

  // Direct Enrolment & Class/Stream Placement Modal State (when admitting into Student Registry)
  const [enrollingApplicant, setEnrollingApplicant] = useState<AdmissionApplication | null>(null);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [placementForm, setPlacementForm] = useState({
    academicYear: school.currentAcademicYear || '2024/2025',
    sectionId: '',
    gradeId: '',
    classId: '',
    classTeacherId: '',
    programme: '',
    boardingStatus: (school.levelType === 'Basic & JHS' ? 'Day' : 'Boarding') as 'Boarding' | 'Day',
  });

  const pendingStudentPhotoRequests = photoChangeRequests.filter(
    (r) => r.status === 'Pending Review'
  );

  // Linked options for Admission Form
  const formGradesForSection = useMemo(
    () =>
      formData.sectionId
        ? activeGrades.filter((g) => g.sectionId === formData.sectionId)
        : [],
    [activeGrades, formData.sectionId]
  );

  const formStreamsForGrade = useMemo(
    () =>
      formData.gradeId
        ? activeStreams.filter((c) => c.gradeId === formData.gradeId)
        : [],
    [activeStreams, formData.gradeId]
  );

  // Linked options for Official Enrolment Placement Modal
  const placementGradesForSection = useMemo(
    () =>
      placementForm.sectionId
        ? activeGrades.filter((g) => g.sectionId === placementForm.sectionId)
        : [],
    [activeGrades, placementForm.sectionId]
  );

  const placementStreamsForGrade = useMemo(
    () =>
      placementForm.gradeId
        ? activeStreams.filter((c) => c.gradeId === placementForm.gradeId)
        : [],
    [activeStreams, placementForm.gradeId]
  );

  const filteredAdmissions = admissions.filter((app) => {
    const matchesSearch = `${app.applicantName} ${app.applicationNumber} ${app.parentName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openApplyModal = () => {
    if (isSchoolUninitialized) {
      setFeedbackNotice({
        type: 'error',
        text: 'Please register an institution first using "+ Register School" in the top bar before submitting admissions.',
      });
      return;
    }

    const defaultSec = activeSections[0];
    const defaultGrd = defaultSec
      ? activeGrades.find((g) => g.sectionId === defaultSec.id)
      : undefined;
    const defaultCls = defaultGrd
      ? activeStreams.find((c) => c.gradeId === defaultGrd.id)
      : undefined;

    setApplyError(null);
    setUseCustomCourseInput(false);
    setShowInlineApplyStream(false);
    setInlineApplyStreamDiv('B');
    setFormData((prev) => ({
      ...prev,
      academicYear: school.currentAcademicYear || '2025/2026',
      sectionId: defaultSec?.id || '',
      gradeId: defaultGrd?.id || '',
      applyingForClassId: defaultCls?.id || '',
      applyingForStream: defaultCls?.stream || 'A',
      assignedClassTeacherId: defaultCls?.formTutorTeacherId || '',
      programme: defaultCls?.programme || defaultProgramme,
    }));
    setShowApplyModal(true);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(null);

    if (!formData.applicantName.trim()) {
      setApplyError('Please enter the Applicant Full Name.');
      return;
    }
    if (!formData.academicYear.trim()) {
      setApplyError('Please specify the Academic Year for admission.');
      return;
    }
    if (!formData.sectionId) {
      setApplyError('Please select an Educational Section for this admission application.');
      return;
    }
    if (!formData.gradeId) {
      setApplyError('Please select a Class / Grade within the selected Educational Section.');
      return;
    }
    if (!formData.parentName.trim() || !formData.parentPhone.trim()) {
      setApplyError('Please enter the Parent / Guardian Name and Phone Number.');
      return;
    }

    let resolvedClassId = formData.applyingForClassId;
    if (!resolvedClassId || resolvedClassId === '__auto_a__') {
      const existingStream = activeStreams.find((c) => c.gradeId === formData.gradeId);
      if (existingStream) {
        resolvedClassId = existingStream.id;
      } else {
        const targetGrd = gradeClasses.find((g) => g.id === formData.gradeId);
        const createdRes = addClassStream({
          gradeId: formData.gradeId,
          streamDivision: 'A',
          programme: targetGrd?.isShs ? formData.programme : undefined,
        });
        if (createdRes.success && createdRes.classRoom) {
          resolvedClassId = createdRes.classRoom.id;
        } else {
          resolvedClassId = classes.find((c) => c.gradeId === formData.gradeId)?.id || classes[0]?.id;
        }
      }
    }

    // Check duplicate against enrolled students in this institution & academic year
    const nameParts = formData.applicantName.trim().split(/\s+/).filter(Boolean);
    const fName = nameParts[0] || '';
    const lName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : fName;
    const oNames = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : undefined;
    const dupEnrolled = checkDuplicateStudentEnrolment({
      firstName: fName,
      lastName: lName,
      otherNames: oNames,
      dob: formData.dob,
      academicYear: formData.academicYear.trim(),
      guardianPhone: formData.parentPhone.trim(),
    });
    if (dupEnrolled.isDuplicate) {
      setApplyError(
        dupEnrolled.reason ||
          'This student is already enrolled in this institution for the selected academic year.'
      );
      return;
    }

    // Check duplicate active application in same academic year
    const dupApplication = admissions.find(
      (a) =>
        a.status !== 'Rejected' &&
        (a.academicYear || school.currentAcademicYear) === formData.academicYear.trim() &&
        a.applicantName.trim().toLowerCase() === formData.applicantName.trim().toLowerCase() &&
        a.dob === formData.dob
    );
    if (dupApplication) {
      setApplyError(
        `Duplicate application prevented: ${dupApplication.applicantName} (${dupApplication.applicationNumber}) already has an active application for ${formData.academicYear.trim()}.`
      );
      return;
    }

    const chosenProgramme = formData.programme.trim() || defaultProgramme;
    if (
      useCustomCourseInput &&
      chosenProgramme &&
      !courseTracks.some((ct) => ct.name.toLowerCase() === chosenProgramme.toLowerCase())
    ) {
      addCourseTrack({
        code: '',
        name: chosenProgramme,
        department: 'General Academics',
        category: 'Custom Course',
      });
    }

    const selectedSec = educationalSections.find((s) => s.id === formData.sectionId);
    const selectedCls = classes.find((c) => c.id === resolvedClassId);
    const selectedGrd = gradeClasses.find((g) => g.id === formData.gradeId);

    addAdmission({
      applicantName: formData.applicantName.trim(),
      gender: formData.gender,
      dob: formData.dob || '2012-01-01',
      academicYear: formData.academicYear.trim(),
      sectionId: formData.sectionId,
      sectionName: selectedSec?.name,
      gradeId: formData.gradeId,
      applyingForClassId: resolvedClassId,
      applyingForStream: selectedCls?.stream || formData.applyingForStream || 'A',
      applyingForClass: selectedCls?.name || selectedGrd?.name || 'Assigned Class',
      assignedClassTeacherId:
        formData.assignedClassTeacherId || selectedCls?.formTutorTeacherId || undefined,
      assignedClassTeacherName: resolveTeacherDisplayName(
        formData.assignedClassTeacherId || selectedCls?.formTutorTeacherId,
        selectedCls?.classTeacherName
      ),
      programme: selectedCls?.programme || chosenProgramme,
      parentName: formData.parentName.trim(),
      parentPhone: formData.parentPhone.trim(),
      parentEmail: formData.parentEmail.trim(),
      previousSchool: formData.previousSchool.trim() || 'Direct Entry',
      beceScore: formData.beceScore,
      photo: formData.photo,
    });

    setShowApplyModal(false);
    setUseCustomCourseInput(false);
    setFeedbackNotice({
      type: 'success',
      text: `Admission application submitted for ${formData.applicantName.trim()} (${selectedCls?.name || selectedGrd?.name}).`,
    });
    setTimeout(() => setFeedbackNotice(null), 4500);
    setFormData((prev) => ({
      ...prev,
      applicantName: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      previousSchool: '',
      photo: '',
    }));
  };

  // Open Official Enrolment & Class/Stream Placement Modal
  const openEnrollApplicantModal = (app: AdmissionApplication) => {
    setPlacementError(null);
    const matchedCls =
      (app.applyingForClassId && activeStreams.find((c) => c.id === app.applyingForClassId)) ||
      activeStreams.find((c) =>
        c.name.toLowerCase().includes((app.applyingForClass || '').toLowerCase())
      ) ||
      activeStreams[0];

    const matchedGrdId =
      app.gradeId || matchedCls?.gradeId || activeGrades[0]?.id || '';
    const matchedSecId =
      app.sectionId ||
      matchedCls?.sectionId ||
      activeGrades.find((g) => g.id === matchedGrdId)?.sectionId ||
      activeSections[0]?.id ||
      '';

    setPlacementForm({
      academicYear: app.academicYear || school.currentAcademicYear || '2024/2025',
      sectionId: matchedSecId,
      gradeId: matchedGrdId,
      classId: matchedCls?.id || '',
      classTeacherId:
        app.assignedClassTeacherId || matchedCls?.formTutorTeacherId || '',
      programme: app.programme || matchedCls?.programme || defaultProgramme,
      boardingStatus: school.levelType === 'Basic & JHS' ? 'Day' : 'Boarding',
    });
    setEnrollingApplicant(app);
  };

  const handleConfirmApplicantPlacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollingApplicant) return;
    setPlacementError(null);

    if (!placementForm.academicYear.trim()) {
      setPlacementError('Please enter the Academic Year for student enrolment.');
      return;
    }
    if (!placementForm.sectionId) {
      setPlacementError('Please select an Educational Section before enrolling this applicant.');
      return;
    }
    if (!placementForm.gradeId) {
      setPlacementError('Please select a Class / Grade within the chosen Educational Section.');
      return;
    }
    const names = enrollingApplicant.applicantName.trim().split(/\s+/).filter(Boolean);
    const firstName = names[0] || 'Student';
    const lastName = names.length > 1 ? names[names.length - 1] : 'Learner';
    const otherNames = names.length > 2 ? names.slice(1, -1).join(' ') : undefined;
    const targetCls = classes.find((c) => c.id === placementForm.classId);
    const targetSec = educationalSections.find((s) => s.id === placementForm.sectionId);
    const targetGrd = gradeClasses.find((g) => g.id === placementForm.gradeId);

    const res = enrollStudentWithPlacement({
      firstName,
      lastName,
      otherNames,
      gender: enrollingApplicant.gender,
      dob: enrollingApplicant.dob || '2012-01-01',
      photo: enrollingApplicant.photo || '',
      academicYear: placementForm.academicYear.trim(),
      sectionId: placementForm.sectionId,
      sectionName: targetSec?.name,
      gradeId: placementForm.gradeId,
      gradeName: targetGrd?.name,
      classId: placementForm.classId,
      stream: targetCls?.stream || 'A',
      classTeacherId: placementForm.classTeacherId || targetCls?.formTutorTeacherId,
      classTeacherName: resolveTeacherDisplayName(
        placementForm.classTeacherId || targetCls?.formTutorTeacherId,
        targetCls?.classTeacherName
      ),
      programme: targetCls?.programme || placementForm.programme || 'General',
      boardingStatus: placementForm.boardingStatus,
      guardianName: enrollingApplicant.parentName,
      guardianPhone: enrollingApplicant.parentPhone,
      guardianEmail: enrollingApplicant.parentEmail,
      guardianRelationship: 'Parent / Guardian',
      emergencyContact: enrollingApplicant.parentPhone,
      medicalInfo: 'Standard clearance',
      previousSchool: enrollingApplicant.previousSchool,
      beceAggregate: enrollingApplicant.beceScore,
      admissionApplicationId: enrollingApplicant.id,
    });

    if (!res.success) {
      setPlacementError(res.message || 'Unable to enrol student. Please review placement fields.');
      return;
    }

    if (enrollingApplicant.photo && enrollingApplicant.photoApprovalStatus !== 'Approved') {
      reviewAdmissionPhoto(
        enrollingApplicant.id,
        'Approved',
        'Approved upon enrolment and class/stream placement.'
      );
    }

    setFeedbackNotice({
      type: 'success',
      text:
        res.message ||
        `${enrollingApplicant.applicantName} enrolled and placed into ${targetCls?.name}.`,
    });
    setTimeout(() => setFeedbackNotice(null), 5000);
    setEnrollingApplicant(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            Admissions Portal &amp; Direct Class/Stream Enrolment
          </h2>
          <p className="text-xs text-slate-400">
            Receive online applications with linked Section, Class &amp; Stream choices, verify passport photos, and place admitted students directly into class registers.
          </p>
        </div>

        <button
          type="button"
          onClick={openApplyModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer self-start sm:self-auto whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Submit Online Application
        </button>
      </div>

      {isSchoolUninitialized && (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-700/60 text-amber-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">No Institution Registered Yet:</strong> Click{' '}
            <strong className="text-emerald-300">+ Register School</strong> in the top header bar to onboard your school first, then submit admission applications directly into its classes and streams.
          </div>
        </div>
      )}

      {feedbackNotice && (
        <div
          className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border text-xs font-medium ${
            feedbackNotice.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
              : 'bg-rose-950/60 border-rose-700/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedbackNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Authorised Administrator Queue: Enrolled Student/Parent Profile Picture Change Requests */}
      {isAdminReviewer && pendingStudentPhotoRequests.length > 0 && (
        <div className="bg-slate-900 border border-amber-700/40 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Pending Student &amp; Guardian Passport Photograph Changes (
                {pendingStudentPhotoRequests.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review photographs uploaded from Student or Parent Portals before updating ID cards, attendance sheets, and report cards.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingStudentPhotoRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-1.5 shrink-0">
                    {req.previousPhoto ? (
                      <img
                        src={req.previousPhoto}
                        alt="Current"
                        className="w-10 h-12 rounded-lg object-cover border border-slate-700 opacity-65"
                        title="Current Photo"
                      />
                    ) : (
                      <div className="w-10 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <span className="text-slate-500">→</span>
                    <img
                      src={req.newPhoto}
                      alt="Proposed Passport"
                      className="w-11 h-14 rounded-lg object-cover border-2 border-emerald-500"
                      title="Proposed New Passport Photo"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{req.studentName}</div>
                    <div className="font-mono text-[11px] text-emerald-400 tabular-nums">
                      {req.studentNumber}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      By {req.requestedByName} ({req.requestedByRole}) · {req.requestedAt}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => reviewStudentPhotoRequest(req.id, true)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer whitespace-nowrap"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewStudentPhotoRequest(req.id, false)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 rounded-lg text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by applicant name, guardian, or APP number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-slate-400 text-xs mr-1">Stage:</span>
          {['All', 'Pending', 'Interview', 'Approved', 'Enrolled', 'Rejected'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Admissions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Applicant &amp; Passport Photo</th>
                <th className="py-3 px-3">Application ID</th>
                <th className="py-3 px-3">Section, Class &amp; Stream</th>
                <th className="py-3 px-3">Entry Score</th>
                <th className="py-3 px-3">Guardian Contact</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions &amp; Decisions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAdmissions.length > 0 ? (
                filteredAdmissions.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            isAdminReviewer
                              ? setPhotoReviewModalApp(app)
                              : setEditingApplicantPhotoTarget(app)
                          }
                          title="Click to inspect, crop, or update applicant passport photograph"
                          className="relative w-10 h-12 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 hover:border-emerald-500 flex items-center justify-center shrink-0 group cursor-pointer"
                        >
                          {app.photo ? (
                            <img
                              src={app.photo}
                              alt={app.applicantName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{app.applicantName}</div>
                          <div className="text-[11px] text-slate-400">
                            {app.gender} · {app.previousSchool || 'Direct Entry'}
                          </div>
                          <div className="text-[11px] mt-0.5 flex items-center gap-1.5">
                            {app.photo ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setPhotoReviewNote(app.photoReviewNote || '');
                                  setPhotoReviewModalApp(app);
                                }}
                                className={`underline cursor-pointer ${
                                  app.photoApprovalStatus === 'Approved'
                                    ? 'text-emerald-400'
                                    : app.photoApprovalStatus === 'Revision Requested'
                                    ? 'text-rose-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                Photo: {app.photoApprovalStatus || 'Pending Review'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingApplicantPhotoTarget(app)}
                                className="text-slate-400 hover:text-emerald-400 underline cursor-pointer"
                              >
                                + Upload Passport Photo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-emerald-400 tabular-nums">
                      {app.applicationNumber}
                      <span className="block text-[10px] font-normal text-slate-500">
                        {app.academicYear || school.currentAcademicYear}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {app.sectionName && (
                        <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold block">
                          {app.sectionName}
                        </span>
                      )}
                      <span className="font-semibold text-white block">{app.applyingForClass}</span>
                      <span className="text-[11px] text-slate-400">
                        {app.applyingForStream ? `Stream ${app.applyingForStream} · ` : ''}
                        {app.programme}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-amber-400 tabular-nums">
                      Aggregate {app.beceScore}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-200 block">{app.parentName}</span>
                      <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                        {app.parentPhone}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold">
                      <span
                        className={
                          app.status === 'Approved'
                            ? 'text-emerald-400'
                            : app.status === 'Enrolled'
                            ? 'text-sky-400'
                            : app.status === 'Interview'
                            ? 'text-amber-400'
                            : app.status === 'Pending'
                            ? 'text-slate-300'
                            : 'text-rose-400'
                        }
                      >
                        {app.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {app.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateAdmissionStatus(app.id, 'Interview')}
                              className="px-2.5 py-1 bg-slate-800 text-amber-300 hover:bg-slate-700 rounded-lg text-[11px] font-semibold border border-slate-700 transition cursor-pointer whitespace-nowrap"
                            >
                              Schedule Interview
                            </button>
                            <button
                              type="button"
                              onClick={() => updateAdmissionStatus(app.id, 'Approved')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
                            >
                              Approve
                            </button>
                          </>
                        )}

                        {app.status === 'Interview' && (
                          <button
                            type="button"
                            onClick={() => updateAdmissionStatus(app.id, 'Approved')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
                          >
                            Pass &amp; Admit
                          </button>
                        )}

                        {app.status === 'Approved' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setActiveAdmissionLetter(app)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg text-[11px] font-semibold border border-slate-700 transition cursor-pointer whitespace-nowrap"
                            >
                              <FileText className="w-3 h-3 text-emerald-400" />
                              Offer Letter
                            </button>
                            <button
                              type="button"
                              onClick={() => openEnrollApplicantModal(app)}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap"
                            >
                              Place &amp; Enrol
                            </button>
                          </>
                        )}

                        {app.status === 'Enrolled' && (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 whitespace-nowrap">
                            <CheckCircle className="w-3.5 h-3.5" /> Enrolled
                          </span>
                        )}

                        {confirmDeleteId === app.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                deleteAdmission(app.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] cursor-pointer whitespace-nowrap"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(app.id)}
                            className="p-1.5 hover:bg-rose-950/70 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                            title="Delete Application"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No admission applications recorded yet. Click &ldquo;Submit Online Application&rdquo; to register an applicant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Online Admission Application Modal (with Linked Section -> Class/Grade -> Stream -> Teacher) */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full text-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-lg text-white">
                  Online Student Admission &amp; Class/Stream Placement Form
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select the Academic Year, Educational Section, Class/Grade, and Stream to link this admission directly to the official class register.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} noValidate className="space-y-4 text-xs">
              {applyError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-700/60 text-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{applyError}</span>
                </div>
              )}

              {/* Applicant Passport Photograph Upload Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-slate-900 border-2 border-emerald-500/70 flex items-center justify-center shrink-0">
                    {formData.photo ? (
                      <img
                        src={formData.photo}
                        alt="Applicant Passport Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-7 h-7 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-white block">Applicant Passport Photograph</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      JPG, PNG, or WEBP · Max 5 MB · Includes crop &amp; passport frame studio
                    </span>
                    {formData.photo && (
                      <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                        Passport photograph attached &amp; sized
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFormPhotoModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap self-start sm:self-center"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{formData.photo ? 'Change / Crop Photo' : 'Upload Passport Photo'}</span>
                </button>
              </div>

              {/* Linked Academic Section, Class & Stream Placement */}
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-800/40 space-y-3">
                <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Academic Year, Educational Section, Class &amp; Stream Selection
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Academic Year *</label>
                    <input
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) => {
                        setApplyError(null);
                        setFormData({ ...formData, academicYear: e.target.value });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Educational Section *</label>
                    <select
                      value={formData.sectionId}
                      onChange={(e) => {
                        setApplyError(null);
                        const nextSecId = e.target.value;
                        const firstGrd = nextSecId
                          ? activeGrades.find((g) => g.sectionId === nextSecId)
                          : undefined;
                        const firstCls = firstGrd
                          ? activeStreams.find((c) => c.gradeId === firstGrd.id)
                          : undefined;
                        setFormData({
                          ...formData,
                          sectionId: nextSecId,
                          gradeId: firstGrd?.id || '',
                          applyingForClassId: firstCls?.id || '',
                          applyingForStream: firstCls?.stream || 'A',
                          assignedClassTeacherId: firstCls?.formTutorTeacherId || '',
                          programme: firstCls?.programme || formData.programme,
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Select Educational Section --</option>
                      {activeSections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Class / Grade *</label>
                    <select
                      value={formData.gradeId}
                      disabled={!formData.sectionId}
                      onChange={(e) => {
                        setApplyError(null);
                        const grdId = e.target.value;
                        const streams = activeStreams.filter((c) => c.gradeId === grdId);
                        const firstStream = streams[0];
                        setInlineApplyStreamDiv(String.fromCharCode(65 + Math.min(streams.length, 7)));
                        setFormData({
                          ...formData,
                          gradeId: grdId,
                          applyingForClassId: firstStream?.id || '',
                          applyingForStream: firstStream?.stream || 'A',
                          assignedClassTeacherId: firstStream?.formTutorTeacherId || '',
                          programme: firstStream?.programme || formData.programme,
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value="">
                        {formData.sectionId
                          ? '-- Select Class / Grade --'
                          : 'Select Section first'}
                      </option>
                      {formGradesForSection.map((grd) => (
                        <option key={grd.id} value={grd.id}>
                          {grd.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="block text-slate-400">
                        Stream / Division *{' '}
                        <span className="text-[10px] text-slate-500">
                          (Linked to selected Class)
                        </span>
                      </label>
                      {formData.gradeId && (
                        <button
                          type="button"
                          onClick={() => setShowInlineApplyStream((prev) => !prev)}
                          className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer whitespace-nowrap"
                        >
                          {showInlineApplyStream ? 'Hide' : '+ Add Stream'}
                        </button>
                      )}
                    </div>
                    <select
                      value={formData.applyingForClassId}
                      disabled={!formData.gradeId}
                      onChange={(e) => {
                        setApplyError(null);
                        if (e.target.value === '__create_new_stream__') {
                          setShowInlineApplyStream(true);
                          return;
                        }
                        const clsObj = activeStreams.find((c) => c.id === e.target.value);
                        setFormData({
                          ...formData,
                          applyingForClassId: e.target.value,
                          applyingForStream: clsObj?.stream || '',
                          assignedClassTeacherId:
                            clsObj?.formTutorTeacherId || formData.assignedClassTeacherId,
                          programme: clsObj?.programme || formData.programme,
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      {!formData.gradeId ? (
                        <option value="">Select Class / Grade first</option>
                      ) : formStreamsForGrade.length === 0 ? (
                        <option value="">Stream A (Auto-created on Submit)</option>
                      ) : (
                        <option value="">-- Select Stream / Division --</option>
                      )}
                      {formStreamsForGrade.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} (Stream {cls.stream})
                        </option>
                      ))}
                      {formData.gradeId && (
                        <option value="__create_new_stream__">
                          + Create another Stream (A, B, C, D...)
                        </option>
                      )}
                    </select>
                    {formData.gradeId && (showInlineApplyStream || formStreamsForGrade.length === 0) && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={inlineApplyStreamDiv}
                          onChange={(e) => setInlineApplyStreamDiv(e.target.value)}
                          placeholder="e.g. A, B, C"
                          className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const targetGrd = gradeClasses.find((g) => g.id === formData.gradeId);
                            const res = addClassStream({
                              gradeId: formData.gradeId,
                              streamDivision: inlineApplyStreamDiv.trim() || 'A',
                              programme: targetGrd?.isShs ? formData.programme : undefined,
                            });
                            if (res.success && res.classRoom) {
                              setFormData((prev) => ({
                                ...prev,
                                applyingForClassId: res.classRoom!.id,
                                applyingForStream: res.classRoom!.stream,
                              }));
                              setShowInlineApplyStream(false);
                              setApplyError(null);
                            } else if (res.message) {
                              setApplyError(res.message);
                            }
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer whitespace-nowrap"
                        >
                          + Create Stream
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">
                      Class Teacher (Where Applicable)
                    </label>
                    <select
                      value={formData.assignedClassTeacherId}
                      onChange={(e) =>
                        setFormData({ ...formData, assignedClassTeacherId: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Stream Form Teacher --</option>
                      {teacherOptions.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Applicant Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.applicantName}
                    onChange={(e) => {
                      setApplyError(null);
                      setFormData({ ...formData, applicantName: e.target.value });
                    }}
                    placeholder="e.g. Jessica Naa Darko"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Course / Programme / Track</label>
                  {!useCustomCourseInput && courseTracks.length > 0 ? (
                    <select
                      value={
                        courseTracks.some((ct) => ct.name === formData.programme)
                          ? formData.programme
                          : courseTracks[0]?.name || ''
                      }
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setUseCustomCourseInput(true);
                          setFormData({ ...formData, programme: '' });
                        } else {
                          setFormData({ ...formData, programme: e.target.value });
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      {courseTracks.map((ct) => (
                        <option key={ct.id} value={ct.name}>
                          {ct.name}
                          {ct.isCustom ? ' (School Custom)' : ''}
                        </option>
                      ))}
                      <option value="__custom__">+ State Custom Course / Programme...</option>
                    </select>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={formData.programme}
                        onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
                        placeholder="State custom course / programme..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      />
                      {courseTracks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setUseCustomCourseInput(false);
                            setFormData({
                              ...formData,
                              programme: courseTracks[0]?.name || defaultProgramme,
                            });
                          }}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                        >
                          Choose from school courses list
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Entry / BECE Aggregate (6–54)</label>
                  <input
                    type="number"
                    min={6}
                    max={54}
                    value={formData.beceScore}
                    onChange={(e) =>
                      setFormData({ ...formData, beceScore: parseInt(e.target.value, 10) || 12 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono tabular-nums"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Previous School Attended</label>
                  <input
                    type="text"
                    value={formData.previousSchool}
                    onChange={(e) =>
                      setFormData({ ...formData, previousSchool: e.target.value })
                    }
                    placeholder="e.g. Morning Star Basic School"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h4 className="font-bold text-slate-300 mb-2">
                  Authorised Parent / Guardian Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Parent / Guardian Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.parentName}
                      onChange={(e) => {
                        setApplyError(null);
                        setFormData({ ...formData, parentName: e.target.value });
                      }}
                      placeholder="e.g. Mr. Samuel Frimpong"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.parentPhone}
                      onChange={(e) => {
                        setApplyError(null);
                        setFormData({ ...formData, parentPhone: e.target.value });
                      }}
                      placeholder="+233 24 555 1234"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Guardian Email</label>
                    <input
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                      placeholder="guardian@email.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                >
                  Submit Admission Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Enrolment & Class/Stream Placement Modal (for Admitted Applicants) */}
      {enrollingApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full text-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Confirm Enrolment &amp; Class/Stream Placement
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {enrollingApplicant.applicantName} · {enrollingApplicant.applicationNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnrollingApplicant(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmApplicantPlacement} noValidate className="py-4 space-y-3.5 text-xs">
              {placementError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-700/60 text-rose-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{placementError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Academic Year *</label>
                  <input
                    type="text"
                    value={placementForm.academicYear}
                    onChange={(e) => {
                      setPlacementError(null);
                      setPlacementForm({ ...placementForm, academicYear: e.target.value });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Educational Section *</label>
                  <select
                    value={placementForm.sectionId}
                    onChange={(e) => {
                      setPlacementError(null);
                      const nextSecId = e.target.value;
                      const firstGrd = nextSecId
                        ? activeGrades.find((g) => g.sectionId === nextSecId)
                        : undefined;
                      const firstCls = firstGrd
                        ? activeStreams.find((c) => c.gradeId === firstGrd.id)
                        : undefined;
                      setPlacementForm({
                        ...placementForm,
                        sectionId: nextSecId,
                        gradeId: firstGrd?.id || '',
                        classId: firstCls?.id || '',
                        classTeacherId:
                          firstCls?.formTutorTeacherId || placementForm.classTeacherId,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Select Educational Section --</option>
                    {activeSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Class / Grade *</label>
                  <select
                    value={placementForm.gradeId}
                    disabled={!placementForm.sectionId}
                    onChange={(e) => {
                      setPlacementError(null);
                      const grdId = e.target.value;
                      const streams = activeStreams.filter((c) => c.gradeId === grdId);
                      const firstStream = streams[0];
                      setPlacementForm({
                        ...placementForm,
                        gradeId: grdId,
                        classId: firstStream?.id || '',
                        classTeacherId:
                          firstStream?.formTutorTeacherId || placementForm.classTeacherId,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value="">-- Select Class / Grade --</option>
                    {placementGradesForSection.map((grd) => (
                      <option key={grd.id} value={grd.id}>
                        {grd.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Stream / Division *</label>
                  <select
                    value={placementForm.classId}
                    disabled={!placementForm.gradeId}
                    onChange={(e) => {
                      setPlacementError(null);
                      const clsObj = activeStreams.find((c) => c.id === e.target.value);
                      setPlacementForm({
                        ...placementForm,
                        classId: e.target.value,
                        classTeacherId:
                          clsObj?.formTutorTeacherId || placementForm.classTeacherId,
                        programme: clsObj?.programme || placementForm.programme,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    {placementStreamsForGrade.length === 0 ? (
                      <option value="">Stream A (Auto-created on Confirm)</option>
                    ) : (
                      <option value="">-- Select Stream / Division --</option>
                    )}
                    {placementStreamsForGrade.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} (Stream {cls.stream})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Class Teacher</label>
                  <select
                    value={placementForm.classTeacherId}
                    onChange={(e) =>
                      setPlacementForm({ ...placementForm, classTeacherId: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Stream Form Teacher --</option>
                    {teacherOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Residential Status</label>
                  <select
                    value={placementForm.boardingStatus}
                    onChange={(e) =>
                      setPlacementForm({
                        ...placementForm,
                        boardingStatus: e.target.value as 'Boarding' | 'Day',
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Day">Day Student</option>
                    <option value="Boarding">Boarding Student</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEnrollingApplicant(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer whitespace-nowrap"
                >
                  Confirm Enrolment &amp; Place in Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Administrator Applicant Passport Verification Modal */}
      {photoReviewModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-slate-200 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">
                  Applicant Passport Photograph Verification
                </h3>
                <p className="text-[11px] text-slate-400">
                  {photoReviewModalApp.applicantName} · {photoReviewModalApp.applicationNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPhotoReviewModalApp(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              {photoReviewModalApp.photo ? (
                <img
                  src={photoReviewModalApp.photo}
                  alt={photoReviewModalApp.applicantName}
                  className="w-24 h-32 rounded-xl object-cover border-2 border-emerald-500 shrink-0"
                />
              ) : (
                <div className="w-24 h-32 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                  No Photo
                </div>
              )}
              <div className="space-y-1.5">
                <div className="text-slate-300 font-semibold">
                  Current Status:{' '}
                  <span className="text-emerald-400">
                    {photoReviewModalApp.photoApprovalStatus || 'Pending Review'}
                  </span>
                </div>
                {photoReviewModalApp.photoReviewedBy && (
                  <p className="text-[11px] text-slate-400">
                    Last reviewed by {photoReviewModalApp.photoReviewedBy} on{' '}
                    {photoReviewModalApp.photoReviewedAt}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const appRef = photoReviewModalApp;
                    setPhotoReviewModalApp(null);
                    setEditingApplicantPhotoTarget(appRef);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload / Replace Photo</span>
                </button>
              </div>
            </div>

            {isAdminReviewer && (
              <>
                <div>
                  <label className="block text-slate-400 mb-1">
                    Administrator Verification Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={photoReviewNote}
                    onChange={(e) => setPhotoReviewNote(e.target.value)}
                    placeholder="e.g. Verified clear passport portrait on white background"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      reviewAdmissionPhoto(
                        photoReviewModalApp.id,
                        'Revision Requested',
                        photoReviewNote
                      );
                      setPhotoReviewModalApp(null);
                    }}
                    className="px-3.5 py-2 bg-rose-950/70 hover:bg-rose-900 text-rose-200 rounded-xl font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Request Photo Revision
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      reviewAdmissionPhoto(photoReviewModalApp.id, 'Approved', photoReviewNote);
                      setPhotoReviewModalApp(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer whitespace-nowrap"
                  >
                    Approve Passport Photo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Passport Crop Modal for New Application Form */}
      <ImageUploadModal
        isOpen={showFormPhotoModal}
        onClose={() => setShowFormPhotoModal(false)}
        targetType="student"
        currentImage={formData.photo}
        title="Upload Applicant Passport Photograph"
        entityName={formData.applicantName || 'New Admission Applicant'}
        entityRoleOrCode={
          classes.find((c) => c.id === formData.applyingForClassId)?.name || 'Applicant'
        }
        onSave={(newPhotoUrl) => setFormData((prev) => ({ ...prev, photo: newPhotoUrl }))}
      />

      {/* Passport Crop Modal for Existing Applicant Row */}
      <ImageUploadModal
        isOpen={Boolean(editingApplicantPhotoTarget)}
        onClose={() => setEditingApplicantPhotoTarget(null)}
        targetType="student"
        currentImage={editingApplicantPhotoTarget?.photo || ''}
        title="Update Applicant Passport Photograph"
        entityName={editingApplicantPhotoTarget?.applicantName}
        entityRoleOrCode={editingApplicantPhotoTarget?.applicationNumber}
        onSave={(newPhotoUrl) => {
          if (!editingApplicantPhotoTarget) return;
          reviewAdmissionPhoto(
            editingApplicantPhotoTarget.id,
            isAdminReviewer ? 'Approved' : ('Pending Review' as any),
            isAdminReviewer
              ? 'Uploaded and approved by Admissions Administrator.'
              : 'Updated passport photograph submitted for administrator review.',
            newPhotoUrl
          );
          setEditingApplicantPhotoTarget(null);
        }}
      />

      {/* Printable Admission Offer Letter Modal */}
      {activeAdmissionLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full text-slate-900 shadow-2xl my-8">
            <div className="print:hidden flex justify-between items-center pb-4 mb-4 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-700">
                Official Admission Offer Letter
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Letter
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAdmissionLetter(null)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 gap-4">
              <img
                src={school.crest}
                alt={school.name}
                className="w-16 h-16 rounded-xl object-cover border border-slate-300 shrink-0"
              />
              <div className="text-center flex-1">
                <h2 className="text-xl font-serif font-black uppercase text-slate-950 tracking-tight">
                  {school.name}
                </h2>
                <p className="text-xs text-slate-600 font-medium">&ldquo;{school.motto}&rdquo;</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {school.address} · {school.phone}
                </p>
                <div className="mt-2.5 inline-block bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded">
                  Provisional Offer of Admission —{' '}
                  {activeAdmissionLetter.academicYear || school.currentAcademicYear}
                </div>
              </div>
              {activeAdmissionLetter.photo ? (
                <img
                  src={activeAdmissionLetter.photo}
                  alt={activeAdmissionLetter.applicantName}
                  className="w-18 h-24 rounded-lg object-cover border-2 border-slate-800 shrink-0"
                />
              ) : (
                <div className="w-18 h-24 rounded-lg border border-dashed border-slate-400 flex items-center justify-center text-[9px] text-slate-500 text-center p-1 shrink-0">
                  Passport Photo
                </div>
              )}
            </div>

            <div className="my-6 space-y-4 text-xs text-slate-800 leading-relaxed">
              <div className="flex justify-between text-slate-600">
                <span>Ref: ADM/{activeAdmissionLetter.applicationNumber}</span>
                <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
              </div>

              <div>
                <p className="font-bold text-sm text-slate-950">
                  Dear {activeAdmissionLetter.applicantName},
                </p>
                <p className="text-slate-500">
                  c/o {activeAdmissionLetter.parentName} ({activeAdmissionLetter.parentPhone})
                </p>
              </div>

              <p>
                We are pleased to inform you that following the review of your application and academic entry standing (Aggregate {activeAdmissionLetter.beceScore}), you have been offered provisional admission to{' '}
                <strong>{school.name}</strong> for the{' '}
                <strong>
                  {activeAdmissionLetter.academicYear || school.currentAcademicYear}
                </strong>{' '}
                academic year.
              </p>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                {activeAdmissionLetter.sectionName && (
                  <div>
                    <strong>Educational Section:</strong> {activeAdmissionLetter.sectionName}
                  </div>
                )}
                <div>
                  <strong>Admitted Class &amp; Stream:</strong>{' '}
                  {activeAdmissionLetter.applyingForClass}
                  {activeAdmissionLetter.applyingForStream
                    ? ` (Stream ${activeAdmissionLetter.applyingForStream})`
                    : ''}
                </div>
                <div>
                  <strong>Approved Programme / Track:</strong> {activeAdmissionLetter.programme}
                </div>
                {activeAdmissionLetter.assignedClassTeacherName && (
                  <div>
                    <strong>Class Teacher:</strong>{' '}
                    {activeAdmissionLetter.assignedClassTeacherName}
                  </div>
                )}
                <div>
                  <strong>Term Resumption Date:</strong> {school.termStartDate}
                </div>
              </div>

              <p>
                Kindly confirm acceptance by completing registration formalities and settling the approved institutional fees on or before the resumption date.
              </p>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                <div>
                  <div className="font-serif italic font-bold text-slate-900 text-sm">
                    {school.headmasterSignature}
                  </div>
                  <div className="font-bold text-slate-800 mt-1">{school.headmasterName}</div>
                  <div className="text-[10px] text-slate-500">Head of Institution</div>
                </div>
                <div className="text-center font-mono font-bold text-emerald-800 border-2 border-emerald-800 px-3 py-1 rounded uppercase text-[9px]">
                  ADMISSIONS VERIFIED
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
