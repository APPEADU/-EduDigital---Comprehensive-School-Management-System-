import React from 'react';
import { Student } from '../../types';
import { useSchool } from '../../context/SchoolContext';
import { Printer, X, CreditCard, QrCode } from 'lucide-react';

interface StudentIdCardModalProps {
  student: Student;
  onClose: () => void;
}

export const StudentIdCardModal: React.FC<StudentIdCardModalProps> = ({ student, onClose }) => {
  const { school, classes, boardingHouses } = useSchool();
  const studentClass = classes.find((c) => c.id === student.classId);
  const house = boardingHouses.find((h) => h.id === student.houseId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden my-8">
        {/* Top Control Bar */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-lg">Official Student Identity Card</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Card
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Printable Card Area */}
        <div className="p-8 bg-slate-100 flex flex-col md:flex-row items-center justify-center gap-6">
          {/* Card Front */}
          <div className="w-[320px] h-[480px] bg-gradient-to-b from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-5 shadow-xl flex flex-col justify-between border-2 border-emerald-500/40 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* School Crest & Header */}
            <div className="text-center relative z-10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <img
                  src={school.crest}
                  alt={school.name}
                  className="w-10 h-10 rounded-full border border-emerald-400 object-cover"
                />
                <div className="text-left">
                  <h3 className="text-xs font-black uppercase tracking-tight leading-tight text-white">
                    {school.name}
                  </h3>
                  <p className="text-[9px] text-emerald-400 font-medium">STUDENT IDENTITY CARD</p>
                </div>
              </div>
              <div className="h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent my-2"></div>
            </div>

            {/* Student Photo & Identity */}
            <div className="text-center relative z-10 flex flex-col items-center">
              <div className="w-28 h-32 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md bg-slate-800 mb-3">
                <img
                  src={student.photo}
                  alt={student.firstName}
                  className="w-full h-full object-cover"
                />
              </div>

              <h2 className="text-base font-black tracking-wide text-white uppercase">
                {student.firstName} {student.lastName}
              </h2>
              <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 mt-1">
                ID: {student.studentNumber}
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/60 p-2.5 rounded-xl border border-white/10 relative z-10">
              <div>
                <span className="text-slate-400 block">Class &amp; Stream:</span>
                <span className="font-bold text-white">
                  {studentClass?.name || `${student.gradeName || 'Class'} ${student.stream || ''}`.trim()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Section / Track:</span>
                <span className="font-bold text-emerald-300">
                  {student.sectionName || studentClass?.sectionName || student.programme}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Status:</span>
                <span className="font-bold text-white">{student.boardingStatus}</span>
              </div>
              <div>
                <span className="text-slate-400 block">House / Room:</span>
                <span className="font-bold text-white">
                  {house?.name || studentClass?.roomNumber || 'Main Campus'}
                </span>
              </div>
            </div>

            {/* Valid period */}
            <div className="text-center text-[9px] text-slate-400 border-t border-white/10 pt-2 relative z-10">
              VALID ACADEMIC YEAR:{' '}
              <span className="text-white font-bold">
                {student.academicYear || school.currentAcademicYear}
              </span>
            </div>
          </div>

          {/* Card Back */}
          <div className="w-[320px] h-[480px] bg-white text-slate-900 rounded-2xl p-5 shadow-xl flex flex-col justify-between border-2 border-slate-300 relative">
            <div>
              <div className="text-center border-b border-slate-200 pb-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                  Terms & Conditions
                </h4>
                <p className="text-[9px] text-slate-500 mt-1 leading-snug">
                  This card is the property of {school.name}. It must be produced on demand by school authorities and surrendered upon completion or withdrawal.
                </p>
              </div>

              <div className="mt-4 space-y-2 text-[10px]">
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-500 block font-medium">Guardian / Emergency Contact:</span>
                  <span className="font-bold text-slate-900">{student.guardianName}</span>
                  <span className="block text-slate-700 font-mono">{student.guardianPhone}</span>
                </div>

                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-500 block font-medium">Ghana National ID / NHIS:</span>
                  <span className="font-mono font-bold text-slate-800">{student.nationalIdOrNHIS || 'GHA-718293041-9'}</span>
                </div>

                <div className="p-2 bg-rose-50 rounded border border-rose-200 text-rose-900">
                  <span className="text-rose-700 block font-bold">Medical Alert:</span>
                  <span>{student.medicalInfo || 'No known allergies'}</span>
                </div>
              </div>
            </div>

            {/* QR & Verification */}
            <div className="pt-2 border-t border-slate-200 text-center flex flex-col items-center">
              <div className="flex items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <QrCode className="w-14 h-14 text-slate-900" />
              </div>
              <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase">
                VERIFIED BY INFODIGITAL SIS · {school.code}
              </span>
              <p className="text-[8px] text-slate-400 mt-1">
                If found, please return to {school.address} or call {school.phone}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
