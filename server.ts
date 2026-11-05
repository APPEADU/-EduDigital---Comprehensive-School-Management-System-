import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import type { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

let cachedAiClient: GoogleGenAI | null = null;
async function getAiClient(): Promise<GoogleGenAI> {
  if (!cachedAiClient) {
    const { GoogleGenAI: GoogleGenAIClient } = await import('@google/genai');
    cachedAiClient = new GoogleGenAIClient({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAiClient;
}

// AI Endpoint: Academic Performance & Attendance Analytics
app.post('/api/gemini/academic-insights', async (req: Request, res: Response) => {
  try {
    const { schoolName, classData, studentsData } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        analysis: "Demo AI Mode: Strong academic progress observed. Recommended interventions: Form 2 Science needs additional practical sessions in Elective Chemistry; 3 students flagged for attendance below 80%. Overall pass rate is 88.4% across Core Mathematics and Integrated Science.",
        recommendations: [
          "Organize targeted math clinics for students with class scores below 18/30",
          "Acknowledge top performing students in WASSCE mock evaluations",
          "Send automated SMS alerts to parents of students with >3 consecutive absences"
        ]
      });
    }

    const prompt = `You are an expert Ghanaian educational psychologist and Senior High School / Basic School academic consultant for "${schoolName || 'Ghanaian Institution'}".
Analyze the following student performance and attendance data:
${JSON.stringify({ classData, studentsData })}

Provide a concise, practical evaluation report in structured JSON format with:
1. "summary": Executive summary of academic strengths and weaknesses
2. "atRiskStudents": List of students needing immediate remedial intervention with reason
3. "curriculumInsights": Specific subjects needing syllabus reinforcement
4. "actionableRecommendations": 3-5 concrete steps for the Headmaster, HODs, and PTA.

Return ONLY valid JSON.`;

    const ai = await getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini academic-insights error:', error);
    return res.status(500).json({ error: error.message || 'AI generation failed' });
  }
});

// AI Endpoint: GES Lesson Plan Builder (Ghana Education Service / NaCCA standard)
app.post('/api/gemini/lesson-plan', async (req: Request, res: Response) => {
  try {
    const { subject, classLevel, topic, duration, strand, subStrand } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        subject: subject || 'Integrated Science',
        classLevel: classLevel || 'JHS 2 / Form 2',
        strand: strand || 'Diversity of Matter',
        subStrand: subStrand || 'Elements, Compounds and Mixtures',
        contentStandard: `B8.1.1.1: Demonstrate an understanding of atomic structure and chemical combinations.`,
        learningIndicator: `B8.1.1.1.2: Differentiate between elements, compounds and chemical mixtures with Ghanaian everyday examples (e.g., brass, gari and water, air).`,
        coreCompetencies: 'Critical Thinking and Problem Solving, Collaboration and Communication, Digital Literacy',
        resources: 'Samples of salt, iron filings, sulphur, water, beaker, magnet, projector',
        starterPhase: '5 mins: Show learners a bowl of gari mix and pure water. Ask learners which can be separated physically.',
        mainPhase: [
          'Step 1 (15 mins): Teacher explains definitions of pure elements vs compounds vs mixtures with atomic diagrams.',
          'Step 2 (20 mins): Group activity where learners separate iron filings from sand using magnets.',
          'Step 3 (10 mins): Presentation of group findings and table summary.'
        ],
        assessment: 'Formative quiz: Classify 5 substances into element, compound, or mixture (Table salt, Oxygen, Shito sauce, Bronze, Water).',
        homework: 'List five mixtures found in your kitchen at home and explain how each can be separated.'
      });
    }

    const prompt = `Generate a comprehensive Ghana Education Service (GES) and National Council for Curriculum and Assessment (NaCCA) standard lesson plan note.
Subject: ${subject}
Class Level: ${classLevel}
Topic: ${topic}
Duration: ${duration || '60 minutes'}
Strand: ${strand || 'Relevant GES Strand'}
Sub-strand: ${subStrand || 'Relevant GES Sub-strand'}

Respond in JSON with the exact fields:
- "strand": string
- "subStrand": string
- "contentStandard": string (GES code e.g. B7.2.1.1 or SHS standard)
- "learningIndicator": string
- "coreCompetencies": string
- "resources": string
- "starterPhase": string
- "mainPhase": array of strings (Step 1, Step 2, Step 3)
- "assessment": string
- "homework": string`;

    const ai = await getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini lesson-plan error:', error);
    return res.status(500).json({ error: error.message || 'AI lesson plan generation failed' });
  }
});

