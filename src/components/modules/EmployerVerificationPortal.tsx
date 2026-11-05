import React, { useState, useEffect } from 'react';
import {
  useSchool,
  PublicCredentialVerificationResult,
} from '../../context/SchoolContext';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  ArrowLeft,
  Layers,
  Users,
  Download,
  Printer,
  Lock,
  Building2,
  Award,
  FileSpreadsheet,
} from 'lucide-react';

interface EmployerVerificationPortalProps {
  publicStandaloneMode?: boolean;
  initialQuery?: string;
  onBackToLogin?: () => void;
}

export const EmployerVerificationPortal: React.FC<EmployerVerificationPortalProps> = ({
  publicStandaloneMode = false,
  initialQuery = '',
  onBackToLogin,
}) => {
  const {
    verifyCredentialPublic,
    verifyCredentialPublicAsync,
    verifyCredentialsBatch,
    allPublicDirectoryGraduates,
    samplePublicCredentials,
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'directory'>('single');

  // Single Verification State
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [verifierOrg, setVerifierOrg] = useState('');
  const [verifierContact, setVerifierContact] = useState('');
  const [verifierPurpose, setVerifierPurpose] = useState('Pre-employment Credential Verification');
  const [singleResult, setSingleResult] = useState<PublicCredentialVerificationResult | null>(null);
  const [sessionHistory, setSessionHistory] = useState<PublicCredentialVerificationResult[]>([]);

  // Batch Verification State
  const [batchOrg, setBatchOrg] = useState('Deloitte West Africa — Talent Vetting');
  const [batchContact, setBatchContact] = useState('hr.screening@deloitte.com.gh');
  const [batchPurpose, setBatchPurpose] = useState('Graduate Recruitment Cohort Verification (Consent Obtained)');
  const [batchRawInput, setBatchRawInput] = useState('');
  const [batchResults, setBatchResults] = useState<PublicCredentialVerificationResult[]>([]);

  // Public Graduate Directory Search State
  const [dirSearch, setDirSearch] = useState('');
  const [dirYearFilter, setDirYearFilter] = useState<string>('All');

  // Auto-run verification if ?verify= URL parameter or initialQuery is provided
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlVerify = params.get('verify') || initialQuery;
    if (urlVerify && urlVerify.trim()) {
      const target = urlVerify.trim();
      setQueryInput(target);
      const res = verifyCredentialPublic(target, {
        organization: 'QR Scan / Direct Verification Link',
        purpose: 'Public QR Authenticity Lookup',
      });
      setSingleResult(res);
      setSessionHistory((prev) => [res, ...prev.slice(0, 14)]);

      verifyCredentialPublicAsync(target, {
        organization: 'QR Scan / Direct Verification Link',
        purpose: 'Public QR Authenticity Lookup',
      })
        .then((cloudRes) => {
          if (cloudRes.found) {
            setSingleResult(cloudRes);
            setSessionHistory((prev) => [
              cloudRes,
              ...prev.filter((h) => h.queriedReference !== cloudRes.queriedReference).slice(0, 14),
            ]);
          }
        })
        .catch((err) => console.error('Cloud QR verification lookup error:', err));
    }
  }, [initialQuery]);

  const handleSingleVerify = (e?: React.FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault();
    const target = (overrideCode ?? queryInput).trim();
    if (!target) return;
    if (overrideCode) setQueryInput(overrideCode);

    const meta = {
      organization: verifierOrg || 'Public Employer Portal',
      contactName: verifierContact || 'External Verifier',
      purpose: verifierPurpose,
      mode: 'Single Lookup / QR Scan' as const,
    };

    const res = verifyCredentialPublic(target, meta);
    setSingleResult(res);
    setSessionHistory((prev) => [res, ...prev.filter((h) => h.queriedReference !== res.queriedReference).slice(0, 14)]);

    verifyCredentialPublicAsync(target, meta)
      .then((cloudRes) => {
        if (cloudRes.found) {
          setSingleResult(cloudRes);
          setSessionHistory((prev) => [
            cloudRes,
            ...prev.filter((h) => h.queriedReference !== cloudRes.queriedReference).slice(0, 14),
          ]);
        }
      })
      .catch((err) => console.error('Cloud single verification lookup error:', err));
  };

  const handleRunBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const codes = batchRawInput
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (codes.length === 0) return;

    const results = verifyCredentialsBatch(codes, {
      organization: batchOrg,
      contactName: batchContact,
      purpose: batchPurpose,
    });
    setBatchResults(results);
    setSessionHistory((prev) => [...results, ...prev].slice(0, 25));
  };

  const handleLoadSampleBatch = () => {
    const sampleLines = samplePublicCredentials.map((s) => s.certificateNumber);
    sampleLines.push('UNKNOWN-FAKE-9999');
    setBatchRawInput(sampleLines.join('\n'));
  };

  const handleExportBatchCSV = () => {
    if (batchResults.length === 0) return;
    const headers = [
      'Queried Reference',
      'Status',
      'Certificate Serial',
      'Recipient Name',
      'Issuing Institution',
      'Qualification Awarded',
      'Level Completed',
      'Issue Date',
      'Verified Timestamp',
    ];
    const rows = batchResults.map((r) => [
      r.queriedReference,
      r.found ? r.status || '' : 'NOT FOUND',
      r.certificateNumber || '—',
      r.recipientFullName || '—',
      r.issuingInstitutionName || '—',
      r.qualificationAwarded || '—',
      r.levelCompletedLabel || '—',
      r.issueDate || '—',
      r.verifiedAt,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credential_verification_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintConfirmation = () => {
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

  const renderStatusBadge = (status?: string, found = true) => {
    if (!found) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/90 border border-rose-700 text-rose-300 text-xs font-bold">
          <XCircle className="w-4 h-4 text-rose-400" />
          UNVERIFIED / NOT FOUND
        </span>
      );
    }
    switch (status) {
      case 'Valid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/90 border border-emerald-600 text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            AUTHENTIC &amp; VALID
          </span>
        );
      case 'Pending Approval':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/90 border border-amber-600 text-amber-300 text-xs font-bold">
            <Clock className="w-4 h-4 text-amber-400" />
            PENDING FINAL APPROVAL
          </span>
        );
      case 'Revoked':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/90 border border-rose-600 text-rose-300 text-xs font-bold">
            <XCircle className="w-4 h-4 text-rose-400" />
            REVOKED CREDENTIAL
          </span>
        );
      case 'Replaced':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-950/90 border border-blue-600 text-blue-300 text-xs font-bold">
            <RefreshCw className="w-4 h-4 text-blue-400" />
            REPLACED BY NEWER SERIAL
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/90 border border-amber-700 text-amber-300 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            EXPIRED CREDENTIAL
          </span>
        );
      default:
        return null;
    }
  };

  const filteredDirectory = allPublicDirectoryGraduates.filter((g) => {
    const matchesText =
      `${g.fullName} ${g.qualificationAwarded} ${g.programmeTitle} ${g.institutionName} ${g.certificateNumber}`
        .toLowerCase()
        .includes(dirSearch.toLowerCase());
    const matchesYear = dirYearFilter === 'All' || String(g.graduationYear) === dirYearFilter;
    return matchesText && matchesYear;
  });

  const availableYears = Array.from(new Set(allPublicDirectoryGraduates.map((g) => String(g.graduationYear)))).sort(
    (a, b) => Number(b) - Number(a)
  );

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-start gap-3">
          {publicStandaloneMode && onBackToLogin && (
            <button
              type="button"
              onClick={() => {
                // Clean ?verify param if present so returning to login works cleanly
                if (window.location.search.includes('verify=')) {
                  window.history.replaceState({}, '', window.location.pathname);
                }
                onBackToLogin();
              }}
              className="mt-0.5 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Back to Institution Sign-In"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Employer &amp; Third-Party Credential Verification Portal
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant cryptographic serial &amp; QR verification across accredited schools, colleges, and professional institutes.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'single' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Single / QR Verify</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'batch' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Employer Batch Verify</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'directory' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Graduate Directory ({allPublicDirectoryGraduates.length})</span>
          </button>
        </div>
      </div>

      {/* Privacy & Data Minimization Assurance Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-300">
        <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-white">Data Minimization &amp; Audit Logging:</strong> Every verification request is timestamped in the issuing institution’s security audit register. Verification results confirm credential authenticity, issuing authority, qualification, level, and validity status ONLY — confidential student grades, continuous assessment marks, fee records, and private contact details are never exposed.
        </p>
      </div>

      {/* TAB 1: SINGLE CREDENTIAL / QR VERIFICATION */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <form
              onSubmit={(e) => handleSingleVerify(e)}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs"
            >
              <div>
                <h2 className="font-bold text-sm text-white">Verify Individual Certificate</h2>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Enter the Certificate Serial Number or Digital Verification Code printed beneath the QR code.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Certificate Serial No. or Verification Code *
                </label>
                <input
                  type="text"
                  required
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value.toUpperCase())}
                  placeholder="e.g. CITLFA-2025-L3-00108 or VRF-9K4M-772A"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase focus:outline-none focus:border-emerald-500 tabular-nums"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">
                    Employer / Organisation (Optional)
                  </label>
                  <input
                    type="text"
                    value={verifierOrg}
                    onChange={(e) => setVerifierOrg(e.target.value)}
                    placeholder="e.g. KPMG Ghana HR"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">
                    Verification Purpose
                  </label>
                  <select
                    value={verifierPurpose}
                    onChange={(e) => setVerifierPurpose(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Pre-employment Credential Verification">Employment Screening</option>
                    <option value="Postgraduate Admission Check">Academic Admission</option>
                    <option value="Professional Body Induction">Professional Body Induction</option>
                    <option value="Regulatory / Embassy Compliance">Embassy / Regulatory Check</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Credential Authenticity</span>
              </button>

              {/* Quick Sample Credentials to Test Different Statuses */}
              {samplePublicCredentials.length > 0 && (
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Quick-Test Registry Records (Valid, Pending &amp; Revoked):
                  </span>
                  <div className="space-y-1.5">
                    {samplePublicCredentials.map((item) => (
                      <button
                        key={item.certificateNumber}
                        type="button"
                        onClick={() => handleSingleVerify(undefined, item.certificateNumber)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-mono font-bold text-white block truncate tabular-nums">
                            {item.certificateNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {item.label} • {item.institutionCode}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${
                            item.status === 'Valid'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : item.status === 'Revoked'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right Result Display */}
          <div className="lg:col-span-7">
            {singleResult ? (
              <div
                id="printable-document-container"
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 text-xs print:bg-white print:text-slate-900 print:border-slate-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 print:border-slate-300">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 print:text-slate-600 block tabular-nums">
                      Verified At: {singleResult.verifiedAt}
                    </span>
                    <h3 className="text-base font-bold text-white print:text-slate-950 mt-0.5">
                      Official Credential Verification Report
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(singleResult.status, singleResult.found)}
                    <button
                      type="button"
                      onClick={handlePrintConfirmation}
                      className="print:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer whitespace-nowrap"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Slip</span>
                    </button>
                  </div>
                </div>

                {!singleResult.found ? (
                  <div className="p-5 rounded-xl bg-rose-950/40 border border-rose-800/70 text-rose-200 space-y-2">
                    <p className="font-bold text-sm text-white">
                      No Matching Credential Found for "{singleResult.queriedReference}"
                    </p>
                    <p className="text-xs leading-relaxed">
                      The queried serial number or digital verification code does not match any credential issued by institutions on this registry. Please double-check the characters or request the official verification link directly from the applicant.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Status Alert if Revoked / Replaced / Pending / Expired */}
                    {singleResult.status !== 'Valid' && (
                      <div
                        className={`p-4 rounded-xl border ${
                          singleResult.status === 'Revoked'
                            ? 'bg-rose-950/60 border-rose-700 text-rose-200'
                            : 'bg-amber-950/60 border-amber-700 text-amber-200'
                        }`}
                      >
                        <p className="font-bold text-xs uppercase tracking-wide">
                          Status Notice: Credential is {singleResult.status}
                        </p>
                        {singleResult.revocationOrStatusReason && (
                          <p className="mt-1 text-xs">{singleResult.revocationOrStatusReason}</p>
                        )}
                        {singleResult.replacedByCertificateNumber && (
                          <p className="mt-1 text-xs font-mono">
                            Superseded by Replacement Certificate:{' '}
                            <button
                              type="button"
                              onClick={() => handleSingleVerify(undefined, singleResult.replacedByCertificateNumber)}
                              className="underline font-bold cursor-pointer"
                            >
                              {singleResult.replacedByCertificateNumber}
                            </button>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Issuing Institution Card */}
                    <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200">
                      {singleResult.issuingInstitutionCrest && (
                        <img
                          src={singleResult.issuingInstitutionCrest}
                          alt={singleResult.issuingInstitutionName}
                          className="w-12 h-12 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                      )}
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-emerald-400 print:text-emerald-800 font-bold block">
                          Issuing Institution
                        </span>
                        <h4 className="font-bold text-sm text-white print:text-slate-950">
                          {singleResult.issuingInstitutionName}
                        </h4>
                        <p className="text-[11px] text-slate-400 print:text-slate-600 font-mono">
                          Institution Code: {singleResult.issuingInstitutionCode}
                        </p>
                      </div>
                    </div>

                    {/* Public Authenticity Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200">
                        <span className="text-slate-400 print:text-slate-500 block">Credential Holder</span>
                        <strong className="text-sm text-white print:text-slate-950 block mt-0.5">
                          {singleResult.recipientFullName}
                        </strong>
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                          ID: {singleResult.candidateNumber}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200">
                        <span className="text-slate-400 print:text-slate-500 block">Certificate Serial &amp; Code</span>
                        <strong className="text-sm font-mono text-emerald-400 print:text-emerald-800 block mt-0.5 tabular-nums">
                          {singleResult.certificateNumber}
                        </strong>
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                          Code: {singleResult.verificationCode}
                        </span>
                      </div>

                      <div className="sm:col-span-2 p-3 rounded-xl bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200">
                        <span className="text-slate-400 print:text-slate-500 block">Qualification Awarded</span>
                        <strong className="text-sm text-white print:text-slate-950 block mt-0.5">
                          {singleResult.qualificationAwarded}
                          {singleResult.honoursOrDistinction ? ` (${singleResult.honoursOrDistinction})` : ''}
                        </strong>
                        <span className="text-xs text-slate-300 print:text-slate-700 block mt-1">
                          Programme: {singleResult.programmeTitle} • {singleResult.levelCompletedLabel}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200">
                        <span className="text-slate-400 print:text-slate-500 block">Date of Issuance</span>
                        <strong className="text-white print:text-slate-950 font-mono tabular-nums block mt-0.5">
                          {singleResult.issueDate}
                        </strong>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200">
                        <span className="text-slate-400 print:text-slate-500 block">Credential Validity / Expiry</span>
                        <strong className="text-white print:text-slate-950 font-mono tabular-nums block mt-0.5">
                          {singleResult.expiryDate ? `Expires ${singleResult.expiryDate}` : 'Permanent / Non-Expiring'}
                        </strong>
                      </div>
                    </div>

                    {/* Awarding Authority vs Professional Body Distinction */}
                    <div className="p-3.5 rounded-xl bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200 space-y-1 text-[11px] text-slate-300 print:text-slate-700">
                      <p>
                        <strong className="text-white print:text-slate-950">Awarding Authority:</strong>{' '}
                        {singleResult.awardingAuthorityName}
                      </p>
                      {singleResult.professionalBodyAffiliationNote && (
                        <p className="text-slate-400 print:text-slate-600">
                          <strong className="text-emerald-400 print:text-emerald-800">Professional Body Distinction:</strong>{' '}
                          {singleResult.professionalBodyAffiliationNote}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
                <Award className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">Ready to Verify Any Issued Credential</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Enter a certificate serial number or digital verification code on the left, scan a graduate’s printed QR code, or select a sample record to view the authenticity report.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EMPLOYER BATCH VERIFICATION & CONFIRMATION REPORTS */}
      {activeTab === 'batch' && (
        <div className="space-y-6">
          <form
            onSubmit={handleRunBatch}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs"
          >
            <div className="lg:col-span-5 space-y-3">
              <div>
                <h2 className="font-bold text-sm text-white">Employer Batch Credential Screening</h2>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Verify up to 50 applicant certificate numbers in one audit-logged batch and export a signed confirmation report.
                </p>
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Verifying Organisation *</label>
                <input
                  type="text"
                  required
                  value={batchOrg}
                  onChange={(e) => setBatchOrg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Authorised Officer / Email *</label>
                <input
                  type="text"
                  required
                  value={batchContact}
                  onChange={(e) => setBatchContact(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Legal Basis &amp; Purpose *</label>
                <input
                  type="text"
                  required
                  value={batchPurpose}
                  onChange={(e) => setBatchPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-300">
                    Certificate Serial Numbers / Verification Codes (One per line or comma-separated) *
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSampleBatch}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer whitespace-nowrap"
                  >
                    Load Sample Applicant Batch
                  </button>
                </div>
                <textarea
                  required
                  rows={6}
                  value={batchRawInput}
                  onChange={(e) => setBatchRawInput(e.target.value)}
                  placeholder={'CITLFA-2025-L3-00108\nCITLFA-2025-L1-00089\nCITLFA-2024-L2-00031'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-white focus:outline-none focus:border-emerald-500 tabular-nums"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {batchResults.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleExportBatchCSV}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download CSV Confirmation</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintConfirmation}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer whitespace-nowrap"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Report</span>
                    </button>
                  </>
                )}
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Execute Batch Verification</span>
                </button>
              </div>
            </div>
          </form>

          {batchResults.length > 0 && (
            <div
              id="printable-document-container"
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden print:bg-white print:text-slate-900 print:border-slate-300"
            >
              <div className="px-5 py-3.5 bg-slate-950 print:bg-slate-100 border-b border-slate-800 print:border-slate-300 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white print:text-slate-950">
                    Batch Verification Confirmation Report — {batchOrg}
                  </span>
                  <span className="block text-[11px] text-slate-400 print:text-slate-600">
                    Officer: {batchContact} • Purpose: {batchPurpose}
                  </span>
                </div>
                <span className="font-mono text-emerald-400 print:text-emerald-800 font-bold tabular-nums">
                  {batchResults.filter((r) => r.found && r.status === 'Valid').length} / {batchResults.length} Valid
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead className="bg-slate-950/70 print:bg-slate-50 text-slate-400 print:text-slate-700 uppercase text-[10px] font-bold border-b border-slate-800 print:border-slate-300">
                    <tr>
                      <th className="py-3 px-4">Queried Code</th>
                      <th className="py-3 px-4">Recipient Name</th>
                      <th className="py-3 px-4">Issuing Institution</th>
                      <th className="py-3 px-4">Qualification &amp; Stage</th>
                      <th className="py-3 px-3">Issued</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                    {batchResults.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-mono font-bold text-white print:text-slate-900">
                          {r.queriedReference}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-200 print:text-slate-900">
                          {r.recipientFullName || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300 print:text-slate-700">
                          {r.issuingInstitutionName || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300 print:text-slate-700">
                          {r.qualificationAwarded ? (
                            <>
                              <span className="font-semibold text-white print:text-slate-900 block">
                                {r.qualificationAwarded}
                              </span>
                              <span className="text-[10px] text-slate-400 print:text-slate-600">
                                {r.levelCompletedLabel}
                              </span>
                            </>
                          ) : (
                            'No matching credential'
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400 print:text-slate-700">
                          {r.issueDate || '—'}
                        </td>
                        <td className="py-2.5 px-4">{renderStatusBadge(r.status, r.found)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {sessionHistory.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs">
              <h4 className="font-bold text-slate-300 mb-2">Recent Session Verification History ({sessionHistory.length})</h4>
              <div className="flex flex-wrap gap-2">
                {sessionHistory.slice(0, 8).map((h, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveTab('single');
                      setSingleResult(h);
                      setQueryInput(h.queriedReference);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 font-mono text-[11px] text-slate-300 cursor-pointer tabular-nums"
                  >
                    {h.queriedReference} • {h.found ? h.status : 'Not Found'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONSENT-BASED PUBLIC GRADUATE DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={dirSearch}
                onChange={(e) => setDirSearch(e.target.value)}
                placeholder="Search consented graduates by name, qualification, programme, or institution..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Graduation Year:</span>
              <select
                value={dirYearFilter}
                onChange={(e) => setDirYearFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 tabular-nums"
              >
                <option value="All">All Years</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-white">
                Consent-Opted Public Alumni &amp; Qualified Practitioners Directory
              </span>
              <span className="text-[11px] text-slate-400">
                Only displays graduates who enabled Directory Consent in their Graduate Portal
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tabular-nums">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Graduate</th>
                    <th className="py-3 px-4">Awarding Institution</th>
                    <th className="py-3 px-4">Qualification &amp; Programme</th>
                    <th className="py-3 px-3 text-right">Year</th>
                    <th className="py-3 px-4">Membership / Designation</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredDirectory.length > 0 ? (
                    filteredDirectory.map((grad) => (
                      <tr key={grad.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={grad.photo}
                              alt={grad.fullName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                            <div>
                              <span className="font-bold text-white block">{grad.fullName}</span>
                              {grad.currentEmployerOrRole && (
                                <span className="text-[10px] text-slate-400 block">{grad.currentEmployerOrRole}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{grad.institutionName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white block">{grad.qualificationAwarded}</span>
                          <span className="text-[10px] text-slate-400">{grad.levelAttained}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          {grad.graduationYear}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-300">
                          {grad.professionalBodyDesignation || grad.membershipStatus}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('single');
                              handleSingleVerify(undefined, grad.certificateNumber);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-bold text-[11px] cursor-pointer whitespace-nowrap"
                          >
                            Verify ({grad.certificateNumber})
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No consented public graduate profiles match your search criteria. Graduates who opt out of public search can still provide their individual certificate serial number directly.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
