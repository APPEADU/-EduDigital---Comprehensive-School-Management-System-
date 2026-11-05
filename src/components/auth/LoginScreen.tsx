import React, { useState, useEffect, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Building2,
  KeyRound,
  ChevronDown,
  Globe,
  BookOpenCheck,
  GraduationCap,
  Award,
  IdCard,
  PlusCircle,
  LogOut,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ResearchJournalModule } from '../modules/ResearchJournalModule';
import { EmployerVerificationPortal } from '../modules/EmployerVerificationPortal';
import { RegisterSchoolModal } from '../modals/RegisterSchoolModal';
import { PasswordResetModal, ResetRoleTab } from '../modals/PasswordResetModal';
import {
  WhatsAppLogoIcon,
  PLATFORM_OWNER_WHATSAPP_RAW,
  PLATFORM_OWNER_WHATSAPP_DISPLAY,
  buildWhatsAppUrl,
  getSchoolWhatsAppContact,
} from '../../utils/whatsapp';

interface LoginScreenProps {
  onBackToWebsite?: () => void;
  initialMode?: 'staff' | 'student' | 'owner';
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onBackToWebsite,
  initialMode = 'staff',
}) => {
  const {
    school,
    schools,
    activeSchoolId,
    switchSchool,
    users,
    signInWithGoogle,
    signInPlatformOwnerWithEmail,
    enterPortalAsPlatformOwner,
    loginWithEmail,
    logout,
    firebaseUser,
    platformOwnerEmail,
    allPublicResearchArticles,
    samplePublicCredentials,
    isPlatformAdmin,
  } = useSchool();

  const initialVerifyParam = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('verify') || '';
    } catch {
      return '';
    }
  }, []);

  const hasSchools = schools.length > 0;

  const [selectedSchoolId, setSelectedSchoolId] = useState(activeSchoolId);
  const [loginMode, setLoginMode] = useState<'staff' | 'student' | 'owner'>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showRegisterSchoolModal, setShowRegisterSchoolModal] = useState(false);
  const [showPublicJournals, setShowPublicJournals] = useState(false);
  const [crestImgFailed, setCrestImgFailed] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetTargetTab, setResetTargetTab] = useState<ResetRoleTab>('staff');
  const [resetSuccessBanner, setResetSuccessBanner] = useState<string | null>(null);

  const schoolWhatsApp = hasSchools
    ? getSchoolWhatsAppContact(school)
    : { enabled: false, rawNumber: '', digits: '' };
  const [showPublicVerification, setShowPublicVerification] = useState<boolean>(
    Boolean(initialVerifyParam)
  );

  useEffect(() => {
    setLoginMode(initialMode);
    setErrorMessage(null);
  }, [initialMode]);

  useEffect(() => {
    setSelectedSchoolId(activeSchoolId);
    setCrestImgFailed(false);
    setErrorMessage(null);
  }, [activeSchoolId]);

  const handleSchoolChange = (newSchoolId: string) => {
    setSelectedSchoolId(newSchoolId);
    switchSchool(newSchoolId);
    setShowSchoolDropdown(false);
    setErrorMessage(null);
  };

  const handleOwnerEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your Platform Owner email address.');
      return;
    }
    const res = signInPlatformOwnerWithEmail(identifier, password, {
      targetSchoolId: selectedSchoolId,
    });
    if (!res.success) {
      setErrorMessage(res.message || 'Platform Owner authentication failed.');
      return;
    }
    setErrorMessage(null);
    if (schools.length === 0) {
      setShowRegisterSchoolModal(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMode === 'owner') {
      handleOwnerEmailSubmit(e);
      return;
    }
    if (!identifier.trim()) {
      setErrorMessage(
        loginMode === 'student'
          ? 'Please enter your Student / Candidate ID or email address.'
          : 'Please enter your institutional email address.'
      );
      return;
    }
    const result = loginWithEmail(identifier, password, selectedSchoolId, loginMode);
    if (!result.success) {
      setErrorMessage(result.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleGoogleSignIn = async (explicitMode?: 'staff' | 'student' | 'owner') => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const targetMode = explicitMode || (hasSchools ? loginMode : 'owner');
      const res = await signInWithGoogle(targetMode);
      if (res.success && res.isPlatformAdmin && schools.length === 0) {
        setShowRegisterSchoolModal(true);
      } else if (!res.success && res.message) {
        setErrorMessage(res.message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (showPublicVerification) {
    return (
      <div className="min-h-screen edu-aurora-canvas text-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <EmployerVerificationPortal
            publicStandaloneMode={true}
            initialQuery={initialVerifyParam}
            onBackToLogin={() => {
              if (window.location.search.includes('verify=')) {
                window.history.replaceState({}, '', window.location.pathname);
              }
              setShowPublicVerification(false);
            }}
          />
        </div>
      </div>
    );
  }

  if (showPublicJournals) {
    return (
      <div className="min-h-screen edu-aurora-canvas text-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <ResearchJournalModule
            readOnlyPublicMode={true}
            onBackToLogin={() => setShowPublicJournals(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen edu-login-canvas flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 text-slate-100">
      <div className="w-full max-w-lg space-y-5">
        {onBackToWebsite && (
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBackToWebsite}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 hover:text-amber-300 transition cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Back to Public Website</span>
            </button>
            <span className="text-[11px] text-amber-300/90 font-medium">Institutional Portal Sign-In</span>
          </div>
        )}

        {!hasSchools ? (
          <>
            {/* Platform Empty-State Header */}
            <div className="text-center space-y-2.5">
              <div className="w-16 h-16 mx-auto rounded-2xl border-2 border-amber-400/70 p-3 bg-indigo-950/80 flex items-center justify-center text-amber-300 shadow-lg">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-300 mb-1">
                  EduDigital SIS · Institutional Cloud
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight text-balance">
                  Institutional Management Portal
                </h1>
                <p className="text-xs text-sky-200/80 mt-1">
                  Schools · Colleges · Chartered &amp; Certificate Institutes
                </p>
              </div>
            </div>

            {/* Zero-Schools Onboarding Card */}
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-6 text-xs space-y-5 shadow-2xl">
              {isPlatformAdmin ? (
                <>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-bold text-sm text-white truncate">
                        Platform Administrator Verified
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 truncate max-w-[200px]">
                      {firebaseUser?.email || platformOwnerEmail}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed">
                    No institution has been onboarded yet. Register your first{' '}
                    <strong className="text-white">School, College, or Professional Institute</strong>{' '}
                    to create its dedicated administrative workspace.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowRegisterSchoolModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                  >
                    <PlusCircle className="w-4 h-4 shrink-0" />
                    <span>Register First School or Institute</span>
                  </button>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <button
                      type="button"
                      onClick={() => {
                        setResetTargetTab('owner');
                        setShowResetPasswordModal(true);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold transition cursor-pointer whitespace-nowrap"
                    >
                      Set / Reset Owner Password
                    </button>
                    <button
                      type="button"
                      onClick={logout}
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-400 font-semibold transition cursor-pointer whitespace-nowrap"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="font-bold text-sm text-white">
                      Platform Owner &amp; Institution Sign-In
                    </h2>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                      Sign in with your Platform Owner email address or Google account below to
                      onboard a new school or load registered institutions.
                    </p>
                  </div>

                  <form onSubmit={handleOwnerEmailSubmit} className="space-y-3.5">
                    <div>
                      <label
                        htmlFor="owner-zero-email"
                        className="block text-slate-300 font-semibold mb-1.5"
                      >
                        Platform Owner Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                        <input
                          id="owner-zero-email"
                          type="email"
                          required
                          autoComplete="email"
                          value={identifier}
                          onChange={(e) => {
                            setIdentifier(e.target.value);
                            setErrorMessage(null);
                          }}
                          placeholder="Enter Platform Owner email address"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label
                          htmlFor="owner-zero-password"
                          className="block text-slate-300 font-semibold"
                        >
                          Password / Access PIN{' '}
                          <span className="text-slate-500 font-normal">(if configured)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setResetTargetTab('owner');
                            setShowResetPasswordModal(true);
                          }}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition cursor-pointer whitespace-nowrap"
                        >
                          Forgot / Reset Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                        <input
                          id="owner-zero-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setErrorMessage(null);
                          }}
                          placeholder="Enter password (optional if not set)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {errorMessage && (
                      <div
                        role="alert"
                        className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px]"
                      >
                        {errorMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                    >
                      <span>Sign In with Platform Owner Email</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </form>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <div className="h-px flex-1 bg-slate-800" />
                      <span>or continue with Google</span>
                      <div className="h-px flex-1 bg-slate-800" />
                    </div>

                    <button
                      type="button"
                      disabled={isGoogleLoading}
                      onClick={() => handleGoogleSignIn('owner')}
                      className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                        />
                      </svg>
                      <span>
                        {isGoogleLoading
                          ? 'Connecting to Google...'
                          : 'Platform Owner Sign-In with Google'}
                      </span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p>
                      Want to onboard your school or professional institute? Contact the Platform
                      Owner via WhatsApp below.
                    </p>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Multi-Institution Selector Bar */}
            <div className="bg-gradient-to-r from-indigo-950/85 via-slate-900/95 to-teal-950/80 border border-indigo-400/30 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-300 shrink-0" />
                <span className="text-sky-200/85 font-medium whitespace-nowrap">Institution:</span>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-indigo-400/35 hover:border-amber-400 text-white font-semibold transition cursor-pointer"
                  >
                    {!crestImgFailed && school.crest ? (
                      <img
                        src={school.crest}
                        alt={school.name}
                        referrerPolicy="no-referrer"
                        onError={() => setCrestImgFailed(true)}
                        className="w-4 h-4 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <GraduationCap className="w-4 h-4 text-amber-300 shrink-0" />
                    )}
                    <span className="truncate max-w-[150px] sm:max-w-[230px]">{school.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  </button>

                  {showSchoolDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-indigo-500/35 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                      <div className="px-2.5 py-1.5 text-[11px] font-semibold text-sky-300 border-b border-slate-800 mb-1 tabular-nums">
                        Registered Institutions ({schools.length})
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {schools.map((s) => {
                          const isSelected = s.id === activeSchoolId;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleSchoolChange(s.id)}
                              className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-950/90 text-white border border-sky-400/50'
                                  : 'hover:bg-slate-800 text-slate-300'
                              }`}
                            >
                              {s.crest ? (
                                <img
                                  src={s.crest}
                                  alt={s.name}
                                  referrerPolicy="no-referrer"
                                  className="w-6 h-6 rounded-full object-cover border border-amber-400/50 shrink-0"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                  <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs truncate text-white">{s.name}</p>
                                <p className="text-[11px] text-amber-300 font-mono tabular-nums truncate">
                                  {s.code} · {s.levelType}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {isPlatformAdmin ? (
                        <div className="pt-1.5 border-t border-slate-800 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowSchoolDropdown(false);
                              setShowRegisterSchoolModal(true);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs transition cursor-pointer whitespace-nowrap"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Register New Institution</span>
                          </button>
                        </div>
                      ) : (
                        <div className="pt-1.5 border-t border-slate-800 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowSchoolDropdown(false);
                              setLoginMode('owner');
                              setErrorMessage(null);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-amber-500/35 text-amber-300 font-semibold text-[11px] transition cursor-pointer whitespace-nowrap"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>Platform Owner? Sign In to Add School</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isPlatformAdmin ? (
                  <button
                    type="button"
                    onClick={() => setShowRegisterSchoolModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs transition cursor-pointer whitespace-nowrap"
                    title="Register New School or Institute"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add School</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('owner');
                      setErrorMessage(null);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                      loginMode === 'owner'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 border-amber-400 text-white'
                        : 'bg-slate-950/90 hover:bg-slate-800 border-amber-500/40 text-amber-300'
                    }`}
                    title="Platform Owner Sign-In"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Owner Sign-In</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Institution Branding & Emblem */}
            <div className="text-center space-y-2.5">
              <div className="w-16 h-16 mx-auto rounded-2xl border-2 border-amber-400/75 p-1 bg-indigo-950/80 overflow-hidden flex items-center justify-center shadow-lg">
                {!crestImgFailed && school.crest ? (
                  <img
                    src={school.crest}
                    alt={school.name}
                    referrerPolicy="no-referrer"
                    onError={() => setCrestImgFailed(true)}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <GraduationCap className="w-8 h-8 text-amber-300" />
                )}
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 text-xs text-sky-200/85 mb-1">
                  <span>{school.levelType}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-amber-300 font-semibold tabular-nums">{school.code}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight text-balance">
                  {school.name}
                </h1>
                {school.motto && (
                  <p className="text-xs text-emerald-300/90 mt-1">&ldquo;{school.motto}&rdquo;</p>
                )}
              </div>
            </div>

            {/* Portal Authentication Card */}
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 text-xs space-y-5 shadow-2xl">
              {/* Staff & Admin | Student & Candidate | Platform Owner Switcher */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/90 border border-indigo-500/25 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('staff');
                    setErrorMessage(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                    loginMode === 'staff'
                      ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-sm'
                      : 'text-sky-200/80 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Staff &amp; Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('student');
                    setErrorMessage(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                    loginMode === 'student'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                      : 'text-emerald-200/80 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('owner');
                    setErrorMessage(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                    loginMode === 'owner'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm'
                      : 'text-amber-300/90 hover:text-amber-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Platform Owner</span>
                </button>
              </div>

              {loginMode === 'owner' ? (
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="font-bold text-sm text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Platform Owner &amp; Super Administrator Sign-In</span>
                    </h2>
                    <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                      Authorised access for the EduDigital SIS Platform Owner to register new
                      schools and professional institutes, oversee multi-tenant workspaces, and
                      manage the official Platform Owner profile.
                    </p>
                  </div>

                  {errorMessage && (
                    <div
                      role="alert"
                      className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px] leading-relaxed"
                    >
                      {errorMessage}
                    </div>
                  )}

                  {isPlatformAdmin ? (
                    <div className="space-y-3.5">
                      <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-bold text-white truncate">
                            Platform Owner Verified
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-300 truncate max-w-[190px]">
                          {firebaseUser?.email || platformOwnerEmail}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => enterPortalAsPlatformOwner(selectedSchoolId)}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                      >
                        <span>Enter {school.code} Workspace as Platform Owner</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowRegisterSchoolModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                      >
                        <PlusCircle className="w-4 h-4 shrink-0" />
                        <span>Register New School or Institute</span>
                      </button>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Signed in as Platform Owner</span>
                        <button
                          type="button"
                          onClick={logout}
                          className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-400 font-semibold transition cursor-pointer whitespace-nowrap"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <form onSubmit={handleOwnerEmailSubmit} className="space-y-3.5">
                        <div>
                          <label
                            htmlFor="owner-portal-email"
                            className="block text-slate-300 font-semibold mb-1.5"
                          >
                            Platform Owner Email Address
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                            <input
                              id="owner-portal-email"
                              type="email"
                              required
                              autoComplete="email"
                              value={identifier}
                              onChange={(e) => {
                                setIdentifier(e.target.value);
                                setErrorMessage(null);
                              }}
                              placeholder="Enter Platform Owner email address"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <label
                              htmlFor="owner-portal-password"
                              className="block text-slate-300 font-semibold"
                            >
                              Password / Access PIN{' '}
                              <span className="text-slate-500 font-normal">(if configured)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setResetTargetTab('owner');
                                setShowResetPasswordModal(true);
                              }}
                              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition cursor-pointer whitespace-nowrap"
                            >
                              Forgot / Reset Password?
                            </button>
                          </div>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                            <input
                              id="owner-portal-password"
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="current-password"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                setErrorMessage(null);
                              }}
                              placeholder="Enter password (optional if not set)"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-md"
                        >
                          <span>Sign In as Platform Owner</span>
                          <ArrowRight className="w-4 h-4 shrink-0" />
                        </button>
                      </form>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <div className="h-px flex-1 bg-slate-800" />
                          <span>or continue with Google</span>
                          <div className="h-px flex-1 bg-slate-800" />
                        </div>

                        <button
                          type="button"
                          disabled={isGoogleLoading}
                          onClick={() => handleGoogleSignIn('owner')}
                          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                        >
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              fill="#4285F4"
                              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                            />
                          </svg>
                          <span>
                            {isGoogleLoading
                              ? 'Verifying Platform Owner...'
                              : 'Platform Owner Sign-In with Google'}
                          </span>
                        </button>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
                        <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <p>
                          Restricted to the verified EduDigital SIS Platform Owner email or Google
                          account. School proprietors, staff, and students should use the{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setLoginMode('staff');
                              setErrorMessage(null);
                            }}
                            className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                          >
                            Staff &amp; Admin
                          </button>{' '}
                          or{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setLoginMode('student');
                              setErrorMessage(null);
                            }}
                            className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                          >
                            Student
                          </button>{' '}
                          tabs.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="font-bold text-sm text-white flex items-center gap-2">
                      {loginMode === 'staff' ? (
                        <KeyRound className="w-4 h-4 text-sky-400 shrink-0" />
                      ) : (
                        <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span>
                        {loginMode === 'staff'
                          ? 'Admins, Lecturers, Teachers & Staff Sign-In'
                          : 'Student, Candidate & Graduate Portal'}
                      </span>
                    </h2>
                    <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                      {loginMode === 'staff'
                        ? 'For Proprietors, Principals, Deans, Lecturers, Teachers, Accountants & Staff — sign in with your email or Staff ID.'
                        : 'Enter your Student Number, Candidate ID, or email address to view results, fees, and credentials.'}
                    </p>
                  </div>

                  {resetSuccessBanner && (
                    <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-200 text-[11px] leading-relaxed">
                      {resetSuccessBanner}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="portal-login-identifier"
                        className="block text-slate-300 font-semibold mb-1.5"
                      >
                        {loginMode === 'student'
                          ? 'Student ID / Candidate Number / Email'
                          : 'Institutional Email Address'}
                      </label>
                      <div className="relative">
                        {loginMode === 'student' ? (
                          <IdCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                        ) : (
                          <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                        )}
                        <input
                          id="portal-login-identifier"
                          type="text"
                          required
                          autoComplete="username"
                          value={identifier}
                          onChange={(e) => {
                            setIdentifier(e.target.value);
                            setErrorMessage(null);
                          }}
                          placeholder={
                            loginMode === 'student'
                              ? `e.g. ${(school.code || 'STU').split('-')[0]}-2025-0001`
                              : `admin@${(school.code || 'school').toLowerCase()}.edu.gh`
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label
                          htmlFor="portal-login-password"
                          className="block text-slate-300 font-semibold"
                        >
                          Password / Portal PIN
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setResetTargetTab(loginMode === 'student' ? 'student' : 'staff');
                            setShowResetPasswordModal(true);
                          }}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition cursor-pointer whitespace-nowrap"
                        >
                          Forgot / Reset Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                        <input
                          id="portal-login-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setErrorMessage(null);
                          }}
                          placeholder="Enter your password"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {errorMessage && (
                      <div
                        role="alert"
                        className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px] leading-relaxed"
                      >
                        {errorMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-white rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-md ${
                        loginMode === 'staff'
                          ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                      }`}
                    >
                      <span>Sign In to {school.code} Portal</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </form>

                  {/* Google Sign-In */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <div className="h-px flex-1 bg-slate-800" />
                      <span>or continue with Google</span>
                      <div className="h-px flex-1 bg-slate-800" />
                    </div>

                    <button
                      type="button"
                      disabled={isGoogleLoading}
                      onClick={() => handleGoogleSignIn()}
                      className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                        />
                      </svg>
                      <span>
                        {isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}
                      </span>
                    </button>
                  </div>

                  {/* Registered Portal Accounts Quick Selector */}
                  {users.length > 0 && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">
                          Registered {school.code} Portal Accounts
                        </span>
                        <span className="tabular-nums">{users.length} active</span>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                        {users.slice(0, 6).map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              const isLearner =
                                u.role === 'student' || u.role === 'parent' || u.role === 'graduate';
                              setLoginMode(isLearner ? 'student' : 'staff');
                              setIdentifier(u.email);
                              setPassword(u.password || '');
                              setErrorMessage(null);
                            }}
                            className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate">{u.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">
                                {u.email}
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-400 uppercase shrink-0">
                              {u.role}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Public Self-Service Portals (No Login Required) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setShowPublicVerification(true)}
            className="bg-gradient-to-br from-amber-950/70 via-slate-900/95 to-orange-950/50 hover:from-amber-900/70 border border-amber-500/35 hover:border-amber-400 rounded-xl p-3.5 flex items-center justify-between text-left transition cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate">
                  Verify Certificate
                </div>
                <p className="text-[11px] text-amber-200/80 truncate tabular-nums">
                  Employer &amp; QR Lookup ({samplePublicCredentials.length} active)
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-300/80 group-hover:text-amber-300 shrink-0 ml-2 transition" />
          </button>

          <button
            type="button"
            onClick={() => setShowPublicJournals(true)}
            className="bg-gradient-to-br from-indigo-950/75 via-slate-900/95 to-violet-950/60 hover:from-indigo-900/75 border border-indigo-500/35 hover:border-sky-400 rounded-xl p-3.5 flex items-center justify-between text-left transition cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shrink-0">
                <BookOpenCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white group-hover:text-sky-300 transition flex items-center gap-1 truncate">
                  <span className="truncate">Research &amp; Journals</span>
                  <Globe className="w-3 h-3 text-sky-300 shrink-0" />
                </div>
                <p className="text-[11px] text-sky-200/80 truncate tabular-nums">
                  Open-access press ({allPublicResearchArticles.length} papers)
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-sky-300/80 group-hover:text-sky-300 shrink-0 ml-2 transition" />
          </button>
        </div>

        {/* Direct WhatsApp Support */}
        <div className={`grid grid-cols-1 ${schoolWhatsApp.enabled ? 'sm:grid-cols-2' : ''} gap-3`}>
          <a
            href={buildWhatsAppUrl(
              PLATFORM_OWNER_WHATSAPP_RAW,
              'Hello EduDigital SIS Support, I am visiting the portal login page and would like assistance with institutional onboarding or portal access.'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-[#25D366]/60 rounded-xl p-3.5 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#25D366]/15 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shrink-0 group-hover:bg-[#25D366] group-hover:text-slate-950 transition">
                <WhatsAppLogoIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white group-hover:text-[#25D366] transition truncate">
                  Platform Owner WhatsApp
                </div>
                <p className="text-[11px] text-slate-400 font-mono tabular-nums truncate">
                  {PLATFORM_OWNER_WHATSAPP_DISPLAY}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#25D366] shrink-0 ml-2 transition" />
          </a>

          {schoolWhatsApp.enabled && (
            <a
              href={buildWhatsAppUrl(
                schoolWhatsApp.rawNumber,
                `Hello ${school.name}, I need assistance signing in to the ${school.code} portal.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-[#25D366]/60 rounded-xl p-3.5 flex items-center justify-between text-left transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#25D366]/15 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shrink-0 group-hover:bg-[#25D366] group-hover:text-slate-950 transition">
                  <WhatsAppLogoIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-[#25D366] transition truncate">
                    {school.code} Administration
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono tabular-nums truncate">
                    {schoolWhatsApp.rawNumber}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#25D366] shrink-0 ml-2 transition" />
            </a>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-500">
          EduDigital SIS · Ghana Data Protection Act 2012 (Act 843) Compliant
        </p>
      </div>

      {isPlatformAdmin && (
        <RegisterSchoolModal
          isOpen={showRegisterSchoolModal}
          onClose={() => setShowRegisterSchoolModal(false)}
        />
      )}

      <PasswordResetModal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        flowMode="self-reset"
        initialRoleTab={resetTargetTab}
        initialSchoolId={selectedSchoolId}
        initialIdentifier={identifier}
        onResetComplete={(updatedEmail, roleTab, newPass) => {
          setLoginMode(roleTab);
          setIdentifier(updatedEmail);
          setPassword(newPass);
          setErrorMessage(null);
          setResetSuccessBanner(
            `Password updated for ${updatedEmail}. Click Sign In below to access your portal.`
          );
        }}
      />
    </div>
  );
};
