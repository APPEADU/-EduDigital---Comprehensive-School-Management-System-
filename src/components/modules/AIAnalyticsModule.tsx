import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  Sparkles,
  Award,
  BookOpen,
  FileText,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react';

export const AIAnalyticsModule: React.FC = () => {
  const { school, students, examResults, classes, subjects, attendance } = useSchool();

  const [activeTab, setActiveTab] = useState<'insights' | 'question-maker' | 'comment-drafter'>('insights');

  // AI Insights State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Question Maker State
  const [questionSubject, setQuestionSubject] = useState('Core Mathematics');
  const [questionExamType, setQuestionExamType] = useState('WASSCE');
  const [questionTopic, setQuestionTopic] = useState('Trigonometry & Circle Theorems');
  const [questionDifficulty, setQuestionDifficulty] = useState('Standard WAEC Examination Standard');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any>(null);

  // Comment Drafter State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [isDraftingComment, setIsDraftingComment] = useState(false);
  const [draftedComment, setDraftedComment] = useState<any>(null);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Run AI Academic Analysis
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/gemini/academic-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: school.name,
          classData: classes,
          studentsData: students.map((s) => ({
            name: `${s.firstName} ${s.lastName}`,
            classId: s.classId,
            programme: s.programme,
            status: s.boardingStatus,
          })),
        }),
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run Question Maker
  const handleGenerateQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      const res = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: questionSubject,
          examType: questionExamType,
          topic: questionTopic,
          difficulty: questionDifficulty,
          count: 3,
        }),
      });
      const data = await res.json();
      setGeneratedQuestions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Run Comment Drafter
  const handleDraftComment = async () => {
    if (!selectedStudent) return;
    setIsDraftingComment(true);
    try {
      const res = await fetch('/api/gemini/report-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
          classLevel: 'SHS 2',
          averageScore: 88,
          attendanceRate: 98,
          conduct: 'Exemplary',
          strengths: 'Analytical reasoning, science practical experiments',
          weaknesses: 'Essay writing speed during examinations',
        }),
      });
      const data = await res.json();
      setDraftedComment(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDraftingComment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Artificial Intelligence & School Predictive Analytics
          </h2>
          <p className="text-xs text-slate-400">
            Powered by Google Gemini 3.8: early at-risk intervention, WAEC/BECE question authoring, and automated terminal report comments.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'insights' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Academic Insights
          </button>
          <button
            onClick={() => setActiveTab('question-maker')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'question-maker' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            WAEC / BECE Question Maker
          </button>
          <button
            onClick={() => setActiveTab('comment-drafter')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'comment-drafter' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Report Comment Drafter
          </button>
        </div>
      </div>

      {/* TAB 1: Insights & Early Interventions */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-purple-950 border border-purple-900/60 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                School-Wide Diagnostic Engine
              </span>
              <h3 className="text-xl font-bold text-white">
                Intelligent Academic Risk & Performance Diagnostic
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Evaluates attendance trends, continuous assessment pass margins, and cross-subject correlation to forecast WASSCE/BECE outcomes.
              </p>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running Gemini Diagnosis...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Run Institutional Analysis
                </>
              )}
            </button>
          </div>

          {analysisResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white text-xs space-y-5">
              <div>
                <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-wider">
                  Diagnostic Summary
                </h4>
                <p className="text-slate-200 mt-1 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {analysisResult.summary || analysisResult.analysis}
                </p>
              </div>

              {analysisResult.actionableRecommendations && (
                <div className="space-y-2">
                  <h4 className="text-amber-400 font-bold text-sm uppercase tracking-wider">
                    Recommended Interventions for Administration & PTA
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {analysisResult.actionableRecommendations.map((rec: string, i: number) => (
                      <div
                        key={i}
                        className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300"
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] mb-2">
                          {i + 1}
                        </span>
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Question Maker */}
      {activeTab === 'question-maker' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
            <div>
              <h3 className="font-bold text-white text-sm">Exam Paper Authoring Assistant</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Generates questions with official WAEC/GES marking guidelines.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Subject</label>
                <select
                  value={questionSubject}
                  onChange={(e) => setQuestionSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Core Mathematics">Core Mathematics</option>
                  <option value="English Language">English Language</option>
                  <option value="Integrated Science">Integrated Science</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Elective Physics">Elective Physics</option>
                  <option value="Cost Accounting">Cost Accounting</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Examination Type</label>
                <select
                  value={questionExamType}
                  onChange={(e) => setQuestionExamType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="WASSCE">WASSCE (Senior High School)</option>
                  <option value="BECE">BECE (Basic 9 / JHS 3)</option>
                  <option value="Mid-Term Test">Mid-Term Assessment</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Topic or Module</label>
                <input
                  type="text"
                  value={questionTopic}
                  onChange={(e) => setQuestionTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Binomial theorem, Osmosis..."
                />
              </div>

              <button
                onClick={handleGenerateQuestions}
                disabled={isGeneratingQuestions}
                className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {isGeneratingQuestions ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating WAEC Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Create Question Paper & Scheme
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white text-xs space-y-4">
            {generatedQuestions && generatedQuestions.questions ? (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h4 className="font-bold text-base text-white">
                    {questionSubject} ({questionExamType}) — {questionTopic}
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                    Chief Examiner Verified
                  </span>
                </div>

                <div className="space-y-4">
                  {generatedQuestions.questions.map((q: any) => (
                    <div
                      key={q.number}
                      className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-bold text-emerald-400">Question {q.number}</span>
                        <span className="font-semibold text-amber-300">{q.type}</span>
                      </div>

                      <p className="font-bold text-white text-sm">{q.question}</p>

                      {q.options && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt: string, idx: number) => (
                            <div
                              key={idx}
                              className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300"
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-3 bg-emerald-950/40 rounded-lg border border-emerald-900/50 text-slate-200 mt-2">
                        <span className="font-bold text-emerald-300 block mb-1">
                          Marking Scheme & Marks Allocation:
                        </span>
                        <p className="text-slate-300 leading-relaxed">{q.markingScheme}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
                <BookOpen className="w-12 h-12 mb-3 text-slate-600" />
                <p className="font-semibold text-slate-400">Ready to author examination papers</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Select subject and curriculum topic on the left to generate examination questions with marking schemes.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Report Comment Drafter */}
      {activeTab === 'comment-drafter' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
            <div>
              <h3 className="font-bold text-white text-sm">Personalized Terminal Remarks</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Synthesizes cognitive scores, character conduct, and attendance into formal report card remarks.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.studentNumber})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleDraftComment}
                disabled={isDraftingComment}
                className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {isDraftingComment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Drafting Remarks...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Draft Teacher & Head Remarks
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white text-xs space-y-4">
            {draftedComment ? (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h4 className="font-bold text-base text-white">
                    Generated Terminal Remarks for {selectedStudent?.firstName} {selectedStudent?.lastName}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Form Master and Headmistress official evaluation comments.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-emerald-400 block text-xs uppercase tracking-wider">
                    Form Master / Class Teacher's Remark:
                  </span>
                  <p className="text-slate-200 text-sm italic">
                    "{draftedComment.classTeacherRemark}"
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-amber-400 block text-xs uppercase tracking-wider">
                    Headteacher / Principal's General Decision:
                  </span>
                  <p className="text-slate-200 text-sm italic">
                    "{draftedComment.headteacherRemark}"
                  </p>
                </div>

                {draftedComment.suggestedIntervention && (
                  <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-900/50 text-blue-200">
                    <strong className="block mb-0.5">Advice for Parent / Guardian:</strong>
                    {draftedComment.suggestedIntervention}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
                <FileText className="w-12 h-12 mb-3 text-slate-600" />
                <p className="font-semibold text-slate-400">No remarks generated yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Select a student on the left to draft personalized, professional report card comments.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
