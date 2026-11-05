import React from 'react';
import { useSchool } from '../context/SchoolContext';
import { isInstituteLevelType } from '../types';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  GraduationCap,
  CalendarCheck,
  FileSpreadsheet,
  Wallet,
  DollarSign,
  HeartHandshake,
  Bus,
  BookOpen,
  Send,
  Sparkles,
  Settings,
  Shield,
  UtensilsCrossed,
  ShieldCheck,
  Landmark,
  BookOpenCheck,
  Award,
  BadgeCheck,
  Database,
  Globe,
  Target,
} from 'lucide-react';

interface SidebarMenuItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface SidebarSection {
  title: string;
  items: SidebarMenuItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const {
    school,
    activeModule,
    setActiveModule,
    currentUser,
    admissions,
    photoChangeRequests,
    isModuleEnabled,
  } = useSchool();

  const isInstitute = isInstituteLevelType(school.levelType);
  const pendingAdmissions = admissions.filter((a) => a.status === 'Pending').length;
  const pendingPhotos = photoChangeRequests.filter((r) => r.status === 'Pending Review').length;

  const basicAcademicItems: SidebarMenuItem[] = [
    { id: 'academics', label: 'Curriculum & Timetable', icon: GraduationCap },
    { id: 'attendance', label: 'Student & Staff Attendance', icon: CalendarCheck },
    { id: 'examinations', label: 'Examinations & Report Cards', icon: FileSpreadsheet },
    { id: 'bece-mock-exams', label: 'BECE Mock & AI Prep', icon: Target },
    {
      id: 'research-journal',
      label: 'Research & Journal Press',
      icon: BookOpenCheck,
    },
  ];
  if (isModuleEnabled('cambridge_curriculum')) {
    basicAcademicItems.push({
      id: 'cambridge-curriculum',
      label: 'Cambridge & IGCSE Stream',
      icon: GraduationCap,
    });
  }

  const financeItems: SidebarMenuItem[] = [
    {
      id: 'finance',
      label: isInstitute ? 'Tuition & MoMo Billing' : 'Fees & Mobile Money',
      icon: Wallet,
    },
    { id: 'payroll', label: 'Staff & SSNIT/GRA Payroll', icon: DollarSign },
  ];
  if (!isInstitute && isModuleEnabled('canteen_pos')) {
    financeItems.push({
      id: 'canteen-pos',
      label: 'Canteen & Meal Card POS',
      icon: UtensilsCrossed,
    });
  }

  const basicOperationsItems: SidebarMenuItem[] = [
    { id: 'welfare-transport', label: 'Boarding, Health & Transport', icon: Bus },
    { id: 'library-inventory', label: 'Library & School Assets', icon: BookOpen },
    {
      id: 'ai-analytics',
      label: 'Academic Analytics & Exams',
      icon: Sparkles,
    },
  ];
  if (isModuleEnabled('biometric_gate')) {
    basicOperationsItems.push({
      id: 'biometric-gate',
      label: 'Biometric Turnstiles & Gate',
      icon: ShieldCheck,
    });
  }
  if (isModuleEnabled('alumni_endowment')) {
    basicOperationsItems.push({
      id: 'alumni-endowment',
      label: 'Alumni Endowment Hub',
      icon: Landmark,
    });
  }

  const parentSections: SidebarSection[] = [
    {
      title: 'Parent & Guardian Portal',
      items: [
        {
          id: 'parent-portal',
          label: 'Ward Academic & Fee Portal',
          icon: HeartHandshake,
        },
        {
          id: 'communication',
          label: 'School Notices & Bulletins',
          icon: Send,
        },
        {
          id: 'employer-verification',
          label: 'Verify Certificate',
          icon: BadgeCheck,
        },
        {
          id: 'research-journal',
          label: 'Research & Journal Press',
          icon: BookOpenCheck,
        },
        {
          id: 'platform-website',
          label: 'Official Website',
          icon: Globe,
        },
      ],
    },
  ];

