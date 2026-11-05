import { ResearchArticle } from '../types';

export const KRI_RESEARCH_ARTICLES: ResearchArticle[] = [
  {
    id: 'art-kri-01',
    schoolId: 'sch-kri-01',
    title: 'Decentralized Solar-Photovoltaic Generation & Thermal Load Inversion in Secondary School Laboratories in Southern Ghana',
    subtitle: 'An Empirical Case Study on Energy Resilience, Laboratory Autonomy, and Cost Amortization in East Legon Secondary Campuses',
    abstract: 'Secondary school science and ICT laboratories in the Greater Accra Region face persistent operational disruptions due to grid phase imbalances and peak tariff spikes. This empirical study documents the deployment and telemetry of a 24kW hybrid rooftop photovoltaic-inverter micro-array at Kingdom Royal Institute over a 9-month academic cycle. We analyze diurnal power generation, battery depth-of-discharge under peak physics and chemistry lab loads, and financial amortization under the Electricity Company of Ghana (ECG) institutional tariff structure. Findings reveal an 82.4% reduction in diesel generator reliance, stable voltage regulation for sensitive digital oscilloscopes and spectrophotometers, and an annualized cost-saving of GH₵ 48,200, demonstrating a replicable model for public and private Ghanaian second-cycle institutions.',
    authors: [
      {
        name: 'Dr. Kwame Addo-Preko',
        role: 'Lead Author & HOD Science',
        affiliation: 'Kingdom Royal Institute, Department of Physical Sciences',
        email: 'k.addo@kingdomroyal.edu.gh',
        isCorresponding: true,
      },
      {
        name: 'Kwame Yakubu Mensah',
        role: 'Co-Author & Student Researcher (SHS 2 Science A)',
        affiliation: 'Kingdom Royal Institute Science Club',
        email: 'k.yakubu.mensah@student.kingdomroyal.edu.gh',
      },
      {
        name: 'Mrs. Harriet Agyapong (CA)',
        role: 'Financial Systems Analyst',
        affiliation: 'Kingdom Royal Institute Bursary & Accounts',
        email: 'bursar@kingdomroyal.edu.gh',
      },
    ],
    category: 'STEM & Applied Science',
    keywords: [
      'Solar Photovoltaics',
      'Ghana Secondary Education',
      'Energy Resilience',
      'STEM Laboratories',
      'Load Inversion',
      'Clean Energy in Schools',
    ],
    publicationDate: '2025-10-14',
    volume: 'Kingdom Royal Journal of STEM & Education, Vol. 4, Issue 2 (2025)',
    doi: '10.5281/edudigital.kri.2025.042',
    issn: '2955-182X (Online)',
    status: 'Published Open Access',
    peerReviewNotes: 'Blind peer-reviewed by two independent reviewers from the Ghana Science Association and accepted with minor revisions.',
    viewsCount: 1420,
    downloadsCount: 388,
    citationsCount: 14,
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    isOpenToPublic: true,
    featured: true,
    sections: [
      {
        heading: '1. Introduction & Problem Statement',
        content: `Secondary scientific education in tropical urban centers requires dependable electrical power. In Ghana, frequent phase volatility and intermittent outages disrupt experimental laboratory sessions—specifically electrolytic synthesis, computerized data acquisition, and microbial incubator maintenance. At Kingdom Royal Institute, prior reliance on fossil-fuel diesel backup incurred prohibitive operational costs exceeding GH₵ 5,800 monthly in diesel fuel alone, alongside acoustic and carbon emissions immediately adjacent to classroom blocks. This research investigated the efficacy of transitioning to a decentralized rooftop solar photovoltaic (PV) array coupled with lithium-iron-phosphate (LiFePO4) storage to guarantee 100% lab continuity during daylight instructional hours.`,
      },
      {
        heading: '2. System Architecture & Methodology',
        content: `The micro-grid consists of forty-eight (48) 500W monocrystalline tier-1 PV modules roof-mounted on the Science and ICT Complex with a 15-degree tilt southward to optimize the local solar irradiation window (5.2 kWh/m²/day in Accra). The DC harvest feeds two 12kW split-phase hybrid pure sine-wave inverters connected to a 30kWh lithium-iron-phosphate battery bank. High-precision IoT smart energy meters were installed at the sub-distribution panels of the Chemistry, Physics, Biology, and Advanced Computing laboratories. Data was polled at 60-second intervals recording irradiance (W/m²), AC output voltage, battery state-of-charge (SOC), ambient cell temperature, and aggregate kilowatt-hour consumption across three academic terms.`,
      },
      {
        heading: '3. Empirical Results & Load Inversion Curves',
        content: `During peak sunshine hours (10:30 AM to 2:45 PM), concurrent with scheduled laboratory sessions, the solar array consistently delivered between 18.2 kW and 22.8 kW. This output comfortably exceeded the baseline academic load of 14.6 kW (which accounts for thirty dual-core computing terminals, six fume hoods, analytical balances, and laboratory illumination). Excess generation was automatically routed to charge the battery bank to 100% SOC by 1:15 PM daily. Across the 180 monitored school instructional days, grid outages occurred on 38 occasions; in 100% of these events, the inverter system achieved zero-second transfer, preserving running experiments and delicate digital sensors without reboot or data loss.`,
      },
      {
        heading: '4. Economic Amortization & Carbon Reduction',
        content: `The gross capital expenditure (CAPEX) for the installation totaled GH₵ 185,000. Through the direct elimination of grid daylight consumption and diesel purchases, the school registered net operational savings of GH₵ 4,016 per month. Under current commercial/institutional tariff rates and accounting for 1.5% annual module degradation, the financial payback period is calculated at 3.84 years. In addition, the micro-array prevented an estimated 16.8 metric tons of CO2 equivalent emissions over the 9-month monitoring window, providing a tangible educational baseline for the school's Environmental Science curriculum.`,
      },
      {
        heading: '5. Conclusions & National Recommendations',
        content: `The empirical data validates that institutional rooftop solar micro-grids are not merely ecologically virtuous, but financially self-sustaining investments for Ghanaian secondary institutions. We recommend that the Ministry of Education (MoE) and the Ghana Education Service (GES) formulate a national green campus framework providing subsidized import tariffs for educational solar equipment and enabling net-metering exchange with the national grid. Student involvement in monitoring telemetry offers immense pedagogical value in real-world data science, physics, and environmental stewardship.`,
      },
    ],
    references: [
      'Ackah, I., & Kizys, R. (2020). Renewable energy transitions and institutional electricity security in Sub-Saharan Africa. Energy Policy, 138, 111244.',
      'Appeadu-Mensah, S. (2023). Educational Governance and Capital Assets in Modern Ghanaian Second-Cycle Schools. Accra: Academic Press Ghana.',
      'Energy Commission of Ghana. (2024). National Renewable Energy Master Plan: Educational & Public Sector Implementation Guidelines. Accra: Ministry of Energy.',
      'Ghana Education Service (GES). (2023). Standards for Senior High School Science Laboratories and Equipment Safety Protocols. MoE Curriculum Division.',
      'Quansah, D. A., & Adaramola, M. S. (2021). Performance analysis and degradation assessment of solar photovoltaic modules in tropical coastal climates. Solar Energy, 216, 542–553.',
      'Twidell, J., & Weir, T. (2022). Renewable Energy Resources (4th ed.). Routledge.',
    ],
  },
  {
    id: 'art-kri-02',
    schoolId: 'sch-kri-01',
    title: 'Formative Diagnostic Assessment and Adaptive Learning Frameworks for WASSCE Science Mastery',
    subtitle: 'Evaluating Continuous Feedback Loops in Senior High Integrated and Elective Sciences',
    abstract: 'The West African Senior School Certificate Examination (WASSCE) demands rigorous cognitive application across all Bloom taxonomy tiers. This paper examines an 18-month longitudinal pedagogical trial at Kingdom Royal Institute introducing weekly diagnostic micro-assessments, item-response difficulty indexing, and personalized remediation paths. Comparative analysis against historical cohorts demonstrated a 28.6% increase in A1–B3 distinctions in Integrated Science and Chemistry, with statistically significant reductions in test anxiety among final-year candidate learners.',
    authors: [
      {
        name: 'Mrs. Cynthia Mensah-Bonsu',
        role: 'Lead Author & Headmistress',
        affiliation: 'Kingdom Royal Institute, Academic Board',
        email: 'headmistress@kingdomroyal.edu.gh',
        isCorresponding: true,
      },
      {
        name: 'Mr. Emmanuel Osei-Kofi',
        role: 'Co-Author & Assistant Head (Academic)',
        affiliation: 'Kingdom Royal Institute, Department of Academic Standards',
        email: 'academic.dean@kingdomroyal.edu.gh',
      },
    ],
    category: 'Education & Pedagogy',
    keywords: [
      'WASSCE Preparation',
      'Diagnostic Assessment',
      'Formative Evaluation',
      'Educational Psychology',
      'Ghana High Schools',
      'Pedagogical Innovation',
    ],
    publicationDate: '2025-08-20',
    volume: 'Kingdom Royal Journal of STEM & Education, Vol. 4, Issue 1 (2025)',
    doi: '10.5281/edudigital.kri.2025.018',
    issn: '2955-182X (Online)',
    status: 'Published Open Access',
    peerReviewNotes: 'Reviewed and commended by Senior Curriculum Specialists from the National Council for Curriculum and Assessment (NaCCA).',
    viewsCount: 960,
    downloadsCount: 245,
    citationsCount: 9,
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    isOpenToPublic: true,
    sections: [
      {
        heading: '1. Theoretical Framework & Problem',
        content: `Traditional second-cycle assessment paradigms in West Africa lean predominantly on summative high-stakes term examinations. Consequently, underlying cognitive misconceptions in stoichiometry, Newtonian mechanics, and genetic probability remain undetected until mock examinations months prior to final WASSCE papers. This research instituted an active formative diagnostic model utilizing short, targeted 15-minute diagnostic checks administered every Monday morning, directly informing teacher lesson adaptation for the ensuing week.`,
      },
      {
        heading: '2. Intervention & Item-Difficulty Indexing',
        content: `Across four streams of SHS 2 and SHS 3 classes (n = 184 learners), teachers utilized a digitized question repository categorized by Bloom cognitive levels: Knowledge, Comprehension, Application, and Higher-Order Synthesis. Diagnostic outcomes were immediately mapped into an algorithmic mastery dashboard: students scoring below 65% in foundational sub-strands were assigned targeted collaborative tutorials with form tutors, while advanced learners engaged in extension analytical problem sets.`,
      },
      {
        heading: '3. Quantitative Findings',
        content: `In the 2025 internal mock series, the intervention cohort demonstrated a mean grade improvement of 1.4 grade points on the WASSCE 9-point scale compared to historical non-intervention baselines (p < 0.001). Qualitative learner feedback indicated a 64% reduction in self-reported examination stress, with students citing immediate post-quiz error analysis as the primary driver of conceptual clarity.`,
      },
      {
        heading: '4. Conclusion',
        content: `Shifting instructional culture from terminal judgment to diagnostic progression empowers teachers and demystifies STEM subjects. The model demonstrates that formative digitization enhances teacher responsiveness without creating administrative overburden.`,
      },
    ],
    references: [
      'Black, P., & Wiliam, D. (2018). Classroom assessment and pedagogical feedback. Assessment in Education: Principles, Policy & Practice, 25(6), 551–575.',
      'Ministry of Education Ghana. (2021). National Teachers Standards & Formative Assessment Framework. NaCCA Publications.',
      'WAEC. (2024). Chief Examiners Reports for the May/June WASSCE: Common Candidate Errors in Science and Mathematics. Accra: WAEC Research Division.',
    ],
  },
  {
    id: 'art-kri-03',
    schoolId: 'sch-kri-01',
    title: 'Phytochemical Screening and Antifungal Efficacy of Azadirachta indica and Ocimum gratissimum Extracts against Agricultural Crop Pathogens in Ghana',
    subtitle: 'A Student-Faculty Collaborative Laboratory Investigation into Organic Bio-Pesticides',
    abstract: 'This research paper investigates the bio-pesticidal efficacy of crude ethanolic and aqueous foliar extracts of neem (Azadirachta indica) and African basil (Ocimum gratissimum / Nunum) against common tomato blight pathogens (Alternaria solani) prevalent in southern Ghanaian peri-urban farms. Carried out within the secondary biology and agricultural science laboratory, the experimental trials yielded minimum inhibitory concentrations (MIC) of 12.5 mg/mL, underscoring the potential for low-cost, bio-friendly agricultural inputs while providing high school students with hands-on research rigor.',
    authors: [
      {
        name: 'Dr. Kwame Addo-Preko',
        role: 'Principal Investigator',
        affiliation: 'Department of Science, Kingdom Royal Institute',
        email: 'k.addo@kingdomroyal.edu.gh',
        isCorresponding: true,
      },
      {
        name: 'Miss Faustina Antwi',
        role: 'Information Specialist & Bibliographer',
        affiliation: 'Kingdom Royal Institute Research Library',
        email: 'library@kingdomroyal.edu.gh',
      },
    ],
    category: 'STEM & Applied Science',
    keywords: [
      'Phytochemistry',
      'Botanical Extracts',
      'Sustainable Agriculture',
      'Bio-pesticides',
      'Ghana Secondary STEM',
      'Neem Extract',
    ],
    publicationDate: '2025-05-12',
    volume: 'Kingdom Royal Journal of STEM & Education, Vol. 3, Issue 2 (2025)',
    doi: '10.5281/edudigital.kri.2025.009',
    issn: '2955-182X (Online)',
    status: 'Published Open Access',
    peerReviewNotes: 'Accepted following peer-review at the Inter-School Scientific Inquiry Symposium.',
    viewsCount: 780,
    downloadsCount: 190,
    citationsCount: 6,
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    isOpenToPublic: true,
    sections: [
      {
        heading: '1. Introduction',
        content: `Synthetic chemical fungicides currently utilized by smallholder peri-urban vegetable farmers around the Accra plains pose substantial ecological hazards and consumer toxicity concerns. Bio-pesticides derived from indigenous flora—specifically Azadirachta indica (Neem) and Ocimum gratissimum (locally termed Nunum)—contain bioactive flavonoids, terpenoids, and azadirachtin known to exert fungistatic properties.`,
      },
      {
        heading: '2. Extraction & In Vitro Assays',
        content: `Fresh botanical leaves were collected from the campus botanical garden, shade-dried, pulverized, and subjected to cold maceration with 70% ethanol and distilled water. Radial growth inhibition of Alternaria solani was monitored across Potato Dextrose Agar (PDA) plates across 7 days. Ethanolic neem extract at 25 mg/mL demonstrated 76.4% mycelial growth inhibition compared to synthetic control Mancozeb (88.2%).`,
      },
      {
        heading: '3. Educational Significance',
        content: `Engaging second-cycle students in authentic laboratory extraction, serial dilution, and microbial culturing transforms abstract textbook biology into tangible scientific contribution. The findings confirm that botanical alternatives can be locally synthesized by agricultural clubs for application on campus demonstration farm plots.`,
      },
    ],
    references: [
      'Agyare, C., et al. (2019). Medicinal plants of Ghana: Pharmacological, toxicological, and phytochemical properties. Journal of Ethnopharmacology, 240, 111922.',
      'CSIR-CRI. (2022). Organic Pest and Disease Management in Solanaceous Vegetable Production in Ghana. Kumasi: Crops Research Institute.',
    ],
  },
];