// AI Endpoint: WAEC / WASSCE / BECE Question & Marking Scheme Generator
app.post('/api/gemini/generate-questions', async (req: Request, res: Response) => {
  try {
    const { subject, examType, topic, count, difficulty } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        questions: [
          {
            number: 1,
            type: 'Section A (Objective)',
            question: `In the expansion of (2x - 3)^4, what is the coefficient of x^2?`,
            options: ['A) 216', 'B) -216', 'C) 96', 'D) 108'],
            correctAnswer: 'A) 216',
            markingScheme: 'Using binomial expansion term: 4C2 * (2x)^2 * (-3)^2 = 6 * 4x^2 * 9 = 216x^2. Hence coefficient is 216.'
          },
          {
            number: 2,
            type: 'Section B (Theory / Structured)',
            question: `(a) Define Osmosis in living tissues. (b) Describe an experiment using an Irish potato or yam cup to demonstrate osmosis in concentrated sucrose solution.`,
            markingScheme: '(a) Osmosis is the movement of water molecules from a region of lower solute concentration (higher water potential) to a region of higher solute concentration (lower water potential) across a selectively permeable membrane (3 marks). (b) Peeling potato, cutting cavity, adding sucrose, beaker of water, observation of level change (7 marks).'
          }
        ]
      });
    }

    const prompt = `You are a Senior WAEC (West African Examinations Council) Chief Examiner for Ghanaian schools setting ${examType || 'WASSCE'} questions for:
Subject: ${subject}
Topic: ${topic}
Number of questions: ${count || 3}
Difficulty: ${difficulty || 'Standard WAEC Level'}

Return JSON format with a "questions" array, where each item has:
- "number": number
- "type": "Section A (Multiple Choice)" or "Section B (Theory)"
- "question": string
- "options": optional array of strings (for MCQs)
- "correctAnswer": string
- "markingScheme": detailed marks allocation breakdown`;

    const ai = await getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini generate-questions error:', error);
    return res.status(500).json({ error: error.message || 'Question generation failed' });
  }
});

// AI Endpoint: Personalized Terminal Report Card Comments
app.post('/api/gemini/report-comment', async (req: Request, res: Response) => {
  try {
    const { studentName, classLevel, averageScore, attendanceRate, conduct, strengths, weaknesses } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        classTeacherRemark: `${studentName} has shown commendable dedication this term with an average of ${averageScore}%. Maintains a respectful attitude and active participation in class discussions.`,
        headteacherRemark: `An impressive terminal result. Promoted with praise. Keep up the high standard in the coming term.`,
        suggestedIntervention: `Encourage reading wider literature to further refine essay composition.`
      });
    }

    const prompt = `Generate formal, encouraging, constructive school report card comments for a student in a Ghanaian school:
Student: ${studentName}
Class: ${classLevel}
Average Mark: ${averageScore}%
Attendance: ${attendanceRate}%
Conduct: ${conduct || 'Good'}
Strengths: ${strengths || 'Consistent class work, good teamwork'}
Weaknesses / Areas for Improvement: ${weaknesses || 'Needs more focus during end-of-term examinations'}

Return JSON:
- "classTeacherRemark": string (2-3 sentences)
- "headteacherRemark": string (1-2 decisive sentences)
- "suggestedIntervention": string (actionable advice for parents)`;

    const ai = await getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini report-comment error:', error);
    return res.status(500).json({ error: error.message || 'Report comment generation failed' });
  }
});

