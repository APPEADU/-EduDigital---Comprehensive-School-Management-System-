import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { SchoolCourseTrack, Subject, isInstituteLevelType } from '../../types';
import {
  BookOpen,
  Layers,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  RotateCcw,
  Search,
  ListPlus,
  CheckCircle2,
} from 'lucide-react';

export const CustomCurriculumManager: React.FC = () => {
  const {
    school,
    courseTracks,
    subjects,
    addCourseTrack,
    addCourseTracksBulk,
    updateCourseTrack,
    deleteCourseTrack,
    clearAutoCourseTracks,
    restoreDefaultCourseTracks,
    addSubject,
    addSubjectsBulk,
    updateSubject,
    deleteSubject,
    clearAutoSubjects,
    restoreDefaultSubjects,
  } = useSchool();

  const isInst = isInstituteLevelType(school.levelType);
  const [sectionTab, setSectionTab] = useState<'courses' | 'subjects'>('courses');
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => {
      setNotice((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // ============================================================================
  // COURSES / PROGRAMMES STATE
  // ============================================================================
  const [courseSearch, setCourseSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState<'all' | 'custom' | 'auto'>('all');
  const [showBulkCourses, setShowBulkCourses] = useState(false);
  const [bulkCoursesText, setBulkCoursesText] = useState('');
  const [bulkCourseDept, setBulkCourseDept] = useState(
    isInst ? 'Professional & Academic Studies' : 'Academic Programmes'
  );

  const [newCourse, setNewCourse] = useState<{
    code: string;
    name: string;
    department: string;
    category: SchoolCourseTrack['category'];
    duration: string;
    description: string;
  }>({
    code: '',
    name: '',
    department: isInst ? 'Professional & Academic Studies' : 'Academic Programmes',
    category: isInst ? 'Certificate / Diploma' : 'Custom Course',
    duration: isInst ? '12 – 24 Months' : 'Full Academic Cycle',
    description: '',
  });

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editCourseDraft, setEditCourseDraft] = useState<Partial<SchoolCourseTrack>>({});
  const [confirmClearAutoCourses, setConfirmClearAutoCourses] = useState(false);

  const customCoursesCount = courseTracks.filter((c) => c.isCustom).length;
  const autoCoursesCount = courseTracks.length - customCoursesCount;

  const filteredCourses = useMemo(() => {
    return courseTracks.filter((c) => {
      if (courseFilter === 'custom' && !c.isCustom) return false;
      if (courseFilter === 'auto' && c.isCustom) return false;
      if (!courseSearch.trim()) return true;
      const q = courseSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
      );
    });
  }, [courseTracks, courseFilter, courseSearch]);

  const handleAddSingleCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.name.trim()) return;
    const created = addCourseTrack({
      code: newCourse.code,
      name: newCourse.name,
      department: newCourse.department,
      category: newCourse.category,
      duration: newCourse.duration,
      description: newCourse.description,
    });
    setNewCourse({
      code: '',
      name: '',
      department: newCourse.department,
      category: newCourse.category,
      duration: newCourse.duration,
      description: '',
    });
    showNotice(`Added custom course "${created.name}" (${created.code}) to ${school.name}.`);
  };

  const handleBulkAddCourses = (e: React.FormEvent) => {
    e.preventDefault();
    const items = bulkCoursesText
      .split(/[\n,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (items.length === 0) return;
    const added = addCourseTracksBulk(
      items,
      bulkCourseDept,
      isInst ? 'Certificate / Diploma' : 'Custom Course'
    );
    setBulkCoursesText('');
    setShowBulkCourses(false);
    showNotice(`Added ${added.length} custom course(s) to ${school.name}.`);
  };

  // ============================================================================
  // SUBJECTS / MODULES STATE
  // ============================================================================
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<'all' | 'custom' | 'auto' | 'Core' | 'Elective'>('all');
  const [showBulkSubjects, setShowBulkSubjects] = useState(false);
  const [bulkSubjectsText, setBulkSubjectsText] = useState('');
  const [bulkSubjectCategory, setBulkSubjectCategory] = useState<'Core' | 'Elective'>('Elective');
  const [bulkSubjectLevel, setBulkSubjectLevel] = useState<Subject['level']>(
    isInst ? 'Tertiary / Institute' : school.levelType === 'Basic & JHS' ? 'JHS' : 'SHS'
  );
  const [bulkSubjectDept, setBulkSubjectDept] = useState('Custom School Curriculum');

  const [newSubject, setNewSubject] = useState<{
    code: string;
    name: string;
    category: 'Core' | 'Elective';
    level: Subject['level'];
    department: string;
    programme: string;
  }>({
    code: '',
    name: '',
    category: 'Elective',
    level: isInst ? 'Tertiary / Institute' : school.levelType === 'Basic & JHS' ? 'JHS' : 'SHS',
    department: 'Academic Curriculum',
    programme: '',
  });

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubjectDraft, setEditSubjectDraft] = useState<Partial<Subject>>({});
  const [confirmClearAutoSubjects, setConfirmClearAutoSubjects] = useState(false);

  const customSubjectsCount = subjects.filter((s) => Boolean(s.isCustom)).length;
  const autoSubjectsCount = subjects.length - customSubjectsCount;

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      if (subjectFilter === 'custom' && !s.isCustom) return false;
      if (subjectFilter === 'auto' && s.isCustom) return false;
      if (subjectFilter === 'Core' && s.category !== 'Core') return false;
      if (subjectFilter === 'Elective' && s.category !== 'Elective') return false;
      if (!subjectSearch.trim()) return true;
      const q = subjectSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        (s.programme || '').toLowerCase().includes(q)
      );
    });
  }, [subjects, subjectFilter, subjectSearch]);

  const handleAddSingleSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;
    const created = addSubject({
      code: newSubject.code,
      name: newSubject.name,
      category: newSubject.category,
      level: newSubject.level,
      department: newSubject.department,
      programme: newSubject.programme || undefined,
    });
    setNewSubject({
      ...newSubject,
      code: '',
      name: '',
    });
    showNotice(`Added custom subject "${created.name}" (${created.code}) to ${school.name}.`);
  };

  const handleBulkAddSubjects = (e: React.FormEvent) => {
    e.preventDefault();
    const items = bulkSubjectsText
      .split(/[\n,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (items.length === 0) return;
    const added = addSubjectsBulk(items, {
      category: bulkSubjectCategory,
      level: bulkSubjectLevel,
      department: bulkSubjectDept,
    });
    setBulkSubjectsText('');
    setShowBulkSubjects(false);
    showNotice(`Added ${added.length} custom subject(s) to ${school.name}.`);
  };

  return (
    <div className="space-y-5">
      {/* Top Summary Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">
            Institutional Courses, Programmes &amp; Subjects Registry
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            State your own school-specific courses and subjects in addition to—or instead of—the automatic presets. Changes sync immediately across Admissions, Student Enrollment, Timetables, Lesson Notes, and Examinations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <span className="text-slate-400 block text-[11px]">Courses / Programmes</span>
            <span className="font-bold text-white tabular-nums">{courseTracks.length}</span>
            <span className="text-slate-500 text-[11px] ml-1.5 tabular-nums">
              ({customCoursesCount} Custom · {autoCoursesCount} Auto)
            </span>
          </div>
          <div className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <span className="text-slate-400 block text-[11px]">Subjects / Modules</span>
            <span className="font-bold text-white tabular-nums">{subjects.length}</span>
            <span className="text-slate-500 text-[11px] ml-1.5 tabular-nums">
              ({customSubjectsCount} Custom · {autoSubjectsCount} Auto)
            </span>
          </div>
        </div>
      </div>

      {notice && (
        <div className="px-4 py-2.5 bg-emerald-950/60 border border-emerald-700/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Sub-navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSectionTab('courses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
              sectionTab === 'courses'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>School Courses &amp; Programmes ({courseTracks.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSectionTab('subjects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
              sectionTab === 'subjects'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>School Subjects &amp; Modules ({subjects.length})</span>
          </button>
        </div>

        {sectionTab === 'courses' ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBulkCourses((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>{showBulkCourses ? 'Close Bulk Entry' : 'Bulk Add Courses'}</span>
            </button>
            {autoCoursesCount > 0 && (
              confirmClearAutoCourses ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      clearAutoCourseTracks();
                      setConfirmClearAutoCourses(false);
                      showNotice('Automatic preset courses hidden. Showing only your custom courses.');
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Confirm Hide Auto Courses
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAutoCourses(false)}
                    className="px-2.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearAutoCourses(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  Use Only Custom Courses
                </button>
              )
            )}
            {(school.excludedDefaultCourseNames?.length || 0) > 0 && (
              <button
                type="button"
                onClick={() => {
                  restoreDefaultCourseTracks();
                  showNotice('Restored automatic preset courses alongside your custom courses.');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Auto Courses</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBulkSubjects((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>{showBulkSubjects ? 'Close Bulk Entry' : 'Bulk Add Subjects'}</span>
            </button>
            {autoSubjectsCount > 0 && (
              confirmClearAutoSubjects ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      clearAutoSubjects();
                      setConfirmClearAutoSubjects(false);
                      showNotice('Removed automatic preset subjects. Using only your custom subjects.');
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Confirm Remove Auto Subjects
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAutoSubjects(false)}
                    className="px-2.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearAutoSubjects(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  Use Only Custom Subjects
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => {
                restoreDefaultSubjects();
                showNotice('Restored automatic preset subjects alongside your custom subjects.');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Auto Subjects</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================
          SECTION 1: SCHOOL COURSES & PROGRAMMES
         ======================================================================== */}
      {sectionTab === 'courses' && (
        <div className="space-y-4">
          {/* Bulk Courses Panel */}
          {showBulkCourses && (
            <form
              onSubmit={handleBulkAddCourses}
              className="bg-slate-900 border border-emerald-700/50 rounded-2xl p-5 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Bulk State Custom Courses / Programmes
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Enter multiple courses separated by commas or new lines (e.g. STEM &amp; Robotics, Agricultural Science, Pre-Nursing, Cosmetology).
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Course / Programme Names *</label>
                  <textarea
                    rows={3}
                    required
                    value={bulkCoursesText}
                    onChange={(e) => setBulkCoursesText(e.target.value)}
                    placeholder="STEM & Robotics, Agricultural Science, Culinary & Hospitality Management, Pre-Medical Track"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col justify-between gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Default Department / Faculty</label>
                    <input
                      type="text"
                      value={bulkCourseDept}
                      onChange={(e) => setBulkCourseDept(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition cursor-pointer whitespace-nowrap"
                  >
                    Add All Listed Courses
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Single Custom Course Creation Bar */}
          <form
            onSubmit={handleAddSingleCourse}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs"
          >
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>State a Custom School Course / Programme</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-2">
                <label className="block text-slate-400 mb-1">Course / Programme Title *</label>
                <input
                  type="text"
                  required
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="e.g. STEM & Robotics / B.Sc. Nursing / Cosmetology"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Course Code (Optional)</label>
                <input
                  type="text"
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  placeholder="Auto-generated if blank"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Department / Faculty</label>
                <input
                  type="text"
                  value={newCourse.department}
                  onChange={(e) => setNewCourse({ ...newCourse, department: e.target.value })}
                  placeholder="e.g. Science & Tech"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Category</label>
                <select
                  value={newCourse.category}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      category: e.target.value as SchoolCourseTrack['category'],
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Custom Course">Custom Course</option>
                  <option value="Elective Programme">Elective Programme</option>
                  <option value="Core Track">Core Track</option>
                  <option value="Certificate / Diploma">Certificate / Diploma</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-slate-400 mb-1">Duration / Cycle</label>
                <input
                  type="text"
                  value={newCourse.duration}
                  onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                  placeholder="e.g. 3 Years / 6 Semesters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Brief Description (Optional)</label>
                <input
                  type="text"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Summary of focus subjects or award..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Course</span>
              </button>
            </div>
          </form>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search courses by title, code, or department..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(['all', 'custom', 'auto'] as const).map((flt) => (
                <button
                  key={flt}
                  type="button"
                  onClick={() => setCourseFilter(flt)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                    courseFilter === flt
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {flt === 'all'
                    ? `All (${courseTracks.length})`
                    : flt === 'custom'
                    ? `School Custom (${customCoursesCount})`
                    : `Auto Default (${autoCoursesCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Courses Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-3">Course / Programme Name</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Category &amp; Duration</th>
                    <th className="py-3 px-3">Origin</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No courses match your current filter. Add your school&apos;s custom courses above.
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((crs) => {
                      const isEditing = editingCourseId === crs.id;
                      const isProgrammeMirror = crs.id.startsWith('prog-trk-');
                      return (
                        <tr key={crs.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-mono text-emerald-400 font-semibold tabular-nums">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editCourseDraft.code ?? crs.code}
                                onChange={(e) =>
                                  setEditCourseDraft({ ...editCourseDraft, code: e.target.value })
                                }
                                className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
                              />
                            ) : (
                              crs.code
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editCourseDraft.name ?? crs.name}
                                onChange={(e) =>
                                  setEditCourseDraft({ ...editCourseDraft, name: e.target.value })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white"
                              />
                            ) : (
                              <div>
                                <span className="font-bold text-white block">{crs.name}</span>
                                {crs.description && (
                                  <span className="text-[11px] text-slate-500 block mt-0.5">
                                    {crs.description}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editCourseDraft.department ?? crs.department}
                                onChange={(e) =>
                                  setEditCourseDraft({
                                    ...editCourseDraft,
                                    department: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white"
                              />
                            ) : (
                              crs.department
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            {crs.category}
                            {crs.duration ? ` · ${crs.duration}` : ''}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={
                                crs.isCustom
                                  ? 'text-emerald-400 font-semibold'
                                  : 'text-slate-400'
                              }
                            >
                              {crs.isCustom ? 'Custom (School)' : 'Auto Default'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isProgrammeMirror ? (
                              <span className="text-[11px] text-slate-500">Institute Programme</span>
                            ) : isEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateCourseTrack(crs.id, editCourseDraft);
                                    setEditingCourseId(null);
                                    showNotice(`Updated course "${editCourseDraft.name || crs.name}".`);
                                  }}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                                  title="Save changes"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCourseId(null)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCourseId(crs.id);
                                    setEditCourseDraft({
                                      code: crs.code,
                                      name: crs.name,
                                      department: crs.department,
                                    });
                                  }}
                                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                                  title="Edit course"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteCourseTrack(crs.id);
                                    showNotice(`Removed "${crs.name}" from active school courses.`);
                                  }}
                                  className="p-1.5 hover:bg-rose-950/70 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                                  title={crs.isCustom ? 'Delete custom course' : 'Exclude automatic course'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          SECTION 2: SCHOOL SUBJECTS & MODULES
         ======================================================================== */}
      {sectionTab === 'subjects' && (
        <div className="space-y-4">
          {/* Bulk Subjects Panel */}
          {showBulkSubjects && (
            <form
              onSubmit={handleBulkAddSubjects}
              className="bg-slate-900 border border-emerald-700/50 rounded-2xl p-5 space-y-3 text-xs"
            >
              <div>
                <h4 className="font-bold text-white text-sm">
                  Bulk State Custom Subjects / Modules
                </h4>
                <p className="text-slate-400 text-[11px]">
                  Enter multiple subject names separated by commas or new lines (e.g. Robotics &amp; AI, French, Akuapem Twi, Music, Garment Design).
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Subject Names *</label>
                  <textarea
                    rows={3}
                    required
                    value={bulkSubjectsText}
                    onChange={(e) => setBulkSubjectsText(e.target.value)}
                    placeholder="Robotics & Embedded Systems, French Language, Akuapem Twi, Music & Performing Arts"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Category</label>
                      <select
                        value={bulkSubjectCategory}
                        onChange={(e) =>
                          setBulkSubjectCategory(e.target.value as 'Core' | 'Elective')
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white"
                      >
                        <option value="Core">Core</option>
                        <option value="Elective">Elective</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Level</label>
                      <select
                        value={bulkSubjectLevel}
                        onChange={(e) =>
                          setBulkSubjectLevel(e.target.value as Subject['level'])
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white"
                      >
                        <option value="Basic">Basic</option>
                        <option value="JHS">JHS</option>
                        <option value="SHS">SHS</option>
                        <option value="Tertiary / Institute">Tertiary / Institute</option>
                        <option value="All Levels">All Levels</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Department</label>
                    <input
                      type="text"
                      value={bulkSubjectDept}
                      onChange={(e) => setBulkSubjectDept(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition cursor-pointer whitespace-nowrap"
                  >
                    Add All Listed Subjects
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Single Custom Subject Creation Form */}
          <form
            onSubmit={handleAddSingleSubject}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs"
          >
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>State a Custom School Subject / Module</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
              <div className="lg:col-span-2">
                <label className="block text-slate-400 mb-1">Subject / Module Name *</label>
                <input
                  type="text"
                  required
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="e.g. Robotics & Coding / Clinical Pharmacology"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Code (Optional)</label>
                <input
                  type="text"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                  placeholder="e.g. ROB-101"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Category</label>
                <select
                  value={newSubject.category}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      category: e.target.value as 'Core' | 'Elective',
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Core">Core</option>
                  <option value="Elective">Elective</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Level</label>
                <select
                  value={newSubject.level}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      level: e.target.value as Subject['level'],
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Basic">Basic</option>
                  <option value="JHS">JHS</option>
                  <option value="SHS">SHS</option>
                  <option value="Tertiary / Institute">Tertiary / Institute</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subject</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-400 mb-1">Department</label>
                <input
                  type="text"
                  value={newSubject.department}
                  onChange={(e) => setNewSubject({ ...newSubject, department: e.target.value })}
                  placeholder="e.g. Science & Mathematics / Languages"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Linked Course / Programme (Optional)</label>
                <select
                  value={newSubject.programme}
                  onChange={(e) => setNewSubject({ ...newSubject, programme: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All Courses / General</option>
                  {courseTracks.map((trk) => (
                    <option key={trk.id} value={trk.name}>
                      {trk.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                placeholder="Search subjects by name, code, or department..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'custom', 'auto', 'Core', 'Elective'] as const).map((flt) => (
                <button
                  key={flt}
                  type="button"
                  onClick={() => setSubjectFilter(flt)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                    subjectFilter === flt
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {flt === 'all'
                    ? `All (${subjects.length})`
                    : flt === 'custom'
                    ? `School Custom (${customSubjectsCount})`
                    : flt === 'auto'
                    ? `Auto Default (${autoSubjectsCount})`
                    : flt}
                </button>
              ))}
            </div>
          </div>

          {/* Subjects Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-3">Subject / Module</th>
                    <th className="py-3 px-3">Category &amp; Level</th>
                    <th className="py-3 px-3">Department / Course</th>
                    <th className="py-3 px-3">Origin</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No subjects match your current filter. State your custom subjects above.
                      </td>
                    </tr>
                  ) : (
                    filteredSubjects.map((sbj) => {
                      const isEditing = editingSubjectId === sbj.id;
                      return (
                        <tr key={sbj.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-mono text-emerald-400 font-semibold tabular-nums">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editSubjectDraft.code ?? sbj.code}
                                onChange={(e) =>
                                  setEditSubjectDraft({ ...editSubjectDraft, code: e.target.value })
                                }
                                className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
                              />
                            ) : (
                              sbj.code
                            )}
                          </td>
                          <td className="py-3 px-3 font-bold text-white">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editSubjectDraft.name ?? sbj.name}
                                onChange={(e) =>
                                  setEditSubjectDraft({ ...editSubjectDraft, name: e.target.value })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white"
                              />
                            ) : (
                              sbj.name
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <select
                                value={editSubjectDraft.category ?? sbj.category}
                                onChange={(e) =>
                                  setEditSubjectDraft({
                                    ...editSubjectDraft,
                                    category: e.target.value as 'Core' | 'Elective',
                                  })
                                }
                                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white"
                              >
                                <option value="Core">Core</option>
                                <option value="Elective">Elective</option>
                              </select>
                            ) : (
                              <span>
                                <strong
                                  className={
                                    sbj.category === 'Core' ? 'text-emerald-400' : 'text-amber-300'
                                  }
                                >
                                  {sbj.category}
                                </strong>{' '}
                                <span className="text-slate-400">· {sbj.level}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editSubjectDraft.department ?? sbj.department}
                                onChange={(e) =>
                                  setEditSubjectDraft({
                                    ...editSubjectDraft,
                                    department: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white"
                              />
                            ) : (
                              <span>
                                {sbj.department}
                                {sbj.programme ? ` · ${sbj.programme}` : ''}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={
                                sbj.isCustom
                                  ? 'text-emerald-400 font-semibold'
                                  : 'text-slate-400'
                              }
                            >
                              {sbj.isCustom ? 'Custom (School)' : 'Auto Default'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateSubject(sbj.id, editSubjectDraft);
                                    setEditingSubjectId(null);
                                    showNotice(`Updated subject "${editSubjectDraft.name || sbj.name}".`);
                                  }}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                                  title="Save changes"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSubjectId(null)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSubjectId(sbj.id);
                                    setEditSubjectDraft({
                                      code: sbj.code,
                                      name: sbj.name,
                                      category: sbj.category,
                                      department: sbj.department,
                                    });
                                  }}
                                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                                  title="Edit subject"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteSubject(sbj.id);
                                    showNotice(`Removed subject "${sbj.name}".`);
                                  }}
                                  className="p-1.5 hover:bg-rose-950/70 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                                  title="Remove subject"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
