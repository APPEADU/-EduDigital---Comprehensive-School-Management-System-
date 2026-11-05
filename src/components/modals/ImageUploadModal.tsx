import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  Upload,
  Link as LinkIcon,
  CheckCircle,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Check,
  ZoomIn,
  RotateCw,
  Move,
  Crop,
  AlertCircle,
} from 'lucide-react';

export type ImageTargetType =
  | 'school_crest'
  | 'student'
  | 'staff'
  | 'admin'
  | 'platform_owner';

export interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ImageTargetType;
  currentImage: string;
  title?: string;
  subtitle?: string;
  entityName?: string;
  entityRoleOrCode?: string;
  onSave: (newImageUrl: string) => void;
}

const MAX_RAW_FILE_BYTES = 5 * 1024 * 1024; // 5 MB strict upper limit

// Curated presets for each specific category
const PRESET_COLLECTIONS: Record<
  ImageTargetType,
  { label: string; url: string; category?: string }[]
> = {
  school_crest: [
    {
      label: 'Kingdom Royal Gold & Emerald Shield',
      url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=400&q=80',
      category: 'Institutional',
    },
    {
      label: 'Academic Crown & Open Book',
      url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=400&q=80',
      category: 'Academic',
    },
    {
      label: 'Distinguished University Crest',
      url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=400&q=80',
      category: 'Heritage',
    },
    {
      label: 'Golden Lion & Torch of Truth',
      url: 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?auto=format&fit=crop&w=400&q=80',
      category: 'Honor',
    },
    {
      label: 'Royal Blue & Platinum Emblem',
      url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=400&q=80',
      category: 'Modern',
    },
    {
      label: 'Classic Ivy Academic Seal',
      url: 'https://images.unsplash.com/photo-1532649538685-0c096784b062?auto=format&fit=crop&w=400&q=80',
      category: 'Traditional',
    },
  ],
  student: [
    {
      label: 'Kwame (Male Senior Scholar)',
      url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
      category: 'Senior SHS',
    },
    {
      label: 'Abena (Female Science Scholar)',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      category: 'Senior SHS',
    },
    {
      label: 'Kofi (School Prefect - Male)',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      category: 'Prefect',
    },
    {
      label: 'Akosua (Girls Prefect - Female)',
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      category: 'Prefect',
    },
    {
      label: 'Yaw (General Arts Scholar)',
      url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
      category: 'Arts & Business',
    },
    {
      label: 'Esi (Junior High Student)',
      url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      category: 'Basic & JHS',
    },
  ],
  staff: [
    {
      label: 'Mrs. Mensah-Bonsu (Headmistress)',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      category: 'Leadership',
    },
    {
      label: 'Dr. Addo-Preko (Senior Science Master)',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      category: 'Faculty',
    },
    {
      label: 'Mrs. Harriet Agyapong (Bursar / Accounts)',
      url: 'https://images.unsplash.com/photo-1580894732488-c709e9db63ea?auto=format&fit=crop&w=400&q=80',
      category: 'Finance',
    },
    {
      label: 'Mr. Francis Quartey (HOD Languages)',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      category: 'Faculty',
    },
  ],
  admin: [
    {
      label: 'Chancellor & Executive Proprietor',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      category: 'Governance',
    },
    {
      label: 'Distinguished Academic Director',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      category: 'Administration',
    },
    {
      label: 'Senior Executive Trustee',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      category: 'Governance',
    },
  ],
  platform_owner: [
    {
      label: 'Official Uploaded Passport Portrait',
      url: '/assets/aistudio/PASSPORT_PICTURE_af7dd76f.jpg',
      category: 'Platform Owner',
    },
  ],
};

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  targetType,
  currentImage,
  title,
  subtitle,
  entityName,
  entityRoleOrCode,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Interactive Passport Crop, Zoom, Pan & Rotation Studio state
  const [rawSourceDataUrl, setRawSourceDataUrl] = useState<string | null>(null);
  const [rawImageElement, setRawImageElement] = useState<HTMLImageElement | null>(null);
  const [cropAspect, setCropAspect] = useState<'passport_3_4' | 'square_1_1'>(
    targetType === 'school_crest' ? 'square_1_1' : 'passport_3_4'
  );
  const [zoom, setZoom] = useState<number>(1.05);
  const [panX, setPanX] = useState<number>(0); // -100 to 100 percentage of overflow
  const [panY, setPanY] = useState<number>(0); // -100 to 100 percentage of overflow
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [outputStats, setOutputStats] = useState<{ width: number; height: number; kb: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStateRef = useRef<{ dragging: boolean; startX: number; startY: number; basePanX: number; basePanY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
    basePanX: 0,
    basePanY: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentImage);
      setUrlInput('');
      setErrorMessage(null);
      setSavedSuccess(false);
      setRawSourceDataUrl(null);
      setRawImageElement(null);
      setCropAspect(targetType === 'school_crest' ? 'square_1_1' : 'passport_3_4');
      setZoom(1.05);
      setPanX(0);
      setPanY(0);
      setRotationDeg(0);
      setOutputStats(null);
      setActiveTab('upload');
    }
  }, [isOpen, currentImage, targetType]);

  // Render cropped & resized passport image whenever rawImageElement or crop controls change
  const renderCroppedImage = useCallback(() => {
    if (!rawImageElement) return;

    const outWidth = cropAspect === 'passport_3_4' ? 270 : 320;
    const outHeight = cropAspect === 'passport_3_4' ? 360 : 320;

    const canvas = cropCanvasRef.current || document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outWidth, outHeight);

    ctx.save();
    ctx.translate(outWidth / 2, outHeight / 2);
    ctx.rotate((rotationDeg * Math.PI) / 180);

    const isRotatedQuarter = rotationDeg % 180 !== 0;
    const srcW = isRotatedQuarter ? rawImageElement.height : rawImageElement.width;
    const srcH = isRotatedQuarter ? rawImageElement.width : rawImageElement.height;

    // Cover fit scale * user zoom
    const coverScale = Math.max(outWidth / srcW, outHeight / srcH) * zoom;
    const drawW = rawImageElement.width * coverScale;
    const drawH = rawImageElement.height * coverScale;

    const maxOffsetX = Math.max(24, (srcW * coverScale - outWidth) / 2 + 40);
    const maxOffsetY = Math.max(24, (srcH * coverScale - outHeight) / 2 + 40);

    const offsetX = (panX / 100) * maxOffsetX;
    const offsetY = (panY / 100) * maxOffsetY;

    if (rotationDeg % 360 === 0) {
      ctx.drawImage(rawImageElement, -drawW / 2 + offsetX, -drawH / 2 + offsetY, drawW, drawH);
    } else {
      // Apply pan in screen space before rotation
      ctx.restore();
      ctx.save();
      ctx.translate(outWidth / 2 + offsetX, outHeight / 2 + offsetY);
      ctx.rotate((rotationDeg * Math.PI) / 180);
      ctx.drawImage(rawImageElement, -drawW / 2, -drawH / 2, drawW, drawH);
    }
    ctx.restore();

    const quality = targetType === 'school_crest' ? 0.88 : 0.84;
    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
    const approxBytes = Math.round((compressedDataUrl.length * 3) / 4);
    setPreviewUrl(compressedDataUrl);
    setOutputStats({
      width: outWidth,
      height: outHeight,
      kb: Math.max(1, Math.round(approxBytes / 1024)),
    });
  }, [rawImageElement, cropAspect, zoom, panX, panY, rotationDeg, targetType]);

  useEffect(() => {
    if (rawImageElement) {
      renderCroppedImage();
    }
  }, [rawImageElement, renderCroppedImage]);

  if (!isOpen) return null;

  const defaultTitle =
    targetType === 'school_crest'
      ? 'Update School Crest & Official Seal'
      : targetType === 'student'
      ? 'Student Passport Photograph Studio'
      : targetType === 'staff'
      ? 'Update Staff Member Portrait'
      : targetType === 'platform_owner'
      ? 'Platform Owner & Developer Portrait'
      : 'Update Administrator Profile Photo';

  const defaultSubtitle =
    targetType === 'school_crest'
      ? 'Displayed across student report cards, ID cards, official receipts, and transcripts.'
      : targetType === 'student'
      ? 'Upload, crop, and resize a recent passport-sized photograph for ID cards, attendance sheets, exams, and report cards.'
      : targetType === 'staff'
      ? 'Official faculty portrait used on staff ID badges, statutory SSNIT filings, and payslips.'
      : targetType === 'platform_owner'
      ? 'Displayed prominently in the Meet the Platform Owner and Developer section on the public website.'
      : 'Profile picture for login credentials and administrative authorizations.';

  const modalTitle = title || defaultTitle;
  const modalSubtitle = subtitle || defaultSubtitle;
  const presets = PRESET_COLLECTIONS[targetType] || PRESET_COLLECTIONS.admin;

  const allowedMimeTypes =
    targetType === 'school_crest'
      ? ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
      : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validate format restrictions
    if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
      setErrorMessage(
        targetType === 'school_crest'
          ? 'Unsupported file format. Accepted formats: JPG, JPEG, PNG, WEBP, or SVG.'
          : 'Unsupported file format. Please upload a passport photograph in JPG, JPEG, PNG, or WEBP format.'
      );
      e.target.value = '';
      return;
    }

    // 2. Validate file size restriction (<= 5 MB)
    if (file.size > MAX_RAW_FILE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(
        `File size (${sizeMb} MB) exceeds the 5.00 MB maximum limit. Please choose a smaller photograph.`
      );
      e.target.value = '';
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const srcUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        if (img.width < 120 || img.height < 120) {
          setErrorMessage(
            `Image resolution (${img.width}x${img.height}px) is too small for institutional printing. Minimum required is 120x120px.`
          );
          setIsProcessing(false);
          return;
        }
        setRawSourceDataUrl(srcUrl);
        setRawImageElement(img);
        setZoom(1.05);
        setPanX(0);
        setPanY(0);
        setRotationDeg(0);
        setIsProcessing(false);
      };
      img.onerror = () => {
        setErrorMessage('Failed to decode image file. Please select a valid JPG, PNG, or WEBP photograph.');
        setIsProcessing(false);
      };
      img.src = srcUrl;
    };
    reader.onerror = () => {
      setErrorMessage('Could not read the selected file from your device.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!rawImageElement) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      basePanX: panX,
      basePanY: panY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.dragging || !rawImageElement) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    const nextX = Math.max(-100, Math.min(100, Math.round(dragStateRef.current.basePanX + dx * 0.7)));
    const nextY = Math.max(-100, Math.min(100, Math.round(dragStateRef.current.basePanY + dy * 0.7)));
    setPanX(nextX);
    setPanY(nextY);
  };

  const handlePointerUp = () => {
    dragStateRef.current.dragging = false;
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a valid image URL.');
      return;
    }
    if (!trimmed.startsWith('https://') && !trimmed.startsWith('/assets/')) {
      setErrorMessage('Direct image links must use secure HTTPS (https://...).');
      return;
    }
    setErrorMessage(null);
    setRawSourceDataUrl(null);
    setRawImageElement(null);
    setOutputStats(null);
    setPreviewUrl(trimmed);
  };

  const handleSave = () => {
    if (!previewUrl) return;
    onSave(previewUrl);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-200">
        <canvas ref={cropCanvasRef} className="hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-white truncate">{modalTitle}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">{modalSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Entity Summary & Live Framed Output Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="relative shrink-0">
              <div
                className={`overflow-hidden border-2 border-emerald-500 shadow-lg bg-slate-900 flex items-center justify-center ${
                  cropAspect === 'passport_3_4' && targetType !== 'school_crest'
                    ? 'w-24 h-32 rounded-xl'
                    : 'w-24 h-24 rounded-xl'
                }`}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Passport Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-9 h-9 text-slate-600" />
                )}
              </div>
              <span className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1 rounded-full text-[10px] shadow border border-slate-950">
                <Check className="w-3 h-3" />
              </span>
            </div>

            <div className="text-center sm:text-left min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-emerald-400 font-medium">
                <span>{targetType.replace('_', ' ').toUpperCase()}</span>
                {entityRoleOrCode && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-slate-400">{entityRoleOrCode}</span>
                  </>
                )}
              </div>
              <h4 className="text-base font-bold text-white truncate">
                {entityName || (targetType === 'school_crest' ? 'Institution Crest' : 'Official Passport Record')}
              </h4>
              <p className="text-xs text-slate-400">
                Accepted formats: {targetType === 'school_crest' ? 'JPG, PNG, WEBP, SVG' : 'JPG, JPEG, PNG, WEBP'} · Max upload size: 5.0 MB
              </p>
              {outputStats && (
                <p className="text-[11px] text-emerald-400 font-mono tabular-nums">
                  Cropped Output: {outputStats.width}×{outputStats.height}px · {outputStats.kb} KB (Passport Ready)
                </p>
              )}
            </div>
          </div>

          {/* Source Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'upload'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload & Crop Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'presets'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sample Portraits ({presets.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'url'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Direct Image Link</span>
            </button>
          </div>

          {/* TAB 1: UPLOAD & INTERACTIVE PASSPORT CROPPING STUDIO */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept={allowedMimeTypes.join(',')}
                onChange={handleFileUpload}
                className="hidden"
              />

              {!rawSourceDataUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950/40 hover:bg-emerald-950/10 group"
                >
                  <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 group-hover:bg-emerald-600/20 text-slate-300 group-hover:text-emerald-400 flex items-center justify-center transition mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-sm text-white">
                    Click to select a passport photograph from your device or camera
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {targetType === 'school_crest'
                      ? 'JPG, PNG, WEBP, or SVG · Maximum 5 MB · Automatic square crest alignment'
                      : 'Recent passport-sized photo (plain background recommended) · JPG, PNG, or WEBP · Max 5 MB'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  {/* Interactive Drag-to-Crop Viewport */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center">
                    <div
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      title="Drag photograph to center head and shoulders"
                      className={`relative overflow-hidden border-2 border-emerald-500/80 bg-slate-900 select-none cursor-move touch-none shadow-inner ${
                        cropAspect === 'passport_3_4' ? 'w-42 h-56 rounded-xl' : 'w-48 h-48 rounded-xl'
                      }`}
                    >
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Interactive Crop Frame"
                          draggable={false}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      )}
                      {/* Passport Head-and-Shoulders Alignment Guide */}
                      {targetType !== 'school_crest' && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                          <div className="w-20 h-26 rounded-full border border-dashed border-white/55 mb-3" />
                          <div className="absolute inset-x-3 bottom-2 text-center text-[9px] text-white/80 bg-black/45 rounded px-1.5 py-0.5">
                            Drag to align face inside oval
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
                    >
                      Choose a different file
                    </button>
                  </div>

                  {/* Cropping, Framing & Resizing Controls */}
                  <div className="md:col-span-7 space-y-3.5 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Crop className="w-3.5 h-3.5 text-emerald-400" />
                        Crop, Frame & Resize Controls
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setZoom(1.05);
                          setPanX(0);
                          setPanY(0);
                          setRotationDeg(0);
                        }}
                        className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                      >
                        Reset Frame
                      </button>
                    </div>

                    {/* Aspect Ratio & Rotation */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCropAspect('passport_3_4')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                          cropAspect === 'passport_3_4'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Passport (3:4)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCropAspect('square_1_1')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                          cropAspect === 'square_1_1'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Square ID (1:1)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotationDeg((prev) => (prev + 90) % 360)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition cursor-pointer whitespace-nowrap"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Rotate 90°</span>
                      </button>
                    </div>

                    {/* Zoom Slider */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <ZoomIn className="w-3 h-3" /> Zoom / Scale
                        </span>
                        <span className="font-mono tabular-nums">{zoom.toFixed(2)}×</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={2.8}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Horizontal & Vertical Fine Pan Sliders */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span className="flex items-center gap-1">
                            <Move className="w-3 h-3" /> Horizontal
                          </span>
                          <span className="font-mono tabular-nums">{panX}%</span>
                        </div>
                        <input
                          type="range"
                          min={-100}
                          max={100}
                          step={2}
                          value={panX}
                          onChange={(e) => setPanX(parseInt(e.target.value, 10))}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Vertical</span>
                          <span className="font-mono tabular-nums">{panY}%</span>
                        </div>
                        <input
                          type="range"
                          min={-100}
                          max={100}
                          step={2}
                          value={panY}
                          onChange={(e) => setPanY(parseInt(e.target.value, 10))}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAMPLE PORTRAITS / PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Select a verified portrait or institutional crest:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
                {presets.map((p, idx) => {
                  const isSelected = previewUrl === p.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setRawSourceDataUrl(null);
                        setRawImageElement(null);
                        setOutputStats(null);
                        setPreviewUrl(p.url);
                        setErrorMessage(null);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col items-center gap-2 group ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/50'
                          : 'border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
                        <img
                          src={p.url}
                          alt={p.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </div>
                      <div className="text-center w-full">
                        <span className="text-[11px] font-bold text-white block line-clamp-1">
                          {p.label}
                        </span>
                        {p.category && (
                          <span className="text-[10px] text-slate-400 block">
                            {p.category}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: IMAGE URL */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <label className="block text-xs text-slate-400">
                Direct HTTPS Photograph URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/passport-photo.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                >
                  Load Preview
                </button>
              </div>
            </div>
          )}

          {/* Validation Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 justify-center">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Validating dimensions & preparing passport frame...</span>
            </div>
          )}

          {/* Saved Confirmation */}
          {savedSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 rounded-xl text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Photograph saved and linked to institutional profile!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing || !previewUrl}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/30 cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Save & Apply Photograph</span>
          </button>
        </div>
      </div>
    </div>
  );
};