// AI Endpoint: BECE Mock Performance Analysis, Personalised Learning Support & Readiness Prediction Report
app.post('/api/gemini/bece-mock-support', async (req: Request, res: Response) => {
  try {
    const {
      schoolName,
      studentName,
      className,
      mockHistory,
      latestSubjects,
      latestAggregate,
      trendDirection,
      attendanceRatePercent,
      continuousAssessmentAvg,
    } = req.body;

    const safeSubjects: Array<{
      subjectName: string;
      totalScore: number;
      beceGrade: number;
      sectionAScore?: number;
      sectionBScore?: number;
    }> = Array.isArray(latestSubjects) ? latestSubjects : [];

    const guidanceDisclaimer =
      'Educational Guidance Notice: This BECE Readiness & Performance Prediction Report is generated from mock examinations, continuous assessments, and attendance trends solely for academic planning and revision support. It is not a guaranteed WAEC BECE outcome.';

    if (!process.env.GEMINI_API_KEY) {
      // Dynamic, student-specific fallback derived directly from the student's actual mock subject scores
      const sortedAsc = [...safeSubjects].sort((a, b) => a.totalScore - b.totalScore);
      const sortedDesc = [...safeSubjects].sort((a, b) => b.totalScore - a.totalScore);
      const weakest = sortedAsc.slice(0, 3);
      const strongest = sortedDesc.slice(0, 2);

      const topicCatalog: Record<string, { diffs: string[]; topics: string[]; q: string; opts?: string[]; ans: string; scheme: string }> = {
        mathematics: {
          diffs: ['Algebraic expressions & linear inequalities', 'Mensuration of plane & solid shapes', 'Fractions, ratios & commercial arithmetic'],
          topics: ['Solving linear equations & word problems', 'Area, perimeter & volume of cylinders/cones', 'Venn diagrams (two-set problems) & probability'],
          q: 'In a JHS 3 class of 45 learners, 28 study French, 24 study Computing, and each learner studies at least one of the two subjects. How many learners study both subjects?',
          opts: ['A) 5', 'B) 7', 'C) 11', 'D) 17'],
          ans: 'B) 7',
          scheme: 'Let x = learners studying both. (28 - x) + x + (24 - x) = 45 => 52 - x = 45 => x = 7 learners (4 marks).',
        },
        science: {
          diffs: ['Chemical equations, acids, bases & salts', 'Electrical circuits & energy transformations', 'Human digestive & circulatory systems'],
          topics: ['Balancing simple chemical equations & pH indicators', 'Series vs parallel circuits & Ohm’s relationship', 'Photosynthesis, respiration & Osmosis experiments'],
          q: '(a) State two differences between a physical change and a chemical change. (b) Explain why table salt dissolved in water can be recovered by evaporation.',
          ans: 'Physical changes form no new substance and are reversible; evaporation removes water solvent leaving NaCl crystals.',
          scheme: '(a) Two valid contrasts: new substance vs no new substance; reversibility; heat changes (4 marks). (b) Water has a lower boiling point than NaCl and vaporizes leaving salt residue (6 marks).',
        },
        english: {
          diffs: ['Subject-verb concord & tense consistency in formal letters', 'Summary comprehension inference questions', 'Idiomatic expressions & lexical register'],
          topics: ['Formal letter & debate speech writing structure', 'Direct & indirect speech transformations', 'Comprehension vocabulary replacement in context'],
          q: 'Choose the word nearest in meaning to the underlined word: The headteacher commended the candidates for their diligence during the mock week.',
          opts: ['A) rebuked', 'B) praised', 'C) questioned', 'D) excused'],
          ans: 'B) praised',
          scheme: '"Commended" in formal context means praised or applauded (2 marks).',
        },
        social: {
          diffs: ['Constitutional governance & organs of government', 'Map reading, scale & cardinal bearings', 'Sustainable resource development in Ghana'],
          topics: ['Separation of powers & checks and balances', 'Environmental conservation & illegal mining impacts', 'Ghana’s post-independence socio-economic milestones'],
          q: 'Explain three ways in which environmental degradation affects agricultural productivity in rural Ghanaian communities.',
          ans: 'Loss of topsoil fertility, pollution of irrigation water bodies, and erratic micro-climate rainfall.',
          scheme: '3 well-explained points × 4 marks each = 12 marks (statement 1m, explanation with Ghanaian example 3m).',
        },
      };

      const lookupSubjectGuide = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('math')) return topicCatalog.mathematics;
        if (lower.includes('science')) return topicCatalog.science;
        if (lower.includes('english')) return topicCatalog.english;
        return topicCatalog.social;
      };

      const agg = Number(latestAggregate) || 18;
      const readinessLevel =
        agg <= 10
          ? 'High Readiness (Distinction Track)'
          : agg <= 18
          ? 'On Track (Credit Readiness)'
          : agg <= 26
          ? 'Developing (Targeted Support Needed)'
          : 'Priority Intervention Required';

      const lowBound = Math.max(6, agg - 3);
      const highBound = Math.min(54, agg + 2);

      const subjectDiagnoses = safeSubjects.map((sub) => {
        const guide = lookupSubjectGuide(sub.subjectName);
        const status =
          sub.totalScore >= 70
            ? 'Strength'
            : sub.totalScore >= 55
            ? 'Moderate'
            : 'Needs Urgent Attention';
        return {
          subjectName: sub.subjectName,
          latestScore: sub.totalScore,
          latestGrade: sub.beceGrade,
          status,
          areasOfDifficulty: status === 'Strength' ? ['Timed Section B presentation accuracy'] : guide.diffs,
          revisionTopics: guide.topics,
          targetedAction:
            status === 'Strength'
              ? `Maintain high momentum in ${sub.subjectName} with weekly timed WAEC past papers to secure Grade 1.`
              : `Complete 3 focused 45-minute topic drills per week in ${sub.subjectName} and review Section B marking schemes with subject teacher.`,
        };
      });

      const practiceQuestions = (weakest.length > 0 ? weakest : safeSubjects.slice(0, 2)).map((sub) => {
        const guide = lookupSubjectGuide(sub.subjectName);
        return {
          subjectName: sub.subjectName,
          topic: guide.topics[0],
          questionType: guide.opts ? 'Section A (Objective)' : 'Section B (Structured Theory)',
          question: guide.q,
          options: guide.opts,
          correctAnswer: guide.ans,
          markingScheme: guide.scheme,
        };
      });

      const w1 = weakest[0]?.subjectName || 'Core Mathematics';
      const w2 = weakest[1]?.subjectName || 'Integrated Science';
      const s1 = strongest[0]?.subjectName || 'English Language';

      return res.json({
        readinessLevel,
        predictedAggregateBand: `Aggregate ${String(lowBound).padStart(2, '0')} – ${String(highBound).padStart(2, '0')} (Advisory Range)`,
        executiveSummary: `${studentName || 'Candidate'} currently holds a Best-6 Mock Aggregate of ${agg} (${trendDirection || 'Maintaining'} trend) with ${attendanceRatePercent ?? 92}% attendance and ${continuousAssessmentAvg ?? 68}% continuous assessment average. Strongest mastery is recorded in ${s1}, while ${w1} and ${w2} require structured revision drills to lift overall BECE placement readiness.`,
        guidanceDisclaimer,
        subjectDiagnoses,
        practiceQuestions,
        weeklyStudyPlan: [
          { day: 'Monday', focusSubject: w1, topics: lookupSubjectGuide(w1).topics[0], activity: '40 mins concept review + 5 worked BECE Section B questions', durationMinutes: 60 },
          { day: 'Tuesday', focusSubject: w2, topics: lookupSubjectGuide(w2).topics[0], activity: 'Diagram labelling, definitions & 20 objective questions', durationMinutes: 60 },
          { day: 'Wednesday', focusSubject: s1, topics: 'Timed WAEC Past Paper Maintenance', activity: 'Full Section A timed drill to consolidate Grade 1–2 strength', durationMinutes: 45 },
          { day: 'Thursday', focusSubject: w1, topics: lookupSubjectGuide(w1).topics[1], activity: 'Error-log correction with Mathematics/Subject Clinic teacher', durationMinutes: 60 },
          { day: 'Friday', focusSubject: w2, topics: lookupSubjectGuide(w2).topics[1], activity: 'Structured theory essay/experiment practice with marking scheme', durationMinutes: 60 },
          { day: 'Saturday', focusSubject: 'Combined Core Mock Drill', topics: `${w1}, ${w2} & ${s1}`, activity: '90-minute simulated BECE revision paper under exam conditions', durationMinutes: 90 },
        ],
        recommendedInterventions: [
          {
            interventionType: 'Remedial Classes',
            subjectName: w1,
            rationale: `Targeted small-group clinic to address ${w1} foundational gaps before the next mock series.`,
          },
          {
            interventionType: 'WAEC Past-Question Practice',
            subjectName: w2,
            rationale: `Weekly supervised marking-scheme walkthroughs to improve Section B written precision in ${w2}.`,
          },
          {
            interventionType: 'Structured Revision Timetable',
            subjectName: s1,
            rationale: `Sustain strong performance in ${s1} while reallocating 65% of evening prep hours to weaker core subjects.`,
          },
        ],
      });
    }

    const prompt = `You are a Senior Ghana Education Service (GES) & WAEC Basic Education Certificate Examination (BECE) Academic Advisor for "${schoolName || 'Ghana Basic School'}".
Analyse this JHS candidate's longitudinal BECE mock examination records, continuous assessment average, and attendance rate:

Student: ${studentName}
Class: ${className}
Latest Best-6 Mock Aggregate: ${latestAggregate} (6 is highest distinction, 54 is lowest)
Performance Trend: ${trendDirection}
Attendance Rate: ${attendanceRatePercent}%
Continuous Assessment Average: ${continuousAssessmentAvg}%
Mock History Across Series: ${JSON.stringify(mockHistory)}
Latest Subject Breakdown: ${JSON.stringify(safeSubjects)}

Generate a personalised BECE Readiness, Learning Support & Intervention Report in valid JSON with these exact keys:
- "readinessLevel": one of "High Readiness (Distinction Track)", "On Track (Credit Readiness)", "Developing (Targeted Support Needed)", or "Priority Intervention Required"
- "predictedAggregateBand": string (e.g., "Aggregate 08 – 12 (Advisory Range)")
- "executiveSummary": string (3-4 sentences highlighting strengths, subjects needing attention, and trajectory)
- "guidanceDisclaimer": string (explicitly state that predictions are educational guidance based on mocks, continuous assessment, and attendance, not guaranteed examination outcomes)
- "subjectDiagnoses": array of objects with { "subjectName": string, "latestScore": number, "latestGrade": number, "status": "Strength" | "Moderate" | "Needs Urgent Attention", "areasOfDifficulty": string[], "revisionTopics": string[], "targetedAction": string }
- "practiceQuestions": array of 3-4 targeted BECE practice questions focusing on the student's weakest subjects, each with { "subjectName": string, "topic": string, "questionType": "Section A (Objective)" | "Section B (Structured Theory)", "question": string, "options": string[] (optional, include for Section A), "correctAnswer": string, "markingScheme": string }
- "weeklyStudyPlan": array of 6 days (Monday to Saturday), each with { "day": string, "focusSubject": string, "topics": string, "activity": string, "durationMinutes": number }
- "recommendedInterventions": array of 3 practical school/home interventions, each with { "interventionType": "Remedial Classes" | "Extra Lessons / Clinic" | "Peer Tutoring" | "Teacher Consultation" | "Structured Revision Timetable" | "WAEC Past-Question Practice" | "Regular Progress Assessment", "subjectName": string, "rationale": string }

Return ONLY valid JSON.`;

    const ai = await getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.guidanceDisclaimer) {
      parsed.guidanceDisclaimer = guidanceDisclaimer;
    }
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini bece-mock-support error:', error);
    return res.status(500).json({ error: error.message || 'BECE learning support analysis failed' });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasBuiltDist = fs.existsSync(path.resolve(distPath, 'index.html'));
  const isRunningInDev =
    process.env.npm_lifecycle_event === 'dev' ||
    process.execArgv.some((arg) => arg.includes('tsx')) ||
    (process.env.NODE_OPTIONS || '').includes('tsx');
  const isProd =
    process.env.NODE_ENV === 'production' || (!isRunningInDev && hasBuiltDist);
  const isDev = !isProd;
  const httpServer = http.createServer(app);

  if (isDev) {
    const viteReady = (async () => {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode:
            process.env.DISABLE_HMR === 'true' ? true : { server: httpServer },
        },
        appType: 'spa',
      });
      return vite.middlewares;
    })();

    viteReady.catch((err) => {
      console.error('Failed to initialize Vite middleware:', err);
    });

    app.use(async (req: Request, res: Response, next: NextFunction) => {
      try {
        const middlewares = await viteReady;
        middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
