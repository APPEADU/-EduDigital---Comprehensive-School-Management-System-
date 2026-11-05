import React from 'react';
import { ProgrammeCourse, formatInstituteLevelShort } from '../../types';
import { X, Download, Edit3, CheckCircle2, BookOpen, Calendar, User } from 'lucide-react';

interface CourseDetailFlyerModalProps {
  course: ProgrammeCourse | null;
  programmeTitle?: string;
  institutionName?: string;
  onClose: () => void;
  onEditCourse?: (course: ProgrammeCourse) => void;
}

export const CourseDetailFlyerModal: React.FC<CourseDetailFlyerModalProps> = ({
  course,
  programmeTitle,
  institutionName,
  onClose,
  onEditCourse,
}) => {
  if (!course) return null;

  const levelDisplay = course.levelLabel || formatInstituteLevelShort(course.levelNumber);

  const handleDownloadFlyer = () => {
    if (!course.flyerDataUrl) return;
    const a = document.createElement('a');
    a.href = course.flyerDataUrl;
    const ext = course.flyerDataUrl.startsWith('data:image/svg') ? 'svg' : 'jpg';
    a.download = `${course.code.toLowerCase()}_course_flyer.${ext}`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 text-white shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-mono text-emerald-400 font-bold">{course.code}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-200">{levelDisplay}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{course.creditHours} Credit Hours</span>
              <span aria-hidden="true">·</span>
              <span>{course.isMandatory ? 'Mandatory Module' : 'Elective Module'}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-1">{course.title}</h3>
            {(programmeTitle || institutionName) && (
              <p className="text-xs text-slate-400 mt-0.5">
                {programmeTitle}
                {institutionName ? ` · ${institutionName}` : ''}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Course Flyer Showcase */}
        {course.flyerDataUrl && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-semibold text-slate-200">Official Course Flyer</span>
              <button
                type="button"
                onClick={handleDownloadFlyer}
                className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Flyer</span>
              </button>
            </div>
            <img
              src={course.flyerDataUrl}
              alt={`${course.code} Flyer`}
              className="w-full max-h-80 object-contain rounded-lg bg-slate-900"
            />
          </div>
        )}

        {/* Faculty, Diet & Weighting Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950 border border-slate-800 rounded-xl p-4 tabular-nums">
          <div>
            <span className="text-slate-400 flex items-center gap-1.5 mb-0.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Course Lecturer</span>
            </span>
            <p className="font-semibold text-white">{course.lecturerName}</p>
          </div>
          <div>
            <span className="text-slate-400 flex items-center gap-1.5 mb-0.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Diet &amp; Exam Schedule</span>
            </span>
            <p className="font-semibold text-white">
              {course.semesterOrDiet}
              {course.examScheduleDate ? ` · ${course.examScheduleDate}` : ''}
            </p>
          </div>
          <div>
            <span className="text-slate-400 flex items-center gap-1.5 mb-0.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Assessment Weighting</span>
            </span>
            <p className="font-semibold text-white font-mono">
              CA {course.caWeightPercent}% · Prac {course.practicalWeightPercent}% · Exam {course.examWeightPercent}%
            </p>
          </div>
        </div>

        {/* Course Rationale & Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-white">Course Rationale</h4>
            <p className="text-slate-300 leading-relaxed">
              {course.rationale ||
                'Designed to build verifiable professional and applied analytical mastery aligned with institutional accreditation standards.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-white">Course Details &amp; Syllabus</h4>
            <p className="text-slate-300 leading-relaxed">
              {course.courseDetails ||
                'Comprehensive coverage of core statutory principles, applied case methodology, and structured examination preparation.'}
            </p>
          </div>
        </div>

        {/* Course Objectives */}
        {course.objectives && course.objectives.length > 0 && (
          <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs">
            <h4 className="text-sm font-bold text-white">Course Learning Objectives</h4>
            <ul className="space-y-2">
              {course.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-slate-200 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-400">
            {levelDisplay === 'Certificate'
              ? 'Standalone Non-Chartered Certificate Programme Module'
              : `${levelDisplay} Progressive Qualification Module`}
          </span>
          <div className="flex items-center gap-2">
            {onEditCourse && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditCourse(course);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-lg font-semibold cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Course &amp; Flyer</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
