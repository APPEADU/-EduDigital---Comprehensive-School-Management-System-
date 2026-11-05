import React, { useState, useEffect, useRef } from 'react';
import {
  ProfessionalProgramme,
  ProgrammeCourse,
  INSTITUTE_CERTIFICATE_LEVEL,
  formatInstituteLevelShort,
} from '../../types';
import { makeCourseFlyerSvg } from '../../data/professionalSeeds';
import {
  X,
  Upload,
  FileSpreadsheet,
  Image as ImageIcon,
  Plus,
  Trash2,
  Check,
  Download,
  RefreshCw,
} from 'lucide-react';

interface CourseUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutionName: string;
  programmes: ProfessionalProgramme[];
  defaultProgrammeId: string;
  defaultLevelNumber: number;
  defaultLecturerName: string;
  editingCourse?: ProgrammeCourse | null;
  onSaveCourse: (
    courseData: Omit<ProgrammeCourse, 'id' | 'schoolId'>,
    existingId?: string
  ) => void;
  onBulkImportCourses?: (courses: Omit<ProgrammeCourse, 'id' | 'schoolId'>[]) => void;
}

const compressFlyerImageToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.onload = () => {
      const rawUrl = String(reader.result || '');
      if (file.type === 'image/svg+xml' && rawUrl.length <= 220000) {
        resolve(rawUrl);
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format. Please choose a PNG, JPG, or WebP flyer.'));
      img.onload = () => {
        const maxDim = 760;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Browser canvas unavailable.'));
          return;
        }
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let compressed = canvas.toDataURL('image/jpeg', 0.8);
        if (compressed.length > 220000) {
          compressed = canvas.toDataURL('image/jpeg', 0.62);
        }
        if (compressed.length > 240000) {
          const smallCanvas = document.createElement('canvas');
          smallCanvas.width = Math.round(width * 0.72);
          smallCanvas.height = Math.round(height * 0.72);
          const sctx = smallCanvas.getContext('2d');
          if (sctx) {
            sctx.fillStyle = '#0f172a';
            sctx.fillRect(0, 0, smallCanvas.width, smallCanvas.height);
            sctx.drawImage(img, 0, 0, smallCanvas.width, smallCanvas.height);
            compressed = smallCanvas.toDataURL('image/jpeg', 0.58);
          }
        }
        resolve(compressed);
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  });
};

