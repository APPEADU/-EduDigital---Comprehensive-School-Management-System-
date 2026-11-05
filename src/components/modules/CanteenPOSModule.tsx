import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  UtensilsCrossed,
  CreditCard,
  Plus,
  AlertTriangle,
  CheckCircle,
  Receipt,
  Search,
  DollarSign,
  Coffee,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  category: 'Hot Meals' | 'Beverages' | 'Healthy Snacks';
  price: number;
  dietaryNote?: string;
}

const CANTEEN_MENU: MenuItem[] = [
  { id: 'm1', name: 'Ghanaian Jollof Rice + Grilled Chicken', category: 'Hot Meals', price: 25.0, dietaryNote: 'Halal Chicken' },
  { id: 'm2', name: 'Waakye Special + Spaghetti & Fried Fish', category: 'Hot Meals', price: 28.0, dietaryNote: 'Contains Shito' },
  { id: 'm3', name: 'Fried Rice + Crispy Chicken Drumstick', category: 'Hot Meals', price: 25.0, dietaryNote: 'Egg Fried Rice' },
  { id: 'm4', name: 'Fresh Tropical Sliced Fruit Bowl (Watermelon, Pineapple)', category: 'Healthy Snacks', price: 12.0, dietaryNote: 'Gluten Free' },
  { id: 'm5', name: 'Hot Cocoa Milo + Fresh Milk + Meat Pie', category: 'Beverages', price: 15.0, dietaryNote: 'Contains Dairy' },
  { id: 'm6', name: 'Chilled Hibiscus (Sobolo) + Mint Cooler', category: 'Beverages', price: 8.0, dietaryNote: 'Low Sugar' },
];

