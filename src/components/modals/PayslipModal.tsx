import React from 'react';
import { StaffMember } from '../../types';
import { useSchool } from '../../context/SchoolContext';
import { calculateGhanaPayroll, formatGHS } from '../../utils/academicCalculations';
import { Printer, X, FileText, ShieldCheck } from 'lucide-react';

interface PayslipModalProps {
  staffMember: StaffMember;
  onClose: () => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({ staffMember, onClose }) => {
  const { school } = useSchool();
  const payroll = calculateGhanaPayroll(staffMember.basicSalary, staffMember.allowances);

  const handlePrint = () => {
    window.print();
  };

  const currentMonthYear = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden my-8">
        {/* Top Control Bar */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-lg">Staff Payslip (SSNIT & GRA Statutory Compliant)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Payslip
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
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
                <p className="text-xs text-slate-600">{school.address} • Payroll Division</p>
              </div>
            </div>
            <div className="mt-3 inline-block bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded">
              Monthly Employee Salary Slip — {currentMonthYear}
            </div>
          </div>

          {/* Staff Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 my-6 text-xs">
            <div>
              <span className="text-slate-500 block">Employee Name:</span>
              <span className="font-bold text-slate-900 text-sm">{staffMember.fullName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Staff ID:</span>
              <span className="font-mono font-bold text-slate-900">{staffMember.staffId}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Department / Role:</span>
              <span className="font-semibold text-slate-900">{staffMember.role}</span>
            </div>
            <div>
              <span className="text-slate-500 block">SSNIT Number:</span>
              <span className="font-mono font-bold text-slate-800">{staffMember.ssnitNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">GRA TIN / Ghana Card:</span>
              <span className="font-mono font-bold text-slate-800">{staffMember.tinNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Payment Mode:</span>
              <span className="font-semibold text-emerald-800">Direct Bank Deposit / MoMo</span>
            </div>
          </div>

          {/* Earnings vs Deductions Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-xs">
            {/* Earnings */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-emerald-50 px-3 py-2 font-bold text-emerald-900 border-b border-emerald-200">
                Earnings
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Basic Monthly Salary</span>
                  <span className="font-mono font-bold text-slate-900">{formatGHS(payroll.basicSalary)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Responsibility & Transport Allowance</span>
                  <span className="font-mono font-bold text-slate-900">{formatGHS(payroll.allowances)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-400">
                  <span>Other Overtime / Bonuses</span>
                  <span className="font-mono font-semibold">GH₵ 0.00</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-slate-200 font-bold text-slate-950">
                  <span>Total Gross Earnings:</span>
                  <span className="font-mono text-emerald-800 text-sm">{formatGHS(payroll.grossSalary)}</span>
                </div>
              </div>
            </div>

            {/* Statutory Deductions */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-rose-50 px-3 py-2 font-bold text-rose-900 border-b border-rose-200">
                Statutory & Other Deductions
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">SSNIT Tier 1 & 2 (5.5%)</span>
                  <span className="font-mono font-bold text-rose-800">{formatGHS(payroll.ssnitEmployee)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">GRA Income Tax (PAYE)</span>
                  <span className="font-mono font-bold text-rose-800">{formatGHS(payroll.graPayeTax)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-400">
                  <span>Staff Welfare / Credit Union</span>
                  <span className="font-mono font-semibold">GH₵ 0.00</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-slate-200 font-bold text-slate-950">
                  <span>Total Deductions:</span>
                  <span className="font-mono text-rose-800 text-sm">{formatGHS(payroll.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary Highlight Box */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between mb-6">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Net Take-Home Pay</span>
              <span className="text-xs text-emerald-400">Paid to employee designated bank account</span>
            </div>
            <div className="text-3xl font-black font-mono text-emerald-400">
              {formatGHS(payroll.netSalary)}
            </div>
          </div>

          {/* Employer Statutory Obligation Note */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 mb-6">
            <span className="font-bold text-slate-800">Employer Contribution Note: </span>
            The school contributes <span className="font-mono font-bold text-slate-900">{formatGHS(payroll.ssnitEmployer)}</span> (13.0% Tier 1) to SSNIT on behalf of the employee, per the National Pensions Act, 2008 (Act 766).
          </div>

          {/* Signature */}
          <div className="flex justify-between items-end border-t border-slate-200 pt-4 text-xs">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Authorized Financial Controller</span>
              </div>
              <div className="text-slate-400 text-[11px]">{school.name} Treasury</div>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              Generated: {new Date().toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