  const studentOrGraduateSections: SidebarSection[] = [
    {
      title: isInstitute ? 'Candidate & Graduate Portal' : 'Student Portal',
      items: [
        {
          id: 'parent-portal',
          label:
            currentUser.role === 'graduate'
              ? 'My Graduate & Credentials Vault'
              : isInstitute
              ? 'My Courses, Flyers & Certificates'
              : 'My Academic & Report Portal',
          icon: GraduationCap,
        },
        {
          id: 'employer-verification',
          label: 'Public Credential Verification',
          icon: BadgeCheck,
        },
        {
          id: 'research-journal',
          label: 'Research & Journal Press',
          icon: BookOpenCheck,
        },
        {
          id: 'communication',
          label: isInstitute ? 'Institute Notices & Diets' : 'School Notices & Bulletins',
          icon: Send,
        },
        {
          id: 'platform-website',
          label: 'Official Website',
          icon: Globe,
        },
      ],
    },
  ];

  const instituteStaffSections: SidebarSection[] = [
    {
      title: 'Institute Governance',
      items: [
        { id: 'dashboard', label: 'Institute Executive Overview', icon: LayoutDashboard },
        { id: 'school-settings', label: 'Institute Profile & Modules', icon: Settings },
        { id: 'data-export', label: 'Data Export & Backups', icon: Database },
        { id: 'platform-website', label: 'Platform Website & About', icon: Globe },
      ],
    },
    {
      title: 'Levels 1–3, Certificate & Courses',
      items: [
        {
          id: 'professional-credentials',
          label: 'Programmes, Courses & Certs',
          icon: Award,
        },
        {
          id: 'employer-verification',
          label: 'Employer Verification Portal',
          icon: BadgeCheck,
        },
        {
          id: 'research-journal',
          label: 'Research & Journal Press',
          icon: BookOpenCheck,
        },
      ],
    },
    {
      title: 'Candidates & Admissions',
      items: [
        { id: 'students', label: 'Candidate & Learner Registry', icon: Users },
        {
          id: 'admissions',
          label: 'Intake & Applications',
          icon: UserPlus,
          badge: pendingAdmissions > 0 ? `${pendingAdmissions}` : undefined,
          badgeColor: 'bg-amber-500 text-slate-950 font-bold',
        },
      ],
    },
    {
      title: 'Tuition, HR & Portals',
      items: [
        ...financeItems,
        { id: 'parent-portal', label: 'Candidate & Graduate Portal', icon: HeartHandshake },
        { id: 'communication', label: 'Institute Bulletins & SMS', icon: Send },
        ...(isModuleEnabled('alumni_endowment')
          ? [{ id: 'alumni-endowment', label: 'Alumni Endowment Hub', icon: Landmark }]
          : []),
      ],
    },
  ];

  const basicSchoolStaffSections: SidebarSection[] = [
    {
      title: 'Overview & Administration',
      items: [
        { id: 'dashboard', label: 'School Executive Dashboard', icon: LayoutDashboard },
        { id: 'school-settings', label: 'School Profile & Modules', icon: Settings },
        { id: 'data-export', label: 'Data Export & Backups', icon: Database },
        { id: 'platform-website', label: 'Platform Website & About', icon: Globe },
      ],
    },
    ...(isModuleEnabled('professional_credentials')
      ? [
          {
            title: 'Certificates & Verification',
            items: [
              {
                id: 'professional-credentials',
                label: 'Programmes, Signatures & Certs',
                icon: Award,
              },
              {
                id: 'employer-verification',
                label: 'Employer Verification Portal',
                icon: BadgeCheck,
              },
            ],
          },
        ]
      : []),
    {
      title: 'Student Life & Admissions',
      items: [
        {
          id: 'students',
          label: 'Student Registry & IDs',
          icon: Users,
          badge: pendingPhotos > 0 ? `${pendingPhotos}` : undefined,
          badgeColor: 'bg-emerald-600 text-white font-bold',
        },
        {
          id: 'admissions',
          label: 'Admissions Pipeline',
          icon: UserPlus,
          badge: pendingAdmissions > 0 ? `${pendingAdmissions}` : undefined,
          badgeColor: 'bg-amber-500 text-slate-950 font-bold',
        },
      ],
    },
    {
      title: 'Academic Management',
      items: basicAcademicItems,
    },
    {
      title: 'Finance & Human Resources',
      items: financeItems,
    },
    {
      title: 'Community Portals',
      items: [
        { id: 'parent-portal', label: 'Student & Parent Portal', icon: HeartHandshake },
        { id: 'communication', label: 'Broadcasts & Notices', icon: Send },
        ...(!isModuleEnabled('professional_credentials')
          ? [{ id: 'employer-verification', label: 'Public Certificate Verification', icon: BadgeCheck }]
          : []),
      ],
    },
    {
      title: 'Welfare, IoT & Operations',
      items: basicOperationsItems,
    },
  ];

