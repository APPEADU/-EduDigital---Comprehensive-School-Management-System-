import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  GraduationCap,
  Globe,
  Award,
  Layers,
  FileCheck,
  Search,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Percent,
  Sparkles,
} from 'lucide-react';

interface CambridgeCandidate {
  id: string;
  studentId: string;
  name: string;
  candidateNumber: string;
  centreNumber: string;
  level: 'IGCSE' | 'AS Level' | 'A Level' | 'Checkpoint';
  subjects: {
    code: string;
    name: string;
    targetGrade: string;
    mockScore: number;
    cambridgeGrade: string;
    gpaPoints: number;
  }[];
}

const CAMBRIDGE_GRADE_SCALE = [
  { grade: 'A*', min: 90, max: 100, gpa: 4.0, description: 'Outstanding Distinction' },
  { grade: 'A', min: 80, max: 89, gpa: 4.0, description: 'Excellent Mastery' },
  { grade: 'B', min: 70, max: 79, gpa: 3.3, description: 'Very Good' },
  { grade: 'C', min: 60, max: 69, gpa: 2.7, description: 'Credit Pass / Matriculation Standard' },
  { grade: 'D', min: 50, max: 59, gpa: 2.0, description: 'Satisfactory' },
  { grade: 'E', min: 40, max: 49, gpa: 1.3, description: 'Pass' },
  { grade: 'U', min: 0, max: 39, gpa: 0.0, description: 'Ungraded' },
];

