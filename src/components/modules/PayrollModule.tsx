import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { StaffMember } from '../../types';
import { calculateGhanaPayroll, formatGHS } from '../../utils/academicCalculations';
import { PayslipModal } from '../modals/PayslipModal';
import { PasswordResetModal } from '../modals/PasswordResetModal';
import {
  DollarSign,
  Plus,
  FileText,
  Trash2,
  KeyRound,
} from 'lucide-react';

export const PayrollModule: React.FC = () => {
  const { school, activeSchoolId, staff, addStaff, deleteStaff } = useSchool();
  const [activePayslipStaff, setActivePayslipStaff] = useState<StaffMember | null>(null);
  const [resetStaffPasswordTarget, setResetStaffPasswordTarget] = useState<StaffMember | null>(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [confirmDeleteStaffId, setConfirmDeleteStaffId] = useState<string | null>(null);
  const [portalPassword, setPortalPassword] = useState('staff123');

  // New staff form
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    gender: 'Male' as 'Male' | 'Female',
    role: 'Tutor',
    department: 'Science & Mathematics',
    qualification: 'B.Ed Science (UEW Winneba)',
    phone: '+233 24 ',
    email: '',
    hireDate: new Date().toISOString().split('T')[0],
    ssnitNumber: 'C0',
    tinNumber: 'P0',
    basicSalary: 5500,
    allowances: 800,
    activeStatus: true,
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.fullName) return;
    addStaff(newStaff, { password: portalPassword.trim() || 'staff123' });
    setShowAddStaffModal(false);
  };

  // Compute total payroll costs
  const totalGrossSalaries = staff.reduce(
    (acc, s) => acc + (s.basicSalary + s.allowances),
    0
  );
  const totalSsnitEmployer = staff.reduce(
    (acc, s) => acc + s.basicSalary * 0.13,
    0
  );
  const totalNetDisbursement = staff.reduce((acc, s) => {
    const p = calculateGhanaPayroll(s.basicSalary, s.allowances);
    return acc + p.netSalary;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Accounting, Staff HR & Ghana Statutory Payroll
          </h2>
          <p className="text-xs text-slate-400">
            SSNIT Tier 1 & 2 (5.5% / 13%) and Ghana Revenue Authority (GRA) PAYE compliance engine with printable payslips.
          </p>
        </div>

        <button
          onClick={() => setShowAddStaffModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Employee / Faculty
        </button>
      </div>

      {/* Statutory Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Monthly Gross Payroll
          </span>
          <div className="text-2xl font-black font-mono text-white mt-2">
            {formatGHS(totalGrossSalaries)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {staff.length} Active employees on payroll
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Employer SSNIT Obligation (13%)
          </span>
          <div className="text-2xl font-black font-mono text-blue-400 mt-2">
            {formatGHS(totalSsnitEmployer)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Tier 1 mandatory national pension contribution
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Net Monthly Take-Home Pay
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
            {formatGHS(totalNetDisbursement)}
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
            Direct bank deposit readiness: 100%
          </span>
        </div>
      </div>

      {/* Staff Payroll Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">Monthly Employee Salary Register</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50">
              GRA Act 896 & SSNIT Act 766
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            Statutory deductions computed automatically
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Role & Dept</th>
                <th className="py-3 px-3">Basic Salary</th>
                <th className="py-3 px-3">Allowances</th>
                <th className="py-3 px-3 text-rose-400">SSNIT (5.5%)</th>
                <th className="py-3 px-3 text-rose-400">GRA PAYE Tax</th>
                <th className="py-3 px-3 font-bold text-emerald-400">Net Salary</th>
                <th className="py-3 px-4 text-right">Official Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {staff.map((stf) => {
                const payroll = calculateGhanaPayroll(stf.basicSalary, stf.allowances);
                return (
                  <tr key={stf.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{stf.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {stf.staffId} • SSNIT: {stf.ssnitNumber}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-200 block">{stf.role}</span>
                      <span className="text-[11px] text-slate-400">{stf.department}</span>
                    </td>

                    <td className="py-3 px-3 font-mono text-white">
                      {formatGHS(payroll.basicSalary)}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-300">
                      {formatGHS(payroll.allowances)}
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-rose-400">
                      {formatGHS(payroll.ssnitEmployee)}
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-rose-400">
                      {formatGHS(payroll.graPayeTax)}
                    </td>

                    <td className="py-3 px-3 font-mono font-black text-emerald-400 text-sm">
                      {formatGHS(payroll.netSalary)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setResetStaffPasswordTarget(stf)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-emerald-300 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer whitespace-nowrap"
                          title={`Reset Portal Password for ${stf.fullName}`}
                        >
                          <KeyRound className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Reset Password</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivePayslipStaff(stf)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer whitespace-nowrap"
                          title="View Official Printable Payslip"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span>Payslip</span>
                        </button>
                        {confirmDeleteStaffId === stf.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDeleteStaffId(null);
                                deleteStaff(stf.id);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition cursor-pointer whitespace-nowrap"
                              title={`Confirm removing ${stf.fullName} from ${school.name}`}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteStaffId(null)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteStaffId(stf.id)}
                            className="p-1.5 hover:bg-rose-950/70 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-800/40"
                            title={`Remove ${stf.fullName} from ${school.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xl w-full text-slate-200 shadow-2xl my-8">
            <h3 className="font-bold text-lg text-white mb-1">Add Faculty or Staff Member</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter employee credentials, statutory SSNIT, GRA TIN, and salary package.
            </p>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={newStaff.fullName}
                  onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                  placeholder="e.g. Mr. Kwabena Boateng"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Designation / Role *</label>
                  <input
                    type="text"
                    required
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    placeholder="e.g. Senior Lecturer / Tutor"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <input
                    type="text"
                    value={newStaff.department}
                    onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                    placeholder="e.g. Science & Mathematics"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Official Portal Sign-In Email</label>
                  <input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    placeholder="lecturer@institution.edu.gh (auto-generated if blank)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Initial Portal Password *</label>
                  <input
                    type="text"
                    required
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    placeholder="staff123"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">SSNIT Number *</label>
                  <input
                    type="text"
                    required
                    value={newStaff.ssnitNumber}
                    onChange={(e) => setNewStaff({ ...newStaff, ssnitNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="C0192837465"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">GRA TIN / Ghana Card</label>
                  <input
                    type="text"
                    value={newStaff.tinNumber}
                    onChange={(e) => setNewStaff({ ...newStaff, tinNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="P0001928374"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Basic Monthly Salary (GH₵) *</label>
                  <input
                    type="number"
                    required
                    value={newStaff.basicSalary}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, basicSalary: parseFloat(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Monthly Allowances (GH₵)</label>
                  <input
                    type="number"
                    value={newStaff.allowances}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, allowances: parseFloat(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Render Payslip Modal */}
      {activePayslipStaff && (
        <PayslipModal
          staffMember={activePayslipStaff}
          onClose={() => setActivePayslipStaff(null)}
        />
      )}

      {/* Render Faculty / Staff Password Reset Modal */}
      <PasswordResetModal
        isOpen={Boolean(resetStaffPasswordTarget)}
        onClose={() => setResetStaffPasswordTarget(null)}
        flowMode="admin-override"
        initialSchoolId={activeSchoolId}
        initialIdentifier={resetStaffPasswordTarget?.email || resetStaffPasswordTarget?.staffId || ''}
        targetAccountLabel={`${resetStaffPasswordTarget?.fullName || ''} (${resetStaffPasswordTarget?.role || 'Faculty'})`}
      />
    </div>
  );
};