  const menuSections: SidebarSection[] =
    currentUser.role === 'parent'
      ? parentSections
      : currentUser.role === 'student' || currentUser.role === 'graduate'
      ? studentOrGraduateSections
      : isInstitute
      ? instituteStaffSections
      : basicSchoolStaffSections;

  const getModuleAccent = (id: string): { icon: string; activeBg: string; hoverBg: string } => {
    switch (id) {
      case 'dashboard':
        return {
          icon: 'text-sky-400',
          activeBg: 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-950/50',
          hoverBg: 'hover:bg-sky-500/10',
        };
      case 'school-settings':
        return {
          icon: 'text-indigo-400',
          activeBg: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-950/50',
          hoverBg: 'hover:bg-indigo-500/10',
        };
      case 'data-export':
        return {
          icon: 'text-violet-400',
          activeBg: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-950/50',
          hoverBg: 'hover:bg-violet-500/10',
        };
      case 'platform-website':
        return {
          icon: 'text-cyan-400',
          activeBg: 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-950/50',
          hoverBg: 'hover:bg-cyan-500/10',
        };
      case 'professional-credentials':
      case 'employer-verification':
        return {
          icon: 'text-amber-400',
          activeBg: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-950/50',
          hoverBg: 'hover:bg-amber-500/10',
        };
      case 'students':
      case 'admissions':
        return {
          icon: 'text-rose-400',
          activeBg: 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-950/50',
          hoverBg: 'hover:bg-rose-500/10',
        };
      case 'academics':
      case 'attendance':
      case 'examinations':
      case 'bece-mock-exams':
      case 'cambridge-curriculum':
      case 'research-journal':
        return {
          icon: 'text-blue-400',
          activeBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950/50',
          hoverBg: 'hover:bg-blue-500/10',
        };
      case 'finance':
      case 'payroll':
      case 'canteen-pos':
        return {
          icon: 'text-emerald-400',
          activeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50',
          hoverBg: 'hover:bg-emerald-500/10',
        };
      case 'parent-portal':
      case 'communication':
        return {
          icon: 'text-fuchsia-400',
          activeBg: 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-md shadow-fuchsia-950/50',
          hoverBg: 'hover:bg-fuchsia-500/10',
        };
      default:
        return {
          icon: 'text-teal-400',
          activeBg: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-950/50',
          hoverBg: 'hover:bg-teal-500/10',
        };
    }
  };

  const handleSelect = (id: string) => {
    setActiveModule(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-gradient-to-b from-[#081129] via-[#0b1530] to-[#071524] border-r border-indigo-500/20 text-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {menuSections.map((sec, secIdx) => {
            const sectionHeadingColors = [
              'text-sky-300/90',
              'text-amber-300/90',
              'text-rose-300/90',
              'text-indigo-300/90',
              'text-emerald-300/90',
              'text-fuchsia-300/90',
              'text-teal-300/90',
            ];
            const headingTone = sectionHeadingColors[secIdx % sectionHeadingColors.length];
            return (
              <div key={sec.title}>
                <h3 className={`px-3 text-[11px] font-bold ${headingTone} mb-1.5`}>
                  {sec.title}
                </h3>
                <div className="space-y-0.5">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeModule === item.id;
                    const accent = getModuleAccent(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                          isActive
                            ? `${accent.activeBg} font-semibold`
                            : `${accent.hoverBg} text-slate-300 hover:text-white`
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-white' : accent.icon
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono tabular-nums ml-1 shrink-0 ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Role Access Footer */}
        <div className="p-3 border-t border-indigo-500/20 bg-slate-950/60">
          <div className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-emerald-950/70 rounded-xl border border-indigo-500/30">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-sky-300/90 block font-medium">
                Active Access Role
              </span>
              <p className="text-xs font-bold text-white capitalize truncate">{currentUser.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
