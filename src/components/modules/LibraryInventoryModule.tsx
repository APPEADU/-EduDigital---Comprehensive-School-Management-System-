import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { LibraryBook, SchoolAsset } from '../../types';
import {
  BookOpen,
  Boxes,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Wrench,
} from 'lucide-react';

export const LibraryInventoryModule: React.FC = () => {
  const {
    libraryBooks,
    bookLoans,
    assets,
    students,
    issueBookLoan,
    returnBookLoan,
    addAsset,
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'library' | 'loans' | 'assets'>('library');
  const [searchTerm, setSearchTerm] = useState('');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);

  // Issue Loan Form
  const [issueData, setIssueData] = useState({
    bookId: libraryBooks[0]?.id || '',
    studentId: students[0]?.id || '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // New Asset Form
  const [assetData, setAssetData] = useState({
    name: '',
    category: 'IT Equipment' as SchoolAsset['category'],
    quantity: 10,
    location: 'Block C - Lab 1',
    condition: 'Good' as SchoolAsset['condition'],
    purchaseDate: new Date().toISOString().split('T')[0],
    custodian: 'ICT Master',
  });

  const handleIssueBook = (e: React.FormEvent) => {
    e.preventDefault();
    issueBookLoan(issueData.bookId, issueData.studentId, issueData.dueDate);
    setShowIssueModal(false);
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetData.name) return;
    addAsset(assetData);
    setShowAssetModal(false);
  };

  const filteredBooks = libraryBooks.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.isbn.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Library & Institutional Asset Management
          </h2>
          <p className="text-xs text-slate-400">
            Cataloguing textbook collections, student borrowing cards, science lab microscopes, and facilities equipment.
          </p>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'library' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Library Catalogue
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'loans' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Book Loans ({bookLoans.length})
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'assets' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            School Assets & Gear
          </button>
        </div>
      </div>

      {/* TAB 1: Library Catalogue */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search title, author, or ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => setShowIssueModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer self-end sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Issue Book to Student
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((bk) => (
              <div
                key={bk.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {bk.category}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Shelf: <strong className="text-slate-200">{bk.shelfLocation}</strong>
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white">{bk.title}</h4>
                <p className="text-xs text-slate-400">By {bk.author}</p>
                <p className="text-[11px] font-mono text-slate-500">ISBN: {bk.isbn}</p>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Available Stock:</span>
                  <span
                    className={`font-mono font-bold ${
                      bk.availableCopies > 5 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {bk.availableCopies} / {bk.totalCopies} copies
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Book Loans */}
      {activeTab === 'loans' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-3">Borrower (Student)</th>
                  <th className="py-3 px-3">Borrow Date</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Loan Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bookLoans.map((loan) => {
                  const book = libraryBooks.find((b) => b.id === loan.bookId);
                  const student = students.find((s) => s.id === loan.studentId);
                  return (
                    <tr key={loan.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">
                        {book?.title || 'Book Title'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-200 block">
                          {student?.firstName} {student?.lastName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {student?.studentNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{loan.borrowDate}</td>
                      <td className="py-3 px-3 font-mono text-amber-400 font-semibold">
                        {loan.dueDate}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            loan.status === 'Active'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                              : loan.status === 'Overdue'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                          }`}
                        >
                          {loan.status} {loan.fineAmount ? `(GH₵ ${loan.fineAmount} fine)` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {loan.status !== 'Returned' && (
                          <button
                            onClick={() => returnBookLoan(loan.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            Mark Returned
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: School Assets */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs">
            <div>
              <h3 className="font-bold text-white text-sm">Institutional Property & Assets</h3>
              <p className="text-slate-400 text-xs">
                Asset tracking, quantity counts, locations, and maintenance conditions.
              </p>
            </div>
            <button
              onClick={() => setShowAssetModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add School Asset
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((ast) => (
              <div
                key={ast.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {ast.category}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      ast.condition === 'Good'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                        : 'bg-amber-950 text-amber-300 border border-amber-700/50'
                    }`}
                  >
                    {ast.condition} Condition
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white">{ast.name}</h4>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quantity on Campus:</span>
                    <span className="font-mono font-bold text-emerald-400">{ast.quantity} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Campus Location:</span>
                    <span className="font-medium text-slate-200">{ast.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Custodian:</span>
                    <span className="font-medium text-slate-200">{ast.custodian}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-slate-200 shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-1">Issue Library Book Loan</h3>
            <p className="text-xs text-slate-400 mb-4">
              Record student borrowing details and return deadline.
            </p>

            <form onSubmit={handleIssueBook} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Book *</label>
                <select
                  value={issueData.bookId}
                  onChange={(e) => setIssueData({ ...issueData, bookId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {libraryBooks.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                      {b.title} ({b.availableCopies} available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Select Student *</label>
                <select
                  value={issueData.studentId}
                  onChange={(e) => setIssueData({ ...issueData, studentId: e.target.value })}
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
                <label className="block text-slate-400 mb-1">Return Due Date *</label>
                <input
                  type="date"
                  required
                  value={issueData.dueDate}
                  onChange={(e) => setIssueData({ ...issueData, dueDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Confirm Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-slate-200 shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-1">Register School Property / Asset</h3>
            <p className="text-xs text-slate-400 mb-4">
              Add campus equipment to the institutional asset register.
            </p>

            <form onSubmit={handleCreateAsset} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Asset Name / Description *</label>
                <input
                  type="text"
                  required
                  value={assetData.name}
                  onChange={(e) => setAssetData({ ...assetData, name: e.target.value })}
                  placeholder="e.g. Epson Multimedia Projector"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={assetData.category}
                    onChange={(e) =>
                      setAssetData({ ...assetData, category: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="IT Equipment">IT Equipment</option>
                    <option value="Science Lab">Science Lab</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Facilities">Facilities</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={assetData.quantity}
                    onChange={(e) =>
                      setAssetData({ ...assetData, quantity: parseInt(e.target.value, 10) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Location on Campus</label>
                  <input
                    type="text"
                    required
                    value={assetData.location}
                    onChange={(e) => setAssetData({ ...assetData, location: e.target.value })}
                    placeholder="e.g. Physics Lab 2"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Custodian</label>
                  <input
                    type="text"
                    required
                    value={assetData.custodian}
                    onChange={(e) => setAssetData({ ...assetData, custodian: e.target.value })}
                    placeholder="e.g. Science Lab Tech"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
