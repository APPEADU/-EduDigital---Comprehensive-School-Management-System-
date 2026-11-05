import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { FeePayment, SchoolTransaction } from '../../types';
import { formatGHS } from '../../utils/academicCalculations';
import { ReceiptModal } from '../modals/ReceiptModal';
import {
  Wallet,
  Receipt,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  CreditCard,
  Building,
  CheckCircle,
  Clock,
  Printer,
  Search,
} from 'lucide-react';

export const FinanceModule: React.FC = () => {
  const {
    students,
    feeItems,
    feePayments,
    transactions,
    recordFeePayment,
    recordTransaction,
    currentUser,
    school,
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'payments' | 'structure' | 'ledger'>('payments');
  const [activeReceipt, setActiveReceipt] = useState<FeePayment | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // New Payment Form
  const [payFormData, setPayFormData] = useState({
    studentId: students[0]?.id || '',
    amountPaid: 2500,
    paymentMethod: 'MTN Mobile Money' as FeePayment['paymentMethod'],
    networkNumber: '0244567890',
    transactionRef: `MTN-MM-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    payerName: 'Alhaji Ibrahim Yakubu',
    payerPhone: '+233 24 456 7890',
    term: school.currentTerm,
    academicYear: school.currentAcademicYear,
    status: 'Completed' as const,
    notes: 'Term 1 Boarding & Tuition part payment',
  });

  // New Expense Form
  const [expenseData, setExpenseData] = useState({
    category: 'Boarding Kitchen' as SchoolTransaction['category'],
    amount: 12500,
    reference: `EXP-${Date.now().toString().slice(-5)}`,
    description: 'Purchase of local produce, eggs and cooking gas for boarding refectory',
    approvedBy: currentUser.name,
  });

  // Calculations
  const totalCollected = feePayments.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'Expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const netCashFlow = totalCollected - totalExpenses;

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const createdPayment = recordFeePayment(payFormData);
    setShowPayModal(false);
    setActiveReceipt(createdPayment);
  };

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    recordTransaction({
      type: 'Expense',
      category: expenseData.category,
      amount: Number(expenseData.amount),
      reference: expenseData.reference,
      description: expenseData.description,
      approvedBy: expenseData.approvedBy,
    });
    setShowExpenseModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            School Fees & Financial Operations (Ghana Cedis - GH₵)
          </h2>
          <p className="text-xs text-slate-400">
            MTN Mobile Money, Telecel Cash, and Bank Transfer fee collections, official receipts, and institutional expenditure ledgers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4 text-rose-400" />
            Record Expense
          </button>
          <button
            onClick={() => setShowPayModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Fee Payment (MoMo / Bank)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Fees Collected (Term 1)
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
            {formatGHS(totalCollected)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Via MoMo (MTN / Telecel / AT) & Bank
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Operational Expenses
          </span>
          <div className="text-2xl font-black font-mono text-rose-400 mt-2">
            {formatGHS(totalExpenses)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Kitchen feeding, generator fuel & utilities
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Net Institution Balance
          </span>
          <div className="text-2xl font-black font-mono text-white mt-2">
            {formatGHS(netCashFlow)}
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
            Healthy Operating Reserves
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold w-fit">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            activeTab === 'payments' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Fee Payments & Receipts ({feePayments.length})
        </button>
        <button
          onClick={() => setActiveTab('structure')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            activeTab === 'structure' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Fee Structure Rates
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            activeTab === 'ledger' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Institutional Cash Ledger
        </button>
      </div>

      {/* TAB 1: Payments & Receipts */}
      {activeTab === 'payments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Amount Paid</th>
                  <th className="py-3 px-3">Payment Channel</th>
                  <th className="py-3 px-3">Payer Details</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-4 text-right">Official Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {feePayments.map((pay) => {
                  const student = students.find((s) => s.id === pay.studentId);
                  return (
                    <tr key={pay.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {pay.receiptNumber}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-white block">
                          {student ? `${student.firstName} ${student.lastName}` : 'Student'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {student?.studentNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white text-sm">
                        {formatGHS(pay.amountPaid)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-950 text-amber-300 border border-slate-800">
                          <Smartphone className="w-3 h-3 text-amber-400" />
                          {pay.paymentMethod}
                        </span>
                        <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                          {pay.transactionRef}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-200 block">{pay.payerName}</span>
                        <span className="text-[11px] font-mono text-slate-400">{pay.payerPhone}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{pay.date}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setActiveReceipt(pay)}
                          className="flex items-center gap-1 ml-auto px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
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

      {/* TAB 2: Fee Structure */}
      {activeTab === 'structure' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Approved Termly Fee Breakdown</h3>
              <p className="text-xs text-slate-400">
                Statutory tuition, boarding feeding, PTA levies, and facility user fees.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full text-xs font-bold">
              Current Session: {school.currentTerm}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeItems.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {item.classLevel}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                    {item.term}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm">{item.name}</h4>
                <div className="text-xl font-black font-mono text-emerald-400 pt-2 border-t border-slate-900">
                  {formatGHS(item.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Cash Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date & Ref</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Authorized By</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">{tx.date}</span>
                      <span className="font-mono text-[11px] text-slate-400">{tx.reference}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === 'Income'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                            : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                        }`}
                      >
                        {tx.type === 'Income' ? (
                          <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <ArrowDownLeft className="w-3 h-3 text-rose-400" />
                        )}
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">{tx.category}</td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs">{tx.description}</td>
                    <td className="py-3 px-3 text-slate-300">{tx.approvedBy}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                      <span className={tx.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'}>
                        {tx.type === 'Income' ? '+' : '-'} {formatGHS(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Fee Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full text-slate-200 shadow-2xl my-8">
            <h3 className="font-bold text-lg text-white mb-1">
              Record Fee Payment (MoMo / Bank Deposit)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter transaction reference and amount to issue a verified school receipt.
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Student *</label>
                <select
                  value={payFormData.studentId}
                  onChange={(e) => setPayFormData({ ...payFormData, studentId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.studentNumber} - {s.boardingStatus})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Amount Paid (GH₵) *</label>
                  <input
                    type="number"
                    required
                    value={payFormData.amountPaid}
                    onChange={(e) =>
                      setPayFormData({ ...payFormData, amountPaid: parseFloat(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Payment Channel *</label>
                  <select
                    value={payFormData.paymentMethod}
                    onChange={(e) =>
                      setPayFormData({
                        ...payFormData,
                        paymentMethod: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="MTN Mobile Money">MTN Mobile Money</option>
                    <option value="Telecel Cash">Telecel Cash</option>
                    <option value="AT Money">AT Money</option>
                    <option value="Bank Transfer">Bank Transfer (GCB/Ecobank)</option>
                    <option value="Cash">Cash at Bursary</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">MoMo Transaction ID / Ref *</label>
                  <input
                    type="text"
                    required
                    value={payFormData.transactionRef}
                    onChange={(e) =>
                      setPayFormData({ ...payFormData, transactionRef: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Network Phone Number</label>
                  <input
                    type="text"
                    value={payFormData.networkNumber}
                    onChange={(e) =>
                      setPayFormData({ ...payFormData, networkNumber: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Payer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={payFormData.payerName}
                    onChange={(e) => setPayFormData({ ...payFormData, payerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Payer Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={payFormData.payerPhone}
                    onChange={(e) => setPayFormData({ ...payFormData, payerPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payment Purpose / Remarks</label>
                <input
                  type="text"
                  value={payFormData.notes}
                  onChange={(e) => setPayFormData({ ...payFormData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Confirm & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-slate-200 shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-1">Record Operational Expenditure</h3>
            <p className="text-xs text-slate-400 mb-4">
              Add school purchase or operational cost to the accounts ledger.
            </p>

            <form onSubmit={handleRecordExpense} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Expense Category *</label>
                <select
                  value={expenseData.category}
                  onChange={(e) =>
                    setExpenseData({
                      ...expenseData,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Boarding Kitchen">Boarding Kitchen Feeding</option>
                  <option value="Utilities & Generator">Utilities & Generator Fuel</option>
                  <option value="Laboratory & ICT">Laboratory & ICT Equipment</option>
                  <option value="Maintenance">Campus Maintenance & Repairs</option>
                  <option value="Transport & Fuel">School Bus Fleet Fuel</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Amount (GH₵) *</label>
                <input
                  type="number"
                  required
                  value={expenseData.amount}
                  onChange={(e) =>
                    setExpenseData({ ...expenseData, amount: parseFloat(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description / Details *</label>
                <textarea
                  required
                  value={expenseData.description}
                  onChange={(e) =>
                    setExpenseData({ ...expenseData, description: e.target.value })
                  }
                  className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Post Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Render Official Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal payment={activeReceipt} onClose={() => setActiveReceipt(null)} />
      )}
    </div>
  );
};
