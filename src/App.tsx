import React, { useState } from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardModule } from './components/modules/DashboardModule';
import { StudentsModule } from './components/modules/StudentsModule';
import { AdmissionsModule } from './components/modules/AdmissionsModule';
import { AcademicsModule } from './components/modules/AcademicsModule';
import { AttendanceModule } from './components/modules/AttendanceModule';
import { ExaminationsModule } from './components/modules/ExaminationsModule';
import { BeceMockExamModule } from './components/modules/BeceMockExamModule';
import { FinanceModule } from './components/modules/FinanceModule';
import { PayrollModule } from './components/modules/PayrollModule';
import { ParentStudentPortal } from './components/modules/ParentStudentPortal';
import { WelfareTransportModule } from './components/modules/WelfareTransportModule';
import { LibraryInventoryModule } from './components/modules/LibraryInventoryModule';
import { CommunicationModule } from './components/modules/CommunicationModule';
import { AIAnalyticsModule } from './components/modules/AIAnalyticsModule';
import { SchoolSettingsModule } from './components/modules/SchoolSettingsModule';
import { CambridgeCurriculumModule } from './components/modules/CambridgeCurriculumModule';
import { CanteenPOSModule } from './components/modules/CanteenPOSModule';
import { BiometricGateModule } from './components/modules/BiometricGateModule';
import { AlumniEndowmentModule } from './components/modules/AlumniEndowmentModule';
import { ResearchJournalModule } from './components/modules/ResearchJournalModule';
import { ProfessionalCredentialsModule } from './components/modules/ProfessionalCredentialsModule';
import { EmployerVerificationPortal } from './components/modules/EmployerVerificationPortal';
import { DataExportBackupModule } from './components/modules/DataExportBackupModule';
import { PublicWebsiteLanding } from './components/PublicWebsiteLanding';
import { WhatsAppConnectWidget } from './components/WhatsAppConnectWidget';

const MainLayout: React.FC = () => {
  const { activeModule, isAuthenticated, schools } = useSchool();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isAuthenticated || schools.length === 0) {
    return <PublicWebsiteLanding />;
  }

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule />;
      case 'platform-website':
        return <PublicWebsiteLanding embeddedInDashboard={true} />;
      case 'professional-credentials':
        return <ProfessionalCredentialsModule />;
      case 'employer-verification':
        return <EmployerVerificationPortal />;
      case 'school-settings':
        return <SchoolSettingsModule />;
      case 'data-export':
        return <DataExportBackupModule />;
      case 'students':
        return <StudentsModule />;
      case 'admissions':
        return <AdmissionsModule />;
      case 'academics':
        return <AcademicsModule />;
      case 'attendance':
        return <AttendanceModule />;
      case 'examinations':
        return <ExaminationsModule />;
      case 'bece-mock-exams':
        return <BeceMockExamModule />;
      case 'research-journal':
        return <ResearchJournalModule />;
      case 'finance':
        return <FinanceModule />;
      case 'payroll':
        return <PayrollModule />;
      case 'parent-portal':
        return <ParentStudentPortal />;
      case 'welfare-transport':
        return <WelfareTransportModule />;
      case 'library-inventory':
        return <LibraryInventoryModule />;
      case 'communication':
        return <CommunicationModule />;
      case 'ai-analytics':
        return <AIAnalyticsModule />;
      case 'cambridge-curriculum':
        return <CambridgeCurriculumModule />;
      case 'canteen-pos':
        return <CanteenPOSModule />;
      case 'biometric-gate':
        return <BiometricGateModule />;
      case 'alumni-endowment':
        return <AlumniEndowmentModule />;
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="min-h-screen edu-aurora-canvas text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex-1 flex w-full">
        {/* Navigation Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto">
          {renderActiveModule()}
        </main>
      </div>
    </div>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class CloudErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error?.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(readable);
      if (parsed && parsed.error) {
        readable = parsed.error;
      }
    } catch {
      // Non-JSON error message
    }
    return { hasError: true, message: readable };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const isQuotaError = this.state.message.includes('Quota exceeded');
      return (
        <div className="min-h-screen edu-login-canvas text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900/95 border border-indigo-500/30 rounded-2xl p-6 space-y-4 text-xs shadow-2xl">
            <h2 className="text-base font-bold text-white">
              {isQuotaError ? 'Daily Cloud Database Quota Reached' : 'Unable to Complete Request'}
            </h2>
            <p className="text-slate-300 leading-relaxed">
              {isQuotaError
                ? 'The free-tier daily Firestore quota has been reached and will reset tomorrow.'
                : this.state.message}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold transition cursor-pointer"
            >
              Return to Portal
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <CloudErrorBoundary>
      <SchoolProvider>
        <MainLayout />
        <WhatsAppConnectWidget />
      </SchoolProvider>
    </CloudErrorBoundary>
  );
}
