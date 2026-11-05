import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { SchoolProfile, UserAccount } from '../../types';
import {
  Settings,
  Building2,
  Calendar,
  Shield,
  Save,
  CheckCircle,
  RefreshCw,
  Sliders,
  Users,
  Camera,
  UserPlus,
  Trash2,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  PlusCircle,
  Lock,
  Mail,
  Layers,
  HelpCircle,
  Eye,
  EyeOff,
  Boxes,
  Sparkles,
  UtensilsCrossed,
  GraduationCap,
  Landmark,
  Bus,
  Check,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  MessageSquarePlus,
  Pencil,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { UpdateAdminPhotoModal } from '../modals/UpdateAdminPhotoModal';
import { ImageUploadModal } from '../modals/ImageUploadModal';
import { RegisterSchoolModal } from '../modals/RegisterSchoolModal';
import { PasswordResetModal } from '../modals/PasswordResetModal';
import { CustomCurriculumManager } from './CustomCurriculumManager';
import { FEATURE_CATALOG, getDefaultModulesForLevelType } from '../../data/featureCatalog';
import {
  WhatsAppLogoIcon,
  buildWhatsAppUrl,
  normalizeWhatsAppDigits,
  getSchoolWhatsAppContact,
} from '../../utils/whatsapp';

export const SchoolSettingsModule: React.FC = () => {
  const {
    school,
    schools,
    activeSchoolId,
    switchSchool,
    deleteSchool,
    updateSchoolProfile,
    currentUser,
    users,
    students,
    updateUser,
    addUserAccount,
    deleteUserAccount,
    isModuleEnabled,
    toggleSchoolModule,
    customFeatureRequests,
    requestCustomFeature,
    setActiveModule,
    isPlatformAdmin,
    firebaseUser,
    signInPlatformOwnerWithEmail,
    signInWithGoogle,
    platformOwnerEmail,
    platformOwnerProfile,
    updatePlatformOwnerProfile,
    courseTracks,
    subjects,
  } = useSchool();

  const [profile, setProfile] = useState<SchoolProfile>(school);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'curriculum' | 'admins' | 'multischool' | 'modules'>('profile');
  const [selectedFeatureCategory, setSelectedFeatureCategory] = useState<string>('All');
  const [resetPasswordTargetUser, setResetPasswordTargetUser] = useState<UserAccount | null>(null);
  const [resetOwnerPassOpen, setResetOwnerPassOpen] = useState(false);

  // Custom Feature Request Modal state
  const [showRequestFeatureModal, setShowRequestFeatureModal] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqCategory, setReqCategory] = useState('Academic / Competition');
  const [reqDescription, setReqDescription] = useState('');
  const [reqUrgency, setReqUrgency] = useState<'Standard' | 'Priority' | 'Critical Bespoke'>('Priority');
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Modals & Inline Confirmation state
  const [selectedUserForPhoto, setSelectedUserForPhoto] = useState<UserAccount | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isCrestModalOpen, setIsCrestModalOpen] = useState(false);
  const [isOwnerPortraitModalOpen, setIsOwnerPortraitModalOpen] = useState(false);
  const [ownerFormName, setOwnerFormName] = useState(platformOwnerProfile.name);
  const [ownerFormRole, setOwnerFormRole] = useState(platformOwnerProfile.roleTitle);
  const [ownerFormSubtitle, setOwnerFormSubtitle] = useState(platformOwnerProfile.subtitle);
  const [ownerFormBio, setOwnerFormBio] = useState(platformOwnerProfile.bio);
  const [ownerFormWhatsApp, setOwnerFormWhatsApp] = useState(platformOwnerProfile.whatsappNumber);
  const [ownerSavedSuccess, setOwnerSavedSuccess] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showRegisterSchoolModal, setShowRegisterSchoolModal] = useState(false);
  const [ownerAuthPending, setOwnerAuthPending] = useState(false);
  const [ownerEmailInput, setOwnerEmailInput] = useState('');
  const [ownerAuthError, setOwnerAuthError] = useState<string | null>(null);
  const [confirmDeleteSchoolId, setConfirmDeleteSchoolId] = useState<string | null>(null);
  const [confirmDeleteActiveSchool, setConfirmDeleteActiveSchool] = useState(false);
  const [confirmDeleteAdminId, setConfirmDeleteAdminId] = useState<string | null>(null);

  // Edit Admin Profile Modal state
  const [editingAdmin, setEditingAdmin] = useState<UserAccount | null>(null);
  const [editAdminName, setEditAdminName] = useState('');
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editAdminTitle, setEditAdminTitle] = useState('');
  const [editAdminRole, setEditAdminRole] = useState<UserAccount['role']>('admin');
  const [editAdminPassword, setEditAdminPassword] = useState('');

  const handleOwnerEmailVerifyForOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerAuthError(null);
    const res = signInPlatformOwnerWithEmail(ownerEmailInput, undefined, { stayOnWebsite: true });
    if (res.success && res.isPlatformAdmin) {
      setOwnerEmailInput('');
      setShowRegisterSchoolModal(true);
    } else if (res.message) {
      setOwnerAuthError(res.message);
    }
  };

  const handleOwnerVerifyForSchoolOnboarding = async (openRegisterAfter = true) => {
    setOwnerAuthError(null);
    setOwnerAuthPending(true);
    try {
      const res = await signInWithGoogle('owner', { stayOnWebsite: true });
      if (res.success && res.isPlatformAdmin) {
        if (openRegisterAfter) {
          setShowRegisterSchoolModal(true);
        }
      } else if (res.success && !res.isPlatformAdmin) {
        setOwnerAuthError('Access denied: Only the verified Platform Owner account can register or delete schools.');
      } else if (res.message) {
        setOwnerAuthError(res.message);
      }
    } finally {
      setOwnerAuthPending(false);
    }
  };

  const openEditAdminModal = (adminUser: UserAccount) => {
    setEditingAdmin(adminUser);
    setEditAdminName(adminUser.name);
    setEditAdminEmail(adminUser.email);
    setEditAdminTitle(adminUser.title);
    setEditAdminRole(adminUser.role);
    setEditAdminPassword(adminUser.password || '');
  };

  const handleSaveAdminEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin || !editAdminName.trim() || !editAdminEmail.trim()) return;
    const patch: Partial<UserAccount> = {
      name: editAdminName.trim(),
      email: editAdminEmail.trim(),
      title: editAdminTitle.trim() || 'School Administrator',
      role: editAdminRole,
    };
    if (editAdminPassword.trim()) {
      patch.password = editAdminPassword.trim();
    }
    updateUser(editingAdmin.id, patch);
    if (school.headmasterName === editingAdmin.name && editAdminName.trim() !== editingAdmin.name) {
      updateSchoolProfile({ headmasterName: editAdminName.trim() });
    }
    setEditingAdmin(null);
  };

  // New Admin form state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('admin123');
  const [newAdminTitle, setNewAdminTitle] = useState('School Administrator');
  const [newAdminRole, setNewAdminRole] = useState<UserAccount['role']>('admin');

  // Keep local profile state in sync when active school changes
  useEffect(() => {
    setProfile(school);
  }, [school]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolProfile(profile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminName.trim()) return;
    addUserAccount({
      name: newAdminName.trim(),
      email: newAdminEmail.trim(),
      password: newAdminPassword.trim() || 'admin123',
      role: newAdminRole,
      title: newAdminTitle.trim() || 'School Administrator',
      avatar: school.crest || '/assets/aistudio/PASSPORT_PICTURE_af7dd76f.jpg',
    });
    setNewAdminEmail('');
    setNewAdminName('');
    setNewAdminPassword('admin123');
    setShowAddAdminModal(false);
  };

  const handleFeatureRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim() || !reqDescription.trim()) return;
    requestCustomFeature({
      title: reqTitle.trim(),
      category: reqCategory,
      description: reqDescription.trim(),
      urgency: reqUrgency,
    });
    setRequestSuccess(true);
    setTimeout(() => {
      setRequestSuccess(false);
      setShowRequestFeatureModal(false);
      setReqTitle('');
      setReqDescription('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            School Governance & Multi-Tenancy Hub
          </h2>
          <p className="text-xs text-slate-400">
            Active Institution: <span className="text-emerald-400 font-semibold">{school.name}</span> ({school.code})
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>School Profile & Crest</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'curriculum'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Courses &amp; Subjects ({courseTracks.length + subjects.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'admins'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Admins, Faculty &amp; Accounts ({users.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('multischool')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'multischool'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Multi-School & Isolation ({schools.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'modules'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Modular Features & Add-ons</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SCHOOL PROFILE & CREST */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Institutional Crest & Identity Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl border-2 border-emerald-400 p-1 bg-slate-950 overflow-hidden shadow-xl flex-shrink-0">
                  <img
                    src={school.crest}
                    alt={school.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsCrestModalOpen(true)}
                  className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-emerald-400" />
                  <span className="text-[9px] font-bold text-white mt-1">Change</span>
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-white uppercase tracking-tight">
                    {school.name}
                  </h3>
                  <span className="text-[10px] uppercase font-bold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                    {school.code}
                  </span>
                </div>
                <p className="text-xs text-slate-400 italic mt-0.5">"{school.motto}"</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                  <span>Level: <strong className="text-white">{school.levelType}</strong></span>
                  <span>•</span>
                  <span>Region: <strong className="text-white">{school.region}</strong></span>
                  <span>•</span>
                  <span>Enrolled: <strong className="text-emerald-400">{students.length} Students</strong></span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCrestModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition cursor-pointer shadow"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Update School Crest / Logo</span>
            </button>
          </div>

          {/* Main Settings Form */}
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white text-xs space-y-6">
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Institutional Configuration
              </h3>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saveSuccess ? 'Changes Saved!' : 'Save School Settings'}
              </button>
            </div>

            {/* School Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">School Full Name *</label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">School Code *</label>
                <input
                  type="text"
                  required
                  value={profile.code}
                  onChange={(e) => setProfile({ ...profile, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">School Motto</label>
                <input
                  type="text"
                  value={profile.motto}
                  onChange={(e) => setProfile({ ...profile, motto: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white italic focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Institution Classification</label>
                <select
                  value={profile.levelType}
                  onChange={(e) => setProfile({ ...profile, levelType: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <optgroup label="Basic & Secondary Schools">
                    <option value="SHS">Senior High School (SHS)</option>
                    <option value="Basic & JHS">Basic &amp; Junior High School</option>
                    <option value="Combined">Comprehensive (KG through SHS 3)</option>
                  </optgroup>
                  <optgroup label="Professional & Certificate Institutes">
                    <option value="Professional Institute">Professional &amp; Chartered Institute</option>
                    <option value="Vocational Training Centre">Certificate &amp; Vocational Training Centre</option>
                    <option value="College / Polytechnic">College / Polytechnic</option>
                    <option value="Executive Education">Executive Education &amp; Certificate Academy</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Location & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-slate-800 pt-4">
              <div>
                <label className="block text-slate-400 mb-1">Region (Ghana)</label>
                <input
                  type="text"
                  value={profile.region}
                  onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">District / Municipality</label>
                <input
                  type="text"
                  value={profile.district}
                  onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Official Telephone</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Campus Physical Address</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Official Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* School Owner Direct WhatsApp Configuration */}
            <div className="border-t border-slate-800 pt-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <WhatsAppLogoIcon className="w-4 h-4 text-[#25D366]" />
                    <span>School Owner Direct WhatsApp Contact</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Enable visitors, parents, and prospective students to message {profile.name} directly by clicking the WhatsApp logo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setProfile({
                      ...profile,
                      whatsappEnabled: profile.whatsappEnabled === false ? true : false,
                    })
                  }
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap self-start sm:self-auto ${
                    profile.whatsappEnabled !== false
                      ? 'bg-[#25D366]/15 border border-[#25D366]/50 text-[#25D366]'
                      : 'bg-slate-950 border border-slate-800 text-slate-400'
                  }`}
                >
                  {profile.whatsappEnabled !== false ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      <span>WhatsApp Button Enabled</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>WhatsApp Button Disabled</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">
                    School Owner / Admissions WhatsApp Number (International or Ghana Local Format)
                  </label>
                  <input
                    type="tel"
                    value={profile.whatsappNumber ?? profile.phone ?? ''}
                    onChange={(e) => setProfile({ ...profile, whatsappNumber: e.target.value })}
                    placeholder="e.g. +233 207615941 or 024 400 0000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-[#25D366]"
                  />
                </div>

                <div>
                  {normalizeWhatsAppDigits(profile.whatsappNumber ?? profile.phone).length >= 9 ? (
                    <a
                      href={buildWhatsAppUrl(
                        profile.whatsappNumber || profile.phone,
                        `Hello ${profile.name}, testing our institutional WhatsApp contact link from EduDigital SIS.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs transition whitespace-nowrap"
                    >
                      <WhatsAppLogoIcon className="w-4 h-4 shrink-0" />
                      <span>Test WhatsApp Link</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ) : (
                    <div className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 text-[11px] text-center">
                      Enter a valid phone number to test link
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Calendar & Term Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-slate-800 pt-4">
              <div>
                <label className="block text-slate-400 mb-1">Active Academic Year</label>
                <input
                  type="text"
                  value={profile.currentAcademicYear}
                  onChange={(e) => setProfile({ ...profile, currentAcademicYear: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 2025/2026"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Active Academic Term</label>
                <select
                  value={profile.currentTerm}
                  onChange={(e) => setProfile({ ...profile, currentTerm: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                  <option value="Semester 1">Semester 1 (Double Track)</option>
                  <option value="Semester 2">Semester 2 (Double Track)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Next Term Resumption Date</label>
                <input
                  type="date"
                  value={profile.nextTermBegins}
                  onChange={(e) => setProfile({ ...profile, nextTermBegins: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Headmaster / Principal Name</label>
                <input
                  type="text"
                  value={profile.headmasterName}
                  onChange={(e) => setProfile({ ...profile, headmasterName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Digital Signature Title</label>
                <input
                  type="text"
                  value={profile.headmasterSignature}
                  onChange={(e) => setProfile({ ...profile, headmasterSignature: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-serif italic focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Functional Currency</label>
                <input
                  type="text"
                  value={profile.currency}
                  onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </form>

          {/* Danger Zone: Delete This Institution & Workspace Profile */}
          <div className="bg-slate-900 border border-rose-900/60 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Delete Institution &amp; Workspace Profile</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                Permanently delete <strong className="text-white">{school.name} ({school.code})</strong>, including its school profile, administrator accounts, programmes, courses, student records, and cloud workspace documents.
              </p>
              {ownerAuthError && (
                <p className="text-[11px] text-rose-400 pt-1">{ownerAuthError}</p>
              )}
            </div>

            <div className="shrink-0">
              {isPlatformAdmin ? (
                confirmDeleteActiveSchool ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteActiveSchool(false);
                        deleteSchool(school.id);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm Permanent Deletion</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteActiveSchool(false)}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteActiveSchool(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-200 text-xs font-bold transition cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Delete School &amp; Profile</span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  disabled={ownerAuthPending}
                  onClick={() => handleOwnerVerifyForSchoolOnboarding(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer whitespace-nowrap disabled:opacity-60"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {ownerAuthPending ? 'Verifying Owner...' : 'Verify Platform Owner to Delete School'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1B: SCHOOL CUSTOM COURSES, PROGRAMMES & SUBJECTS */}
      {activeTab === 'curriculum' && <CustomCurriculumManager />}

      {/* TAB 2: ADMINISTRATORS, FACULTY & PORTAL ACCOUNT MANAGEMENT */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          {/* Super Administrator: Platform Owner & Developer Public Website Portrait & Bio */}
          {isPlatformAdmin && (
            <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 text-white space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-emerald-400">
                    Super Administrator Control · Public Website Profile &amp; Security
                  </div>
                  <h3 className="font-bold text-base text-white mt-0.5">
                    Platform Owner &amp; Developer Portrait, Password &amp; WhatsApp Contact
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload or replace the official passport photograph, manage your Platform Owner sign-in password ({platformOwnerEmail}), and update your public contact details.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setResetOwnerPassOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <KeyRound className="w-3.5 h-3.5 shrink-0" />
                    <span>Set / Reset Owner Password</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOwnerPortraitModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Camera className="w-4 h-4 shrink-0" />
                    <span>Upload / Replace Owner Photo</span>
                  </button>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updatePlatformOwnerProfile({
                    name: ownerFormName.trim() || platformOwnerProfile.name,
                    roleTitle: ownerFormRole.trim() || platformOwnerProfile.roleTitle,
                    subtitle: ownerFormSubtitle.trim() || platformOwnerProfile.subtitle,
                    bio: ownerFormBio.trim() || platformOwnerProfile.bio,
                    whatsappNumber: ownerFormWhatsApp.trim() || '+233 207 615 941',
                  });
                  setOwnerSavedSuccess(true);
                  setTimeout(() => setOwnerSavedSuccess(false), 2200);
                }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs"
              >
                <div className="lg:col-span-3 flex flex-col items-center gap-2.5">
                  <div className="w-36 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-950 shadow-lg">
                    <img
                      src={platformOwnerProfile.photoUrl || '/assets/aistudio/PASSPORT_PICTURE_af7dd76f.jpg'}
                      alt={platformOwnerProfile.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOwnerPortraitModalOpen(true)}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 cursor-pointer"
                  >
                    Crop or Change Passport Photo
                  </button>
                </div>

                <div className="lg:col-span-9 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Owner Full Name</label>
                      <input
                        type="text"
                        value={ownerFormName}
                        onChange={(e) => setOwnerFormName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Official Role Title</label>
                      <input
                        type="text"
                        value={ownerFormRole}
                        onChange={(e) => setOwnerFormRole(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">WhatsApp Contact</label>
                      <input
                        type="tel"
                        value={ownerFormWhatsApp}
                        onChange={(e) => setOwnerFormWhatsApp(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Website Section Subtitle</label>
                    <input
                      type="text"
                      value={ownerFormSubtitle}
                      onChange={(e) => setOwnerFormSubtitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Professional Introduction</label>
                    <textarea
                      rows={3}
                      value={ownerFormBio}
                      onChange={(e) => setOwnerFormBio(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-1">
                    {ownerSavedSuccess && (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Website Owner Profile Updated
                      </span>
                    )}
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer whitespace-nowrap"
                    >
                      <Save className="w-3.5 h-3.5 shrink-0" />
                      <span>Save Website Owner Profile</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Administrators, Lecturers, Teachers &amp; Access Roles for {school.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Manage school administrators, proprietors, lecturers, teachers, staff accounts, and reset forgotten portal passwords.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddAdminModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-lg whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>+ Add Portal Account</span>
            </button>
          </div>

          {users.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <Users className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">No Administrator Accounts Assigned</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  All administrator profiles for {school.name} have been removed. Click below to create a new administrator or proprietor profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAdminModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Create Administrator Profile</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map((adminUser) => {
                const isOwner = adminUser.role === 'proprietor';
                const isCurrentSession = adminUser.id === currentUser.id;
                const isConfirmingDelete = confirmDeleteAdminId === adminUser.id;
                return (
                  <div
                    key={adminUser.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 text-white flex flex-col justify-between gap-4 transition shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative group flex-shrink-0">
                        <div className="w-16 h-16 rounded-2xl border-2 border-emerald-500/40 p-0.5 bg-slate-950 overflow-hidden shadow-md">
                          <img
                            src={adminUser.avatar}
                            alt={adminUser.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForPhoto(adminUser);
                            setIsPhotoModalOpen(true);
                          }}
                          className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          title="Update Photo"
                        >
                          <Camera className="w-4 h-4 text-emerald-400" />
                          <span className="text-[9px] font-bold mt-0.5">Photo</span>
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-sm text-white truncate">{adminUser.name}</h4>
                          {isOwner && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700">
                              Owner / Proprietor
                            </span>
                          )}
                          {isCurrentSession && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                              Active Session
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{adminUser.email}</p>
                        <p className="text-[11px] text-emerald-400 font-medium mt-1 truncate">{adminUser.title}</p>
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 capitalize">
                          Role: {adminUser.role}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80">
                      {isConfirmingDelete ? (
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-rose-950/40 border border-rose-800/60 rounded-xl px-3 py-2">
                          <span className="text-[11px] text-rose-200 font-semibold">
                            Delete {adminUser.name} &amp; profile?
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDeleteAdminId(null);
                                deleteUserAccount(adminUser.id);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition cursor-pointer whitespace-nowrap"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteAdminId(null)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForPhoto(adminUser);
                              setIsPhotoModalOpen(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-emerald-950 hover:border-emerald-600/50 hover:text-emerald-300 border border-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer whitespace-nowrap"
                          >
                            <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Photo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setResetPasswordTargetUser(adminUser)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-emerald-950 hover:border-emerald-600/50 hover:text-emerald-300 border border-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer whitespace-nowrap"
                            title={`Reset Password for ${adminUser.name}`}
                          >
                            <KeyRound className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Reset Password</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditAdminModal(adminUser)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer whitespace-nowrap"
                          >
                            <Pencil className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteAdminId(adminUser.id)}
                            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/70 border border-slate-800 hover:border-rose-700/60 text-xs font-bold text-slate-400 hover:text-rose-300 transition cursor-pointer whitespace-nowrap"
                            title="Delete Account & Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MULTI-SCHOOL DIRECTORY & TENANT ISOLATION ARCHITECTURE */}
      {activeTab === 'multischool' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">
                  Multi-School Tenancy & Branch Management
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                EduDigital SIS hosts multiple independent institutions on a single platform with zero cross-school data leak.
              </p>
            </div>

            {isPlatformAdmin ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Platform Owner Verified
                </span>
                <button
                  type="button"
                  onClick={() => setShowRegisterSchoolModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-lg"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Register New School</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:items-end gap-2">
                <form
                  onSubmit={handleOwnerEmailVerifyForOnboarding}
                  className="flex flex-wrap items-center gap-2"
                >
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={ownerEmailInput}
                      onChange={(e) => {
                        setOwnerEmailInput(e.target.value);
                        setOwnerAuthError(null);
                      }}
                      placeholder="Platform Owner email"
                      className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-52"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer whitespace-nowrap"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Owner Email Sign-In</span>
                  </button>
                  <button
                    type="button"
                    disabled={ownerAuthPending}
                    onClick={() => handleOwnerVerifyForSchoolOnboarding(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-emerald-300 font-semibold text-xs transition cursor-pointer disabled:opacity-60 whitespace-nowrap"
                  >
                    <span>
                      {ownerAuthPending ? 'Verifying...' : 'Or Google'}
                    </span>
                  </button>
                </form>
                {ownerAuthError && (
                  <p className="text-[11px] text-rose-400">{ownerAuthError}</p>
                )}
              </div>
            )}
          </div>

          {/* Registered Schools List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schools.map((s) => {
              const isActive = s.id === activeSchoolId;
              return (
                <div
                  key={s.id}
                  className={`p-5 rounded-2xl border transition shadow-lg flex flex-col justify-between gap-4 ${
                    isActive
                      ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-emerald-950/50'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl border border-emerald-500/40 p-0.5 bg-slate-950 overflow-hidden shadow">
                        <img
                          src={s.crest}
                          alt={s.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      {isActive ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-900 text-emerald-300 border border-emerald-500 text-[10px] font-black uppercase tracking-wider">
                          <CheckCircle className="w-3 h-3" />
                          Active School
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                          {s.code}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-white line-clamp-1">{s.name}</h4>
                    <p className="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">"{s.motto}"</p>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
                      <div className="flex justify-between">
                        <span>Level:</span>
                        <span className="text-white font-semibold">{s.levelType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Region:</span>
                        <span className="text-slate-300">{s.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Official Email:</span>
                        <span className="text-emerald-400 font-mono truncate max-w-[140px]">{s.email}</span>
                      </div>
                      {(() => {
                        const wa = getSchoolWhatsAppContact(s);
                        if (!wa.enabled) return null;
                        return (
                          <div className="flex justify-between items-center">
                            <span>Owner WhatsApp:</span>
                            <span className="text-[#25D366] font-mono tabular-nums truncate max-w-[140px]">
                              {wa.rawNumber}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    {isActive ? (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Currently Managing
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => switchSchool(s.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer"
                      >
                        <span>Switch into {s.code}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {(() => {
                      const wa = getSchoolWhatsAppContact(s);
                      if (!wa.enabled) return null;
                      return (
                        <a
                          href={buildWhatsAppUrl(
                            wa.rawNumber,
                            `Hello ${s.name}, reaching out from the EduDigital SIS Multi-School Directory.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`WhatsApp ${s.name} Owner (${wa.rawNumber})`}
                          className="p-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-slate-950 border border-[#25D366]/40 transition shrink-0"
                        >
                          <WhatsAppLogoIcon className="w-4 h-4" />
                        </a>
                      );
                    })()}

                    {isPlatformAdmin && (
                      confirmDeleteSchoolId === s.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteSchoolId(null);
                              deleteSchool(s.id);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold transition cursor-pointer whitespace-nowrap"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteSchoolId(null)}
                            className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition cursor-pointer whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSchoolId(s.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                          title={`Delete ${s.name} & Profile`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Architectural Answers & Isolation Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="font-bold text-base text-white">
                  Multi-Tenancy & Data Isolation Architecture
                </h3>
                <p className="text-xs text-slate-400">
                  Compliance with Ghana Data Protection Act 2012 (Act 843) and Ministry of Education standards.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* Question 1 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-black flex items-center justify-center text-sm">
                  1
                </div>
                <h4 className="font-bold text-sm text-white">
                  Can the app be used by multiple schools?
                </h4>
                <div className="text-slate-300 leading-relaxed space-y-2">
                  <p>
                    <strong className="text-emerald-400 font-bold">YES, absolutely.</strong> EduDigital SIS is engineered from the ground up as a native <strong>Multi-Tenant Software-as-a-Service (SaaS)</strong> platform.
                  </p>
                  <p className="text-slate-400">
                    Multiple professional institutes and basic/secondary schools that you register run simultaneously on the same platform while retaining completely separate identities, institutional codes, academic calendars, and custom logos.
                  </p>
                </div>
              </div>

              {/* Question 2 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-black flex items-center justify-center text-sm">
                  2
                </div>
                <h4 className="font-bold text-sm text-white">
                  Who can onboard or register a new school?
                </h4>
                <div className="text-slate-300 leading-relaxed space-y-2">
                  <p>
                    <strong className="text-emerald-400 font-bold">Platform Charter Owner Only.</strong> Visitors and existing schools cannot self-register or add new institutions.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                    <li>Only the verified Platform Administrator can provision a new school workspace in Cloud Firestore.</li>
                    <li>Once provisioned, the school receives isolated administrator and student credentials.</li>
                  </ul>
                  <p className="text-slate-400 pt-1">
                    This prevents unauthorized or unvetted institutions from appearing in the public credential registry.
                  </p>
                </div>
              </div>

              {/* Question 3 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-black flex items-center justify-center text-sm">
                  3
                </div>
                <h4 className="font-bold text-sm text-white">
                  Can one school see activities of another school?
                </h4>
                <div className="text-slate-300 leading-relaxed space-y-2">
                  <p>
                    <strong className="text-rose-400 font-bold">NO, NEVER.</strong> Data isolation is strictly enforced at the database partition level.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                    <li><strong className="text-white">Zero Cross-School Leak:</strong> School A has zero visibility into School B's students, teachers, or finances.</li>
                    <li><strong className="text-white">Isolated Financials:</strong> Fee collections (MoMo / cash), staff payroll, and accounts ledgers are completely segregated.</li>
                    <li><strong className="text-white">Scoped Credentials:</strong> Teachers, students, and admins only have query rights to their specific school.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MODULAR FEATURES & PER-SCHOOL ADD-ONS */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          {/* Architecture Isolation Notice */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/40 rounded-2xl p-6 text-white space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">
                      Per-School Modular Architecture & Feature Isolation
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Multi-Tenant Engine
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    <strong>Can a specific school have a feature that other schools don't? YES!</strong> Every institution operates with its own tenant feature flags. Toggling an add-on below activates it <em>only</em> for <strong>{school.name}</strong> ({school.code}). Other schools on EduDigital SIS do not see, execute, or get billed for modules they do not activate.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRequestFeatureModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all shrink-0 cursor-pointer"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Request Custom Feature</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dynamic Sidebar & Navigation gating</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Isolated DB schemas & tenant data</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>No UI clutter for unneeded tools</span>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-slate-400 font-semibold mr-1">Filter:</span>
            {['All', 'Operations', 'Academic', 'Finance & Commerce', 'Security & IoT', 'Community & Alumni'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedFeatureCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedFeatureCategory === cat
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Modular Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURE_CATALOG.filter(
              (f) => selectedFeatureCategory === 'All' || f.category === selectedFeatureCategory
            ).map((feature) => {
              const enabled = isModuleEnabled(feature.id);

              return (
                <div
                  key={feature.id}
                  className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                    enabled
                      ? 'border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                      : 'border-slate-800 opacity-90 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            enabled
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {feature.id === 'boarding_house' && <Building2 className="w-5 h-5" />}
                          {feature.id === 'transport_fleet' && <Bus className="w-5 h-5" />}
                          {feature.id === 'cambridge_curriculum' && <GraduationCap className="w-5 h-5" />}
                          {feature.id === 'canteen_pos' && <UtensilsCrossed className="w-5 h-5" />}
                          {feature.id === 'biometric_gate' && <ShieldCheck className="w-5 h-5" />}
                          {feature.id === 'alumni_endowment' && <Landmark className="w-5 h-5" />}
                          {feature.id === 'ai_analytics' && <Sparkles className="w-5 h-5" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white">{feature.name}</h4>
                            {feature.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                {feature.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{feature.tagline}</p>
                        </div>
                      </div>

                      {/* Toggle button */}
                      <button
                        type="button"
                        onClick={() => toggleSchoolModule(feature.id)}
                        className={`p-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          enabled
                            ? 'text-emerald-400 hover:text-emerald-300'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title={enabled ? 'Click to disable for this school' : 'Click to enable for this school'}
                      >
                        {enabled ? (
                          <ToggleRight className="w-7 h-7 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-slate-600" />
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{feature.description}</p>

                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Target Segment:</span>
                        <span className="font-medium text-slate-200">{feature.targetAudience}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Common in Ghana:</span>
                        <span className="font-medium text-indigo-400">{feature.typicalClients}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span
                      className={`text-xs font-bold flex items-center gap-1.5 ${
                        enabled ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      {enabled ? 'Active on This School' : 'Disabled for This School'}
                    </span>

                    {enabled && (
                      <button
                        type="button"
                        onClick={() => {
                          if (feature.id === 'cambridge_curriculum') setActiveModule('cambridge-curriculum');
                          else if (feature.id === 'canteen_pos') setActiveModule('canteen-pos');
                          else if (feature.id === 'biometric_gate') setActiveModule('biometric-gate');
                          else if (feature.id === 'alumni_endowment') setActiveModule('alumni-endowment');
                          else if (feature.id === 'boarding_house' || feature.id === 'transport_fleet') setActiveModule('welfare-transport');
                          else if (feature.id === 'ai_analytics') setActiveModule('ai-analytics');
                        }}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <span>Open Module</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cross-School Isolation Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  Live School Feature Isolation Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Observe how each school on the platform maintains its own bespoke module combination:
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">School Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Boarding House</th>
                    <th className="py-2.5 px-3">Bus Fleet</th>
                    <th className="py-2.5 px-3">Cambridge Stream</th>
                    <th className="py-2.5 px-3">Canteen POS</th>
                    <th className="py-2.5 px-3">Turnstiles</th>
                    <th className="py-2.5 px-3">Alumni</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {schools.map((s) => {
                    const isCurrent = s.id === activeSchoolId;
                    const mods = s.enabledModules || getDefaultModulesForLevelType(s.levelType);

                    return (
                      <tr
                        key={s.id}
                        className={isCurrent ? 'bg-emerald-950/20 font-medium' : 'hover:bg-slate-800/30'}
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{s.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{s.code}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {s.levelType}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          {mods.includes('boarding_house') ? (
                            <span className="text-emerald-400">✓ Active</span>
                          ) : (
                            <span className="text-slate-600">— Hidden</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          {mods.includes('transport_fleet') ? (
                            <span className="text-emerald-400">✓ Active</span>
                          ) : (
                            <span className="text-slate-600">— Hidden</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          {mods.includes('cambridge_curriculum') ? (
                            <span className="text-indigo-400">✓ Dual CIE</span>
                          ) : (
                            <span className="text-slate-600">— Disabled</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          {mods.includes('canteen_pos') ? (
                            <span className="text-amber-400">✓ RFID Card</span>
                          ) : (
                            <span className="text-slate-600">— Inactive</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          {mods.includes('biometric_gate') ? (
                            <span className="text-emerald-400">✓ Online</span>
                          ) : (
                            <span className="text-slate-600">— Inactive</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          {mods.includes('alumni_endowment') ? (
                            <span className="text-amber-400">✓ Active</span>
                          ) : (
                            <span className="text-slate-600">— Inactive</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {!isCurrent ? (
                            <button
                              type="button"
                              onClick={() => switchSchool(s.id)}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                            >
                              Switch School
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-bold">Selected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submitted Bespoke Feature Requests Pipeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Bespoke Feature Development Pipeline
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Custom capabilities requested by individual institutions:
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                {customFeatureRequests.length} Custom Requests
              </span>
            </div>

            {customFeatureRequests.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                No custom feature requests submitted yet. Click "Request Custom Feature" above to submit one for {school.name}.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {customFeatureRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {req.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            req.status === 'Ready to Deploy'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : req.status === 'In Development'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <h5 className="font-bold text-xs text-white leading-snug">{req.title}</h5>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{req.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-500 space-y-0.5">
                      <div>
                        School: <strong className="text-slate-300">{req.schoolName}</strong>
                      </div>
                      <div>
                        Requested by: {req.requestedBy} • {req.requestedAt}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REQUEST CUSTOM BESPOKE FEATURE MODAL */}
      {showRequestFeatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Request Bespoke School Feature</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestFeatureModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Tell us what tailored feature <strong>{school.name}</strong> needs. Once developed by the engineering team, it will be provisioned directly to your school tenant.
            </p>

            <form onSubmit={handleFeatureRequestSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Feature Title *</label>
                <input
                  type="text"
                  required
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  placeholder="e.g. SRC Electronic Voting & Balloting System"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Operational Category</label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Academic / Competition">Academic / Competition</option>
                    <option value="Campus Security / IoT">Campus Security / IoT</option>
                    <option value="Finance / MoMo Billing">Finance / MoMo Billing</option>
                    <option value="Hostel & Facilities">Hostel & Facilities</option>
                    <option value="Sports & Co-Curricular">Sports & Co-Curricular</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Urgency Priority</label>
                  <select
                    value={reqUrgency}
                    onChange={(e) => setReqUrgency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Standard">Standard (Next Cycle)</option>
                    <option value="Priority">Priority (High Value)</option>
                    <option value="Critical Bespoke">Critical Bespoke (Immediate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Functional Description & Workflow *</label>
                <textarea
                  required
                  rows={4}
                  value={reqDescription}
                  onChange={(e) => setReqDescription(e.target.value)}
                  placeholder="Describe how the feature should work, who will use it, and what reports or permissions are required..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {requestSuccess && (
                <div className="bg-emerald-950/60 border border-emerald-500 text-emerald-200 text-xs p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Custom feature request submitted! Tracked in your school pipeline.</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestFeatureModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-md"
                >
                  Submit Feature Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Add School Administrator</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAdminModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Dr. Kwame Mensah"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@institution.edu.gh"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Access Role *</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as UserAccount['role'])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="admin">Administrator (Full Admin Access)</option>
                  <option value="proprietor">Proprietor / Rector / Super Admin</option>
                  <option value="teacher">Lecturer / Teacher / Tutor</option>
                  <option value="accountant">Bursar / Accountant</option>
                  <option value="librarian">Librarian / Resource Officer</option>
                  <option value="housemaster">Housemaster / Welfare Officer</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Designation / Title</label>
                <input
                  type="text"
                  value={newAdminTitle}
                  onChange={(e) => setNewAdminTitle(e.target.value)}
                  placeholder="e.g. Academic Registrar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Portal Password / PIN *</label>
                <input
                  type="password"
                  required
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer whitespace-nowrap"
                >
                  Add Administrator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMINISTRATOR PROFILE MODAL */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Edit Administrator Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdminEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editAdminName}
                  onChange={(e) => setEditAdminName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  value={editAdminEmail}
                  onChange={(e) => setEditAdminEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Designation / Title</label>
                <input
                  type="text"
                  value={editAdminTitle}
                  onChange={(e) => setEditAdminTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Access Role</label>
                <select
                  value={editAdminRole}
                  onChange={(e) => setEditAdminRole(e.target.value as UserAccount['role'])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="proprietor">Proprietor / Rector / Super Admin</option>
                  <option value="admin">Administrator (Full Admin Access)</option>
                  <option value="teacher">Lecturer / Teacher / Tutor</option>
                  <option value="accountant">Bursar / Accountant</option>
                  <option value="librarian">Librarian / Resource Officer</option>
                  <option value="housemaster">Housemaster / Welfare Officer</option>
                  <option value="parent">Parent / Guardian</option>
                  <option value="student">Student / Candidate</option>
                  <option value="graduate">Graduate / Alumni</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Portal Password / PIN</label>
                <input
                  type="password"
                  value={editAdminPassword}
                  onChange={(e) => setEditAdminPassword(e.target.value)}
                  placeholder="Leave unchanged or enter new password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const targetId = editingAdmin.id;
                    setEditingAdmin(null);
                    setConfirmDeleteAdminId(targetId);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 font-bold cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Profile</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAdmin(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer whitespace-nowrap"
                  >
                    Save Profile
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE ADMIN PHOTO MODAL */}
      <UpdateAdminPhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => {
          setIsPhotoModalOpen(false);
          setSelectedUserForPhoto(null);
        }}
        targetUser={selectedUserForPhoto || undefined}
      />

      {/* UPDATE SCHOOL CREST MODAL */}
      <ImageUploadModal
        isOpen={isCrestModalOpen}
        onClose={() => setIsCrestModalOpen(false)}
        targetType="school_crest"
        currentImage={school.crest}
        title="Update School Crest / Institutional Logo"
        subtitle="Upload an official emblem file or choose from curated Ghanaian school heraldry"
        entityName={school.name}
        entityRoleOrCode={school.code}
        onSave={(newCrest) => {
          updateSchoolProfile({ crest: newCrest });
          setIsCrestModalOpen(false);
        }}
      />

      {/* UPDATE PLATFORM OWNER PORTRAIT MODAL */}
      {isPlatformAdmin && (
        <ImageUploadModal
          isOpen={isOwnerPortraitModalOpen}
          onClose={() => setIsOwnerPortraitModalOpen(false)}
          targetType="platform_owner"
          currentImage={platformOwnerProfile.photoUrl || '/assets/aistudio/PASSPORT_PICTURE_af7dd76f.jpg'}
          title="Update Platform Owner & Developer Portrait"
          subtitle="Upload, crop, resize, or replace the official passport photograph displayed on the public website"
          entityName={platformOwnerProfile.name}
          entityRoleOrCode={platformOwnerProfile.roleTitle}
          onSave={(newPhoto) => {
            updatePlatformOwnerProfile({ photoUrl: newPhoto });
            setIsOwnerPortraitModalOpen(false);
          }}
        />
      )}

      {/* REGISTER SCHOOL MODAL (Platform Super Admin Only) */}
      {isPlatformAdmin && (
        <RegisterSchoolModal
          isOpen={showRegisterSchoolModal}
          onClose={() => setShowRegisterSchoolModal(false)}
        />
      )}

      {/* PASSWORD RESET MODAL FOR PORTAL ACCOUNTS */}
      <PasswordResetModal
        isOpen={Boolean(resetPasswordTargetUser)}
        onClose={() => setResetPasswordTargetUser(null)}
        flowMode="admin-override"
        initialSchoolId={activeSchoolId}
        initialIdentifier={resetPasswordTargetUser?.email || ''}
        targetAccountLabel={resetPasswordTargetUser?.name}
      />

      {/* PASSWORD RESET MODAL FOR PLATFORM OWNER */}
      {isPlatformAdmin && (
        <PasswordResetModal
          isOpen={resetOwnerPassOpen}
          onClose={() => setResetOwnerPassOpen(false)}
          flowMode="admin-override"
          initialRoleTab="owner"
          initialIdentifier={platformOwnerEmail}
          targetAccountLabel={`${platformOwnerProfile.name} (Platform Owner)`}
        />
      )}
    </div>
  );
};
