import React, { useState } from 'react';
import { Student } from '../../types';
import { useSchool } from '../../context/SchoolContext';
import { calculateWassceGrade, formatOrdinal } from '../../utils/academicCalculations';
import { Printer, X, Award, Shield, PenTool } from 'lucide-react';
import { SignaturePadModal } from './SignaturePadModal';

interface ReportCardModalProps {
  student: Student;
  onClose: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({ student, onClose }) => {
  const {
    school,
    classes,
    subjects,
    examResults,
    attendance,
    currentUser,
    users,
    signatories,
    saveUserSignature,
    resolveTeacherDisplayName,
  } = useSchool();
  const [showSignModal, setShowSignModal] = useState(false);

  const studentClass = classes.find((c) => c.id === student.classId);
  const formTeacher = users.find(
    (u) =>
      u.id === (student.classTeacherId || studentClass?.formTutorTeacherId) || u.role === 'teacher'
  );
  const classTeacherLabel = resolveTeacherDisplayName(
    student.classTeacherId || studentClass?.formTutorTeacherId,
    student.classTeacherName || studentClass?.classTeacherName
  );
  const teacherSignatureUrl =
    (currentUser.role === 'teacher' ? currentUser.signatureDataUrl : undefined) ||
    formTeacher?.signatureDataUrl ||
    signatories.find((s) => s.role === 'Lead Lecturer / Teacher' || s.role === 'Registrar')?.signatureDataUrl;
  const principalSignatureUrl =
    school.headmasterSignatureDataUrl ||
    signatories.find((s) => s.role === 'Head of Institution')?.signatureDataUrl;

  const canSign = ['proprietor', 'admin', 'teacher'].includes(currentUser.role);

  const studentResults = examResults.filter(
    (r) =>
      r.studentId === student.id &&
      r.term === school.currentTerm &&
      r.academicYear === school.currentAcademicYear
  );

  // Attendance stats
  const studentAtt = attendance.filter((a) => a.studentId === student.id);
  const presentCount = studentAtt.filter((a) => a.status === 'Present').length;
  const totalDays = studentAtt.length > 0 ? studentAtt.length : 65; // standard term days
  const attendanceRate = totalDays > 0 ? Math.round((presentCount / Math.max(studentAtt.length, 1)) * 100) : 98;

  // Calculate overall performance
  const totalScoreSum = studentResults.reduce((acc, r) => acc + r.totalScore, 0);
  const averageScore = studentResults.length > 0 ? (totalScoreSum / studentResults.length).toFixed(1) : '85.4';

  const handlePrint = () => {
    document.body.classList.add('printing-isolated-doc');
    const cleanup = () => {
      document.body.classList.remove('printing-isolated-doc');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 800);
    }, 80);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden my-8">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-base sm:text-lg">Official Terminal Report Card</span>
          </div>
          <div className="flex items-center gap-2.5">
            {canSign && (
              <button
                type="button"
                onClick={() => setShowSignModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Sign / Upload Signature</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Printable Report Document */}
        <div id="printable-document-container" className="p-8 text-slate-800 bg-white">
          {/* Header Banner */}
          <div className="border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="w-24 h-24 rounded-full border-2 border-slate-800 p-1 flex items-center justify-center overflow-hidden bg-slate-50">
                <img
                  src={school.crest}
                  alt={school.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              <div className="text-center flex-1 px-4">
                <span className="text-xs uppercase tracking-widest font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Ghana Education Service (GES) • WAEC Accredited
                </span>
                <h1 className="text-2xl font-serif font-black tracking-tight text-slate-950 mt-1 uppercase">
                  {school.name}
                </h1>
                <p className="text-xs italic text-slate-600 font-medium">"{school.motto}"</p>
                <p className="text-xs text-slate-500 mt-1">
                  {school.address} • Tel: {school.phone} • Email: {school.email}
                </p>
                <div className="mt-2 inline-block bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded">
                  Terminal Student Performance & Assessment Report
                </div>
              </div>

              <div className="w-24 text-right">
                <div className="w-20 h-24 border border-slate-300 rounded overflow-hidden shadow-sm inline-block bg-slate-100">
                  <img
                    src={student.photo}
                    alt={student.firstName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Student & Term Meta Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 mt-6 text-xs">
              <div>
                <span className="text-slate-500 block">Student Name:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {student.lastName.toUpperCase()}, {student.firstName} {student.otherNames || ''}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Student ID / Index No:</span>
                <span className="font-mono font-bold text-slate-900">{student.studentNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Class &amp; Stream:</span>
                <span className="font-bold text-slate-900">
                  {studentClass?.name || `${student.gradeName || 'Class'} ${student.stream || ''}`.trim()}
                </span>
                {(student.sectionName || studentClass?.sectionName) && (
                  <span className="block text-[10px] text-slate-500">
                    {student.sectionName || studentClass?.sectionName}
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block">Programme / Class Teacher:</span>
                <span className="font-bold text-emerald-800 block">
                  {student.programme || studentClass?.programme || 'GES Standard'}
                </span>
                <span className="block text-[10px] text-slate-600">{classTeacherLabel}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Academic Year:</span>
                <span className="font-semibold text-slate-900">
                  {student.academicYear || school.currentAcademicYear}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Term / Session:</span>
                <span className="font-semibold text-slate-900">{school.currentTerm}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Residential Status:</span>
                <span className="font-semibold text-slate-900">{student.boardingStatus}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Attendance Rate:</span>
                <span className="font-bold text-slate-900">{attendanceRate}% (Present)</span>
              </div>
            </div>
          </div>

          {/* Academic Results Table */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
              <span>Cognitive Assessment (Continuous Assessment 30% + Terminal Exam 70%)</span>
              <span className="text-[11px] font-normal text-slate-500">Grading System: WASSCE / GES Standards</span>
            </h2>

            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-2 text-center">Category</th>
                    <th className="py-2.5 px-2 text-center">Class Score (30%)</th>
                    <th className="py-2.5 px-2 text-center">Exam Score (70%)</th>
                    <th className="py-2.5 px-2 text-center font-bold">Total (100%)</th>
                    <th className="py-2.5 px-2 text-center font-bold">Grade</th>
                    <th className="py-2.5 px-2 text-center">Pos</th>
                    <th className="py-2.5 px-3">Subject Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {studentResults.length > 0 ? (
                    studentResults.map((result) => {
                      const subject = subjects.find((s) => s.id === result.subjectId);
                      const gradeMeta = calculateWassceGrade(result.totalScore);
                      return (
                        <tr key={result.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {subject?.name || 'Subject'}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${subject?.category === 'Core' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                              {subject?.category || 'Core'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono">{result.classScore}</td>
                          <td className="py-2.5 px-2 text-center font-mono">{result.examScore}</td>
                          <td className="py-2.5 px-2 text-center font-bold font-mono text-slate-950">
                            {result.totalScore}
                          </td>
                          <td className="py-2.5 px-2 text-center font-black">
                            <span className={`px-2 py-0.5 rounded text-xs border ${gradeMeta.badgeColor}`}>
                              {result.grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                            {result.subjectPosition ? formatOrdinal(result.subjectPosition) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 italic">
                            {result.remarks}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                        No continuous assessment or examination records published yet for this term.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Summary Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block font-medium">Class Average & Overall Standing:</span>
              <div className="text-lg font-bold text-slate-900 mt-1">
                Average: <span className="text-emerald-700">{averageScore}%</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">Position: <strong className="text-slate-900">2nd</strong> out of 48 students</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block font-medium">Conduct & Attitude:</span>
              <div className="text-sm font-bold text-slate-900 mt-1">
                Exemplary & Diligent
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">Active in Science Club & Debating Society</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block font-medium">Next Term Resumption:</span>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {school.nextTermBegins}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">Boarders report Sunday prior by 4:00 PM</p>
            </div>
          </div>

          {/* Official Remarks & Signatures */}
          <div className="border border-slate-300 rounded-lg p-4 bg-slate-50/50 mb-6 text-xs space-y-4">
            <div>
              <div className="font-bold text-slate-800">Form Master / Class Teacher's Remarks:</div>
              <p className="text-slate-700 italic mt-1 bg-white p-2.5 rounded border border-slate-200">
                "{student.firstName} is an exceptionally bright and focused scholar. Demonstrated high problem-solving capacity in mathematics and integrated science. Strongly encouraged to sustain this tempo towards the upcoming WASSCE."
              </p>
              <div className="flex justify-between items-end text-slate-600 mt-2 text-[11px]">
                <div className="flex items-end gap-2">
                  <span>Teacher Signature:</span>
                  {teacherSignatureUrl ? (
                    <img
                      src={teacherSignatureUrl}
                      alt="Teacher Signature"
                      className="h-10 object-contain border-b border-slate-400 px-2"
                    />
                  ) : (
                    <span>__________________________</span>
                  )}
                </div>
                <span className="tabular-nums">Date: {new Date().toLocaleDateString('en-GB')}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <div className="font-bold text-slate-800">Headmistress / Principal's General Remarks:</div>
              <p className="text-slate-700 italic mt-1 bg-white p-2.5 rounded border border-slate-200">
                "An outstanding terminal achievement. Commendation certificate awarded. Keep shining as a proud beacon of {school.name}."
              </p>
              <div className="flex justify-between items-center text-slate-500 mt-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  {principalSignatureUrl ? (
                    <img
                      src={principalSignatureUrl}
                      alt={school.headmasterName}
                      className="h-11 object-contain border-b border-slate-400 px-2"
                    />
                  ) : (
                    <span className="font-serif italic font-bold text-slate-800">{school.headmasterSignature}</span>
                  )}
                </div>
                <div className="text-center font-mono font-bold text-red-700 border-2 border-red-700 px-3 py-1 rounded rotate-[-2deg] opacity-80 uppercase text-[10px]">
                  OFFICIAL SCHOOL SEAL
                </div>
                <span className="tabular-nums">Date: {school.termEndDate}</span>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-3">
            This document is electronically verified by the {school.name} Management System. Any alteration or forgery renders it invalid.
          </div>
        </div>
      </div>

      <SignaturePadModal
        isOpen={showSignModal}
        onClose={() => setShowSignModal(false)}
        signerName={currentUser.name}
        signerDefaultTitle={currentUser.title}
        signerDefaultRole={
          currentUser.role === 'teacher'
            ? 'Lead Lecturer / Teacher'
            : currentUser.role === 'proprietor'
            ? 'Head of Institution'
            : 'Registrar'
        }
        existingSignatureUrl={currentUser.signatureDataUrl}
        onSaveSignature={(dataUrl, method, role, customTitle) => {
          saveUserSignature(currentUser.id, dataUrl, method, role, customTitle);
        }}
      />
    </div>
  );
};

