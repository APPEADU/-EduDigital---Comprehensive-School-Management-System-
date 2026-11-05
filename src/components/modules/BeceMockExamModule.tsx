import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  BeceAssessmentCategory,
  BeceInterventionType,
  BeceMockScoreRecord,
} from '../../types';
import {
  calculateBeceGrade,
  calculateBeceAggregate,
  isBeceCoreFourSubject,
} from '../../utils/academicCalculations';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import {
  Award,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  EyeOff,
  FileText,
  LineChart,
  Minus,
  Plus,
  Printer,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  Trash2,
  Users,
} from 'lucide-react';

interface BeceSubjectOption {
  id: string;
  name: string;
  category: 'Core' | 'Elective';
}

const DEFAULT_BECE_SUBJECTS: BeceSubjectOption[] = [
  { id: 'bece-eng', name: 'English Language', category: 'Core' },
  { id: 'bece-math', name: 'Core Mathematics', category: 'Core' },
  { id: 'bece-sci', name: 'Integrated Science', category: 'Core' },
  { id: 'bece-soc', name: 'Social Studies', category: 'Core' },
  { id: 'bece-comp', name: 'Computing', category: 'Elective' },
  { id: 'bece-rme', name: 'Religious & Moral Education', category: 'Elective' },
  { id: 'bece-cad', name: 'Creative Arts & Design', category: 'Elective' },
  { id: 'bece-ctech', name: 'Career Technology', category: 'Elective' },
  { id: 'bece-fre', name: 'French', category: 'Elective' },
  { id: 'bece-ghl', name: 'Ghanaian Language', category: 'Elective' },
];

const INTERVENTION_TYPES: BeceInterventionType[] = [
  'Remedial Classes',
  'Extra Lessons / Clinic',
  'Peer Tutoring',
  'Teacher Consultation',
  'Structured Revision Timetable',
  'WAEC Past-Question Practice',
  'Regular Progress Assessment',
];

type ActiveBeceTab = 'series' | 'trends' | 'ai-support' | 'interventions';

