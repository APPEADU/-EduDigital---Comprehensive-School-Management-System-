import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { formatGHS } from '../../utils/academicCalculations';
import {
  Users,
  Wallet,
  CalendarCheck,
  UserPlus,
  FileSpreadsheet,
  Receipt,
  Sparkles,
  GraduationCap,
  BellRing,
  BookOpenCheck,
  Globe,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export const DashboardModule: React.FC = () => {
  const {
    school,
    students,
    feePayments,
    admissions,
    attendance,
    researchArticles,
    biometricGateLogs,
    setActiveModule,
  } = useSchool();

  const [gateFilter, setGateFilter] = useState<'all' | 'authorized' | 'denied'>('all');

  // Metrics
  const totalStudents = students.length;
  const boardingCount = students.filter((s) => s.boardingStatus === 'Boarding').length;
  const dayCount = students.filter((s) => s.boardingStatus === 'Day').length;
  const maleCount = students.filter((s) => s.gender === 'Male').length;
  const femaleCount = students.filter((s) => s.gender === 'Female').length;

  const totalCollectedFees = feePayments.reduce((acc, p) => acc + p.amountPaid, 0);
  const projectedTermTarget = 380000;
  const feeCollectionRate = Math.min(100, Math.round((totalCollectedFees / projectedTermTarget) * 100));

  const pendingApps = admissions.filter((a) => a.status === 'Pending').length;

  // Attendance rate
  const presentCount = attendance.filter((a) => a.status === 'Present').length;
  const attRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 96;

  // Current-day Biometric Gate summary
  const todayIso = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const todayGateLogs = biometricGateLogs.filter((log) => log.date === todayIso);
  const todaySuccessfulEntries = todayGateLogs.filter(
    (log) => log.status === 'Authorized' && log.direction.includes('Entry')
  );
  const todayAuthorizedExits = todayGateLogs.filter(
    (log) => log.status === 'Authorized' && log.direction.includes('Exit')
  );
  const todayFailedAttempts = todayGateLogs.filter((log) => log.status === 'Denied');
  const filteredTodayGateLogs = todayGateLogs
    .filter((log) => {
      if (gateFilter === 'authorized') return log.status === 'Authorized';
      if (gateFilter === 'denied') return log.status === 'Denied';
      return true;
    })
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-teal-900/90 to-emerald-900 p-6 sm:p-8 text-white border border-teal-400/30 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <span>{school.currentAcademicYear}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-300">{school.currentTerm} Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {school.name}
            </h2>
            <p className="text-sm text-sky-100/90 leading-relaxed">
              Institutional management workspace overseeing {totalStudents} active learners, academic assessments, Mobile Money collections, and campus operations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveModule('ai-analytics')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>AI School Analytics</span>
            </button>
            <button
              onClick={() => setActiveModule('examinations')}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-md cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-950" />
              <span>Manage Terminal Marks</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Student Enrollment Card — Sapphire / Sky */}
        <div className="bg-gradient-to-br from-sky-950/85 via-slate-900/95 to-indigo-950/75 border border-sky-500/35 rounded-2xl p-5 shadow-sm text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-200/90">Total Enrollment</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/35 flex items-center justify-center text-sky-300">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white tabular-nums">{totalStudents}</span>
            <span className="text-xs text-sky-300 font-semibold flex items-center">
              Active Learners
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-sky-500/20 text-[11px] text-slate-300 flex items-center justify-between tabular-nums">
            <span>{boardingCount} Boarders · {dayCount} Day</span>
            <span className="text-sky-200 font-medium">{maleCount}M / {femaleCount}F</span>
          </div>
        </div>

        {/* Fees Collection Card — Emerald / Mint */}
        <div className="bg-gradient-to-br from-emerald-950/85 via-slate-900/95 to-teal-950/75 border border-emerald-500/35 rounded-2xl p-5 shadow-sm text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-200/90">Fees Collected</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/35 flex items-center justify-center text-emerald-300">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-300 font-mono tabular-nums">
              {formatGHS(totalCollectedFees)}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-[11px] tabular-nums">
            <span className="text-slate-300">Term Target: {formatGHS(projectedTermTarget)}</span>
            <span className="font-bold text-emerald-300">{feeCollectionRate}%</span>
          </div>
        </div>

        {/* Attendance Card — Warm Amber / Gold */}
        <div className="bg-gradient-to-br from-amber-950/80 via-slate-900/95 to-orange-950/65 border border-amber-500/35 rounded-2xl p-5 shadow-sm text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-200/90">Attendance Rate</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/35 flex items-center justify-center text-amber-300">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white tabular-nums">{attRate}%</span>
            <span className="text-xs text-amber-300 font-semibold">Today&apos;s Rate</span>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-500/20 text-[11px] text-slate-300 flex items-center justify-between">
            <span>Daily Roll Call Active</span>
            <span className="text-amber-300 font-medium tabular-nums">98% Staff Present</span>
          </div>
        </div>

        {/* Admissions Pending Card — Violet / Fuchsia */}
        <div className="bg-gradient-to-br from-violet-950/85 via-slate-900/95 to-fuchsia-950/70 border border-violet-500/35 rounded-2xl p-5 shadow-sm text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-violet-200/90">New Admissions</span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-400/35 flex items-center justify-center text-violet-300">
              <UserPlus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white tabular-nums">{pendingApps}</span>
            <span className="text-xs text-fuchsia-300 font-semibold">Awaiting Review</span>
          </div>
          <div className="mt-3 pt-3 border-t border-violet-500/20 text-[11px] text-slate-300 flex items-center justify-between">
            <span>Placements Active</span>
            <button
              type="button"
              onClick={() => setActiveModule('admissions')}
              className="text-violet-300 hover:text-white hover:underline font-semibold cursor-pointer"
            >
              Review Pipeline →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="bg-slate-900/85 border border-indigo-500/25 rounded-2xl p-5 text-white">
        <h3 className="text-xs font-bold text-sky-300 mb-4">
          Institutional Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => setActiveModule('students')}
            className="flex flex-col items-center justify-center p-3.5 bg-sky-950/55 hover:bg-sky-900/70 rounded-xl border border-sky-500/35 transition group cursor-pointer"
          >
            <Users className="w-5 h-5 text-sky-300 mb-2" />
            <span className="text-xs font-semibold text-white text-center">Student Registry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('examinations')}
            className="flex flex-col items-center justify-center p-3.5 bg-indigo-950/55 hover:bg-indigo-900/70 rounded-xl border border-indigo-500/35 transition group cursor-pointer"
          >
            <FileSpreadsheet className="w-5 h-5 text-indigo-300 mb-2" />
            <span className="text-xs font-semibold text-white text-center">Enter Marks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('attendance')}
            className="flex flex-col items-center justify-center p-3.5 bg-amber-950/55 hover:bg-amber-900/70 rounded-xl border border-amber-500/35 transition group cursor-pointer"
          >
            <CalendarCheck className="w-5 h-5 text-amber-300 mb-2" />
            <span className="text-xs font-semibold text-white text-center">Daily Roll Call</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('finance')}
            className="flex flex-col items-center justify-center p-3.5 bg-emerald-950/55 hover:bg-emerald-900/70 rounded-xl border border-emerald-500/35 transition group cursor-pointer"
          >
            <Receipt className="w-5 h-5 text-emerald-300 mb-2" />
            <span className="text-xs font-semibold text-white text-center">Record Fees</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('academics')}
            className="flex flex-col items-center justify-center p-3.5 bg-cyan-950/55 hover:bg-cyan-900/70 rounded-xl border border-cyan-500/35 transition group cursor-pointer"
          >
            <GraduationCap className="w-5 h-5 text-cyan-300 mb-2" />
            <span className="text-xs font-semibold text-white text-center">Lesson Planner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('communication')}
            className="flex flex-col items-center justify-center p-3.5 bg-rose-950/55 hover:bg-rose-900/70 rounded-xl border border-rose-500/35 transition group cursor-pointer"
          >
            <BellRing className="w-5 h-5 text-rose-300 mb-2" />
            <span className="text-xs font-semibold text-white text-center">Notices &amp; SMS</span>
          </button>
        </div>
      </div>

      {/* Today's Biometric Gate Entries & Failed Access Attempts Summary Widget */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Biometric Perimeter Security</span>
              <span aria-hidden="true">·</span>
              <span>{todayFormatted}</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Today&apos;s Biometric Gate Entries &amp; Failed Access Attempts
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setGateFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer ${
                  gateFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Today ({todayGateLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setGateFilter('authorized')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer ${
                  gateFilter === 'authorized'
                    ? 'bg-slate-800 text-emerald-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Successful ({todaySuccessfulEntries.length + todayAuthorizedExits.length})
              </button>
              <button
                type="button"
                onClick={() => setGateFilter('denied')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer ${
                  gateFilter === 'denied' ? 'bg-slate-800 text-rose-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Failed ({todayFailedAttempts.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveModule('biometric-gate')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <span>Open Gate Console</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Current-Day Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-slate-800">
          <div className="flex items-baseline justify-between sm:justify-start sm:gap-3">
            <span className="text-2xl font-black font-mono text-emerald-400">
              {todaySuccessfulEntries.length}
            </span>
            <div className="text-xs">
              <div className="font-semibold text-white">Successful Gate Entries</div>
              <div className="text-slate-400">Verified ingress scans today</div>
            </div>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-3 sm:border-l sm:border-slate-800 sm:pl-4">
            <span className="text-2xl font-black font-mono text-rose-400">
              {todayFailedAttempts.length}
            </span>
            <div className="text-xs">
              <div className="font-semibold text-white">Failed Access Attempts</div>
              <div className="text-slate-400">Blocked / unmatched credentials today</div>
            </div>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-3 sm:border-l sm:border-slate-800 sm:pl-4">
            <span className="text-2xl font-black font-mono text-slate-200">
              {todayAuthorizedExits.length}
            </span>
            <div className="text-xs">
              <div className="font-semibold text-white">Authorized Exits &amp; Releases</div>
              <div className="text-slate-400">Verified campus departures today</div>
            </div>
          </div>
        </div>

        {/* Recent Current-Day Activity List */}
        {filteredTodayGateLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">
            No matching biometric gate events recorded for today yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredTodayGateLogs.map((log) => {
              const isDenied = log.status === 'Denied';
              return (
                <div
                  key={log.id}
                  className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {isDenied ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-bold text-white">{log.personName}</span>
                        <span className="text-slate-600" aria-hidden="true">·</span>
                        <span className="font-mono text-slate-400">{log.personIdentifier}</span>
                        <span className="text-slate-600" aria-hidden="true">·</span>
                        <span className="text-slate-400">{log.personRole}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                        <span>{log.gateName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{log.method}</span>
                        <span aria-hidden="true">·</span>
                        <span>{log.direction}</span>
                      </div>
                      {isDenied && log.failureReason && (
                        <p className="text-[11px] text-rose-400 mt-0.5">{log.failureReason}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pl-7 sm:pl-0">
                    <span
                      className={`font-semibold ${
                        isDenied ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {isDenied ? 'Failed Attempt' : 'Authorized'}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">{log.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two Column Layout: Recent Fees Payments & Academic Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-950/45 via-slate-900/90 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">Recent Fee Transactions</h3>
              <p className="text-xs text-emerald-300/85">Verified Mobile Money &amp; Bank payments</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule('finance')}
              className="text-xs text-emerald-300 hover:text-white hover:underline font-semibold cursor-pointer"
            >
              View Ledger →
            </button>
          </div>

          <div className="divide-y divide-slate-800/90 space-y-2">
            {feePayments.slice(0, 4).map((pay) => {
              const stu = students.find((s) => s.id === pay.studentId);
              return (
                <div key={pay.id} className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">
                      {stu ? `${stu.firstName} ${stu.lastName}` : 'Student'}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-emerald-300 tabular-nums">{pay.receiptNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-300 font-medium">{pay.paymentMethod}</span>
                    </div>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="font-bold font-mono text-emerald-300 text-sm">
                      {formatGHS(pay.amountPaid)}
                    </span>
                    <span className="block text-[10px] text-slate-400">{pay.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Academic Scholars & Performance */}
        <div className="bg-gradient-to-br from-amber-950/45 via-slate-900/90 to-slate-900 border border-amber-500/30 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">Top Academic Performers</h3>
              <p className="text-xs text-amber-300/85">Current Term Cumulative Standing</p>
            </div>
            <button
              onClick={() => setActiveModule('examinations')}
              className="text-xs text-amber-300 hover:text-white hover:underline font-semibold cursor-pointer"
            >
              All Results →
            </button>
          </div>

          <div className="space-y-3">
            {students.slice(0, 3).map((stu, idx) => (
              <div
                key={stu.id}
                className="flex items-center justify-between p-3 bg-slate-950/55 rounded-xl border border-amber-500/20 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/25 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-400/40 tabular-nums">
                    {idx + 1}
                  </div>
                  <img
                    src={stu.photo}
                    alt={stu.firstName}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border border-amber-400/40"
                  />
                  <div>
                    <div className="font-bold text-white">
                      {stu.firstName} {stu.lastName}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {stu.programme || 'General Science'} · ID: {stu.studentNumber}
                    </div>
                  </div>
                </div>

                <div className="text-right tabular-nums">
                  <span className="font-black text-amber-300 text-xs">
                    {idx === 0 ? '94.2% (1st)' : idx === 1 ? '88.6% (2nd)' : '82.0% (3rd)'}
                  </span>
                  <span className="block text-[10px] text-emerald-300/90 mt-0.5">Grade 1 / A1 Track</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Institutional Research & Journal Press Spotlight */}
      <div className="bg-gradient-to-r from-indigo-950/75 via-slate-900/95 to-violet-950/70 border border-indigo-500/35 rounded-2xl p-5 sm:p-6 text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-sky-300 font-semibold">
              <BookOpenCheck className="w-4 h-4 text-amber-300" />
              <span>Institutional Press · Contribution to Knowledge</span>
            </div>
            <h3 className="font-bold text-base text-white">
              {school.name} Research &amp; Journal Repository
            </h3>
            <p className="text-xs text-slate-300">
              Original research and peer-reviewed journal articles published by faculty and student authors for the school community and the wider world.
            </p>
          </div>
          <button
            onClick={() => setActiveModule('research-journal')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-auto whitespace-nowrap shadow-md"
          >
            <Globe className="w-3.5 h-3.5 text-sky-200" />
            <span>Open Journal Press ({researchArticles.length})</span>
          </button>
        </div>

        {researchArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-indigo-500/25">
            {researchArticles.slice(0, 2).map((art) => (
              <div
                key={art.id}
                onClick={() => setActiveModule('research-journal')}
                className="p-4 rounded-xl bg-slate-950/60 border border-indigo-500/25 hover:border-sky-400/50 transition cursor-pointer space-y-2 group"
              >
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="text-sky-300 font-semibold">{art.category}</span>
                  <span>·</span>
                  <span>{art.publicationDate}</span>
                  <span>·</span>
                  <span className="font-mono tabular-nums text-amber-300">{art.viewsCount} reads</span>
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-sky-300 transition line-clamp-2 leading-snug">
                  {art.title}
                </h4>
                <p className="text-[11px] text-slate-300 truncate">
                  By {art.authors.map((a) => a.name).join(', ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
