import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { InstitutionCategory, SchoolProfile } from '../../types';
import { getDefaultModulesForLevelType } from '../../data/featureCatalog';
import { GHANA_EDUCATIONAL_PRESETS } from '../../utils/ghanaianClassStructure';
import {
  X,
  Building2,
  ShieldCheck,
  UserCheck,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle,
  Award,
  GraduationCap,
} from 'lucide-react';
import { WhatsAppLogoIcon } from '../../utils/whatsapp';

interface RegisterSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (schoolName: string, adminEmail: string) => void;
}

export const RegisterSchoolModal: React.FC<RegisterSchoolModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { registerSchool, isPlatformAdmin } = useSchool();

  const [step, setStep] = useState<1 | 2>(1);
  const [institutionCategory, setInstitutionCategory] = useState<InstitutionCategory>('institute');

  // School Profile fields
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [motto, setMotto] = useState('');
  const [levelType, setLevelType] = useState<SchoolProfile['levelType']>('Professional Institute');
  const [region, setRegion] = useState('Greater Accra');
  const [district, setDistrict] = useState('Accra Metropolitan');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('+233 ');
  const [whatsappNumber, setWhatsappNumber] = useState('+233 ');
  const [email, setEmail] = useState('');
  const [crest, setCrest] = useState('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=300&q=80');

  // Admin Credentials fields
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminTitle, setAdminTitle] = useState('Rector / Super Administrator');
  const [adminRole, setAdminRole] = useState<'proprietor' | 'admin'>('proprietor');

  // Optional Initial Custom Courses & Subjects + Offered Sections Scope
  const [customCoursesInput, setCustomCoursesInput] = useState('');
  const [customSubjectsInput, setCustomSubjectsInput] = useState('');
  const [skipAutoDefaults, setSkipAutoDefaults] = useState(false);
  const [offeredPresetId, setOfferedPresetId] = useState<string>('creche-jhs3');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !isPlatformAdmin) return null;

  const handleSelectCategory = (cat: InstitutionCategory) => {
    setInstitutionCategory(cat);
    if (cat === 'institute') {
      setLevelType('Professional Institute');
      setAdminTitle('Rector / Super Administrator');
    } else {
      setLevelType('Basic & JHS');
      setAdminTitle('Headmaster / Super Administrator');
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) {
      setErrorMessage(
        institutionCategory === 'institute'
          ? 'Please enter the official institute name'
          : 'Please enter the official school name'
      );
      return;
    }
    if (!schoolCode.trim()) {
      setErrorMessage('Please enter an institutional code (e.g. CIT-GH-004 or ACH-GH-001)');
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminEmail.trim()) {
      setErrorMessage('Please provide the administrator full name and official email');
      return;
    }
    if (!adminPassword.trim()) {
      setErrorMessage('Please provide a secure password or passcode');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const isInst = institutionCategory === 'institute';
      const { school: newSchool, admin: newAdmin } = registerSchool(
        {
          name: schoolName.trim(),
          code: schoolCode.trim().toUpperCase(),
          motto: motto.trim() || (isInst ? 'Professional Competence & Integrity' : 'Excellence and Integrity'),
          crest: crest || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=300&q=80',
          levelType,
          region,
          district: district || 'Metropolitan District',
          address: address.trim() || 'Accra, Ghana',
          phone: phone.trim() && phone.trim() !== '+233' ? phone.trim() : '+233 (0) 30 200 0000',
          whatsappNumber:
            whatsappNumber.trim() && whatsappNumber.trim() !== '+233'
              ? whatsappNumber.trim()
              : phone.trim() && phone.trim() !== '+233'
              ? phone.trim()
              : '',
          whatsappEnabled: true,
          email: email.trim() || adminEmail.trim(),
          currency: 'GH₵',
          currentAcademicYear: '2025/2026',
          currentTerm: isInst ? 'Semester 1' : 'Term 1',
          termStartDate: '2025-09-15',
          termEndDate: '2025-12-19',
          nextTermBegins: '2026-01-14',
          headmasterName: adminName.trim(),
          headmasterSignature: adminName.trim(),
          enabledModules: getDefaultModulesForLevelType(levelType),
        },
        {
          name: adminName.trim(),
          email: adminEmail.trim(),
          password: adminPassword.trim(),
          title: adminTitle.trim(),
          role: adminRole,
        },
        {
          customCourses: customCoursesInput
            .split(/[\n,;]+/)
            .map((c) => c.trim())
            .filter(Boolean),
          customSubjects: customSubjectsInput
            .split(/[\n,;]+/)
            .map((s) => s.trim())
            .filter(Boolean),
          skipAutoDefaults,
          offeredPresetId: isInst ? undefined : offeredPresetId,
        }
      );

      if (onSuccess) {
        onSuccess(newSchool.name, newAdmin.email);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to provision institutional workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preset logo helpers
  const crestPresets = [
    { label: 'Gold & Emerald Shield', url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=300&q=80' },
    { label: 'Academic Crest & Book', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=300&q=80' },
    { label: 'Heritage Star & Torch', url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=300&q=80' },
    { label: 'Modern Royal Emblem', url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=300&q=80' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 text-white shadow-2xl space-y-5 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Register New Institute or School</h3>
              <p className="text-xs text-slate-400">
                Choose Institution Type · Isolated Database &amp; Dedicated Login
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between bg-slate-950 p-2 rounded-2xl border border-slate-800 text-xs">
          <div
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition ${
              step === 1
                ? 'bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold">
              1
            </span>
            <span>Institution Type &amp; Identity</span>
          </div>
          <div
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition ${
              step === 2
                ? 'bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold">
              2
            </span>
            <span>Admin Login Credentials</span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: INSTITUTION TYPE & IDENTITY */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4 text-xs">
            {/* Explicit Top-Level Separation: Institute vs Basic/Secondary School */}
            <div>
              <label className="block font-semibold text-slate-300 mb-2">
                Select Institution Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectCategory('institute')}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                    institutionCategory === 'institute'
                      ? 'bg-emerald-950/60 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-white">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>Professional / Certificate Institute</span>
                    </span>
                    {institutionCategory === 'institute' && (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Level 1, 2, 3 &amp; Non-Chartered Certificate programmes, course flyers, rationale, objectives &amp; QR credentials.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectCategory('basic_school')}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                    institutionCategory === 'basic_school'
                      ? 'bg-emerald-950/60 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-white">
                      <GraduationCap className="w-4 h-4 text-emerald-400" />
                      <span>Basic / Secondary School</span>
                    </span>
                    {institutionCategory === 'basic_school' && (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Basic, JHS &amp; Senior High School (SHS) streams, GES terminal report cards, attendance, fees &amp; boarding.
                  </p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">
                  {institutionCategory === 'institute' ? 'Official Institute Name *' : 'Official School Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder={
                    institutionCategory === 'institute'
                      ? 'e.g. Ghana Institute of Procurement & Supply Studies'
                      : 'e.g. Achimota School or Ridge Junior High School'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {institutionCategory === 'institute' ? 'Institute Code *' : 'School Code *'}
                </label>
                <input
                  type="text"
                  required
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                  placeholder={institutionCategory === 'institute' ? 'e.g. GIPS-GH-005' : 'e.g. ACH-GH-001'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {institutionCategory === 'institute' ? 'Institute Classification *' : 'School Stream *'}
                </label>
                <select
                  value={levelType}
                  onChange={(e) => {
                    const nextLv = e.target.value as SchoolProfile['levelType'];
                    setLevelType(nextLv);
                    if (nextLv === 'SHS') setOfferedPresetId('shs-only');
                    else if (nextLv === 'Combined') setOfferedPresetId('full-creche-shs3');
                    else if (nextLv === 'Basic & JHS') setOfferedPresetId('creche-jhs3');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  {institutionCategory === 'institute' ? (
                    <>
                      <option value="Professional Institute">Professional &amp; Chartered Institute</option>
                      <option value="Vocational Training Centre">Certificate &amp; Vocational Training Centre</option>
                      <option value="College / Polytechnic">College / Polytechnic / Diploma Institute</option>
                      <option value="Executive Education">Executive Education &amp; Certificate Academy</option>
                    </>
                  ) : (
                    <>
                      <option value="Basic & JHS">Basic &amp; Junior High School</option>
                      <option value="SHS">Senior High School (SHS 1 – 3)</option>
                      <option value="Combined">Comprehensive (Creche through SHS 3)</option>
                    </>
                  )}
                </select>
              </div>

              {institutionCategory === 'basic_school' && (
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-emerald-300 mb-1">
                    Classes &amp; Educational Sections Offered by This School *
                  </label>
                  <select
                    value={offeredPresetId}
                    onChange={(e) => setOfferedPresetId(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-700/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {GHANA_EDUCATIONAL_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} — {p.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">
                  Institutional Motto
                </label>
                <input
                  type="text"
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  placeholder={
                    institutionCategory === 'institute'
                      ? 'e.g. Integrity, Standards & Professional Mastery'
                      : 'e.g. Ut Omnes Unum Sint (That all may be one)'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white italic focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Greater Accra">Greater Accra</option>
                  <option value="Ashanti">Ashanti</option>
                  <option value="Central">Central</option>
                  <option value="Eastern">Eastern</option>
                  <option value="Western">Western</option>
                  <option value="Volta">Volta</option>
                  <option value="Northern">Northern</option>
                  <option value="Bono">Bono</option>
                  <option value="Upper East">Upper East</option>
                  <option value="Upper West">Upper West</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">District / City</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Cape Coast or Kumasi"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Official Telephone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+233 30 200 0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <WhatsAppLogoIcon className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>School Owner WhatsApp Number</span>
                </label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +233 24 000 0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#25D366]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">
                  School Crest / Logo
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={crest}
                    alt="School Crest"
                    className="w-12 h-12 rounded-xl object-cover border border-emerald-500/50 bg-slate-950 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <input
                      type="url"
                      value={crest}
                      onChange={(e) => setCrest(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex gap-2 mt-1.5 overflow-x-auto pb-1">
                      {crestPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCrest(preset.url)}
                          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] whitespace-nowrap cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition shadow-lg"
              >
                <span>Continue to Admin Credentials</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: ADMINISTRATOR CREDENTIALS */}
        {step === 2 && (
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-600/30 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-xs">
                  Dedicated Admin Credentials for {schoolName}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  These login credentials will be linked exclusively to{' '}
                  <span className="text-emerald-300 font-semibold">{schoolName}</span>. Staff and
                  students of this institution will never have access to other institutions on the
                  platform.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Primary Administrator Full Name *
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Dr. Ebenezer Simpson"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Official Login Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="e.g. headmaster@achimota.edu.gh"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Security Password / Passcode *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={adminTitle}
                    onChange={(e) => setAdminTitle(e.target.value)}
                    placeholder="Headmaster & Principal"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Access Role</label>
                  <select
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="proprietor">Proprietor / Super Admin</option>
                    <option value="admin">School Administrator</option>
                  </select>
                </div>
              </div>

              {/* Optional Custom School Courses & Subjects Setup */}
              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <div>
                  <h5 className="font-bold text-slate-200 text-xs">
                    Custom School Courses &amp; Subjects (Optional)
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    State your own courses/programmes and subjects now, or manage them anytime in School Settings &amp; Academics.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Custom Courses / Programmes (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={customCoursesInput}
                    onChange={(e) => setCustomCoursesInput(e.target.value)}
                    placeholder="e.g. STEM & Robotics, Pre-Nursing, Cosmetology, B.Sc. IT"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Custom Subjects / Modules (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={customSubjectsInput}
                    onChange={(e) => setCustomSubjectsInput(e.target.value)}
                    placeholder="e.g. Robotics & AI, French, Akuapem Twi, Clinical Anatomy"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer select-none pt-0.5">
                  <input
                    type="checkbox"
                    checked={skipAutoDefaults}
                    onChange={(e) => setSkipAutoDefaults(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>
                    Start strictly with our custom courses &amp; subjects (exclude automatic presets)
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer hover:bg-slate-700 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Provisioning School Workspace...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete Registration & Open Portal</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