export const PRESEC_RESEARCH_ARTICLES: ResearchArticle[] = [
  {
    id: 'art-pre-01',
    schoolId: 'sch-presec-07',
    title: 'Cognitive Speed, Speed-Buzzer Heuristics, and Mental Arithmetic Calibration in the National Science & Maths Quiz (NSMQ)',
    subtitle: 'An Eight-Year Longitudinal Pedagogical and Cognitive Analysis (2018–2025) of Championship Contestant Preparation',
    abstract: 'The National Science & Maths Quiz (NSMQ) in Ghana represents one of Africa’s most competitive academic arenas. This paper explores the psychometric, problem-decomposition, and speed-decision architectures deployed in training championship teams at Presbyterian Boys’ Secondary School (PRESEC Legon). We present quantitative models for buzzer latency, error penalty minimization in speed rounds, and high-pressure conceptual retrieval in physics and biochemistry.',
    authors: [
      {
        name: 'Mr. Kofi Owusu',
        role: 'Lead Author & NSMQ Lead Trainer',
        affiliation: "Presbyterian Boys' Secondary School (PRESEC Legon)",
        email: 'k.owusu@preseclegon.edu.gh',
        isCorresponding: true,
      },
      {
        name: 'Mr. David Odjidja',
        role: 'Co-Author & Headmaster',
        affiliation: "Presbyterian Boys' Secondary School (PRESEC Legon)",
        email: 'admin@preseclegon.edu.gh',
      },
    ],
    category: 'STEM & Applied Science',
    keywords: [
      'NSMQ',
      'Cognitive Speed',
      'High School Olympiad',
      'Physics Heuristics',
      'Speed Decision-Making',
      'Ghana Education',
    ],
    publicationDate: '2025-09-28',
    volume: 'The Legon Blue Journal of Science & Scholarly Inquiries, Vol. 7 (2025)',
    doi: '10.5281/edudigital.presec.2025.071',
    issn: '2737-9027 (Online)',
    status: 'Published Open Access',
    peerReviewNotes: 'Peer-reviewed and presented at the National STEM Olympiad Coaching Colloquium.',
    viewsCount: 3120,
    downloadsCount: 940,
    citationsCount: 31,
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    isOpenToPublic: true,
    featured: true,
    sections: [
      {
        heading: '1. Introduction: The Competitive Landscape of NSMQ',
        content: `Since its inception in 1993, the National Science & Maths Quiz has evolved from a conventional inter-school quiz into an elite cognitive competition comparable to international Olympiads in Physics, Chemistry, and Mathematics. Success requires mastery of advanced syllabus extensions, rapid heuristic deduction, and split-second buzzer risk calculation under studio television illumination and audience pressure.`,
      },
      {
        heading: '2. The 3-Tier Training Architecture at PRESEC Legon',
        content: `We detail the institutional pipeline implemented at Legon: Tier 1 (Foundational Discovery across SHS 1), Tier 2 (Specialist Domain Drilling in Organic Synthesis, Differential Calculus, and Electromagnetism in SHS 2), and Tier 3 (Speed-Buzzer Simulator Scrimmages and Psychological Stress Inoculation in SHS 3). Real-time telemetry buzzer hardware measures response latency down to 10 milliseconds, allowing trainers to calibrate the exact threshold between calculated risk and premature penalty.`,
      },
      {
        heading: '3. Data & Competitive Metrics',
        content: `Empirical analysis across 8 seasons (2018–2025) demonstrates that in 84.2% of competitive ties or narrow margins, the decisive determinant was not raw factual recall, but the speed of first-derivative problem simplification in the Speed Race and Problem of the Day rounds. Contestants who practiced with randomized time-decay clocks scored 41% higher on multi-step physics mechanics than those trained solely with untimed past papers.`,
      },
      {
        heading: '4. Broader Educational Implications',
        content: `The pedagogical methodologies developed for quiz champions provide valuable insights for general classroom STEM instruction. High-frequency conceptual micro-questions stimulate neuroplasticity, rapid mental visualization, and deep retention across all student ability bands.`,
      },
    ],
    references: [
      'Odjidja, D., & Kwakye, D. (2022). Excellence in Second-Cycle Academic Leadership: The PRESEC Tradition. Accra: Presbyterian Church of Ghana Press.',
      'Owusu, K. (2024). Mental Physics: Advanced Problem-Solving Strategies for Competitive High School Contests. Legon Academic Publishers.',
      'Primetime Limited. (2024). NSMQ Historical Statistics and Performance Compendium (1994–2024). Accra: Primetime Ltd.',
    ],
  },
];

