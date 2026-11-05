import React, { useState, useRef } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { UserAccount } from '../../types';
import {
  X,
  Camera,
  Upload,
  Link as LinkIcon,
  CheckCircle,
  Sparkles,
  Shield,
  RefreshCw,
} from 'lucide-react';

interface UpdateAdminPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: UserAccount;
}

// Curated dignified executive & educator portrait presets
const EXECUTIVE_PHOTO_PRESETS = [
  {
    label: 'Executive Formal 1 (Academic Suit)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Executive Formal 2 (Distinguished Glasses)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Executive Academic 3 (Chancellor Suit)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Executive Academic 4 (Administrative Blazer)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Executive Academic 5 (Ghanaian Educator)',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Executive Formal 6 (Senior Director)',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
  },
];

export const UpdateAdminPhotoModal: React.FC<UpdateAdminPhotoModalProps> = ({
  isOpen,
  onClose,
  targetUser,
}) => {
  const { currentUser, updateUser } = useSchool();
  const userToEdit = targetUser || currentUser;

  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [photoPreview, setPhotoPreview] = useState<string>(userToEdit.avatar);
  const [name, setName] = useState<string>(userToEdit.name);
  const [title, setTitle] = useState<string>(userToEdit.title);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle local file upload with automated canvas compression (max 320x320px)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to scale down and optimize photo for persistent local database storage
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 320;
        const MAX_HEIGHT = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setPhotoPreview(compressedDataUrl);
          setIsProcessing(false);
        } else {
          setPhotoPreview(event.target?.result as string);
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        setErrorMessage('Failed to read image file.');
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setErrorMessage('Could not open file.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setErrorMessage('Please enter an image URL.');
      return;
    }
    setErrorMessage(null);
    setPhotoPreview(urlInput.trim());
  };

  const handleSelectPreset = (url: string) => {
    setErrorMessage(null);
    setPhotoPreview(url);
  };

  const handleSave = () => {
    setIsProcessing(true);
    updateUser(userToEdit.id, {
      avatar: photoPreview,
      name: name.trim() || userToEdit.name,
      title: title.trim() || userToEdit.title,
    });

    setIsProcessing(false);
    setSuccessToast(true);
    setTimeout(() => {
      setSuccessToast(false);
      onClose();
    }, 900);
  };

  const handleReset = () => {
    const defaultAvatar =
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
    setPhotoPreview(defaultAvatar);
    setUrlInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl text-slate-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Update Administrator Picture & Profile
              </h3>
              <p className="text-[11px] text-slate-400">
                Kingdom Royal Institute • Manage admin photo and credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
          {/* Target Administrator Banner */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="relative">
              <img
                src={photoPreview}
                alt={userToEdit.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400 shadow-md bg-slate-800"
              />
              <span className="absolute bottom-0 right-0 p-1 bg-emerald-600 rounded-full border-2 border-slate-950 text-white">
                <Shield className="w-3 h-3" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm truncate">{userToEdit.name}</span>
                <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {userToEdit.role}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">{userToEdit.email}</div>
              <div className="text-[10px] text-emerald-400 font-medium mt-0.5">{userToEdit.title}</div>
            </div>
          </div>

          {/* Picture Source Tabs */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">Select Photo Source:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-medium transition cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-medium transition cursor-pointer ${
                  activeTab === 'url'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Image Link</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-medium transition cursor-pointer ${
                  activeTab === 'presets'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Presets</span>
              </button>
            </div>
          </div>

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-950/60 hover:bg-slate-950 transition cursor-pointer group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-bold text-white text-xs">
                  Click to browse or snap photo with camera
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports JPG, PNG, WEBP, GIF. Auto-resized and stored in the school database.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Image Web URL */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Direct Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/photos/dr-appeadu.jpg"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer"
                  >
                    Load
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  You can use direct image links from cloud storage or school photo galleries.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Curated Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-2">
              <span className="text-slate-400 text-[11px] block">
                Choose an executive avatar portrait:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {EXECUTIVE_PHOTO_PRESETS.map((preset, idx) => {
                  const isSelected = photoPreview === preset.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      title={preset.label}
                      className={`relative p-1 rounded-xl border transition cursor-pointer group ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-950/80 ring-2 ring-emerald-500/50'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-16 object-cover rounded-lg"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-slate-950 rounded-full p-0.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Preview Display: ID Badge & Header Mock */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Live Preview in System:
            </span>
            <div className="flex items-center gap-4 flex-wrap">
              {/* Header Badge Preview */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-700/60">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-8 h-8 rounded-full object-cover border border-emerald-400"
                />
                <div>
                  <div className="text-[11px] font-bold text-white leading-none">
                    {name.split(' ')[0]} {name.split(' ')[1] || ''}
                  </div>
                  <div className="text-[9px] text-emerald-400 capitalize mt-0.5">
                    {userToEdit.role}
                  </div>
                </div>
              </div>

              {/* Staff Card Avatar Preview */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-700/60">
                <img
                  src={photoPreview}
                  alt="Badge Preview"
                  className="w-10 h-10 rounded-xl object-cover border border-slate-600"
                />
                <div>
                  <div className="text-[11px] font-bold text-white leading-none">
                    Digital ID Card
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Kingdom Royal Institute</div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Name & Title Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1">Administrator Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Administrative Designation / Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-[11px]">
              {errorMessage}
            </div>
          )}

          {successToast && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-[11px] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Admin picture & profile updated successfully! Saved to database.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Save & Apply Picture</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
