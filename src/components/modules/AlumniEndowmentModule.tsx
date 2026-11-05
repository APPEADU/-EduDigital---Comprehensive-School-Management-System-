import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  Landmark,
  Heart,
  Award,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  ExternalLink,
  Plus,
  Target,
} from 'lucide-react';

interface CampaignProject {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  championChapter: string;
  status: 'In Progress' | 'Funded' | 'Planning';
  description: string;
}

export const AlumniEndowmentModule: React.FC = () => {
  const { school } = useSchool();

  const [campaigns, setCampaigns] = useState<CampaignProject[]>([
    {
      id: 'cp-01',
      title: 'Ultra-Modern NSMQ Science & Robotics Complex',
      targetAmount: 750000,
      currentAmount: 512000,
      championChapter: 'Odadeɛ Class of 1998 & Global North America Chapter',
      status: 'In Progress',
      description: 'Fully equipped physics, chemistry, biology, and AI robotics laboratories to solidify national science dominance and practical STEM training.',
    },
    {
      id: 'cp-02',
      title: 'Solar Grid 150kVA Hybrid Energy Installation',
      targetAmount: 380000,
      currentAmount: 340000,
      championChapter: 'Class of 2004 Legacy Committee',
      status: 'In Progress',
      description: 'Renewable energy array covering the administration block, dining hall, and dormitories to cut grid power bills by 85%.',
    },
    {
      id: 'cp-03',
      title: 'Brilliant but Needy Scholars Boarding Bursary',
      targetAmount: 150000,
      currentAmount: 150000,
      championChapter: 'UK & Europe Alumni Executive',
      status: 'Funded',
      description: 'Full tuition, boarding fees, uniforms, and books for 25 top BECE aggregate 6-8 candidates from deprived communities.',
    },
  ]);

  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donateAmount, setDonateAmount] = useState('1000');
  const [donorName, setDonorName] = useState('Dr. Kwame Boakye');
  const [donorYear, setDonorYear] = useState('Class of 2001');
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0].id);
  const [donationSuccess, setDonationSuccess] = useState(false);

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(donateAmount);
    if (isNaN(amt) || amt <= 0) return;

    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === selectedCampaignId
          ? { ...c, currentAmount: c.currentAmount + amt }
          : c
      )
    );

    setDonationSuccess(true);
    setTimeout(() => {
      setDonationSuccess(false);
      setShowDonateModal(false);
    }, 1500);
  };

  const totalRaised = campaigns.reduce((sum, c) => sum + c.currentAmount, 0);
  const totalTarget = campaigns.reduce((sum, c) => sum + c.targetAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-400" />
              Old Students & Global Alumni Endowment Portal
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Institutional Heritage: {school.name}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global chapters, capital development fundraising, alumni chapter dues, and institutional endowment funds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDonateModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-colors"
          >
            <Heart className="w-3.5 h-3.5" />
            Pledge Alumni Contribution
          </button>
        </div>
      </div>

      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Endowment Raised</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {school.currency} {totalRaised.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Target: {school.currency} {totalTarget.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Registered Global Chapters</span>
          <div className="text-xl font-bold text-white mt-1">14 Chapters</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Accra, Kumasi, London, Houston, Toronto</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Capital Projects</span>
          <div className="text-xl font-bold text-amber-400 mt-1">{campaigns.length} Projects</div>
          <div className="text-[10px] text-slate-500 mt-0.5">1 Fully Funded, 2 In Progress</div>
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          Active Institutional Legacy Campaigns
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {campaigns.map((camp) => {
            const pct = Math.min(100, Math.round((camp.currentAmount / camp.targetAmount) * 100));

            return (
              <div
                key={camp.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-amber-500/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{camp.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        camp.status === 'Funded'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {camp.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{camp.description}</p>
                    <p className="text-[11px] text-indigo-400 font-medium mt-2">
                      Champion Chapter: {camp.championChapter}
                    </p>
                  </div>

                  <div className="text-right sm:shrink-0">
                    <span className="text-base font-bold text-white">
                      {school.currency} {camp.currentAmount.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      of {school.currency} {camp.targetAmount.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donate Modal */}
      {showDonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-amber-400" />
              Alumni Endowment Contribution
            </h3>

            <form onSubmit={handleDonate} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Donor Full Name:</label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Alumni Year Group / Chapter:</label>
                <input
                  type="text"
                  value={donorYear}
                  onChange={(e) => setDonorYear(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Project to Support:</label>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Contribution Amount ({school.currency}):</label>
                <input
                  type="number"
                  min="50"
                  value={donateAmount}
                  onChange={(e) => setDonateAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {donationSuccess && (
                <div className="bg-emerald-950/60 border border-emerald-500 text-emerald-200 text-xs p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Contribution recorded! Thank you for supporting the endowment fund.</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDonateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-md"
                >
                  Confirm Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
