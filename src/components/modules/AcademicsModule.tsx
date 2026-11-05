import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { CustomCurriculumManager } from './CustomCurriculumManager';
import { ClassStreamManager } from './ClassStreamManager';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  MapPin,
  Loader2,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';

export const AcademicsModule: React.FC = () => {
  const {
    classes,
    subjects,
    courseTracks,
    timetable,
    students,
    staff,
    addTimetablePeriod,
    deleteTimetablePeriod,
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'classes' | 'subjects' | 'timetable' | 'lesson-plan'>('classes');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');

  // Add Timetable Period State
  const [showAddPeriodForm, setShowAddPeriodForm] = useState(false);
  const [periodDay, setPeriodDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [periodNumber, setPeriodNumber] = useState(1);
  const [periodStart, setPeriodStart] = useState('08:00');
  const [periodEnd, setPeriodEnd] = useState('09:00');
  const [periodSubjectId, setPeriodSubjectId] = useState<string>(subjects[0]?.id || '');
  const [periodRoom, setPeriodRoom] = useState('Room A1');

  // AI Lesson Plan State
  const [planSubject, setPlanSubject] = useState(subjects[0]?.name || 'Integrated Science');
  const [planClassLevel, setPlanClassLevel] = useState(classes[0]?.name || 'SHS 2');
  const [planTopic, setPlanTopic] = useState('Acids, Bases and Salts');
  const [planStrand, setPlanStrand] = useState('Diversity of Matter');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  useEffect(() => {
    if (classes.length > 0 && !classes.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (subjects.length > 0 && !subjects.some((s) => s.id === periodSubjectId)) {
      setPeriodSubjectId(subjects[0].id);
    }
    if (subjects.length > 0 && !subjects.some((s) => s.name === planSubject)) {
      setPlanSubject(subjects[0].name);
    }
  }, [subjects, periodSubjectId, planSubject]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const classStudents = students.filter((s) => s.classId === selectedClassId);

  // Timetable for selected class
  const classTimetable = timetable.filter((t) => t.classId === selectedClassId);
  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  const handleGenerateLessonPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const res = await fetch('/api/gemini/lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: planSubject,
          classLevel: planClassLevel,
          topic: planTopic,
          strand: planStrand,
        }),
      });
      const data = await res.json();
      setGeneratedPlan(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            Academic & Classroom Management
          </h2>
          <p className="text-xs text-slate-400">
            GES curriculum standards, class streams, weekly timetable scheduling, and AI lesson planner.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('classes')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeTab === 'classes' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sections, Classes &amp; Streams
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subjects')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'subjects' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Courses &amp; Subjects ({courseTracks.length + subjects.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timetable')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeTab === 'timetable' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Timetable Grid
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lesson-plan')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'lesson-plan'
                ? 'bg-gradient-to-r from-purple-600 to-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Lesson Notes (AI)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Sections, Classes & Streams Management */}
      {activeTab === 'classes' && <ClassStreamManager />}

      {/* TAB 2: School Custom Courses, Programmes & Subjects */}
      {activeTab === 'subjects' && <CustomCurriculumManager />}

      {/* TAB 3: Timetable Grid */}
      {activeTab === 'timetable' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-base">Weekly Class Timetable</h3>
              <p className="text-xs text-slate-400">
                Schedule school custom subjects and automatic courses for {selectedClass?.name || 'Selected Class'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowAddPeriodForm((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>{showAddPeriodForm ? 'Close Form' : 'Schedule Period'}</span>
              </button>
            </div>
          </div>

          {showAddPeriodForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedClassId || !periodSubjectId) return;
                addTimetablePeriod({
                  classId: selectedClassId,
                  dayOfWeek: periodDay,
                  periodNumber,
                  startTime: periodStart,
                  endTime: periodEnd,
                  subjectId: periodSubjectId,
                  teacherId: selectedClass?.formTutorTeacherId || staff[0]?.id || 'stf-default',
                  room: periodRoom.trim() || selectedClass?.roomNumber || 'Main Hall',
                });
                setShowAddPeriodForm(false);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs items-end"
            >
              <div>
                <label className="block text-slate-400 mb-1">Day of Week</label>
                <select
                  value={periodDay}
                  onChange={(e) => setPeriodDay(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Subject / Module</label>
                <select
                  value={periodSubjectId}
                  onChange={(e) => setPeriodSubjectId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Period #</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={periodNumber}
                  onChange={(e) => setPeriodNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Start - End</label>
                <div className="flex items-center gap-1">
                  <input
                    type="time"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="time"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Lecture Room / Lab</label>
                <input
                  type="text"
                  value={periodRoom}
                  onChange={(e) => setPeriodRoom(e.target.value)}
                  placeholder="e.g. Lab 2"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={subjects.length === 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                Add to Timetable
              </button>
            </form>
          )}

          <div className="space-y-4">
            {days.map((day) => {
              const dayPeriods = classTimetable
                .filter((t) => t.dayOfWeek === day)
                .sort((a, b) => a.periodNumber - b.periodNumber);
              return (
                <div key={day} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <h4 className="font-bold text-xs text-emerald-400 uppercase tracking-wider mb-3">
                    {day}
                  </h4>
                  {dayPeriods.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {dayPeriods.map((p) => {
                        const sbj = subjects.find((s) => s.id === p.subjectId);
                        return (
                          <div
                            key={p.id}
                            className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs group relative"
                          >
                            <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                              <span className="font-bold text-white tabular-nums">Period {p.periodNumber}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-emerald-400 tabular-nums">
                                  {p.startTime} - {p.endTime}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => deleteTimetablePeriod(p.id)}
                                  className="text-slate-500 hover:text-rose-400 transition cursor-pointer"
                                  title="Remove scheduled period"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div className="font-bold text-white text-xs mt-1">
                              {sbj?.name || 'Scheduled Module'}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{p.room}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">
                      No scheduled teaching periods (Self study / Sports / Extra-curricular)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: AI GES Lesson Planner */}
      {activeTab === 'lesson-plan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generator Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                GES NaCCA Lesson Note Assistant
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Generates Ghana Education Service compliant lesson notes with strands, sub-strands, learning indicators, and activities.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Subject / Course Module</label>
                <select
                  value={planSubject}
                  onChange={(e) => setPlanSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {subjects.length > 0 ? (
                    subjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.code}{s.isCustom ? ' · School Custom' : ''})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Integrated Science">Integrated Science</option>
                      <option value="Core Mathematics">Core Mathematics</option>
                      <option value="English Language">English Language</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Class / Form / Level</label>
                <select
                  value={planClassLevel}
                  onChange={(e) => setPlanClassLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="SHS 1">SHS 1</option>
                  <option value="SHS 2">SHS 2</option>
                  <option value="SHS 3">SHS 3</option>
                  <option value="JHS 1">JHS 1 (Basic 7)</option>
                  <option value="JHS 2">JHS 2 (Basic 8)</option>
                  <option value="JHS 3">JHS 3 (Basic 9 - BECE)</option>
                  <option value="Level 100 / Diploma">Level 100 / Diploma</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Topic / Content</label>
                <input
                  type="text"
                  value={planTopic}
                  onChange={(e) => setPlanTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Chemical bonding, Quadratic equations..."
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Curriculum Strand (Optional)</label>
                <input
                  type="text"
                  value={planStrand}
                  onChange={(e) => setPlanStrand(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Diversity of Matter"
                />
              </div>

              <button
                onClick={handleGenerateLessonPlan}
                disabled={isGeneratingPlan}
                className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating GES Lesson Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Lesson Note
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Lesson Plan View */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white text-xs space-y-4">
            {generatedPlan ? (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Ghana Education Service Lesson Note (Form {generatedPlan.classLevel})
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {generatedPlan.subject} — {planTopic}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-600/40 rounded-lg text-xs font-bold">
                    NaCCA Aligned
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block font-medium">Strand:</span>
                    <span className="font-bold text-white">{generatedPlan.strand}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Sub-strand:</span>
                    <span className="font-bold text-white">{generatedPlan.subStrand}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">Content Standard:</span>
                    <span className="font-mono text-emerald-400">{generatedPlan.contentStandard}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">Learning Indicator:</span>
                    <span className="text-slate-200">{generatedPlan.learningIndicator}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-amber-400 font-bold block">Core Competencies:</span>
                  <p className="text-slate-300">{generatedPlan.coreCompetencies}</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-bold block">Teaching / Learning Resources:</span>
                  <p className="text-slate-300">{generatedPlan.resources}</p>
                </div>

                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
                    Lesson Delivery (Phase Breakdown)
                  </h4>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <strong className="text-emerald-400 block mb-0.5">Starter / Introduction:</strong>
                    <p className="text-slate-300">{generatedPlan.starterPhase}</p>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                    <strong className="text-emerald-400 block">Main Activities:</strong>
                    {Array.isArray(generatedPlan.mainPhase) ? (
                      generatedPlan.mainPhase.map((step: string, idx: number) => (
                        <p key={idx} className="text-slate-300 pl-2 border-l border-slate-700">
                          {step}
                        </p>
                      ))
                    ) : (
                      <p className="text-slate-300">{generatedPlan.mainPhase}</p>
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <strong className="text-amber-400 block mb-0.5">Formative Assessment:</strong>
                    <p className="text-slate-300">{generatedPlan.assessment}</p>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <strong className="text-blue-400 block mb-0.5">Learner Homework:</strong>
                    <p className="text-slate-300">{generatedPlan.homework}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
                <FileText className="w-12 h-12 mb-3 text-slate-600" />
                <p className="font-semibold text-slate-400">No Lesson Note generated yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Select your subject, class level, and topic on the left to instantly generate a standardized GES lesson note.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
