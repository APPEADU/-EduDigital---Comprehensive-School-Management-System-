import React from 'react';
import { FeePayment } from '../../types';
import { useSchool } from '../../context/SchoolContext';
import { formatGHS } from '../../utils/academicCalculations';
import { Printer, X, Receipt, CheckCircle, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  payment: FeePayment;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, onClose }) => {
  const { school, students, classes } = useSchool();
  const student = students.find((s) => s.id === payment.studentId);
  const studentClass = student ? classes.find((c) => c.id === student.classId) : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden my-8">
        {/* Top Control Bar */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-lg">Official School Fees Receipt</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div className="p-8 text-slate-900 bg-white">
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <img
                src={school.crest}
                alt={school.name}
                className="w-12 h-12 rounded-full border border-slate-300 object-cover"
              />
              <div className="text-left">
                <h2 className="text-xl font-serif font-black tracking-tight text-slate-950 uppercase">
                  {school.name}
                </h2>
                <p className="text-xs text-slate-600">{school.address} • Tel: {school.phone}</p>
              </div>
            </div>
            <div className="mt-3 inline-block bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded">
              Official Fees Payment Receipt
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 my-6 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block">Receipt Number:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{payment.receiptNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Date & Time:</span>
              <span className="font-semibold text-slate-900">{payment.date}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Student Name:</span>
              <span className="font-bold text-slate-900">{student?.firstName} {student?.lastName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Student ID / Class:</span>
              <span className="font-mono font-bold text-slate-800">{student?.studentNumber} ({studentClass?.name || 'SHS 2'})</span>
            </div>
            <div>
              <span className="text-slate-500 block">Academic Term:</span>
              <span className="font-medium text-slate-900">{payment.term} ({payment.academicYear})</span>
            </div>
            <div>
              <span className="text-slate-500 block">Payment Method:</span>
              <span className="font-bold text-emerald-800">{payment.paymentMethod}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Transaction Reference / MoMo ID:</span>
              <span className="font-mono font-semibold text-slate-900">{payment.transactionRef}</span>
            </div>
          </div>

          {/* Amount Paid Box */}
          <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-center my-6">
            <span className="text-xs uppercase font-bold text-emerald-800 tracking-wider">Amount Paid</span>
            <div className="text-3xl font-black text-emerald-950 mt-1 font-mono">
              {formatGHS(payment.amountPaid)}
            </div>
            <span className="text-xs text-emerald-700 font-medium flex items-center justify-center gap-1 mt-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Verified & Credited to School Account
            </span>
          </div>

          <div className="text-xs space-y-2 text-slate-600 mb-6">
            <div className="flex justify-between border-b border-slate-200 py-1">
              <span>Paid By:</span>
              <span className="font-bold text-slate-900">{payment.payerName} ({payment.payerPhone})</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 py-1">
              <span>Purpose / Notes:</span>
              <span className="font-medium text-slate-900">{payment.notes || 'School Tuition & Facility User Fees'}</span>
            </div>
          </div>

          <div className="flex justify-between items-end border-t border-slate-200 pt-4 text-xs">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Bursar Signature & Stamp</span>
              </div>
              <div className="text-slate-400 text-[11px]">Accounts Department</div>
            </div>
            <div className="text-center font-mono font-bold text-emerald-800 border-2 border-emerald-800 px-3 py-1 rounded rotate-[-2deg] text-[10px] uppercase">
              PAID & AUDITED
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
