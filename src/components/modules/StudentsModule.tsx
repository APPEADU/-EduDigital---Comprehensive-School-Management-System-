import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { Student } from '../../types';
import { computeNextAcademicYear } from '../../utils/ghanaianClassStructure';
import { StudentIdCardModal } from '../modals/StudentIdCardModal';
import { ReportCardModal } from '../modals/ReportCardModal';
import { ImageUploadModal } from '../modals/ImageUploadModal';
import {
  Users,
  Search,
  Plus,
  CreditCard,
  Award,
  Filter,
  Eye,
  HeartPulse,
  X,
  Trash2,
  Camera,
  ShieldCheck,
  User,
  ArrowRightLeft,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  History,
  Layers,
} from 'lucide-react';

export const StudentsModule: React.FC = () => {
  const {
    school,
    schools,
    students,
    classes,
    educationalSections,
    gradeClasses,
    staff,
    users,
    courseTracks,
    addCourseTrack,
    boardingHouses,
    currentUser,
    isPlatformAdmin,
    deleteStudent,
    photoChangeRequests,
    submitStudentPhotoRequest,
    reviewStudentPhotoRequest,
    resolveTeacherDisplayName,
    checkDuplicateStudentEnrolment,
    enrollStudentWithPlacement,
    reassignStudentClassStream,
    promoteOrTransferStudents,
    addClassStream,
  } = useSchool();

  const isAdminReviewer =
    currentUser.role === 'proprietor' || currentUser.role === 'admin' || isPlatformAdmin;
  const isSchoolUninitialized = school.id === 'sch-uninitialized' && schools.length === 0;

  // Active sections, grades, and streams for this institution
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

  // Teacher options (from staff & teacher user accounts)
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

  // Registry filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('All');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedAcademicStatus, setSelectedAcademicStatus] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modals & notifications
  const [activeStudentIdCard, setActiveStudentIdCard] = useState<Student | null>(null);
  const [activeStudentReport, setActiveStudentReport] = useState<Student | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteStudentId, setConfirmDeleteStudentId] = useState<string | null>(null);
  const [bannerFeedback, setBannerFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Passport photograph modals
  const [showEnrollPhotoModal, setShowEnrollPhotoModal] = useState(false);
  const [photoEditStudent, setPhotoEditStudent] = useState<Student | null>(null);

  // Enrol New Student Form State (with linked Section -> Class/Grade -> Stream -> Class Teacher)
  const [useCustomProgrammeInput, setUseCustomProgrammeInput] = useState(false);
  const [enrollValidationError, setEnrollValidationError] = useState<string | null>(null);
  const [quickStreamCreating, setQuickStreamCreating] = useState(false);
  const [showInlineStreamCreator, setShowInlineStreamCreator] = useState(false);
  const [inlineStreamDivision, setInlineStreamDivision] = useState('A');
  const [newStudent, setNewStudent] = useState({
    academicYear: school.currentAcademicYear || '2025/2026',
    sectionId: '',
    gradeId: '',
    classId: '',
    stream: '',
    classTeacherId: '',
    firstName: '',
    lastName: '',
    otherNames: '',
    gender: 'Male' as 'Male' | 'Female',
    dob: '',
    photo: '',
    programme: courseTracks[0]?.name || 'General Academics',
    boardingStatus: 'Day' as 'Boarding' | 'Day',
    houseId: boardingHouses[0]?.id || '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianRelationship: 'Parent / Guardian',
    emergencyContact: '',
    medicalInfo: 'None',
    nationalIdOrNHIS: '',
    previousSchool: '',
    beceAggregate: 8,
  });

  // Post-Enrolment Class & Stream Reassignment Modal State
  const [reassignTargetStudent, setReassignTargetStudent] = useState<Student | null>(null);
  const [reassignForm, setReassignForm] = useState({
    academicYear: school.currentAcademicYear || '2024/2025',
    sectionId: '',
    gradeId: '',
    classId: '',
    classTeacherId: '',
    programme: '',
    reason: 'Administrative class/stream placement update',
  });
  const [reassignError, setReassignError] = useState<string | null>(null);

  // Class Promotion & Transfer Modal State
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoSourceClassId, setPromoSourceClassId] = useState<string>(activeStreams[0]?.id || '');
  const [promoSelectedStudentIds, setPromoSelectedStudentIds] = useState<string[]>([]);
  const [promoAction, setPromoAction] = useState<'promote' | 'transfer' | 'graduate'>('promote');
  const [promoTargetAcademicYear, setPromoTargetAcademicYear] = useState<string>(
    computeNextAcademicYear(school.currentAcademicYear || '2024/2025')
  );
  const [promoTargetSectionId, setPromoTargetSectionId] = useState<string>('');
  const [promoTargetGradeId, setPromoTargetGradeId] = useState<string>('');
  const [promoTargetClassId, setPromoTargetClassId] = useState<string>('');
  const [promoTransferSchool, setPromoTransferSchool] = useState<string>('');
  const [promoReason, setPromoReason] = useState<string>('End-of-academic-year class promotion');
  const [promoAdvanceSchoolYear, setPromoAdvanceSchoolYear] = useState<boolean>(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const pendingPhotoRequests = photoChangeRequests.filter((r) => r.status === 'Pending Review');

  // Linked options for Enroll Modal
  const enrollGradesForSection = useMemo(
    () =>
      newStudent.sectionId
        ? activeGrades.filter((g) => g.sectionId === newStudent.sectionId)
        : [],
    [activeGrades, newStudent.sectionId]
  );

  const enrollStreamsForGrade = useMemo(
    () =>
      newStudent.gradeId
        ? activeStreams.filter((c) => c.gradeId === newStudent.gradeId)
        : [],
    [activeStreams, newStudent.gradeId]
  );

  const selectedEnrollGradeObj = useMemo(
    () => gradeClasses.find((g) => g.id === newStudent.gradeId),
    [gradeClasses, newStudent.gradeId]
  );

  // Live duplicate check while filling Enrolment Modal
  const liveDuplicateWarning = useMemo(() => {
    if (!showAddModal) return null;
    if (!newStudent.firstName.trim() || !newStudent.lastName.trim()) return null;
    const dup = checkDuplicateStudentEnrolment({
      firstName: newStudent.firstName,
      lastName: newStudent.lastName,
      otherNames: newStudent.otherNames,
      dob: newStudent.dob,
      academicYear: newStudent.academicYear,
      nationalIdOrNHIS: newStudent.nationalIdOrNHIS,
      guardianPhone: newStudent.guardianPhone,
    });
    return dup.isDuplicate ? dup : null;
  }, [
    showAddModal,
    newStudent.firstName,
    newStudent.lastName,
    newStudent.otherNames,
    newStudent.dob,
    newStudent.academicYear,
    newStudent.nationalIdOrNHIS,
    newStudent.guardianPhone,
    checkDuplicateStudentEnrolment,
  ]);

  // Linked options for Reassign Modal
  const reassignGradesForSection = useMemo(
    () =>
      reassignForm.sectionId
        ? activeGrades.filter((g) => g.sectionId === reassignForm.sectionId)
        : [],
    [activeGrades, reassignForm.sectionId]
  );

  const reassignStreamsForGrade = useMemo(
    () =>
      reassignForm.gradeId
        ? activeStreams.filter((c) => c.gradeId === reassignForm.gradeId)
        : [],
    [activeStreams, reassignForm.gradeId]
  );

  // Linked options for Promotion Modal
  const promoSourceStudents = useMemo(
    () =>
      students.filter(
        (s) => s.classId === promoSourceClassId && s.status === 'Active'
      ),
    [students, promoSourceClassId]
  );

  const promoTargetGrades = useMemo(
    () =>
      promoTargetSectionId
        ? activeGrades.filter((g) => g.sectionId === promoTargetSectionId)
        : [],
    [activeGrades, promoTargetSectionId]
  );

  const promoTargetStreams = useMemo(
    () =>
      promoTargetGradeId
        ? activeStreams.filter((c) => c.gradeId === promoTargetGradeId)
        : [],
    [activeStreams, promoTargetGradeId]
  );

  // Filtered classes for registry filter bar
  const filterBarClasses = useMemo(
    () =>
      selectedSectionFilter === 'All'
        ? classes
        : classes.filter((c) => c.sectionId === selectedSectionFilter),
    [classes, selectedSectionFilter]
  );

  const filteredStudents = students.filter((stu) => {
    const matchesSearch = `${stu.firstName} ${stu.lastName} ${stu.otherNames || ''} ${stu.studentNumber}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const stuClass = classes.find((c) => c.id === stu.classId);
    const effectiveSectionId = stu.sectionId || stuClass?.sectionId || '';
    const matchesSection =
      selectedSectionFilter === 'All' || effectiveSectionId === selectedSectionFilter;
    const matchesClass = selectedClass === 'All' || stu.classId === selectedClass;
    const matchesAcadStatus =
      selectedAcademicStatus === 'All' || stu.status === selectedAcademicStatus;
    const matchesResidence = selectedStatus === 'All' || stu.boardingStatus === selectedStatus;
    return (
      matchesSearch &&
      matchesSection &&
      matchesClass &&
      matchesAcadStatus &&
      matchesResidence
    );
  });

  const openEnrollModal = () => {
    if (isSchoolUninitialized) {
      setBannerFeedback({
        type: 'error',
        text: 'Please register an institution first using "+ Register School" in the top bar before enrolling students.',
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

    setEnrollValidationError(null);
    setUseCustomProgrammeInput(false);
    setShowInlineStreamCreator(false);
    setInlineStreamDivision('B');
    setNewStudent((prev) => ({
      ...prev,
      academicYear: school.currentAcademicYear || '2025/2026',
      sectionId: defaultSec?.id || '',
      gradeId: defaultGrd?.id || '',
      classId: defaultCls?.id || '',
      stream: defaultCls?.stream || 'A',
      classTeacherId: defaultCls?.formTutorTeacherId || '',
      programme:
        defaultCls?.programme ||
        courseTracks[0]?.name ||
        (defaultSec?.isShs ? 'General Science' : 'GES Standard Curriculum'),
    }));
    setShowAddModal(true);
  };

  const handleEnrollSectionChange = (sectionId: string) => {
    setEnrollValidationError(null);
    const sec = activeSections.find((s) => s.id === sectionId);
    const firstGrade = sectionId
      ? activeGrades.find((g) => g.sectionId === sectionId)
      : undefined;
    const firstStream = firstGrade
      ? activeStreams.find((c) => c.gradeId === firstGrade.id)
      : undefined;

    setNewStudent((prev) => ({
      ...prev,
      sectionId,
      gradeId: firstGrade?.id || '',
      classId: firstStream?.id || '',
      stream: firstStream?.stream || 'A',
      classTeacherId: firstStream?.formTutorTeacherId || '',
      programme:
        firstStream?.programme ||
        (sec?.isShs
          ? courseTracks[0]?.name || 'General Science'
          : prev.programme || 'GES Standard Curriculum'),
    }));
  };

  const handleEnrollGradeChange = (gradeId: string) => {
    setEnrollValidationError(null);
    let streams = activeStreams.filter((c) => c.gradeId === gradeId);
    let firstStream = streams[0];

    // Proactively create Stream A if this grade has no streams yet
    if (!firstStream && gradeId) {
      const gradeObj = gradeClasses.find((g) => g.id === gradeId);
      if (gradeObj) {
        const autoRes = addClassStream({
          gradeId,
          streamDivision: 'A',
          programme: gradeObj.isShs ? newStudent.programme || 'General Science' : undefined,
        });
        if (autoRes.success && autoRes.classRoom) {
          firstStream = autoRes.classRoom;
          streams = [autoRes.classRoom];
        }
      }
    }

    const nextLetter = String.fromCharCode(65 + Math.min(streams.length, 7));
    setInlineStreamDivision(nextLetter);
    setNewStudent((prev) => ({
      ...prev,
      gradeId,
      classId: firstStream?.id || '',
      stream: firstStream?.stream || 'A',
      classTeacherId: firstStream?.formTutorTeacherId || '',
      programme: firstStream?.programme || prev.programme,
    }));
  };

  const handleEnrollStreamChange = (classId: string) => {
    setEnrollValidationError(null);
    if (classId === '__create_new_stream__') {
      setShowInlineStreamCreator(true);
      return;
    }
    if (classId === '__auto_a__') {
      const gradeObj = gradeClasses.find((g) => g.id === newStudent.gradeId);
      if (gradeObj && newStudent.gradeId) {
        const autoRes = addClassStream({
          gradeId: newStudent.gradeId,
          streamDivision: 'A',
          programme: gradeObj.isShs ? newStudent.programme || 'General Science' : undefined,
        });
        if (autoRes.success && autoRes.classRoom) {
          setNewStudent((prev) => ({
            ...prev,
            classId: autoRes.classRoom!.id,
            stream: autoRes.classRoom!.stream,
            classTeacherId: autoRes.classRoom!.formTutorTeacherId || prev.classTeacherId,
            programme: autoRes.classRoom!.programme || prev.programme,
          }));
          return;
        }
      }
      return;
    }
    const streamObj = activeStreams.find((c) => c.id === classId);
    setNewStudent((prev) => ({
      ...prev,
      classId,
      stream: streamObj?.stream || '',
      classTeacherId: streamObj?.formTutorTeacherId || prev.classTeacherId,
      programme: streamObj?.programme || prev.programme,
    }));
  };

  const handleQuickCreateStreamInEnroll = (divisionOverride?: string) => {
    if (!newStudent.gradeId) return;
    const targetDiv = (divisionOverride ?? inlineStreamDivision).trim() || 'A';
    setQuickStreamCreating(true);
    const gradeObj = gradeClasses.find((g) => g.id === newStudent.gradeId);
    const res = addClassStream({
      gradeId: newStudent.gradeId,
      streamDivision: targetDiv,
      programme: gradeObj?.isShs ? newStudent.programme : undefined,
      formTutorTeacherId: newStudent.classTeacherId || undefined,
    });
    if (res.success && res.classRoom) {
      setNewStudent((prev) => ({
        ...prev,
        classId: res.classRoom!.id,
        stream: res.classRoom!.stream,
        classTeacherId: res.classRoom!.formTutorTeacherId || prev.classTeacherId,
      }));
      setShowInlineStreamCreator(false);
      setEnrollValidationError(null);
    } else if (res.message) {
      setEnrollValidationError(res.message);
    }
    setQuickStreamCreating(false);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollValidationError(null);

    if (!newStudent.firstName.trim() || !newStudent.lastName.trim()) {
      setEnrollValidationError('Please enter both the student’s First Name and Last Name.');
      return;
    }
    if (!newStudent.academicYear.trim()) {
      setEnrollValidationError('Please select or enter the Academic Year for enrolment.');
      return;
    }
    if (!newStudent.sectionId) {
      setEnrollValidationError('Please select an Educational Section before completing enrolment.');
      return;
    }
    if (!newStudent.gradeId) {
      setEnrollValidationError('Please select a Class / Grade within the chosen Educational Section.');
      return;
    }
    if (!newStudent.guardianName.trim() || !newStudent.guardianPhone.trim()) {
      setEnrollValidationError('Please provide the Parent / Guardian Name and Phone Number.');
      return;
    }

    const chosenProg =
      newStudent.programme.trim() || courseTracks[0]?.name || 'General Academics';
    if (
      useCustomProgrammeInput &&
      chosenProg &&
      !courseTracks.some((ct) => ct.name.toLowerCase() === chosenProg.toLowerCase())
    ) {
      addCourseTrack({
        code: '',
        name: chosenProg,
        department: 'General Academics',
        category: 'Custom Course',
      });
    }

    const selectedCls = classes.find((c) => c.id === newStudent.classId);
    const selectedSec = educationalSections.find((s) => s.id === newStudent.sectionId);
    const selectedGrd = gradeClasses.find((g) => g.id === newStudent.gradeId);

    const result = enrollStudentWithPlacement({
      firstName: newStudent.firstName.trim(),
      lastName: newStudent.lastName.trim(),
      otherNames: newStudent.otherNames.trim() || undefined,
      gender: newStudent.gender,
      dob: newStudent.dob || '2012-01-01',
      photo: newStudent.photo,
      academicYear: newStudent.academicYear.trim(),
      sectionId: newStudent.sectionId,
      sectionName: selectedSec?.name,
      gradeId: newStudent.gradeId,
      gradeName: selectedGrd?.name,
      classId: newStudent.classId,
      stream: selectedCls?.stream || newStudent.stream || 'A',
      classTeacherId: newStudent.classTeacherId || selectedCls?.formTutorTeacherId,
      classTeacherName: resolveTeacherDisplayName(
        newStudent.classTeacherId || selectedCls?.formTutorTeacherId,
        selectedCls?.classTeacherName
      ),
      programme: selectedCls?.programme || chosenProg,
      boardingStatus: newStudent.boardingStatus,
      houseId: newStudent.houseId || undefined,
      guardianName: newStudent.guardianName.trim(),
      guardianPhone: newStudent.guardianPhone.trim(),
      guardianEmail: newStudent.guardianEmail.trim(),
      guardianRelationship: newStudent.guardianRelationship,
      emergencyContact: newStudent.emergencyContact || newStudent.guardianPhone.trim(),
      medicalInfo: newStudent.medicalInfo || 'None',
      nationalIdOrNHIS: newStudent.nationalIdOrNHIS.trim() || undefined,
      previousSchool: newStudent.previousSchool.trim() || undefined,
      beceAggregate: newStudent.beceAggregate,
    });

    if (!result.success) {
      setEnrollValidationError(result.message || 'Unable to enrol student. Please check placement details.');
      return;
    }

    setBannerFeedback({
      type: 'success',
      text:
        result.message ||
        `${newStudent.firstName} ${newStudent.lastName} enrolled and placed in ${selectedCls?.name}.`,
    });
    setTimeout(() => setBannerFeedback(null), 5000);
    setShowAddModal(false);
    setUseCustomProgrammeInput(false);
    setNewStudent((prev) => ({
      ...prev,
      firstName: '',
      lastName: '',
      otherNames: '',
      photo: '',
      nationalIdOrNHIS: '',
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
    }));
  };

  // Open Post-Enrolment Class & Stream Reassignment Modal
  const openReassignModal = (stu: Student) => {
    const stuClass = classes.find((c) => c.id === stu.classId);
    const secId = stu.sectionId || stuClass?.sectionId || activeSections[0]?.id || '';
    const grdId = stu.gradeId || stuClass?.gradeId || '';
    setReassignError(null);
    setReassignForm({
      academicYear: stu.academicYear || school.currentAcademicYear || '2024/2025',
      sectionId: secId,
      gradeId: grdId,
      classId: stu.classId || '',
      classTeacherId: stu.classTeacherId || stuClass?.formTutorTeacherId || '',
      programme: stu.programme || stuClass?.programme || '',
      reason: 'Administrative class/stream reassignment',
    });
    setReassignTargetStudent(stu);
  };

  const handleSubmitReassignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignTargetStudent) return;
    setReassignError(null);

    if (!reassignForm.sectionId) {
      setReassignError('Please select an Educational Section.');
      return;
    }
    if (!reassignForm.gradeId) {
      setReassignError('Please select a Class / Grade.');
      return;
    }
    if (!reassignForm.classId) {
      setReassignError('Please select a Stream / Division for the chosen Class.');
      return;
    }

    const targetCls = classes.find((c) => c.id === reassignForm.classId);
    const res = reassignStudentClassStream({
      studentId: reassignTargetStudent.id,
      academicYear: reassignForm.academicYear.trim() || school.currentAcademicYear,
      sectionId: reassignForm.sectionId,
      gradeId: reassignForm.gradeId,
      classId: reassignForm.classId,
      stream: targetCls?.stream,
      programme: targetCls?.programme || reassignForm.programme,
      classTeacherId: reassignForm.classTeacherId || targetCls?.formTutorTeacherId,
      reason: reassignForm.reason.trim() || 'Administrative class/stream reassignment',
    });

    if (!res.success) {
      setReassignError(res.message);
      return;
    }

    setBannerFeedback({ type: 'success', text: res.message });
    setTimeout(() => setBannerFeedback(null), 5000);
    setReassignTargetStudent(null);
    if (selectedStudentDetail?.id === reassignTargetStudent.id) {
      const refreshed = students.find((s) => s.id === reassignTargetStudent.id);
      if (refreshed) setSelectedStudentDetail(refreshed);
    }
  };

  // Open Class Promotion & Transfer Modal and pre-populate smart next class defaults
  const syncPromoDefaultsForSourceClass = (sourceClsId: string) => {
    setPromoSourceClassId(sourceClsId);
    setPromoError(null);
    const srcStudents = students.filter(
      (s) => s.classId === sourceClsId && s.status === 'Active'
    );
    setPromoSelectedStudentIds(srcStudents.map((s) => s.id));

    const srcCls = classes.find((c) => c.id === sourceClsId);
    const srcGrade = gradeClasses.find((g) => g.id === srcCls?.gradeId);
    const nextGrade = srcGrade?.nextGradeId
      ? activeGrades.find((g) => g.id === srcGrade.nextGradeId)
      : undefined;

    if (nextGrade) {
      setPromoAction('promote');
      setPromoTargetSectionId(nextGrade.sectionId);
      setPromoTargetGradeId(nextGrade.id);
      const matchingStreams = activeStreams.filter((c) => c.gradeId === nextGrade.id);
      const sameLetterStream =
        matchingStreams.find(
          (c) =>
            (srcCls?.streamLetter && c.streamLetter === srcCls.streamLetter) ||
            (srcCls?.programme && c.programme === srcCls.programme)
        ) || matchingStreams[0];
      setPromoTargetClassId(sameLetterStream?.id || '');
    } else {
      // Final-year class (e.g., Basic 9 / JHS 3 when SHS not offered, or SHS 3)
      setPromoAction('graduate');
      setPromoTargetSectionId('');
      setPromoTargetGradeId('');
      setPromoTargetClassId('');
    }
  };

  const openPromotionModal = () => {
    const initialSource =
      selectedClass !== 'All' && activeStreams.some((c) => c.id === selectedClass)
        ? selectedClass
        : activeStreams[0]?.id || '';
    setPromoTargetAcademicYear(
      computeNextAcademicYear(school.currentAcademicYear || '2024/2025')
    );
    syncPromoDefaultsForSourceClass(initialSource);
    setShowPromoteModal(true);
  };

  const handleExecutePromotionOrTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);

    if (promoSelectedStudentIds.length === 0) {
      setPromoError('Please select at least one student from the source class register.');
      return;
    }

    if (promoAction === 'promote') {
      if (!promoTargetAcademicYear.trim()) {
        setPromoError('Please specify the Target Academic Year for promotion.');
        return;
      }
      if (!promoTargetSectionId) {
        setPromoError('Please select the destination Educational Section.');
        return;
      }
      if (!promoTargetGradeId) {
        setPromoError('Please select the destination Next Class / Grade.');
        return;
      }
      if (!promoTargetClassId) {
        setPromoError(
          'Please select the destination Stream / Division for the promoted students.'
        );
        return;
      }
      if (promoTargetClassId === promoSourceClassId && promoTargetAcademicYear === school.currentAcademicYear) {
        setPromoError(
          'Destination class/stream and academic year cannot be identical to the current placement.'
        );
        return;
      }
    }

    if (promoAction === 'transfer' && !promoTransferSchool.trim()) {
      setPromoError('Please enter the receiving/destination school name or transfer reference.');
      return;
    }

    const res = promoteOrTransferStudents({
      studentIds: promoSelectedStudentIds,
      sourceAcademicYear: school.currentAcademicYear,
      targetAcademicYear: promoTargetAcademicYear.trim() || school.currentAcademicYear,
      action: promoAction,
      targetSectionId: promoAction === 'promote' ? promoTargetSectionId : undefined,
      targetGradeId: promoAction === 'promote' ? promoTargetGradeId : undefined,
      targetClassId: promoAction === 'promote' ? promoTargetClassId : undefined,
      transferDestinationSchool:
        promoAction === 'transfer' ? promoTransferSchool.trim() : undefined,
      reason: promoReason.trim(),
      advanceSchoolAcademicYear: promoAction === 'promote' ? promoAdvanceSchoolYear : false,
    });

    if (!res.success) {
      setPromoError(res.message);
      return;
    }

    setBannerFeedback({ type: 'success', text: res.message });
    setTimeout(() => setBannerFeedback(null), 6000);
    setShowPromoteModal(false);
  };

  // Resolve fresh detail student from context so placement history updates immediately
  const liveSelectedDetailStudent = selectedStudentDetail
    ? students.find((s) => s.id === selectedStudentDetail.id) || selectedStudentDetail
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Student Enrolment, Class/Stream Placement &amp; Official Registry
          </h2>
          <p className="text-xs text-slate-400">
            Enrol students into linked Educational Sections, Classes &amp; Streams, track placement history, and manage annual promotions &amp; transfers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdminReviewer && (
            <button
              type="button"
              onClick={openPromotionModal}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
            >
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>Promote / Transfer Class</span>
            </button>
          )}
          <button
            type="button"
            onClick={openEnrollModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll New Student</span>
          </button>
        </div>
      </div>

      {isSchoolUninitialized && (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-700/60 text-amber-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">No Institution Registered Yet:</strong> Click{' '}
            <strong className="text-emerald-300">+ Register School</strong> in the top header bar to onboard your school first, then enrol students directly into its classes and streams.
          </div>
        </div>
      )}

      {/* Operation Feedback Banner */}
      {bannerFeedback && (
        <div
          className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border text-xs font-medium ${
            bannerFeedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
              : 'bg-rose-950/60 border-rose-700/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
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

      {/* Pending Passport Photograph Review Banner for Administrators */}
      {isAdminReviewer && pendingPhotoRequests.length > 0 && (
        <div className="bg-slate-900 border border-amber-700/40 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Pending Student Profile Picture Approvals ({pendingPhotoRequests.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              Approved photos update ID cards, attendance sheets, exam records &amp; report cards immediately
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingPhotoRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={req.newPhoto}
                    alt={req.studentName}
                    className="w-11 h-14 rounded-lg object-cover border-2 border-emerald-500 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-white block truncate">{req.studentName}</span>
                    <span className="font-mono text-[11px] text-emerald-400 block tabular-nums">
                      {req.studentNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      Submitted by {req.requestedByName} ({req.requestedByRole})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
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

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between text-xs">
        <div className="relative w-full xl:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedSectionFilter}
            onChange={(e) => {
              setSelectedSectionFilter(e.target.value);
              setSelectedClass('All');
            }}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 text-xs"
          >
            <option value="All">All Sections</option>
            {activeSections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 text-xs"
          >
            <option value="All">All Classes &amp; Streams</option>
            {filterBarClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedAcademicStatus}
            onChange={(e) => setSelectedAcademicStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 text-xs"
          >
            <option value="All">All Enrolment Statuses</option>
            <option value="Active">Active</option>
            <option value="Graduated">Graduated</option>
            <option value="Transferred">Transferred</option>
            <option value="Withdrawn">Withdrawn</option>
            <option value="Suspended">Suspended</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 text-xs"
          >
            <option value="All">Day &amp; Boarding</option>
            <option value="Boarding">Boarding</option>
            <option value="Day">Day</option>
          </select>
        </div>
      </div>

      {/* Student Registry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Student &amp; Passport Photo</th>
                <th className="py-3 px-3">Student ID</th>
                <th className="py-3 px-3">Section, Class &amp; Stream</th>
                <th className="py-3 px-3">Class Teacher &amp; Year</th>
                <th className="py-3 px-3">Status &amp; Residence</th>
                <th className="py-3 px-3">Guardian &amp; Phone</th>
                <th className="py-3 px-4 text-right">Actions &amp; Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((stu) => {
                  const stuClass = classes.find((c) => c.id === stu.classId);
                  const stuHouse = boardingHouses.find((h) => h.id === stu.houseId);
                  const stuSectionName =
                    stu.sectionName ||
                    stuClass?.sectionName ||
                    educationalSections.find((s) => s.id === (stu.sectionId || stuClass?.sectionId))
                      ?.name ||
                    'Academic Section';
                  const resolvedTeacher = resolveTeacherDisplayName(
                    stu.classTeacherId || stuClass?.formTutorTeacherId,
                    stu.classTeacherName || stuClass?.classTeacherName
                  );

                  return (
                    <tr key={stu.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setPhotoEditStudent(stu)}
                            title="Update or crop student passport photograph"
                            className="relative w-10 h-12 rounded-lg overflow-hidden border border-slate-700 hover:border-emerald-500 shrink-0 group cursor-pointer"
                          >
                            <img
                              src={stu.photo}
                              alt={stu.firstName}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Camera className="w-3.5 h-3.5 text-emerald-400" />
                            </span>
                          </button>
                          <div>
                            <span className="font-bold text-white block">
                              {stu.lastName}, {stu.firstName} {stu.otherNames || ''}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {stu.gender} · DOB: {stu.dob}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-emerald-400 tabular-nums">
                        {stu.studentNumber}
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold block">
                          {stuSectionName}
                        </span>
                        <span className="font-bold text-white block">
                          {stuClass?.name || `${stu.gradeName || 'Class'} ${stu.stream || ''}`.trim()}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Stream {stuClass?.stream || stu.stream} · {stu.programme}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-200 block">{resolvedTeacher}</span>
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                          {stu.academicYear || school.currentAcademicYear}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`font-bold text-[11px] block ${
                            stu.status === 'Active'
                              ? 'text-emerald-400'
                              : stu.status === 'Graduated'
                              ? 'text-sky-400'
                              : stu.status === 'Transferred'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {stu.status}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {stu.boardingStatus}
                          {stuHouse ? ` · ${stuHouse.name}` : ''}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-200 block">{stu.guardianName}</span>
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                          {stu.guardianPhone}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentDetail(stu)}
                            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                            title="View Full Profile & Placement History"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isAdminReviewer && (
                            <button
                              type="button"
                              onClick={() => openReassignModal(stu)}
                              className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[11px] font-semibold border border-slate-700 transition cursor-pointer whitespace-nowrap"
                              title="Assign or change student Class & Stream"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>Placement</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setActiveStudentIdCard(stu)}
                            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-[11px] font-semibold border border-slate-700 transition cursor-pointer whitespace-nowrap"
                            title="Print Student ID Card"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>ID Card</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveStudentReport(stu)}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 rounded-lg text-[11px] font-semibold border border-emerald-700/50 transition cursor-pointer whitespace-nowrap"
                            title="Terminal Report Card"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Report</span>
                          </button>

                          {confirmDeleteStudentId === stu.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteStudent(stu.id);
                                  setConfirmDeleteStudentId(null);
                                }}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteStudentId(null)}
                                className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] cursor-pointer whitespace-nowrap"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteStudentId(stu.id)}
                              className="p-1.5 hover:bg-rose-950/70 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                              title="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No students found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Full Detail & Placement History Modal */}
      {liveSelectedDetailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full text-slate-200 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setSelectedStudentDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {(() => {
              const detailCls = classes.find((c) => c.id === liveSelectedDetailStudent.classId);
              const detailTeacher = resolveTeacherDisplayName(
                liveSelectedDetailStudent.classTeacherId || detailCls?.formTutorTeacherId,
                liveSelectedDetailStudent.classTeacherName || detailCls?.classTeacherName
              );
              const historyList = [...(liveSelectedDetailStudent.placementHistory || [])].reverse();

              return (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 pr-6">
                    <div className="flex items-center gap-4">
                      <div className="relative group shrink-0">
                        <img
                          src={liveSelectedDetailStudent.photo}
                          alt={liveSelectedDetailStudent.firstName}
                          className="w-18 h-24 rounded-xl object-cover border-2 border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setPhotoEditStudent(liveSelectedDetailStudent)}
                          className="mt-1.5 w-full flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-emerald-300 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Change</span>
                        </button>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">
                          {liveSelectedDetailStudent.firstName}{' '}
                          {liveSelectedDetailStudent.otherNames
                            ? `${liveSelectedDetailStudent.otherNames} `
                            : ''}
                          {liveSelectedDetailStudent.lastName}
                        </h3>
                        <span className="font-mono text-emerald-400 text-xs font-bold tabular-nums">
                          {liveSelectedDetailStudent.studentNumber}
                        </span>
                        <span className="block text-xs text-slate-300 mt-1">
                          <strong>{detailCls?.name || liveSelectedDetailStudent.gradeName}</strong> ·{' '}
                          {liveSelectedDetailStudent.programme} · {liveSelectedDetailStudent.status}
                        </span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">
                          Section:{' '}
                          {liveSelectedDetailStudent.sectionName ||
                            detailCls?.sectionName ||
                            'Academic Section'}{' '}
                          · Class Teacher: {detailTeacher} · Year:{' '}
                          {liveSelectedDetailStudent.academicYear || school.currentAcademicYear}
                        </span>
                        {liveSelectedDetailStudent.transferDestinationSchool && (
                          <span className="block text-[11px] text-amber-400 mt-0.5">
                            Transferred To: {liveSelectedDetailStudent.transferDestinationSchool}
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdminReviewer && (
                      <button
                        type="button"
                        onClick={() => openReassignModal(liveSelectedDetailStudent)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap self-start"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Change Class / Stream</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs border-b border-slate-800">
                    <div>
                      <span className="text-slate-400 block">Date of Birth:</span>
                      <span className="font-semibold text-white">{liveSelectedDetailStudent.dob}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Ghana Card / NHIS:</span>
                      <span className="font-mono font-semibold text-white">
                        {liveSelectedDetailStudent.nationalIdOrNHIS || 'Not Recorded'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Entry Aggregate:</span>
                      <span className="font-bold text-amber-400 font-mono tabular-nums">
                        Aggregate {liveSelectedDetailStudent.beceAggregate || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Previous School:</span>
                      <span className="font-semibold text-white">
                        {liveSelectedDetailStudent.previousSchool || 'Direct Admission'}
                      </span>
                    </div>
                  </div>

                  {/* Class, Stream & Academic Year Placement History */}
                  <div className="py-4 border-b border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="font-bold text-white flex items-center gap-1.5">
                        <History className="w-4 h-4 text-emerald-400" />
                        Class, Stream &amp; Academic Year Placement History
                      </h4>
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        {historyList.length} Record{historyList.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {historyList.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {historyList.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-emerald-400">
                                  {entry.changeType}
                                </span>
                                <span className="font-mono text-[11px] text-slate-300 tabular-nums">
                                  {entry.academicYear}
                                </span>
                                <span className="text-white font-semibold">
                                  {entry.previousClassName
                                    ? `${entry.previousClassName} → ${entry.newClassName}`
                                    : entry.newClassName}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Section: {entry.newSectionName} · Stream: {entry.newStream}
                                {entry.programme ? ` (${entry.programme})` : ''}
                                {entry.classTeacherName
                                  ? ` · Teacher: ${entry.classTeacherName}`
                                  : ''}
                              </div>
                              {entry.reason && (
                                <div className="text-[11px] text-slate-400 italic mt-0.5">
                                  Note: {entry.reason}
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 sm:text-right shrink-0 tabular-nums">
                              <div>{entry.changedAt}</div>
                              <div>By {entry.changedBy}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-[11px] bg-slate-950 border border-slate-800 rounded-xl p-3">
                        Placed in {detailCls?.name || 'current stream'} ({liveSelectedDetailStudent.academicYear || school.currentAcademicYear}). Subsequent class changes and annual promotions are logged here automatically.
                      </p>
                    )}
                  </div>

                  <div className="py-3 text-xs space-y-2">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block font-semibold mb-1">
                        Guardian / Contact Information:
                      </span>
                      <p className="text-white font-medium">
                        {liveSelectedDetailStudent.guardianName} (
                        {liveSelectedDetailStudent.guardianRelationship})
                      </p>
                      <p className="text-emerald-400 font-mono text-[11px] mt-0.5 tabular-nums">
                        {liveSelectedDetailStudent.guardianPhone} ·{' '}
                        {liveSelectedDetailStudent.guardianEmail}
                      </p>
                    </div>

                    <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-900/40 text-rose-300">
                      <span className="font-bold flex items-center gap-1.5">
                        <HeartPulse className="w-4 h-4 text-rose-400" />
                        Medical Alerts &amp; Care Instructions:
                      </span>
                      <p className="mt-1 text-slate-300">{liveSelectedDetailStudent.medicalInfo}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
                    {confirmDeleteStudentId === liveSelectedDetailStudent.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            deleteStudent(liveSelectedDetailStudent.id);
                            setConfirmDeleteStudentId(null);
                            setSelectedStudentDetail(null);
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteStudentId(null)}
                          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteStudentId(liveSelectedDetailStudent.id)}
                        className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-semibold border border-rose-800/40 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Student</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveStudentIdCard(liveSelectedDetailStudent);
                          setSelectedStudentDetail(null);
                        }}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Print ID Card
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveStudentReport(liveSelectedDetailStudent);
                          setSelectedStudentDetail(null);
                        }}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Report Card
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Enroll New Student Form Modal (with Linked Section -> Class/Grade -> Stream -> Teacher) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full text-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-lg text-white">
                  Enrol New Student &amp; Assign Class/Stream Placement
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select Academic Year, Educational Section, Class/Grade, and Stream to connect the student directly to the class register, timetable, teachers, attendance &amp; exam sheets.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} noValidate className="py-4 space-y-4 text-xs">
              {enrollValidationError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-700/60 text-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{enrollValidationError}</span>
                </div>
              )}

              {liveDuplicateWarning && (
                <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-700/60 text-amber-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-300">
                      Duplicate Enrolment Prevention Alert
                    </span>
                    <span>{liveDuplicateWarning.reason}</span>
                  </div>
                </div>
              )}

              {/* Passport Photo Upload Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-18 rounded-xl overflow-hidden bg-slate-900 border-2 border-emerald-500/70 flex items-center justify-center shrink-0">
                    {newStudent.photo ? (
                      <img
                        src={newStudent.photo}
                        alt="Passport Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-white block">Student Passport Photograph</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Displayed on Student ID Card, Class Register, Attendance Sheet, Exam Sheet &amp; Report Card
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEnrollPhotoModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap self-start sm:self-center"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{newStudent.photo ? 'Change / Crop Photo' : 'Upload Passport Photo'}</span>
                </button>
              </div>

              {/* Linked Academic Placement Block */}
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    Academic Section, Class &amp; Stream Placement
                  </h4>
                  {newStudent.classId && (
                    <span className="text-[11px] font-semibold text-emerald-300">
                      Placement: {classes.find((c) => c.id === newStudent.classId)?.name}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Academic Year *</label>
                    <input
                      type="text"
                      value={newStudent.academicYear}
                      onChange={(e) => {
                        setEnrollValidationError(null);
                        setNewStudent({ ...newStudent, academicYear: e.target.value });
                      }}
                      placeholder="e.g. 2024/2025"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Educational Section *</label>
                    <select
                      value={newStudent.sectionId}
                      onChange={(e) => handleEnrollSectionChange(e.target.value)}
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
                      value={newStudent.gradeId}
                      disabled={!newStudent.sectionId}
                      onChange={(e) => handleEnrollGradeChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value="">
                        {newStudent.sectionId
                          ? '-- Select Class / Grade --'
                          : 'Select Section first'}
                      </option>
                      {enrollGradesForSection.map((grd) => (
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
                      {newStudent.gradeId && (
                        <button
                          type="button"
                          onClick={() => setShowInlineStreamCreator((prev) => !prev)}
                          className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer whitespace-nowrap"
                        >
                          {showInlineStreamCreator ? 'Hide' : '+ Add Stream'}
                        </button>
                      )}
                    </div>
                    <select
                      value={newStudent.classId}
                      disabled={!newStudent.gradeId}
                      onChange={(e) => handleEnrollStreamChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      {!newStudent.gradeId ? (
                        <option value="">Select Class / Grade first</option>
                      ) : enrollStreamsForGrade.length === 0 ? (
                        <option value="__auto_a__">Stream A (Default Stream)</option>
                      ) : (
                        <option value="">-- Select Stream / Division --</option>
                      )}
                      {enrollStreamsForGrade.map((streamCls) => (
                        <option key={streamCls.id} value={streamCls.id}>
                          {streamCls.name} (Stream {streamCls.stream}
                          {streamCls.programme ? ` · ${streamCls.programme}` : ''})
                        </option>
                      ))}
                      {newStudent.gradeId && (
                        <option value="__create_new_stream__">
                          + Create another Stream (A, B, C, D...)
                        </option>
                      )}
                    </select>
                    {newStudent.gradeId && (showInlineStreamCreator || enrollStreamsForGrade.length === 0) && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={inlineStreamDivision}
                          onChange={(e) => setInlineStreamDivision(e.target.value)}
                          placeholder="e.g. A, B, C"
                          className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          disabled={quickStreamCreating}
                          onClick={() => handleQuickCreateStreamInEnroll()}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer whitespace-nowrap"
                        >
                          + Create Stream for {selectedEnrollGradeObj?.name}
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">
                      Class Teacher (Auto-linked or Assign)
                    </label>
                    <select
                      value={newStudent.classTeacherId}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, classTeacherId: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Class Stream Form Teacher --</option>
                      {teacherOptions.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Student Bio-Data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.firstName}
                    onChange={(e) => {
                      setEnrollValidationError(null);
                      setNewStudent({ ...newStudent, firstName: e.target.value });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Kwame"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.lastName}
                    onChange={(e) => {
                      setEnrollValidationError(null);
                      setNewStudent({ ...newStudent, lastName: e.target.value });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Mensah"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Other Names</label>
                  <input
                    type="text"
                    value={newStudent.otherNames}
                    onChange={(e) => setNewStudent({ ...newStudent, otherNames: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Kwabena"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Gender</label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, gender: e.target.value as 'Male' | 'Female' })
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
                    value={newStudent.dob}
                    onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Residential Status</label>
                  <select
                    value={newStudent.boardingStatus}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        boardingStatus: e.target.value as 'Boarding' | 'Day',
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Day">Day Student</option>
                    <option value="Boarding">Boarding Student</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Boarding House</label>
                  <select
                    value={newStudent.houseId}
                    onChange={(e) => setNewStudent({ ...newStudent, houseId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Not Applicable</option>
                    {boardingHouses.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Course / Programme / Curriculum Track
                  </label>
                  {!useCustomProgrammeInput && courseTracks.length > 0 ? (
                    <select
                      value={
                        courseTracks.some((ct) => ct.name === newStudent.programme)
                          ? newStudent.programme
                          : courseTracks[0]?.name || ''
                      }
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setUseCustomProgrammeInput(true);
                          setNewStudent({ ...newStudent, programme: '' });
                        } else {
                          setNewStudent({ ...newStudent, programme: e.target.value });
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
                        value={newStudent.programme}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, programme: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                        placeholder="State custom course / programme..."
                      />
                      {courseTracks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setUseCustomProgrammeInput(false);
                            setNewStudent({
                              ...newStudent,
                              programme: courseTracks[0]?.name || 'General Academics',
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
                  <label className="block text-slate-400 mb-1">Previous School Attended</label>
                  <input
                    type="text"
                    value={newStudent.previousSchool}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, previousSchool: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Morning Star Basic School"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h4 className="font-bold text-slate-300 mb-2">Guardian / Parent Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Guardian Name *</label>
                    <input
                      type="text"
                      required
                      value={newStudent.guardianName}
                      onChange={(e) => {
                        setEnrollValidationError(null);
                        setNewStudent({ ...newStudent, guardianName: e.target.value });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. Alhaji Ibrahim Yakubu"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={newStudent.guardianPhone}
                      onChange={(e) => {
                        setEnrollValidationError(null);
                        setNewStudent({ ...newStudent, guardianPhone: e.target.value });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                      placeholder="e.g. +233 24 456 7890"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={newStudent.guardianEmail}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, guardianEmail: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. guardian@email.com"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Ghana Card / NHIS Number</label>
                  <input
                    type="text"
                    value={newStudent.nationalIdOrNHIS}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, nationalIdOrNHIS: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="e.g. GHA-718293041-9"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Medical / Allergy Notes</label>
                  <input
                    type="text"
                    value={newStudent.medicalInfo}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, medicalInfo: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. None"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(liveDuplicateWarning)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                >
                  Enrol &amp; Place in Class Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post-Enrolment Class & Stream Reassignment Modal (Admins Only) */}
      {reassignTargetStudent && isAdminReviewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full text-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                  Assign / Change Student Class &amp; Stream
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {reassignTargetStudent.firstName} {reassignTargetStudent.lastName} (
                  {reassignTargetStudent.studentNumber})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReassignTargetStudent(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReassignment} noValidate className="py-4 space-y-3.5 text-xs">
              {reassignError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-700/60 text-rose-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{reassignError}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                Current Placement:{' '}
                <strong className="text-white">
                  {classes.find((c) => c.id === reassignTargetStudent.classId)?.name ||
                    reassignTargetStudent.gradeName ||
                    'Unassigned'}
                </strong>{' '}
                · Academic Year:{' '}
                <strong className="text-emerald-400 font-mono">
                  {reassignTargetStudent.academicYear || school.currentAcademicYear}
                </strong>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Academic Year *</label>
                  <input
                    type="text"
                    value={reassignForm.academicYear}
                    onChange={(e) =>
                      setReassignForm({ ...reassignForm, academicYear: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Educational Section *</label>
                  <select
                    value={reassignForm.sectionId}
                    onChange={(e) => {
                      setReassignError(null);
                      const nextSecId = e.target.value;
                      const firstGrade = nextSecId
                        ? activeGrades.find((g) => g.sectionId === nextSecId)
                        : undefined;
                      const firstStream = firstGrade
                        ? activeStreams.find((c) => c.gradeId === firstGrade.id)
                        : undefined;
                      setReassignForm({
                        ...reassignForm,
                        sectionId: nextSecId,
                        gradeId: firstGrade?.id || '',
                        classId: firstStream?.id || '',
                        classTeacherId: firstStream?.formTutorTeacherId || reassignForm.classTeacherId,
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
                    value={reassignForm.gradeId}
                    disabled={!reassignForm.sectionId}
                    onChange={(e) => {
                      setReassignError(null);
                      const grdId = e.target.value;
                      const streams = activeStreams.filter((c) => c.gradeId === grdId);
                      const firstStream = streams[0];
                      setReassignForm({
                        ...reassignForm,
                        gradeId: grdId,
                        classId: firstStream?.id || '',
                        classTeacherId:
                          firstStream?.formTutorTeacherId || reassignForm.classTeacherId,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value="">-- Select Class / Grade --</option>
                    {reassignGradesForSection.map((grd) => (
                      <option key={grd.id} value={grd.id}>
                        {grd.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Stream / Division *</label>
                  <select
                    value={reassignForm.classId}
                    disabled={!reassignForm.gradeId}
                    onChange={(e) => {
                      setReassignError(null);
                      const clsObj = activeStreams.find((c) => c.id === e.target.value);
                      setReassignForm({
                        ...reassignForm,
                        classId: e.target.value,
                        classTeacherId: clsObj?.formTutorTeacherId || reassignForm.classTeacherId,
                        programme: clsObj?.programme || reassignForm.programme,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value="">-- Select Stream / Division --</option>
                    {reassignStreamsForGrade.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} (Stream {cls.stream})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Class Teacher</label>
                <select
                  value={reassignForm.classTeacherId}
                  onChange={(e) =>
                    setReassignForm({ ...reassignForm, classTeacherId: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Use Stream Class Teacher --</option>
                  {teacherOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Reason for Placement Change (Saved to Permanent History)
                </label>
                <input
                  type="text"
                  value={reassignForm.reason}
                  onChange={(e) => setReassignForm({ ...reassignForm, reason: e.target.value })}
                  placeholder="e.g. Moved from Basic 3 A to Basic 3 B to balance stream size"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReassignTargetStudent(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer whitespace-nowrap"
                >
                  Save Placement &amp; Log History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* End-of-Year Class Promotion, Graduation & Transfer Modal */}
      {showPromoteModal && isAdminReviewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full text-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-400" />
                  End-of-Year Class Promotion, Stream Assignment &amp; Transfers
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Promote students to the next class and assign them to a new stream, or record transfers/graduations while preserving all previous academic records and class history.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPromoteModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecutePromotionOrTransfer} noValidate className="py-4 space-y-4 text-xs">
              {promoError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-700/60 text-rose-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{promoError}</span>
                </div>
              )}

              {/* Source Class & Action Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Source Class &amp; Stream ({school.currentAcademicYear}) *
                  </label>
                  <select
                    value={promoSourceClassId}
                    onChange={(e) => syncPromoDefaultsForSourceClass(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {activeStreams.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({students.filter((s) => s.classId === cls.id && s.status === 'Active').length} active)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Progression Action *</label>
                  <select
                    value={promoAction}
                    onChange={(e) => {
                      const act = e.target.value as 'promote' | 'transfer' | 'graduate';
                      setPromoAction(act);
                      setPromoError(null);
                      setPromoReason(
                        act === 'promote'
                          ? 'End-of-academic-year class promotion'
                          : act === 'graduate'
                          ? 'Completed final-year academic cycle'
                          : 'Official student transfer'
                      );
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="promote">Promote to Next Class &amp; Assign Stream</option>
                    <option value="transfer">Transfer Student(s) to Another School</option>
                    <option value="graduate">Graduate Final-Year Cohort</option>
                  </select>
                </div>
              </div>

              {/* Destination Class & Stream Linked Selectors (for Promote) */}
              {promoAction === 'promote' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-800/40 space-y-3">
                  <h4 className="font-bold text-emerald-400">
                    Destination Class &amp; New Stream Placement
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">New Academic Year *</label>
                      <input
                        type="text"
                        value={promoTargetAcademicYear}
                        onChange={(e) => setPromoTargetAcademicYear(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Destination Section *</label>
                      <select
                        value={promoTargetSectionId}
                        onChange={(e) => {
                          const nextSecId = e.target.value;
                          const firstGrade = nextSecId
                            ? activeGrades.find((g) => g.sectionId === nextSecId)
                            : undefined;
                          const firstStream = firstGrade
                            ? activeStreams.find((c) => c.gradeId === firstGrade.id)
                            : undefined;
                          setPromoTargetSectionId(nextSecId);
                          setPromoTargetGradeId(firstGrade?.id || '');
                          setPromoTargetClassId(firstStream?.id || '');
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Select Section --</option>
                        {activeSections.map((sec) => (
                          <option key={sec.id} value={sec.id}>
                            {sec.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Next Class / Grade *</label>
                      <select
                        value={promoTargetGradeId}
                        disabled={!promoTargetSectionId}
                        onChange={(e) => {
                          const grdId = e.target.value;
                          setPromoTargetGradeId(grdId);
                          const streams = activeStreams.filter((c) => c.gradeId === grdId);
                          setPromoTargetClassId(streams[0]?.id || '');
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      >
                        <option value="">-- Select Class --</option>
                        {promoTargetGrades.map((grd) => (
                          <option key={grd.id} value={grd.id}>
                            {grd.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">New Stream *</label>
                      <select
                        value={promoTargetClassId}
                        disabled={!promoTargetGradeId}
                        onChange={(e) => setPromoTargetClassId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      >
                        <option value="">-- Select Stream --</option>
                        {promoTargetStreams.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-[11px] text-slate-300 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={promoAdvanceSchoolYear}
                      onChange={(e) => setPromoAdvanceSchoolYear(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-emerald-500"
                    />
                    <span>
                      Also advance institution’s active Academic Year to{' '}
                      <strong className="font-mono text-emerald-400">
                        {promoTargetAcademicYear}
                      </strong>{' '}
                      (Term 1)
                    </span>
                  </label>
                </div>
              )}

              {promoAction === 'transfer' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-800/40 space-y-3">
                  <label className="block text-slate-300 font-semibold">
                    Receiving / Destination School Name *
                  </label>
                  <input
                    type="text"
                    value={promoTransferSchool}
                    onChange={(e) => setPromoTransferSchool(e.target.value)}
                    placeholder="e.g. Achimota School / Ridge Church School"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Student Selection Register */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-white">
                    Select Students ({promoSelectedStudentIds.length} of{' '}
                    {promoSourceStudents.length} selected)
                  </span>
                  {promoSourceStudents.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPromoSelectedStudentIds(promoSourceStudents.map((s) => s.id))
                        }
                        className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-600">·</span>
                      <button
                        type="button"
                        onClick={() => setPromoSelectedStudentIds([])}
                        className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {promoSourceStudents.length > 0 ? (
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/60">
                    {promoSourceStudents.map((stu) => {
                      const checked = promoSelectedStudentIds.includes(stu.id);
                      return (
                        <label
                          key={stu.id}
                          className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-900/60 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPromoSelectedStudentIds((prev) => [...prev, stu.id]);
                                } else {
                                  setPromoSelectedStudentIds((prev) =>
                                    prev.filter((id) => id !== stu.id)
                                  );
                                }
                              }}
                              className="rounded border-slate-700 bg-slate-900 text-emerald-500"
                            />
                            <img
                              src={stu.photo}
                              alt={stu.firstName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-700"
                            />
                            <div>
                              <span className="font-bold text-white">
                                {stu.lastName}, {stu.firstName}
                              </span>
                              <span className="ml-2 font-mono text-[11px] text-emerald-400 tabular-nums">
                                {stu.studentNumber}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400">{stu.programme}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400">
                    No active students currently placed in this class stream.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Official Progression Remark</label>
                <input
                  type="text"
                  value={promoReason}
                  onChange={(e) => setPromoReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPromoteModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer whitespace-nowrap"
                >
                  {promoAction === 'promote'
                    ? 'Confirm Promotion & Assign Stream'
                    : promoAction === 'transfer'
                    ? 'Confirm Student Transfer'
                    : 'Confirm Cohort Graduation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Passport Photo Modal for New Enrollment */}
      <ImageUploadModal
        isOpen={showEnrollPhotoModal}
        onClose={() => setShowEnrollPhotoModal(false)}
        targetType="student"
        currentImage={newStudent.photo}
        title="Upload Student Passport Photograph"
        entityName={`${newStudent.firstName} ${newStudent.lastName}`.trim() || 'New Student'}
        onSave={(url) => setNewStudent((prev) => ({ ...prev, photo: url }))}
      />

      {/* Passport Photo Modal for Enrolled Student */}
      <ImageUploadModal
        isOpen={Boolean(photoEditStudent)}
        onClose={() => setPhotoEditStudent(null)}
        targetType="student"
        currentImage={photoEditStudent?.photo || ''}
        title="Update Student Passport Photograph"
        entityName={
          photoEditStudent
            ? `${photoEditStudent.firstName} ${photoEditStudent.lastName}`
            : undefined
        }
        entityRoleOrCode={photoEditStudent?.studentNumber}
        onSave={(newPhotoUrl) => {
          if (!photoEditStudent) return;
          const res = submitStudentPhotoRequest({
            studentId: photoEditStudent.id,
            newPhoto: newPhotoUrl,
          });
          if (res.immediateApplied && selectedStudentDetail?.id === photoEditStudent.id) {
            setSelectedStudentDetail({ ...selectedStudentDetail, photo: newPhotoUrl });
          }
          setPhotoEditStudent(null);
        }}
      />

      {activeStudentIdCard && (
        <StudentIdCardModal
          student={activeStudentIdCard}
          onClose={() => setActiveStudentIdCard(null)}
        />
      )}

      {activeStudentReport && (
        <ReportCardModal
          student={activeStudentReport}
          onClose={() => setActiveStudentReport(null)}
        />
      )}
    </div>
  );
};
