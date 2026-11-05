import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { SchoolAnnouncement } from '../../types';
import {
  Send,
  Bell,
  Smartphone,
  MessageSquare,
  Users,
  CheckCircle,
  Plus,
} from 'lucide-react';

export const CommunicationModule: React.FC = () => {
  const { announcements, sendAnnouncement, currentUser } = useSchool();
  const [showComposeModal, setShowComposeModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'Parents' as SchoolAnnouncement['targetAudience'],
    channel: 'SMS Notice' as SchoolAnnouncement['channel'],
    author: currentUser.name,
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;
    sendAnnouncement(formData);
    setShowComposeModal(false);
    setFormData({
      title: '',
      content: '',
      targetAudience: 'Parents',
      channel: 'SMS Notice',
      author: currentUser.name,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-400" />
            Communication & Notification Broadcasts
          </h2>
          <p className="text-xs text-slate-400">
            Send instant SMS alerts, WhatsApp broadcasts, and in-app notices to parents, students, and staff.
          </p>
        </div>

        <button
          onClick={() => setShowComposeModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Send New Broadcast
        </button>
      </div>

      {/* Broadcast Feed */}
      <div className="space-y-4">
        {announcements.map((anc) => (
          <div
            key={anc.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    anc.channel === 'SMS Notice'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                      : anc.channel === 'WhatsApp Notice'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                      : 'bg-blue-950 text-blue-300 border border-blue-800/50'
                  }`}
                >
                  {anc.channel}
                </span>
                <span className="text-xs text-slate-400">
                  Target: <strong className="text-white">{anc.targetAudience}</strong>
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Sent: {anc.sentDate}</span>
            </div>

            <h3 className="font-bold text-base text-white">{anc.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              {anc.content}
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Authorized Author: {anc.author}</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" /> Dispatched & Delivered
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Compose Broadcast Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full text-slate-200 shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-1">Compose Broadcast Notice</h3>
            <p className="text-xs text-slate-400 mb-4">
              Dispatches directly to registered phone numbers via SMS or in-app notification feed.
            </p>

            <form onSubmit={handleSend} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Broadcast Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Mid-Term Break Notice"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetAudience: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="All">All School Stakeholders</option>
                    <option value="Parents">Parents & Guardians</option>
                    <option value="Students">Enrolled Students</option>
                    <option value="Staff">Faculty & Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Delivery Channel</label>
                  <select
                    value={formData.channel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        channel: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="SMS Notice">Direct SMS Notice</option>
                    <option value="WhatsApp Notice">WhatsApp Broadcast</option>
                    <option value="In-App">In-App Noticeboard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Message Content *</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Type official message..."
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