export const CambridgeCurriculumModule: React.FC = () => {
  const { school, students } = useSchool();
  const [activeTab, setActiveTab] = useState<'candidates' | 'grading' | 'gpa'>('candidates');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');

  // Sample Cambridge candidates linked with current school learners
  const sampleCandidates: CambridgeCandidate[] = [
    {
      id: 'cam-01',
      studentId: students[0]?.id || 'stu-01',
      name: students[0] ? `${students[0].firstName} ${students[0].lastName}` : 'Boateng Kwabena',
      candidateNumber: 'GH042-0129',
      centreNumber: 'GH042 (Accra International Exam Centre)',
      level: 'IGCSE',
      subjects: [
        { code: '0580', name: 'Extended Mathematics', targetGrade: 'A*', mockScore: 92, cambridgeGrade: 'A*', gpaPoints: 4.0 },
        { code: '0625', name: 'Physics', targetGrade: 'A', mockScore: 86, cambridgeGrade: 'A', gpaPoints: 4.0 },
        { code: '0620', name: 'Chemistry', targetGrade: 'A', mockScore: 84, cambridgeGrade: 'A', gpaPoints: 4.0 },
        { code: '0478', name: 'Computer Science', targetGrade: 'A*', mockScore: 95, cambridgeGrade: 'A*', gpaPoints: 4.0 },
        { code: '0500', name: 'First Language English', targetGrade: 'B', mockScore: 78, cambridgeGrade: 'B', gpaPoints: 3.3 },
      ],
    },
    {
      id: 'cam-02',
      studentId: students[1]?.id || 'stu-02',
      name: students[1] ? `${students[1].firstName} ${students[1].lastName}` : 'Agbenu Selorm',
      candidateNumber: 'GH042-0130',
      centreNumber: 'GH042 (Accra International Exam Centre)',
      level: 'A Level',
      subjects: [
        { code: '9709', name: 'Pure Mathematics 1 & Mechanics', targetGrade: 'A', mockScore: 88, cambridgeGrade: 'A', gpaPoints: 4.0 },
        { code: '9702', name: 'Advanced Physics', targetGrade: 'A', mockScore: 82, cambridgeGrade: 'A', gpaPoints: 4.0 },
        { code: '9701', name: 'Advanced Chemistry', targetGrade: 'B', mockScore: 75, cambridgeGrade: 'B', gpaPoints: 3.3 },
      ],
    },
    {
      id: 'cam-03',
      studentId: students[2]?.id || 'stu-03',
      name: students[2] ? `${students[2].firstName} ${students[2].lastName}` : 'Ansah Nana Kofi',
      candidateNumber: 'GH042-0131',
      centreNumber: 'GH042 (Accra International Exam Centre)',
      level: 'Checkpoint',
      subjects: [
        { code: '1112', name: 'Secondary Checkpoint Mathematics', targetGrade: 'A', mockScore: 85, cambridgeGrade: 'A', gpaPoints: 4.0 },
        { code: '1113', name: 'Secondary Checkpoint Science', targetGrade: 'A', mockScore: 81, cambridgeGrade: 'A', gpaPoints: 4.0 },
        { code: '1111', name: 'Secondary Checkpoint English', targetGrade: 'B', mockScore: 74, cambridgeGrade: 'B', gpaPoints: 3.3 },
      ],
    },
  ];

  const filteredCandidates = sampleCandidates.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.candidateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'All' || c.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              Cambridge & IGCSE Dual-Stream Management
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Bespoke Add-on: {school.name}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Parallel British Curriculum administration, CIE Candidate Numbers, GPA 4.0 conversion, and Statement of Results alongside WASSCE.
          </p>
        </div>

        {/* Quick stats badge */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="text-slate-500">CIE Centre:</span> <span className="font-mono text-emerald-400 font-bold">GH042</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-xs text-indigo-300 font-medium">
            Active Dual Stream: <span className="font-bold text-white">GES + CIE</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors ${
            activeTab === 'candidates'
              ? 'bg-slate-900 text-indigo-400 border-t-2 border-indigo-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          Cambridge Candidates ({sampleCandidates.length})
        </button>
        <button
          onClick={() => setActiveTab('grading')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors ${
            activeTab === 'grading'
              ? 'bg-slate-900 text-indigo-400 border-t-2 border-indigo-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Percent className="w-4 h-4" />
          Grade Mapping (CIE vs WASSCE)
        </button>
        <button
          onClick={() => setActiveTab('gpa')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors ${
            activeTab === 'gpa'
              ? 'bg-slate-900 text-indigo-400 border-t-2 border-indigo-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Cumulative GPA Matrix (4.0 Scale)
        </button>
      </div>

      {/* Tab: Candidates */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate or CIE ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400">Stream Filter:</span>
              {['All', 'IGCSE', 'A Level', 'Checkpoint'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    selectedLevel === lvl
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Candidates Cards */}
          <div className="grid grid-cols-1 gap-4">
            {filteredCandidates.map((cand) => {
              const avgScore = Math.round(
                cand.subjects.reduce((sum, s) => sum + s.mockScore, 0) / cand.subjects.length
              );
              const avgGpa = (
                cand.subjects.reduce((sum, s) => sum + s.gpaPoints, 0) / cand.subjects.length
              ).toFixed(2);

              return (
                <div
                  key={cand.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/40 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                        CIE
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{cand.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {cand.level} Candidate
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Candidate No: <span className="text-indigo-400">{cand.candidateNumber}</span> • {cand.centreNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-950/60 px-4 py-2 rounded-lg border border-slate-800">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Mean Mock</div>
                        <div className="text-sm font-bold text-emerald-400">{avgScore}%</div>
                      </div>
                      <div className="w-px h-6 bg-slate-800" />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">CIE GPA (4.0)</div>
                        <div className="text-sm font-bold text-indigo-400">{avgGpa} / 4.00</div>
                      </div>
                    </div>
                  </div>

                  {/* Registered Subject Entries */}
                  <div className="mt-4">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Registered Syllabus Papers & Projected Grades
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {cand.subjects.map((sub, i) => (
                        <div
                          key={i}
                          className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-semibold text-white">{sub.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Code: {sub.code}</div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 text-xs font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {sub.cambridgeGrade}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">{sub.mockScore}% • {sub.gpaPoints} pts</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Grade Mapping */}
      {activeTab === 'grading' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              Equivalence Scale: British Cambridge vs Ghanaian WASSCE / GES
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Allows dual-enrolled learners to produce both WASSCE-compliant continuous assessment transcripts and international CIE certificates for foreign university applications.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">CIE Grade</th>
                    <th className="py-2.5 px-3">Score Range</th>
                    <th className="py-2.5 px-3">US/International GPA</th>
                    <th className="py-2.5 px-3">WASSCE Equivalent</th>
                    <th className="py-2.5 px-3">Performance Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {CAMBRIDGE_GRADE_SCALE.map((g, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-bold text-indigo-400 text-sm">{g.grade}</td>
                      <td className="py-2.5 px-3 font-mono">{g.min}% – {g.max}%</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">{g.gpa.toFixed(1)}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {g.grade === 'A*' ? 'A1 (Exceptional)' : g.grade === 'A' ? 'A1 (Excellent)' : g.grade === 'B' ? 'B2 / B3' : g.grade === 'C' ? 'C4 / C5 / C6' : g.grade === 'D' ? 'D7' : g.grade === 'E' ? 'E8' : 'F9'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{g.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: GPA Calculator */}
      {activeTab === 'gpa' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Dual-Transcript Harmonization Engine
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Graduating seniors in {school.name} can have their cumulative record printed in both Ghanaian WAEC aggregate format (best 6 core + electives) and American/International 4.0 GPA format.
          </p>
          <div className="p-4 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold shrink-0">
              ✓
            </div>
            <div>
              <span className="font-semibold text-white">Feature Isolation Active:</span> This Cambridge grading module is configured specifically for <strong>{school.name}</strong>. Other schools in the EduDigital SIS tenant registry that only use GES/WASSCE (or standard BECE) do not see this module or have their database tables altered.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