export const MORNING_STAR_RESEARCH_ARTICLES: ResearchArticle[] = [
  {
    id: 'art-mss-01',
    schoolId: 'sch-mss-03',
    title: 'Multimodal Reading Interventions and Phonological Decoding among Basic School Learners in Urban Accra',
    subtitle: 'Empirical Findings from Early Primary Literacy Acceleration Cohorts',
    abstract: 'Early foundational literacy determines long-term academic trajectories in Junior High and beyond. This action-research study evaluated the introduction of dual-sensory phonemic instruction and interactive guided readers among 180 Primary 1 through 3 learners at Morning Star School. Standardized phonological decoding scores improved by 34.2% across three terms, offering empirical benchmarks for basic education curriculum development across West Africa.',
    authors: [
      {
        name: 'Mrs. Nana Yaa Kwakye',
        role: 'Lead Author & Headmistress',
        affiliation: 'Morning Star School, Cantonments',
        email: 'admin@morningstar.edu.gh',
        isCorresponding: true,
      },
      {
        name: 'Miss Grace Quaye',
        role: 'Co-Author & English Head',
        affiliation: 'Morning Star School, Department of Languages',
        email: 'jhs3.teacher@morningstar.edu.gh',
      },
    ],
    category: 'Education & Pedagogy',
    keywords: [
      'Basic Education',
      'Early Literacy',
      'Phonological Decoding',
      'Primary Pedagogy',
      'Accra Schools',
      'Guided Reading',
    ],
    publicationDate: '2025-07-15',
    volume: 'Morning Star Educational Review, Vol. 2, Issue 1 (2025)',
    doi: '10.5281/edudigital.mss.2025.021',
    issn: '2828-4411 (Online)',
    status: 'Published Open Access',
    peerReviewNotes: 'Reviewed and commended by the Greater Accra Basic Schools Academic Association.',
    viewsCount: 1140,
    downloadsCount: 310,
    citationsCount: 12,
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    isOpenToPublic: true,
    featured: true,
    sections: [
      {
        heading: '1. Introduction: The Criticality of Early Literacy',
        content: `Proficiency in reading comprehension by Grade 3 forms the bedrock of all subsequent academic learning. In urban multilingual environments such as Accra, learners navigate English as the medium of instruction alongside rich indigenous Ghanaian home languages (Twi, Ga, Ewe, Fante). This action-research project investigated how structured synthetic phonics coupled with culturally contextualized digital readers accelerates fluency in young learners.`,
      },
      {
        heading: '2. Intervention Design',
        content: `A 30-week reading accelerator program integrated 20 minutes of daily explicit phonics instruction, blending audio-visual phoneme pronunciation with tactile sand-tray writing and home reading logs. 180 learners across Primary 1 to 3 were evaluated using standardized Early Grade Reading Assessment (EGRA) protocols measuring letter-sound identification, non-word decoding, and oral reading fluency (ORF).`,
      },
      {
        heading: '3. Findings & Outcomes',
        content: `Post-test evaluations showed mean oral reading fluency increased from 42 words per minute (WPM) to 78 WPM among Primary 2 learners. Furthermore, reading comprehension accuracy increased from 51% to 84%. Notably, students who initially struggled with letter reversals demonstrated marked improvement through multisensory kinesthetic reinforcement.`,
      },
      {
        heading: '4. Recommendations for Basic Schools',
        content: `Basic schools should invest in systematic decodable readers rooted in relatable Ghanaian narratives before transitioning learners to unstructured text. Continuous professional development for early primary teachers in synthetic phonics yields exponential academic returns across all subject areas.`,
      },
    ],
    references: [
      'Kwakye, N. Y. (2023). Foundational Pedagogy: Cultivating Lifelong Readers in Ghanaian Basic Schools. Accra: Star Academic Publications.',
      'Ministry of Education. (2020). Ghana National Reading Radio and Early Grade Literacy Protocols. Accra: MoE.',
      'Snow, C. E. (2021). Deconstructing the reading rope: Early cognitive pathways in multilingual settings. Reading Research Quarterly, 56(S1), S159–S170.',
    ],
  },
];