export const CanteenPOSModule: React.FC = () => {
  const { school, students } = useSchool();

  // In-memory student balances (seeded)
  const [balances, setBalances] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    students.forEach((s, idx) => {
      map[s.id] = 120.0 + (idx * 35.0);
    });
    return map;
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedItems, setSelectedItems] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [lastReceipt, setLastReceipt] = useState<{
    studentName: string;
    studentNumber: string;
    items: { name: string; quantity: number; subtotal: number }[];
    total: number;
    newBalance: number;
    date: string;
    orderId: string;
  } | null>(null);

  const [topUpAmount, setTopUpAmount] = useState('50');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  const [posError, setPosError] = useState<string | null>(null);

  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const currentBalance = activeStudent ? balances[activeStudent.id] || 0 : 0;

  const totalCart = selectedItems.reduce((sum, i) => sum + i.item.price * i.quantity, 0);

  const handleAddItem = (item: MenuItem) => {
    setPosError(null);
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) => (i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setPosError(null);
    setSelectedItems((prev) => prev.filter((i) => i.item.id !== itemId));
  };

  const handleProcessTransaction = () => {
    if (!activeStudent || totalCart === 0) return;
    if (currentBalance < totalCart) {
      setPosError(
        `Insufficient wallet balance. Available: ${school.currency} ${currentBalance.toFixed(2)}, Needed: ${school.currency} ${totalCart.toFixed(2)}.`
      );
      return;
    }

    setPosError(null);
    const newBal = currentBalance - totalCart;
    setBalances((prev) => ({
      ...prev,
      [activeStudent.id]: newBal,
    }));

    setLastReceipt({
      studentName: `${activeStudent.firstName} ${activeStudent.lastName}`,
      studentNumber: activeStudent.studentNumber,
      items: selectedItems.map((i) => ({
        name: i.item.name,
        quantity: i.quantity,
        subtotal: i.item.price * i.quantity,
      })),
      total: totalCart,
      newBalance: newBal,
      date: new Date().toLocaleTimeString(),
      orderId: `POS-${Math.floor(100000 + Math.random() * 900000)}`,
    });

    setSelectedItems([]);
  };

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(topUpAmount);
    if (!activeStudent || isNaN(amt) || amt <= 0) return;

    setBalances((prev) => ({
      ...prev,
      [activeStudent.id]: (prev[activeStudent.id] || 0) + amt,
    }));
    setPosError(null);

    setTopUpSuccess(true);
    setTimeout(() => {
      setTopUpSuccess(false);
      setShowTopUpModal(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-amber-400" />
              Cashless Canteen & RFID Meal Card POS
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Active Module: {school.name}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Student prepaid digital meal allowance, automated tap-to-pay register, allergy alerts, and MoMo recharges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTopUpModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Top-up Student Wallet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Menu Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span>Today's Cafeteria Menu & Daily Specials</span>
              <span className="text-xs font-normal text-slate-400">Click item to add to register</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CANTEEN_MENU.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className="bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 p-3.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {item.category}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1.5 group-hover:text-amber-400 transition-colors">
                        {item.name}
                      </h4>
                      {item.dietaryNote && (
                        <p className="text-[10px] text-amber-400/80 mt-0.5">{item.dietaryNote}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60">
                    <span className="text-sm font-bold text-white">
                      {school.currency} {item.price.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-400 group-hover:underline flex items-center gap-1">
                      + Add Item
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transaction Slip */}
          {lastReceipt && (
            <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Payment Approved (Order #{lastReceipt.orderId})
                </span>
                <span className="text-[11px] text-slate-400">{lastReceipt.date}</span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <p>
                  <span className="text-slate-500">Student:</span> <strong className="text-white">{lastReceipt.studentName}</strong> ({lastReceipt.studentNumber})
                </p>
                <div className="bg-slate-950 p-2.5 rounded-lg my-2 font-mono text-[11px]">
                  {lastReceipt.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between py-0.5">
                      <span>{it.quantity}x {it.name}</span>
                      <span>{school.currency} {it.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-800 mt-2 pt-1.5 flex justify-between font-bold text-white">
                    <span>Total Debited:</span>
                    <span>{school.currency} {lastReceipt.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 text-[10px] mt-1">
                    <span>Remaining Card Balance:</span>
                    <span>{school.currency} {lastReceipt.newBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: POS Terminal & Student RFID Scan */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Active Student RFID Scanner
            </h3>

            {/* Select Active Student */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Simulate Student ID Card Tap:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    setPosError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.studentNumber})
                    </option>
                  ))}
                </select>
              </div>

              {activeStudent && (
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeStudent.photo}
                      alt={activeStudent.firstName}
                      className="w-12 h-12 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {activeStudent.firstName} {activeStudent.lastName}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400">{activeStudent.studentNumber}</p>
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {activeStudent.stream}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Card Balance:</span>
                    <span className={`text-sm font-bold ${currentBalance > 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {school.currency} {currentBalance.toFixed(2)}
                    </span>
                  </div>

                  {activeStudent.medicalInfo && activeStudent.medicalInfo.toLowerCase().includes('allerg') && (
                    <div className="bg-rose-950/40 border border-rose-800/40 text-[10px] text-rose-300 p-2 rounded-lg flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span><strong>Medical Alert:</strong> {activeStudent.medicalInfo}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Current Order Summary */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-white mb-2 flex items-center justify-between">
                <span>Active Register Cart</span>
                <span className="text-[10px] text-slate-400">{selectedItems.length} items</span>
              </h4>

              {selectedItems.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No items added yet</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3">
                  {selectedItems.map((i) => (
                    <div
                      key={i.item.id}
                      className="flex items-center justify-between text-xs bg-slate-950 p-2 rounded-lg"
                    >
                      <div>
                        <span className="text-white font-medium">{i.quantity}x {i.item.name}</span>
                        <div className="text-[10px] text-slate-500">
                          {school.currency} {i.item.price.toFixed(2)} each
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {school.currency} {(i.item.price * i.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(i.item.id)}
                          className="text-slate-500 hover:text-rose-400 text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-sm font-bold text-white py-2 border-t border-slate-800">
                <span>Total Due:</span>
                <span className="text-amber-400">{school.currency} {totalCart.toFixed(2)}</span>
              </div>

              {(posError || (selectedItems.length > 0 && currentBalance < totalCart)) && (
                <div className="mt-2 p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-[11px] text-rose-200 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    {posError ||
                      `Insufficient balance (${school.currency} ${currentBalance.toFixed(2)} available vs ${school.currency} ${totalCart.toFixed(2)} due). Please top up student wallet.`}
                  </span>
                </div>
              )}

              <button
                disabled={selectedItems.length === 0 || currentBalance < totalCart}
                onClick={handleProcessTransaction}
                className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <CreditCard className="w-4 h-4" />
                Tap Student Card to Charge ({school.currency} {totalCart.toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Up Wallet Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Recharge Student Meal Wallet
            </h3>
            <p className="text-xs text-slate-400">
              Parents can recharge via Mobile Money (MTN MoMo, Telecel Cash, AT Money).
            </p>

            <form onSubmit={handleTopUp} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Student:</label>
                <div className="text-xs font-semibold text-white bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {activeStudent ? `${activeStudent.firstName} ${activeStudent.lastName} (${activeStudent.studentNumber})` : 'No student selected'}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Recharge Amount ({school.currency}):</label>
                <input
                  type="number"
                  min="5"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {topUpSuccess && (
                <div className="bg-emerald-950/60 border border-emerald-500 text-emerald-200 text-xs p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Wallet recharged successfully! New balance updated.</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md"
                >
                  Confirm MoMo Recharge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
