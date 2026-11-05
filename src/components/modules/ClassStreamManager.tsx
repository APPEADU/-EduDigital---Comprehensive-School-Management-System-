import React, { useState, useMemo, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ClassRoom, Student } from '../../types';
import {
  GHANA_EDUCATIONAL_PRESETS,
  SHS_STANDARD_PROGRAMMES,
  STANDARD_STREAM_LETTERS,
  formatClassStreamDisplayName,
} from '../../utils/ghanaianClassStructure';
import { ReportCardModal } from '../modals/ReportCardModal';
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  UserCheck,
  Calendar,
  ClipboardCheck,
  FileSpreadsheet,
  BarChart3,
  SlidersHorizontal,
  Check,
  AlertCircle,
  ArrowRight,
  Printer,
  BookOpen,
  Building2,
} from 'lucide-react';

export const ClassStreamManager: React.FC = () => {
  const {
    school,
    currentUser,
    isPlatformAdmin,
    educationalSections,
    gradeClasses,
    classes,
    students,
    staff,
    users,
    subjects,
    courseTracks,
    timetable,
    attendance,
    examResults,
    addTimetablePeriod,
    deleteTimetablePeriod,
    resolveTeacherDisplayName,
    applyOfferedSectionsPreset,
    addEducationalSection,
    updateEducationalSection,
    deleteEducationalSection,
    addGradeClass,
    updateGradeClass,
    deleteGradeClass,
    addClassStream,
    addClassStreamsBulk,
    updateClassStream,
    assignSubjectTeacherToStream,
    deleteClassStream,
    setActiveModule,
  } = useSchool();

  const canManageStructure =
    ['proprietor', 'admin'].includes(currentUser.role) || isPlatformAdmin;

  // Top-level view mode: 'workspace' (Active Streams & Stream Hub) vs 'structure' (Sections & Classes Offered Config)
  const [viewMode, setViewMode] = useState<'workspace' | 'structure'>('workspace');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [showInactiveStreams, setShowInactiveStreams] = useState<boolean>(false);

  const visibleStreams = useMemo(() => {
    const activeSecIds = new Set(
      educationalSections.filter((s) => s.active).map((s) => s.id)
    );
    const activeGrdIds = new Set(
      gradeClasses.filter((g) => g.active).map((g) => g.id)
    );

    return classes.filter((cls) => {
      if (!showInactiveStreams && cls.active === false) return false;
      if (!showInactiveStreams) {
        if (cls.sectionId && !activeSecIds.has(cls.sectionId)) return false;
        if (cls.gradeId && !activeGrdIds.has(cls.gradeId)) return false;
      }
      if (sectionFilter !== 'ALL' && cls.sectionId !== sectionFilter) return false;
      return true;
    });
  }, [classes, educationalSections, gradeClasses, sectionFilter, showInactiveStreams]);

  const [selectedStreamId, setSelectedStreamId] = useState<string>(
    visibleStreams[0]?.id || classes[0]?.id || ''
  );

  useEffect(() => {
    if (visibleStreams.length > 0 && !visibleStreams.some((c) => c.id === selectedStreamId)) {
      setSelectedStreamId(visibleStreams[0].id);
    }
  }, [visibleStreams, selectedStreamId]);

  const selectedStream: ClassRoom | undefined = useMemo(
    () => classes.find((c) => c.id === selectedStreamId),
    [classes, selectedStreamId]
  );

  // Stream workspace sub-tab
  const [streamSubTab, setStreamSubTab] = useState<
    'register' | 'teachers' | 'timetable' | 'attendance' | 'assessments' | 'performance'
  >('register');

  // Inline feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const showBanner = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Teacher options (combining Staff & Teacher/Admin Portal Accounts)
  const teacherOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    staff.forEach((st) => {
      map.set(st.id, { id: st.id, label: `${st.fullName} (${st.role})` });
    });
    users
      .filter((u) => ['teacher', 'admin', 'proprietor', 'housemaster'].includes(u.role))
      .forEach((u) => {
        if (!map.has(u.id)) {
          map.set(u.id, { id: u.id, label: `${u.name} (${u.title || u.role})` });
        }
      });
    return Array.from(map.values());
  }, [staff, users]);

  // SHS Programme options (canonical GES SHS programmes + school's custom courses)
  const shsProgrammeOptions = useMemo(() => {
    const set = new Set<string>(SHS_STANDARD_PROGRAMMES);
    courseTracks.forEach((t) => {
      if (t.name && t.name.trim()) set.add(t.name.trim());
    });
    return Array.from(set);
  }, [courseTracks]);

  // ============================================================================
  // CREATE STREAM MODAL / DRAWER STATE
  // ============================================================================
  const [showCreateStreamModal, setShowCreateStreamModal] = useState(false);
  const activeSections = useMemo(
    () => educationalSections.filter((s) => s.active).sort((a, b) => a.order - b.order),
    [educationalSections]
  );

  const [newStreamSectionId, setNewStreamSectionId] = useState<string>(
    activeSections[0]?.id || educationalSections[0]?.id || ''
  );
  const gradesForNewStreamSection = useMemo(
    () =>
      gradeClasses
        .filter((g) => g.sectionId === newStreamSectionId && g.active)
        .sort((a, b) => a.order - b.order),
    [gradeClasses, newStreamSectionId]
  );
  const [newStreamGradeId, setNewStreamGradeId] = useState<string>(
    gradesForNewStreamSection[0]?.id || ''
  );
  const [streamCreateMode, setStreamCreateMode] = useState<'single' | 'bulk'>('single');
  const [newStreamDivision, setNewStreamDivision] = useState<string>('A');
  const [bulkLetters, setBulkLetters] = useState<string[]>(['A', 'B', 'C']);
  const [newStreamProgramme, setNewStreamProgramme] = useState<string>('');
  const [newStreamCustomName, setNewStreamCustomName] = useState<string>('');
  const [newStreamTeacherId, setNewStreamTeacherId] = useState<string>(
    teacherOptions[0]?.id || currentUser.id
  );
  const [newStreamRoom, setNewStreamRoom] = useState<string>('');
  const [newStreamCapacity, setNewStreamCapacity] = useState<number>(40);

  useEffect(() => {
    if (
      gradesForNewStreamSection.length > 0 &&
      !gradesForNewStreamSection.some((g) => g.id === newStreamGradeId)
    ) {
      setNewStreamGradeId(gradesForNewStreamSection[0].id);
    }
  }, [gradesForNewStreamSection, newStreamGradeId]);

  const selectedGradeForCreate = gradeClasses.find((g) => g.id === newStreamGradeId);

  const previewStreamName = useMemo(() => {
    if (!selectedGradeForCreate) return '';
    if (newStreamCustomName.trim()) return newStreamCustomName.trim();
    return formatClassStreamDisplayName(
      selectedGradeForCreate,
      newStreamDivision || 'A',
      selectedGradeForCreate.isShs ? newStreamProgramme : undefined
    ).displayName;
  }, [selectedGradeForCreate, newStreamDivision, newStreamProgramme, newStreamCustomName]);

  const handleCreateStreamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreamGradeId) {
      showBanner('error', 'Please select a Class / Grade before creating a stream.');
      return;
    }

    if (streamCreateMode === 'bulk') {
      if (bulkLetters.length === 0) {
        showBanner('error', 'Select at least one stream division (A, B, C, D, or E).');
        return;
      }
      const created = addClassStreamsBulk({
        gradeId: newStreamGradeId,
        streamDivisions: bulkLetters,
        programme: selectedGradeForCreate?.isShs ? newStreamProgramme || undefined : undefined,
        defaultCapacity: newStreamCapacity,
        roomPrefix: newStreamRoom || undefined,
        formTutorTeacherId: newStreamTeacherId,
      });
      if (created.length === 0) {
        showBanner('error', 'All selected streams already exist for this class.');
        return;
      }
      setSelectedStreamId(created[0].id);
      setShowCreateStreamModal(false);
      showBanner('success', `Created ${created.length} stream(s): ${created.map((c) => c.name).join(', ')}`);
      return;
    }

    const res = addClassStream({
      gradeId: newStreamGradeId,
      streamDivision: newStreamDivision,
      programme: selectedGradeForCreate?.isShs ? newStreamProgramme || undefined : undefined,
      customDisplayName: newStreamCustomName.trim() || undefined,
      formTutorTeacherId: newStreamTeacherId,
      roomNumber: newStreamRoom,
      capacity: newStreamCapacity,
    });

    if (!res.success) {
      showBanner('error', res.message || 'Could not create stream.');
      return;
    }
    if (res.classRoom) {
      setSelectedStreamId(res.classRoom.id);
    }
    setNewStreamCustomName('');
    setShowCreateStreamModal(false);
    showBanner('success', `Created class stream "${res.classRoom?.name}".`);
  };

  // ============================================================================
  // EDIT STREAM MODAL STATE
  // ============================================================================
  const [editingStream, setEditingStream] = useState<ClassRoom | null>(null);
  const [editStreamName, setEditStreamName] = useState('');
  const [editStreamCode, setEditStreamCode] = useState('');
  const [editStreamProgramme, setEditStreamProgramme] = useState('');
  const [editStreamRoom, setEditStreamRoom] = useState('');
  const [editStreamCapacity, setEditStreamCapacity] = useState(40);
  const [editStreamTeacherId, setEditStreamTeacherId] = useState('');

  const openEditStreamModal = (cls: ClassRoom) => {
    setEditingStream(cls);
    setEditStreamName(cls.name);
    setEditStreamCode(cls.stream);
    setEditStreamProgramme(cls.programme || '');
    setEditStreamRoom(cls.roomNumber);
    setEditStreamCapacity(cls.capacity);
    setEditStreamTeacherId(cls.formTutorTeacherId);
  };

  const handleSaveEditStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStream || !editStreamName.trim()) return;
    updateClassStream(editingStream.id, {
      name: editStreamName.trim(),
      stream: editStreamCode.trim() || editingStream.stream,
      programme: editStreamProgramme.trim() || undefined,
      roomNumber: editStreamRoom.trim() || editingStream.roomNumber,
      capacity: Math.max(1, editStreamCapacity),
      formTutorTeacherId: editStreamTeacherId,
    });
    setEditingStream(null);
    showBanner('success', 'Updated stream configuration.');
  };

  // ============================================================================
  // STRUCTURE MANAGEMENT STATE (SECTIONS & GRADES)
  // ============================================================================
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionIsShs, setNewSectionIsShs] = useState(false);
  const [renamingSectionId, setRenamingSectionId] = useState<string | null>(null);
  const [renameSectionValue, setRenameSectionValue] = useState('');

  const [addingGradeForSecId, setAddingGradeForSecId] = useState<string | null>(null);
  const [newGradeNameInput, setNewGradeNameInput] = useState('');
  const [renamingGradeId, setRenamingGradeId] = useState<string | null>(null);
  const [renameGradeValue, setRenameGradeValue] = useState('');

  // Inline Timetable Period Add inside Selected Stream
  const [ttDay, setTtDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [ttPeriodNum, setTtPeriodNum] = useState(1);
  const [ttStart, setTtStart] = useState('08:00');
  const [ttEnd, setTtEnd] = useState('09:00');
  const [ttSubjectId, setTtSubjectId] = useState(subjects[0]?.id || '');

  // Report Card Preview from Performance tab
  const [reportCardStudent, setReportCardStudent] = useState<Student | null>(null);

  // Derived data for selected stream
  const streamStudents = useMemo(
    () =>
      selectedStream
        ? students.filter((s) => s.classId === selectedStream.id && s.status !== 'Transferred' && s.status !== 'Withdrawn')
        : [],
    [students, selectedStream]
  );

  const streamTimetable = useMemo(
    () =>
      selectedStream
        ? timetable
            .filter((t) => t.classId === selectedStream.id)
            .sort((a, b) => a.periodNumber - b.periodNumber)
        : [],
    [timetable, selectedStream]
  );

  const streamAttendance = useMemo(
    () =>
      selectedStream
        ? attendance.filter((a) => a.classId === selectedStream.id)
        : [],
    [attendance, selectedStream]
  );

  const streamExamResults = useMemo(() => {
    if (!selectedStream) return [];
    const stuIds = new Set(streamStudents.map((s) => s.id));
    return examResults.filter(
      (r) =>
        (r.classId === selectedStream.id || stuIds.has(r.studentId)) &&
        r.academicYear === school.currentAcademicYear &&
        r.term === school.currentTerm
    );
  }, [examResults, selectedStream, streamStudents, school.currentAcademicYear, school.currentTerm]);

  // Applicable subjects for this stream
  const streamSubjects = useMemo(() => {
    if (!selectedStream) return subjects;
    const matched = subjects.filter((sub) => {
      if (sub.level === 'All Levels') return true;
      if (selectedStream.sectionId === 'sec-preschool' && (sub.level === 'Pre-School' || sub.level === 'Basic')) {
        return true;
      }
      if (sub.level === selectedStream.level) {
        if (selectedStream.programme && sub.programme && sub.category === 'Elective') {
          return (
            sub.programme.toLowerCase().includes(selectedStream.programme.toLowerCase()) ||
            selectedStream.programme.toLowerCase().includes(sub.programme.toLowerCase())
          );
        }
        return true;
      }
      return Boolean(sub.isCustom);
    });
    return matched.length > 0 ? matched : subjects;
  }, [subjects, selectedStream]);

  // Performance analytics for selected stream
  const performanceMetrics = useMemo(() => {
    if (streamStudents.length === 0) {
      return {
        classMean: 0,
        passRate: 0,
        studentStandings: [] as Array<{
          student: Student;
          subjectsCount: number;
          avgScore: number;
          totalMarks: number;
        }>,
        subjectAverages: [] as Array<{
          subjectId: string;
          subjectName: string;
          teacherName: string;
          entries: number;
          meanScore: number;
        }>,
      };
    }

    const standings = streamStudents
      .map((stu) => {
        const res = streamExamResults.filter((r) => r.studentId === stu.id);
        const totalMarks = res.reduce((acc, r) => acc + r.totalScore, 0);
        const avgScore = res.length > 0 ? totalMarks / res.length : 0;
        return {
          student: stu,
          subjectsCount: res.length,
          avgScore,
          totalMarks,
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore);

    const evaluatedStudents = standings.filter((s) => s.subjectsCount > 0);
    const classMean =
      evaluatedStudents.length > 0
        ? evaluatedStudents.reduce((a, b) => a + b.avgScore, 0) / evaluatedStudents.length
        : 0;
    const passCount = evaluatedStudents.filter((s) => s.avgScore >= 50).length;
    const passRate =
      evaluatedStudents.length > 0 ? (passCount / evaluatedStudents.length) * 100 : 0;

    const subjectAverages = streamSubjects
      .map((sub) => {
        const subRes = streamExamResults.filter((r) => r.subjectId === sub.id);
        const assignedTid = selectedStream?.subjectTeachers?.[sub.id];
        const teacherName = assignedTid
          ? resolveTeacherDisplayName(assignedTid)
          : 'Unassigned';
        const meanScore =
          subRes.length > 0
            ? subRes.reduce((acc, r) => acc + r.totalScore, 0) / subRes.length
            : 0;
        return {
          subjectId: sub.id,
          subjectName: sub.name,
          teacherName,
          entries: subRes.length,
          meanScore,
        };
      })
      .filter((item) => item.entries > 0 || selectedStream?.subjectTeachers?.[item.subjectId]);

    return {
      classMean,
      passRate,
      studentStandings: standings,
      subjectAverages,
    };
  }, [streamStudents, streamExamResults, streamSubjects, selectedStream, resolveTeacherDisplayName]);

  // Group streams by section for left navigation
  const streamsGroupedBySection = useMemo(() => {
    const sortedSections = [...educationalSections].sort((a, b) => a.order - b.order);
    return sortedSections
      .filter((sec) => showInactiveStreams || sec.active)
      .map((sec) => {
        const secStreams = visibleStreams.filter((c) => c.sectionId === sec.id);
        return { section: sec, streams: secStreams };
      })
      .filter((group) => group.streams.length > 0 || sectionFilter === group.section.id);
  }, [educationalSections, visibleStreams, showInactiveStreams, sectionFilter]);

  return (
    <div className="space-y-5">
      {/* Top Summary & Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Educational Sections, Classes &amp; Streams</span>
            </h3>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-700/40 text-emerald-300 tabular-nums">
              {activeSections.length} Active Section{activeSections.length === 1 ? '' : 's'} ·{' '}
              {gradeClasses.filter((g) => g.active).length} Active Classes ·{' '}
              {classes.filter((c) => c.active !== false).length} Streams
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Configure only the educational sections and classes offered by <strong className="text-slate-200">{school.name}</strong> (Creche through SHS 3), manage streams A–E &amp; SHS programmes, and oversee registers, teachers, timetables, attendance, and exam reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('workspace')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                viewMode === 'workspace'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Streams &amp; Registers
            </button>
            <button
              type="button"
              onClick={() => setViewMode('structure')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                viewMode === 'structure'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Configure Sections &amp; Classes Offered</span>
            </button>
          </div>

          {canManageStructure && (
            <button
              type="button"
              onClick={() => {
                if (activeSections.length > 0 && !activeSections.some((s) => s.id === newStreamSectionId)) {
                  setNewStreamSectionId(activeSections[0].id);
                }
                setShowCreateStreamModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Create Class / Stream</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-200'
              : 'bg-rose-950/70 border-rose-700/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================
          MODE A: CONFIGURE INSTITUTION SECTIONS & CLASSES OFFERED (CRECHE – SHS 3)
          ======================================================================== */}
      {viewMode === 'structure' && (
        <div className="space-y-5">
          {/* Quick Institutional Scope Presets */}
          {canManageStructure && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>Select Only the Educational Levels Your School Offers</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Apply a Ghanaian school preset (for example, KG 1 – Basic 6 only without JHS or SHS) or toggle individual sections and classes below.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pt-1">
                {GHANA_EDUCATIONAL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      applyOfferedSectionsPreset(preset.id, { generateDefaultStreams: true });
                      showBanner(
                        'success',
                        `Applied "${preset.label}" structure and ensured active streams are ready.`
                      );
                    }}
                    className="text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 transition cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300 flex items-center justify-between gap-2">
                      <span>{preset.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add Custom Educational Section */}
          {canManageStructure && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newSectionName.trim()) return;
                addEducationalSection({
                  name: newSectionName.trim(),
                  isShs: newSectionIsShs,
                });
                setNewSectionName('');
                setNewSectionIsShs(false);
                showBanner('success', `Added educational section "${newSectionName.trim()}".`);
              }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-end gap-3 text-xs"
            >
              <div className="flex-1">
                <label className="block text-slate-400 mb-1 font-semibold">
                  Create Additional Educational Section (Optional)
                </label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="e.g. Early Childhood Montessori, Cambridge IGCSE Wing, Remedial SHS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={newSectionIsShs}
                  onChange={(e) => setNewSectionIsShs(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span>Uses SHS Programme Tracks</span>
              </label>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer whitespace-nowrap"
              >
                + Add Section
              </button>
            </form>
          )}

          {/* Sections & Their Grade Classes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...educationalSections]
              .sort((a, b) => a.order - b.order)
              .map((sec) => {
                const secGrades = gradeClasses
                  .filter((g) => g.sectionId === sec.id)
                  .sort((a, b) => a.order - b.order);
                const secStreamsCount = classes.filter(
                  (c) => c.sectionId === sec.id && c.active !== false
                ).length;

                return (
                  <div
                    key={sec.id}
                    className={`rounded-2xl border p-5 space-y-4 transition ${
                      sec.active
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-slate-950/60 border-slate-800/50 opacity-75'
                    }`}
                  >
                    {/* Section Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex-1 min-w-0">
                        {renamingSectionId === sec.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={renameSectionValue}
                              onChange={(e) => setRenameSectionValue(e.target.value)}
                              className="bg-slate-950 border border-emerald-500 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (renameSectionValue.trim()) {
                                  updateEducationalSection(sec.id, {
                                    name: renameSectionValue.trim(),
                                    shortName: renameSectionValue.trim(),
                                  });
                                }
                                setRenamingSectionId(null);
                              }}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white">{sec.name}</h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                sec.active
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/40'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {sec.active ? 'Offered / Active' : 'Not Offered (Inactive)'}
                            </span>
                            <span className="text-[11px] text-slate-400 tabular-nums">
                              {secStreamsCount} stream{secStreamsCount === 1 ? '' : 's'}
                            </span>
                          </div>
                        )}
                        {sec.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{sec.description}</p>
                        )}
                      </div>

                      {canManageStructure && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setRenamingSectionId(sec.id);
                              setRenameSectionValue(sec.name);
                            }}
                            title="Rename Section"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateEducationalSection(sec.id, { active: !sec.active })
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                              sec.active
                                ? 'bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            {sec.active ? 'Deactivate' : 'Activate'}
                          </button>
                          {sec.isCustom && (
                            <button
                              type="button"
                              onClick={() => {
                                const res = deleteEducationalSection(sec.id);
                                if (!res.success && res.message) showBanner('error', res.message);
                              }}
                              title="Delete Custom Section"
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Grade / Class Levels inside this Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold uppercase tracking-wider">
                          Classes / Grades in {sec.shortName || sec.name}
                        </span>
                        {canManageStructure && (
                          <button
                            type="button"
                            onClick={() => {
                              setAddingGradeForSecId(
                                addingGradeForSecId === sec.id ? null : sec.id
                              );
                              setNewGradeNameInput('');
                            }}
                            className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer whitespace-nowrap"
                          >
                            + Add Class Level
                          </button>
                        )}
                      </div>

                      {addingGradeForSecId === sec.id && canManageStructure && (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={newGradeNameInput}
                            onChange={(e) => setNewGradeNameInput(e.target.value)}
                            placeholder="e.g. Reception, Nursery 2, SHS 4 Remedial"
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newGradeNameInput.trim()) return;
                              const created = addGradeClass({
                                sectionId: sec.id,
                                name: newGradeNameInput.trim(),
                                isShs: sec.isShs,
                              });
                              addClassStream({
                                gradeId: created.id,
                                streamDivision: 'A',
                                programme: sec.isShs ? 'General Arts' : undefined,
                              });
                              setNewGradeNameInput('');
                              setAddingGradeForSecId(null);
                              showBanner('success', `Added class "${created.name}" with Stream A.`);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap"
                          >
                            Save Class
                          </button>
                        </div>
                      )}

                      <div className="divide-y divide-slate-800/70 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                        {secGrades.map((grd) => {
                          const grdStreams = classes.filter(
                            (c) => c.gradeId === grd.id && c.active !== false
                          );
                          return (
                            <div
                              key={grd.id}
                              className="px-3 py-2.5 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                {renamingGradeId === grd.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={renameGradeValue}
                                      onChange={(e) => setRenameGradeValue(e.target.value)}
                                      className="bg-slate-900 border border-emerald-500 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (renameGradeValue.trim()) {
                                          updateGradeClass(grd.id, {
                                            name: renameGradeValue.trim(),
                                          });
                                        }
                                        setRenamingGradeId(null);
                                      }}
                                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold cursor-pointer"
                                    >
                                      Save
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`font-bold ${
                                        grd.active ? 'text-white' : 'text-slate-500 line-through'
                                      }`}
                                    >
                                      {grd.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 tabular-nums">
                                      ({grdStreams.length} active stream{grdStreams.length === 1 ? '' : 's'})
                                    </span>
                                  </div>
                                )}
                              </div>

                              {canManageStructure && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewStreamSectionId(sec.id);
                                      setNewStreamGradeId(grd.id);
                                      setShowCreateStreamModal(true);
                                    }}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-bold cursor-pointer whitespace-nowrap"
                                  >
                                    + Stream
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRenamingGradeId(grd.id);
                                      setRenameGradeValue(grd.name);
                                    }}
                                    title="Rename Class"
                                    className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateGradeClass(grd.id, { active: !grd.active })
                                    }
                                    className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer whitespace-nowrap ${
                                      grd.active
                                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/40'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {grd.active ? 'Active' : 'Inactive'}
                                  </button>
                                  {grd.isCustom && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const res = deleteGradeClass(grd.id);
                                        if (!res.success && res.message) {
                                          showBanner('error', res.message);
                                        }
                                      }}
                                      className="p-1 rounded bg-rose-950/60 text-rose-300 hover:bg-rose-900 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================
          MODE B: ACTIVE STREAMS DIRECTORY & PER-STREAM OPERATIONAL HUB
          ======================================================================== */}
      {viewMode === 'workspace' && (
        <div className="space-y-4">
          {/* Section Filter Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSectionFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  sectionFilter === 'ALL'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Active Sections ({visibleStreams.length})
              </button>
              {activeSections.map((sec) => {
                const count = classes.filter(
                  (c) => c.sectionId === sec.id && (showInactiveStreams || c.active !== false)
                ).length;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setSectionFilter(sec.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                      sectionFilter === sec.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sec.shortName || sec.name} ({count})
                  </button>
                );
              })}
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactiveStreams}
                onChange={(e) => setShowInactiveStreams(e.target.checked)}
                className="accent-emerald-500"
              />
              <span>Show Deactivated Streams</span>
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN: Grouped Class & Stream List */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 max-h-[760px] overflow-y-auto">
              {streamsGroupedBySection.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-xs text-slate-400">
                    No active streams in this section yet.
                  </p>
                  {canManageStructure && (
                    <button
                      type="button"
                      onClick={() => setShowCreateStreamModal(true)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      + Create First Stream
                    </button>
                  )}
                </div>
              ) : (
                streamsGroupedBySection.map(({ section, streams }) => (
                  <div key={section.id} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        {section.name}
                      </span>
                      <span className="text-[10px] text-slate-500 tabular-nums">
                        {streams.length} stream{streams.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {streams.map((cls) => {
                        const enrolled = students.filter(
                          (s) => s.classId === cls.id && s.status === 'Active'
                        ).length;
                        const isSelected = cls.id === selectedStreamId;
                        const teacherName = resolveTeacherDisplayName(
                          cls.formTutorTeacherId,
                          cls.classTeacherName
                        );

                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => setSelectedStreamId(cls.id)}
                            className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-950/70 border-emerald-500/70 text-white'
                                : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-white truncate">
                                {cls.name}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {cls.active === false && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300">
                                    Inactive
                                  </span>
                                )}
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-300 tabular-nums">
                                  {enrolled}/{cls.capacity}
                                </span>
                              </div>
                            </div>

                            {cls.programme && (
                              <div className="mt-1 text-[10px] text-amber-300 font-medium truncate">
                                Programme: {cls.programme}
                              </div>
                            )}

                            <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between gap-2">
                              <span className="truncate">Teacher: {teacherName}</span>
                              <span className="text-[10px] text-slate-500 shrink-0">
                                {cls.roomNumber}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* RIGHT COLUMN: Selected Stream Operational Hub */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
              {!selectedStream ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Select a Class &amp; Stream on the left to inspect its register, teachers, timetable, attendance, and academic performance.
                </div>
              ) : (
                <>
                  {/* Stream Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{selectedStream.name}</h3>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/40">
                          {selectedStream.sectionName || selectedStream.level}
                        </span>
                        {selectedStream.programme && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-700/40">
                            {selectedStream.programme}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>
                          Class Level:{' '}
                          <strong className="text-slate-200">
                            {selectedStream.gradeName || selectedStream.name}
                          </strong>
                        </span>
                        <span>
                          Stream:{' '}
                          <strong className="text-slate-200">{selectedStream.stream}</strong>
                        </span>
                        <span>
                          Class Teacher:{' '}
                          <strong className="text-emerald-400">
                            {resolveTeacherDisplayName(
                              selectedStream.formTutorTeacherId,
                              selectedStream.classTeacherName
                            )}
                          </strong>
                        </span>
                        <span>
                          Room: <strong className="text-slate-200">{selectedStream.roomNumber}</strong>
                        </span>
                      </div>
                    </div>

                    {canManageStructure && (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditStreamModal(selectedStream)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
                        >
                          <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Edit Stream</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nextActive = selectedStream.active === false;
                            updateClassStream(selectedStream.id, { active: nextActive });
                            showBanner(
                              'success',
                              `${selectedStream.name} marked as ${nextActive ? 'Active' : 'Inactive'}.`
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer whitespace-nowrap"
                        >
                          {selectedStream.active === false ? 'Activate' : 'Deactivate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const res = deleteClassStream(selectedStream.id);
                            if (!res.success && res.message) {
                              showBanner('error', res.message);
                            } else {
                              showBanner('success', 'Deleted empty stream.');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 cursor-pointer"
                          title="Delete Empty Stream"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Operational Sub-Tabs */}
                  <div className="flex flex-wrap gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
                    {[
                      { id: 'register', label: `Student Register (${streamStudents.length})`, icon: Users },
                      {
                        id: 'teachers',
                        label: `Teachers (${Object.keys(selectedStream.subjectTeachers || {}).length + 1})`,
                        icon: UserCheck,
                      },
                      { id: 'timetable', label: `Timetable (${streamTimetable.length})`, icon: Calendar },
                      { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
                      { id: 'assessments', label: 'Assessments & Exams', icon: FileSpreadsheet },
                      { id: 'performance', label: 'Performance Report', icon: BarChart3 },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setStreamSubTab(tab.id as any)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                            streamSubTab === tab.id
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 1. STUDENT REGISTER */}
                  {streamSubTab === 'register' && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs">
                        <div className="flex flex-wrap items-center gap-4 tabular-nums">
                          <span>
                            Enrolled:{' '}
                            <strong className="text-white">{streamStudents.length}</strong> /{' '}
                            {selectedStream.capacity}
                          </span>
                          <span>
                            Male:{' '}
                            <strong className="text-sky-400">
                              {streamStudents.filter((s) => s.gender === 'Male').length}
                            </strong>
                          </span>
                          <span>
                            Female:{' '}
                            <strong className="text-pink-400">
                              {streamStudents.filter((s) => s.gender === 'Female').length}
                            </strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveModule('students')}
                          className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <span>Enrol / Reassign Students</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3">Student Name</th>
                              <th className="py-2.5 px-2">Student ID</th>
                              <th className="py-2.5 px-2">Gender</th>
                              <th className="py-2.5 px-2">Stream / Programme</th>
                              <th className="py-2.5 px-2">Residence</th>
                              <th className="py-2.5 px-2">Guardian Phone</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {streamStudents.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-500">
                                  No students placed in {selectedStream.name} yet. Enrol or place students via Student Registry or Admissions.
                                </td>
                              </tr>
                            ) : (
                              streamStudents.map((stu) => (
                                <tr key={stu.id} className="hover:bg-slate-800/40">
                                  <td className="py-2.5 px-3 flex items-center gap-2.5">
                                    <img
                                      src={stu.photo}
                                      alt={stu.firstName}
                                      className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
                                    />
                                    <span className="font-bold text-white">
                                      {stu.firstName} {stu.lastName}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-2 font-mono text-emerald-400 tabular-nums">
                                    {stu.studentNumber}
                                  </td>
                                  <td className="py-2.5 px-2">{stu.gender}</td>
                                  <td className="py-2.5 px-2 text-slate-300">
                                    {stu.programme
                                      ? `${stu.programme} (${stu.stream})`
                                      : `Stream ${stu.stream}`}
                                  </td>
                                  <td className="py-2.5 px-2">{stu.boardingStatus}</td>
                                  <td className="py-2.5 px-2 font-mono text-slate-400 tabular-nums">
                                    {stu.guardianPhone}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 2. CLASS TEACHER & ASSIGNED SUBJECT TEACHERS */}
                  {streamSubTab === 'teachers' && (
                    <div className="space-y-4 text-xs">
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] uppercase font-bold text-emerald-400">
                            Designated Class Teacher / Form Tutor
                          </div>
                          <p className="text-slate-400 mt-0.5">
                            Oversees the register, pastoral welfare, attendance, and terminal report remarks for {selectedStream.name}.
                          </p>
                        </div>
                        <select
                          disabled={!canManageStructure}
                          value={selectedStream.formTutorTeacherId}
                          onChange={(e) => {
                            updateClassStream(selectedStream.id, {
                              formTutorTeacherId: e.target.value,
                            });
                            showBanner('success', 'Updated Class Teacher assignment.');
                          }}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500 min-w-[230px]"
                        >
                          {teacherOptions.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Assigned Subject Teachers for {selectedStream.name}</span>
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Automatically linked to timetable periods &amp; mark sheets
                          </span>
                        </div>

                        <div className="divide-y divide-slate-800 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                          {streamSubjects.map((sub) => {
                            const assignedId = selectedStream.subjectTeachers?.[sub.id] || '';
                            return (
                              <div
                                key={sub.id}
                                className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                              >
                                <div>
                                  <span className="font-bold text-white">{sub.name}</span>
                                  <span className="ml-2 text-[10px] font-mono text-slate-400">
                                    {sub.code} · {sub.category}
                                  </span>
                                </div>
                                <select
                                  disabled={!canManageStructure}
                                  value={assignedId}
                                  onChange={(e) =>
                                    assignSubjectTeacherToStream(
                                      selectedStream.id,
                                      sub.id,
                                      e.target.value
                                    )
                                  }
                                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 sm:w-64"
                                >
                                  <option value="">-- Assign Subject Teacher --</option>
                                  {teacherOptions.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. STREAM TIMETABLE */}
                  {streamSubTab === 'timetable' && (
                    <div className="space-y-4 text-xs">
                      {canManageStructure && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!ttSubjectId) return;
                            const assignedSubTeacher =
                              selectedStream.subjectTeachers?.[ttSubjectId] ||
                              selectedStream.formTutorTeacherId;
                            addTimetablePeriod({
                              classId: selectedStream.id,
                              dayOfWeek: ttDay,
                              periodNumber: ttPeriodNum,
                              startTime: ttStart,
                              endTime: ttEnd,
                              subjectId: ttSubjectId,
                              teacherId: assignedSubTeacher,
                              room: selectedStream.roomNumber,
                            });
                            showBanner('success', `Scheduled period for ${selectedStream.name}.`);
                          }}
                          className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-6 gap-2.5 items-end"
                        >
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Day</label>
                            <select
                              value={ttDay}
                              onChange={(e) => setTtDay(e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                            >
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Period #</label>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={ttPeriodNum}
                              onChange={(e) => setTtPeriodNum(Number(e.target.value) || 1)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Start</label>
                            <input
                              type="time"
                              value={ttStart}
                              onChange={(e) => setTtStart(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">End</label>
                            <input
                              type="time"
                              value={ttEnd}
                              onChange={(e) => setTtEnd(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Subject</label>
                            <select
                              value={ttSubjectId}
                              onChange={(e) => setTtSubjectId(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white"
                            >
                              {streamSubjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold cursor-pointer whitespace-nowrap"
                          >
                            + Add Period
                          </button>
                        </form>
                      )}

                      {streamTimetable.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 bg-slate-950 border border-slate-800 rounded-xl">
                          No timetable periods scheduled yet for {selectedStream.name}.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-800 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                          {streamTimetable.map((p) => {
                            const sub = subjects.find((s) => s.id === p.subjectId);
                            const tName = resolveTeacherDisplayName(p.teacherId);
                            return (
                              <div
                                key={p.id}
                                className="px-3.5 py-2.5 flex items-center justify-between gap-3"
                              >
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="font-bold text-emerald-400 w-20">{p.dayOfWeek}</span>
                                  <span className="font-mono text-slate-400 tabular-nums">
                                    P{p.periodNumber} ({p.startTime}–{p.endTime})
                                  </span>
                                  <span className="font-bold text-white">
                                    {sub?.name || 'Subject'}
                                  </span>
                                  <span className="text-slate-400">· {tName}</span>
                                </div>
                                {canManageStructure && (
                                  <button
                                    type="button"
                                    onClick={() => deleteTimetablePeriod(p.id)}
                                    className="text-rose-400 hover:text-rose-300 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. STREAM ATTENDANCE RECORDS */}
                  {streamSubTab === 'attendance' && (
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
                        {[
                          {
                            label: 'Present Entries',
                            val: streamAttendance.filter((a) => a.status === 'Present').length,
                            tone: 'text-emerald-400',
                          },
                          {
                            label: 'Absent Entries',
                            val: streamAttendance.filter((a) => a.status === 'Absent').length,
                            tone: 'text-rose-400',
                          },
                          {
                            label: 'Late Arrivals',
                            val: streamAttendance.filter((a) => a.status === 'Late').length,
                            tone: 'text-amber-400',
                          },
                          {
                            label: 'Attendance Rate',
                            val:
                              streamAttendance.length > 0
                                ? `${Math.round(
                                    (streamAttendance.filter(
                                      (a) => a.status === 'Present' || a.status === 'Late'
                                    ).length /
                                      streamAttendance.length) *
                                      100
                                  )}%`
                                : '—',
                            tone: 'text-white',
                          },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className="bg-slate-950 border border-slate-800 rounded-xl p-3"
                          >
                            <div className="text-[11px] text-slate-400">{stat.label}</div>
                            <div className={`text-lg font-black mt-0.5 ${stat.tone}`}>
                              {stat.val}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">
                          Recent roll-call records for <strong className="text-white">{selectedStream.name}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveModule('attendance')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <span>Open Daily Roll Call</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="divide-y divide-slate-800 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                        {streamAttendance.length === 0 ? (
                          <div className="py-8 text-center text-slate-500">
                            No attendance logs recorded yet for {selectedStream.name}.
                          </div>
                        ) : (
                          streamAttendance.slice(0, 25).map((rec) => {
                            const st = students.find((s) => s.id === rec.studentId);
                            return (
                              <div
                                key={rec.id}
                                className="px-3.5 py-2 flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-bold text-white">
                                    {st ? `${st.firstName} ${st.lastName}` : rec.studentId}
                                  </span>
                                  <span className="ml-2 font-mono text-slate-400 tabular-nums">
                                    {rec.date}
                                  </span>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                    rec.status === 'Present'
                                      ? 'bg-emerald-950 text-emerald-400'
                                      : rec.status === 'Absent'
                                      ? 'bg-rose-950 text-rose-400'
                                      : 'bg-amber-950 text-amber-400'
                                  }`}
                                >
                                  {rec.status}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* 5. CONTINUOUS ASSESSMENTS & EXAMINATION RESULTS */}
                  {streamSubTab === 'assessments' && (
                    <div className="space-y-4 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                        <div>
                          <div className="font-bold text-white">
                            Continuous Assessment (30%) &amp; Terminal Exam (70%) Ledger
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {school.currentAcademicYear} · {school.currentTerm} ·{' '}
                            {streamExamResults.length} subject score entries for {selectedStream.name}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveModule('examinations')}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <span>Enter Class / Exam Marks</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3">Student</th>
                              <th className="py-2.5 px-2">Subject</th>
                              <th className="py-2.5 px-2 text-center">CA (30)</th>
                              <th className="py-2.5 px-2 text-center">Exam (70)</th>
                              <th className="py-2.5 px-2 text-center">Total</th>
                              <th className="py-2.5 px-2 text-center">Grade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 tabular-nums">
                            {streamExamResults.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-500">
                                  No assessment or examination marks entered yet for {selectedStream.name} in {school.currentTerm}.
                                </td>
                              </tr>
                            ) : (
                              streamExamResults.slice(0, 30).map((r) => {
                                const st = students.find((s) => s.id === r.studentId);
                                const sub = subjects.find((s) => s.id === r.subjectId);
                                return (
                                  <tr key={r.id} className="hover:bg-slate-800/40">
                                    <td className="py-2 px-3 font-bold text-white">
                                      {st ? `${st.firstName} ${st.lastName}` : r.studentId}
                                    </td>
                                    <td className="py-2 px-2 text-slate-300">
                                      {sub?.name || r.subjectId}
                                    </td>
                                    <td className="py-2 px-2 text-center">{r.classScore}</td>
                                    <td className="py-2 px-2 text-center">{r.examScore}</td>
                                    <td className="py-2 px-2 text-center font-bold text-emerald-400">
                                      {r.totalScore}
                                    </td>
                                    <td className="py-2 px-2 text-center font-bold text-white">
                                      {r.grade}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 6. STREAM PERFORMANCE REPORT */}
                  {streamSubTab === 'performance' && (
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                          <div className="text-[11px] text-slate-400">Stream Mean Score</div>
                          <div className="text-xl font-black text-emerald-400 mt-0.5">
                            {performanceMetrics.classMean > 0
                              ? `${performanceMetrics.classMean.toFixed(1)}%`
                              : '—'}
                          </div>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                          <div className="text-[11px] text-slate-400">Stream Pass Rate (≥50%)</div>
                          <div className="text-xl font-black text-white mt-0.5">
                            {performanceMetrics.classMean > 0
                              ? `${performanceMetrics.passRate.toFixed(0)}%`
                              : '—'}
                          </div>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                          <div className="text-[11px] text-slate-400">Class Teacher</div>
                          <div className="text-sm font-bold text-amber-300 mt-1 truncate">
                            {resolveTeacherDisplayName(
                              selectedStream.formTutorTeacherId,
                              selectedStream.classTeacherName
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Subject Performance Breakdown */}
                      {performanceMetrics.subjectAverages.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-bold text-white">Subject Averages &amp; Assigned Teachers</h4>
                          <div className="divide-y divide-slate-800 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                            {performanceMetrics.subjectAverages.map((sa) => (
                              <div
                                key={sa.subjectId}
                                className="px-3.5 py-2 flex items-center justify-between gap-2 tabular-nums"
                              >
                                <div>
                                  <span className="font-semibold text-white">{sa.subjectName}</span>
                                  <span className="ml-2 text-[11px] text-slate-400">
                                    Teacher: {sa.teacherName}
                                  </span>
                                </div>
                                <span className="font-bold text-emerald-400">
                                  {sa.entries > 0 ? `${sa.meanScore.toFixed(1)}% (${sa.entries})` : 'No scores yet'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Student Merit Ranking & Report Cards */}
                      <div className="space-y-2">
                        <h4 className="font-bold text-white">
                          Student Merit Standing — {selectedStream.name}
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                              <tr>
                                <th className="py-2 px-3">Pos</th>
                                <th className="py-2 px-2">Student</th>
                                <th className="py-2 px-2 text-center">Subjects Graded</th>
                                <th className="py-2 px-2 text-center">Average</th>
                                <th className="py-2 px-3 text-right">Terminal Report</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 tabular-nums">
                              {performanceMetrics.studentStandings.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-6 text-center text-slate-500">
                                    No students enrolled in this stream yet.
                                  </td>
                                </tr>
                              ) : (
                                performanceMetrics.studentStandings.map((item, idx) => (
                                  <tr key={item.student.id} className="hover:bg-slate-800/40">
                                    <td className="py-2 px-3 font-mono font-bold text-amber-300">
                                      #{idx + 1}
                                    </td>
                                    <td className="py-2 px-2 font-bold text-white">
                                      {item.student.firstName} {item.student.lastName}
                                    </td>
                                    <td className="py-2 px-2 text-center">{item.subjectsCount}</td>
                                    <td className="py-2 px-2 text-center font-bold text-emerald-400">
                                      {item.subjectsCount > 0 ? `${item.avgScore.toFixed(1)}%` : '—'}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => setReportCardStudent(item.student)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                                      >
                                        <Printer className="w-3 h-3" />
                                        <span>Report Card</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          CREATE CLASS / STREAM MODAL (SINGLE OR MULTI-STREAM A–E + SHS PROGRAMMES)
          ======================================================================== */}
      {showCreateStreamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-white space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base">Create Class Stream / Division</h3>
                <p className="text-xs text-slate-400">
                  Add single or multiple streams (A, B, C, D, E) or SHS programme streams.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateStreamModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStreamSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    1. Educational Section *
                  </label>
                  <select
                    value={newStreamSectionId}
                    onChange={(e) => setNewStreamSectionId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {educationalSections
                      .filter((s) => s.active)
                      .map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    2. Class / Grade *
                  </label>
                  <select
                    value={newStreamGradeId}
                    onChange={(e) => setNewStreamGradeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {gradesForNewStreamSection.map((grd) => (
                      <option key={grd.id} value={grd.id}>
                        {grd.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SHS Programme Selector when Grade is SHS */}
              {selectedGradeForCreate?.isShs && (
                <div>
                  <label className="block text-amber-300 mb-1 font-semibold">
                    SHS Programme / Course Track (General Arts, Science, Business, etc.)
                  </label>
                  <select
                    value={newStreamProgramme}
                    onChange={(e) => setNewStreamProgramme(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-600/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- Optional / General Stream --</option>
                    {shsProgrammeOptions.map((prog) => (
                      <option key={prog} value={prog}>
                        {prog}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mode Toggle: Single Stream vs Multiple Streams A-E */}
              <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStreamCreateMode('single')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold cursor-pointer ${
                    streamCreateMode === 'single' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Single Stream
                </button>
                <button
                  type="button"
                  onClick={() => setStreamCreateMode('bulk')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold cursor-pointer ${
                    streamCreateMode === 'bulk' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Multiple Streams (A–E)
                </button>
              </div>

              {streamCreateMode === 'single' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      Stream / Division *
                    </label>
                    <div className="flex gap-1.5 mb-2">
                      {STANDARD_STREAM_LETTERS.map((ltr) => (
                        <button
                          key={ltr}
                          type="button"
                          onClick={() => setNewStreamDivision(ltr)}
                          className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                            newStreamDivision === ltr
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-950 border border-slate-800 text-slate-300'
                          }`}
                        >
                          {ltr}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={newStreamDivision}
                      onChange={(e) => setNewStreamDivision(e.target.value)}
                      placeholder="e.g. A, B, C, Gold"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      Generated Class Name Preview
                    </label>
                    <input
                      type="text"
                      value={newStreamCustomName}
                      onChange={(e) => setNewStreamCustomName(e.target.value)}
                      placeholder={previewStreamName}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-300 font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Default: <strong className="text-slate-300">{previewStreamName}</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-400 mb-1.5 font-semibold">
                    Select Stream Divisions to Generate Together *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STANDARD_STREAM_LETTERS.map((ltr) => {
                      const checked = bulkLetters.includes(ltr);
                      return (
                        <button
                          key={ltr}
                          type="button"
                          onClick={() =>
                            setBulkLetters((prev) =>
                              prev.includes(ltr) ? prev.filter((x) => x !== ltr) : [...prev, ltr]
                            )
                          }
                          className={`px-3.5 py-2 rounded-xl font-bold border cursor-pointer ${
                            checked
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          Stream {ltr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-semibold">Class Teacher</label>
                  <select
                    value={newStreamTeacherId}
                    onChange={(e) => setNewStreamTeacherId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {teacherOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Max Capacity</label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    value={newStreamCapacity}
                    onChange={(e) => setNewStreamCapacity(Number(e.target.value) || 40)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Classroom / Block Label
                </label>
                <input
                  type="text"
                  value={newStreamRoom}
                  onChange={(e) => setNewStreamRoom(e.target.value)}
                  placeholder="e.g. Primary Block B - Rm 02"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateStreamModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Save Stream(s)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================
          EDIT STREAM MODAL
          ======================================================================== */}
      {editingStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base">Edit Class Stream</h3>
              <button
                type="button"
                onClick={() => setEditingStream(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditStream} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Display Name *</label>
                <input
                  type="text"
                  required
                  value={editStreamName}
                  onChange={(e) => setEditStreamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Stream / Division</label>
                  <input
                    type="text"
                    value={editStreamCode}
                    onChange={(e) => setEditStreamCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Room Number</label>
                  <input
                    type="text"
                    value={editStreamRoom}
                    onChange={(e) => setEditStreamRoom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Programme (SHS)</label>
                  <input
                    type="text"
                    value={editStreamProgramme}
                    onChange={(e) => setEditStreamProgramme(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Capacity</label>
                  <input
                    type="number"
                    min={5}
                    value={editStreamCapacity}
                    onChange={(e) => setEditStreamCapacity(Number(e.target.value) || 40)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Class Teacher</label>
                <select
                  value={editStreamTeacherId}
                  onChange={(e) => setEditStreamTeacherId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {teacherOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStream(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reportCardStudent && (
        <ReportCardModal
          student={reportCardStudent}
          onClose={() => setReportCardStudent(null)}
        />
      )}
    </div>
  );
};