export const CITLFA_RESEARCH_ARTICLES: ResearchArticle[] = [
  {
    id: 'art-cit-01',
    schoolId: 'sch-citlfa-04',
    title: 'Benford’s Law Anomaly Detection and Transfer Pricing Risk Scoring in West African Extractive Revenue Audits',
    subtitle: 'Empirical Forensic Accounting Benchmarks Across Cross-Border Related-Party Transactions (2020–2025)',
    abstract:
      'Cross-border profit shifting and invoice mispricing remain central fiscal challenges in resource-rich West African economies. This paper evaluates combined first-two-digit Benford’s Law tests and comparable uncontrolled price (CUP) variance thresholds for flagging high-risk intercompany management service fees prior to statutory tax audit fieldwork.',
    authors: [
      {
        name: 'Dr. Senyo Tetteh-Klu (CFE, CPA)',
        role: 'Chief Examiner & Lead Forensic Lecturer',
        affiliation: 'Chartered Institute of Tax Law & Forensic Accounting',
        email: 's.tetteh@citlfa.edu.gh',
        isCorresponding: true,
      },
      {
        name: 'Prof. Kwesi Yankah-Boateng (FCTI)',
        role: 'Rector & Professor of Fiscal Law',
        affiliation: 'Chartered Institute of Tax Law & Forensic Accounting',
        email: 'rector@citlfa.edu.gh',
      },
    ],
    category: 'Economics & Commerce',
    keywords: ['Forensic Accounting', 'Transfer Pricing', 'Tax Law', 'Benford Law', 'Revenue Audit', 'Ghana'],
    publicationDate: '2025-09-12',
    volume: 'West African Journal of Tax Law & Financial Forensics, Vol. 4, Issue 1 (2025)',
    doi: '10.5281/edudigital.citlfa.2025.041',
    issn: '2891-4402 (Online)',
    status: 'Published Open Access',
    peerReviewNotes: 'Double-blind peer reviewed by the CITLFA Fiscal Policy & Audit Research Board.',
    viewsCount: 1640,
    downloadsCount: 512,
    citationsCount: 19,
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    isOpenToPublic: true,
    featured: true,
    sections: [
      {
        heading: '1. Statutory Context & Problem Statement',
        content:
          'Under Ghana’s Income Tax Act, 2015 (Act 896) and the Transfer Pricing Regulations, 2020 (L.I. 2412), related-party transactions must satisfy the arm’s-length standard. Forensic pre-screening reduces audit cycle times by concentrating field resources on statistically anomalous ledgers.',
      },
      {
        heading: '2. Methodology & Forensic Findings',
        content:
          'Applying second-order digit conformity tests alongside benchmarking interquartile ranges across 140 anonymized corporate filings improved material adjustment detection accuracy by 34.8% compared to random stratified sampling.',
      },
    ],
    references: [
      'Income Tax Act, 2015 (Act 896), Republic of Ghana.',
      'Nigrini, M. J. (2020). Benford’s Law: Applications for Forensic Accounting, Auditing, and Fraud Detection. Wiley.',
    ],
  },
];

export const getInitialResearchArticles = (_schoolId: string): ResearchArticle[] => {
  return [];
};

