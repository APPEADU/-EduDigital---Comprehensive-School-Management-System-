import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  KeyRound,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Building2,
  ArrowRight,
} from 'lucide-react';

export type PasswordModalFlowMode = 'self-reset' | 'change-current' | 'admin-override';
export type ResetRoleTab = 'staff' | 'student' | 'owner';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  flowMode?: PasswordModalFlowMode;
  initialRoleTab?: ResetRoleTab;
  initialSchoolId?: string;
  initialIdentifier?: string;
  targetAccountLabel?: string;
  onResetComplete?: (updatedEmail: string, roleTab: ResetRoleTab, newPassword: string) => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  flowMode = 'self-reset',
  initialRoleTab = 'staff',
  initialSchoolId,
  initialIdentifier = '',
  targetAccountLabel,
  onResetComplete,
}) => {
  const {
    schools,
    activeSchoolId,
    currentUser,
    isPlatformAdmin,
    platformOwnerEmail,
    hasPlatformOwnerPassword,
    resetAccountPassword,
    changeCurrentUserPassword,
  } = useSchool();

  const [roleTab, setRoleTab] = useState<ResetRoleTab>(initialRoleTab);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    initialSchoolId || activeSchoolId || schools[0]?.id || ''
  );
  const [identifier, setIdentifier] = useState<string>(initialIdentifier);
  const [verificationInput, setVerificationInput] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showVerifyField, setShowVerifyField] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
    resolvedEmail?: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setRoleTab(initialRoleTab);
    setSelectedSchoolId(initialSchoolId || activeSchoolId || schools[0]?.id || '');
    if (flowMode === 'self-reset' && initialRoleTab === 'owner' && !initialIdentifier) {
      setIdentifier(platformOwnerEmail);
    } else {
      setIdentifier(initialIdentifier || '');
    }
    setVerificationInput('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setFeedback(null);
  }, [isOpen, flowMode, initialRoleTab, initialSchoolId, initialIdentifier, activeSchoolId, schools, platformOwnerEmail]);

  if (!isOpen) return null;

  const handleRoleTabSwitch = (nextTab: ResetRoleTab) => {
    setRoleTab(nextTab);
    setFeedback(null);
    setVerificationInput('');
    if (nextTab === 'owner') {
      setIdentifier(platformOwnerEmail);
    } else if (identifier.toLowerCase() === platformOwnerEmail.toLowerCase()) {
      setIdentifier('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.trim().length < 6) {
      setFeedback({
        type: 'error',
        text: 'New password must be at least 6 characters long.',
      });
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setFeedback({
        type: 'error',
        text: 'New password and confirmation password do not match.',
      });
      return;
    }

    // 1. Authenticated user changing their own password
    if (flowMode === 'change-current') {
      const res = changeCurrentUserPassword(currentPassword, newPassword);
      setFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message,
        resolvedEmail: currentUser.email,
      });
      if (res.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
      return;
    }

    // 2. Authorized Admin / Proprietor / Platform Owner resetting a specific user's password
    if (flowMode === 'admin-override') {
      const isOwnerTarget = identifier.trim().toLowerCase() === platformOwnerEmail.toLowerCase();
      const res = resetAccountPassword({
        mode: isOwnerTarget ? 'owner' : 'portal',
        schoolId: selectedSchoolId,
        identifier,
        newPassword,
        bypassVerification: true,
      });
      setFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message,
        resolvedEmail: res.updatedEmail,
      });
      if (res.success && onResetComplete) {
        onResetComplete(res.updatedEmail || identifier, isOwnerTarget ? 'owner' : 'staff', newPassword.trim());
      }
      return;
    }

    // 3. Self-service password reset from Login Screen
    const res = resetAccountPassword({
      mode: roleTab === 'owner' ? 'owner' : 'portal',
      schoolId: roleTab === 'owner' ? undefined : selectedSchoolId,
      identifier,
      verificationInput,
      newPassword,
    });

    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
      resolvedEmail: res.updatedEmail,
    });
  };

  const isOwnerLoggedInChanging =
    flowMode === 'change-current' &&
    isPlatformAdmin &&
    (schools.length === 0 || currentUser.email.toLowerCase() === platformOwnerEmail.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full text-slate-200 shadow-2xl my-6 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {flowMode === 'change-current'
                  ? 'Change / Reset Account Password'
                  : flowMode === 'admin-override'
                  ? 'Administrator Password Reset'
                  : 'Reset Portal Account Password'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {flowMode === 'change-current'
                  ? `${currentUser.name} · ${currentUser.title || currentUser.role}`
                  : flowMode === 'admin-override'
                  ? `Set a new password for ${targetAccountLabel || identifier}`
                  : 'For Platform Owner, Admins, Lecturers, Teachers, Staff & Students'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
            aria-label="Close password reset modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Role Selector Tabs for Self-Service Reset */}
          {flowMode === 'self-reset' && (
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => handleRoleTabSwitch('staff')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                  roleTab === 'staff'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span>Admins &amp; Faculty</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleTabSwitch('student')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                  roleTab === 'student'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                <span>Students</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleTabSwitch('owner')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                  roleTab === 'owner'
                    ? 'bg-amber-600 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Platform Owner</span>
              </button>
            </div>
          )}

          {feedback && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-700/60 text-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-2 flex-1">
                <p className="leading-relaxed">{feedback.text}</p>
                {feedback.type === 'success' && flowMode === 'self-reset' && onResetComplete && (
                  <button
                    type="button"
                    onClick={() => {
                      onResetComplete(
                        feedback.resolvedEmail || identifier,
                        roleTab,
                        newPassword.trim()
                      );
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap"
                  >
                    <span>Return &amp; Fill Sign-In Form</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Institution Selector (Self-Reset for Staff/Lecturers/Admins & Students) */}
            {flowMode === 'self-reset' && roleTab !== 'owner' && schools.length > 0 && (
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  School / College / Institute
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Account Identifier (Self-Reset or Admin Override) */}
            {flowMode !== 'change-current' && (
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  {roleTab === 'owner'
                    ? 'Platform Owner Email Address'
                    : roleTab === 'student'
                    ? 'Student / Candidate ID or Email'
                    : 'Admin, Lecturer, Teacher or Staff Email / Staff ID'}
                </label>
                <input
                  type="text"
                  required
                  readOnly={flowMode === 'admin-override'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    roleTab === 'owner'
                      ? platformOwnerEmail
                      : roleTab === 'student'
                      ? 'e.g. STU-2025-0001 or student@email.com'
                      : 'e.g. lecturer@school.edu.gh or SCH-STF-001'
                  }
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 ${
                    flowMode === 'admin-override' ? 'opacity-75 cursor-not-allowed font-mono' : ''
                  }`}
                />
              </div>
            )}

            {/* Identity Verification (Self-Reset Only) */}
            {flowMode === 'self-reset' && (
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  {roleTab === 'owner'
                    ? isPlatformAdmin
                      ? 'Owner Session Verified (Optional)'
                      : 'Current Owner Password or Registered WhatsApp Last 4 Digits'
                    : roleTab === 'student'
                    ? 'Identity Verification (Current Password, Full Name, or Guardian Phone Digits)'
                    : 'Identity Verification (Current Password, Full Name, Staff ID, or Phone Digits)'}
                </label>
                <div className="relative">
                  <input
                    type={showVerifyField ? 'text' : 'password'}
                    required={!(roleTab === 'owner' && isPlatformAdmin)}
                    value={verificationInput}
                    onChange={(e) => setVerificationInput(e.target.value)}
                    placeholder={
                      roleTab === 'owner'
                        ? isPlatformAdmin
                          ? 'Active owner session detected'
                          : 'Enter current password or last 4 WhatsApp digits'
                        : roleTab === 'student'
                        ? 'Enter full name, current password, or guardian phone'
                        : 'Enter full name, Staff ID, school code, or phone digits'
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowVerifyField((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    tabIndex={-1}
                  >
                    {showVerifyField ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {roleTab === 'owner'
                    ? 'Verify with your existing owner password or the last 4 digits of the registered Owner WhatsApp line.'
                    : roleTab === 'student'
                    ? 'Matches your registered Student/Candidate record or guardian phone on file.'
                    : 'Supports Proprietors, Principals, Deans, Lecturers, Teachers, Accountants, Librarians, and Staff.'}
                </p>
              </div>
            )}

            {/* Current Password (Change-Current Mode) */}
            {flowMode === 'change-current' && (
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  {isOwnerLoggedInChanging && !hasPlatformOwnerPassword
                    ? 'Current Password (Not Required for Initial Setup)'
                    : 'Current Password'}
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required={!(isOwnerLoggedInChanging && !hasPlatformOwnerPassword)}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={
                    isOwnerLoggedInChanging && !hasPlatformOwnerPassword
                      ? 'Leave blank to set your first owner password'
                      : 'Enter your current password'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* New Password + Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-9 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Confirm New Password *
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
              >
                Close
              </button>
              <button
                type="submit"
                className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  roleTab === 'owner' && flowMode === 'self-reset'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>
                  {flowMode === 'change-current'
                    ? 'Update Password'
                    : flowMode === 'admin-override'
                    ? 'Save New Password'
                    : 'Reset Password'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