export const CourseUploadModal: React.FC<CourseUploadModalProps> = ({
  isOpen,
  onClose,
  institutionName,
  programmes,
  defaultProgrammeId,
  defaultLevelNumber,
  defaultLecturerName,
  editingCourse,
  onSaveCourse,
  onBulkImportCourses,
}) => {
  const [mode, setMode] = useState<'single' | 'csv'>('single');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  const [programmeId, setProgrammeId] = useState(defaultProgrammeId);
  const [levelNumber, setLevelNumber] = useState<number>(defaultLevelNumber);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [creditHours, setCreditHours] = useState(15);
  const [lecturerName, setLecturerName] = useState(defaultLecturerName);
  const [semesterOrDiet, setSemesterOrDiet] = useState('June 2026 Diet');
  const [examScheduleDate, setExamScheduleDate] = useState('2026-06-18');
  const [caWeightPercent, setCaWeightPercent] = useState(30);
  const [practicalWeightPercent, setPracticalWeightPercent] = useState(10);
  const [examWeightPercent, setExamWeightPercent] = useState(60);
  const [isMandatory, setIsMandatory] = useState(true);

  const [courseDetails, setCourseDetails] = useState('');
  const [rationale, setRationale] = useState('');
  const [objectives, setObjectives] = useState<string[]>([
    'Apply core statutory, analytical, and professional principles to real-world cases.',
    'Prepare structured reports and practical deliverables for examination assessment.',
  ]);
  const [newObjectiveText, setNewObjectiveText] = useState('');
  const [flyerDataUrl, setFlyerDataUrl] = useState('');
  const [flyerUrlInput, setFlyerUrlInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadingFlyer, setUploadingFlyer] = useState(false);

  // CSV bulk upload state
  const [csvText, setCsvText] = useState('');
  const [parsedCsvCourses, setParsedCsvCourses] = useState<Omit<ProgrammeCourse, 'id' | 'schoolId'>[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setMode('single');
    if (editingCourse) {
      setProgrammeId(editingCourse.programmeId);
      setLevelNumber(editingCourse.levelNumber);
      setCode(editingCourse.code);
      setTitle(editingCourse.title);
      setCreditHours(editingCourse.creditHours);
      setLecturerName(editingCourse.lecturerName);
      setSemesterOrDiet(editingCourse.semesterOrDiet);
      setExamScheduleDate(editingCourse.examScheduleDate || '2026-06-18');
      setCaWeightPercent(editingCourse.caWeightPercent);
      setPracticalWeightPercent(editingCourse.practicalWeightPercent);
      setExamWeightPercent(editingCourse.examWeightPercent);
      setIsMandatory(editingCourse.isMandatory);
      setCourseDetails(editingCourse.courseDetails || '');
      setRationale(editingCourse.rationale || '');
      setObjectives(
        editingCourse.objectives && editingCourse.objectives.length > 0
          ? editingCourse.objectives
          : ['Master core learning outcomes and examination competencies for this module.']
      );
      setFlyerDataUrl(editingCourse.flyerDataUrl || '');
      setFlyerUrlInput(
        editingCourse.flyerDataUrl && editingCourse.flyerDataUrl.startsWith('http')
          ? editingCourse.flyerDataUrl
          : ''
      );
    } else {
      setProgrammeId(defaultProgrammeId || programmes[0]?.id || '');
      setLevelNumber(defaultLevelNumber || 1);
      setCode('');
      setTitle('');
      setCreditHours(15);
      setLecturerName(defaultLecturerName);
      setSemesterOrDiet('June 2026 Diet');
      setExamScheduleDate('2026-06-18');
      setCaWeightPercent(30);
      setPracticalWeightPercent(10);
      setExamWeightPercent(60);
      setIsMandatory(true);
      setCourseDetails('');
      setRationale('');
      setObjectives([
        'Understand and apply the core theoretical and practical frameworks of the course.',
        'Analyze real-world institutional case studies and formulate compliant solutions.',
      ]);
      setFlyerDataUrl('');
      setFlyerUrlInput('');
    }
  }, [isOpen, editingCourse, defaultProgrammeId, defaultLevelNumber, defaultLecturerName, programmes]);

  if (!isOpen) return null;

  const selectedProg = programmes.find((p) => p.id === programmeId) || programmes[0];

  // Ensure Level 1, 2, 3, and Certificate (4) are always selectable for an institute
  const availableLevelOptions = [
    { levelNumber: 1, label: 'Level 1 (Foundation)' },
    { levelNumber: 2, label: 'Level 2 (Intermediate)' },
    { levelNumber: 3, label: 'Level 3 (Advanced / Final)' },
    { levelNumber: INSTITUTE_CERTIFICATE_LEVEL, label: 'Certificate (Non-Chartered Programme)' },
  ];

  const handleFlyerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setUploadingFlyer(true);
    try {
      const compressed = await compressFlyerImageToDataUrl(file);
      setFlyerDataUrl(compressed);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to process flyer image.');
    } finally {
      setUploadingFlyer(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerateBrandedFlyer = () => {
    const cleanCode = code.trim().toUpperCase() || 'CRS-101';
    const cleanTitle = title.trim() || 'Professional & Executive Course Module';
    const levelLabel = formatInstituteLevelShort(levelNumber);
    const accentPalette: Record<number, string> = {
      1: '#10b981',
      2: '#0ea5e9',
      3: '#f59e0b',
      4: '#a855f7',
    };
    const svgUrl = makeCourseFlyerSvg({
      institutionName,
      courseCode: cleanCode,
      courseTitle: cleanTitle,
      levelLabel,
      dietLabel: semesterOrDiet.trim() || '2026 Academic Diet',
      creditHours: Number(creditHours) || 15,
      lecturerName: lecturerName.trim() || defaultLecturerName,
      accentHex: accentPalette[levelNumber] || '#10b981',
    });
    setFlyerDataUrl(svgUrl);
  };

  const handleAddObjective = () => {
    const clean = newObjectiveText.trim();
    if (!clean) return;
    if (objectives.length >= 15) {
      setErrorMsg('Maximum of 15 course objectives reached.');
      return;
    }
    setObjectives([...objectives, clean]);
    setNewObjectiveText('');
  };

  const handleRemoveObjective = (idx: number) => {
    setObjectives(objectives.filter((_, i) => i !== idx));
  };

  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programmeId) {
      setErrorMsg('Please select a target programme.');
      return;
    }
    if (!code.trim() || !title.trim()) {
      setErrorMsg('Please enter both the Course Code and Course Title.');
      return;
    }
    const cleanObjectives = objectives
      .map((o) => o.trim())
      .filter((o) => o.length > 0)
      .slice(0, 20);

    onSaveCourse(
      {
        programmeId,
        levelNumber,
        levelLabel: formatInstituteLevelShort(levelNumber),
        code: code.trim().toUpperCase(),
        title: title.trim(),
        creditHours: Number(creditHours) || 15,
        lecturerName: lecturerName.trim() || defaultLecturerName,
        caWeightPercent: Number(caWeightPercent) || 0,
        practicalWeightPercent: Number(practicalWeightPercent) || 0,
        examWeightPercent: Number(examWeightPercent) || 0,
        isMandatory,
        examScheduleDate: examScheduleDate.trim(),
        semesterOrDiet: semesterOrDiet.trim() || 'Academic Diet',
        courseDetails: courseDetails.trim(),
        rationale: rationale.trim(),
        objectives: cleanObjectives,
        flyerDataUrl: flyerDataUrl.trim(),
      },
      editingCourse?.id
    );
    onClose();
  };

  const parseCsvInput = (raw: string) => {
    setCsvText(raw);
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length <= 1) {
      setParsedCsvCourses([]);
      return;
    }

    const rows: Omit<ProgrammeCourse, 'id' | 'schoolId'>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]
        .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        .map((c) => c.replace(/^"|"$/g, '').trim());
      if (cols.length < 3) continue;
      const rawLevel = cols[0].toLowerCase();
      const lvlNum =
        rawLevel.includes('cert') || rawLevel === '4'
          ? INSTITUTE_CERTIFICATE_LEVEL
          : Math.min(3, Math.max(1, parseInt(rawLevel.replace(/\D/g, ''), 10) || 1));
      const crsCode = (cols[1] || `CRS-${100 + i}`).toUpperCase();
      const crsTitle = cols[2] || 'Uploaded Institute Course';
      const crsCredits = parseInt(cols[3] || '15', 10) || 15;
      const crsLecturer = cols[4] || defaultLecturerName;
      const crsRationale = cols[5] || '';
      const crsDetails = cols[6] || '';
      const crsObjectives = (cols[7] || '')
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);

      rows.push({
        programmeId: programmeId || programmes[0]?.id || '',
        levelNumber: lvlNum,
        levelLabel: formatInstituteLevelShort(lvlNum),
        code: crsCode,
        title: crsTitle,
        creditHours: crsCredits,
        lecturerName: crsLecturer,
        caWeightPercent: 30,
        practicalWeightPercent: 10,
        examWeightPercent: 60,
        isMandatory: true,
        examScheduleDate: '2026-06-18',
        semesterOrDiet: semesterOrDiet || 'June 2026 Diet',
        rationale: crsRationale,
        courseDetails: crsDetails,
        objectives: crsObjectives,
        flyerDataUrl: makeCourseFlyerSvg({
          institutionName,
          courseCode: crsCode,
          courseTitle: crsTitle,
          levelLabel: formatInstituteLevelShort(lvlNum),
          dietLabel: semesterOrDiet || 'June 2026 Diet',
          creditHours: crsCredits,
          lecturerName: crsLecturer,
          accentHex: lvlNum === 4 ? '#a855f7' : '#10b981',
        }),
      });
    }
    setParsedCsvCourses(rows);
  };

  const handleDownloadCsvTemplate = () => {
    const sample = [
      'Level,Code,Title,Credits,Lecturer,Rationale,CourseDetails,Objectives (semicolon separated)',
      '"Level 1","TXF-106","Indirect Taxation & Customs Practice",15,"Dr. Efua Mensimah Arthur","Equips candidates with ECOWAS customs valuation and VAT audit competencies.","Covers VAT Act 870, customs tariff classification, excise duties, and port clearance audits.","Compute VAT liabilities accurately;Apply ECOWAS Common External Tariff rules;Prepare customs audit working papers"',
      '"Certificate","CERT-405","Certificate in Payroll & Tax Filing Compliance",12,"Mr. Senyo Quashigah","Provides a standalone non-chartered practical qualification for payroll officers.","Hands-on PAYE, SSNIT Tier 1 & 2, and GRA Taxpayers Portal monthly filing labs.","File monthly PAYE and SSNIT schedules;Reconcile annual employer tax returns"',
    ].join('\n');
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'institute_courses_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 text-white shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <p className="text-xs text-slate-400">
              {institutionName} · {selectedProg ? selectedProg.code : 'Institute Curriculum'}
            </p>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {editingCourse
                ? `Edit Course Syllabus & Flyer — ${editingCourse.code}`
                : 'Upload Institute Course, Rationale, Objectives & Flyer'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher (when creating new) */}
        {!editingCourse && onBulkImportCourses && (
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl w-fit text-xs">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                mode === 'single' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Single Course &amp; Flyer Upload
            </button>
            <button
              type="button"
              onClick={() => setMode('csv')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                mode === 'csv' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk CSV Course Upload</span>
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
            {errorMsg}
          </div>
        )}

        {mode === 'single' ? (
          <form onSubmit={handleSubmitSingle} className="space-y-5 text-xs">
            {/* Core Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Programme *</label>
                <select
                  value={programmeId}
                  onChange={(e) => setProgrammeId(e.target.value)}
                  disabled={Boolean(editingCourse)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white disabled:opacity-60"
                >
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">
                  Programme Level (Level 1, 2, 3, or Certificate) *
                </label>
                <select
                  value={levelNumber}
                  onChange={(e) => setLevelNumber(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-semibold"
                >
                  {availableLevelOptions.map((opt) => (
                    <option key={opt.levelNumber} value={opt.levelNumber}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Course Code *</label>
                <input
                  type="text"
                  required
                  placeholder={levelNumber === INSTITUTE_CERTIFICATE_LEVEL ? 'CERT-402' : 'TXF-104'}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-300 font-semibold mb-1">Course / Module Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Digital Tax Administration, E-VAT & Revenue Compliance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assigned Lecturer</label>
                <input
                  type="text"
                  required
                  value={lecturerName}
                  onChange={(e) => setLecturerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Credit Hours</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={creditHours}
                  onChange={(e) => setCreditHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Semester / Exam Diet</label>
                <input
                  type="text"
                  value={semesterOrDiet}
                  onChange={(e) => setSemesterOrDiet(e.target.value)}
                  placeholder="June 2026 Diet"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Scheduled Exam Date</label>
                <input
                  type="date"
                  value={examScheduleDate}
                  onChange={(e) => setExamScheduleDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums"
                />
              </div>
            </div>

            {/* Assessment Weightings + Mandatory */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1">CA Weight (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={caWeightPercent}
                  onChange={(e) => setCaWeightPercent(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Practical Weight (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={practicalWeightPercent}
                  onChange={(e) => setPracticalWeightPercent(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Final Exam Weight (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={examWeightPercent}
                  onChange={(e) => setExamWeightPercent(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono tabular-nums"
                />
              </div>
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                    className="rounded border-slate-700"
                  />
                  <span className="font-semibold">Mandatory Core Paper</span>
                </label>
              </div>
            </div>

            {/* Course Details & Course Rationale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
              <div>
                <label className="block text-slate-200 font-semibold mb-1">
                  Course Details &amp; Syllabus Scope
                </label>
                <textarea
                  rows={4}
                  value={courseDetails}
                  onChange={(e) => setCourseDetails(e.target.value)}
                  placeholder="Describe the syllabus units, statutory frameworks, practical laboratories, and delivery format..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-semibold mb-1">
                  Course Rationale (Purpose &amp; Industry Relevance)
                </label>
                <textarea
                  rows={4}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Explain why this course is offered, the professional competency gap it addresses, and how it prepares candidates..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white leading-relaxed"
                />
              </div>
            </div>

            {/* Course Objectives */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-slate-200 font-semibold">
                  Course Learning Objectives ({objectives.length})
                </label>
                <span className="text-[11px] text-slate-400">
                  Displayed on candidate syllabi and course promotional flyers
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newObjectiveText}
                  onChange={(e) => setNewObjectiveText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddObjective();
                    }
                  }}
                  placeholder="Type a learning objective and click Add Objective..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
                <button
                  type="button"
                  onClick={handleAddObjective}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-lg font-semibold cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Objective</span>
                </button>
              </div>

              {objectives.length > 0 && (
                <div className="divide-y divide-slate-800/80 bg-slate-950 border border-slate-800 rounded-xl px-3.5">
                  {objectives.map((obj, idx) => (
                    <div key={idx} className="py-2 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <input
                          type="text"
                          value={obj}
                          onChange={(e) => {
                            const next = [...objectives];
                            next[idx] = e.target.value;
                            setObjectives(next);
                          }}
                          className="bg-transparent text-slate-200 w-full focus:outline-none focus:text-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveObjective(idx)}
                        className="text-slate-500 hover:text-rose-400 cursor-pointer shrink-0"
                        title="Remove Objective"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Course Flyer Upload & Preview */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-6 space-y-3">
                <div>
                  <label className="block text-slate-200 font-semibold mb-1">
                    Course Promotional / Admission Flyer
                  </label>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Upload an official course flyer image (PNG, JPG, WebP) from your computer, paste a hosted flyer URL, or generate a clean branded flyer from the course details above.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFlyerFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFlyer}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingFlyer ? 'Optimising Flyer...' : 'Upload Flyer Image'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateBrandedFlyer}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg font-semibold cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Generate Branded Flyer</span>
                  </button>

                  {flyerDataUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setFlyerDataUrl('');
                        setFlyerUrlInput('');
                      }}
                      className="px-3 py-2 bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 rounded-lg cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">Or Paste Hosted Flyer Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={flyerUrlInput}
                      onChange={(e) => setFlyerUrlInput(e.target.value)}
                      placeholder="https://example.org/flyers/course-flyer.jpg"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (flyerUrlInput.trim()) setFlyerDataUrl(flyerUrlInput.trim());
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold cursor-pointer"
                    >
                      Apply URL
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                {flyerDataUrl ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-2">
                    <img
                      src={flyerDataUrl}
                      alt={`${code || 'Course'} Flyer Preview`}
                      className="w-full max-h-56 object-contain rounded-lg bg-slate-900"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span>Flyer attached &amp; cloud-ready</span>
                      <span className="text-emerald-400 font-semibold">Ready to Publish</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 bg-slate-950 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                    <ImageIcon className="w-7 h-7 mb-2 text-slate-600" />
                    <p className="text-xs font-medium text-slate-400">No Course Flyer Uploaded Yet</p>
                    <p className="text-[11px] mt-0.5">
                      Upload a flyer artwork or click "Generate Branded Flyer"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingCourse ? 'Save Course & Flyer Updates' : 'Publish Course & Flyer'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* BULK CSV UPLOAD MODE */
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-semibold text-white">Bulk Upload Courses via CSV Spreadsheet</p>
                <p className="text-slate-400 mt-0.5">
                  Supports Level 1, Level 2, Level 3, and Certificate courses with Rationale, Course Details, and Objectives.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg font-semibold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download CSV Template</span>
                </button>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => parseCsvInput(String(reader.result || ''));
                    reader.readAsText(f);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => csvInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select CSV File</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Programme for Imported Courses</label>
              <select
                value={programmeId}
                onChange={(e) => setProgrammeId(e.target.value)}
                className="w-full sm:w-96 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              >
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Or Paste CSV Rows Directly
              </label>
              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => parseCsvInput(e.target.value)}
                placeholder={'Level,Code,Title,Credits,Lecturer,Rationale,CourseDetails,Objectives\n"Certificate","CERT-405","Certificate in Payroll Compliance",12,"Mr. Senyo Quashigah","Standalone practical certificate","Covers PAYE & SSNIT filing","File monthly PAYE;Reconcile annual returns"'}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-[11px]"
              />
            </div>

            {parsedCsvCourses.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <p className="font-semibold text-emerald-400">
                  Ready to Import {parsedCsvCourses.length} Course(s):
                </p>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-800">
                  {parsedCsvCourses.map((c, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-emerald-300 font-semibold">{c.code}</span>
                        <span className="mx-1.5 text-slate-600">·</span>
                        <span className="text-white font-medium">{c.title}</span>
                      </div>
                      <span className="text-slate-400 shrink-0">
                        {c.levelLabel} · {c.creditHours} Cr · {c.objectives?.length || 0} Objectives
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={parsedCsvCourses.length === 0}
                onClick={() => {
                  if (onBulkImportCourses && parsedCsvCourses.length > 0) {
                    onBulkImportCourses(
                      parsedCsvCourses.map((c) => ({ ...c, programmeId: programmeId || c.programmeId }))
                    );
                    onClose();
                  }
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50"
              >
                Import {parsedCsvCourses.length} Course(s)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
