import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  CalendarCheck,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
  QrCode,
  ShieldCheck,
} from 'lucide-react';

export const AttendanceModule: React.FC = () => {
  const {
    classes,
    educationalSections,
    students,
    staff,
    attendance,
    staffAttendance,
    recordAttendance,
    resolveTeacherDisplayName,
  } = useSchool();

  const activeStreams = classes.filter((c) => c.active !== false);

  const [activeTab, setActiveTab] = useState<'students' | 'staff'>('students');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('All');
  const [selectedClassId, setSelectedClassId] = useState<string>(activeStreams[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const filteredStreams =
    selectedSectionId === 'All'
      ? activeStreams
      : activeStreams.filter((c) => c.sectionId === selectedSectionId);

  React.useEffect(() => {
    if (filteredStreams.length > 0 && !filteredStreams.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(filteredStreams[0].id);
    }
  }, [filteredStreams, selectedClassId]);

  const selectedStreamObj = classes.find((c) => c.id === selectedClassId);
  const classStudents = students.filter(
    (s) => s.classId === selectedClassId && s.status === 'Active'
  );

  // Initialize or load statuses whenever class stream or date changes
  const [studentStatuses, setStudentStatuses] = useState<
    Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'>
  >({});

  React.useEffect(() => {
    const map: Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'> = {};
    students
      .filter((s) => s.classId === selectedClassId && s.status === 'Active')
      .forEach((stu) => {
        const existing = attendance.find((a) => a.studentId === stu.id && a.date === selectedDate);
        map[stu.id] = existing ? existing.status : 'Present';
      });
    setStudentStatuses(map);
  }, [selectedClassId, selectedDate, students, attendance]);

  const handleStatusChange = (stuId: string, status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    setStudentStatuses((prev) => ({ ...prev, [stuId]: status }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'> = {};
    classStudents.forEach((s) => {
      updated[s.id] = 'Present';
    });
    setStudentStatuses(updated);
  };

  const handleSaveAttendance = () => {
    if (!selectedClassId) return;
    recordAttendance(selectedClassId, selectedDate, studentStatuses);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Identify absent students for parent alerts
  const absentStudents = classStudents.filter((s) => studentStatuses[s.id] === 'Absent');

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-400" />
            Attendance Management &amp; Daily Class Stream Roll Call
          </h2>
          <p className="text-xs text-slate-400">
            Daily student roll call per Educational Section &amp; Class Stream, parent SMS alerts, and staff clock-in records.
          </p>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeTab === 'students' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Student Roll Call
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeTab === 'staff' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Staff Clock-In Log
          </button>
        </div>
      </div>

      {activeTab === 'students' && (
        <>
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Educational Section:</label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                >
                  <option value="All">All Offered Sections</option>
                  {educationalSections
                    .filter((s) => s.active)
                    .sort((a, b) => a.order - b.order)
                    .map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Class &amp; Stream:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                >
                  {filteredStreams.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Attendance Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {selectedStreamObj && (
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                  <span className="text-slate-400 block">Class Teacher:</span>
                  <span className="font-semibold text-emerald-400">
                    {resolveTeacherDisplayName(
                      selectedStreamObj.formTutorTeacherId,
                      selectedStreamObj.classTeacherName
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 self-end lg:self-auto">
              <button
                onClick={handleMarkAllPresent}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium border border-slate-700 transition cursor-pointer whitespace-nowrap"
              >
                Mark All Present
              </button>
              <button
                onClick={handleSaveAttendance}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <CheckCircle className="w-4 h-4" />
                {savedSuccess ? 'Saved & Synced!' : 'Save Register'}
              </button>
            </div>
          </div>

          {/* Absenteeism Alert Banner if any student is marked absent */}
          {absentStudents.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 text-xs text-amber-200 flex items-start justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-300">
                    Automated Parent Absentee Alert Triggered ({absentStudents.length} Students)
                  </h4>
                  <p className="text-slate-300 mt-1">
                    When the register is saved, SMS notifications are automatically dispatched to guardians via Telecel / MTN SMS gateway.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {absentStudents.map((s) => (
                      <span
                        key={s.id}
                        className="bg-amber-900/60 text-amber-100 px-2 py-0.5 rounded text-[11px] border border-amber-700/50"
                      >
                        {s.firstName} {s.lastName} ({s.guardianPhone})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Roll Call Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-3">Student ID</th>
                  <th className="py-3 px-3">Status Option</th>
                  <th className="py-3 px-3">Guardian Mobile</th>
                  <th className="py-3 px-4 text-right">Term Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {classStudents.map((stu) => {
                  const currentStatus = studentStatuses[stu.id] || 'Present';
                  // Calculate overall attendance for this student
                  const pastRecords = attendance.filter((a) => a.studentId === stu.id);
                  const presentCount = pastRecords.filter((a) => a.status === 'Present').length;
                  const rate =
                    pastRecords.length > 0
                      ? Math.round((presentCount / pastRecords.length) * 100)
                      : 98;

                  return (
                    <tr key={stu.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={stu.photo}
                          alt={stu.firstName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-white">
                            {stu.firstName} {stu.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400">{stu.boardingStatus}</div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        {stu.studentNumber}
                      </td>

                      <td className="py-3 px-3">
                        <div className="inline-flex rounded-lg border border-slate-800 p-0.5 bg-slate-950">
                          {(['Present', 'Late', 'Absent', 'Excused'] as const).map((st) => {
                            const isSelected = currentStatus === st;
                            let color = 'text-slate-400 hover:text-white';
                            if (isSelected) {
                              if (st === 'Present') color = 'bg-emerald-600 text-white font-bold';
                              if (st === 'Late') color = 'bg-amber-600 text-white font-bold';
                              if (st === 'Absent') color = 'bg-rose-600 text-white font-bold';
                              if (st === 'Excused') color = 'bg-blue-600 text-white font-bold';
                            }
                            return (
                              <button
                                key={st}
                                onClick={() => handleStatusChange(stu.id, st)}
                                className={`px-2.5 py-1 rounded-md text-[11px] transition cursor-pointer ${color}`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-400">{stu.guardianPhone}</td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            rate >= 90
                              ? 'text-emerald-400 bg-emerald-950/60'
                              : rate >= 75
                              ? 'text-amber-400 bg-amber-950/60'
                              : 'text-rose-400 bg-rose-950/60'
                          }`}
                        >
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Staff Attendance Log */}
      {activeTab === 'staff' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Employee & Teacher Punctuality Clock</h3>
              <p className="text-xs text-slate-400">
                Ghana Education Service staff attendance register with check-in timestamps.
              </p>
            </div>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-full">
              Date: {selectedDate}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-3">Designation / Role</th>
                  <th className="py-3 px-3">Check-In Time</th>
                  <th className="py-3 px-3">Check-Out Time</th>
                  <th className="py-3 px-4 text-right">Punctuality Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {staffAttendance.map((rec) => {
                  const stf = staff.find((s) => s.id === rec.staffId);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">
                        {stf?.fullName || 'Staff Member'}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{stf?.role || 'Teacher'}</td>
                      <td className="py-3 px-3 font-mono text-emerald-400">{rec.checkInTime}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{rec.checkOutTime}</td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.status === 'Present'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                              : rec.status === 'Late'
                              ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                              : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
