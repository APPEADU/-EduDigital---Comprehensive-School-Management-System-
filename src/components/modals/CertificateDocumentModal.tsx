import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  IssuedCredential,
  CertificateTemplateConfig,
  CandidateCourseAssessment,
  ProgrammeCourse,
} from '../../types';
import { useSchool } from '../../context/SchoolContext';
import { buildPublicShareUrl } from '../../utils/shareUrl';
import {
  Printer,
  X,
  Award,
  FileText,
  MailCheck,
  ShieldCheck,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface CertificateDocumentModalProps {
  credential: IssuedCredential | null;
  initialDocMode?: 'certificate' | 'transcript' | 'letter' | 'badge';
  onClose: () => void;
}

export const CertificateDocumentModal: React.FC<CertificateDocumentModalProps> = ({
  credential,
  initialDocMode = 'certificate',
  onClose,
}) => {
  const {
    school,
    certificateTemplates,
    candidateAssessments,
    programmeCourses,
    signatories,
  } = useSchool();

  const [docMode, setDocMode] = useState<'certificate' | 'transcript' | 'letter' | 'badge'>(initialDocMode);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setDocMode(initialDocMode);
  }, [initialDocMode, credential?.id]);

  const verificationUrl = credential
    ? buildPublicShareUrl(`?verify=${encodeURIComponent(credential.certificateNumber)}`)
    : '';

  useEffect(() => {
    if (!credential) return;
    let mounted = true;
    QRCode.toDataURL(verificationUrl, {
      width: 180,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (mounted) setQrDataUrl(url);
      })
      .catch((err) => console.error('QR generation failed', err));
    return () => {
      mounted = false;
    };
  }, [credential, verificationUrl]);

  if (!credential) return null;

  const template: CertificateTemplateConfig =
    certificateTemplates.find((t) => t.id === credential.templateId) ||
    certificateTemplates[0] || {
      id: 'default',
      schoolId: school.id,
      name: 'Standard Official Template',
      themeStyle: 'royal-navy',
      orientation: 'landscape',
      headerSubtitle: 'Official Academic & Professional Credential',
      sealLabel: `OFFICIAL SEAL • ${credential.schoolCode}`,
      showQrCode: true,
      showCandidateId: true,
      showLevelCompleted: true,
      showCreditHours: true,
      showAuthorityDisclaimer: true,
      authorityDisclaimerText: `Issued under the seal of ${credential.schoolName}. Verify online via serial number or QR scan.`,
    };

  const themePalette = {
    'emerald-gold': {
      outerBorder: 'border-emerald-900',
      innerBorder: 'border-amber-600/70',
      accentText: 'text-emerald-900',
      badgeBg: 'bg-emerald-900 text-amber-200',
      sealBorder: 'border-amber-700 text-amber-800 bg-amber-50',
    },
    'royal-navy': {
      outerBorder: 'border-slate-900',
      innerBorder: 'border-blue-800/60',
      accentText: 'text-blue-950',
      badgeBg: 'bg-slate-900 text-amber-300',
      sealBorder: 'border-blue-900 text-blue-950 bg-blue-50',
    },
    'crimson-charter': {
      outerBorder: 'border-rose-950',
      innerBorder: 'border-amber-700/60',
      accentText: 'text-rose-950',
      badgeBg: 'bg-rose-950 text-amber-200',
      sealBorder: 'border-rose-900 text-rose-900 bg-rose-50',
    },
    'classic-ivory': {
      outerBorder: 'border-stone-800',
      innerBorder: 'border-stone-500',
      accentText: 'text-stone-900',
      badgeBg: 'bg-stone-900 text-stone-100',
      sealBorder: 'border-stone-800 text-stone-800 bg-stone-100',
    },
  }[template.themeStyle];

  const activeSignatories =
    credential.signatoriesSnapshot && credential.signatoriesSnapshot.length > 0
      ? credential.signatoriesSnapshot
      : signatories.slice(0, 2).map((s) => ({
          name: s.name,
          title: s.title,
          signatureDataUrl: s.signatureDataUrl,
        }));

  // Candidate assessments for transcript
  const transcriptRows: { assessment: CandidateCourseAssessment; course?: ProgrammeCourse }[] = candidateAssessments
    .filter((a) => a.candidateId === credential.candidateId)
    .map((a) => ({
      assessment: a,
      course: programmeCourses.find((c) => c.id === a.courseId),
    }))
    .sort((a, b) => a.assessment.levelNumber - b.assessment.levelNumber);

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

  const handleCopyVerificationLink = () => {
    navigator.clipboard?.writeText(verificationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const isNonValid = credential.status !== 'Valid';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Top Action Bar (Hidden in Print) */}
        <div className="print:hidden flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-3.5 bg-slate-950 border-b border-slate-800 text-white">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'certificate', label: 'Official Certificate', icon: Award },
              { id: 'transcript', label: 'Transcript / Results', icon: FileText },
              { id: 'letter', label: 'Completion Letter', icon: MailCheck },
              { id: 'badge', label: 'Digital Badge & Link', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = docMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDocMode(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyVerificationLink}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer whitespace-nowrap"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Verification Link Copied' : 'Copy Employer Verify Link'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Warning Banner if Not Valid */}
        {isNonValid && (
          <div className="print:hidden px-5 py-2.5 bg-amber-950/80 border-b border-amber-700/60 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Credential Status: <strong className="uppercase">{credential.status}</strong>
                {credential.revocationOrStatusReason ? ` — ${credential.revocationOrStatusReason}` : ''}
                {credential.replacedByCertificateNumber ? ` (Superseded by ${credential.replacedByCertificateNumber})` : ''}
              </span>
            </div>
          </div>
        )}

        {/* Printable Document Viewport */}
        <div className="p-4 sm:p-6 bg-slate-900 max-h-[82vh] overflow-y-auto">
          <div id="printable-document-container" className="bg-white text-slate-900 mx-auto shadow-xl">
            {/* 1. OFFICIAL DIGITAL CERTIFICATE */}
            {docMode === 'certificate' && (
              <div
                className={`relative bg-[#fffdf8] p-4 sm:p-6 border-[10px] border-double ${themePalette.outerBorder} ${
                  template.orientation === 'portrait' ? 'max-w-2xl mx-auto' : 'w-full'
                }`}
              >
                {/* Status Watermark Overlay if Revoked / Pending / Replaced / Expired */}
                {isNonValid && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10 overflow-hidden">
                    <span className="text-5xl sm:text-7xl font-black uppercase tracking-widest text-rose-600/18 -rotate-18 border-4 border-rose-600/20 px-8 py-3 rounded-xl select-none">
                      {credential.status}
                    </span>
                  </div>
                )}

                <div className={`border-2 ${themePalette.innerBorder} p-6 sm:p-10 relative`}>
                  {/* Top Serial & Verification Meta Row */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 tabular-nums mb-4">
                    <span>SERIAL NO: <strong className="text-slate-900">{credential.certificateNumber}</strong></span>
                    <span>VERIFY CODE: <strong className="text-slate-900">{credential.verificationCode}</strong></span>
                  </div>

                  {/* Institution Crest & Branding Header */}
                  <div className="text-center space-y-2">
                    <div className="w-20 h-20 mx-auto rounded-full border-2 border-amber-600/70 p-1 bg-white shadow-sm overflow-hidden">
                      <img
                        src={credential.schoolCrest || school.crest}
                        alt={credential.schoolName}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <h1 className={`text-2xl sm:text-3xl font-serif font-extrabold uppercase tracking-wide ${themePalette.accentText}`}>
                      {credential.schoolName}
                    </h1>
                    <p className="text-xs uppercase tracking-widest font-semibold text-slate-500">
                      {template.headerSubtitle}
                    </p>
                    <div className="pt-1">
                      <span className={`inline-block text-[11px] font-bold uppercase tracking-widest px-4 py-1 rounded ${themePalette.badgeBg}`}>
                        {credential.credentialType}
                      </span>
                    </div>
                  </div>

                  {/* Conferral Statement */}
                  <div className="text-center my-7 space-y-3">
                    <p className="text-xs sm:text-sm italic font-serif text-slate-600">
                      This is to certify that
                    </p>
                    <h2 className="text-2xl sm:text-4xl font-serif font-bold text-slate-950 tracking-tight border-b border-slate-300 inline-block px-8 pb-1.5">
                      {credential.recipientFullName}
                    </h2>
                    {template.showCandidateId && (
                      <p className="text-xs font-mono text-slate-600 tabular-nums">
                        Candidate / Student ID: <strong className="text-slate-900">{credential.candidateNumber}</strong>
                      </p>
                    )}

                    <p className="text-xs sm:text-sm text-slate-700 max-w-2xl mx-auto leading-relaxed pt-1">
                      having fulfilled all prescribed academic, continuous assessment, statutory examination, and institutional progression requirements in the programme <strong className="text-slate-950">{credential.programmeTitle}</strong>, was on <strong className="text-slate-950 tabular-nums">{credential.issueDate}</strong> duly awarded the qualification of:
                    </p>

                    <div className="pt-1">
                      <h3 className={`text-lg sm:text-2xl font-serif font-extrabold ${themePalette.accentText}`}>
                        {credential.qualificationAwarded}
                      </h3>
                      <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-xs text-slate-700 font-semibold">
                        {template.showLevelCompleted && (
                          <span>Completed Stage: <strong>{credential.levelCompletedLabel}</strong></span>
                        )}
                        {credential.honoursOrDistinction && (
                          <span>• Classification: <strong className="text-emerald-800">{credential.honoursOrDistinction}</strong></span>
                        )}
                        {template.showCreditHours && credential.creditHoursCompleted > 0 && (
                          <span className="tabular-nums">• Credit Hours: <strong>{credential.creditHoursCompleted} Credits</strong></span>
                        )}
                        {credential.expiryDate && (
                          <span className="tabular-nums">• Valid Through: <strong>{credential.expiryDate}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Signatures, Official Seal & QR Verification Footer */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pt-6 border-t border-slate-200">
                    {/* Authorised Signatories */}
                    <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {activeSignatories.slice(0, 3).map((sig, idx) => (
                        <div key={idx} className="text-center">
                          <div className="h-14 flex items-end justify-center">
                            {sig.signatureDataUrl ? (
                              <img
                                src={sig.signatureDataUrl}
                                alt={sig.name}
                                className="max-h-14 max-w-[180px] object-contain"
                              />
                            ) : (
                              <span className="font-serif italic text-lg font-bold text-slate-800">
                                {sig.name}
                              </span>
                            )}
                          </div>
                          <div className="border-t border-slate-800 pt-1 mt-0.5">
                            <p className="text-xs font-bold text-slate-900">{sig.name}</p>
                            <p className="text-[10px] text-slate-600">{sig.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Seal + QR Code */}
                    <div className="md:col-span-5 flex items-center justify-around sm:justify-end gap-4">
                      <div
                        className={`w-24 h-24 rounded-full border-2 border-dashed ${themePalette.sealBorder} flex flex-col items-center justify-center p-2 text-center shrink-0`}
                      >
                        <ShieldCheck className="w-5 h-5 mb-0.5" />
                        <span className="text-[8px] font-black uppercase tracking-wider leading-tight">
                          {template.sealLabel}
                        </span>
                        <span className="text-[8px] font-mono mt-0.5 tabular-nums">{credential.issueDate.slice(0, 4)}</span>
                      </div>

                      {template.showQrCode && qrDataUrl && (
                        <div className="flex flex-col items-center border border-slate-300 bg-white p-1.5 rounded shrink-0">
                          <img src={qrDataUrl} alt="Scan to Verify Credential" className="w-20 h-20" />
                          <span className="text-[8px] font-mono uppercase tracking-wider text-slate-600 mt-0.5">
                            Scan to Verify
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Authority Distinction & Public Verification Footnote */}
                  {template.showAuthorityDisclaimer && (
                    <div className="mt-5 pt-3 border-t border-slate-200 text-[10px] text-slate-500 leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="flex-1">
                        <strong>Awarding Authority:</strong> {credential.awardingAuthorityName}.{' '}
                        {credential.professionalBodyAffiliationNote || template.authorityDisclaimerText}
                      </p>
                      <span className="font-mono text-[9px] text-slate-600 shrink-0 tabular-nums">
                        Status: {credential.status.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. OFFICIAL ACADEMIC TRANSCRIPT / STATEMENT OF RESULTS */}
            {docMode === 'transcript' && (
              <div className="p-8 bg-white text-slate-900 border border-slate-300 space-y-6">
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                  <div className="flex items-center gap-4">
                    <img
                      src={credential.schoolCrest || school.crest}
                      alt={credential.schoolName}
                      className="w-16 h-16 rounded-full object-cover border border-slate-800"
                    />
                    <div>
                      <h1 className="text-xl font-serif font-extrabold uppercase text-slate-950">
                        {credential.schoolName}
                      </h1>
                      <p className="text-xs text-slate-600">{school.address} • {school.email}</p>
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded">
                        Official Academic Transcript &amp; Statement of Results
                      </span>
                    </div>
                  </div>
                  {qrDataUrl && (
                    <div className="text-right">
                      <img src={qrDataUrl} alt="Verify" className="w-16 h-16 ml-auto border border-slate-200 p-0.5" />
                      <span className="text-[9px] font-mono text-slate-500 block tabular-nums">
                        {credential.verificationCode}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs">
                  <div>
                    <span className="text-slate-500 block">Candidate Name</span>
                    <strong className="text-slate-900">{credential.recipientFullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Candidate / Student ID</span>
                    <strong className="font-mono text-slate-900 tabular-nums">{credential.candidateNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Programme</span>
                    <strong className="text-slate-900">{credential.programmeTitle}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Linked Credential Serial</span>
                    <strong className="font-mono text-slate-900 tabular-nums">{credential.certificateNumber}</strong>
                  </div>
                </div>

                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs tabular-nums">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="py-2.5 px-3">Level</th>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Course / Paper Title</th>
                        <th className="py-2.5 px-2 text-right">Credits</th>
                        <th className="py-2.5 px-2 text-right">CA</th>
                        <th className="py-2.5 px-2 text-right">Exam</th>
                        <th className="py-2.5 px-2 text-right">Total %</th>
                        <th className="py-2.5 px-3">Grade / Standing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {transcriptRows.length > 0 ? (
                        transcriptRows.map(({ assessment, course }) => (
                          <tr key={assessment.id}>
                            <td className="py-2 px-3 font-semibold">Level {assessment.levelNumber}</td>
                            <td className="py-2 px-3 font-mono font-bold">{course?.code || 'MOD'}</td>
                            <td className="py-2 px-3">
                              {course?.title || 'Programme Assessment Module'}
                              {assessment.exemptionBasis && (
                                <span className="block text-[10px] text-slate-500 italic">
                                  Exemption: {assessment.exemptionBasis}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-right font-mono">{course?.creditHours || 10}</td>
                            <td className="py-2 px-2 text-right font-mono">
                              {assessment.paperStatus === 'Exempted' ? '—' : assessment.caScore + assessment.practicalScore}
                            </td>
                            <td className="py-2 px-2 text-right font-mono">
                              {assessment.paperStatus === 'Exempted' ? '—' : assessment.examScore}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold">
                              {assessment.paperStatus === 'Exempted' ? 'EXEMPT' : `${assessment.totalScore}%`}
                            </td>
                            <td className="py-2 px-3 font-semibold">{assessment.grade} ({assessment.paperStatus})</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-5 px-4 text-center text-slate-500">
                            All prescribed programme modules ({credential.creditHoursCompleted} credit hours) verified complete under {credential.levelCompletedLabel}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200">
                  {activeSignatories.slice(0, 2).map((sig, i) => (
                    <div key={i}>
                      <div className="h-12 flex items-end">
                        {sig.signatureDataUrl && (
                          <img src={sig.signatureDataUrl} alt={sig.name} className="max-h-12 object-contain" />
                        )}
                      </div>
                      <div className="border-t border-slate-800 pt-1 w-60">
                        <p className="text-xs font-bold text-slate-900">{sig.name}</p>
                        <p className="text-[10px] text-slate-600">{sig.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. OFFICIAL LETTER OF COMPLETION */}
            {docMode === 'letter' && (
              <div className="p-10 bg-white text-slate-900 max-w-3xl mx-auto border border-slate-300 space-y-6 text-xs leading-relaxed">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={credential.schoolCrest || school.crest}
                      alt={credential.schoolName}
                      className="w-14 h-14 rounded-full object-cover border border-slate-800"
                    />
                    <div>
                      <h2 className="text-lg font-serif font-bold uppercase text-slate-950">
                        {credential.schoolName}
                      </h2>
                      <p className="text-[11px] text-slate-600">{school.address} • Tel: {school.phone}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px] tabular-nums">
                    <p>Ref: {credential.certificateNumber}/LOC</p>
                    <p>Date: {credential.issueDate}</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-slate-800">
                  <p className="font-bold uppercase tracking-wide underline">
                    TO WHOM IT MAY CONCERN: OFFICIAL LETTER OF PROGRAMME COMPLETION
                  </p>
                  <p>
                    This letter officially confirms that <strong>{credential.recipientFullName}</strong> (Candidate / Student Identification Number: <strong className="font-mono">{credential.candidateNumber}</strong>) has satisfactorily completed all prescribed coursework, practical evaluations, statutory examinations, and financial obligations for the <strong>{credential.programmeTitle}</strong> ({credential.levelCompletedLabel}) at <strong>{credential.schoolName}</strong>.
                  </p>
                  <p>
                    Following approval by the Academic &amp; Examination Board on <strong>{credential.issueDate}</strong>, the candidate has been conferred the institutional award of <strong>{credential.qualificationAwarded}</strong>
                    {credential.honoursOrDistinction ? ` (${credential.honoursOrDistinction})` : ''}.
                  </p>
                  <p className="text-xs bg-slate-50 border border-slate-200 p-3 rounded">
                    <strong>Awarding Authority Clarification:</strong> {credential.awardingAuthorityName}.{' '}
                    {credential.professionalBodyAffiliationNote ||
                      'Employers and institutions may verify this credential online using the certificate serial number or QR code below.'}
                  </p>
                </div>

                <div className="flex items-end justify-between pt-8 border-t border-slate-200">
                  <div>
                    {activeSignatories[0]?.signatureDataUrl && (
                      <img
                        src={activeSignatories[0].signatureDataUrl}
                        alt={activeSignatories[0].name}
                        className="h-14 object-contain"
                      />
                    )}
                    <div className="border-t border-slate-800 pt-1 w-64">
                      <p className="font-bold text-xs text-slate-900">{activeSignatories[0]?.name || school.headmasterName}</p>
                      <p className="text-[11px] text-slate-600">{activeSignatories[0]?.title || 'Registrar / Principal'}</p>
                    </div>
                  </div>
                  {qrDataUrl && (
                    <div className="text-center">
                      <img src={qrDataUrl} alt="QR Verify" className="w-20 h-20 border border-slate-200 p-1 mx-auto" />
                      <span className="text-[9px] font-mono text-slate-600 block mt-1 tabular-nums">
                        {credential.verificationCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. DIGITAL CREDENTIAL BADGE */}
            {docMode === 'badge' && (
              <div className="p-8 bg-white text-slate-900 max-w-xl mx-auto border border-slate-300 text-center space-y-5">
                <div className="w-24 h-24 mx-auto rounded-2xl border-2 border-emerald-700 p-1.5 bg-emerald-50 flex items-center justify-center shadow-sm">
                  <img
                    src={credential.schoolCrest || school.crest}
                    alt={credential.schoolName}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-emerald-900 text-white font-bold">
                    Verified Digital Credential Badge
                  </span>
                  <h2 className="text-xl font-bold text-slate-950 mt-3">{credential.qualificationAwarded}</h2>
                  <p className="text-sm text-slate-600 mt-1">Issued to <strong>{credential.recipientFullName}</strong></p>
                  <p className="text-xs text-slate-500 mt-0.5">{credential.schoolName} • {credential.levelCompletedLabel}</p>
                </div>

                {qrDataUrl && (
                  <div className="inline-block p-3 border border-slate-200 rounded-xl bg-slate-50">
                    <img src={qrDataUrl} alt="QR Code" className="w-28 h-28 mx-auto" />
                    <p className="text-[11px] font-mono font-bold text-slate-800 mt-2 tabular-nums">
                      {credential.certificateNumber}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 tabular-nums">
                      Code: {credential.verificationCode}
                    </p>
                  </div>
                )}

                <div className="text-left bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px]">
                  <span className="font-semibold text-slate-700 block mb-1">Public Employer Verification Link:</span>
                  <code className="block font-mono text-[10px] text-emerald-800 break-all">{verificationUrl}</code>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