export const BeceMockExamModule: React.FC = () => {
  const {
    school,
    currentUser,
    students,
    classes,
    subjects,
    attendance,
    examResults,
    beceMockSeries,
    beceMockScores,
    beceInterventions,
    beceAiReports,
    createBeceMockSeries,
    updateBeceMockSeries,
    deleteBeceMockSeries,
    saveBeceMockScore,
    assignBeceIntervention,
    updateBeceIntervention,
    deleteBeceIntervention,
    saveBeceAiReport,
    sendAnnouncement,
    setActiveModule,
  } = useSchool();

  const [activeTab, setActiveTab] = useState<ActiveBeceTab>('series');
  const [confidentialProjectorMode, setConfidentialProjectorMode] = useState(false);

  // Merge school subjects with GES BECE standard subjects
  const availableSubjects: BeceSubjectOption[] = useMemo(() => {
    const mergedMap = new Map<string, BeceSubjectOption>();
    for (const item of DEFAULT_BECE_SUBJECTS) {
      mergedMap.set(item.name.toLowerCase(), item);
    }
    for (const sub of subjects) {
      const key = sub.name.toLowerCase();
      if (!mergedMap.has(key)) {
        mergedMap.set(key, {
          id: sub.id,
          name: sub.name,
          category: isBeceCoreFourSubject(sub.name) ? 'Core' : sub.category,
        });
      }
    }
    return Array.from(mergedMap.values());
  }, [subjects]);

  // Sorted chronological mock series
  const sortedSeries = useMemo(
    () => [...beceMockSeries].sort((a, b) => a.sequenceOrder - b.sequenceOrder),
    [beceMockSeries]
  );

  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(
    sortedSeries[sortedSeries.length - 1]?.id || ''
  );
  const effectiveSeriesId =
    sortedSeries.some((s) => s.id === selectedSeriesId)
      ? selectedSeriesId
      : sortedSeries[sortedSeries.length - 1]?.id || '';

  const activeSeries = sortedSeries.find((s) => s.id === effectiveSeriesId) || null;

  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(DEFAULT_BECE_SUBJECTS[0].id);

  // Selected student for Trends & AI Support
  const activeStudents = useMemo(
    () => students.filter((st) => st.status === 'Active'),
    [students]
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(activeStudents[0]?.id || '');
  const effectiveStudentId =
    activeStudents.some((s) => s.id === selectedStudentId)
      ? selectedStudentId
      : activeStudents[0]?.id || '';
  const selectedStudent = activeStudents.find((s) => s.id === effectiveStudentId) || null;

  // Create New Mock Series Modal State
  const [showCreateSeriesModal, setShowCreateSeriesModal] = useState(false);
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesShortLabel, setSeriesShortLabel] = useState('');
  const [seriesCategory, setSeriesCategory] = useState<BeceAssessmentCategory>('BECE Mock Series');
  const [seriesDate, setSeriesDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [seriesTargetClassId, setSeriesTargetClassId] = useState('all');
  const [seriesNotes, setSeriesNotes] = useState('');
  const [confirmDeleteSeriesId, setConfirmDeleteSeriesId] = useState<string | null>(null);

  // Local score drafts for smooth entry
  const [scoreDrafts, setScoreDrafts] = useState<
    Record<string, { secA: string; secB: string; saved?: boolean }>
  >({});

  // AI Generation State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [revealedQuestionIndices, setRevealedQuestionIndices] = useState<Record<number, boolean>>({});
  const [assignedToastKey, setAssignedToastKey] = useState<string | null>(null);

  // Intervention Modal State
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [intStudentId, setIntStudentId] = useState('');
  const [intSubjectName, setIntSubjectName] = useState('Core Mathematics');
  const [intType, setIntType] = useState<BeceInterventionType>('Remedial Classes');
  const [intTopics, setIntTopics] = useState('');
  const [intSchedule, setIntSchedule] = useState('Tuesdays & Thursdays · 3:15 PM – 4:15 PM');
  const [confirmDeleteIntId, setConfirmDeleteIntId] = useState<string | null>(null);
  const [alertSentStudentId, setAlertSentStudentId] = useState<string | null>(null);

  const filteredClassStudents = useMemo(() => {
    return activeStudents.filter(
      (st) => selectedClassId === 'all' || st.classId === selectedClassId
    );
  }, [activeStudents, selectedClassId]);

  const activeSubject =
    availableSubjects.find((s) => s.id === selectedSubjectId) || availableSubjects[0];

  // Compute student aggregates for the active series
  const seriesLeaderboard = useMemo(() => {
    if (!activeSeries) return [];
    return filteredClassStudents
      .map((st) => {
        const stScores = beceMockScores.filter(
          (sc) => sc.seriesId === activeSeries.id && sc.studentId === st.id
        );
        const aggResult = calculateBeceAggregate(stScores);
        return {
          student: st,
          scoresCount: stScores.length,
          aggregate: aggResult.aggregate,
          averageScore: aggResult.averageScore,
          coreComplete: aggResult.coreSubjectsUsed.length === 4,
        };
      })
      .sort((a, b) => {
        if (a.scoresCount === 0 && b.scoresCount === 0) return 0;
        if (a.scoresCount === 0) return 1;
        if (b.scoresCount === 0) return -1;
        if (a.aggregate !== b.aggregate) return a.aggregate - b.aggregate;
        return b.averageScore - a.averageScore;
      });
  }, [activeSeries, filteredClassStudents, beceMockScores]);

  // Compute longitudinal progression for selectedStudent across all sortedSeries
  const studentLongitudinal = useMemo(() => {
    if (!selectedStudent) return [];
    return sortedSeries
      .map((ser) => {
        const scores = beceMockScores.filter(
          (sc) => sc.seriesId === ser.id && sc.studentId === selectedStudent.id
        );
        if (scores.length === 0) return null;
        const agg = calculateBeceAggregate(scores);
        return {
          series: ser,
          scores,
          aggregate: agg.aggregate,
          averageScore: agg.averageScore,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [selectedStudent, sortedSeries, beceMockScores]);

  // Determine student's trend direction
  const studentTrendDirection: 'Improving' | 'Maintaining' | 'Declining' = useMemo(() => {
    if (studentLongitudinal.length < 2) return 'Maintaining';
    const prev = studentLongitudinal[studentLongitudinal.length - 2];
    const curr = studentLongitudinal[studentLongitudinal.length - 1];
    // Lower BECE aggregate or +3% higher average score means Improving
    if (curr.aggregate < prev.aggregate || curr.averageScore >= prev.averageScore + 3) {
      return 'Improving';
    }
    if (curr.aggregate > prev.aggregate + 1 || curr.averageScore <= prev.averageScore - 3) {
      return 'Declining';
    }
    return 'Maintaining';
  }, [studentLongitudinal]);

  // Identify students across the school with declining mock performance
  const decliningAlerts = useMemo(() => {
    if (sortedSeries.length < 2) return [];
    const latestSer = sortedSeries[sortedSeries.length - 1];
    const prevSer = sortedSeries[sortedSeries.length - 2];

    return activeStudents
      .map((st) => {
        const prevScores = beceMockScores.filter(
          (sc) => sc.seriesId === prevSer.id && sc.studentId === st.id
        );
        const currScores = beceMockScores.filter(
          (sc) => sc.seriesId === latestSer.id && sc.studentId === st.id
        );
        if (prevScores.length === 0 || currScores.length === 0) return null;

        const prevAgg = calculateBeceAggregate(prevScores);
        const currAgg = calculateBeceAggregate(currScores);

        const droppedSubjects = currScores
          .map((cs) => {
            const ps = prevScores.find((p) => p.subjectName === cs.subjectName);
            if (!ps) return null;
            const delta = cs.totalScore - ps.totalScore;
            return delta <= -5 ? { subjectName: cs.subjectName, prev: ps.totalScore, curr: cs.totalScore, delta } : null;
          })
          .filter((x): x is NonNullable<typeof x> => Boolean(x));

        const isDeclining =
          currAgg.aggregate > prevAgg.aggregate + 1 ||
          currAgg.averageScore <= prevAgg.averageScore - 3 ||
          droppedSubjects.length > 0;

        if (!isDeclining) return null;

        return {
          student: st,
          prevSeriesLabel: prevSer.shortLabel,
          currSeriesLabel: latestSer.shortLabel,
          prevAggregate: prevAgg.aggregate,
          currAggregate: currAgg.aggregate,
          prevAvg: prevAgg.averageScore,
          currAvg: currAgg.averageScore,
          droppedSubjects,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [sortedSeries, activeStudents, beceMockScores]);

  const handleCreateSeriesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesTitle.trim()) return;
    const nextNum = sortedSeries.length + 1;
    const created = createBeceMockSeries({
      title: seriesTitle.trim(),
      shortLabel: seriesShortLabel.trim() || `Mock ${nextNum}`,
      category: seriesCategory,
      academicYear: school.currentAcademicYear,
      term: school.currentTerm,
      dateConducted: seriesDate,
      targetClassId: seriesTargetClassId,
      maxScorePerSubject: 100,
      publishedToPortals: true,
      notes: seriesNotes.trim(),
    });
    setSelectedSeriesId(created.id);
    setSeriesTitle('');
    setSeriesShortLabel('');
    setSeriesNotes('');
    setShowCreateSeriesModal(false);
  };

  const handleSaveStudentSubjectScore = (studentId: string, classId: string) => {
    if (!activeSeries || !activeSubject) return;
    const draftKey = `${activeSeries.id}_${studentId}_${activeSubject.id}`;
    const existing = beceMockScores.find(
      (sc) =>
        sc.seriesId === activeSeries.id &&
        sc.studentId === studentId &&
        sc.subjectName.toLowerCase() === activeSubject.name.toLowerCase()
    );

    const draft = scoreDrafts[draftKey];
    const secA = Math.min(
      40,
      Math.max(0, Number(draft ? draft.secA : existing?.sectionAScore ?? 0) || 0)
    );
    const secB = Math.min(
      60,
      Math.max(0, Number(draft ? draft.secB : existing?.sectionBScore ?? 0) || 0)
    );

    saveBeceMockScore({
      seriesId: activeSeries.id,
      studentId,
      classId,
      subjectId: activeSubject.id,
      subjectName: activeSubject.name,
      subjectCategory: isBeceCoreFourSubject(activeSubject.name) ? 'Core' : activeSubject.category,
      sectionAScore: secA,
      sectionBScore: secB,
      recordedBy: currentUser.name,
    });

    setScoreDrafts((prev) => ({
      ...prev,
      [draftKey]: { secA: String(secA), secB: String(secB), saved: true },
    }));
    setTimeout(() => {
      setScoreDrafts((prev) =>
        prev[draftKey] ? { ...prev, [draftKey]: { ...prev[draftKey], saved: false } } : prev
      );
    }, 1800);
  };

  const handlePopulateCoreBaselineForSeries = () => {
    if (!activeSeries || filteredClassStudents.length === 0) return;
    const coreSix = DEFAULT_BECE_SUBJECTS.slice(0, 6);
    filteredClassStudents.forEach((st, stIdx) => {
      coreSix.forEach((sub, subIdx) => {
        const already = beceMockScores.some(
          (sc) =>
            sc.seriesId === activeSeries.id &&
            sc.studentId === st.id &&
            sc.subjectName.toLowerCase() === sub.name.toLowerCase()
        );
        if (already) return;
        const seedBase = ((stIdx * 7 + subIdx * 11 + activeSeries.sequenceOrder * 4) % 28) + 52;
        const secA = Math.min(38, Math.round(seedBase * 0.38));
        const secB = Math.min(58, seedBase - secA);
        saveBeceMockScore({
          seriesId: activeSeries.id,
          studentId: st.id,
          classId: st.classId,
          subjectId: sub.id,
          subjectName: sub.name,
          subjectCategory: sub.category,
          sectionAScore: secA,
          sectionBScore: secB,
          recordedBy: currentUser.name,
        });
      });
    });
  };

  // Compute selected student's attendance & continuous assessment average
  const selectedStudentMetrics = useMemo(() => {
    if (!selectedStudent) return { attendanceRate: 92, caAvg: 68 };
    const attRecords = attendance.filter((a) => a.studentId === selectedStudent.id);
    const presentCount = attRecords.filter(
      (a) => a.status === 'Present' || a.status === 'Late'
    ).length;
    const attendanceRate =
      attRecords.length > 0 ? Math.round((presentCount / attRecords.length) * 100) : 94;

    const termResults = examResults.filter((r) => r.studentId === selectedStudent.id);
    const caAvg =
      termResults.length > 0
        ? Math.round(
            termResults.reduce((acc, r) => acc + r.totalScore, 0) / termResults.length
          )
        : 68;

    return { attendanceRate, caAvg };
  }, [selectedStudent, attendance, examResults]);

  const latestAiReportForStudent = useMemo(() => {
    if (!selectedStudent) return null;
    return beceAiReports.find((r) => r.studentId === selectedStudent.id) || null;
  }, [beceAiReports, selectedStudent]);

  const handleGenerateBeceAiSupport = async () => {
    if (!selectedStudent) return;
    setAiError(null);
    setIsGeneratingAi(true);
    setRevealedQuestionIndices({});

    try {
      const latestRun = studentLongitudinal[studentLongitudinal.length - 1];
      const latestSubjects: Array<{
        subjectName: string;
        totalScore: number;
        beceGrade: number;
        sectionAScore: number;
        sectionBScore: number;
      }> = latestRun
        ? latestRun.scores.map((sc) => ({
            subjectName: sc.subjectName,
            totalScore: sc.totalScore,
            beceGrade: sc.beceGrade,
            sectionAScore: sc.sectionAScore,
            sectionBScore: sc.sectionBScore,
          }))
        : DEFAULT_BECE_SUBJECTS.slice(0, 6).map((sub) => ({
            subjectName: sub.name,
            totalScore: selectedStudentMetrics.caAvg,
            beceGrade: calculateBeceGrade(selectedStudentMetrics.caAvg).grade,
            sectionAScore: Math.round(selectedStudentMetrics.caAvg * 0.4),
            sectionBScore: Math.round(selectedStudentMetrics.caAvg * 0.6),
          }));

      const latestAggregate = latestRun ? latestRun.aggregate : 18;
      const studentClass = classes.find((c) => c.id === selectedStudent.classId)?.name || 'JHS 3';

      const response = await fetch('/api/gemini/bece-mock-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: school.name,
          studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
          className: studentClass,
          mockHistory: studentLongitudinal.map((m) => ({
            series: m.series.shortLabel,
            date: m.series.dateConducted,
            aggregate: m.aggregate,
            averageScore: m.averageScore,
          })),
          latestSubjects,
          latestAggregate,
          trendDirection: studentTrendDirection,
          attendanceRatePercent: selectedStudentMetrics.attendanceRate,
          continuousAssessmentAvg: selectedStudentMetrics.caAvg,
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to generate BECE AI Readiness Report right now.');
      }

      const data = await response.json();
      saveBeceAiReport({
        studentId: selectedStudent.id,
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        readinessLevel: data.readinessLevel || 'On Track (Credit Readiness)',
        predictedAggregateBand: data.predictedAggregateBand || `Aggregate ${latestAggregate} (Advisory)`,
        trendDirection: studentTrendDirection,
        attendanceRatePercent: selectedStudentMetrics.attendanceRate,
        continuousAssessmentAvg: selectedStudentMetrics.caAvg,
        executiveSummary: data.executiveSummary || '',
        guidanceDisclaimer:
          data.guidanceDisclaimer ||
          'Educational Guidance Notice: Predictions are generated for academic planning and revision support, not guaranteed WAEC BECE outcomes.',
        subjectDiagnoses: Array.isArray(data.subjectDiagnoses) ? data.subjectDiagnoses : [],
        practiceQuestions: Array.isArray(data.practiceQuestions) ? data.practiceQuestions : [],
        weeklyStudyPlan: Array.isArray(data.weeklyStudyPlan) ? data.weeklyStudyPlan : [],
        recommendedInterventions: Array.isArray(data.recommendedInterventions)
          ? data.recommendedInterventions
          : [],
      });
    } catch (err: any) {
      setAiError(err?.message || 'Failed to generate AI academic support report.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCreateInterventionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSt = activeStudents.find((s) => s.id === (intStudentId || effectiveStudentId));
    if (!targetSt || !intTopics.trim()) return;

    const latestSer = sortedSeries[sortedSeries.length - 1];
    const existingSubScore = latestSer
      ? beceMockScores.find(
          (sc) =>
            sc.seriesId === latestSer.id &&
            sc.studentId === targetSt.id &&
            sc.subjectName.toLowerCase() === intSubjectName.toLowerCase()
        )
      : undefined;

    assignBeceIntervention({
      studentId: targetSt.id,
      studentName: `${targetSt.firstName} ${targetSt.lastName}`,
      subjectName: intSubjectName,
      interventionType: intType,
      focusTopics: intTopics.trim(),
      scheduleSummary: intSchedule.trim() || 'Weekly Subject Clinic',
      assignedBy: currentUser.name,
      status: 'In Progress',
      baselineSeriesId: latestSer?.id,
      baselineScore: existingSubScore?.totalScore ?? 50,
    });

    setIntTopics('');
    setShowInterventionModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 print:hidden">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
            <Target className="w-4 h-4 shrink-0" />
            <span>Basic Education Certificate Examination (BECE) Readiness Suite</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">{school.currentAcademicYear}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Mock Examination Management, Performance Tracking &amp; AI Learning Support
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            Organise BECE mock series, revision tests, and subject trials; compute automatic GES/WAEC
            Stanine grades (1–9) and Best-6 aggregates; monitor longitudinal student progress; and
            deliver AI-guided revision plans and tracked academic interventions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setConfidentialProjectorMode(!confidentialProjectorMode)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer whitespace-nowrap"
            title="Mask student names during staffroom projector review"
          >
            {confidentialProjectorMode ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Confidential IDs Only</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Names Visible</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowCreateSeriesModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>New Mock Series / Test</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-400">Mock Series &amp; Revision Tests</div>
          <div className="text-2xl font-bold text-white tabular-nums">{sortedSeries.length}</div>
          <div className="text-[11px] text-slate-500">
            {activeSeries ? `Active: ${activeSeries.shortLabel} (${activeSeries.category})` : 'Create your first mock series'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-400">Subject Score Entries</div>
          <div className="text-2xl font-bold text-white tabular-nums">{beceMockScores.length}</div>
          <div className="text-[11px] text-slate-500 tabular-nums">
            Across {activeStudents.length} active {activeStudents.length === 1 ? 'candidate' : 'candidates'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-400">AI Readiness Reports</div>
          <div className="text-2xl font-bold text-emerald-400 tabular-nums">{beceAiReports.length}</div>
          <div className="text-[11px] text-slate-500">
            Personalised study plans &amp; topic drills
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-400">Tracked Interventions &amp; Alerts</div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {beceInterventions.length}
            {decliningAlerts.length > 0 && (
              <span className="text-xs font-semibold text-amber-400 ml-2">
                · {decliningAlerts.length} declining
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            Baseline vs follow-up score impact
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-xl print:hidden">
        {[
          { id: 'series' as ActiveBeceTab, label: 'Mock Series & Score Entry', icon: ClipboardCheck },
          { id: 'trends' as ActiveBeceTab, label: 'Performance Trends & Progress', icon: LineChart },
          { id: 'ai-support' as ActiveBeceTab, label: 'AI Learning Support & Prediction', icon: Sparkles },
          {
            id: 'interventions' as ActiveBeceTab,
            label: `Interventions & Alerts (${beceInterventions.length})`,
            icon: Award,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Empty Students Guard */}
      {activeStudents.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <Users className="w-9 h-9 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Active Basic School Candidates Enrolled Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Enroll students in the Student Registry or approve online admission applications first so teachers can record BECE mock examination marks and generate individual readiness reports.
          </p>
          <button
            type="button"
            onClick={() => setActiveModule('students')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap"
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Open Student Registry</span>
          </button>
        </div>
      ) : (
        <>
          {/* =================================================================
              TAB 1: MOCK SERIES & SUBJECT SCORE ENTRY
             ================================================================= */}
          {activeTab === 'series' && (
            <div className="space-y-6">
              {/* Mock Series Strip */}
              {sortedSeries.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <Calendar className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-bold text-white">
                    Create Your First BECE Mock Examination or Revision Test
                  </h3>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto">
                    Organise Mock 1 (Diagnostic Baseline), Mock 2 (Mid-Term Trial), Revision Tests, and Pre-BECE Final Mocks to track candidate progression over time.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCreateSeriesModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Create Mock 1 Series</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Series Selector Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sortedSeries.map((ser) => {
                      const isCurrent = ser.id === activeSeries?.id;
                      const seriesScoresCount = beceMockScores.filter((s) => s.seriesId === ser.id).length;
                      const isConfirmingDel = confirmDeleteSeriesId === ser.id;
                      return (
                        <div
                          key={ser.id}
                          onClick={() => setSelectedSeriesId(ser.id)}
                          className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                            isCurrent
                              ? 'bg-emerald-950/30 border-emerald-500/70'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="font-mono font-semibold text-emerald-400">
                                #{ser.sequenceOrder} · {ser.shortLabel}
                              </span>
                              <span className="text-slate-400 tabular-nums">{ser.dateConducted}</span>
                            </div>
                            <h3 className="text-sm font-bold text-white line-clamp-1">{ser.title}</h3>
                            <p className="text-[11px] text-slate-400">
                              {ser.category} · {ser.term} ·{' '}
                              <span className="tabular-nums">{seriesScoresCount} subject marks</span>
                            </p>
                          </div>

                          <div
                            className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                updateBeceMockSeries(ser.id, {
                                  publishedToPortals: !ser.publishedToPortals,
                                })
                              }
                              className={`font-semibold transition cursor-pointer whitespace-nowrap ${
                                ser.publishedToPortals ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {ser.publishedToPortals
                                ? '✓ Published to Portals'
                                : 'Draft (Hidden from Portals)'}
                            </button>

                            {isConfirmingDel ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmDeleteSeriesId(null);
                                    deleteBeceMockSeries(ser.id);
                                  }}
                                  className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer whitespace-nowrap"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteSeriesId(null)}
                                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] cursor-pointer whitespace-nowrap"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteSeriesId(ser.id)}
                                className="text-slate-500 hover:text-rose-400 transition cursor-pointer"
                                title="Delete Mock Series"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Filter Bar + Subject Score Entry Sheet */}
                  {activeSeries && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
                      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-slate-800">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 max-w-2xl">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              Filter Class / Stream
                            </label>
                            <select
                              value={selectedClassId}
                              onChange={(e) => setSelectedClassId(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                            >
                              <option value="all">All Enrolled Candidates ({activeStudents.length})</option>
                              {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                  {cls.name} ({cls.level})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              BECE Subject for Score Entry
                            </label>
                            <select
                              value={selectedSubjectId}
                              onChange={(e) => setSelectedSubjectId(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                            >
                              {availableSubjects.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                  {sub.name} ({isBeceCoreFourSubject(sub.name) ? 'Core 4' : 'Elective'})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={handlePopulateCoreBaselineForSeries}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer whitespace-nowrap"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Auto-Fill Unscored Core Subjects</span>
                          </button>
                        </div>
                      </div>

                      {/* Subject Mark Sheet Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                              <th className="py-2.5 px-3">Candidate</th>
                              <th className="py-2.5 px-3">Sec A Obj (40)</th>
                              <th className="py-2.5 px-3">Sec B Theory (60)</th>
                              <th className="py-2.5 px-3">Total (100)</th>
                              <th className="py-2.5 px-3">BECE Stanine</th>
                              <th className="py-2.5 px-3">Best-6 Aggregate</th>
                              <th className="py-2.5 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 text-slate-200">
                            {filteredClassStudents.map((st) => {
                              const draftKey = `${activeSeries.id}_${st.id}_${activeSubject.id}`;
                              const existing: BeceMockScoreRecord | undefined = beceMockScores.find(
                                (sc) =>
                                  sc.seriesId === activeSeries.id &&
                                  sc.studentId === st.id &&
                                  sc.subjectName.toLowerCase() === activeSubject.name.toLowerCase()
                              );
                              const draft = scoreDrafts[draftKey];
                              const secAVal =
                                draft !== undefined
                                  ? draft.secA
                                  : existing !== undefined
                                  ? String(existing.sectionAScore)
                                  : '';
                              const secBVal =
                                draft !== undefined
                                  ? draft.secB
                                  : existing !== undefined
                                  ? String(existing.sectionBScore)
                                  : '';

                              const previewTotal = Math.min(
                                100,
                                Math.max(0, (Number(secAVal) || 0) + (Number(secBVal) || 0))
                              );
                              const hasPreview = secAVal !== '' || secBVal !== '';
                              const gradePreview = hasPreview ? calculateBeceGrade(previewTotal) : null;

                              const leaderRow = seriesLeaderboard.find((l) => l.student.id === st.id);
                              const rankIndex =
                                leaderRow && leaderRow.scoresCount > 0
                                  ? seriesLeaderboard.findIndex((l) => l.student.id === st.id) + 1
                                  : null;

                              return (
                                <tr key={st.id} className="hover:bg-slate-800/30">
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-2.5">
                                      <img
                                        src={st.photo}
                                        alt={st.firstName}
                                        className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
                                      />
                                      <div>
                                        <div className="font-semibold text-white">
                                          {confidentialProjectorMode
                                            ? `Candidate ${st.studentNumber}`
                                            : `${st.firstName} ${st.lastName}`}
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-400 tabular-nums">
                                          {st.studentNumber}
                                          {rankIndex ? ` · Class Pos #${rankIndex}` : ''}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-3 px-3">
                                    <input
                                      type="number"
                                      min={0}
                                      max={40}
                                      value={secAVal}
                                      placeholder="0–40"
                                      onChange={(e) =>
                                        setScoreDrafts((prev) => ({
                                          ...prev,
                                          [draftKey]: {
                                            secA: e.target.value,
                                            secB: secBVal,
                                          },
                                        }))
                                      }
                                      className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                                    />
                                  </td>

                                  <td className="py-3 px-3">
                                    <input
                                      type="number"
                                      min={0}
                                      max={60}
                                      value={secBVal}
                                      placeholder="0–60"
                                      onChange={(e) =>
                                        setScoreDrafts((prev) => ({
                                          ...prev,
                                          [draftKey]: {
                                            secA: secAVal,
                                            secB: e.target.value,
                                          },
                                        }))
                                      }
                                      className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                                    />
                                  </td>

                                  <td className="py-3 px-3 font-mono font-bold text-white tabular-nums">
                                    {hasPreview ? `${previewTotal}%` : '—'}
                                  </td>

                                  <td className="py-3 px-3 tabular-nums">
                                    {gradePreview ? (
                                      <span
                                        className={`font-semibold ${
                                          gradePreview.grade <= 3
                                            ? 'text-emerald-400'
                                            : gradePreview.grade <= 6
                                            ? 'text-amber-300'
                                            : 'text-rose-400'
                                        }`}
                                      >
                                        Grade {gradePreview.grade} · {gradePreview.interpretation}
                                      </span>
                                    ) : (
                                      <span className="text-slate-500">Not Recorded</span>
                                    )}
                                  </td>

                                  <td className="py-3 px-3 font-mono tabular-nums">
                                    {leaderRow && leaderRow.scoresCount > 0 ? (
                                      <span className="text-slate-200 font-semibold">
                                        Agg {String(leaderRow.aggregate).padStart(2, '0')}{' '}
                                        <span className="text-slate-500 font-normal">
                                          ({leaderRow.averageScore}% avg)
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-500">—</span>
                                    )}
                                  </td>

                                  <td className="py-3 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveStudentSubjectScore(st.id, st.classId)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
                                    >
                                      {draft?.saved ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 shrink-0" />
                                          <span>Saved</span>
                                        </>
                                      ) : (
                                        <span>Save Score</span>
                                      )}
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
                </>
              )}
            </div>
          )}

          {/* =================================================================
              TAB 2: PERFORMANCE TRENDS, STRENGTHS/WEAKNESSES & PROGRESS REPORT
             ================================================================= */}
          {activeTab === 'trends' && selectedStudent && (
            <div className="space-y-6">
              {/* Candidate Selector & Print Action */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-3.5 flex-1">
                  <img
                    src={selectedStudent.photo}
                    alt={selectedStudent.firstName}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                  <div className="flex-1 max-w-md">
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                      Inspect Candidate Longitudinal Mock Record
                    </label>
                    <select
                      value={selectedStudent.id}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
                    >
                      {activeStudents.map((st) => (
                        <option key={st.id} value={st.id}>
                          {confidentialProjectorMode
                            ? `Candidate ${st.studentNumber}`
                            : `${st.firstName} ${st.lastName} (${st.studentNumber})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('ai-support');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400 transition cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Open AI Study Plan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                  >
                    <Printer className="w-3.5 h-3.5 shrink-0" />
                    <span>Print Progress Report</span>
                  </button>
                </div>
              </div>

              {studentLongitudinal.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                  <h3 className="text-sm font-bold text-white">
                    No Mock Examination Scores Recorded Yet for {selectedStudent.firstName}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Switch to the Mock Series &amp; Score Entry tab to enter subject marks across one or more mock series.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Printable Candidate Progress Header + Trajectory Summary */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                      <div className="flex items-center gap-4">
                        <img
                          src={selectedStudent.photo}
                          alt={selectedStudent.firstName}
                          className="w-16 h-20 rounded-xl object-cover border border-slate-700 shrink-0"
                        />
                        <div>
                          <div className="text-xs text-emerald-400 font-semibold">
                            {school.name} · Individual BECE Mock Progress Report
                          </div>
                          <h2 className="text-lg font-bold text-white mt-0.5">
                            {confidentialProjectorMode
                              ? `Candidate ${selectedStudent.studentNumber}`
                              : `${selectedStudent.firstName} ${selectedStudent.lastName}`}
                          </h2>
                          <p className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                            Index: {selectedStudent.studentNumber} · Attendance:{' '}
                            {selectedStudentMetrics.attendanceRate}% · Term CA Avg:{' '}
                            {selectedStudentMetrics.caAvg}%
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[11px] text-slate-400">Latest Best-6 Aggregate</div>
                          <div className="text-2xl font-bold text-white font-mono tabular-nums">
                            {String(
                              studentLongitudinal[studentLongitudinal.length - 1].aggregate
                            ).padStart(2, '0')}
                          </div>
                        </div>

                        <div className="pl-4 border-l border-slate-800">
                          <div className="text-[11px] text-slate-400">Performance Trajectory</div>
                          <div
                            className={`inline-flex items-center gap-1 text-sm font-bold mt-0.5 ${
                              studentTrendDirection === 'Improving'
                                ? 'text-emerald-400'
                                : studentTrendDirection === 'Declining'
                                ? 'text-rose-400'
                                : 'text-amber-300'
                            }`}
                          >
                            {studentTrendDirection === 'Improving' && (
                              <ArrowUpRight className="w-4 h-4 shrink-0" />
                            )}
                            {studentTrendDirection === 'Declining' && (
                              <ArrowDownRight className="w-4 h-4 shrink-0" />
                            )}
                            {studentTrendDirection === 'Maintaining' && (
                              <Minus className="w-4 h-4 shrink-0" />
                            )}
                            <span>{studentTrendDirection}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Graphical Multi-Mock Trend SVG + Series Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white">
                            Multi-Mock Average Score Progression (%)
                          </span>
                          <span className="text-slate-400 tabular-nums">
                            {studentLongitudinal.length} Mock Assessments Recorded
                          </span>
                        </div>
                        <svg viewBox="0 0 480 170" className="w-full h-40 overflow-visible">
                          {[25, 50, 75, 100].map((pct) => {
                            const y = 145 - (pct / 100) * 115;
                            return (
                              <g key={pct}>
                                <line
                                  x1={38}
                                  y1={y}
                                  x2={460}
                                  y2={y}
                                  stroke="#1e293b"
                                  strokeDasharray="3 3"
                                />
                                <text
                                  x={8}
                                  y={y + 3}
                                  fill="#64748b"
                                  fontSize="10"
                                  fontFamily="monospace"
                                >
                                  {pct}%
                                </text>
                              </g>
                            );
                          })}

                          {studentLongitudinal.length > 1 && (
                            <polyline
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2.5"
                              points={studentLongitudinal
                                .map((pt, idx) => {
                                  const x =
                                    65 +
                                    (idx / Math.max(1, studentLongitudinal.length - 1)) * 365;
                                  const y = 145 - (pt.averageScore / 100) * 115;
                                  return `${x},${y}`;
                                })
                                .join(' ')}
                            />
                          )}

                          {studentLongitudinal.map((pt, idx) => {
                            const x =
                              studentLongitudinal.length === 1
                                ? 245
                                : 65 + (idx / (studentLongitudinal.length - 1)) * 365;
                            const y = 145 - (pt.averageScore / 100) * 115;
                            return (
                              <g key={pt.series.id}>
                                <circle
                                  cx={x}
                                  cy={y}
                                  r={5}
                                  fill="#10b981"
                                  stroke="#020617"
                                  strokeWidth="2"
                                />
                                <text
                                  x={x}
                                  y={y - 10}
                                  textAnchor="middle"
                                  fill="#e2e8f0"
                                  fontSize="10"
                                  fontWeight="bold"
                                >
                                  {pt.averageScore}% (Agg {pt.aggregate})
                                </text>
                                <text
                                  x={x}
                                  y={163}
                                  textAnchor="middle"
                                  fill="#94a3b8"
                                  fontSize="10"
                                >
                                  {pt.series.shortLabel}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      {/* Strengths vs Subjects Requiring Attention */}
                      <div className="lg:col-span-5 space-y-3">
                        {(() => {
                          const latestScores =
                            studentLongitudinal[studentLongitudinal.length - 1].scores;
                          const strengths = latestScores.filter((s) => s.totalScore >= 70);
                          const attention = latestScores.filter((s) => s.totalScore < 55);
                          return (
                            <>
                              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                                <div className="text-xs font-semibold text-emerald-400">
                                  Identified Strengths (&ge; 70% / Grades 1–3)
                                </div>
                                {strengths.length > 0 ? (
                                  <ul className="space-y-1 text-xs text-slate-200">
                                    {strengths.map((s) => (
                                      <li key={s.id} className="flex justify-between tabular-nums">
                                        <span>{s.subjectName}</span>
                                        <span className="font-mono text-emerald-400 font-semibold">
                                          {s.totalScore}% (Grade {s.beceGrade})
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-slate-400">
                                    No subject has crossed 70% yet — targeted core drills recommended.
                                  </p>
                                )}
                              </div>

                              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                                <div className="text-xs font-semibold text-rose-400">
                                  Subjects Requiring Additional Attention (&lt; 55%)
                                </div>
                                {attention.length > 0 ? (
                                  <ul className="space-y-1 text-xs text-slate-200">
                                    {attention.map((s) => (
                                      <li key={s.id} className="flex justify-between tabular-nums">
                                        <span>{s.subjectName}</span>
                                        <span className="font-mono text-rose-400 font-semibold">
                                          {s.totalScore}% (Grade {s.beceGrade})
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-slate-400">
                                    All recorded subjects are currently at 55% or above.
                                  </p>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Subject-by-Subject Comparison vs Class Average */}
                    <div className="space-y-3 pt-2">
                      <h3 className="text-sm font-bold text-white">
                        Subject-by-Subject Analysis &amp; Class Comparison (
                        {studentLongitudinal[studentLongitudinal.length - 1].series.shortLabel})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {studentLongitudinal[studentLongitudinal.length - 1].scores.map((sc) => {
                          const latestSerId =
                            studentLongitudinal[studentLongitudinal.length - 1].series.id;
                          const peerScores = beceMockScores.filter(
                            (p) =>
                              p.seriesId === latestSerId &&
                              p.subjectName.toLowerCase() === sc.subjectName.toLowerCase()
                          );
                          const classSubAvg =
                            peerScores.length > 0
                              ? Math.round(
                                  peerScores.reduce((acc, p) => acc + p.totalScore, 0) /
                                    peerScores.length
                                )
                              : sc.totalScore;

                          return (
                            <div
                              key={sc.id}
                              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-white">
                                  {sc.subjectName}{' '}
                                  <span className="text-slate-500 font-normal">
                                    ({sc.subjectCategory})
                                  </span>
                                </span>
                                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                                  {sc.totalScore}% · Grade {sc.beceGrade}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    sc.totalScore >= 70
                                      ? 'bg-emerald-500'
                                      : sc.totalScore >= 55
                                      ? 'bg-amber-400'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, sc.totalScore)}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-400 tabular-nums">
                                <span>
                                  Sec A: {sc.sectionAScore}/40 · Sec B: {sc.sectionBScore}/60
                                </span>
                                <span>Class Avg: {classSubAvg}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              TAB 3: AI LEARNING SUPPORT & BECE READINESS PREDICTION REPORT
             ================================================================= */}
          {activeTab === 'ai-support' && selectedStudent && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 flex-1">
                  <img
                    src={selectedStudent.photo}
                    alt={selectedStudent.firstName}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                  <div className="flex-1 max-w-md">
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                      Select Candidate for Personalised BECE AI Coaching
                    </label>
                    <select
                      value={selectedStudent.id}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
                    >
                      {activeStudents.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.firstName} {st.lastName} ({st.studentNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isGeneratingAi}
                  onClick={handleGenerateBeceAiSupport}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>
                    {isGeneratingAi
                      ? 'Analysing Mock Scores & Generating Plan...'
                      : latestAiReportForStudent
                      ? 'Refresh BECE Readiness & Study Plan'
                      : 'Generate BECE Readiness & Study Plan'}
                  </span>
                </button>
              </div>

              {aiError && (
                <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-200">
                  {aiError}
                </div>
              )}

              {!latestAiReportForStudent ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">
                    Intelligent BECE Academic Support &amp; Readiness Prediction
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
                    Click above to analyse {selectedStudent.firstName}&apos;s mock examination results,
                    continuous assessments, and attendance records—generating subject diagnoses,
                    targeted BECE practice questions, a 6-day revision timetable, and recommended
                    interventions.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Educational Guidance Disclaimer Banner */}
                  <div className="bg-slate-900 border border-amber-700/50 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-200/90">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{latestAiReportForStudent.guidanceDisclaimer}</p>
                  </div>

                  {/* Readiness Prediction Summary Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                      <div>
                        <div className="text-xs text-emerald-400 font-semibold">
                          BECE Readiness &amp; Performance Prediction Report · Generated{' '}
                          {latestAiReportForStudent.generatedAt}
                        </div>
                        <h3 className="text-lg font-bold text-white mt-0.5">
                          {latestAiReportForStudent.readinessLevel}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-slate-400">Advisory BECE Aggregate Band</div>
                        <div className="text-base font-mono font-bold text-emerald-400 tabular-nums">
                          {latestAiReportForStudent.predictedAggregateBand}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-200 leading-relaxed">
                      {latestAiReportForStudent.executiveSummary}
                    </p>
                  </div>

                  {/* Subject-by-Subject Diagnostic Cards */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white">
                      Subject-Specific Difficulty Diagnosis &amp; Revision Priorities
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {latestAiReportForStudent.subjectDiagnoses.map((diag, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-white">{diag.subjectName}</h4>
                            <span
                              className={`text-xs font-mono font-semibold tabular-nums ${
                                diag.status === 'Strength'
                                  ? 'text-emerald-400'
                                  : diag.status === 'Moderate'
                                  ? 'text-amber-300'
                                  : 'text-rose-400'
                              }`}
                            >
                              {diag.latestScore}% · Grade {diag.latestGrade} ({diag.status})
                            </span>
                          </div>

                          <div className="text-xs text-slate-300 space-y-1">
                            <div className="text-slate-400 font-semibold">Areas to Reinforce:</div>
                            <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                              {diag.areasOfDifficulty.map((d, i) => (
                                <li key={i}>{d}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="text-xs text-slate-300 space-y-1">
                            <div className="text-slate-400 font-semibold">Recommended Revision Topics:</div>
                            <p className="text-slate-300">{diag.revisionTopics.join(' · ')}</p>
                          </div>

                          <p className="text-xs text-emerald-300 pt-2 border-t border-slate-800">
                            {diag.targetedAction}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Targeted Practice Questions + Structured Weekly Study Plan */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                        <h3 className="text-sm font-bold text-white">
                          Targeted BECE Practice Questions
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {latestAiReportForStudent.practiceQuestions.map((pq, qIdx) => {
                          const revealed = Boolean(revealedQuestionIndices[qIdx]);
                          return (
                            <div
                              key={qIdx}
                              className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs"
                            >
                              <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
                                <span>
                                  {pq.subjectName} · {pq.topic}
                                </span>
                                <span className="text-slate-400">{pq.questionType}</span>
                              </div>
                              <p className="text-slate-200 leading-relaxed font-medium">
                                {pq.question}
                              </p>
                              {Array.isArray(pq.options) && pq.options.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-300">
                                  {pq.options.map((opt, oIdx) => (
                                    <div
                                      key={oIdx}
                                      className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800"
                                    >
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevealedQuestionIndices((prev) => ({
                                      ...prev,
                                      [qIdx]: !revealed,
                                    }))
                                  }
                                  className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 cursor-pointer"
                                >
                                  {revealed ? 'Hide Marking Scheme' : 'Show Answer & Marking Scheme'}
                                </button>
                                {revealed && (
                                  <div className="mt-2 p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-[11px]">
                                    <div className="font-semibold text-emerald-300">
                                      Answer: {pq.correctAnswer}
                                    </div>
                                    <div className="text-slate-400">{pq.markingScheme}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="lg:col-span-6 space-y-6">
                      {/* 6-Day Study Plan */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <h3 className="text-sm font-bold text-white">
                          Structured 6-Day Weekly BECE Revision Plan
                        </h3>
                        <div className="divide-y divide-slate-800 text-xs">
                          {latestAiReportForStudent.weeklyStudyPlan.map((slot, sIdx) => (
                            <div key={sIdx} className="py-2.5 flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-white">
                                  {slot.day} ·{' '}
                                  <span className="text-emerald-400">{slot.focusSubject}</span>
                                </div>
                                <div className="text-slate-400 text-[11px] mt-0.5">
                                  {slot.topics} — {slot.activity}
                                </div>
                              </div>
                              <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
                                {slot.durationMinutes} mins
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommended Interventions Action List */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                        <h3 className="text-sm font-bold text-white">
                          Recommended Practical Academic Interventions
                        </h3>
                        <div className="space-y-2.5">
                          {latestAiReportForStudent.recommendedInterventions.map((rec, rIdx) => {
                            const toastKey = `${selectedStudent.id}_${rIdx}`;
                            const latestSer = sortedSeries[sortedSeries.length - 1];
                            const subScore = latestSer
                              ? beceMockScores.find(
                                  (sc) =>
                                    sc.seriesId === latestSer.id &&
                                    sc.studentId === selectedStudent.id &&
                                    sc.subjectName.toLowerCase() === rec.subjectName.toLowerCase()
                                )
                              : undefined;
                            return (
                              <div
                                key={rIdx}
                                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                              >
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-white">
                                    {rec.interventionType} ·{' '}
                                    <span className="text-emerald-400">{rec.subjectName}</span>
                                  </div>
                                  <p className="text-slate-400 text-[11px]">{rec.rationale}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    assignBeceIntervention({
                                      studentId: selectedStudent.id,
                                      studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
                                      subjectName: rec.subjectName,
                                      interventionType: rec.interventionType,
                                      focusTopics: rec.rationale,
                                      scheduleSummary: 'Weekly Supervised BECE Clinic',
                                      assignedBy: currentUser.name,
                                      status: 'In Progress',
                                      baselineSeriesId: latestSer?.id,
                                      baselineScore: subScore?.totalScore ?? 50,
                                    });
                                    setAssignedToastKey(toastKey);
                                    setTimeout(() => setAssignedToastKey(null), 2000);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
                                >
                                  {assignedToastKey === toastKey ? '✓ Assigned' : 'Assign Intervention'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              TAB 4: ACADEMIC INTERVENTIONS & DECLINING PERFORMANCE ALERTS
             ================================================================= */}
          {activeTab === 'interventions' && (
            <div className="space-y-6">
              {/* Automated Declining Performance Alerts */}
              {decliningAlerts.length > 0 && (
                <div className="bg-slate-900 border border-rose-800/60 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-rose-400">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        Early-Warning Academic Decline Alerts ({decliningAlerts.length})
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      Triggered automatically when Best-6 Aggregate or subject scores drop across mocks
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {decliningAlerts.map((al) => (
                      <div
                        key={al.student.id}
                        className="p-4 rounded-xl bg-slate-950 border border-rose-900/50 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-white">
                            {al.student.firstName} {al.student.lastName}{' '}
                            <span className="font-mono text-slate-400 font-normal">
                              ({al.student.studentNumber})
                            </span>
                          </div>
                          <span className="font-mono text-rose-400 font-semibold tabular-nums">
                            Agg {al.prevAggregate} &rarr; Agg {al.currAggregate}
                          </span>
                        </div>

                        <p className="text-slate-400 text-[11px]">
                          {al.prevSeriesLabel} ({al.prevAvg}%) to {al.currSeriesLabel} ({al.currAvg}%).
                          {al.droppedSubjects.length > 0 &&
                            ` Subject drops: ${al.droppedSubjects
                              .map((d) => `${d.subjectName} (${d.delta}%)`)
                              .join(', ')}.`}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              sendAnnouncement({
                                title: `BECE Academic Support Notice — ${al.student.firstName} ${al.student.lastName}`,
                                content: `Dear ${al.student.guardianName || 'Parent/Guardian'}, mock performance tracking between ${al.prevSeriesLabel} and ${al.currSeriesLabel} indicates that ${al.student.firstName} requires targeted revision support (Aggregate ${al.prevAggregate} to ${al.currAggregate}). Please schedule a brief consultation with the JHS Academic Coordinator.`,
                                targetAudience: 'Parents',
                                channel: 'In-App',
                                author: currentUser.name,
                              });
                              setAlertSentStudentId(al.student.id);
                              setTimeout(() => setAlertSentStudentId(null), 2400);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
                          >
                            <Send className="w-3 h-3 shrink-0" />
                            <span>
                              {alertSentStudentId === al.student.id
                                ? 'Parent & Teacher Alert Sent'
                                : 'Notify Parent & Subject Teacher'}
                            </span>
                          </button>

                          {al.student.guardianPhone && (
                            <a
                              href={buildWhatsAppUrl(
                                al.student.guardianPhone,
                                `Hello ${al.student.guardianName || 'Parent/Guardian'}, this is ${school.name}. Following ${al.currSeriesLabel}, we have arranged extra BECE support for ${al.student.firstName} ${al.student.lastName}. Let us coordinate their home revision timetable.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-semibold transition whitespace-nowrap"
                            >
                              <span>WhatsApp Guardian</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Intervention Header + Assign Button */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Academic Intervention &amp; Mock Impact Register
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Monitor remedial classes, extra lessons, peer tutoring, and past-question clinics—and measure score gains in subsequent mock series.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIntStudentId(effectiveStudentId);
                    setShowInterventionModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Assign Intervention</span>
                </button>
              </div>

              {/* Interventions Table */}
              {beceInterventions.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-slate-500 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No Interventions Assigned Yet</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Assign remedial classes, peer tutoring, or structured revision timetables above—or directly from a candidate&apos;s AI Readiness Report.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                          <th className="py-3 px-4">Candidate &amp; Subject</th>
                          <th className="py-3 px-4">Intervention &amp; Schedule</th>
                          <th className="py-3 px-4">Baseline Score</th>
                          <th className="py-3 px-4">Follow-Up Score &amp; Impact</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200">
                        {beceInterventions.map((intItem) => {
                          // Automatically check latest mock score in same subject if followUpScore not manually set
                          const latestSer = sortedSeries[sortedSeries.length - 1];
                          const autoLatestScore =
                            latestSer && latestSer.id !== intItem.baselineSeriesId
                              ? beceMockScores.find(
                                  (sc) =>
                                    sc.seriesId === latestSer.id &&
                                    sc.studentId === intItem.studentId &&
                                    sc.subjectName.toLowerCase() ===
                                      intItem.subjectName.toLowerCase()
                                )?.totalScore
                              : undefined;

                          const effectiveFollowUp =
                            intItem.followUpScore ?? autoLatestScore;
                          const delta =
                            effectiveFollowUp !== undefined
                              ? effectiveFollowUp - intItem.baselineScore
                              : null;

                          return (
                            <tr key={intItem.id} className="hover:bg-slate-800/30">
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-white">
                                  {intItem.studentName}
                                </div>
                                <div className="text-[11px] text-emerald-400">
                                  {intItem.subjectName}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="font-semibold text-slate-200">
                                  {intItem.interventionType}
                                </div>
                                <div className="text-[11px] text-slate-400 line-clamp-2">
                                  {intItem.focusTopics}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {intItem.scheduleSummary}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-mono tabular-nums">
                                {intItem.baselineScore}%
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={effectiveFollowUp ?? ''}
                                    placeholder="Next mock %"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      updateBeceIntervention(intItem.id, {
                                        followUpScore:
                                          val === ''
                                            ? undefined
                                            : Math.min(100, Math.max(0, Number(val))),
                                      });
                                    }}
                                    className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                                  />
                                  {delta !== null && (
                                    <span
                                      className={`font-mono font-bold tabular-nums ${
                                        delta > 0
                                          ? 'text-emerald-400'
                                          : delta < 0
                                          ? 'text-rose-400'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {delta > 0 ? `+${delta}%` : `${delta}%`}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <select
                                  value={intItem.status}
                                  onChange={(e) =>
                                    updateBeceIntervention(intItem.id, {
                                      status: e.target.value as any,
                                    })
                                  }
                                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                                >
                                  <option value="Recommended">Recommended</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                </select>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                {confirmDeleteIntId === intItem.id ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setConfirmDeleteIntId(null);
                                        deleteBeceIntervention(intItem.id);
                                      }}
                                      className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer whitespace-nowrap"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteIntId(null)}
                                      className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] cursor-pointer whitespace-nowrap"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteIntId(intItem.id)}
                                    className="text-slate-500 hover:text-rose-400 transition cursor-pointer"
                                    title="Remove Intervention"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
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
        </>
      )}

      {/* CREATE MOCK SERIES MODAL */}
      {showCreateSeriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Create BECE Mock Examination / Test</h3>
              <button
                type="button"
                onClick={() => setShowCreateSeriesModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSeriesSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Assessment Title *
                </label>
                <input
                  type="text"
                  required
                  value={seriesTitle}
                  onChange={(e) => setSeriesTitle(e.target.value)}
                  placeholder="e.g. BECE Mock 1 — Diagnostic Baseline Examination"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Short Chart Label
                  </label>
                  <input
                    type="text"
                    value={seriesShortLabel}
                    onChange={(e) => setSeriesShortLabel(e.target.value)}
                    placeholder={`e.g. Mock ${sortedSeries.length + 1}`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Date Conducted
                  </label>
                  <input
                    type="date"
                    value={seriesDate}
                    onChange={(e) => setSeriesDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={seriesCategory}
                    onChange={(e) => setSeriesCategory(e.target.value as BeceAssessmentCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="BECE Mock Series">BECE Mock Series</option>
                    <option value="Revision Test">Revision Test</option>
                    <option value="Subject Trial Assessment">Subject Trial Assessment</option>
                    <option value="Pre-BECE Final Mock">Pre-BECE Final Mock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Class</label>
                  <select
                    value={seriesTargetClassId}
                    onChange={(e) => setSeriesTargetClassId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">All JHS / Basic Candidates</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Examiner Instructions / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={seriesNotes}
                  onChange={(e) => setSeriesNotes(e.target.value)}
                  placeholder="Optional invigilation or syllabus coverage note..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateSeriesModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer whitespace-nowrap"
                >
                  Create Assessment Series
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN INTERVENTION MODAL */}
      {showInterventionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Assign BECE Academic Intervention</h3>
              <button
                type="button"
                onClick={() => setShowInterventionModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInterventionSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Candidate *</label>
                <select
                  value={intStudentId || effectiveStudentId}
                  onChange={(e) => setIntStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {activeStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.firstName} {st.lastName} ({st.studentNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Subject *</label>
                  <select
                    value={intSubjectName}
                    onChange={(e) => setIntSubjectName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {availableSubjects.map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Intervention Type *
                  </label>
                  <select
                    value={intType}
                    onChange={(e) => setIntType(e.target.value as BeceInterventionType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {INTERVENTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Target Topics &amp; Remedial Focus *
                </label>
                <textarea
                  rows={2}
                  required
                  value={intTopics}
                  onChange={(e) => setIntTopics(e.target.value)}
                  placeholder="e.g. Linear equations, Venn diagrams, and timed Section B worked problems"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Meeting / Revision Schedule
                </label>
                <input
                  type="text"
                  value={intSchedule}
                  onChange={(e) => setIntSchedule(e.target.value)}
                  placeholder="e.g. Tuesdays & Thursdays · 3:15 PM – 4:15 PM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInterventionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer whitespace-nowrap"
                >
                  Save &amp; Track Intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
