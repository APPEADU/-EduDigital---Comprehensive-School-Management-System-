import React, { useMemo, useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { BiometricGateLog, isInstituteLevelType } from '../../types';
import {
  ShieldCheck,
  Scan,
  UserCheck,
  AlertTriangle,
  DoorOpen,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react';

export const BiometricGateModule: React.FC = () => {
  const {
    school,
    students,
    candidates,
    biometricGateLogs,
    recordBiometricGateEvent,
    setActiveModule,
  } = useSchool();

  const isInst = isInstituteLevelType(school.levelType);
  const todayIso = new Date().toISOString().split('T')[0];

  const rosterOptions = useMemo(() => {
    if (isInst && candidates.length > 0) {
      return candidates.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        identifier: c.candidateNumber,
        role: 'Candidate' as const,
        guardianName: undefined,
      }));
    }
    return students.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      identifier: s.studentNumber,
      role: 'Student' as const,
      guardianName: s.guardianName,
    }));
  }, [isInst, candidates, students]);

  const [selectedPersonId, setSelectedPersonId] = useState<string>(rosterOptions[0]?.id || '');
  const [scanDirection, setScanDirection] = useState<'Ingress (Entry)' | 'Egress (Exit)'>('Ingress (Entry)');
  const [scanMethod, setScanMethod] = useState<
    'Facial Recognition' | 'Biometric Fingerprint' | 'RFID Turnstile'
  >('RFID Turnstile');
  const [gateLocation, setGateLocation] = useState('Turnstile A (Main Campus Gate)');
  const [scanOutcome, setScanOutcome] = useState<'Authorized' | 'Denied'>('Authorized');
  const [failureReason, setFailureReason] = useState(
    'Fingerprint template mismatch (3 consecutive failed retries)'
  );
  const [feedFilter, setFeedFilter] = useState<'today' | 'authorized' | 'denied' | 'all'>('today');

  // Parent pickup PIN verifier
  const [pickupCodeInput, setPickupCodeInput] = useState('7492');
  const [pickupVerificationResult, setPickupVerificationResult] = useState<{
    matched: boolean;
    studentName: string;
    guardianName?: string;
    guardianPhone?: string;
    relationship?: string;
    message: string;
  } | null>(null);

  const todayLogs = useMemo(
    () => biometricGateLogs.filter((l) => l.date === todayIso),
    [biometricGateLogs, todayIso]
  );

  const displayedLogs = useMemo(() => {
    if (feedFilter === 'authorized') {
      return todayLogs.filter((l) => l.status === 'Authorized');
    }
    if (feedFilter === 'denied') {
      return todayLogs.filter((l) => l.status === 'Denied');
    }
    if (feedFilter === 'today') {
      return todayLogs;
    }
    return biometricGateLogs;
  }, [biometricGateLogs, todayLogs, feedFilter]);

  const authorizedTodayCount = todayLogs.filter((l) => l.status === 'Authorized').length;
  const deniedTodayCount = todayLogs.filter((l) => l.status === 'Denied').length;

  const handleSimulateScan = () => {
    if (scanOutcome === 'Denied') {
      const codePrefix = (school.code || 'SCH').split('-')[0];
      recordBiometricGateEvent({
        personName:
          scanMethod === 'RFID Turnstile'
            ? 'Unregistered Card Holder'
            : 'Unmatched Biometric Scan',
        personIdentifier:
          scanMethod === 'RFID Turnstile' ? `RFID-${Math.floor(1000 + Math.random() * 9000)}-${codePrefix}` : 'BIO-SENSOR-ALERT',
        personRole: 'Visitor / Guardian',
        gateName: gateLocation,
        direction: scanDirection,
        method: scanMethod,
        status: 'Denied',
        failureReason,
      });
      return;
    }

    const person = rosterOptions.find((p) => p.id === selectedPersonId) || rosterOptions[0];
    if (!person) return;

    const logPayload: Omit<BiometricGateLog, 'id' | 'schoolId' | 'date' | 'timestamp'> = {
      personName: person.name,
      personIdentifier: person.identifier,
      personRole: person.role,
      gateName: gateLocation,
      direction: scanDirection,
      method: scanMethod,
      status: 'Authorized',
      guardianName: person.guardianName,
    };

    recordBiometricGateEvent(logPayload);
  };

  const handleVerifyParentPickup = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudent = students[0];
    const cleanPin = pickupCodeInput.trim();

    if (cleanPin === '7492' && targetStudent) {
      recordBiometricGateEvent({
        personName: `${targetStudent.firstName} ${targetStudent.lastName}`,
        personIdentifier: targetStudent.studentNumber,
        personRole: 'Student',
        gateName: 'Turnstile A (Main Campus Gate)',
        direction: 'Egress (Exit)',
        method: 'Guardian QR Pass',
        status: 'Authorized',
        guardianName: targetStudent.guardianName,
      });
      setPickupVerificationResult({
        matched: true,
        studentName: `${targetStudent.firstName} ${targetStudent.lastName}`,
        guardianName: targetStudent.guardianName,
        guardianPhone: targetStudent.guardianPhone,
        relationship: targetStudent.guardianRelationship,
        message: 'Guardian PIN verified and exit logged.',
      });
    } else {
      recordBiometricGateEvent({
        personName: 'Unauthorized Pickup Attempt',
        personIdentifier: `PIN-${cleanPin || '0000'}`,
        personRole: 'Visitor / Guardian',
        gateName: 'Turnstile A (Main Campus Gate)',
        direction: 'Egress (Exit)',
        method: 'Guardian QR Pass',
        status: 'Denied',
        failureReason: `Invalid 4-digit guardian pickup PIN (${cleanPin || 'empty'}) entered at gate terminal`,
      });
      setPickupVerificationResult({
        matched: false,
        studentName: targetStudent ? `${targetStudent.firstName} ${targetStudent.lastName}` : 'Learner',
        message: 'Invalid pickup PIN. Access attempt flagged and recorded in today’s security log.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => setActiveModule('dashboard')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Biometric Turnstiles &amp; Campus Perimeter Access
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {school.name} · Optical turnstile clocking, failed access alerts, and guardian release PIN verification.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-300">
          <div>
            <span className="text-slate-400">Authorized Today: </span>
            <strong className="font-mono text-emerald-400">{authorizedTodayCount}</strong>
          </div>
          <span className="text-slate-700" aria-hidden="true">·</span>
          <div>
            <span className="text-slate-400">Failed Attempts Today: </span>
            <strong className="font-mono text-rose-400">{deniedTodayCount}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Ingress & Failed Attempts Feed */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Perimeter Turnstile Audit Feed ({displayedLogs.length})
              </h3>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setFeedFilter('today')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                  feedFilter === 'today' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Today ({todayLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('authorized')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                  feedFilter === 'authorized' ? 'bg-slate-800 text-emerald-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Successful ({authorizedTodayCount})
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('denied')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                  feedFilter === 'denied' ? 'bg-slate-800 text-rose-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Failed ({deniedTodayCount})
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                  feedFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All History
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Date &amp; Time</th>
                  <th className="py-2.5 px-3">Person / Reference</th>
                  <th className="py-2.5 px-3">Gate &amp; Direction</th>
                  <th className="py-2.5 px-3">Sensor</th>
                  <th className="py-2.5 px-3">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {displayedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                      <div>{log.timestamp}</div>
                      <div className="text-[10px] text-slate-500">{log.date}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{log.personName}</div>
                      <div className="text-[11px] text-slate-500">
                        <span className="font-mono">{log.personIdentifier}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{log.personRole}</span>
                      </div>
                      {log.status === 'Denied' && log.failureReason && (
                        <div className="text-[11px] text-rose-400 mt-0.5">{log.failureReason}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-300">{log.gateName}</div>
                      <div
                        className={`text-[11px] ${
                          log.direction.includes('Entry') ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {log.direction}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{log.method}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {log.status === 'Authorized' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Authorized</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-rose-400 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Failed / Denied</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Simulator & PIN Verification */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Scan className="w-4 h-4 text-emerald-400" />
              Record / Simulate Gate Sensor Event
            </h4>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Event Outcome</label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setScanOutcome('Authorized')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                    scanOutcome === 'Authorized'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Successful Entry
                </button>
                <button
                  type="button"
                  onClick={() => setScanOutcome('Denied')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                    scanOutcome === 'Denied'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Failed Attempt
                </button>
              </div>
            </div>

            {scanOutcome === 'Authorized' ? (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Select {isInst ? 'Candidate' : 'Student'}
                </label>
                <select
                  value={selectedPersonId}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {rosterOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.identifier})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Denial / Alert Reason</label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Fingerprint template mismatch (3 consecutive failed retries)">
                    Fingerprint template mismatch
                  </option>
                  <option value="Deactivated or unregistered RFID credential presented at turnstile">
                    Unregistered / Deactivated RFID Card
                  </option>
                  <option value="Facial liveness check failed at optical camera">
                    Facial liveness verification failed
                  </option>
                  <option value="Anti-passback / tailgating alert triggered on Turnstile A">
                    Tailgating / Anti-passback alert
                  </option>
                </select>
              </div>
            )}

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Gate Terminal</label>
              <select
                value={gateLocation}
                onChange={(e) => setGateLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              >
                <option value="Turnstile A (Main Campus Gate)">Turnstile A (Main Campus Gate)</option>
                <option value="Turnstile B (Administration Wing)">Turnstile B (Administration Wing)</option>
                <option value="Turnstile C (Boarding / Hostel Annex)">Turnstile C (Boarding / Hostel Annex)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Direction</label>
                <select
                  value={scanDirection}
                  onChange={(e) => setScanDirection(e.target.value as 'Ingress (Entry)' | 'Egress (Exit)')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                >
                  <option value="Ingress (Entry)">Ingress (Entry)</option>
                  <option value="Egress (Exit)">Egress (Exit)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Biometric Sensor</label>
                <select
                  value={scanMethod}
                  onChange={(e) =>
                    setScanMethod(
                      e.target.value as 'Facial Recognition' | 'Biometric Fingerprint' | 'RFID Turnstile'
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                >
                  <option value="RFID Turnstile">RFID Turnstile</option>
                  <option value="Biometric Fingerprint">Fingerprint Sensor</option>
                  <option value="Facial Recognition">Facial Camera</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSimulateScan}
              className={`w-full py-2 px-4 rounded-lg text-xs font-bold text-white transition flex items-center justify-center gap-1.5 cursor-pointer ${
                scanOutcome === 'Authorized'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              {scanOutcome === 'Authorized' ? 'Log Authorized Gate Scan' : 'Log Failed Access Attempt'}
            </button>
          </div>

          {!isInst && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                Guardian Pickup PIN Verifier
              </h4>
              <p className="text-[11px] text-slate-400">
                Verify 4-digit guardian PIN before releasing a learner (valid demo PIN: <span className="font-mono text-slate-200">7492</span>; any other PIN logs a failed attempt).
              </p>

              <form onSubmit={handleVerifyParentPickup} className="space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  value={pickupCodeInput}
                  onChange={(e) => setPickupCodeInput(e.target.value)}
                  aria-label="Guardian Pickup PIN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-base font-mono font-bold tracking-widest text-emerald-400 focus:outline-none focus:border-cyan-500"
                />

                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Verify Guardian PIN
                </button>
              </form>

              {pickupVerificationResult && (
                <div className="pt-3 border-t border-slate-800 space-y-1 text-xs">
                  {pickupVerificationResult.matched ? (
                    <>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        <span>Authorized Guardian Match</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        {pickupVerificationResult.guardianName} ({pickupVerificationResult.relationship}) · {pickupVerificationResult.guardianPhone}
                      </p>
                      <p className="text-[11px] text-slate-400">{pickupVerificationResult.message}</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                        <XCircle className="w-4 h-4" />
                        <span>Pickup Denied &amp; Flagged</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{pickupVerificationResult.message}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
