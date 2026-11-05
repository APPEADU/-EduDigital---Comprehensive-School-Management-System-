import React, { useRef, useState, useEffect } from 'react';
import { AuthorizedSignatory } from '../../types';
import {
  PenTool,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  signerName: string;
  signerDefaultTitle: string;
  signerDefaultRole?: AuthorizedSignatory['role'];
  existingSignatureUrl?: string;
  onSaveSignature: (
    dataUrl: string,
    method: 'drawn' | 'uploaded',
    role: AuthorizedSignatory['role'],
    customTitle: string
  ) => void;
}

interface Point {
  x: number;
  y: number;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  signerName,
  signerDefaultTitle,
  signerDefaultRole = 'Lead Lecturer / Teacher',
  existingSignatureUrl,
  onSaveSignature,
}) => {
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [inkColor, setInkColor] = useState<string>('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState<number>(2.6);
  const [signatoryRole, setSignatoryRole] = useState<AuthorizedSignatory['role']>(signerDefaultRole);
  const [customTitle, setCustomTitle] = useState<string>(signerDefaultTitle);
  const [strokes, setStrokes] = useState<{ points: Point[]; color: string; width: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Upload state
  const [rawUploadedImage, setRawUploadedImage] = useState<string | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(existingSignatureUrl || null);
  const [removeWhiteBg, setRemoveWhiteBg] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setCustomTitle(signerDefaultTitle);
    setSignatoryRole(signerDefaultRole);
    setUploadedPreviewUrl(existingSignatureUrl || null);
  }, [signerDefaultTitle, signerDefaultRole, existingSignatureUrl, isOpen]);

  // Redraw strokes whenever strokes list changes
  useEffect(() => {
    if (!isOpen || mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw subtle baseline guide (not exported when saving!)
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, canvas.height - 38);
    ctx.lineTo(canvas.width - 28, canvas.height - 38);
    ctx.stroke();
    ctx.restore();

    for (const s of strokes) {
      if (s.points.length === 0) continue;
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        const midX = (s.points[i - 1].x + s.points[i].x) / 2;
        const midY = (s.points[i - 1].y + s.points[i].y) / 2;
        ctx.quadraticCurveTo(s.points[i - 1].x, s.points[i - 1].y, midX, midY);
      }
      const last = s.points[s.points.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      ctx.restore();
    }
  }, [strokes, isOpen, mode]);

  // Process uploaded signature image (optional white background removal for transparent certificate rendering)
  useEffect(() => {
    if (!rawUploadedImage) return;
    if (!removeWhiteBg) {
      setUploadedPreviewUrl(rawUploadedImage);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const offscreen = document.createElement('canvas');
      const maxW = 520;
      const scale = Math.min(1, maxW / img.width);
      offscreen.width = Math.max(1, Math.round(img.width * scale));
      offscreen.height = Math.max(1, Math.round(img.height * scale));
      const ctx = offscreen.getContext('2d');
      if (!ctx) {
        setUploadedPreviewUrl(rawUploadedImage);
        return;
      }
      ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
      const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum > 228) {
          data[i + 3] = 0; // Turn white paper background transparent
        } else if (lum > 185) {
          data[i + 3] = Math.round(((228 - lum) / 43) * 255);
        }
      }
      ctx.putImageData(imgData, 0, 0);
      setUploadedPreviewUrl(offscreen.toDataURL('image/png'));
    };
    img.src = rawUploadedImage;
  }, [rawUploadedImage, removeWhiteBg]);

  if (!isOpen) return null;

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setErrorMsg(null);
    const pt = getCanvasPoint(e);
    setIsDrawing(true);
    setStrokes((prev) => [...prev, { points: [pt], color: inkColor, width: strokeWidth }]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pt = getCanvasPoint(e);
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const lastStroke = copy[copy.length - 1];
      copy[copy.length - 1] = {
        ...lastStroke,
        points: [...lastStroke.points, pt],
      };
      return copy;
    });
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const exportCleanDrawnCanvas = (): string | null => {
    if (strokes.length === 0) return null;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 560;
    exportCanvas.height = 180;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return null;

    for (const s of strokes) {
      if (s.points.length === 0) continue;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        const midX = (s.points[i - 1].x + s.points[i].x) / 2;
        const midY = (s.points[i - 1].y + s.points[i].y) / 2;
        ctx.quadraticCurveTo(s.points[i - 1].x, s.points[i - 1].y, midX, midY);
      }
      const last = s.points[s.points.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }
    return exportCanvas.toDataURL('image/png');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRawUploadedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSave = () => {
    if (mode === 'draw') {
      const dataUrl = exportCleanDrawnCanvas();
      if (!dataUrl) {
        setErrorMsg('Please draw your signature on the pad before saving, or switch to Upload Image.');
        return;
      }
      onSaveSignature(dataUrl, 'drawn', signatoryRole, customTitle.trim() || signerDefaultTitle);
      onClose();
    } else {
      if (!uploadedPreviewUrl) {
        setErrorMsg('Please select a PNG or JPG signature image to upload.');
        return;
      }
      onSaveSignature(uploadedPreviewUrl, 'uploaded', signatoryRole, customTitle.trim() || signerDefaultTitle);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Authorised Digital Signature Studio</h3>
              <p className="text-xs text-slate-400">
                Sign on interactive pad or upload official wet-ink signature for <strong className="text-white">{signerName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('draw');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
              mode === 'draw'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw Signature on Pad</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('upload');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
              mode === 'upload'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Signature Image</span>
          </button>
        </div>

        {/* Signatory Role & Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Certificate Signatory Capacity
            </label>
            <select
              value={signatoryRole}
              onChange={(e) => setSignatoryRole(e.target.value as AuthorizedSignatory['role'])}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Head of Institution">Head of Institution / Principal / Rector</option>
              <option value="Registrar">Registrar / Director of Credentials</option>
              <option value="Academic Dean">Academic Dean / Vice Principal</option>
              <option value="Chief Examiner">Chief Examiner / Assessment Chair</option>
              <option value="Lead Lecturer / Teacher">Lead Lecturer / Class Teacher</option>
              <option value="Council Chair">Governing Council Chair</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Printed Designation Under Signature
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Registrar & Secretary to Academic Board"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* DRAW TAB */}
        {mode === 'draw' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Ink Colour:</span>
                {[
                  { label: 'Archival Slate', color: '#0f172a' },
                  { label: 'Royal Blue Ink', color: '#1e3a8a' },
                  { label: 'Jet Black', color: '#000000' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setInkColor(c.color)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                      inkColor === c.color
                        ? 'border-emerald-500 bg-slate-800 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-white/30"
                      style={{ backgroundColor: c.color }}
                    />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStrokes((prev) => prev.slice(0, -1))}
                  disabled={strokes.length === 0}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStrokes([])}
                  disabled={strokes.length === 0}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/50 text-rose-300 disabled:opacity-40 cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border-2 border-slate-700 bg-white relative">
              <canvas
                ref={canvasRef}
                width={560}
                height={180}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full h-44 touch-none cursor-crosshair block"
              />
              {strokes.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-medium">
                  Sign here using your mouse, trackpad, stylus, or touch screen
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Exported automatically as high-contrast transparent PNG for certificates &amp; transcripts.</span>
              <div className="flex items-center gap-2">
                <span>Pen Weight:</span>
                {[1.8, 2.6, 3.6].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setStrokeWidth(w)}
                    className={`px-2 py-0.5 rounded font-mono cursor-pointer ${
                      strokeWidth === w ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* UPLOAD TAB */}
        {mode === 'upload' && (
          <div className="space-y-4 text-xs">
            <label className="block border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-5 text-center bg-slate-950/70 transition cursor-pointer">
              <Upload className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <span className="font-bold text-white block">
                Click to select PNG, JPG, or Scanned Wet-Ink Signature
              </span>
              <span className="text-slate-400 text-[11px] block mt-1">
                Recommended: Dark blue or black signature on clean white paper or transparent PNG
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-semibold text-white block">
                    Auto-Clean White Paper Background
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Converts white paper scans into crisp transparent ink for parchment certificates
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={removeWhiteBg}
                onChange={(e) => setRemoveWhiteBg(e.target.checked)}
                className="accent-emerald-500 w-4 h-4"
              />
            </label>

            {uploadedPreviewUrl && (
              <div className="p-4 rounded-xl bg-amber-50/95 border border-amber-200 text-slate-900 text-center">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block mb-2">
                  Certificate Signature Line Preview
                </span>
                <img
                  src={uploadedPreviewUrl}
                  alt="Signature Preview"
                  className="h-16 mx-auto object-contain"
                />
                <div className="w-56 mx-auto border-t border-slate-800 mt-1 pt-1">
                  <span className="font-bold text-xs block">{signerName}</span>
                  <span className="text-[10px] text-slate-600">{customTitle}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Bound to authorised institutional credential audit register</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Save Official Signature</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
