import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ResearchArticle, ResearchArticleAuthor, ResearchArticleSection } from '../../types';
import { buildPublicShareUrl } from '../../utils/shareUrl';
import {
  BookOpen,
  BookOpenCheck,
  Search,
  FileText,
  Globe,
  Download,
  Share2,
  CheckCircle,
  Eye,
  Quote,
  X,
  User,
  Copy,
  Check,
  Building2,
  Send,
  ScrollText,
  ArrowLeft,
  ChevronRight,
  BookMarked,
  Printer,
  Trash2,
  PlusCircle,
  Lock,
} from 'lucide-react';

const CATEGORIES = [
  'All Disciplines',
  'STEM & Applied Science',
  'Education & Pedagogy',
  'Environmental & Climate Studies',
  'African History & Heritage',
  'Economics & Commerce',
  'ICT, AI & Robotics',
  'Literature & Cultural Studies',
] as const;

interface ResearchJournalModuleProps {
  readOnlyPublicMode?: boolean;
  onBackToLogin?: () => void;
}

export const ResearchJournalModule: React.FC<ResearchJournalModuleProps> = ({
  readOnlyPublicMode = false,
  onBackToLogin,
}) => {
  const {
    school,
    schools,
    currentUser,
    researchArticles,
    allPublicResearchArticles,
    publishResearchArticle,
    updateResearchArticle,
    deleteResearchArticle,
    recordArticleView,
    recordArticleDownload,
    recordArticleCitation,
  } = useSchool();

  // Primary navigation / view state
  const [activeScope, setActiveScope] = useState<'school' | 'wider_world'>(
    readOnlyPublicMode ? 'wider_world' : 'school'
  );
  const [selectedArticle, setSelectedArticle] = useState<ResearchArticle | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Disciplines');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [sortBy, setSortBy] = useState<'recent' | 'views' | 'citations'>('recent');

  // Modals & Action feedbacks
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showCitationModal, setShowCitationModal] = useState<ResearchArticle | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [citationFormat, setCitationFormat] = useState<'APA' | 'Harvard' | 'MLA' | 'Chicago' | 'BibTeX'>('APA');
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [citationFeedback, setCitationFeedback] = useState<string | null>(null);

  // Publish Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formCategory, setFormCategory] = useState<ResearchArticle['category']>('STEM & Applied Science');
  const [formKeywords, setFormKeywords] = useState('');
  const [formVolume, setFormVolume] = useState(`${school.name} Journal of Scholarly Inquiries, Vol. 1 (2026)`);
  const [formStatus, setFormStatus] = useState<ResearchArticle['status']>('Published Open Access');
  const [formAbstract, setFormAbstract] = useState('');
  const [formIsOpenToPublic, setFormIsOpenToPublic] = useState(true);
  const [formPeerReviewNotes, setFormPeerReviewNotes] = useState(
    'Reviewed and approved by the Institutional Academic Board & Faculty Reviewers.'
  );
  const [formAuthors, setFormAuthors] = useState<ResearchArticleAuthor[]>([
    {
      name: currentUser.name || 'Dr. Kwame Addo-Preko',
      role: currentUser.title || 'Lead Faculty Researcher',
      affiliation: `${school.name}`,
      email: currentUser.email || 'research@school.edu.gh',
      isCorresponding: true,
    },
  ]);
  const [formSections, setFormSections] = useState<ResearchArticleSection[]>([
    { heading: 'Introduction & Background', content: '' },
    { heading: 'Research Methodology & Data Collection', content: '' },
    { heading: 'Findings, Data Analysis & Discussion', content: '' },
    { heading: 'Institutional & Societal Recommendations', content: '' },
    { heading: 'Conclusion', content: '' },
  ]);
  const [formReferences, setFormReferences] = useState('');

  const canManageSchoolPress =
    !readOnlyPublicMode &&
    ['proprietor', 'admin', 'teacher', 'librarian'].includes(currentUser.role);

  const canSubmitPaper = !readOnlyPublicMode;

  // Articles source based on active scope (in public mode, school tab shows only open-to-public articles)
  const schoolVisibleArticles = readOnlyPublicMode
    ? researchArticles.filter((a) => a.isOpenToPublic)
    : researchArticles;

  const articlesSource =
    activeScope === 'school' ? schoolVisibleArticles : allPublicResearchArticles;

  // Helper to resolve publishing school profile
  const getPublishingSchool = (schoolId: string) => {
    return schools.find((s) => s.id === schoolId) || school;
  };

  // Filter & Search
  const filteredArticles = articlesSource
    .filter((art) => {
      const q = searchQuery.toLowerCase();
      const pubSchool = getPublishingSchool(art.schoolId);
      const matchesSearch =
        !q ||
        art.title.toLowerCase().includes(q) ||
        (art.subtitle && art.subtitle.toLowerCase().includes(q)) ||
        art.abstract.toLowerCase().includes(q) ||
        art.authors.some((a) => a.name.toLowerCase().includes(q)) ||
        art.keywords.some((k) => k.toLowerCase().includes(q)) ||
        art.doi.toLowerCase().includes(q) ||
        pubSchool.name.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === 'All Disciplines' || art.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'All Statuses' || art.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'views') return (b.viewsCount || 0) - (a.viewsCount || 0);
      if (sortBy === 'citations') return (b.citationsCount || 0) - (a.citationsCount || 0);
      return new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime();
    });

  // Calculate statistics for active scope
  const statsPool = activeScope === 'school' ? schoolVisibleArticles : allPublicResearchArticles;
  const totalPoolArticles = statsPool.length;
  const totalReads = statsPool.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0);
  const totalDownloads = statsPool.reduce((acc, curr) => acc + (curr.downloadsCount || 0), 0);
  const totalCitations = statsPool.reduce((acc, curr) => acc + (curr.citationsCount || 0), 0);

  // Handle article selection (triggers view count)
  const handleSelectArticle = (art: ResearchArticle) => {
    recordArticleView(art.id);
    setSelectedArticle({ ...art, viewsCount: (art.viewsCount || 0) + 1 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate citation string
  const generateCitation = (art: ResearchArticle, format: typeof citationFormat): string => {
    const authorStr = art.authors.map((a) => a.name).join(', ');
    const pubYear = new Date(art.publicationDate).getFullYear();

    switch (format) {
      case 'APA':
        return `${authorStr} (${pubYear}). ${art.title}${art.subtitle ? ': ' + art.subtitle : ''}. ${art.volume}. https://doi.org/${art.doi}`;
      case 'Harvard':
        return `${authorStr}, ${pubYear}. '${art.title}${art.subtitle ? ': ' + art.subtitle : ''}', ${art.volume}. Available at: https://doi.org/${art.doi}.`;
      case 'MLA':
        return `${authorStr}. "${art.title}${art.subtitle ? ': ' + art.subtitle : ''}." ${art.volume}, ${pubYear}, doi:${art.doi}.`;
      case 'Chicago':
        return `${authorStr}. "${art.title}${art.subtitle ? ': ' + art.subtitle : ''}." ${art.volume} (${pubYear}). https://doi.org/${art.doi}.`;
      case 'BibTeX': {
        const cleanKey = art.authors[0]?.name.split(' ').pop()?.toLowerCase() || 'author';
        return `@article{${cleanKey}${pubYear}${art.id.replace(/[^a-zA-Z0-9]/g, '')},\n  author = {${art.authors.map((a) => a.name).join(' and ')}},\n  title = {${art.title}${art.subtitle ? ': ' + art.subtitle : ''}},\n  journal = {${art.volume}},\n  year = {${pubYear}},\n  doi = {${art.doi}},\n  url = {https://doi.org/${art.doi}}\n}`;
      }
      default:
        return `${authorStr} (${pubYear}). ${art.title}. ${art.volume}.`;
    }
  };

  const handleCopyCitation = (art: ResearchArticle) => {
    const text = generateCitation(art, citationFormat);
    navigator.clipboard.writeText(text);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  const handleCopyShareLink = (art: ResearchArticle) => {
    const link = buildPublicShareUrl(`?doi=${encodeURIComponent(art.doi)}#${art.id}`);
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Real downloadable scholarly HTML manuscript generator
  const handleDownloadManuscript = (art: ResearchArticle) => {
    recordArticleDownload(art.id);
    if (selectedArticle && selectedArticle.id === art.id) {
      setSelectedArticle({
        ...selectedArticle,
        downloadsCount: (selectedArticle.downloadsCount || 0) + 1,
      });
    }

    const pubSchool = getPublishingSchool(art.schoolId);
    const slug = art.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 50);

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${art.title} — ${pubSchool.name} Institutional Press</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; max-width: 820px; margin: 40px auto; padding: 0 28px; color: #111827; line-height: 1.7; }
    header { border-bottom: 2px solid #111827; padding-bottom: 20px; margin-bottom: 28px; }
    .meta { font-family: system-ui, sans-serif; font-size: 12px; color: #4b5563; letter-spacing: 0.02em; margin-bottom: 10px; }
    h1 { font-size: 26px; line-height: 1.25; margin: 0 0 8px 0; }
    .subtitle { font-size: 16px; color: #374151; font-style: italic; margin: 0 0 16px 0; }
    .authors { font-family: system-ui, sans-serif; font-size: 13px; margin-top: 12px; }
    .author-item { margin-bottom: 4px; }
    .abstract { background: #f9fafb; border: 1px solid #e5e7eb; padding: 18px 22px; margin: 24px 0; font-size: 14px; }
    .abstract h3 { font-family: system-ui, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 8px 0; }
    h2 { font-size: 18px; margin-top: 28px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    p { margin: 12px 0; text-align: justify; }
    .references { font-size: 13px; margin-top: 36px; border-top: 1px solid #d1d5db; padding-top: 18px; }
    footer { margin-top: 40px; font-family: system-ui, sans-serif; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 14px; }
  </style>
</head>
<body>
  <header>
    <div class="meta">${pubSchool.name} Institutional Press · ${art.volume} · ISSN ${art.issn || '2955-182X'} · DOI: ${art.doi}</div>
    <h1>${art.title}</h1>
    ${art.subtitle ? `<div class="subtitle">${art.subtitle}</div>` : ''}
    <div class="authors">
      ${art.authors
        .map(
          (a) =>
            `<div class="author-item"><strong>${a.name}</strong> — ${a.role}, ${a.affiliation}${a.email ? ` (${a.email})` : ''}</div>`
        )
        .join('')}
    </div>
    <div class="meta" style="margin-top:12px;">Published: ${art.publicationDate} · Discipline: ${art.category} · Status: ${art.status} · License: ${art.license}</div>
  </header>
  <section class="abstract">
    <h3>Abstract &amp; Contribution to Knowledge</h3>
    <p>${art.abstract}</p>
    <div class="meta" style="margin-top:10px;margin-bottom:0;"><strong>Keywords:</strong> ${art.keywords.join(' · ')}</div>
  </section>
  ${art.sections
    .map(
      (sec, idx) => `
  <section>
    <h2>${idx + 1}. ${sec.heading.replace(/^\d+\.\s*/, '')}</h2>
    <p>${sec.content.replace(/\n/g, '</p><p>')}</p>
  </section>`
    )
    .join('')}
  ${
    art.references && art.references.length > 0
      ? `<section class="references">
    <h2>References &amp; Literature</h2>
    <ol>
      ${art.references.map((r) => `<li>${r}</li>`).join('')}
    </ol>
  </section>`
      : ''
  }
  <footer>
    Open-Access Scholarly Publication from ${pubSchool.name} (${pubSchool.region}, Ghana). Distributed under ${art.license}. Cite via DOI: https://doi.org/${art.doi}
  </footer>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug}-manuscript.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccessMessage(
      `Downloaded printable manuscript "${art.title.slice(0, 42)}..."`
    );
    setTimeout(() => setDownloadSuccessMessage(null), 3500);
  };

  const handlePrintArticle = () => {
    window.print();
  };

  const handleRecordCitationClick = (art: ResearchArticle) => {
    recordArticleCitation(art.id);
    if (selectedArticle && selectedArticle.id === art.id) {
      setSelectedArticle({
        ...selectedArticle,
        citationsCount: (selectedArticle.citationsCount || 0) + 1,
      });
    }
    setCitationFeedback('Citation recorded in institutional impact registry.');
    setTimeout(() => setCitationFeedback(null), 3000);
  };

  const handleTogglePublicVisibility = (art: ResearchArticle) => {
    if (art.schoolId !== school.id) return;
    const nextVal = !art.isOpenToPublic;
    updateResearchArticle(art.id, { isOpenToPublic: nextVal });
    if (selectedArticle && selectedArticle.id === art.id) {
      setSelectedArticle({ ...selectedArticle, isOpenToPublic: nextVal });
    }
  };

  const handleConfirmDelete = (id: string) => {
    deleteResearchArticle(id);
    setConfirmDeleteId(null);
    if (selectedArticle?.id === id) {
      setSelectedArticle(null);
    }
  };

  // Form Authors manipulation
  const handleAddAuthor = () => {
    setFormAuthors([
      ...formAuthors,
      {
        name: '',
        role: 'Co-Author / Student Researcher',
        affiliation: school.name,
        email: '',
      },
    ]);
  };

  const handleRemoveAuthor = (index: number) => {
    if (formAuthors.length <= 1) return;
    setFormAuthors(formAuthors.filter((_, i) => i !== index));
  };

  const handleAuthorChange = (index: number, field: keyof ResearchArticleAuthor, value: any) => {
    const updated = [...formAuthors];
    updated[index] = { ...updated[index], [field]: value };
    setFormAuthors(updated);
  };

  // Form Sections manipulation
  const handleAddSection = () => {
    setFormSections([
      ...formSections,
      { heading: `Additional Section`, content: '' },
    ]);
  };

  const handleRemoveSection = (index: number) => {
    setFormSections(formSections.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index: number, field: keyof ResearchArticleSection, value: string) => {
    const updated = [...formSections];
    updated[index] = { ...updated[index], [field]: value };
    setFormSections(updated);
  };

  // Open publish modal with fresh default volume for active school
  const openPublishModal = () => {
    setFormVolume(`${school.name} Journal of Scholarly Inquiries, Vol. 1 (2026)`);
    setFormAuthors([
      {
        name: currentUser.name || 'Faculty Researcher',
        role: currentUser.title || 'Lead Author',
        affiliation: school.name,
        email: currentUser.email || '',
        isCorresponding: true,
      },
    ]);
    setShowPublishModal(true);
  };

  // Submit new article
  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAbstract.trim()) return;

    const keywordsArray = formKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const referencesArray = formReferences
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    const newArt = publishResearchArticle({
      schoolId: school.id,
      title: formTitle.trim(),
      subtitle: formSubtitle.trim() || undefined,
      abstract: formAbstract.trim(),
      authors: formAuthors.filter((a) => a.name.trim()),
      category: formCategory,
      keywords: keywordsArray.length ? keywordsArray : ['Education', 'Research', 'Ghana'],
      volume: formVolume.trim() || `${school.name} Scholarly Series (2026)`,
      issn: '2955-182X (Online)',
      status: formStatus,
      peerReviewNotes: formPeerReviewNotes.trim(),
      license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
      sections: formSections.filter((s) => s.heading.trim() && s.content.trim()),
      references: referencesArray.length
        ? referencesArray
        : ['Institutional Research Archives & Empirical Field Records (2026).'],
      isOpenToPublic: formIsOpenToPublic,
      featured: true,
    });

    setShowPublishModal(false);
    setFormTitle('');
    setFormSubtitle('');
    setFormAbstract('');
    setFormKeywords('');
    setFormReferences('');

    setActiveScope('school');
    handleSelectArticle(newArt);
  };

  return (
    <div className="space-y-6">
      {/* Public Reader Top Navigation Bar when viewed from outside Login */}
      {readOnlyPublicMode && onBackToLogin && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={school.crest}
              alt={school.name}
              className="w-8 h-8 rounded-lg object-cover border border-slate-700"
            />
            <div>
              <div className="text-xs font-bold text-white">
                Open-Access Scholarly Repository · Public Reader Edition
              </div>
              <div className="text-[11px] text-slate-400">
                Free for students, educators, universities, and the wider world to read and cite
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToLogin}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Staff / Author Portal Sign In</span>
          </button>
        </div>
      )}

      {/* Toast Feedback Messages */}
      {downloadSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/50 text-xs font-semibold">
          <Download className="w-4 h-4" />
          <span>{downloadSuccessMessage}</span>
        </div>
      )}

      {citationFeedback && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/40 text-xs font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{citationFeedback}</span>
        </div>
      )}

      {/* DETAILED ARTICLE READER VIEW */}
      {selectedArticle ? (
        <div className="space-y-6">
          {/* Top Return & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl print:hidden">
            <button
              type="button"
              onClick={() => setSelectedArticle(null)}
              className="flex items-center gap-2 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Back to Journal Repository</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {canManageSchoolPress && selectedArticle.schoolId === school.id && (
                <>
                  <button
                    type="button"
                    onClick={() => handleTogglePublicVisibility(selectedArticle)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                    title="Toggle visibility between School Community Only and Wider World Open Access"
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {selectedArticle.isOpenToPublic
                        ? 'Public to Wider World'
                        : 'School Community Only'}
                    </span>
                  </button>

                  {confirmDeleteId === selectedArticle.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-950/70 border border-rose-800 px-2.5 py-1.5 rounded-xl">
                      <span className="text-[11px] text-rose-200 font-semibold">Remove?</span>
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(selectedArticle.id)}
                        className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(selectedArticle.id)}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                      title="Withdraw or delete publication"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => handleCopyShareLink(selectedArticle)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                {copiedLink ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{copiedLink ? 'DOI Link Copied' : 'Share Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCitationModal(selectedArticle)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                <Quote className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cite Paper</span>
              </button>

              <button
                type="button"
                onClick={handlePrintArticle}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-300" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadManuscript(selectedArticle)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Manuscript</span>
              </button>
            </div>
          </div>

          {/* Academic Article Masthead & Full Text */}
          <article className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-8 shadow-xl">
            {/* Clean Editorial Metadata Line (Unboxed, Zero-Pill Discipline) */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
              <span className="font-semibold text-emerald-400">
                {selectedArticle.isOpenToPublic ? 'Open Access' : 'Institutional Access'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300 font-medium">{selectedArticle.category}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedArticle.status}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-400">DOI: {selectedArticle.doi}</span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-3 border-b border-slate-800 pb-6">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                {selectedArticle.title}
              </h1>
              {selectedArticle.subtitle && (
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {selectedArticle.subtitle}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400 pt-1">
                <span className="text-emerald-400 font-medium">{selectedArticle.volume}</span>
                <span aria-hidden="true">·</span>
                <span>Published {selectedArticle.publicationDate}</span>
                <span aria-hidden="true">·</span>
                <span>{getPublishingSchool(selectedArticle.schoolId).name}</span>
              </div>
            </div>

            {/* Authors & Affiliations */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Authors & Institutional Affiliations
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs pt-1">
                {selectedArticle.authors.map((author, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {author.name.charAt(0)}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="font-bold text-white truncate">
                        {author.name}
                        {author.isCorresponding ? ' *' : ''}
                      </div>
                      <div className="text-[11px] text-emerald-400 truncate">{author.role}</div>
                      <div className="text-[11px] text-slate-400 truncate">{author.affiliation}</div>
                      {author.email && (
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {author.email}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Article Impact Metrics & Open Access License */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-800 text-xs text-slate-400">
              <div className="flex flex-wrap items-center gap-6 font-mono tabular-nums">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <strong className="text-white">{selectedArticle.viewsCount || 0}</strong> reads
                </span>
                <span className="flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-sky-400" />
                  <strong className="text-white">{selectedArticle.downloadsCount || 0}</strong> downloads
                </span>
                <span className="flex items-center gap-1.5">
                  <Quote className="w-4 h-4 text-amber-400" />
                  <strong className="text-white">{selectedArticle.citationsCount || 0}</strong> citations
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-slate-400">{selectedArticle.license}</span>
                <button
                  type="button"
                  onClick={() => handleRecordCitationClick(selectedArticle)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-semibold text-xs transition cursor-pointer print:hidden"
                >
                  Acknowledge / Record Citation
                </button>
              </div>
            </div>

            {/* Abstract & Contribution to Knowledge (All-around subtle hairline border, no left stripe) */}
            <div className="space-y-3 bg-slate-950/60 border border-slate-800 p-6 rounded-2xl">
              <h2 className="font-bold text-xs text-emerald-400 uppercase tracking-wider">
                Abstract & Contribution to Knowledge
              </h2>
              <p className="text-slate-200 text-sm leading-relaxed">
                {selectedArticle.abstract}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Keywords:</span>
                {selectedArticle.keywords.map((kw, i) => (
                  <React.Fragment key={i}>
                    <span>{kw}</span>
                    {i < selectedArticle.keywords.length - 1 && <span aria-hidden="true">·</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Structured Manuscript Sections */}
            <div className="space-y-8 pt-2">
              {selectedArticle.sections.map((sec, idx) => {
                const cleanHeading = sec.heading.replace(/^\d+\.\s*/, '');
                return (
                  <section key={idx} className="space-y-3">
                    <h2 className="text-lg font-bold text-white tracking-tight border-b border-slate-800 pb-2">
                      {idx + 1}. {cleanHeading}
                    </h2>
                    <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                      {sec.content}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Peer Review Note */}
            {selectedArticle.peerReviewNotes && (
              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
                <strong className="text-slate-200">Editorial & Peer-Review Note:</strong>{' '}
                {selectedArticle.peerReviewNotes}
              </div>
            )}

            {/* References / Bibliography */}
            {selectedArticle.references && selectedArticle.references.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-800">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-emerald-400" />
                  References & Scholarly Literature
                </h3>
                <ol className="list-decimal list-outside pl-5 space-y-2 text-xs text-slate-400">
                  {selectedArticle.references.map((ref, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {ref}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Institutional Review Sign-off Footer */}
            <div className="pt-6 border-t border-slate-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-400">
              <div className="flex items-center gap-3">
                <img
                  src={getPublishingSchool(selectedArticle.schoolId).crest}
                  alt={getPublishingSchool(selectedArticle.schoolId).name}
                  className="w-9 h-9 object-cover rounded-lg border border-slate-700"
                />
                <div>
                  <div className="font-bold text-white">
                    {getPublishingSchool(selectedArticle.schoolId).name} Institutional Press
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Published as an enduring contribution to scholarly knowledge and educational practice.
                  </div>
                </div>
              </div>

              <div className="sm:text-right font-mono text-[11px]">
                <div className="text-emerald-400">DOI: {selectedArticle.doi}</div>
                <div className="text-slate-500">
                  ISSN {selectedArticle.issn || '2955-182X'} · Ghana
                </div>
              </div>
            </div>
          </article>
        </div>
      ) : (
        /* MAIN REPOSITORY & JOURNAL HUB VIEW */
        <div className="space-y-6">
          {/* Masthead Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-3xl">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <BookOpenCheck className="w-3.5 h-3.5" />
                    Open-Access Institutional Press
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">ISSN 2955-182X</span>
                  <span aria-hidden="true">·</span>
                  <span>Scholarly Repository & Knowledge Commons</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {activeScope === 'school'
                    ? `${school.name} Research & Journals`
                    : 'Global & Inter-School Open Knowledge Repository'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeScope === 'school'
                    ? `Peer-reviewed empirical studies, pedagogical innovations, STEM investigations, and capstone papers authored by faculty and student scholars at ${school.name} for the school community and the wider world.`
                    : 'Explore open-access journal articles and empirical research published across accredited schools for educators, universities, students, and global readers.'}
                </p>
              </div>

              {canSubmitPaper && (
                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={openPublishModal}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg transition cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Publish Research Article</span>
                  </button>
                </div>
              )}
            </div>

            {/* Clean Tabular Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8 pt-6 border-t border-slate-800">
              <div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Published Papers</span>
                </div>
                <div className="text-2xl font-black text-white font-mono tabular-nums mt-1">
                  {totalPoolArticles}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Peer-reviewed manuscripts</div>
              </div>

              <div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>Community & World Reads</span>
                </div>
                <div className="text-2xl font-black text-white font-mono tabular-nums mt-1">
                  {totalReads.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Open-access readership</div>
              </div>

              <div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Manuscript Downloads</span>
                </div>
                <div className="text-2xl font-black text-white font-mono tabular-nums mt-1">
                  {totalDownloads.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Full-text distributions</div>
              </div>

              <div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scholarly Citations</span>
                </div>
                <div className="text-2xl font-black text-white font-mono tabular-nums mt-1">
                  {totalCitations.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Academic acknowledgments</div>
              </div>
            </div>
          </div>

          {/* Interactive Scope Segmented Control: School Community vs Wider World */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveScope('school')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeScope === 'school'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{school.name} Press ({schoolVisibleArticles.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveScope('wider_world')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeScope === 'wider_world'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Wider World Open Network ({allPublicResearchArticles.length})</span>
              </button>
            </div>

            <div className="text-xs text-slate-400 px-2">
              {activeScope === 'school'
                ? `Showing research published by ${school.name} authors`
                : 'Cross-institutional open-access papers shared with the wider world'}
            </div>
          </div>

          {/* Search, Discipline Filter Tabs & Sort Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by article title, author, discipline, keyword, institution, or DOI..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs font-medium"
                >
                  <option value="All Statuses">All Publication Types</option>
                  <option value="Published Open Access">Published Open Access</option>
                  <option value="Peer Reviewed">Peer Reviewed</option>
                  <option value="Faculty Working Paper">Faculty Working Paper</option>
                  <option value="Student Capstone">Student Capstone</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs font-medium"
                >
                  <option value="recent">Sort: Most Recent</option>
                  <option value="views">Sort: Most Read</option>
                  <option value="citations">Sort: Most Cited</option>
                </select>
              </div>
            </div>

            {/* Interactive Discipline Filter Buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl overflow-x-auto">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Research Articles List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                Showing <strong className="text-white">{filteredArticles.length}</strong> scholarly{' '}
                {filteredArticles.length === 1 ? 'publication' : 'publications'}
              </span>
              <span>Creative Commons CC BY 4.0</span>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="font-bold text-white text-base">No matching publications</h3>
                <p className="text-xs max-w-md mx-auto">
                  No research or journal articles matched your current filters. Clear the filters or publish a new paper to contribute to the school's repository.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All Disciplines');
                    setSelectedStatus('All Statuses');
                  }}
                  className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredArticles.map((art) => {
                  const pubSchool = getPublishingSchool(art.schoolId);
                  return (
                    <article
                      key={art.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition space-y-3.5 group"
                    >
                      {/* Clean Unboxed Kicker Line */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-semibold text-emerald-400">{art.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{art.status}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {art.isOpenToPublic ? 'Open Access' : 'School Community Only'}
                          </span>
                          {activeScope === 'wider_world' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-slate-300 font-medium">{pubSchool.name}</span>
                            </>
                          )}
                        </div>

                        <span className="text-slate-500 font-mono text-[11px]">
                          DOI: {art.doi}
                        </span>
                      </div>

                      {/* Title & Subtitle */}
                      <div className="space-y-1">
                        <h3
                          onClick={() => handleSelectArticle(art)}
                          className="font-bold text-base sm:text-lg text-white group-hover:text-emerald-400 transition cursor-pointer leading-snug"
                        >
                          {art.title}
                        </h3>
                        {art.subtitle && (
                          <p className="text-xs text-slate-400 line-clamp-1">{art.subtitle}</p>
                        )}
                      </div>

                      {/* Authors Byline */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-300">
                        <span className="text-slate-500">By</span>
                        {art.authors.map((author, i) => (
                          <React.Fragment key={i}>
                            <span>
                              <strong className="font-semibold text-slate-200">{author.name}</strong>{' '}
                              <span className="text-slate-400">({author.role})</span>
                            </span>
                            {i < art.authors.length - 1 && (
                              <span className="text-slate-600" aria-hidden="true">
                                ·
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Abstract Excerpt */}
                      <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed">
                        {art.abstract}
                      </p>

                      {/* Unboxed Keywords */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
                        <span className="text-slate-500">Topics:</span>
                        {art.keywords.slice(0, 6).map((kw, idx) => (
                          <React.Fragment key={idx}>
                            <span>{kw}</span>
                            {idx < Math.min(art.keywords.length, 6) - 1 && (
                              <span aria-hidden="true">·</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Bottom Footer: Journal Volume, Metrics & Actions */}
                      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-slate-300">{art.volume}</span>
                          <span aria-hidden="true">·</span>
                          <span>{art.publicationDate}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{art.viewsCount || 0} reads</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {art.citationsCount || 0} citations
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCitationModal(art)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
                          >
                            <Quote className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Cite</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadManuscript(art)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-sky-400" />
                            <span>Download</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectArticle(art)}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer"
                          >
                            <span>Read Full Paper</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CITATION MODAL */}
      {showCitationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full text-xs space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Quote className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Cite Scholarly Publication</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCitationModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Select a reference format to cite this work in academic papers, curriculum guides, or literature reviews.
            </p>

            {/* Citation Formats Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
              {(['APA', 'Harvard', 'MLA', 'Chicago', 'BibTeX'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setCitationFormat(fmt)}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-center transition cursor-pointer ${
                    citationFormat === fmt
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            {/* Citation Output Box */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap select-all">
              {generateCitation(showCitationModal, citationFormat)}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 font-mono">
                DOI: {showCitationModal.doi}
              </span>

              <button
                type="button"
                onClick={() => handleCopyCitation(showCitationModal)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer"
              >
                {copiedCitation ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCitation ? 'Copied' : 'Copy Citation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT / PUBLISH RESEARCH ARTICLE MODAL */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-3xl w-full text-xs space-y-5 shadow-2xl my-8 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <BookOpenCheck className="w-5 h-5 text-emerald-400" />
                  Publish Research or Journal Article
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Publish through <strong className="text-emerald-400">{school.name} Press</strong> for the school community and the wider world.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishSubmit} className="space-y-5">
              {/* Title & Subtitle */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Article Full Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Comparative Efficacy of Solar Micro-Grids in Secondary Science Laboratories"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Subtitle / Empirical Scope
                  </label>
                  <input
                    type="text"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    placeholder="e.g. A Longitudinal Multi-Term Case Study"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Category, Volume & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Academic Discipline *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="STEM & Applied Science">STEM & Applied Science</option>
                    <option value="Education & Pedagogy">Education & Pedagogy</option>
                    <option value="Environmental & Climate Studies">Environmental & Climate Studies</option>
                    <option value="African History & Heritage">African History & Heritage</option>
                    <option value="Economics & Commerce">Economics & Commerce</option>
                    <option value="ICT, AI & Robotics">ICT, AI & Robotics</option>
                    <option value="Literature & Cultural Studies">Literature & Cultural Studies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Publication Status *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Published Open Access">Published Open Access</option>
                    <option value="Peer Reviewed">Peer Reviewed</option>
                    <option value="Faculty Working Paper">Faculty Working Paper</option>
                    <option value="Student Capstone">Student Capstone Research</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Journal Series / Volume
                  </label>
                  <input
                    type="text"
                    value={formVolume}
                    onChange={(e) => setFormVolume(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Authors Section */}
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    Authors & Contributors
                  </span>
                  <button
                    type="button"
                    onClick={handleAddAuthor}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition cursor-pointer"
                  >
                    + Add Co-Author
                  </button>
                </div>

                <div className="space-y-2">
                  {formAuthors.map((author, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
                    >
                      <input
                        type="text"
                        placeholder="Author Full Name"
                        required
                        value={author.name}
                        onChange={(e) => handleAuthorChange(index, 'name', e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        placeholder="Role (e.g. Faculty, SHS 3 Student)"
                        value={author.role}
                        onChange={(e) => handleAuthorChange(index, 'role', e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        placeholder="Department / Affiliation"
                        value={author.affiliation}
                        onChange={(e) => handleAuthorChange(index, 'affiliation', e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          placeholder="Email"
                          value={author.email || ''}
                          onChange={(e) => handleAuthorChange(index, 'email', e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                        />
                        {formAuthors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAuthor(index)}
                            className="p-1.5 text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Abstract */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Abstract & Contribution to Knowledge *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formAbstract}
                  onChange={(e) => setFormAbstract(e.target.value)}
                  placeholder="Summarize the research question, methodology, empirical findings, and how this work advances knowledge..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="e.g. Solar Energy, Secondary STEM, Pedagogy, Ghana"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Structured Sections Builder */}
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <ScrollText className="w-3.5 h-3.5 text-emerald-400" />
                    Manuscript Sections
                  </span>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition cursor-pointer"
                  >
                    + Add Section
                  </button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {formSections.map((sec, sIdx) => (
                    <div key={sIdx} className="space-y-2 pb-3 border-b border-slate-800/70 last:border-none">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          required
                          value={sec.heading}
                          onChange={(e) => handleSectionChange(sIdx, 'heading', e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-bold focus:outline-none focus:border-emerald-500 text-xs"
                        />
                        {formSections.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(sIdx)}
                            className="p-1.5 text-rose-400 hover:bg-slate-800 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        required
                        value={sec.content}
                        onChange={(e) => handleSectionChange(sIdx, 'content', e.target.value)}
                        placeholder="Write the full text, observations, data analysis, or arguments for this section..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* References */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  References & Bibliography (one per line)
                </label>
                <textarea
                  rows={3}
                  value={formReferences}
                  onChange={(e) => setFormReferences(e.target.value)}
                  placeholder="e.g. Ackah, I. (2020). Renewable energy transitions. Energy Policy, 138, 111244."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 text-xs font-mono"
                />
              </div>

              {/* Audience Access Toggle: Wider World vs School Community */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    Open Access to the Wider World
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    When enabled, both the {school.name} community and outside readers around the world can read, download, and cite this article. Disable to restrict to {school.name} members only.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={formIsOpenToPublic}
                    onChange={(e) => setFormIsOpenToPublic(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-lg cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish Article</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
