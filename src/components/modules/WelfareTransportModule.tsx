import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { HealthIncident } from '../../types';
import {
  Home,
  HeartPulse,
  Bus,
  Plus,
  Shield,
  Phone,
  CheckCircle,
  MapPin,
  Clock,
  User,
} from 'lucide-react';

export const WelfareTransportModule: React.FC = () => {
  const {
    boardingHouses,
    healthRecords,
    routes,
    students,
    addHealthRecord,
    school,
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'boarding' | 'health' | 'transport'>('boarding');
  const [showHealthModal, setShowHealthModal] = useState(false);

  // New health record state
  const [newHealth, setNewHealth] = useState({
    studentId: students[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    symptoms: 'Headache and feverish feeling',
    diagnosis: 'Mild upper respiratory tract infection',
    treatment: 'Paracetamol 500mg TDS, warm fluids, excused from prep',
    nurseName: 'Nurse Mary Afriyie (SRN)',
    parentNotified: true,
  });

  const handleCreateHealthIncident = (e: React.FormEvent) => {
    e.preventDefault();
    addHealthRecord(newHealth);
    setShowHealthModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bus className="w-5 h-5 text-emerald-400" />
            Boarding, Student Welfare, Health & School Transport
          </h2>
          <p className="text-xs text-slate-400">
            Residential hall allocations, campus infirmary clinic visits, and school bus route logistics.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('boarding')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'boarding' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Boarding Houses
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'health' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Infirmary & Health
          </button>
          <button
            onClick={() => setActiveTab('transport')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'transport' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            School Transport Routes
          </button>
        </div>
      </div>

      {/* TAB 1: Boarding Houses */}
      {activeTab === 'boarding' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boardingHouses.map((house) => {
            const occupancyRate = Math.round((house.currentBoardersCount / house.capacity) * 100);
            return (
              <div
                key={house.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{house.name}</h3>
                      <p className="text-xs text-slate-400">"{house.motto}"</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                    {house.gender} House
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Housemaster / Mistress:</span>
                    <span className="font-semibold text-white">{house.housemasterName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Boarders Occupancy:</span>
                    <span className="font-bold text-emerald-400">
                      {house.currentBoardersCount} / {house.capacity} ({occupancyRate}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Health & Infirmary */}
      {activeTab === 'health' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-white">Campus Sickbay & Health Log</h3>
              <p className="text-xs text-slate-400">
                Authorized nurse consultations, prescriptions, and confidential medical safeguarding.
              </p>
            </div>
            <button
              onClick={() => setShowHealthModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Log Clinic Visit
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {healthRecords.map((inc) => {
              const student = students.find((s) => s.id === inc.studentId);
              return (
                <div key={inc.id} className="py-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {student?.firstName} {student?.lastName} ({student?.studentNumber})
                      </span>
                      <span className="text-[10px] text-slate-400">• Date: {inc.date}</span>
                    </div>
                    {inc.parentNotified && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50 flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Guardian Notified via SMS
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300">
                    <strong className="text-slate-400">Symptoms:</strong> {inc.symptoms}
                  </p>
                  <p className="text-amber-300">
                    <strong className="text-slate-400">Diagnosis:</strong> {inc.diagnosis}
                  </p>
                  <p className="text-slate-300">
                    <strong className="text-slate-400">Prescribed Treatment:</strong> {inc.treatment}
                  </p>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Attending Nurse: <span className="text-slate-300">{inc.nurseName}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: School Transport Routes */}
      {activeTab === 'transport' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {routes.map((rt) => (
            <div
              key={rt.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {rt.busNumber}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {rt.assignedStudentsCount} / {rt.capacity} Students
                </span>
              </div>

              <h4 className="font-bold text-sm text-white">{rt.routeName}</h4>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Driver:</span>
                  <span className="font-bold text-white">{rt.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Driver Phone:</span>
                  <span className="font-mono text-emerald-400">{rt.driverPhone}</span>
                </div>
              </div>

              <div className="text-xs">
                <span className="text-slate-400 text-[11px] font-semibold block mb-1">
                  Designated Morning Stops:
                </span>
                <div className="space-y-1">
                  {rt.stops.map((stop, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-[11px] text-slate-300"
                    >
                      <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      <span>{stop}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Health Incident Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-slate-200 shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-1">Log Clinic / Sickbay Visit</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter medical findings and treatment for the student's health record.
            </p>

            <form onSubmit={handleCreateHealthIncident} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Student *</label>
                <select
                  value={newHealth.studentId}
                  onChange={(e) => setNewHealth({ ...newHealth, studentId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.studentNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reported Symptoms *</label>
                <input
                  type="text"
                  required
                  value={newHealth.symptoms}
                  onChange={(e) => setNewHealth({ ...newHealth, symptoms: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Abdominal pain, high temperature"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Clinical Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={newHealth.diagnosis}
                  onChange={(e) => setNewHealth({ ...newHealth, diagnosis: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Suspected acute gastritis"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Treatment & Medication Administered</label>
                <textarea
                  required
                  value={newHealth.treatment}
                  onChange={(e) => setNewHealth({ ...newHealth, treatment: e.target.value })}
                  className="w-full h-16 bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowHealthModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Save Clinic Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
