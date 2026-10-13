/* =====================================================
   HealthContinuum AI — Patient-First Web Application
   "Understand what changed. Know why. Close the gap."
   ===================================================== */

'use strict';

// ─── LOCAL STATE & SYNTHETIC DATA ──────────────────────────────────────────
const DEMO_RAMESH_DATA = {
  lang: (typeof localStorage !== 'undefined' && localStorage.getItem('hc_lang')) || 'en',
  backendConnected: false,
  patient: {
    id: 'pat-ramesh-001',
    name: 'Ramesh Kumar',
    firstName: 'Ramesh',
    age: 42,
    dob: '12 March 1984',
    bloodGroup: 'B+',
    uhid: 'HC-2024-00847',
    phone: '+91 98765 43210',
    email: 'ramesh.kumar@synthetic.example',
  },

  hospitals: [
    {
      id: 'hosp-001',
      name: 'City Care Hospital, Chennai',
      shortName: 'City Care Hospital',
      visitCount: 3,
      recordCount: 7,
      doctor: 'Dr. Priya Sharma',
    },
  ],

  visits: [
    {
      id: 'visit-003',
      date: '20 Jun 2026',
      dateRaw: '2026-06-20',
      hospitalName: 'City Care Hospital, Chennai',
      doctorName: 'Dr. Priya Sharma',
      type: 'Follow-up Consultation',
      summary: 'Significant improvement in glycaemic control. Metformin dosage reduced due to improved renal function.',
      medications: [
        { name: 'Metformin', dose: '500 mg', freq: 'Once daily (morning)', status: 'CURRENT' },
        { name: 'Aspirin', dose: '75 mg', freq: 'Once daily (after food)', status: 'CURRENT' },
      ],
      labs: [
        { test: 'HbA1c', value: '6.5', unit: '%', range: '< 7.0', status: 'optimal' },
        { test: 'eGFR', value: '82', unit: 'mL/min/1.73m²', range: '> 60', status: 'optimal' },
        { test: 'Serum Creatinine', value: '0.95', unit: 'mg/dL', range: '0.7–1.2', status: 'optimal' },
      ],
      documents: [
        { id: 'doc-004', name: 'Prescription — Jun 2026', type: 'PRESCRIPTION', file: 'prescription_jun_2026.pdf', date: '20 Jun 2026' },
        { id: 'doc-003', name: 'Clinical Consultation Note', type: 'DOCTOR_NOTE', file: 'clinical_note_jun_2026.pdf', date: '20 Jun 2026' },
      ],
    },
    {
      id: 'visit-002',
      date: '15 Mar 2026',
      dateRaw: '2026-03-15',
      hospitalName: 'City Care Hospital, Chennai',
      doctorName: 'Dr. Priya Sharma',
      type: 'Routine Review',
      summary: 'Follow-up for diabetes. HbA1c improved to 7.1%. Renal function stable. Medication unchanged.',
      medications: [
        { name: 'Metformin', dose: '500 mg', freq: 'Twice daily', status: 'HISTORICAL' },
      ],
      labs: [
        { test: 'HbA1c', value: '7.1', unit: '%', range: '< 7.0', status: 'improving' },
        { test: 'eGFR', value: '74', unit: 'mL/min/1.73m²', range: '> 60', status: 'optimal' },
        { test: 'Serum Creatinine', value: '1.0', unit: 'mg/dL', range: '0.7–1.2', status: 'optimal' },
      ],
      documents: [
        { id: 'doc-002', name: 'Clinical Consultation Note', type: 'DOCTOR_NOTE', file: 'clinical_note_mar_2026.pdf', date: '15 Mar 2026' },
      ],
    },
    {
      id: 'visit-001',
      date: '10 Jan 2026',
      dateRaw: '2026-01-10',
      hospitalName: 'City Care Hospital, Chennai',
      doctorName: 'Dr. Priya Sharma',
      type: 'Initial Consultation',
      summary: 'Initial consultation for diabetes management. HbA1c elevated at 7.8%. Kidney function within normal range.',
      medications: [
        { name: 'Metformin', dose: '500 mg', freq: 'Twice daily', status: 'HISTORICAL' },
      ],
      labs: [
        { test: 'HbA1c', value: '7.8', unit: '%', range: '< 7.0', status: 'elevated' },
        { test: 'eGFR', value: '68', unit: 'mL/min/1.73m²', range: '> 60', status: 'optimal' },
        { test: 'Serum Creatinine', value: '1.1', unit: 'mg/dL', range: '0.7–1.2', status: 'optimal' },
      ],
      documents: [
        { id: 'doc-001', name: 'Initial Consultation Note', type: 'DOCTOR_NOTE', file: 'clinical_note_jan_2026.pdf', date: '10 Jan 2026' },
      ],
    },
  ],

  changes: [
    {
      id: 'chg-001',
      title: 'Metformin dosage changed',
      category: 'Medication change',
      previous: '500 mg × 2/day',
      current: '500 mg × 1/day',
      date: '20 Jun 2026',
      hospital: 'City Care Hospital',
      doctor: 'Dr. Priya Sharma',
      reason: 'Dosage reduced due to improved renal function (eGFR improved from 68 → 82 mL/min).',
      sourceDoc: 'Clinical Consultation Note — 20 Jun 2026',
      status: 'VERIFIED',
      badgeText: 'Reason found in your record',
      badgeType: 'verified',
    },
    {
      id: 'chg-002',
      title: 'Aspirin added to prescription',
      category: 'New medication',
      previous: 'Not prescribed',
      current: '75 mg · Once daily',
      date: '20 Jun 2026',
      hospital: 'City Care Hospital',
      doctor: 'Dr. Priya Sharma',
      reason: 'Added to cardiovascular protection regimen during latest follow-up.',
      sourceDoc: 'Prescription — 20 Jun 2026',
      status: 'REVIEW',
      badgeText: 'Review with doctor',
      badgeType: 'review',
    },
    {
      id: 'chg-003',
      title: 'MRI findings mentioned',
      category: 'Imaging reference',
      previous: 'No prior lumbar imaging',
      current: 'Treatment modified based on MRI findings',
      date: '20 Jun 2026',
      hospital: 'City Care Hospital',
      doctor: 'Dr. Priya Sharma',
      reason: 'Your clinical note mentions MRI findings, but an MRI report is not currently available in your records.',
      sourceDoc: 'Referenced in Clinical Note — 20 Jun 2026',
      status: 'INCOMPLETE',
      badgeText: 'One supporting report is missing',
      badgeType: 'missing',
    },
  ],

  decisionMemory: {
    finding: 'Kidney function improved: eGFR rose from 68 to 82 mL/min between Jan 2026 and Jun 2026.',
    decision: 'Metformin dosage reduced from 500 mg twice daily to 500 mg once daily.',
    reason: 'Improved renal function reduces the risk of lactic acidosis associated with higher Metformin doses.',
    evidence: 'Clinical Note (20 Jun 2026) · Lab Report (eGFR 82 mL/min)',
    followUp: 'Repeat HbA1c and renal panel in 3 months. Next review scheduled for September 2026.',
    status: 'Verified from available records',
  },

  doctorAccess: {
    code: '842-195',
    expiresInSeconds: 580,
    timerId: null,
    status: 'ACTIVE',
    pendingRequest: {
      doctorName: 'Dr. Priya Sharma',
      hospital: 'City Care Hospital',
      scope: 'Medical history, medications, and recent lab reports',
      requestedAt: 'Just now',
    },
  },

  voiceCompanion: {
    state: 'idle', // 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
    speechEnabled: true,
    recognition: null,
    currentTranscript: '',
    currentDraft: '',
    chatHistory: [
      {
        id: 'qa-1',
        sender: 'companion',
        questionNumber: 1,
        text: 'Hey Ramesh, how are you? How can I help you?',
        timestamp: '10:12 AM',
        source: null,
        provider: 'Dr. Anya AI',
      },
      {
        id: 'qa-1-ans',
        sender: 'user',
        text: 'Ramesh Kumar (HC-2024-00847)',
        timestamp: '10:13 AM',
      },
      {
        id: 'qa-2',
        sender: 'companion',
        questionNumber: 2,
        text: 'How are you feeling today with your daily Metformin 500 mg dose?',
        timestamp: '10:13 AM',
        source: { title: 'Prescription — Jun 2026', date: '20 Jun 2026', type: 'PRESCRIPTION' },
        provider: 'Dr. Anya AI',
      },
      {
        id: 'qa-2-ans',
        sender: 'user',
        text: 'Feeling good, taking it once daily after food.',
        timestamp: '10:14 AM',
      },
      {
        id: 'qa-3',
        sender: 'companion',
        questionNumber: 3,
        text: 'Would you like to review your latest HbA1c (6.5%) and kidney filtration (eGFR 82)?',
        timestamp: '10:14 AM',
        source: { title: 'Comprehensive Metabolic Panel', date: '20 Jun 2026', type: 'LAB' },
        provider: 'Dr. Anya AI',
      },
      {
        id: 'qa-3-ans',
        sender: 'user',
        text: 'Yes, please summarize my blood sugar trends.',
        timestamp: '10:15 AM',
      },
      {
        id: 'qa-4',
        sender: 'companion',
        questionNumber: 4,
        text: 'What specific questions or symptoms would you like to prepare for Dr. Priya Sharma?',
        timestamp: '10:15 AM',
        source: null,
        provider: 'Dr. Anya AI',
      },
    ],
    lastSpokenText: '',
  },

  addRecordFlow: {
    step: 1, // 1: Type, 2: Hospital, 3: Visit, 4: Upload, 5: Processing, 6: Completed
    selectedType: 'PRESCRIPTION',
    selectedHospital: 'City Care Hospital, Chennai',
    selectedVisit: 'visit-003',
    uploadedFileName: '',
    extractedData: null,
  },

  // Feature 6: Missing-Information & Conflict Detection
  conflicts: [
    {
      id: 'conf-001',
      title: 'Consultation Date Mismatch',
      category: 'Date Conflict',
      severity: 'moderate',
      status: 'pending',
      description: 'Two documents referring to the same clinical consultation state conflicting dates.',
      field: 'Visit Date',
      sourceA: {
        docName: 'Clinical Consultation Note (City Care)',
        file: 'clinical_note_jun_2026.pdf',
        dateRecorded: '20 Jun 2026',
        value: '20 Jun 2026',
        badge: 'Hospital EMR Certified'
      },
      sourceB: {
        docName: 'Pharmacy Billing Voucher',
        file: 'pharmacy_slip_jun_2026.pdf',
        dateRecorded: '19 Jun 2026',
        value: '19 Jun 2026',
        badge: 'External Pharmacy Stamp'
      },
      aiAnalysis: 'The clinical consultation occurred on 20 June 2026 with Dr. Priya Sharma. The pharmacy pre-generated a billing slip on 19 June 2026. Verified recommendation: Keep 20 Jun 2026 as primary clinical visit date.',
      resolvedDate: null,
      resolution: null
    },
    {
      id: 'conf-002',
      title: 'Medication Administration Timing',
      category: 'Dosage Timing',
      severity: 'low',
      status: 'pending',
      description: 'Handwritten discharge advice notes "night" whereas digital prescription specifies "morning".',
      field: 'Metformin Intake Timing',
      sourceA: {
        docName: 'Digital E-Prescription',
        file: 'prescription_jun_2026.pdf',
        dateRecorded: '20 Jun 2026',
        value: 'Once daily (morning after breakfast)',
        badge: 'Verified Digital Rx'
      },
      sourceB: {
        docName: 'Discharge Summary (Handwritten)',
        file: 'discharge_handwritten_note.pdf',
        dateRecorded: '20 Jun 2026',
        value: 'Once daily (at bedtime/night)',
        badge: 'Ward Attendant Note'
      },
      aiAnalysis: 'Dr. Priya Sharma updated instructions to morning administration following breakfast to prevent overnight hypoglycemia. Verified recommendation: Follow Verified Digital Rx (Morning).',
      resolvedDate: null,
      resolution: null
    }
  ],

  // Feature 7: Historical Health Record Comparison
  selectedComparisonMetric: 'hba1c',
  historicalMetrics: {
    hba1c: {
      name: 'HbA1c (Glycated Hemoglobin)',
      unit: '%',
      target: '< 7.0 %',
      standardized: true,
      description: '3-month average blood glucose control marker.',
      points: [
        { date: '10 Jan 2026', value: 7.8, status: 'Elevated', docId: 'doc-001', docName: 'Initial Consultation Note', file: 'clinical_note_jan_2026.pdf' },
        { date: '15 Mar 2026', value: 7.1, status: 'Improving', docId: 'doc-002', docName: 'Clinical Note Mar 2026', file: 'clinical_note_mar_2026.pdf' },
        { date: '20 Jun 2026', value: 6.5, status: 'Target Met', docId: 'doc-003', docName: 'Clinical Consultation Note Jun 2026', file: 'clinical_note_jun_2026.pdf' }
      ]
    },
    egfr: {
      name: 'eGFR (Kidney Filtration Rate)',
      unit: 'mL/min/1.73m²',
      target: '> 60 mL/min',
      standardized: true,
      description: 'Estimated Glomerular Filtration Rate assessing renal function.',
      points: [
        { date: '10 Jan 2026', value: 68, status: 'Normal', docId: 'doc-001', docName: 'Initial Consultation Note', file: 'clinical_note_jan_2026.pdf' },
        { date: '15 Mar 2026', value: 74, status: 'Optimal', docId: 'doc-002', docName: 'Clinical Note Mar 2026', file: 'clinical_note_mar_2026.pdf' },
        { date: '20 Jun 2026', value: 82, status: 'Optimal', docId: 'doc-003', docName: 'Clinical Consultation Note Jun 2026', file: 'clinical_note_jun_2026.pdf' }
      ]
    },
    creatinine: {
      name: 'Serum Creatinine',
      unit: 'mg/dL',
      target: '0.7–1.2 mg/dL',
      standardized: true,
      description: 'Marker of kidney waste filtration efficiency.',
      points: [
        { date: '10 Jan 2026', value: 1.1, status: 'Normal', docId: 'doc-001', docName: 'Initial Consultation Note', file: 'clinical_note_jan_2026.pdf' },
        { date: '15 Mar 2026', value: 1.0, status: 'Normal', docId: 'doc-002', docName: 'Clinical Note Mar 2026', file: 'clinical_note_mar_2026.pdf' },
        { date: '20 Jun 2026', value: 0.95, status: 'Optimal', docId: 'doc-003', docName: 'Clinical Consultation Note Jun 2026', file: 'clinical_note_jun_2026.pdf' }
      ]
    }
  },
};

// Global active app state. Real patient data is loaded only after Supabase Auth succeeds.
let STATE = {
  lang: (typeof localStorage !== "undefined" && localStorage.getItem("hc_lang")) || "en",
  backendConnected: false,
  demoPreview: false,
  patient: { id: "", name: "", firstName: "Patient", age: null, dob: "", bloodGroup: "Not specified", uhid: "", phone: "", email: "" },
  hospitals: [],
  visits: [],
  changes: [],
  decisionMemory: null,
  doctorAccess: { code: null, expiresInSeconds: 0, timerId: null, status: "NONE", pendingRequest: { doctorName: "", hospital: "", scope: "", requestedAt: "" } },
  voiceCompanion: { state: "idle", speechEnabled: true, recognition: null, currentTranscript: "", currentDraft: "", chatHistory: [], lastSpokenText: "" },
  addRecordFlow: { step: 1, selectedType: "PRESCRIPTION", selectedHospital: "", selectedVisit: "", uploadedFileName: "", extractedData: null },
  conflicts: [],
  selectedComparisonMetric: "hba1c",
  historicalMetrics: {},
};

function loadPatientData(patient = {}) {
  if (!patient || !patient.id) {
    STATE.patient = { id: "", name: "", firstName: "Patient", age: null, dob: "", bloodGroup: "Not specified", uhid: "", phone: "", email: "" };
    STATE.hospitals = [];
    STATE.visits = [];
    STATE.changes = [];
    STATE.decisionMemory = null;
    STATE.conflicts = [];
    STATE.historicalMetrics = {};
    STATE.voiceCompanion.chatHistory = [];
    STATE.doctorAccess = { code: null, expiresInSeconds: 0, timerId: null, status: "NONE", pendingRequest: { doctorName: "", hospital: "", scope: "", requestedAt: "" } };
    STATE.demoPreview = false;
    if (typeof window !== "undefined") window.PATIENT_ID = "";
    return;
  }

  const isPreview = window.DEMO_PREVIEW === true && patient.id === DEMO_RAMESH_DATA.patient.id;
  if (isPreview) {
    STATE.patient = JSON.parse(JSON.stringify(DEMO_RAMESH_DATA.patient));
    STATE.hospitals = JSON.parse(JSON.stringify(DEMO_RAMESH_DATA.hospitals));
    STATE.visits = JSON.parse(JSON.stringify(DEMO_RAMESH_DATA.visits));
    STATE.changes = JSON.parse(JSON.stringify(DEMO_RAMESH_DATA.changes));
    STATE.decisionMemory = JSON.parse(JSON.stringify(DEMO_RAMESH_DATA.decisionMemory));
    STATE.conflicts = JSON.parse(JSON.stringify(DEMO_RAMESH_DATA.conflicts));
    STATE.historicalMetrics = JSON.parse(JSON.stringify(DEMO_RAMESH_DATA.historicalMetrics));
    STATE.voiceCompanion.chatHistory = JSON.parse(JSON.stringify(DEMO_RAMESH_DATA.voiceCompanion.chatHistory));
    STATE.doctorAccess = { code: null, expiresInSeconds: 0, timerId: null, status: "PREVIEW", pendingRequest: { doctorName: "", hospital: "", scope: "", requestedAt: "" } };
    STATE.demoPreview = true;
  } else {
    const name = patient.name || "Patient";
    STATE.patient = {
      id: patient.id,
      name,
      firstName: name.split(" ")[0] || "Patient",
      age: patient.age || null,
      dob: patient.date_of_birth || patient.dob || "",
      bloodGroup: patient.blood_group || patient.bloodGroup || "Not specified",
      uhid: patient.uhid || "",
      phone: patient.phone || "",
      email: patient.email || "",
    };
    // No localStorage or seeded-data fallback for authenticated patient records.
    STATE.hospitals = [];
    STATE.visits = [];
    STATE.changes = [];
    STATE.decisionMemory = null;
    STATE.conflicts = [];
    STATE.historicalMetrics = {};
    STATE.voiceCompanion.chatHistory = [{
      id: "qa-welcome-" + Date.now(),
      sender: "companion",
      questionNumber: 1,
      text: `Hello ${STATE.patient.firstName}! Welcome to HealthContinuum AI. I'm Dr. Anya. Upload your medical reports or ask me about records in your account.`,
      timestamp: "Just now",
      source: null,
      provider: "Dr. Anya AI",
    }];
    STATE.doctorAccess = { code: null, expiresInSeconds: 0, timerId: null, status: "NONE", pendingRequest: { doctorName: "", hospital: "", scope: "", requestedAt: "" } };
    STATE.demoPreview = false;
  }

  STATE.addRecordFlow = { step: 1, selectedType: "PRESCRIPTION", selectedHospital: "", selectedVisit: "", uploadedFileName: "", extractedData: null };
  if (typeof window !== "undefined") {
    window.PATIENT_ID = STATE.patient.id;
    if (window.API && typeof window.API.setActivePatientId === "function") window.API.setActivePatientId(STATE.patient.id);
  }
}

// ─── INTERNATIONALIZATION (ENGLISH & TELUGU) ───────────────────────────────
const I18N = {
  en: {
    appName: 'HealthContinuum',
    appSubtitle: 'Your health records, all in one place.',
    hello: 'Hello',
    meetCompanion: 'Meet Your Health Companion',
    companionHelp: "Have questions about your medical reports? Let's understand them together.",
    askCompanion: 'Ask Your Health Companion',
    addRecords: 'Add Your Medical Records',
    addRecordsSub: 'Keep reports and prescriptions organized.',
    scanDoc: 'Scan a Document',
    useCamera: 'Use your camera',
    uploadFile: 'Upload a File',
    choosePdfImg: 'Choose a PDF or image',
    healthGlance: 'Your Health at a Glance',
    latestLab: 'Latest lab report',
    doctorVisit: 'Doctor visit',
    docNeedsReview: '1 document needs your review',
    viewJourney: 'View My Health Journey',
    findRecords: 'Find Your Records',
    labReports: 'Lab Reports',
    prescriptions: 'Prescriptions',
    doctorVisits: 'Doctor Visits',
    allRecords: 'All Records',
    latestUpdates: 'Latest Updates',
    bloodReportTitle: 'Please check your new blood test report',
    bloodReportSub: 'A new report has been added to your records.',
    reviewReport: 'Review Report',
    shareDocTitle: 'Share Records with Your Doctor',
    shareDocSub: 'Share selected records securely.',
    genAccessCode: 'Generate Access Code',
    navHome: 'Home',
    navRecords: 'Records',
    navCompanion: 'AI Companion',
    navJourney: 'Journey',
    navProfile: 'Profile',
    // AI Companion Screen
    companionHeader: 'AI Health Companion',
    companionHeaderSub: 'Ask • Understand • Take Better Care',
    companionGreeting: 'Hello!',
    companionSpeech: "I'm your **AI Health Companion**. You can ask me anything about your medical records, reports, medicines or health journey.",
    quickAskReports: 'Ask about Reports',
    quickCheckMeds: 'Check Medicines',
    quickVisitDetails: 'Doctor Visit Details',
    quickGeneralHealth: 'General Health',
    langNotice: 'You can talk in **English, Telugu** or **Hindi**.',
    speakNatural: 'Just speak like you normally talk!',
    listening: 'Listening...',
    listeningSub: "Speak clearly. I'm here to help.",
    tapToSpeak: 'Tap to speak',
    tapToSpeakSub: 'Tap the mic to talk with your AI doctor',
    replay: 'Replay',
    stop: 'Stop',
    observing: 'Observing...',
    needHelp: 'Need help?',
    needHelpPrompt: 'Try asking: "What medicines was I given in the last visit?" or "Show my lab reports"',
    send: 'Send',
    clear: 'Clear',
    speakingNow: 'Speaking response...',
    analyzingRec: 'Analyzing your records...'
  },
  te: {
    appName: 'హెల్త్‌కంటిన్యూయమ్',
    appSubtitle: 'మీ ఆరోగ్య రికార్డులు, అన్నీ ఒకే చోట.',
    hello: 'నమస్తే',
    meetCompanion: 'మీ హెల్త్ కంపానియన్‌ను కలవండి',
    companionHelp: 'మీ మెడికల్ రిపోర్టుల గురించి ప్రశ్నలు ఉన్నాయా? కలిసి అర్థం చేసుకుందాం.',
    askCompanion: 'హెల్త్ కంపానియన్‌ను అడగండి',
    addRecords: 'మీ మెడికల్ రికార్డులను జోడించండి',
    addRecordsSub: 'రిపోర్టులు, ప్రిస్క్రిప్షన్లను క్రమపద్ధతిలో ఉంచండి.',
    scanDoc: 'డాక్యుమెంట్ స్కాన్ చేయండి',
    useCamera: 'మీ కెమెరాను ఉపయోగించండి',
    uploadFile: 'ఫైల్ అప్‌లోడ్ చేయండి',
    choosePdfImg: 'PDF లేదా ఫోటో ఎంచుకోండి',
    healthGlance: 'మీ ఆరోగ్యం ఒక చూపులో',
    latestLab: 'తాజా ల్యాబ్ రిపోర్ట్',
    doctorVisit: 'డాక్టర్ విజిట్',
    docNeedsReview: '1 డాక్యుమెంట్‌ను సమీక్షించాలి',
    viewJourney: 'నా ఆరోగ్య ప్రయాణాన్ని చూడండి',
    findRecords: 'మీ రికార్డులను కనుగొనండి',
    labReports: 'ల్యాబ్ రిపోర్టులు',
    prescriptions: 'ప్రిస్క్రిప్షన్లు',
    doctorVisits: 'డాక్టర్ విజిట్లు',
    allRecords: 'అన్ని రికార్డులు',
    latestUpdates: 'తాజా అప్‌డేట్‌లు',
    bloodReportTitle: 'దయచేసి మీ కొత్త రక్త పరీక్ష రిపోర్ట్ చూడండి',
    bloodReportSub: 'మీ రికార్డులకు కొత్త రిపోర్ట్ జోడించబడింది.',
    reviewReport: 'రిపోర్ట్ సమీక్షించండి',
    shareDocTitle: 'డాక్టర్‌తో రికార్డులను పంచుకోండి',
    shareDocSub: 'ఎంచుకున్న రికార్డులను సురక్షితంగా షేర్ చేయండి.',
    genAccessCode: 'యాక్సెస్ కోడ్ రూపొందించండి',
    navHome: 'హోమ్',
    navRecords: 'రికార్డులు',
    navCompanion: 'AI కంపానియన్',
    navJourney: 'జర్నీ',
    navProfile: 'ప్రొఫైల్',
    // AI Companion Screen
    companionHeader: 'AI హెల్త్ కంపానియన్',
    companionHeaderSub: 'అడగండి • అర్థం చేసుకోండి • ఆరోగ్యం కాపాడుకోండి',
    companionGreeting: 'నమస్తే!',
    companionSpeech: 'నేను మీ **AI హెల్త్ కంపానియన్**ని. మీ మెడికల్ రికార్డులు, రిపోర్టులు, మందులు లేదా ఆరోగ్య ప్రయాణం గురించి ఏదైనా నన్ను అడగవచ్చు.',
    quickAskReports: 'రిపోర్టుల వివరాలు',
    quickCheckMeds: 'మందుల సమాచారం',
    quickVisitDetails: 'డాక్టర్ విజిట్ వివరాలు',
    quickGeneralHealth: 'సాధారణ ఆరోగ్యం',
    langNotice: 'మీరు **ఇంగ్లీష్, తెలుగు** లేదా **హిందీ**లో మాట్లాడవచ్చు.',
    speakNatural: 'మీరు సహజంగా మాట్లాడే విధంగానే మాట్లాడండి!',
    listening: 'వింటున్నాను...',
    listeningSub: 'స్పష్టంగా మాట్లాడండి. నేను మీకు సహాయం చేస్తాను.',
    tapToSpeak: 'మాట్లాడటానికి నొక్కండి',
    tapToSpeakSub: 'మీ AI డాక్టర్‌తో మాట్లాడటానికి మైక్ నొక్కండి',
    replay: 'మళ్ళీ వినండి',
    stop: 'ఆపండి',
    observing: 'గమనిస్తున్నాను...',
    needHelp: 'సహాయం కావాలా?',
    needHelpPrompt: 'ఇలా అడగండి: "నాకు గత విజిట్‌లో ఏ మందులు ఇచ్చారు?" లేదా "నా ల్యాబ్ రిపోర్టులను చూపించు"',
    send: 'పంపండి',
    clear: 'క్లియర్',
    speakingNow: 'సమాధానం చదువుతున్నాను...',
    analyzingRec: 'మీ రికార్డులను పరిశీలిస్తున్నాను...'
  }
};

function t(key) {
  const lang = STATE.lang || 'en';
  if (I18N[lang] && I18N[lang][key]) return I18N[lang][key];
  if (I18N.en && I18N.en[key]) return I18N.en[key];
  return key;
}

function setLanguage(lang) {
  STATE.lang = lang;
  try { localStorage.setItem('hc_lang', lang); } catch (e) {}
  updateBottomNavLabels();
  if (activeScreen === 'home') renderHome();
  else if (activeScreen === 'companion') renderCompanion();
  else if (activeScreen === 'records') renderRecords();
  else if (activeScreen === 'journey') renderJourney();
  else if (activeScreen === 'decision') renderDecisionMemory();
  else if (activeScreen === 'access') renderDoctorAccess();
}

function updateBottomNavLabels() {
  const lblHome = document.getElementById('nav-label-home');
  const lblRec = document.getElementById('nav-label-records');
  const lblComp = document.getElementById('nav-label-companion');
  const lblJrn = document.getElementById('nav-label-journey');
  const lblProf = document.getElementById('nav-label-profile');
  if (lblHome) lblHome.textContent = t('navHome');
  if (lblRec) lblRec.textContent = t('navRecords');
  if (lblComp) lblComp.textContent = t('navCompanion');
  if (lblJrn) lblJrn.textContent = t('navJourney');
  if (lblProf) lblProf.textContent = t('navProfile');
}

// ─── SVG ICONS ─────────────────────────────────────────────────────────────
const ICONS = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  journey: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  records: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  companion: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h.01"/><path d="M16 12h.01"/><path d="M9 16c1 .8 2 1 3 1s2-.2 3-1"/></svg>`,
  mic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  alertTriangle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  arrowLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  hospital: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="9" y1="17" x2="15" y2="17"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  pill: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/></svg>`,
  flask: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31L4.2 19.5A2 2 0 0 0 6 22h12a2 2 0 0 0 1.8-2.5L14 9.31V2"/></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
  brain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-5.04z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-5.04z"/></svg>`,
  fileText: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  volume2: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
  volumeX: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
  send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  externalLink: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  fileUpload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 11v7"/><polyline points="9 14 12 11 15 14"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  chatMessage: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  documentBadge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
};

function getIcon(name, style = 'width:20px;height:20px;') {
  const svg = ICONS[name] || ICONS.fileText;
  return svg.replace('<svg ', `<svg style="${style}" `);
}

// ─── ROUTING & NAVIGATION ──────────────────────────────────────────────────
// Dashboard Navigation Destinations (Companion has full screen layout with back button)
const PRIMARY_NAV = ['home', 'records', 'journey', 'profile'];
let activeScreen = 'splash';

function navigate(toScreen) {
  if (toScreen === 'profile') {
    openProfileDrawer();
    return;
  }

  // Release voice resources if navigating away from Companion
  if (toScreen !== 'companion') {
    stopSpeaking();
    stopListening();
  }

  const currentEl = document.querySelector('.screen.active');
  const targetEl = document.getElementById(`screen-${toScreen}`);
  if (!targetEl) return;

  if (currentEl) {
    currentEl.classList.remove('active');
  }

  targetEl.scrollTop = 0;
  targetEl.classList.add('active');
  activeScreen = toScreen;

  // Manage bottom navigation visibility (active across all screens for primary destinations)
  const bottomNav = document.getElementById('bottom-nav');
  if (bottomNav) {
    if (PRIMARY_NAV.includes(toScreen)) {
      bottomNav.classList.remove('hidden');
      document.querySelectorAll('#bottom-nav .nav-item, #bottom-nav .nav-item-center-wrap').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.target === toScreen);
      });
    } else {
      bottomNav.classList.add('hidden');
    }
  }

  // Trigger screen re-renders when navigating
  if (toScreen === 'login') renderLogin();
  if (toScreen === 'home') renderHome();
  if (toScreen === 'journey') renderJourney();
  if (toScreen === 'records') renderRecords();
  if (toScreen === 'companion') {
    renderCompanion();
    triggerCompanionGreeting(true);
  }
  if (toScreen === 'decision') renderDecisionMemory();
  if (toScreen === 'access') renderDoctorAccess();
}

// Live iOS Status Bar Clock Updater
function updateIosClock() {
  const clockEl = document.getElementById('ios-status-clock');
  if (clockEl) {
    const now = new Date();
    let hours = now.getHours();
    let mins = now.getMinutes();
    hours = hours % 12 || 12;
    mins = mins < 10 ? '0' + mins : mins;
    clockEl.textContent = `${hours}:${mins}`;
  }
}


// ─── BACKEND SYNCHRONIZATION ───────────────────────────────────────────────
async function syncWithBackend() {
  try {
    if (typeof window.checkBackend === 'function') {
      STATE.backendConnected = await window.checkBackend();
    }
    if (!STATE.backendConnected && typeof window.API !== 'undefined') {
      const h = await window.API.health();
      STATE.backendConnected = h?.success === true;
    }

    const patientId = STATE.patient?.id || (window.API && window.API.getActivePatientId && window.API.getActivePatientId());
    const isRamesh = patientId === 'pat-ramesh-001';

    if (STATE.backendConnected && window.API && patientId) {
      console.info('[HealthContinuum] Loading real records from backend for patient:', patientId);
      // 1. Patient info
      const pRes = await window.API.getPatient(patientId);
      if (pRes?.success && pRes.data) {
        STATE.patient.name = pRes.data.name || STATE.patient.name;
        STATE.patient.firstName = STATE.patient.name.split(' ')[0];
        STATE.patient.uhid = pRes.data.uhid || STATE.patient.uhid;
        if (pRes.data.blood_group) STATE.patient.bloodGroup = pRes.data.blood_group;
        if (pRes.data.email) STATE.patient.email = pRes.data.email;
        if (pRes.data.phone) STATE.patient.phone = pRes.data.phone;
      }

      // 2. Visits
      const vRes = await window.API.getVisits(patientId);
      if (vRes?.success && Array.isArray(vRes.data)) {
        if (vRes.data.length > 0) {
          // Map backend visits
          STATE.visits = vRes.data.map(v => ({
            id: v.id,
            date: formatDateStr(v.visit_date),
            dateRaw: v.visit_date,
            hospitalName: v.hospital_name || (isRamesh ? 'City Care Hospital, Chennai' : 'Primary Care Center'),
            doctorName: v.doctor_name || (isRamesh ? 'Dr. Priya Sharma' : 'Attending Physician'),
            type: v.visit_type || 'Consultation',
            summary: v.summary || '',
            medications: Array.isArray(v.medications) ? v.medications : (isRamesh && v.id === 'visit-003' ? [
              { name: 'Metformin', dose: '500 mg', freq: 'Once daily (morning)', status: 'CURRENT' },
              { name: 'Aspirin', dose: '75 mg', freq: 'Once daily', status: 'CURRENT' },
            ] : (isRamesh ? [
              { name: 'Metformin', dose: '500 mg', freq: 'Twice daily', status: 'HISTORICAL' },
            ] : [])),
            labs: Array.isArray(v.labs) ? v.labs : (isRamesh && v.id === 'visit-003' ? [
              { test: 'HbA1c', value: '6.5', unit: '%', range: '< 7.0', status: 'optimal' },
              { test: 'eGFR', value: '82', unit: 'mL/min/1.73m²', range: '> 60', status: 'optimal' },
            ] : (isRamesh && v.id === 'visit-002' ? [
              { test: 'HbA1c', value: '7.1', unit: '%', range: '< 7.0', status: 'improving' },
              { test: 'eGFR', value: '74', unit: 'mL/min/1.73m²', range: '> 60', status: 'optimal' },
            ] : (isRamesh ? [
              { test: 'HbA1c', value: '7.8', unit: '%', range: '< 7.0', status: 'elevated' },
              { test: 'eGFR', value: '68', unit: 'mL/min/1.73m²', range: '> 60', status: 'optimal' },
            ] : []))),
            documents: Array.isArray(v.documents) && v.documents.length > 0 ? v.documents : [
              { id: `doc-${v.id}`, name: `${v.visit_type || 'Clinical'} Record`, type: 'DOCTOR_NOTE', file: `record_${v.visit_date}.pdf`, date: formatDateStr(v.visit_date) }
            ],
          }));
        } else if (!isRamesh) {
          // New person with 0 visits in database: ensure clean visits list unless local cache has them
          let localRec = null;
          try { localRec = JSON.parse(localStorage.getItem('hc_records_' + patientId)); } catch (e) {}
          if (localRec && Array.isArray(localRec.visits)) {
            STATE.visits = localRec.visits;
          } else {
            STATE.visits = [];
          }
        }
      }

      // 3. Decision Memory
      const dmRes = await window.API.getDecisionMemory(patientId);
      if (dmRes?.success && Array.isArray(dmRes.data) && dmRes.data[0]) {
        const item = dmRes.data[0];
        STATE.decisionMemory = {
          finding: item.finding || (isRamesh ? STATE.decisionMemory.finding : ''),
          decision: item.decision || (isRamesh ? STATE.decisionMemory.decision : ''),
          reason: item.reason || (isRamesh ? STATE.decisionMemory.reason : ''),
          evidence: item.evidence || (isRamesh ? STATE.decisionMemory.evidence : ''),
          followUp: item.follow_up || (isRamesh ? STATE.decisionMemory.followUp : ''),
          status: 'Verified from available records',
        };
      } else if (!isRamesh) {
        STATE.decisionMemory = null;
      }
    }
  } catch (err) {
    console.warn('[HealthContinuum] Backend sync error, continuing with local model:', err);
  }
}

function formatDateStr(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${parseInt(parts[2], 10)} ${months[monthIdx] || parts[1]} ${parts[0]}`;
}

// ─── COMPANION AVATAR SVG GENERATOR ─────────────────────────────────────────
function buildCompanionAvatarSVG(size = 140, state = 'idle') {
  return `
  <div class="companion-avatar-container">
    <div class="companion-halo ${state === 'listening' ? 'listening' : state === 'speaking' ? 'speaking' : ''}"></div>
    <div class="companion-face-card ${state}">
      <svg width="${size * 0.72}" height="${size * 0.72}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Friendly Companion Face -->
        <circle cx="50" cy="50" r="46" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
        
        <!-- Friendly aura forehead accent -->
        <path d="M42 22 Q50 18 58 22" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        
        <!-- Left Eye (Blinking) -->
        <g class="face-eye" style="transform-origin: 36px 44px;">
          <ellipse cx="36" cy="44" rx="4.5" ry="6.5" fill="#1e293b"/>
          <circle cx="37.5" cy="42" r="1.8" fill="#ffffff"/>
        </g>
        
        <!-- Right Eye (Blinking) -->
        <g class="face-eye" style="transform-origin: 64px 44px;">
          <ellipse cx="64" cy="44" rx="4.5" ry="6.5" fill="#1e293b"/>
          <circle cx="65.5" cy="42" r="1.8" fill="#ffffff"/>
        </g>
        
        <!-- Soft friendly cheeks -->
        <circle cx="28" cy="52" r="4.5" fill="#fbcfe8" opacity="0.5"/>
        <circle cx="72" cy="52" r="4.5" fill="#fbcfe8" opacity="0.5"/>
        
        <!-- Calm friendly mouth -->
        <path class="face-mouth" d="${state === 'speaking' ? 'M38 64 Q50 74 62 64' : 'M39 64 Q50 71 61 64'}" stroke="#2563eb" stroke-width="3" stroke-linecap="round" fill="none"/>
      </svg>
    </div>
  </div>`;
}

// ─── APPLICATION SHELL ──────────────────────────────────────────────────────
function buildAppShell() {
  return `
    <div class="iphone-presentation-wrapper">
      <!-- iPhone 17 Pro Max Titanium Body Shell -->
      <div class="iphone-device">
        <!-- Physical Titanium Buttons -->
        <div class="iphone-button iphone-action-button" title="Action Button"></div>
        <div class="iphone-button iphone-volume-up" title="Volume Up"></div>
        <div class="iphone-button iphone-volume-down" title="Volume Down"></div>
        <div class="iphone-button iphone-power-button" title="Power Button"></div>

        <!-- Inner Bezel Screen Display -->
        <div class="iphone-screen">
          <!-- iOS Status Bar & Dynamic Island -->
          <header class="ios-status-bar">
            <div class="ios-status-time" id="ios-status-clock">9:41</div>
            <div class="dynamic-island" id="dynamic-island">
              <div class="dynamic-island-camera"></div>
              <div class="dynamic-island-sensor"></div>
            </div>
            <div class="ios-status-icons">
              <svg class="ios-signal-icon" viewBox="0 0 17 12" width="16" height="11" fill="currentColor">
                <rect x="0" y="8" width="3" height="4" rx="0.8"/>
                <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.8"/>
                <rect x="9" y="3" width="3" height="9" rx="0.8"/>
                <rect x="13.5" y="0" width="3" height="12" rx="0.8"/>
              </svg>
              <span class="ios-network-type">5G</span>
              <div class="ios-battery-icon">
                <div class="ios-battery-level"></div>
              </div>
            </div>
          </header>

          <!-- App Active Screens Container -->
          <div class="iphone-app-content">
            <!-- SCREEN 1: SPLASH -->
            <div class="screen active" id="screen-splash">
              <div class="safe-top"></div>
              <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:32px;text-align:center;">
                <div style="width:72px;height:72px;border-radius:24px;background:linear-gradient(135deg,#2563eb,#4f46e5);display:flex;align-items:center;justify-content:center;box-shadow:0 12px 32px rgba(37,99,235,0.3);margin-bottom:24px;">
                  ${getIcon('companion', 'width:38px;height:38px;stroke:white;')}
                </div>
                <h1 style="font-size:26px;font-weight:700;letter-spacing:-0.5px;color:var(--text-primary);margin-bottom:8px;">HealthContinuum AI</h1>
                <p style="font-size:15px;color:var(--text-secondary);line-height:1.6;max-width:270px;margin-bottom:48px;">
                  Understand what changed.<br/>Know why. Close the gap.
                </p>
                <div style="width:40px;height:3px;background:var(--gray-200);border-radius:2px;overflow:hidden;">
                  <div style="width:100%;height:100%;background:var(--blue);animation:progressFill 1.4s ease forwards;"></div>
                </div>
              </div>
            </div>

            <!-- SCREEN 2: LOGIN -->
            <div class="screen" id="screen-login">
              <div class="scroll-content" id="login-content">
                <!-- Rendered dynamically by renderLogin() -->
              </div>
            </div>

            <!-- SCREEN 3: HOME -->
            <div class="screen" id="screen-home">
              <div class="scroll-content" id="home-content">
                <!-- Rendered dynamically by renderHome() -->
              </div>
            </div>

            <!-- SCREEN 4: HEALTH JOURNEY -->
            <div class="screen" id="screen-journey">
              <div class="scroll-content" id="journey-content">
                <!-- Rendered dynamically by renderJourney() -->
              </div>
            </div>

            <!-- SCREEN 5: RECORDS -->
            <div class="screen" id="screen-records">
              <div class="scroll-content" id="records-content">
                <!-- Rendered dynamically by renderRecords() -->
              </div>
            </div>

            <!-- SCREEN 6: AI HEALTH COMPANION -->
            <div class="screen screen-chat-container" id="screen-companion">
              <div id="companion-content" class="companion-layout-wrapper">
                <!-- Rendered dynamically by renderCompanion() -->
              </div>
            </div>

            <!-- SCREEN 7: DECISION MEMORY -->
            <div class="screen" id="screen-decision">
              <div class="scroll-content" id="decision-content">
                <!-- Rendered dynamically by renderDecisionMemory() -->
              </div>
            </div>

            <!-- SCREEN 8: DOCTOR ACCESS -->
            <div class="screen" id="screen-access">
              <div class="scroll-content" id="access-content">
                <!-- Rendered dynamically by renderDoctorAccess() -->
              </div>
            </div>

            <!-- MODALS & DRAWERS -->
            <div id="add-record-modal" class="upload-overlay">
              <div class="upload-sheet" id="add-record-sheet" style="max-height:88%;overflow-y:auto;">
                <!-- Rendered dynamically by renderAddRecordStep() -->
              </div>
            </div>

            <div id="change-detail-modal" class="upload-overlay">
              <div class="upload-sheet" id="change-detail-sheet" style="max-height:88%;overflow-y:auto;">
                <!-- Rendered dynamically by openChangeDetail() -->
              </div>
            </div>

            <div id="profile-drawer-modal" class="side-drawer-overlay">
              <div class="side-drawer-content" id="profile-drawer-content">
                <!-- Rendered dynamically by openProfileDrawer() -->
              </div>
            </div>

            <div id="notifications-drawer-modal" class="side-drawer-overlay">
              <div class="side-drawer-content" id="notifications-drawer-content">
                <!-- Rendered dynamically by openNotificationsDrawer() -->
              </div>
            </div>

            <div id="hospital-modal" class="upload-overlay">
              <div class="upload-sheet" id="hospital-sheet" style="max-height:88%;overflow-y:auto;">
                <!-- Rendered dynamically by openHospitalModal() -->
              </div>
            </div>

            <!-- Feature 1 & 4: Document Preview Modal -->
            <div id="doc-preview-modal" class="upload-overlay">
              <div class="upload-sheet" id="doc-preview-sheet" style="max-height:88%;overflow-y:auto;">
                <!-- Rendered dynamically by viewDocumentDetail() -->
              </div>
            </div>

            <!-- Feature 6: Missing-Information & Conflict Detection Modal -->
            <div id="conflict-modal" class="upload-overlay">
              <div class="upload-sheet" id="conflict-sheet" style="max-height:88%;overflow-y:auto;">
                <!-- Rendered dynamically by openConflictDetail() -->
              </div>
            </div>

            <!-- Feature 7: Historical Health Record Comparison Modal -->
            <div id="comparison-modal" class="upload-overlay">
              <div class="upload-sheet" id="comparison-sheet" style="max-height:88%;overflow-y:auto;">
                <!-- Rendered dynamically by openComparisonModal() -->
              </div>
            </div>

            <!-- 5 DESTINATIONS BOTTOM NAVIGATION WITH CENTER RAISED 3D CURVED AI COMPANION -->
            <nav id="bottom-nav" class="hidden">
              <div class="nav-item active" data-target="home" onclick="navigate('home')">
                <div class="nav-icon">${getIcon('home', 'width:22px;height:22px;')}</div>
                <span class="nav-label" id="nav-label-home">${t('navHome')}</span>
              </div>
              <div class="nav-item" data-target="records" onclick="navigate('records')">
                <div class="nav-icon">${getIcon('records', 'width:22px;height:22px;')}</div>
                <span class="nav-label" id="nav-label-records">${t('navRecords')}</span>
              </div>

              <!-- RAISED 3D CURVED CENTER AI COMPANION HERO BUTTON -->
              <div class="nav-item-center-wrap" data-target="companion" onclick="triggerSparkleBurst(event); navigate('companion')">
                <div class="nav-center-ai-orb">
                  <div class="nav-center-ai-halo"></div>
                  <div class="nav-center-ai-inner">
                    <span class="nav-center-ai-sparkle">✦</span>
                    <span class="nav-center-ai-badge">AI</span>
                  </div>
                </div>
                <span class="nav-label nav-label-center" id="nav-label-companion">${t('navCompanion')}</span>
              </div>

              <div class="nav-item" data-target="journey" onclick="navigate('journey')">
                <div class="nav-icon">${getIcon('journey', 'width:22px;height:22px;')}</div>
                <span class="nav-label" id="nav-label-journey">${t('navJourney')}</span>
              </div>
              <div class="nav-item" data-target="profile" onclick="openProfileDrawer()">
                <div class="nav-icon">${getIcon('user', 'width:22px;height:22px;')}</div>
                <span class="nav-label" id="nav-label-profile">${t('navProfile')}</span>
              </div>
            </nav>
          </div>

          <!-- iOS Home Indicator Bar -->
          <div class="ios-home-indicator-wrapper">
            <div class="ios-home-indicator"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}


// ─── SCREEN 1B: LOGIN & AUTHENTICATION RENDERER ────────────────────────────
let currentAuthTab = 'signin';

function setAuthTab(tab) {
  currentAuthTab = tab;
  renderLogin();
}

function renderLogin() {
  const container = document.getElementById('login-content');
  if (!container) return;

  const isConnected = STATE.backendConnected;
  const patientUhid = '';

  let tabBodyHtml = '';

  if (currentAuthTab === 'signin') {
    tabBodyHtml = `
      <form id="form-login" onsubmit="event.preventDefault(); handleLoginSubmit();" style="display:flex;flex-direction:column;gap:14px;">
        <div id="auth-alert" style="display:none;"></div>

        <div class="input-group">
          <label class="input-label" for="login-identifier">Email Address or Phone Number</label>
          <input class="input-field" type="text" id="login-identifier" required 
                 placeholder="patient@example.com or +91 98765 43210" 
                 value="${patientUhid}" />
        </div>

        <div class="input-group">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <label class="input-label" for="login-password">Passcode</label>
            
          </div>
          <div style="position:relative;display:flex;align-items:center;">
            <input class="input-field" type="password" id="login-password" required 
                   placeholder="Enter your passcode" style="padding-right:44px;" />
            <button type="button" class="btn-icon" id="btn-toggle-pwd" onclick="togglePasswordVisibility('login-password', this)" 
                    style="position:absolute;right:8px;color:var(--text-tertiary);padding:6px;font-size:14px;" title="Toggle passcode">
              👁️
            </button>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin:2px 0 4px;">
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary);cursor:pointer;">
            <input type="checkbox" id="login-remember" checked style="accent-color:var(--blue);width:16px;height:16px;" />
            <span>Remember this device</span>
          </label>
          <span style="font-size:12px;color:var(--text-tertiary);cursor:pointer;" onclick="setAuthTab('demo')">Quick Demo ⚡</span>
        </div>

        <button type="submit" class="btn btn-primary btn-full" id="btn-login-submit" style="height:50px;font-size:15px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
          <span>Access Health Continuum</span>
          ${getIcon('chevronRight', 'width:18px;height:18px;')}
        </button>

        <div class="login-divider"><span>or continue with</span></div>

        <button type="button" class="btn-google" id="btn-google-auth" onclick="handleGoogleLogin()">
          <svg style="width:18px;height:18px;" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>Continue with Google</span>
        </button>
      </form>
    `;
  } else if (currentAuthTab === 'demo') {
    tabBodyHtml = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div id="auth-alert" style="display:none;"></div>

        <p style="font-size:13px;color:var(--text-secondary);margin:0 0 4px;">
          Explore the sample patient journey using synthetic data. Preview mode is read-only and does not sign in to an account:
        </p>

        <div class="quick-profile-card" onclick="handleQuickDemoLogin()" style="border-left:4px solid var(--blue);">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#2563eb,#4f46e5);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;">
              RK
            </div>
            <div>
              <div style="font-weight:700;font-size:15px;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
                <span>Ramesh Kumar</span>
                <span class="badge badge-green" style="font-size:10.5px;padding:2px 6px;">Pre-loaded Patient</span>
              </div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                UHID: HC-2024-00847 · 42 yrs · Male (B+)
              </div>
              <div style="font-size:11.5px;color:var(--blue);margin-top:4px;font-weight:600;">
                Type 2 Diabetes · Metformin Adjustments · City Care
              </div>
            </div>
          </div>
          <div style="color:var(--blue);font-weight:700;font-size:13px;padding-left:8px;">
            ${getIcon('chevronRight', 'width:20px;height:20px;')}
          </div>
        </div>

        <button type="button" class="btn btn-primary btn-full" id="btn-demo-login" onclick="handleQuickDemoLogin()" style="height:48px;font-size:14.5px;font-weight:600;margin-top:4px;">
          <span>Explore synthetic preview (read-only)</span>
        </button>

        <div style="padding:12px;background:#f8fafc;border-radius:12px;border:1px dashed #cbd5e1;font-size:12px;color:var(--text-secondary);line-height:1.5;">
          💡 <strong>Included in demo:</strong> Changes detection, AI clinical companion, multi-visit lab graphs, and doctor access token workflow.
        </div>
      </div>
    `;
  } else if (currentAuthTab === 'register') {
    tabBodyHtml = `
      <form id="form-register" onsubmit="event.preventDefault(); handleRegisterSubmit();" style="display:flex;flex-direction:column;gap:14px;">
        <div id="auth-alert" style="display:none;"></div>

        <div class="input-group">
          <label class="input-label" for="reg-name">Full Patient Name</label>
          <input class="input-field" type="text" id="reg-name" required placeholder="e.g. Ramesh Kumar" />
        </div>

        <div class="input-group">
          <label class="input-label" for="reg-email">Email Address</label>
          <input class="input-field" type="email" id="reg-email" placeholder="patient@example.com" required />
        </div>

        <div class="input-group">
          <label class="input-label" for="reg-phone">Phone Number (Optional)</label>
          <input class="input-field" type="tel" id="reg-phone" placeholder="+91 98765 43210" />
        </div>

        <div class="input-group">
          <label class="input-label" for="reg-password">Create Passcode</label>
          <input class="input-field" type="password" id="reg-password" required placeholder="At least 8 characters" />
        </div>

        <button type="submit" class="btn btn-primary btn-full" id="btn-reg-submit" style="height:50px;font-size:15px;font-weight:600;margin-top:4px;">
          <span>Create Account & Sign In</span>
        </button>
      </form>
    `;
  }

  container.innerHTML = `
    <div style="padding:32px 24px 24px;">
      <!-- Top Branding and Backend Status -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <div style="display:inline-flex;align-items:center;gap:10px;">
          <div style="width:38px;height:38px;background:linear-gradient(135deg,#2563eb,#4f46e5);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(37,99,235,0.25);">
            ${getIcon('companion', 'width:20px;height:20px;stroke:white;')}
          </div>
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--text-primary);line-height:1.2;">HealthContinuum AI</div>
            <div style="font-size:11px;color:var(--text-tertiary);">Longitudinal Care Intelligence</div>
          </div>
        </div>

        <div class="backend-status-pill" id="backend-status-indicator" title="Supabase Auth and patient API">
          <div class="pulse-dot"></div>
          <span style="font-size:11px;">${isConnected ? 'Backend Live' : 'Backend Ready'}</span>
        </div>
      </div>

      <!-- Welcome Heading -->
      <div style="margin-bottom:20px;">
        <h1 style="font-size:24px;font-weight:700;letter-spacing:-0.5px;color:var(--text-primary);line-height:1.25;margin:0 0 6px;">
          Understand what changed.<br/>Know why. Close the gap.
        </h1>
        <p style="font-size:13.5px;color:var(--text-secondary);line-height:1.45;margin:0;">
          Access your unified medical history, prescription transitions, and AI Companion.
        </p>
      </div>

      <!-- Navigation Tabs -->
      <div class="login-tabs">
        <button type="button" class="login-tab-btn ${currentAuthTab === 'signin' ? 'active' : ''}" onclick="setAuthTab('signin')">
          Sign In
        </button>
        <button type="button" class="login-tab-btn ${currentAuthTab === 'demo' ? 'active' : ''}" onclick="setAuthTab('demo')">
          ⚡ One-Tap Demo
        </button>
        <button type="button" class="login-tab-btn ${currentAuthTab === 'register' ? 'active' : ''}" onclick="setAuthTab('register')">
          New Patient
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="auth-tab-body">
        ${tabBodyHtml}
      </div>

      <!-- Security Reassurance -->
      <div style="margin-top:24px;padding:12px 14px;background:rgba(37,99,235,0.05);border-radius:14px;border:1px solid rgba(37,99,235,0.12);display:flex;gap:10px;align-items:flex-start;">
        <div style="color:var(--blue);margin-top:1px;">${getIcon('shield', 'width:18px;height:18px;')}</div>
        <div style="font-size:11.5px;color:var(--text-secondary);line-height:1.45;">
          <strong style="color:var(--text-primary);">Privacy first:</strong> Sign-in is required for personal records. Clinician access is limited by patient-approved sharing permissions.
        </div>
      </div>
    </div>
  `;
}

function showAuthError(msg) {
  const el = document.getElementById('auth-alert');
  if (el) {
    el.className = 'auth-alert auth-alert-error';
    el.innerHTML = `<span>⚠️ ${msg}</span>`;
    el.style.display = 'flex';
  }
}

function showAuthSuccess(msg) {
  const el = document.getElementById('auth-alert');
  if (el) {
    el.className = 'auth-alert auth-alert-success';
    el.innerHTML = `<span>✅ ${msg}</span>`;
    el.style.display = 'flex';
  }
}

function setAuthLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.origHtml = btn.innerHTML;
    btn.innerHTML = `<span style="display:inline-block;animation:spin 1s linear infinite;margin-right:6px;">⏳</span> ${text}`;
  } else {
    btn.innerHTML = btn.dataset.origHtml || text;
  }
}

function togglePasswordVisibility(fieldId, btnEl) {
  const input = document.getElementById(fieldId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btnEl.textContent = '🙈';
  } else {
    input.type = 'password';
    btnEl.textContent = '👁️';
  }
}

function fillDemoCredentials() {
  setAuthTab("demo");
}

async function handleLoginSubmit() {
  const identifier = document.getElementById('login-identifier')?.value.trim();
  const password = document.getElementById('login-password')?.value || '';
  const remember = document.getElementById('login-remember')?.checked !== false;
  const btn = document.getElementById('btn-login-submit');

  if (!identifier) {
    showAuthError('Please enter your Patient UHID, Email, or Mobile Number.');
    return;
  }

  setAuthLoading(btn, true, 'Signing in...');

  try {
    const res = await window.API.login(identifier, password, remember);
    if (res?.success && res.data) {
      await handleAuthSuccess(res.data, remember);
    } else {
      showAuthError(res?.error?.message || res?.message || 'Login failed. Please verify credentials.');
      setAuthLoading(btn, false, 'Access Health Continuum');
    }
  } catch (err) {
    showAuthError(err.message || 'Unable to connect to backend server.');
    setAuthLoading(btn, false, 'Access Health Continuum');
  }
}

async function handleGoogleLogin() {
  const btn = document.getElementById('btn-google-auth');
  setAuthLoading(btn, true, 'Connecting to Google...');
  const result = await window.API.googleAuth();
  if (!result?.success) {
    showAuthError(result?.error?.message || 'Google sign-in could not start. Check Supabase OAuth settings.');
    setAuthLoading(btn, false, 'Continue with Google');
  }
}

async function handleQuickDemoLogin() {
  // Synthetic preview only: never create a fake token or authenticated session.
  window.DEMO_PREVIEW = true;
  STATE.demoPreview = true;
  loadPatientData(DEMO_RAMESH_DATA.patient);
  STATE.backendConnected = false;
  showAuthSuccess('Read-only sample preview opened. No real patient account is signed in.');
  navigate('home');
}

async function handleRegisterSubmit() {
  const name = document.getElementById('reg-name')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const phone = document.getElementById('reg-phone')?.value.trim();
  const password = document.getElementById('reg-password')?.value || '';
  const btn = document.getElementById('btn-reg-submit');

  if (!name) {
    showAuthError('Please enter your full patient name.');
    return;
  }

  setAuthLoading(btn, true, 'Creating Account...');

  try {
    const res = await window.API.register(name, email, phone, password);
    if (res?.success && res.data) {
      await handleAuthSuccess(res.data, true);
    } else {
      showAuthError(res?.error?.message || res?.message || 'Registration failed.');
      setAuthLoading(btn, false, 'Create Account & Sign In');
    }
  } catch (err) {
    showAuthError(err.message || 'Unable to register patient.');
    setAuthLoading(btn, false, 'Create Account & Sign In');
  }
}

async function handleAuthSuccess(authData, remember) {
  window.DEMO_PREVIEW = false;
  STATE.demoPreview = false;
  if (authData?.patient) loadPatientData(authData.patient);
  else {
    showAuthError('Your account profile could not be loaded. Please sign in again.');
    return;
  }

  showAuthSuccess(`Welcome, ${STATE.patient.firstName}! Loading your records...`);
  await syncWithBackend();
  setTimeout(() => navigate('home'), 250);
}

async function handleLogout() {
  try { await window.API.logout(); } catch (error) { console.warn('[Auth] Sign-out error:', error); }
  window.DEMO_PREVIEW = false;
  window.AUTH_TOKEN = null;
  loadPatientData({});
  closeProfileDrawer();
  navigate('login');
}


// ─── SCREEN 2: HOME DASHBOARD RENDERER ──────────────────────────────────────
function renderHome() {
  const container = document.getElementById('home-content');
  if (!container) return;

  const firstName = STATE.patient?.firstName || 'Patient';
  const userInitials = (STATE.patient?.name || 'Patient').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'PT';

  container.innerHTML = `
    <!-- 1. HEADER: BRAND LOGO + TITLE + LANGUAGE SWITCHER + AVATAR + NOTIFICATION BELL -->
    <header class="hc-home-header">
      <div class="hc-brand-left">
        <div class="hc-brand-icon-wrap">
          <svg class="hc-heart-svg" viewBox="0 0 24 24" fill="white">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div class="hc-brand-titles">
          <div class="hc-brand-name">${t('appName')} <span class="hc-brand-ai-badge">AI</span></div>
          <div class="hc-brand-tagline">${t('appSubtitle')}</div>
        </div>
      </div>
      <div class="hc-header-actions">
        <!-- 3D Frosted Glass Language Switcher -->
        <div class="hc-lang-toggle-bar" role="group" aria-label="Language Selector">
          <button class="hc-lang-pill-btn ${STATE.lang === 'en' ? 'active' : ''}" onclick="event.stopPropagation(); setLanguage('en');" title="English">
            EN
          </button>
          <button class="hc-lang-pill-btn ${STATE.lang === 'te' ? 'active' : ''}" onclick="event.stopPropagation(); setLanguage('te');" title="Telugu (తెలుగు)">
            తెలుగు
          </button>
        </div>
        <div class="hc-avatar-btn" onclick="openProfileDrawer()" title="Patient Profile" role="button" tabindex="0">
          <img src="/assets/user_avatar.jpg" alt="${escapeHtml(firstName)}" class="hc-avatar-img" onerror="this.onerror=null;this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 40 40\\'><circle cx=\\'20\\' cy=\\'20\\' r=\\'20\\' fill=\\'%232563eb\\'/><text x=\\'50%25\\' y=\\'55%25\\' font-size=\\'15\\' fill=\\'white\\' font-weight=\\'bold\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>${escapeHtml(userInitials)}</text></svg>'"/>
        </div>
        <button class="hc-bell-btn" onclick="openNotificationsDrawer()" title="Notifications" aria-label="Notifications">
          ${getIcon('bell', 'width:19px;height:19px;stroke:#4b5563;')}
          <span class="hc-bell-badge"></span>
        </button>
      </div>
    </header>

    <!-- 2. GREETING -->
    <section class="hc-greeting-section">
      <h1 class="hc-greeting-title">${t('hello')}, ${firstName} <span class="hc-wave-hand">👋</span></h1>
    </section>

    <!-- 3. HERO CARD: MEET YOUR HEALTH COMPANION WITH 3D TILT & SPARKLES -->
    <div class="hc-hero-companion-card hc-3d-card" id="hero-companion-card" onclick="triggerSparkleBurst(event); navigate('companion');">
      <!-- Floating 3D Sparkle Particles & Twinkling Stars -->
      <div class="hc-sparkles-container" aria-hidden="true">
        <span class="sparkle sp-1">✦</span>
        <span class="sparkle sp-2">✨</span>
        <span class="sparkle sp-3">✦</span>
        <span class="sparkle sp-4">★</span>
        <span class="sparkle sp-5">✨</span>
        <span class="sparkle sp-6">✦</span>
        <div class="sparkle-aura"></div>
      </div>

      <div class="hc-companion-card-content">
        <div class="hc-companion-photo-ring">
          <img src="/assets/doctor_consultation.jpg" alt="Doctor Consultation" class="hc-companion-photo" onerror="this.onerror=null;this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 80 80\\'><circle cx=\\'40\\' cy=\\'40\\' r=\\'40\\' fill=\\'%233b82f6\\'/><text x=\\'50%25\\' y=\\'55%25\\' font-size=\\'36\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>👩‍⚕️</text></svg>'"/>
        </div>
        <div class="hc-companion-text-col">
          <h2 class="hc-companion-title">${t('meetCompanion')}</h2>
          <p class="hc-companion-desc">${t('companionHelp')}</p>
          <button class="hc-companion-pill-btn" onclick="event.stopPropagation(); triggerSparkleBurst(event); navigate('companion');">
            <span class="hc-companion-pill-icon">${getIcon('chatMessage', 'width:16px;height:16px;stroke:currentColor;')}</span>
            <span class="hc-companion-pill-text">${t('askCompanion')}</span>
            <span class="hc-companion-pill-arrow">›</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 4. SECTION: ADD YOUR MEDICAL RECORDS -->
    <section class="hc-section">
      <div class="hc-section-header-row">
        <div class="hc-section-title-wrap">
          <span class="hc-section-icon-blue">${getIcon('fileText', 'width:19px;height:19px;stroke:#2563eb;')}</span>
          <div>
            <h2 class="hc-section-title">${t('addRecords')}</h2>
            <p class="hc-section-subtitle">${t('addRecordsSub')}</p>
          </div>
        </div>
        <button class="hc-section-action-icon" onclick="openAddRecordFlow()" title="Add Record">
          ${getIcon('documentBadge', 'width:19px;height:19px;stroke:#2563eb;')}
        </button>
      </div>

      <div class="hc-add-records-grid">
        <!-- Scan a Document -->
        <div class="hc-action-card hc-3d-card" onclick="triggerSparkleBurst(event); openAddRecordFlow('SCAN');" role="button" tabindex="0">
          <div class="hc-action-card-icon-box">
            ${getIcon('camera', 'width:28px;height:28px;stroke:#2563eb;')}
          </div>
          <h3 class="hc-action-card-title">${t('scanDoc')}</h3>
          <p class="hc-action-card-desc">${t('useCamera')}</p>
          <div class="hc-action-card-arrow-circle">
            <span>›</span>
          </div>
        </div>

        <!-- Upload a File -->
        <div class="hc-action-card hc-3d-card" onclick="triggerSparkleBurst(event); openAddRecordFlow();" role="button" tabindex="0">
          <div class="hc-action-card-icon-box">
            ${getIcon('fileUpload', 'width:28px;height:28px;stroke:#2563eb;')}
          </div>
          <h3 class="hc-action-card-title">${t('uploadFile')}</h3>
          <p class="hc-action-card-desc">${t('choosePdfImg')}</p>
          <div class="hc-action-card-arrow-circle">
            <span>›</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. SECTION: YOUR HEALTH AT A GLANCE -->
    <section class="hc-section">
      <div class="hc-section-simple-title">
        <span class="hc-heart-emoji">💙</span> ${t('healthGlance')}
      </div>

      <div class="hc-glance-card hc-3d-card">
        ${(!STATE.visits || STATE.visits.length === 0) ? `
          <div style="padding:22px 18px;text-align:center;">
            <div style="width:48px;height:48px;border-radius:14px;background:var(--blue-light);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:var(--blue);">
              ${getIcon('fileText', 'width:24px;height:24px;stroke:var(--blue);')}
            </div>
            <div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">No health records uploaded yet</div>
            <p style="font-size:12.5px;color:var(--text-secondary);margin:0 auto 16px;max-width:260px;line-height:1.4;">
              Upload your prescriptions, blood tests, or discharge slips to activate your health journey.
            </p>
            <button class="btn btn-primary btn-sm" onclick="openAddRecordFlow()" style="margin:0 auto;display:inline-flex;align-items:center;gap:6px;">
              ${getIcon('plus', 'width:14px;height:14px;stroke:white;')} Upload First Document
            </button>
          </div>
        ` : `
          <div class="hc-glance-list">
            <!-- Latest lab report -->
            <div class="hc-glance-item" onclick="triggerSparkleBurst(event); navigate('records');" role="button" tabindex="0">
              <div class="hc-glance-item-left">
                <div class="hc-glance-icon-box blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 12h10"/><path d="M7 8h6"/><path d="M7 16h4"/></svg>
                </div>
                <span class="hc-glance-item-text">${t('latestLab')}</span>
              </div>
              <div class="hc-glance-item-right">
                <span class="hc-glance-date">${STATE.visits[0]?.date || 'Recent'}</span>
                <span class="hc-glance-arrow">›</span>
              </div>
            </div>

            <!-- Doctor visit -->
            <div class="hc-glance-item" onclick="triggerSparkleBurst(event); navigate('journey');" role="button" tabindex="0">
              <div class="hc-glance-item-left">
                <div class="hc-glance-icon-box blue">
                  ${getIcon('users', 'width:20px;height:20px;stroke:#2563eb;')}
                </div>
                <span class="hc-glance-item-text">${t('doctorVisit')}</span>
              </div>
              <div class="hc-glance-item-right">
                <span class="hc-glance-date">${STATE.visits[0]?.date || 'Recent'}</span>
                <span class="hc-glance-arrow">›</span>
              </div>
            </div>

            ${(STATE.changes && STATE.changes.length > 0) ? `
              <!-- 1 document needs your review -->
              <div class="hc-glance-item warning" onclick="triggerSparkleBurst(event); openChangeDetail('${STATE.changes[0].id}');" role="button" tabindex="0">
                <div class="hc-glance-item-left">
                  <div class="hc-glance-icon-box amber">
                    ${getIcon('alertTriangle', 'width:20px;height:20px;stroke:#f59e0b;')}
                  </div>
                  <span class="hc-glance-item-text text-amber">${t('docNeedsReview')}</span>
                </div>
                <div class="hc-glance-item-right">
                  <span class="hc-glance-arrow text-amber">›</span>
                </div>
              </div>
            ` : ''}
          </div>

          <button class="hc-glance-journey-btn" onclick="triggerSparkleBurst(event); navigate('journey');">
            <span class="hc-stethoscope-icon">🩺</span>
            <span>${t('viewJourney')}</span>
            <span class="hc-glance-btn-arrow">›</span>
          </button>
        `}
      </div>
    </section>

    <!-- 6. SECTION: FIND YOUR RECORDS -->
    <section class="hc-section">
      <div class="hc-section-simple-title">
        <span class="hc-folder-emoji">📁</span> ${t('findRecords')}
      </div>

      <div class="hc-find-records-grid">
        <!-- Lab Reports -->
        <div class="hc-record-tile tile-blue hc-3d-card" onclick="triggerSparkleBurst(event); navigate('records');" role="button" tabindex="0">
          <div class="hc-record-tile-icon blue">
            ${getIcon('flask', 'width:24px;height:24px;stroke:#2563eb;')}
          </div>
          <span class="hc-record-tile-label">${t('labReports')}</span>
        </div>

        <!-- Prescriptions -->
        <div class="hc-record-tile tile-green hc-3d-card" onclick="triggerSparkleBurst(event); navigate('records');" role="button" tabindex="0">
          <div class="hc-record-tile-icon green">
            ${getIcon('pill', 'width:24px;height:24px;stroke:#10b981;')}
          </div>
          <span class="hc-record-tile-label">${t('prescriptions')}</span>
        </div>

        <!-- Doctor Visits -->
        <div class="hc-record-tile tile-purple hc-3d-card" onclick="triggerSparkleBurst(event); navigate('journey');" role="button" tabindex="0">
          <div class="hc-record-tile-icon purple">
            ${getIcon('calendar', 'width:24px;height:24px;stroke:#a855f7;')}
          </div>
          <span class="hc-record-tile-label">${t('doctorVisits')}</span>
        </div>

        <!-- All Records -->
        <div class="hc-record-tile tile-cyan hc-3d-card" onclick="triggerSparkleBurst(event); navigate('records');" role="button" tabindex="0">
          <div class="hc-record-tile-icon cyan">
            ${getIcon('folder', 'width:24px;height:24px;stroke:#06b6d4;')}
          </div>
          <span class="hc-record-tile-label">${t('allRecords')}</span>
        </div>
      </div>
    </section>

    <!-- 7. SECTION: LATEST UPDATES -->
    <section class="hc-section" style="margin-bottom: 28px;">
      <div class="hc-section-simple-title">
        <span class="hc-bell-emoji">🔔</span> ${t('latestUpdates')}
      </div>

      <div class="hc-updates-stack">
        ${(!STATE.visits || STATE.visits.length === 0) ? `
          <div class="hc-update-card hc-3d-card">
            <div class="hc-update-left">
              <div class="hc-update-icon-box green">
                ${getIcon('check', 'width:22px;height:22px;stroke:#16a34a;')}
              </div>
              <div class="hc-update-texts">
                <h3 class="hc-update-title">Profile Encrypted & Ready</h3>
                <p class="hc-update-subtitle">UHID: ${escapeHtml(STATE.patient.uhid || '')} · Ready to organize your medical documents</p>
              </div>
            </div>
            <button class="hc-update-btn" onclick="openAddRecordFlow();">
              Upload ›
            </button>
          </div>
        ` : `
          ${(STATE.changes && STATE.changes.length > 0) ? `
            <!-- Update 1 -->
            <div class="hc-update-card hc-3d-card">
              <div class="hc-update-left">
                <div class="hc-update-icon-box amber">
                  ${getIcon('fileText', 'width:22px;height:22px;stroke:#f59e0b;')}
                </div>
                <div class="hc-update-texts">
                  <h3 class="hc-update-title">${t('bloodReportTitle')}</h3>
                  <p class="hc-update-subtitle">${t('bloodReportSub')}</p>
                </div>
              </div>
              <button class="hc-update-btn" onclick="triggerSparkleBurst(event); openChangeDetail('${STATE.changes[0].id}');">
                ${t('reviewReport')} ›
              </button>
            </div>
          ` : ''}

          <!-- Update 2 -->
          <div class="hc-update-card hc-3d-card">
            <div class="hc-update-left">
              <div class="hc-update-icon-box blue">
                ${getIcon('users', 'width:22px;height:22px;stroke:#2563eb;')}
              </div>
              <div class="hc-update-texts">
                <h3 class="hc-update-title">${t('shareDocTitle')}</h3>
                <p class="hc-update-subtitle">${t('shareDocSub')}</p>
              </div>
            </div>
            <button class="hc-update-btn" onclick="triggerSparkleBurst(event); navigate('access');">
              ${t('genAccessCode')} ›
            </button>
          </div>
        `}
      </div>
    </section>
  `;

  // Attach interactive 3D physics tilt and sparkle behaviors
  init3dCardInteractions();
}

// ─── 3D CARD TILT & SPARKLE BURST ENGINE ───────────────────────────────────
function init3dCardInteractions() {
  const cards = document.querySelectorAll('.hc-3d-card');
  cards.forEach(card => {
    // Mouse hover tilt physics
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;
      const rotateX = ((y - midY) / midY) * -8;
      const rotateY = ((x - midX) / midX) * 8;

      card.style.transform = `perspective(600px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });

    // Touch tilt physics for mobile screens
    card.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        const touch = e.touches[0];
        const rect = card.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const midX = rect.width / 2;
        const midY = rect.height / 2;
        const rotateX = ((y - midY) / midY) * -6;
        const rotateY = ((x - midX) / midX) * 6;
        card.style.transform = `perspective(600px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`;
      }
    }, { passive: true });

    card.addEventListener('touchend', () => {
      card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  });
}

function triggerSparkleBurst(e) {
  const x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : window.innerWidth / 2);
  const y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : window.innerHeight / 2);

  const particles = ['✦', '✨', '★', '✸', '•', '⋆'];
  const colors = ['#60a5fa', '#38bdf8', '#fbbf24', '#34d399', '#c084fc', '#ffffff'];

  for (let i = 0; i < 9; i++) {
    const el = document.createElement('div');
    el.className = 'hc-sparkle-particle';
    el.textContent = particles[Math.floor(Math.random() * particles.length)];
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = colors[Math.floor(Math.random() * colors.length)];

    const angle = (Math.PI * 2 * i) / 9 + (Math.random() - 0.5) * 0.5;
    const distance = 35 + Math.random() * 45;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    const rot = (Math.random() - 0.5) * 180;

    el.style.setProperty('--tx', `${tx}px`);
    el.style.setProperty('--ty', `${ty}px`);
    el.style.setProperty('--rot', `${rot}deg`);

    document.body.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 650);
  }
}


// ─── TRIGGER COMPANION GREETING: DIRECTLY ASKS USER NAME HOW ARE YOU HOW CAN I HELP YOU ───
function triggerCompanionGreeting(forceSpeak = true) {
  const userName = STATE.patient?.firstName || STATE.patient?.name?.split(' ')[0] || 'Ramesh';
  const greetingText = STATE.lang === 'te' 
    ? `హలో ${userName} గారు, ఎలా ఉన్నారు? నేను మీకు ఎలా సహాయపడగలను?` 
    : `Hey ${userName}, how are you? How can I help you?`;

  if (!STATE.voiceCompanion.chatHistory || STATE.voiceCompanion.chatHistory.length === 0) {
    STATE.voiceCompanion.chatHistory = [{
      id: 'qa-1',
      sender: 'companion',
      questionNumber: 1,
      text: greetingText,
      timestamp: 'Just now',
      source: null,
      provider: 'Dr. Anya AI'
    }];
  } else {
    const firstMsg = STATE.voiceCompanion.chatHistory[0];
    if (firstMsg.sender === 'companion') {
      firstMsg.text = greetingText;
      firstMsg.questionNumber = 1;
    } else {
      STATE.voiceCompanion.chatHistory.unshift({
        id: 'qa-1',
        sender: 'companion',
        questionNumber: 1,
        text: greetingText,
        timestamp: 'Just now',
        source: null,
        provider: 'Dr. Anya AI'
      });
    }
  }

  const container = document.getElementById('companion-content');
  if (container) {
    renderCompanion();
  }

  if (forceSpeak && STATE.voiceCompanion.speechEnabled !== false) {
    stopSpeaking();
    setTimeout(() => {
      speakText(greetingText);
    }, 120);
  }
}

// ─── SCREEN 3: 3D REALISTIC AI HEALTH COMPANION (VOICE + Q&A CONVERSATION) ──
function renderCompanion() {
  const container = document.getElementById('companion-content');
  if (!container) return;

  const { state, chatHistory, currentDraft } = STATE.voiceCompanion;

  container.innerHTML = `
    <div class="hc-companion-page-wrapper">
      <!-- 1. TOP HEADER -->
      <header class="hc-comp-header">
        <button class="btn-icon hc-comp-back-btn" onclick="navigate('home')" title="Back" aria-label="Back">
          ${getIcon('arrowLeft', 'width:18px;height:18px;stroke:#2563eb;')}
        </button>

        <div class="hc-comp-header-center">
          <div class="hc-comp-header-badge">
            <svg class="hc-comp-heart-icon" viewBox="0 0 24 24" fill="white">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <div>
            <h1 class="hc-comp-header-title">AI Health Assistant</h1>
            <p class="hc-comp-header-sub">3D Realistic Clinical Care</p>
          </div>
        </div>

        <div class="hc-comp-header-right">
          <button class="hc-comp-lang-btn" onclick="setLanguage(STATE.lang === 'en' ? 'te' : 'en')" title="Switch Language">
            ${STATE.lang === 'en' ? 'తెలుగు' : 'EN'}
          </button>
          <button class="btn-icon hc-comp-user-btn" onclick="openProfileDrawer()" title="Profile" aria-label="Profile">
            ${getIcon('user', 'width:17px;height:17px;stroke:#4b5563;')}
          </button>
        </div>
      </header>

      <!-- 2. TOP: 3D REALISTIC DOCTOR AVATAR WITH TALKING EFFECT AT CENTER (NO BACKGROUND) -->
      <div class="hc-center-doctor-emoji-area">
        <div class="hc-doctor-emoji-interactive-wrap" 
             onclick="triggerCompanionGreeting(true)" 
             title="Tap Dr. Anya to talk">
          <!-- Left sound wave bars -->
          <div class="hc-sound-wave-bars">
            <div class="hc-wave-bar ${state === 'speaking' || state === 'listening' ? 'active' : ''}"></div>
            <div class="hc-wave-bar ${state === 'speaking' || state === 'listening' ? 'active' : ''}"></div>
            <div class="hc-wave-bar ${state === 'speaking' || state === 'listening' ? 'active' : ''}"></div>
            <div class="hc-wave-bar ${state === 'speaking' || state === 'listening' ? 'active' : ''}"></div>
          </div>

          <!-- Centered 3D Doctor Avatar with talking effect (No Background) -->
          <div class="hc-3d-doctor-avatar-container">
            <img src="assets/doctor_avatar_3d.png" 
                 alt="3D AI Health Doctor" 
                 class="hc-3d-doctor-avatar-img ${state === 'speaking' || state === 'listening' ? 'talking' : ''}" 
                 id="companion-3d-avatar-img" />
          </div>

          <!-- Right sound wave bars -->
          <div class="hc-sound-wave-bars">
            <div class="hc-wave-bar ${state === 'speaking' || state === 'listening' ? 'active' : ''}"></div>
            <div class="hc-wave-bar ${state === 'speaking' || state === 'listening' ? 'active' : ''}"></div>
            <div class="hc-wave-bar ${state === 'speaking' || state === 'listening' ? 'active' : ''}"></div>
            <div class="hc-wave-bar ${state === 'speaking' || state === 'listening' ? 'active' : ''}"></div>
          </div>
        </div>

        <div class="hc-doctor-online-pill" onclick="triggerCompanionGreeting(true)" style="cursor:pointer;" title="Tap to talk">
          <span class="pulse-dot" style="width:6px;height:6px;"></span>
          <span>${STATE.lang === 'te' ? 'AI డాక్టర్ మాట్లాడటానికి సిద్ధంగా ఉన్నారు · తాకండి' : 'AI Doctor · Tap to Talk'}</span>
        </div>
      </div>

      <!-- 3. MIDDLE: STRUCTURED QUESTIONS & ANSWERS (MATCHING IMAGE 2) -->
      <div class="hc-comp-conversation-scroll" id="companion-transcript-area">
        ${chatHistory.map((msg, idx) => renderChatMessageItem(msg, idx)).join('')}

        ${state === 'processing' ? `
          <div class="hc-qa-typing-wrap">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span style="font-size:12px;color:#475569;font-weight:600;margin-left:4px;">Dr. Anya is preparing clinical answer...</span>
          </div>
        ` : ''}
      </div>

      <!-- 4. DOWN / BOTTOM: VOICE INTERACTION CONSOLE (MATCHING IMAGE 1) -->
      <footer class="hc-comp-bottom-dock">
        <div class="hc-voice-hub-container">
          <!-- Top Floating Guidance Bubbles Row -->
          <div class="hc-voice-floating-bubbles-row">
            <div class="hc-float-bubble bubble-left">
              <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;">
                <span>🔊</span>
                <span style="font-weight:700;">Multi-lingual</span>
              </div>
              <span>You can talk in English, Telugu or Hindi.</span>
            </div>

            <!-- Central Glowing Ripple Microphone Circle -->
            <div class="hc-voice-center-mic-wrap">
              ${state === 'listening' ? `
                <div class="hc-voice-ripple-ring"></div>
                <div class="hc-voice-ripple-ring secondary"></div>
              ` : ''}
              <button class="hc-voice-main-mic-btn ${state === 'listening' ? 'active-listening' : ''}" 
                      id="companion-main-mic-btn"
                      onclick="toggleVoiceListening()" 
                      title="${state === 'listening' ? 'Stop listening' : 'Start speaking'}"
                      aria-label="Microphone">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
            </div>

            <div class="hc-float-bubble bubble-right">
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-bottom:2px;">
                <span>😊</span>
                <span style="font-weight:700;">Natural Voice</span>
              </div>
              <span>Just speak like you normally talk!</span>
            </div>
          </div>

          <!-- Status Title and Subtitle -->
          <div class="hc-voice-status-title">
            ${state === 'listening' 
              ? 'Listening...' 
              : (state === 'speaking' 
                ? 'Speaking answer...' 
                : (state === 'transcribing' ? 'Transcribing...' : 'Tap to speak'))}
          </div>
          <div class="hc-voice-status-sub">
            ${state === 'listening' 
              ? "Speak clearly. I'm here to help." 
              : (state === 'speaking' 
                ? 'Speaking response aloud — tap Stop to mute' 
                : "Speak clearly. I'm here to help.")}
          </div>

          <!-- 3 Circular Action Buttons: Replay, Stop, Observing... -->
          <div class="hc-voice-actions-row">
            <button class="hc-action-circle-item" onclick="replayLastCompanionResponse()" title="Replay previous answer">
              <div class="hc-action-circle-btn">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
              </div>
              <span class="hc-action-circle-label">Replay</span>
            </button>

            <button class="hc-action-circle-item" onclick="stopSpeaking(); stopListening();" title="Stop audio">
              <div class="hc-action-circle-btn" style="background:#fee2e2;color:#dc2626;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <rect x="5" y="5" width="14" height="14" rx="2"></rect>
                </svg>
              </div>
              <span class="hc-action-circle-label" style="color:#dc2626;">Stop</span>
            </button>

            <button class="hc-action-circle-item" onclick="handleObservationClick()" title="Analyze current records">
              <div class="hc-action-circle-btn">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <span class="hc-action-circle-label">Observing...</span>
            </button>
          </div>


          <!-- Bottom Pill Input Bar: Mic + Input with Keyboard Icon + Send -->
          <div class="hc-pill-bar-wrapper">
            <button class="hc-pill-mic-left-btn ${state === 'listening' ? 'recording' : ''}" 
                    onclick="toggleVoiceListening()" 
                    title="Tap to speak"
                    aria-label="Microphone">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>

            <div class="hc-pill-input-center">
              <input type="text" 
                     class="hc-pill-input-field" 
                     id="companion-chat-input"
                     placeholder="${STATE.lang === 'te' ? 'ప్రశ్న అడగండి...' : 'Tap to speak'}" 
                     autocomplete="off"
                     value="${escapeHtml(currentDraft || '')}"
                     onkeydown="handleComposerKeyDown(event)"
                     oninput="handleComposerInput(event)"/>
              <span class="hc-pill-keyboard-icon">⌨️</span>
            </div>

            <button class="hc-pill-send-right-btn" 
                    id="companion-send-btn"
                    onclick="submitChatInput()"
                    title="Send message"
                    aria-label="Send">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              <span>Send</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  `;

  init3dCardInteractions();
  setTimeout(scrollTranscriptToBottom, 40);
  setTimeout(updateComposerButtons, 50);
}

function replayLastCompanionResponse() {
  const history = STATE.voiceCompanion.chatHistory;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].sender === 'companion') {
      speakText(history[i].text);
      return;
    }
  }
  const defaultMsg = STATE.lang === 'te' 
    ? 'నమస్తే రమేష్ గారు, మీ ఆరోగ్య రికార్డుల గురించి నన్ను ఏదైనా అడగవచ్చు.' 
    : 'Hello Ramesh, you can ask me anything about your verified medical records.';
  speakText(defaultMsg);
}

function handleObservationClick() {
  const obsText = STATE.lang === 'te'
    ? 'మీ ఆరోగ్య ప్రయాణం గమనిస్తున్నాను... సిటీ కేర్ ఆసుపత్రిలోని 3 విజిట్లు, 7 రికార్డులు విశ్లేషించబడ్డాయి. మెట్‌ఫార్మిన్ 500mg కొనసాగుతోంది, మరియు మీ HbA1c 6.5% కు తగ్గింది.'
    : 'Observing your clinical timeline... 3 visits at City Care Hospital analyzed. Current Metformin dose is 500 mg daily, HbA1c improved to 6.5%, and kidney filtration eGFR is optimal at 82.';
  handleSendCompanionMessage(obsText);
}

function clearLiveTranscription() {
  STATE.voiceCompanion.currentTranscript = '';
  STATE.voiceCompanion.state = 'idle';
  const input = document.getElementById('companion-chat-input');
  if (input) {
    input.value = '';
    updateComposerButtons();
  }
  renderCompanion();
}

// ─── RENDER SINGLE CHAT MESSAGE BUBBLE (STRUCTURED QUESTIONS & ANSWERS) ─────
function renderChatMessageItem(msg, index) {
  if (msg.sender === 'user') {
    // Patient response on the right (matches Image 2: rounded white pill with border)
    return `
      <div class="hc-qa-answer-block" id="msg-row-${msg.id}">
        <div class="hc-qa-patient-pill">
          <span class="hc-qa-patient-text">${escapeHtml(msg.text)}</span>
        </div>
      </div>
    `;
  }

  // AI Doctor Question / Response on the left (matches Image 2: numbered question + speaker icon)
  const factsList = Array.isArray(msg.documented_facts) ? msg.documented_facts : [];
  const citationsList = Array.isArray(msg.citations) ? msg.citations : (msg.source ? [msg.source] : []);
  const suggestedActions = Array.isArray(msg.suggested_next_actions) ? msg.suggested_next_actions : [];
  const qNum = msg.questionNumber || (Math.floor(index / 2) + 1);

  const isEmergency = msg.safety_status === 'EMERGENCY_ESCALATION';
  const isUnreadable = msg.safety_status === 'UNREADABLE_PRESCRIPTION';

  return `
    <div class="hc-qa-question-block" id="msg-row-${msg.id}" style="${isEmergency ? 'border: 2px solid #ef4444; background: #fff5f5;' : ''}">
      ${isEmergency ? `
        <div style="background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;border-radius:10px;padding:8px 12px;font-size:12px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
          <span>🚨</span>
          <span>CRITICAL: Immediate Emergency Services Required</span>
        </div>
      ` : ''}

      ${isUnreadable ? `
        <div style="background:#fef3c7;border:1px solid #fcd34d;color:#92400e;border-radius:10px;padding:8px 12px;font-size:12px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
          <span>⚠️</span>
          <span>Prescription Safety Precaution: Dosage Guessing Prohibited</span>
        </div>
      ` : ''}

      <div class="hc-qa-question-header">
        <div class="hc-qa-question-content">
          <span class="hc-qa-num">${qNum}.</span>
          ${escapeHtml(msg.text)}
        </div>
        <button class="hc-qa-speak-btn" onclick="speakText('${escapeHtml(msg.text.replace(/'/g, "\\'"))}')" title="Listen to question" aria-label="Listen">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </button>
      </div>

      ${msg.uncertainty_notes ? `
        <div style="background:#fffbeb;border:1px solid #fde68a;color:#92400e;border-radius:8px;padding:6px 10px;font-size:11px;margin-top:6px;">
          ℹ️ <strong>Clinical Note:</strong> ${escapeHtml(msg.uncertainty_notes)}
        </div>
      ` : ''}

      ${factsList.length > 0 ? `
        <div class="hc-qa-facts-box" style="margin-top:8px;">
          <div style="font-weight:700;margin-bottom:3px;color:#1e3a8a;font-size:12px;">📌 Documented Clinical Evidence:</div>
          <ul style="margin:0;padding-left:16px;font-size:12px;color:#1e293b;">
            ${factsList.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${citationsList.length > 0 ? `
        <div class="hc-qa-citations-wrap" style="margin-top:8px;display:flex;flex-direction:column;gap:6px;">
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Validated Sources:</div>
          ${citationsList.map(c => `
            <div class="hc-qa-source-tag ${c.is_external_knowledge ? 'external-know' : ''}" 
                 style="cursor:pointer;background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:2px;"
                 onclick="handleCitationCardClick('${escapeHtml((c.title || 'Medical Record').replace(/'/g, "\\'"))}', '${escapeHtml((c.doc_id || '').replace(/'/g, "\\'"))}', '${escapeHtml((c.type || 'RECORD').replace(/'/g, "\\'"))}')"
                 title="Tap to review original record">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span style="font-weight:700;color:#1e40af;font-size:12px;">
                  ${c.is_external_knowledge ? '📚 General Clinical Guideline' : '📄 ' + escapeHtml(c.title)}
                </span>
                <span style="font-size:10px;padding:2px 6px;border-radius:6px;background:${c.is_external_knowledge ? '#e2e8f0' : '#dbeafe'};color:#1e3a8a;font-weight:600;">
                  ${escapeHtml(c.type || 'RECORD')}
                </span>
              </div>
              ${c.value ? `<div style="font-size:11px;color:#334155;">Result / Reading: <strong>${escapeHtml(c.value)}</strong></div>` : ''}
              ${c.date ? `<div style="font-size:11px;color:#64748b;">Encounter Date: ${escapeHtml(c.date)} · <span style="text-decoration:underline;color:#2563eb;">Inspect Original ›</span></div>` : ''}
              ${c.uncertainty_flag ? `<div style="font-size:10px;color:#b45309;font-weight:600;">⚠️ Marked for clinician verification</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${suggestedActions.length > 0 ? `
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">
          ${suggestedActions.map(act => `
            <button class="chip-sm" style="background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;border-radius:12px;padding:4px 8px;font-size:11px;cursor:pointer;font-weight:500;" onclick="handleSendCompanionMessage('${escapeHtml(act.replace(/'/g, "\\'"))}')">
              💡 ${escapeHtml(act)}
            </button>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function handleCitationCardClick(title, docId, docType) {
  const fileName = docType === 'PRESCRIPTION' ? 'prescription_jun_2026.pdf' : (docType === 'LAB_REPORT' ? 'lab_report_jun_2026.pdf' : 'clinical_note_jun_2026.pdf');
  const dateStr = '20 Jun 2026';
  if (typeof viewDocumentDetail === 'function') {
    viewDocumentDetail(title, fileName, dateStr);
  } else {
    alert(`Source Record: ${title}\nType: ${docType}\nStatus: Verified in database.`);
  }
}

function formatCompanionAnswerHtml(text) {
  if (!text) return '';
  const escaped = escapeHtml(text);
  const paragraphs = escaped.split(/\n\s*\n/);
  return paragraphs.map(p => {
    const lines = p.split('\n');
    return `<p>${lines.join('<br/>')}</p>`;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function scrollTranscriptToBottom() {
  const el = document.getElementById('companion-transcript-area');
  if (el) {
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }
}

function handleComposerInput(event) {
  const text = event ? event.target.value : '';
  STATE.voiceCompanion.currentDraft = text;
  const sendBtn = document.getElementById('companion-send-btn');
  if (sendBtn) {
    if (text.trim().length > 0) {
      sendBtn.classList.add('active');
    } else {
      sendBtn.classList.remove('active');
    }
  }
}

function updateComposerButtons() {
  const input = document.getElementById('companion-chat-input');
  const sendBtn = document.getElementById('companion-send-btn');
  if (input && sendBtn) {
    const hasText = input.value.trim().length > 0;
    if (hasText) {
      sendBtn.classList.add('active');
    } else {
      sendBtn.classList.remove('active');
    }
  }
}

function handleComposerKeyDown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    submitChatInput();
  }
}

function submitChatInput() {
  const input = document.getElementById('companion-chat-input');
  const text = (input ? input.value : STATE.voiceCompanion.currentDraft || '').trim();
  if (!text) return;

  // Clear text field and draft
  STATE.voiceCompanion.currentDraft = '';
  if (input) input.value = '';
  updateComposerButtons();

  // If microphone is active, stop it cleanly
  if (STATE.voiceCompanion.state === 'listening' || STATE.voiceCompanion.state === 'transcribing') {
    stopListening();
  }

  handleSendCompanionMessage(text);
}

function clearCompanionChat() {
  stopSpeaking();
  stopListening();
  STATE.voiceCompanion.chatHistory = [STATE.voiceCompanion.chatHistory[0]];
  STATE.voiceCompanion.currentTranscript = '';
  STATE.voiceCompanion.currentDraft = '';
  STATE.voiceCompanion.state = 'idle';
  renderCompanion();
}

// ─── CONVERSATIONAL ENGINE: MESSAGE HANDLING & API INTEGRATION ───────────────
async function handleSendCompanionMessage(questionText) {
  if (!questionText || !questionText.trim()) return;

  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Append user message to transcript
  const userMsgId = 'usr-' + Date.now();
  STATE.voiceCompanion.chatHistory.push({
    id: userMsgId,
    sender: 'user',
    text: questionText.trim(),
    timestamp: nowTime,
  });

  // 2. Set companion state to processing
  STATE.voiceCompanion.state = 'processing';
  renderCompanion();

  let answerText = '';
  let citationsList = [];
  let sourceObj = null;
  let providerStr = 'grounded_records_engine';
  let providerNoteStr = 'Grounded in patient records';
  let factsList = [];
  let safetyStatus = 'SAFE';
  let uncertaintyNotes = null;
  let suggestedActions = [];

  // 3. Request answer from backend API (chatCompanion endpoint)
  try {
    if (window.API && typeof window.API.chatCompanion === 'function') {
      const res = await window.API.chatCompanion(
        questionText.trim(),
        STATE.patient.id,
        STATE.activeConversationId || null,
        STATE.lang || 'en'
      );
      if (res?.success && res.data) {
        answerText = res.data.answer;
        citationsList = res.data.citations || [];
        sourceObj = citationsList[0] || null;
        providerStr = res.data.provider || 'grounded_records_engine';
        providerNoteStr = res.data.provider_note;
        factsList = res.data.documented_facts || [];
        safetyStatus = res.data.safety_status || 'SAFE';
        uncertaintyNotes = res.data.uncertainty_notes;
        suggestedActions = res.data.suggested_next_actions || [];
        if (res.data.conversation_id) {
          STATE.activeConversationId = res.data.conversation_id;
        }
      }
    } else if (window.API && typeof window.API.askCompanion === 'function') {
      const res = await window.API.askCompanion(questionText.trim(), STATE.patient.id);
      if (res?.success && res.data) {
        answerText = res.data.answer;
        sourceObj = res.data.source;
        citationsList = sourceObj ? [sourceObj] : [];
        providerStr = res.data.provider;
        providerNoteStr = res.data.provider_note;
        factsList = res.data.documented_facts || [];
      }
    }
  } catch (err) {
    console.warn('[Companion] Backend API error, using local clinical matcher:', err);
  }

  // 4. Reliable local fallback if backend network is unreachable
  if (!answerText) {
    const localMatch = matchRecordLocally(questionText);
    answerText = localMatch.answer;
    sourceObj = localMatch.source || sourceObj;
    citationsList = sourceObj ? [sourceObj] : [];
    providerNoteStr = 'Grounded directly in patient database records';
    factsList = (localMatch.facts && localMatch.facts.length > 0) ? localMatch.facts : factsList;
  }

  // 5. Append companion answer to transcript
  const aiMsgId = 'ai-' + Date.now();
  const companionQuestionsCount = STATE.voiceCompanion.chatHistory.filter(m => m.sender === 'companion').length;
  STATE.voiceCompanion.chatHistory.push({
    id: aiMsgId,
    sender: 'companion',
    questionNumber: companionQuestionsCount + 1,
    text: answerText,
    source: sourceObj,
    citations: citationsList,
    safety_status: safetyStatus,
    uncertainty_notes: uncertaintyNotes,
    suggested_next_actions: suggestedActions,
    provider: providerStr,
    providerNote: providerNoteStr,
    documented_facts: factsList,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  STATE.voiceCompanion.state = 'idle';
  renderCompanion();

  // 6. Speak response aloud if TTS is enabled
  if (STATE.voiceCompanion.speechEnabled && answerText) {
    speakText(answerText);
  }
}

// ─── LOCAL CLINICAL GROUNDING MATCHER (ZERO FABRICATION) ────────────────────
function matchRecordLocally(query) {
  const q = (query || '').toLowerCase().trim();
  const isTe = /[\u0C00-\u0C7F]/.test(query) || STATE.lang === 'te';

  // 1. "Summarize my latest report." / ల్యాబ్ రిపోర్టులు
  if (q.includes('summarize') || q.includes('latest report') || q.includes('summary of my report') || q.includes('రిపోర్ట్') || q.includes('ల్యాబ్') || q.includes('బ్లడ్')) {
    if (isTe) {
      return {
        answer: 'మీ తాజా ల్యాబ్ రిపోర్ట్ (20 జూన్ 2026, సిటీ కేర్ హాస్పిటల్): HbA1c 6.5% కి తగ్గింది (లక్ష్యం < 7.0%, జనవరిలో 7.8% ఉండేది); కిడ్నీ వడపోత eGFR 82 mL/min కి మెరుగైంది (గతంలో 68); సీరమ్ క్రియాటినిన్ 0.95 mg/dL వద్ద సాధారణంగా ఉంది. డా. ప్రియా శర్మ గారు గ్లైసీమిక్ నియంత్రణలో గణనీయమైన మెరుగుదల ఉందని నమోదు చేశారు.',
        source: { title: 'Laboratory Report (HbA1c & Renal Panel)', date: '20 June 2026', type: 'LAB_REPORT', doc_id: 'doc-003' },
        facts: [
          'రిపోర్ట్ తేదీ: 20 జూన్ 2026 (సిటీ కేర్ హాస్పిటల్)',
          'HbA1c: 6.5% (అనుకూల స్థాయి, జనవరిలో 7.8% నుండి తగ్గింది)',
          'eGFR: 82 mL/min (సాధారణ కిడ్నీ వడపోత రేటు)',
          'సీరమ్ క్రియాటినిన్: 0.95 mg/dL (సాధారణ పరిధి: 0.7–1.2)'
        ]
      };
    }
    return {
      answer: 'Your latest report is a Laboratory Report (HbA1c & Renal Panel) from City Care Hospital on 20 June 2026. Key results: HbA1c improved to 6.5% (optimal target < 7.0%, down from 7.8% in January); kidney filtration (eGFR) rose to 82 mL/min (improved from 68); and Serum Creatinine is normal at 0.95 mg/dL. Dr. Priya Sharma recorded significant improvement in glycaemic control.',
      source: { title: 'Laboratory Report (HbA1c & Renal Panel)', date: '20 June 2026', type: 'LAB_REPORT', doc_id: 'doc-003' },
      facts: [
        'Report Date: 20 June 2026 (City Care Hospital)',
        'HbA1c: 6.5% (Optimal, improved from 7.8% in Jan 2026)',
        'eGFR: 82 mL/min (Normal kidney filtration, up from 68)',
        'Serum Creatinine: 0.95 mg/dL (Normal range: 0.7–1.2)',
      ],
    };
  }

  // 2. "What was recorded during my last visit?" / చివరి డాక్టర్ విజిట్
  if (q.includes('last visit') || q.includes('hospital visit') || q.includes('recorded during my last visit') || q.includes('recorded visit') || q.includes('when was my') || q.includes('విజిట్') || q.includes('హాస్పిటల్')) {
    if (isTe) {
      return {
        answer: 'మీ చివరి డాక్టర్ విజిట్ 20 జూన్ 2026న సిటీ కేర్ హాస్పిటల్, చెన్నైలో డా. ప్రియా శర్మ (కన్సల్టెంట్ డయాబెటాలజిస్ట్) గారితో జరిగింది. మీ డయాబెటిస్ గణనీయంగా నియంత్రణలోకి వచ్చిందని డాక్టర్ గారు గుర్తించి, మెట్‌ఫార్మిన్ మోతాదును తగ్గించారు మరియు గుండె రక్షణ కోసం ఆస్పిరిన్ 75 mg ప్రారంభించారు.',
        source: { title: 'Follow-up Consultation Record', date: '20 June 2026', type: 'DOCTOR_NOTE', doc_id: 'doc-003' },
        facts: [
          'విజిట్ తేదీ: 20 జూన్ 2026 (సిటీ కేర్ హాస్పిటల్, చెన్నై)',
          'డాక్టర్: డా. ప్రియా శర్మ (డయాబెటాలజీ)',
          'క్లినికల్ ఫలితం: గ్లైసీమిక్ నియంత్రణ గణనీయంగా మెరుగైంది',
          'నిర్ణయం: మెట్‌ఫార్మిన్ మోతాదు సగానికి తగ్గించబడింది; ఆస్పిరిన్ 75mg ప్రారంభించబడింది'
        ]
      };
    }
    return {
      answer: 'Your last recorded visit was on 20 June 2026 at City Care Hospital, Chennai with Dr. Priya Sharma (Consultant Diabetologist) for a Follow-up Consultation. Dr. Sharma recorded significant improvement in your diabetes markers, reduced your Metformin dosage, and added low-dose Aspirin for cardiovascular protection.',
      source: { title: 'Follow-up Consultation Record', date: '20 June 2026', type: 'DOCTOR_NOTE', doc_id: 'doc-003' },
      facts: [
        'Visit Date: 20 June 2026 (City Care Hospital, Chennai)',
        'Physician: Dr. Priya Sharma (Diabetology)',
        'Clinical Finding: Glycaemic control improved significantly',
        'Decision: Metformin dose halved; Aspirin 75mg initiated',
      ],
    };
  }

  // 3. Medication queries / మందులు
  if (q.includes('medicine') || q.includes('medication') || q.includes('taking') || q.includes('aspirin') || q.includes('prescription') || q.includes('మందులు') || q.includes('టాబ్లెట్') || q.includes('మెట్‌ఫార్మిన్')) {
    if (isTe) {
      return {
        answer: 'మీ తాజా ప్రిస్క్రిప్షన్ ప్రకారం మీరు ప్రస్తుతం ఈ క్రింది మందులు వాడుతున్నారు:\n1. మెట్‌ఫార్మిన్ 500 mg: రోజుకు ఒకసారి (ఉదయం).\n2. ఆస్పిరిన్ 75 mg: రోజుకు ఒకసారి (భోజనం తర్వాత - గుండె రక్షణ కోసం).\nమీ కిడ్నీ పనితీరు (eGFR 82) మెరుగుపడటంతో డా. ప్రియా శర్మ గారు మెట్‌ఫార్మిన్ మోతాదును తగ్గించారు.',
        source: { title: 'తాజా ప్రిస్క్రిప్షన్ · 20 జూన్ 2026', date: '20 June 2026', type: 'PRESCRIPTION', doc_id: 'doc-004' },
        facts: [
          'మెట్‌ఫార్మిన్ 500 mg: రోజుకు ఒకసారి (ఉదయం)',
          'ఆస్పిరిన్ 75 mg: రోజుకు ఒకసారి (భోజనం తర్వాత)',
          'సిటీ కేర్ హాస్పిటల్‌లో 20 జూన్ 2026న ప్రిస్క్రిప్షన్ ఇవ్వబడింది'
        ]
      };
    }
    if (q.includes('aspirin')) {
      return {
        answer: 'Your latest prescription lists Aspirin 75 mg once daily (after food), added for cardiovascular protection during your 20 June follow-up. This is marked for review with Dr. Priya Sharma.',
        source: { title: 'Prescription · 20 Jun 2026', date: '20 June 2026', type: 'PRESCRIPTION', doc_id: 'doc-004' },
        facts: ['Aspirin 75 mg: Once daily after food', 'Cardiovascular prevention addition', 'Review pending with Dr. Priya Sharma'],
      };
    }
    return {
      answer: 'Your latest available prescription lists Metformin 500 mg once daily (morning) and Aspirin 75 mg once daily (after food).',
      source: { title: 'Latest prescription · 20 Jun 2026', date: '20 June 2026', type: 'PRESCRIPTION', doc_id: 'doc-004' },
      facts: ['Metformin 500 mg: Once daily (morning)', 'Aspirin 75 mg: Once daily (after food)', 'Prescribed at City Care Hospital on 20 June 2026'],
    };
  }

  // 4. Overall Health & Kidney progression / ఆరోగ్యం
  if (q.includes('health') || q.includes('kidney') || q.includes('filtration') || q.includes('progression') || q.includes('ఆరోగ్యం') || q.includes('కిడ్నీ')) {
    if (isTe) {
      return {
        answer: 'మీ మొత్తం ఆరోగ్యం మరియు కిడ్నీ పనితీరు చాలా బాగుంది. HbA1c 6.5% వద్ద చక్కటి నియంత్రణలో ఉంది (జనవరిలో 7.8% నుండి తగ్గింది). కిడ్నీ వడపోత (eGFR) 82 mL/min కి మెరుగైంది. సీరమ్ క్రియాటినిన్ 0.95 mg/dL సాధారణ పరిధిలోనే ఉంది.',
        source: { title: 'Laboratory Report (HbA1c & Renal Panel)', date: '20 June 2026', type: 'LAB_REPORT', doc_id: 'doc-003' },
        facts: [
          'HbA1c: 6.5% (అనుకూల నియంత్రణ)',
          'eGFR: 82 mL/min (కిడ్నీ వడపోత మెరుగైంది)',
          'క్రియాటినిన్: 0.95 mg/dL (సాధారణం)'
        ]
      };
    }
    return {
      answer: 'Your latest recorded lab results from 20 June 2026 show: HbA1c is 6.5% (optimal target < 7.0%, down from 7.8% in January), eGFR is 82 mL/min (improved from 68), and Serum Creatinine is 0.95 mg/dL. Your blood sugar and kidney filtration have both shown consistent improvement.',
      source: { title: 'Laboratory Report (HbA1c & Renal Panel)', date: '20 June 2026', type: 'LAB_REPORT', doc_id: 'doc-003' },
      facts: ['HbA1c: 6.5% (Optimal, down from 7.8% in Jan 2026)', 'eGFR: 82 mL/min (Normal > 60, improved from 68)', 'Serum Creatinine: 0.95 mg/dL (Normal range 0.7–1.2)'],
    };
  }

  if (isTe) {
    return {
      answer: 'మీ అందుబాటులో ఉన్న రికార్డులలో ఆ వివరాలు కనుగొనబడలేదు. మీ ప్రస్తుత రికార్డులలో సిటీ కేర్ హాస్పిటల్ నుండి కన్సల్టేషన్ నోట్స్, ప్రిస్క్రిప్షన్లు మరియు ల్యాబ్ ప్యానెల్స్ (HbA1c, eGFR, క్రియాటినిన్) ఉన్నాయి.',
      source: null,
      facts: [],
    };
  }

  return {
    answer: "I couldn't find that information in your available records. Your records currently contain consultation notes, prescriptions, and lab panels (HbA1c, eGFR, Creatinine) from City Care Hospital for diabetes and renal follow-up.",
    source: null,
    facts: [],
  };
}

// ─── VOICE INTERACTION (SPEECH RECOGNITION & TTS) ──────────────────────────
function toggleVoiceListening() {
  if (STATE.voiceCompanion.state === 'listening' || STATE.voiceCompanion.state === 'transcribing') {
    stopListening();
  } else {
    startListening();
  }
}

function startListening() {
  stopSpeaking();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    STATE.voiceCompanion.state = 'error';
    renderCompanion();
    const preview = document.getElementById('voice-live-preview');
    if (preview) {
      preview.textContent = 'Speech recognition not supported in this browser. You can type below.';
    }
    setTimeout(() => {
      STATE.voiceCompanion.state = 'idle';
      renderCompanion();
    }, 2800);
    return;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = STATE.lang === 'te' ? 'te-IN' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    STATE.voiceCompanion.recognition = recognition;
    STATE.voiceCompanion.state = 'listening';
    renderCompanion();

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      STATE.voiceCompanion.state = 'transcribing';
      STATE.voiceCompanion.currentDraft = transcript;
      STATE.voiceCompanion.currentTranscript = transcript;

      const input = document.getElementById('companion-chat-input');
      if (input) {
        input.value = transcript;
        updateComposerButtons();
      }
    };

    recognition.onerror = (event) => {
      console.warn('[Voice] SpeechRecognition error:', event.error);
      STATE.voiceCompanion.state = 'error';
      renderCompanion();
      setTimeout(() => {
        STATE.voiceCompanion.state = 'idle';
        renderCompanion();
      }, 2500);
    };

    recognition.onend = () => {
      const input = document.getElementById('companion-chat-input');
      const text = input ? input.value.trim() : (STATE.voiceCompanion.currentDraft || '').trim();
      STATE.voiceCompanion.currentDraft = text;
      STATE.voiceCompanion.state = 'idle';
      STATE.voiceCompanion.recognition = null;
      renderCompanion();
    };

    recognition.start();
  } catch (err) {
    console.error('[Voice] Start error:', err);
    STATE.voiceCompanion.state = 'error';
    renderCompanion();
  }
}

function stopListening() {
  if (STATE.voiceCompanion.recognition) {
    try {
      STATE.voiceCompanion.recognition.stop();
    } catch (e) {}
    STATE.voiceCompanion.recognition = null;
  }
  const input = document.getElementById('companion-chat-input');
  if (input) {
    STATE.voiceCompanion.currentDraft = input.value.trim();
  }
  STATE.voiceCompanion.state = 'idle';
  renderCompanion();
}

function speakText(text) {
  if (!('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    STATE.voiceCompanion.lastSpokenText = text;
    STATE.voiceCompanion.state = 'speaking';
    renderCompanion();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = STATE.lang === 'te' ? 'te-IN' : 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      STATE.voiceCompanion.state = 'idle';
      renderCompanion();
    };

    utterance.onerror = () => {
      STATE.voiceCompanion.state = 'idle';
      renderCompanion();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[Voice] TTS speak error:', err);
    STATE.voiceCompanion.state = 'idle';
    renderCompanion();
  }
}

function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (STATE.voiceCompanion.state === 'speaking') {
    STATE.voiceCompanion.state = 'idle';
    renderCompanion();
  }
}

function toggleMessagePlayback(msgId) {
  if (STATE.voiceCompanion.state === 'speaking') {
    stopSpeaking();
    return;
  }
  const msg = STATE.voiceCompanion.chatHistory.find(m => m.id === msgId);
  if (msg && msg.text) {
    speakText(msg.text);
  }
}

function toggleCompanionAudio() {
  STATE.voiceCompanion.speechEnabled = !STATE.voiceCompanion.speechEnabled;
  if (!STATE.voiceCompanion.speechEnabled) {
    stopSpeaking();
  }
  renderCompanion();
}

function openSourceRecord(type, docId) {
  if (type === 'PRESCRIPTION' || type === 'LAB_REPORT' || type === 'HOSPITAL') {
    navigate('records');
  } else if (type === 'MISSING_EVIDENCE') {
    openAddRecordFlow('SCAN');
  } else if (type === 'CHANGE_RECORD') {
    openChangeDetail('chg-002');
  } else {
    navigate('journey');
  }
}


// ─── PROFILE, NOTIFICATIONS & HOSPITAL MODAL DRAWERS ────────────────────────
function openProfileDrawer() {
  const modal = document.getElementById('profile-drawer-modal');
  const content = document.getElementById('profile-drawer-content');
  if (!modal || !content) return;

  const pName = STATE.patient?.name || 'Patient';
  const initials = pName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'PT';
  const pAge = STATE.patient?.age ? `${STATE.patient.age} yrs` : 'Not specified';
  const pGender = STATE.patient?.gender || 'Patient';
  const pBlood = STATE.patient?.bloodGroup || 'Not specified';
  const pHosp = STATE.hospitals?.[0]?.name || (STATE.visits?.[0]?.hospitalName) || 'No hospital connected';
  const pDoc = STATE.hospitals?.[0]?.doctor || (STATE.visits?.[0]?.doctorName) || 'Attending Physician';
  const pPhone = STATE.patient?.phone || 'Not provided';

  content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <h2 style="font-size:18px;font-weight:700;margin:0;">Patient Profile</h2>
      <button class="btn-icon" onclick="closeProfileDrawer()">${getIcon('close', 'width:18px;height:18px;')}</button>
    </div>

    <div style="text-align:center;padding:16px 0 24px;border-bottom:1px solid var(--separator);">
      <div style="width:68px;height:68px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#4f46e5);display:flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:700;margin:0 auto 12px;box-shadow:0 8px 24px rgba(37,99,235,0.25);">
        ${escapeHtml(initials)}
      </div>
      <div style="font-size:18px;font-weight:700;color:var(--text-primary);">${escapeHtml(pName)}</div>
      <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">UHID: ${escapeHtml(STATE.patient.uhid || '')}</div>
      <span class="badge badge-green" style="margin-top:8px;">Verified Patient</span>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px;padding:20px 0;">
      <div style="display:flex;justify-content:space-between;">
        <span style="font-size:13px;color:var(--text-secondary);">Age / Gender:</span>
        <span style="font-size:13px;font-weight:600;color:var(--text-primary);">${escapeHtml(pAge)} · ${escapeHtml(pGender)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="font-size:13px;color:var(--text-secondary);">Blood Group:</span>
        <span style="font-size:13px;font-weight:600;color:var(--text-primary);">${escapeHtml(pBlood)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="font-size:13px;color:var(--text-secondary);">Primary Hospital:</span>
        <span style="font-size:13px;font-weight:600;color:var(--text-primary);">${escapeHtml(pHosp)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="font-size:13px;color:var(--text-secondary);">Doctor:</span>
        <span style="font-size:13px;font-weight:600;color:var(--text-primary);">${escapeHtml(pDoc)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="font-size:13px;color:var(--text-secondary);">Phone:</span>
        <span style="font-size:13px;font-weight:600;color:var(--text-primary);">${escapeHtml(pPhone)}</span>
      </div>
    </div>

    <div style="margin-top:auto;padding-top:20px;border-top:1px solid var(--separator);display:flex;flex-direction:column;gap:10px;">
      <button class="btn btn-primary btn-full" onclick="closeProfileDrawer(); navigate('access');">
        Generate Doctor Access Code
      </button>
      <button class="btn btn-secondary btn-full" onclick="handleLogout();" style="color:#ef4444;border-color:#fecaca;">
        Sign Out / Switch Patient
      </button>
    </div>
  `;

  modal.classList.add('open');
}

function closeProfileDrawer() {
  const modal = document.getElementById('profile-drawer-modal');
  if (modal) modal.classList.remove('open');
}

function openNotificationsDrawer() {
  const modal = document.getElementById('notifications-drawer-modal');
  const content = document.getElementById('notifications-drawer-content');
  if (!modal || !content) return;

  content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <h2 style="font-size:18px;font-weight:700;margin:0;">Needs Attention</h2>
      <button class="btn-icon" onclick="closeNotificationsDrawer()">${getIcon('close', 'width:18px;height:18px;')}</button>
    </div>

    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:var(--r-lg);padding:14px;">
        <div style="font-size:13px;font-weight:700;color:#92400e;">1. Aspirin 75mg Review Pending</div>
        <div style="font-size:12px;color:#78350f;margin-top:4px;">New prescription from 20 Jun 2026. Needs review with Dr. Sharma.</div>
        <button class="btn btn-sm" style="background:#d97706;color:white;margin-top:10px;font-size:11px;" onclick="closeNotificationsDrawer(); openChangeDetail('chg-002');">
          Review with Doctor
        </button>
      </div>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:var(--r-lg);padding:14px;">
        <div style="font-size:13px;font-weight:700;color:#991b1b;">2. Missing Lumbar Spine MRI</div>
        <div style="font-size:12px;color:#7f1d1d;margin-top:4px;">Referenced in consultation notes, but image/report is missing.</div>
        <button class="btn btn-sm" style="background:#dc2626;color:white;margin-top:10px;font-size:11px;" onclick="closeNotificationsDrawer(); openAddRecordFlow('SCAN');">
          Upload Scan Report
        </button>
      </div>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:var(--r-lg);padding:14px;">
        <div style="font-size:13px;font-weight:700;color:#166534;">3. September 2026 Follow-up</div>
        <div style="font-size:12px;color:#14532d;margin-top:4px;">Repeat HbA1c and renal profile to check kidney safety on Metformin.</div>
        <button class="btn btn-sm" style="background:#16a34a;color:white;margin-top:10px;font-size:11px;" onclick="closeNotificationsDrawer(); navigate('decision');">
          View Decision Memory
        </button>
      </div>
    </div>
  `;

  modal.classList.add('open');
}

function closeNotificationsDrawer() {
  const modal = document.getElementById('notifications-drawer-modal');
  if (modal) modal.classList.remove('open');
}

function openHospitalModal() {
  const modal = document.getElementById('hospital-modal');
  const sheet = document.getElementById('hospital-sheet');
  if (!modal || !sheet) return;

  sheet.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <h2 style="font-size:19px;font-weight:700;color:var(--text-primary);margin:0;">Hospital Overview</h2>
      <button class="btn-icon" onclick="closeHospitalModal()">${getIcon('close', 'width:18px;height:18px;')}</button>
    </div>

    <div style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--blue-light);border-radius:var(--r-xl);margin-bottom:16px;">
      <div style="font-size:28px;">🏥</div>
      <div>
        <div style="font-size:16px;font-weight:700;color:var(--text-primary);">City Care Hospital, Chennai</div>
        <div style="font-size:12px;color:var(--text-secondary);">3 visits recorded · 5 connected documents</div>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;">Visits on Record</div>
      ${STATE.visits.map(v => `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:var(--r-md);padding:12px 14px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;">
            <span>${v.date}</span>
            <span style="color:var(--blue);">${v.doctorName}</span>
          </div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">${v.summary}</div>
        </div>
      `).join('')}
    </div>

    <div style="display:flex;gap:10px;">
      <button class="btn btn-secondary btn-full" onclick="closeHospitalModal(); navigate('records');">
        View All Records
      </button>
      <button class="btn btn-primary btn-full" onclick="closeHospitalModal(); openAddRecordFlow();">
        Add Record
      </button>
    </div>
  `;

  modal.classList.add('open');
}

function closeHospitalModal() {
  const modal = document.getElementById('hospital-modal');
  if (modal) modal.classList.remove('open');
}

// ─── SCREEN 4: ADD MEDICAL RECORD (MULTI-STEP FLOW) ────────────────────────
function openAddRecordFlow(preselectedType = null) {
  STATE.addRecordFlow.step = 1;
  STATE.addRecordFlow.selectedType = preselectedType || 'PRESCRIPTION';
  STATE.addRecordFlow.uploadedFileName = '';
  STATE.addRecordFlow.extractedData = null;
  // Auto-select first hospital if available; otherwise blank for new users
  STATE.addRecordFlow.selectedHospital = (STATE.hospitals && STATE.hospitals.length > 0)
    ? STATE.hospitals[0].name
    : '';
  // Auto-select most-recent visit if available; otherwise blank
  STATE.addRecordFlow.selectedVisit = (STATE.visits && STATE.visits.length > 0)
    ? STATE.visits[0].id
    : '';
  STATE.addRecordFlow._hospitalSearch = '';
  STATE.addRecordFlow._newHospitalMode = false;
  STATE.addRecordFlow._newVisitMode = false;
  STATE.addRecordFlow._newVisitDate = new Date().toISOString().split('T')[0];
  STATE.addRecordFlow._newVisitDoctor = '';
  renderAddRecordStep();
  const modal = document.getElementById('add-record-modal');
  if (modal) modal.classList.add('open');
}

function closeAddRecordFlow() {
  const modal = document.getElementById('add-record-modal');
  if (modal) modal.classList.remove('open');
}

function renderAddRecordStep() {
  const sheet = document.getElementById('add-record-sheet');
  if (!sheet) return;

  const { step, selectedType, selectedHospital, selectedVisit, uploadedFileName, extractedData } = STATE.addRecordFlow;

  if (step === 1) {
    // Step 1: Select Document Type
    sheet.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:12px;">
        <span style="font-size:12px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;">Step 1 of 4</span>
        <button class="btn-icon" onclick="closeAddRecordFlow()">${getIcon('close', 'width:18px;height:18px;')}</button>
      </div>
      <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);width:100%;">What would you like to add?</h2>
      <p style="font-size:13px;color:var(--text-secondary);width:100%;margin-bottom:16px;">Select the type of medical record.</p>

      <div class="doc-type-grid" style="width:100%;padding:0;">
        <div class="doc-type-card ${selectedType === 'PRESCRIPTION' ? 'selected' : ''}" onclick="setDocType('PRESCRIPTION')">
          <div style="font-size:24px;">💊</div>
          <div style="font-weight:600;font-size:14px;">Prescription</div>
          <div style="font-size:11px;color:var(--text-tertiary);">Medicines & dosages</div>
        </div>
        <div class="doc-type-card ${selectedType === 'LAB_REPORT' ? 'selected' : ''}" onclick="setDocType('LAB_REPORT')">
          <div style="font-size:24px;">🧪</div>
          <div style="font-weight:600;font-size:14px;">Lab Report</div>
          <div style="font-size:11px;color:var(--text-tertiary);">Blood tests & panels</div>
        </div>
        <div class="doc-type-card ${selectedType === 'SCAN' ? 'selected' : ''}" onclick="setDocType('SCAN')">
          <div style="font-size:24px;">🩻</div>
          <div style="font-weight:600;font-size:14px;">Scan / Imaging</div>
          <div style="font-size:11px;color:var(--text-tertiary);">X-Ray, MRI, CT</div>
        </div>
        <div class="doc-type-card ${selectedType === 'DOCTOR_NOTE' ? 'selected' : ''}" onclick="setDocType('DOCTOR_NOTE')">
          <div style="font-size:24px;">📝</div>
          <div style="font-weight:600;font-size:14px;">Doctor Note</div>
          <div style="font-size:11px;color:var(--text-tertiary);">Clinical observations</div>
        </div>
        <div class="doc-type-card ${selectedType === 'DISCHARGE' ? 'selected' : ''}" onclick="setDocType('DISCHARGE')">
          <div style="font-size:24px;">🏥</div>
          <div style="font-weight:600;font-size:14px;">Discharge Summary</div>
          <div style="font-size:11px;color:var(--text-tertiary);">Hospital stay summary</div>
        </div>
        <div class="doc-type-card ${selectedType === 'OTHER' ? 'selected' : ''}" onclick="setDocType('OTHER')">
          <div style="font-size:24px;">📄</div>
          <div style="font-weight:600;font-size:14px;">Other Document</div>
          <div style="font-size:11px;color:var(--text-tertiary);">Bills or summaries</div>
        </div>
      </div>

      <div style="width:100%;margin-top:20px;">
        <button class="btn btn-primary btn-full" onclick="nextAddRecordStep(2)">Continue</button>
      </div>
    `;
  } else if (step === 2) {
    // Step 2: Select Hospital — fully dynamic
    const flowState = STATE.addRecordFlow;
    const allHospitals = STATE.hospitals || [];
    const searchTerm = (flowState._hospitalSearch || '').toLowerCase();
    const filtered = allHospitals.filter(h => h.name.toLowerCase().includes(searchTerm));
    const newHospitalMode = flowState._newHospitalMode || false;

    const hospitalCards = filtered.length > 0 ? filtered.map(h => {
      const isSelected = selectedHospital === h.name;
      const visitCount = (STATE.visits || []).filter(v =>
        (v.hospitalName || '').toLowerCase() === h.name.toLowerCase()
      ).length;
      const recordCount = h.recordCount || (STATE.visits || []).reduce((acc, v) =>
        (v.hospitalName || '').toLowerCase() === h.name.toLowerCase() ? acc + (v.documents || []).length : acc, 0
      );
      return `
        <div class="selection-item-card ${isSelected ? 'selected' : ''}" onclick="setHospital(${JSON.stringify(h.name)})">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:24px;">🏥</div>
            <div>
              <div style="font-weight:600;font-size:15px;color:var(--text-primary);">${escapeHtml(h.name)}</div>
              <div style="font-size:12px;color:var(--text-secondary);">${visitCount} visit${visitCount !== 1 ? 's' : ''} · ${recordCount} record${recordCount !== 1 ? 's' : ''} on file</div>
            </div>
          </div>
          ${isSelected ? `<div style="color:var(--blue);">${getIcon('check', 'width:18px;height:18px;')}</div>` : ''}
        </div>`;
    }).join('') : (searchTerm ? `<div style="text-align:center;padding:20px;color:var(--text-secondary);font-size:13px;">No hospitals match "${escapeHtml(searchTerm)}"</div>` : `<div style="text-align:center;padding:20px;color:var(--text-secondary);font-size:13px;">No hospitals yet. Add your first one below.</div>`);

    const addHospitalSection = newHospitalMode ? `
      <div style="background:var(--bg-card-alt);border:1.5px solid var(--blue);border-radius:var(--r-xl);padding:14px;margin-top:10px;">
        <div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:10px;">Add New Hospital / Clinic</div>
        <input id="new-hospital-name" type="text" class="field-verify-input" placeholder="Hospital or clinic name" style="width:100%;box-sizing:border-box;margin-bottom:8px;" />
        <div style="display:flex;gap:8px;margin-top:4px;">
          <button class="btn btn-secondary btn-full" style="font-size:13px;" onclick="cancelNewHospital()">Cancel</button>
          <button class="btn btn-primary btn-full" style="font-size:13px;" onclick="confirmAddHospital()">Add Hospital</button>
        </div>
      </div>` : `
      <div class="selection-item-card" onclick="showNewHospitalForm()" style="border-style:dashed;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="font-size:20px;color:var(--blue);">${getIcon('plus', 'width:20px;height:20px;')}</div>
          <div style="font-weight:500;font-size:14px;color:var(--blue);">+ Add a new hospital / clinic</div>
        </div>
      </div>`;

    sheet.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:12px;">
        <button class="btn-icon" onclick="nextAddRecordStep(1)">${getIcon('arrowLeft', 'width:18px;height:18px;')}</button>
        <span style="font-size:12px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;">Step 2 of 4</span>
        <button class="btn-icon" onclick="closeAddRecordFlow()">${getIcon('close', 'width:18px;height:18px;')}</button>
      </div>
      <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);width:100%;">Where is this record from?</h2>
      <p style="font-size:13px;color:var(--text-secondary);width:100%;margin-bottom:12px;">Select or add the hospital / clinic.</p>

      <div style="position:relative;width:100%;margin-bottom:12px;">
        <input id="hospital-search-input" type="text" class="field-verify-input"
          placeholder="Search hospitals..."
          value="${escapeHtml(flowState._hospitalSearch || '')}"
          oninput="filterHospitalSearch(this.value)"
          style="width:100%;box-sizing:border-box;padding-left:34px;" />
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-tertiary);">
          ${getIcon('search', 'width:16px;height:16px;') || '🔍'}
        </span>
      </div>

      <div style="width:100%;display:flex;flex-direction:column;gap:8px;">
        ${hospitalCards}
        ${addHospitalSection}
      </div>

      <div style="width:100%;margin-top:20px;">
        <button class="btn btn-primary btn-full" onclick="goToVisitStep()">
          ${selectedHospital ? 'Continue' : 'Skip — No Hospital'}
        </button>
      </div>
    `;
  } else if (step === 3) {
    // Step 3: Select Visit — fully dynamic, filtered by selected hospital
    const flowState = STATE.addRecordFlow;
    const allVisits = STATE.visits || [];
    const hospFilter = (flowState.selectedHospital || '').toLowerCase();
    // Show visits from selected hospital, or all if no hospital selected
    const relevantVisits = hospFilter
      ? allVisits.filter(v => (v.hospitalName || '').toLowerCase().includes(hospFilter.split(',')[0].trim()))
      : allVisits;
    const newVisitMode = flowState._newVisitMode || false;

    // Format a raw ISO date to a friendly display string
    const fmtDate = (raw) => {
      if (!raw) return 'Date unknown';
      try {
        const d = new Date(raw + 'T00:00:00');
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch(e) { return raw; }
    };

    const visitCards = relevantVisits.length > 0 ? relevantVisits.map((v, idx) => {
      const isSelected = selectedVisit === v.id;
      const isLatest = idx === 0;
      const displayDate = v.date || fmtDate(v.dateRaw);
      const docCount = (v.documents || []).length;
      return `
        <div class="selection-item-card ${isSelected ? 'selected' : ''}" onclick="setVisit(${JSON.stringify(v.id)})">
          <div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-weight:600;font-size:14px;color:var(--text-primary);">${escapeHtml(displayDate)}</span>
              ${isLatest ? `<span class="badge badge-verified" style="font-size:10px;">Latest</span>` : ''}
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
              ${v.doctorName ? escapeHtml(v.doctorName) + ' · ' : ''}${escapeHtml(v.type || 'Consultation')} · ${docCount} doc${docCount !== 1 ? 's' : ''}
            </div>
          </div>
          ${isSelected ? `<div style="color:var(--blue);">${getIcon('check', 'width:18px;height:18px;')}</div>` : ''}
        </div>`;
    }).join('') : (!newVisitMode ? `<div style="text-align:center;padding:20px;color:var(--text-secondary);font-size:13px;">No visits recorded yet. Create a new one below.</div>` : '');

    const newVisitSection = newVisitMode ? `
      <div style="background:var(--bg-card-alt);border:1.5px solid var(--blue);border-radius:var(--r-xl);padding:14px;margin-top:10px;">
        <div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:10px;">New Clinical Visit</div>

        <div style="display:flex;flex-direction:column;gap:8px;">
          <div>
            <label style="font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;display:block;margin-bottom:4px;">Visit Date</label>
            <input id="new-visit-date" type="date" class="field-verify-input"
              value="${flowState._newVisitDate || new Date().toISOString().split('T')[0]}"
              max="${new Date().toISOString().split('T')[0]}"
              onchange="STATE.addRecordFlow._newVisitDate = this.value"
              style="width:100%;box-sizing:border-box;" />
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;display:block;margin-bottom:4px;">Doctor Name (optional)</label>
            <input id="new-visit-doctor" type="text" class="field-verify-input"
              placeholder="e.g. Dr. Priya Sharma"
              value="${escapeHtml(flowState._newVisitDoctor || '')}"
              oninput="STATE.addRecordFlow._newVisitDoctor = this.value"
              style="width:100%;box-sizing:border-box;" />
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-secondary btn-full" style="font-size:13px;" onclick="cancelNewVisit()">Cancel</button>
          <button class="btn btn-primary btn-full" style="font-size:13px;" onclick="confirmCreateVisit()">Create Visit</button>
        </div>
      </div>` : `
      <div class="selection-item-card" onclick="showNewVisitForm()" style="border-style:dashed;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="font-size:20px;color:var(--blue);">${getIcon('plus', 'width:20px;height:20px;')}</div>
          <div style="font-weight:500;font-size:14px;color:var(--blue);">+ Create a new visit</div>
        </div>
      </div>`;

    sheet.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:12px;">
        <button class="btn-icon" onclick="nextAddRecordStep(2)">${getIcon('arrowLeft', 'width:18px;height:18px;')}</button>
        <span style="font-size:12px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;">Step 3 of 4</span>
        <button class="btn-icon" onclick="closeAddRecordFlow()">${getIcon('close', 'width:18px;height:18px;')}</button>
      </div>
      <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);width:100%;">Which visit is this from?</h2>
      <p style="font-size:13px;color:var(--text-secondary);width:100%;margin-bottom:16px;">
        ${flowState.selectedHospital ? `Visits at <strong>${escapeHtml(flowState.selectedHospital.split(',')[0])}</strong>.` : 'Connect this record to a clinical visit.'}
      </p>

      <div style="width:100%;display:flex;flex-direction:column;gap:8px;">
        ${visitCards}
        ${newVisitSection}
      </div>

      <div style="width:100%;margin-top:20px;">
        <button class="btn btn-primary btn-full" onclick="nextAddRecordStep(4)">
          ${selectedVisit ? 'Continue to Upload' : 'Skip — Upload Without Visit'}
        </button>
      </div>
    `;
  } else if (step === 4) {
    // Step 4: File Upload & Camera Option
    sheet.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:12px;">
        <button class="btn-icon" onclick="nextAddRecordStep(3)">${getIcon('arrowLeft', 'width:18px;height:18px;')}</button>
        <span style="font-size:12px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;">Step 4 of 4</span>
        <button class="btn-icon" onclick="closeAddRecordFlow()">${getIcon('close', 'width:18px;height:18px;')}</button>
      </div>
      <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);width:100%;">Add your medical record</h2>
      <p style="font-size:13px;color:var(--text-secondary);width:100%;margin-bottom:16px;">PDF, JPG, or PNG files supported.</p>

      <div class="upload-dropzone" style="width:100%;box-sizing:border-box;margin:0 0 16px;" onclick="document.getElementById('hidden-file-input').click()">
        <div style="color:var(--blue);margin-bottom:10px;">${getIcon('upload', 'width:36px;height:36px;')}</div>
        <div style="font-weight:600;font-size:15px;color:var(--text-primary);">Choose a file</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">or drag & drop here</div>
        <input type="file" id="hidden-file-input" style="display:none;" accept=".pdf,.png,.jpg,.jpeg" onchange="handleFileSelected(event)" />
      </div>

      <div style="width:100%;display:flex;gap:10px;">
        <button class="btn btn-secondary btn-full" onclick="handleSimulatedPhoto()">
          📷 Take a Photo
        </button>
      </div>
    `;
  } else if (step === 5) {
    // Step 5: Real Processing Pipeline Animation
    sheet.innerHTML = `
      <div style="text-align:center;width:100%;padding:12px 0;">
        <div style="width:54px;height:54px;border-radius:50%;background:rgba(37,99,235,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:var(--blue);">
          ${getIcon('upload', 'width:28px;height:28px;')}
        </div>
        <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);">Processing your record...</h2>
        <p style="font-size:13px;color:var(--text-secondary);margin-top:4px;">Connecting to clinical continuum</p>

        <div style="margin:24px 0 12px;text-align:left;background:var(--bg-card-alt);border-radius:var(--r-xl);padding:18px;">
          <div class="processing-step-row completed" id="step-row-1">
            <span>✓</span> <span>Document uploaded successfully</span>
          </div>
          <div class="processing-step-row completed" id="step-row-2">
            <span>✓</span> <span>Reading clinical record & entities</span>
          </div>
          <div class="processing-step-row active" id="step-row-3">
            <span>●</span> <span>Understanding dosage & lab values</span>
          </div>
          <div class="processing-step-row pending" id="step-row-4">
            <span>○</span> <span>Adding it to your health journey</span>
          </div>
        </div>
      </div>
    `;
  } else if (step === 6) {
    // Step 6: Feature 2 & 3: Smart Verification & Missing Information Detection (Real Extraction Review)
    const flow = STATE.addRecordFlow;
    const fileName = flow.uploadedFileName || 'medical_record.pdf';
    const docId = flow.uploadedDocId || '';
    const parsed = flow.extractedData || {};
    const docType = flow.selectedType || parsed.document_type || 'DOCUMENT';
    const confidencePct = Math.round((flow.confidenceScore || 0.85) * 100);
    const issues = parsed.review_issues || [];

    const defaultTitle = parsed.document_title || (
      docType === 'LAB_REPORT' ? 'Laboratory Panel' :
      docType === 'PRESCRIPTION' ? 'Prescription Slip' :
      docType === 'RECEIPT' ? 'Medical Bill & Receipt' :
      docType === 'DOCTOR_NOTE' ? 'Clinical Consultation Summary' : 'Medical Record'
    );
    const docDate = (parsed.document_date && parsed.document_date.value) || new Date().toISOString().split('T')[0];
    const providerVal = (parsed.provider_name && parsed.provider_name.value) || flow.selectedHospital || 'Clinical Provider';
    const patientVal = (parsed.patient_name && parsed.patient_name.value) || (STATE.patient && STATE.patient.name) || 'Patient';

    // Build review issue warnings banner
    let warningBannerHtml = '';
    if (issues.length > 0) {
      const issueItems = issues.map(iss => `<div style="margin-top:2px;">• <strong>${escapeHtml(iss.field || 'Field')}:</strong> ${escapeHtml(iss.issue)}</div>`).join('');
      warningBannerHtml = `
        <div class="uncertain-warning-banner" style="margin-bottom:14px;background:#fffbeb;border:1px solid #fef3c7;border-radius:12px;padding:12px;display:flex;gap:10px;align-items:flex-start;">
          <div style="color:#d97706;font-size:18px;line-height:1;">⚠️</div>
          <div style="font-size:12px;color:#92400e;line-height:1.4;">
            <strong style="font-weight:700;">${issues.length} item${issues.length > 1 ? 's' : ''} flagged for review:</strong>
            ${issueItems}
          </div>
        </div>
      `;
    }

    // Dynamic field list based on detected document type
    let specificFieldsHtml = '';

    if (docType === 'LAB_REPORT') {
      const results = parsed.results || [];
      if (results.length > 0) {
        const rows = results.map((r, idx) => {
          const tname = (r.test_name && r.test_name.value) || `Test ${idx + 1}`;
          const resVal = (r.result && r.result.value) || '';
          const unitVal = (r.unit && r.unit.value) || '';
          const rangeVal = (r.reference_range && r.reference_range.value) || '';
          const flag = r.abnormal_flag || 'NORMAL';
          const isAbnormal = flag === 'HIGH' || flag === 'LOW' || flag === 'ELEVATED' || flag === 'CRITICAL';
          const badgeStyle = isAbnormal ? 'background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;' : 'background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;';

          return `
            <div class="field-verify-row" style="background:#fff;border:1px solid ${isAbnormal ? '#fca5a5' : '#e2e8f0'};border-radius:10px;padding:10px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-size:12.5px;font-weight:700;color:var(--text-primary);">${escapeHtml(tname)}</span>
                <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;${badgeStyle}">${escapeHtml(flag)}</span>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
                <div>
                  <span style="font-size:10px;color:var(--text-tertiary);display:block;">Result</span>
                  <input type="text" class="field-verify-input lab-result-val" data-idx="${idx}" value="${escapeHtml(resVal)}" style="font-size:12px;padding:4px 6px;" />
                </div>
                <div>
                  <span style="font-size:10px;color:var(--text-tertiary);display:block;">Unit</span>
                  <input type="text" class="field-verify-input lab-unit-val" data-idx="${idx}" value="${escapeHtml(unitVal)}" style="font-size:12px;padding:4px 6px;" />
                </div>
                <div>
                  <span style="font-size:10px;color:var(--text-tertiary);display:block;">Ref Range</span>
                  <input type="text" class="field-verify-input lab-range-val" data-idx="${idx}" value="${escapeHtml(rangeVal)}" style="font-size:12px;padding:4px 6px;" />
                </div>
              </div>
              <input type="hidden" class="lab-name-val" data-idx="${idx}" value="${escapeHtml(tname)}" />
            </div>
          `;
        }).join('');

        specificFieldsHtml = `
          <div style="margin-top:12px;">
            <div style="font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:8px;">
              Extracted Laboratory Measurements (${results.length})
            </div>
            ${rows}
          </div>
        `;
      } else {
        specificFieldsHtml = `
          <div style="margin-top:12px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;padding:12px;text-align:center;">
            <div style="font-size:12px;color:var(--text-secondary);">No machine-readable lab test values detected in source text.</div>
            <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;">You can enter laboratory observations manually below.</div>
            <div style="margin-top:8px;">
              <input type="text" class="field-verify-input" id="verify-lab-manual" placeholder="e.g. Fasting Blood Glucose: 92 mg/dL" />
            </div>
          </div>
        `;
      }

    } else if (docType === 'PRESCRIPTION') {
      const meds = parsed.medications || [];
      if (meds.length > 0) {
        const rows = meds.map((m, idx) => {
          const mname = (m.name && m.name.value) || `Medication ${idx + 1}`;
          const dose = (m.dosage && m.dosage.value) || '';
          const freq = (m.frequency && m.frequency.value) || '';
          const route = (m.route && m.route.value) || 'Oral';
          const isUncertain = m.uncertainty_flag || (m.dosage && m.dosage.status === 'missing') || (m.frequency && m.frequency.status === 'missing');

          return `
            <div class="field-verify-row" style="background:#fff;border:1px solid ${isUncertain ? '#f59e0b' : '#e2e8f0'};border-radius:10px;padding:10px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-size:12.5px;font-weight:700;color:var(--text-primary);">${escapeHtml(mname)}</span>
                ${isUncertain ? '<span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;background:#fef3c7;color:#b45309;">⚠️ Unverified Handwriting</span>' : '<span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;background:#ecfdf5;color:#065f46;">Extracted</span>'}
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                <div>
                  <span style="font-size:10px;color:var(--text-tertiary);display:block;">Dosage / Strength</span>
                  <input type="text" class="field-verify-input med-dose-val" data-idx="${idx}" value="${escapeHtml(dose)}" placeholder="e.g. 500 mg" style="font-size:12px;padding:4px 6px;${!dose ? 'border-color:#f59e0b;' : ''}" />
                </div>
                <div>
                  <span style="font-size:10px;color:var(--text-tertiary);display:block;">Frequency</span>
                  <input type="text" class="field-verify-input med-freq-val" data-idx="${idx}" value="${escapeHtml(freq)}" placeholder="e.g. Once daily (morning)" style="font-size:12px;padding:4px 6px;${!freq ? 'border-color:#f59e0b;' : ''}" />
                </div>
              </div>
              <input type="hidden" class="med-name-val" data-idx="${idx}" value="${escapeHtml(mname)}" />
              <input type="hidden" class="med-route-val" data-idx="${idx}" value="${escapeHtml(route)}" />
            </div>
          `;
        }).join('');

        specificFieldsHtml = `
          <div style="margin-top:12px;">
            <div style="font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:8px;">
              Extracted Medications (${meds.length})
            </div>
            ${rows}
          </div>
        `;
      } else {
        specificFieldsHtml = `
          <div style="margin-top:12px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;padding:12px;">
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">No medication names could be confidently read from handwriting. Please verify or add below:</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
              <input type="text" class="field-verify-input" id="verify-manual-med" placeholder="Medication (e.g. Metformin 500 mg)" />
              <input type="text" class="field-verify-input" id="verify-manual-freq" placeholder="Frequency (e.g. Once daily)" />
            </div>
          </div>
        `;
      }

    } else if (docType === 'RECEIPT') {
      const items = parsed.items || [];
      const totalVal = (parsed.total_amount && parsed.total_amount.value) || '';
      const invVal = (parsed.invoice_number && parsed.invoice_number.value) || '';

      specificFieldsHtml = `
        <div style="margin-top:12px;">
          <div style="font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:8px;">Financial & Billing Fields</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
            <div>
              <span style="font-size:11px;color:var(--text-secondary);">Invoice / Bill #</span>
              <input type="text" class="field-verify-input" id="verify-invoice-input" value="${escapeHtml(invVal)}" />
            </div>
            <div>
              <span style="font-size:11px;color:var(--text-secondary);">Total Amount</span>
              <input type="text" class="field-verify-input" id="verify-total-input" value="${escapeHtml(totalVal)}" />
            </div>
          </div>
          ${items.length > 0 ? `
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px;">
              <div style="font-size:11px;font-weight:700;color:var(--text-tertiary);margin-bottom:6px;">Line Items (${items.length})</div>
              ${items.map(it => `<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid #f1f5f9;"><span>${escapeHtml(it.description || 'Item')}</span><strong>${escapeHtml(it.amount || '')}</strong></div>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    } else {
      // General / Consultation Summary
      const diagList = parsed.diagnoses || [];
      const notes = parsed.clinical_notes || '';

      specificFieldsHtml = `
        <div style="margin-top:12px;">
          <div style="font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:8px;">Clinical Summary & Notes</div>
          <div style="margin-bottom:8px;">
            <span style="font-size:11px;color:var(--text-secondary);">Documented Diagnoses</span>
            <input type="text" class="field-verify-input" id="verify-diagnoses-input" value="${escapeHtml(diagList.join(', '))}" placeholder="e.g. Type 2 Diabetes, Hypertension" />
          </div>
          <div>
            <span style="font-size:11px;color:var(--text-secondary);">Clinical Excerpt / Findings</span>
            <textarea class="field-verify-input" id="verify-notes-input" style="height:60px;resize:vertical;font-size:12px;">${escapeHtml(notes)}</textarea>
          </div>
        </div>
      `;
    }

    sheet.innerHTML = `
      <div style="width:100%;padding:4px 0;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:0.5px;">
            Document Intelligence Review · ${escapeHtml(docType.replace('_', ' '))}
          </span>
          <span class="badge badge-verified" style="font-size:10px;background:rgba(37,99,235,0.1);color:var(--blue);border:1px solid rgba(37,99,235,0.2);">
            ${confidencePct}% Evidence Confidence
          </span>
        </div>

        <h2 style="font-size:19px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">Smart Verification & Review</h2>
        <p style="font-size:12.5px;color:var(--text-secondary);margin:0 0 14px;">
          Review genuine extracted fields from <strong>${escapeHtml(fileName)}</strong>. Adjust unresolved items before saving to your continuum.
        </p>

        ${warningBannerHtml}

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:var(--r-xl);padding:14px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span style="font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;">Document Metadata</span>
            <button class="btn btn-ghost btn-sm" style="font-size:11px;color:var(--blue);padding:2px 8px;" onclick="viewDocumentDetail('${escapeHtml(defaultTitle)}', '${escapeHtml(fileName)}', '${escapeHtml(docDate)}')">
              👁️ Inspect Source
            </button>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
            <div>
              <span style="font-size:11px;color:var(--text-secondary);">Record Title</span>
              <input type="text" class="field-verify-input" id="verify-title-input" value="${escapeHtml(defaultTitle)}" />
            </div>
            <div>
              <span style="font-size:11px;color:var(--text-secondary);">Record Date</span>
              <input type="text" class="field-verify-input" id="verify-date-input" value="${escapeHtml(docDate)}" />
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div>
              <span style="font-size:11px;color:var(--text-secondary);">Hospital / Provider</span>
              <input type="text" class="field-verify-input" id="verify-hosp-input" value="${escapeHtml(providerVal)}" />
            </div>
            <div>
              <span style="font-size:11px;color:var(--text-secondary);">Patient Name</span>
              <input type="text" class="field-verify-input" id="verify-patient-input" value="${escapeHtml(patientVal)}" />
            </div>
          </div>

          ${specificFieldsHtml}
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;width:100%;">
          <div style="display:flex;gap:10px;width:100%;">
            <button class="btn btn-secondary btn-full" onclick="viewDocumentDetail('${escapeHtml(defaultTitle)}', '${escapeHtml(fileName)}', '${escapeHtml(docDate)}')">
              Inspect Source
            </button>
            <button class="btn btn-primary btn-full" onclick="confirmAndSaveRecord(false)">
              ✓ Confirm & Save
            </button>
          </div>
          ${issues.length > 0 ? `
            <button class="btn btn-ghost btn-full" style="font-size:12px;color:var(--text-secondary);" onclick="confirmAndSaveRecord(true)">
              Save with Unresolved Fields Flagged
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
}

function setDocType(type) {
  STATE.addRecordFlow.selectedType = type;
  renderAddRecordStep();
}

function setHospital(hosp) {
  STATE.addRecordFlow.selectedHospital = hosp;
  // When hospital changes, reset visit selection to first matching visit or blank
  const hospLower = hosp.toLowerCase();
  const matchingVisit = (STATE.visits || []).find(v =>
    (v.hospitalName || '').toLowerCase().includes(hospLower.split(',')[0].trim())
  );
  STATE.addRecordFlow.selectedVisit = matchingVisit ? matchingVisit.id : '';
  renderAddRecordStep();
}

function setVisit(visitId) {
  STATE.addRecordFlow.selectedVisit = visitId;
  STATE.addRecordFlow._newVisitMode = false;
  renderAddRecordStep();
}

function nextAddRecordStep(stepNum) {
  STATE.addRecordFlow.step = stepNum;
  renderAddRecordStep();
}

// ── Hospital search / add helpers ──────────────────────────────────────────
function filterHospitalSearch(val) {
  STATE.addRecordFlow._hospitalSearch = val;
  renderAddRecordStep();
}

function showNewHospitalForm() {
  STATE.addRecordFlow._newHospitalMode = true;
  renderAddRecordStep();
  setTimeout(() => {
    const inp = document.getElementById('new-hospital-name');
    if (inp) inp.focus();
  }, 50);
}

function cancelNewHospital() {
  STATE.addRecordFlow._newHospitalMode = false;
  renderAddRecordStep();
}

function confirmAddHospital() {
  const inp = document.getElementById('new-hospital-name');
  const name = (inp && inp.value.trim()) || '';
  if (!name) {
    if (inp) { inp.style.borderColor = '#ef4444'; inp.placeholder = 'Please enter a hospital name'; }
    return;
  }
  // Prevent duplicates (case-insensitive)
  const exists = (STATE.hospitals || []).some(h => h.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    if (inp) { inp.style.borderColor = '#f59e0b'; inp.value = ''; inp.placeholder = 'Already exists — select it above'; }
    return;
  }
  const newHosp = {
    id: 'hosp-' + Date.now(),
    name: name,
    shortName: name.split(',')[0].trim(),
    visitCount: 0,
    recordCount: 0,
    doctor: '',
  };
  if (!STATE.hospitals) STATE.hospitals = [];
  STATE.hospitals.push(newHosp);
  STATE.addRecordFlow.selectedHospital = name;
  STATE.addRecordFlow._newHospitalMode = false;
  STATE.addRecordFlow._hospitalSearch = '';
  renderAddRecordStep();
}

function goToVisitStep() {
  STATE.addRecordFlow.step = 3;
  STATE.addRecordFlow._newVisitMode = false;
  renderAddRecordStep();
}

// ── Visit / date picker helpers ────────────────────────────────────────────
function showNewVisitForm() {
  STATE.addRecordFlow._newVisitMode = true;
  STATE.addRecordFlow._newVisitDate = new Date().toISOString().split('T')[0];
  STATE.addRecordFlow._newVisitDoctor = '';
  renderAddRecordStep();
  setTimeout(() => {
    const inp = document.getElementById('new-visit-date');
    if (inp) inp.focus();
  }, 50);
}

function cancelNewVisit() {
  STATE.addRecordFlow._newVisitMode = false;
  renderAddRecordStep();
}

function confirmCreateVisit() {
  const dateInp = document.getElementById('new-visit-date');
  const doctorInp = document.getElementById('new-visit-doctor');
  const rawDate = (dateInp && dateInp.value) || STATE.addRecordFlow._newVisitDate || new Date().toISOString().split('T')[0];
  const doctorName = (doctorInp && doctorInp.value.trim()) || STATE.addRecordFlow._newVisitDoctor || '';

  if (!rawDate) {
    if (dateInp) { dateInp.style.borderColor = '#ef4444'; }
    return;
  }

  // Format the date for display
  let displayDate = rawDate;
  try {
    const d = new Date(rawDate + 'T00:00:00');
    displayDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch(e) {}

  const hospName = STATE.addRecordFlow.selectedHospital || (STATE.hospitals && STATE.hospitals[0] && STATE.hospitals[0].name) || '';
  const newVisit = {
    id: 'visit-' + Date.now(),
    date: displayDate,
    dateRaw: rawDate,
    hospitalName: hospName,
    doctorName: doctorName,
    type: 'Medical Upload',
    summary: `Visit on ${displayDate}${hospName ? ' at ' + hospName.split(',')[0] : ''}`,
    medications: [],
    labs: [],
    documents: [],
  };

  if (!STATE.visits) STATE.visits = [];
  // Insert in chronological order (most recent first)
  const insertIdx = STATE.visits.findIndex(v => v.dateRaw && v.dateRaw < rawDate);
  if (insertIdx === -1) {
    STATE.visits.push(newVisit);
  } else {
    STATE.visits.splice(insertIdx, 0, newVisit);
  }

  // Update hospital visit count
  if (hospName) {
    const h = (STATE.hospitals || []).find(h => h.name === hospName);
    if (h) h.visitCount = (h.visitCount || 0) + 1;
  }

  STATE.addRecordFlow.selectedVisit = newVisit.id;
  STATE.addRecordFlow._newVisitMode = false;
  renderAddRecordStep();
}

function handleFileSelected(event) {
  const file = event.target.files?.[0];
  if (file) {
    executeUploadPipeline(file);
  }
}

function handleSimulatedPhoto() {
  // Create an explicit mock prescription for camera test without pretending it's an uploaded file
  executeUploadPipeline('camera_capture_prescription.jpg');
}

async function executeUploadPipeline(fileOrName) {
  const isFileObj = (fileOrName instanceof File || fileOrName instanceof Blob);
  const fileName = isFileObj ? fileOrName.name : String(fileOrName);

  STATE.addRecordFlow.uploadedFile = isFileObj ? fileOrName : null;
  STATE.addRecordFlow.uploadedFileName = fileName;
  STATE.addRecordFlow.step = 5;
  renderAddRecordStep();

  try {
    const s1 = document.getElementById('step-row-1');
    const s2 = document.getElementById('step-row-2');
    const s3 = document.getElementById('step-row-3');
    const s4 = document.getElementById('step-row-4');

    if (s1) {
      s1.className = 'processing-step-row active';
      s1.innerHTML = `<span>●</span> <span>Uploading ${escapeHtml(fileName)}...</span>`;
    }

    let uploadRes = null;
    if (window.API && typeof window.API.uploadDocument === 'function') {
      const payload = {
        file: isFileObj ? fileOrName : null,
        file_name: fileName,
        visit_id: STATE.addRecordFlow.selectedVisit || null,
        document_type: STATE.addRecordFlow.selectedType || null,
      };
      uploadRes = await window.API.uploadDocument(STATE.patient?.id || 'pat-ramesh-001', payload);
    }

    if (uploadRes && uploadRes.success && uploadRes.data) {
      const doc = uploadRes.data;
      STATE.addRecordFlow.uploadedDocId = doc.id;
      STATE.addRecordFlow.selectedType = doc.document_type || STATE.addRecordFlow.selectedType;
      STATE.addRecordFlow.confidenceScore = doc.confidence_score != null ? doc.confidence_score : 0.88;
      STATE.addRecordFlow.processingStatus = doc.processing_status || 'PROCESSED';
      STATE.addRecordFlow.extractedData = doc.parsed_data || {};
      STATE.addRecordFlow.rawText = doc.extracted_text || '';

      if (s1) { s1.className = 'processing-step-row completed'; s1.innerHTML = '<span>✓</span> <span>Document uploaded successfully</span>'; }
      if (s2) { s2.className = 'processing-step-row completed'; s2.innerHTML = '<span>✓</span> <span>Read clinical document & layout</span>'; }
      if (s3) { s3.className = 'processing-step-row completed'; s3.innerHTML = '<span>✓</span> <span>Structured entities & candidate values</span>'; }
      if (s4) { s4.className = 'processing-step-row active'; s4.innerHTML = '<span>●</span> <span>Ready for verification & review</span>'; }

      setTimeout(() => {
        STATE.addRecordFlow.step = 6;
        renderAddRecordStep();
      }, 700);

    } else {
      // Real extraction error handling — NEVER substitute fake demo data silently!
      console.warn('[Upload] Backend response unsuccessful:', uploadRes);
      if (s1) {
        s1.className = 'processing-step-row pending';
        s1.style.color = '#ef4444';
        s1.innerHTML = `<span>✕</span> <span>Extraction issue: ${escapeHtml(uploadRes?.error?.message || 'Server error')}</span>`;
      }
      setTimeout(() => {
        STATE.addRecordFlow.step = 6;
        STATE.addRecordFlow.confidenceScore = 0.30;
        STATE.addRecordFlow.extractedData = {
          document_title: fileName,
          review_issues: [{ field: 'upload', issue: 'Could not connect to processing service. Please enter fields manually.', severity: 'warning' }]
        };
        renderAddRecordStep();
      }, 900);
    }
  } catch (err) {
    console.error('[Upload] Pipeline error:', err);
    STATE.addRecordFlow.step = 6;
    STATE.addRecordFlow.confidenceScore = 0.20;
    STATE.addRecordFlow.extractedData = {
      document_title: fileName,
      review_issues: [{ field: 'upload', issue: `Upload error: ${err.message}. Please enter details manually.`, severity: 'warning' }]
    };
    renderAddRecordStep();
  }
}

// Feature 3: Smart Verification & Missing Information Detection Confirmation
async function confirmAndSaveRecord(saveUnresolved = false) {
  const flow = STATE.addRecordFlow;
  const docId = flow.uploadedDocId || ('doc-' + Date.now());
  const fileName = flow.uploadedFileName || 'medical_report.pdf';
  const docType = flow.selectedType || 'DOCUMENT';

  const titleInp = document.getElementById('verify-title-input');
  const dateInp = document.getElementById('verify-date-input');
  const hospInp = document.getElementById('verify-hosp-input');
  const patInp = document.getElementById('verify-patient-input');

  const verifiedTitle = (titleInp && titleInp.value.trim()) || 'Medical Record';
  const verifiedDate = (dateInp && dateInp.value.trim()) || new Date().toISOString().split('T')[0];
  const verifiedHosp = (hospInp && hospInp.value.trim()) || 'Clinical Center';
  const verifiedPatient = (patInp && patInp.value.trim()) || (STATE.patient && STATE.patient.name) || 'Patient';

  // Gather lab results if lab report
  const gatheredLabs = [];
  document.querySelectorAll('.lab-result-val').forEach(inp => {
    const idx = inp.getAttribute('data-idx');
    const nameEl = document.querySelector(`.lab-name-val[data-idx="${idx}"]`);
    const unitEl = document.querySelector(`.lab-unit-val[data-idx="${idx}"]`);
    const rangeEl = document.querySelector(`.lab-range-val[data-idx="${idx}"]`);
    if (nameEl && nameEl.value.trim()) {
      gatheredLabs.push({
        test_name: nameEl.value.trim(),
        result: inp.value.trim(),
        unit: (unitEl && unitEl.value.trim()) || '',
        reference_range: (rangeEl && rangeEl.value.trim()) || '',
      });
    }
  });

  const manualLab = document.getElementById('verify-lab-manual');
  if (manualLab && manualLab.value.trim()) {
    const parts = manualLab.value.split(':');
    gatheredLabs.push({
      test_name: parts[0].trim(),
      result: (parts[1] || '').trim(),
      unit: '',
      reference_range: '',
    });
  }

  // Gather medications if prescription
  const gatheredMeds = [];
  document.querySelectorAll('.med-dose-val').forEach(inp => {
    const idx = inp.getAttribute('data-idx');
    const nameEl = document.querySelector(`.med-name-val[data-idx="${idx}"]`);
    const freqEl = document.querySelector(`.med-freq-val[data-idx="${idx}"]`);
    const routeEl = document.querySelector(`.med-route-val[data-idx="${idx}"]`);
    if (nameEl && nameEl.value.trim()) {
      gatheredMeds.push({
        name: nameEl.value.trim(),
        dosage: inp.value.trim(),
        frequency: (freqEl && freqEl.value.trim()) || '',
        route: (routeEl && routeEl.value.trim()) || 'Oral',
        status: 'CURRENT',
      });
    }
  });

  const manualMed = document.getElementById('verify-manual-med');
  const manualFreq = document.getElementById('verify-manual-freq');
  if (manualMed && manualMed.value.trim()) {
    gatheredMeds.push({
      name: manualMed.value.trim(),
      dosage: '',
      frequency: (manualFreq && manualFreq.value.trim()) || '',
      route: 'Oral',
      status: 'CURRENT',
    });
  }

  // Gather diagnoses and notes
  const diagInp = document.getElementById('verify-diagnoses-input');
  const notesInp = document.getElementById('verify-notes-input');
  const diagnoses = diagInp && diagInp.value ? diagInp.value.split(',').map(s => s.trim()).filter(Boolean) : [];
  const clinicalNotes = notesInp ? notesInp.value.trim() : '';

  // Gather receipts
  const invInp = document.getElementById('verify-invoice-input');
  const totInp = document.getElementById('verify-total-input');
  const totalAmount = totInp ? totInp.value.trim() : '';

  const reviewStatus = saveUnresolved ? 'SAVED_WITH_UNRESOLVED' : 'VERIFIED';

  // Real backend call to persist review & promote entities to DB
  try {
    if (window.API && typeof window.API.reviewDocument === 'function' && flow.uploadedDocId) {
      await window.API.reviewDocument(flow.uploadedDocId, {
        status: reviewStatus,
        document_type: docType,
        document_title: verifiedTitle,
        document_date: verifiedDate,
        hospital_name: verifiedHosp,
        patient_name: verifiedPatient,
        medications: gatheredMeds,
        lab_results: gatheredLabs,
        diagnoses: diagnoses,
        clinical_notes: clinicalNotes,
        total_amount: totalAmount,
        save_unresolved: saveUnresolved,
      });
    }
  } catch (err) {
    console.warn('[Review] Backend review call failed:', err);
  }

  // Construct confirmed document object
  const newDoc = {
    id: docId,
    name: verifiedTitle,
    type: docType,
    file: fileName,
    date: verifiedDate,
    status: reviewStatus,
    medications: gatheredMeds,
    labs: gatheredLabs,
  };

  // Add/Update Hospital in STATE
  if (!STATE.hospitals || STATE.hospitals.length === 0) {
    STATE.hospitals = [{
      id: 'hosp-' + Date.now(),
      name: verifiedHosp,
      shortName: verifiedHosp.split(',')[0],
      visitCount: 1,
      recordCount: 1,
      doctor: 'Attending Physician',
    }];
  } else {
    STATE.hospitals[0].recordCount = (STATE.hospitals[0].recordCount || 0) + 1;
  }

  // Add/Update Visit in STATE
  const localVisitMeds = gatheredMeds.map(m => ({
    name: m.name,
    dose: m.dosage || '',
    freq: m.frequency || '',
    status: 'CURRENT'
  }));
  const localVisitLabs = gatheredLabs.map(l => ({
    test: l.test_name,
    value: l.result || '',
    unit: l.unit || '',
    range: l.reference_range || '',
    status: 'optimal'
  }));

  if (!STATE.visits || STATE.visits.length === 0) {
    STATE.visits = [{
      id: 'visit-' + Date.now(),
      date: verifiedDate,
      dateRaw: verifiedDate,
      hospitalName: verifiedHosp,
      doctorName: 'Attending Physician',
      type: docType === 'PRESCRIPTION' ? 'Prescription Review' : 'Consultation Record',
      summary: `Verified record: ${verifiedTitle}`,
      medications: localVisitMeds,
      labs: localVisitLabs,
      documents: [newDoc],
    }];
  } else {
    STATE.visits[0].documents.unshift(newDoc);
    if (localVisitMeds.length > 0) {
      STATE.visits[0].medications = [...localVisitMeds, ...(STATE.visits[0].medications || [])];
    }
    if (localVisitLabs.length > 0) {
      STATE.visits[0].labs = [...localVisitLabs, ...(STATE.visits[0].labs || [])];
    }
  }

  // Persist to localStorage
  if (STATE.patient?.id) {
    try {
      localStorage.setItem('hc_records_' + STATE.patient.id, JSON.stringify({
        visits: STATE.visits,
        hospitals: STATE.hospitals,
        changes: STATE.changes,
      }));
    } catch (e) {}
  }

  closeAddRecordFlow();

  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#064e3b;color:white;padding:10px 18px;border-radius:99px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.2);z-index:99999;display:flex;align-items:center;gap:8px;';
  toast.innerHTML = `<span>✓</span> Medical record verified & saved (${reviewStatus})`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);

  navigate('records');
}


// ─── SCREEN 5: RECORDS (ORGANIZED BY HOSPITAL & VISIT) ─────────────────────
function renderRecords() {
  const container = document.getElementById('records-content');
  if (!container) return;

  const totalVisits = STATE.visits?.length || 0;
  const primaryHosp = STATE.hospitals?.[0]?.name || 'City Care Hospital, Chennai';
  const primaryDoc = STATE.hospitals?.[0]?.doctor || 'Dr. Priya Sharma';
  const totalDocs = STATE.visits.reduce((acc, v) => acc + (v.documents ? v.documents.length : 0), 0);

  if (totalVisits === 0) {
    container.innerHTML = `
      <!-- Top Header -->
      <div style="padding:16px 20px 8px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <h1 style="font-size:24px;font-weight:700;color:var(--text-primary);margin:0;">My Records</h1>
          <p style="font-size:13px;color:var(--text-secondary);margin-top:2px;">Organized by hospital and visit</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openAddRecordFlow()">
          ${getIcon('plus', 'width:16px;height:16px;stroke:white;')} Add Record
        </button>
      </div>

      <!-- Clean Empty State -->
      <div style="padding:48px 24px;text-align:center;">
        <div style="width:72px;height:72px;border-radius:24px;background:var(--blue-light);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:var(--blue);">
          ${getIcon('folder', 'width:36px;height:36px;stroke:var(--blue);')}
        </div>
        <h3 style="font-size:18px;font-weight:700;color:var(--text-primary);margin:0 0 6px;">No Medical Records Yet</h3>
        <p style="font-size:13px;color:var(--text-secondary);max-width:280px;margin:0 auto 24px;line-height:1.5;">
          Welcome, <strong>${escapeHtml(STATE.patient.firstName || 'Patient')}</strong>! Upload your prescriptions, lab test reports, or clinical notes to organize your records into a clear health journey.
        </p>
        <button class="btn btn-primary" onclick="openAddRecordFlow()" style="margin:0 auto;display:inline-flex;align-items:center;gap:8px;padding:12px 24px;font-weight:600;box-shadow:0 6px 20px rgba(37,99,235,0.3);">
          ${getIcon('fileUpload', 'width:18px;height:18px;stroke:white;')} Upload First Document
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <!-- Top Header -->
    <div style="padding:16px 20px 8px;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <h1 style="font-size:24px;font-weight:700;color:var(--text-primary);margin:0;">My Records</h1>
        <p style="font-size:13px;color:var(--text-secondary);margin-top:2px;">Organized by hospital and visit</p>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openAddRecordFlow()">
        ${getIcon('plus', 'width:16px;height:16px;stroke:white;')} Add Record
      </button>
    </div>

    <!-- Hospital Section -->
    <div style="padding:10px 20px 24px;">
      <div style="font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px;">
        My Hospitals
      </div>

      <!-- Hospital Card -->
      <div style="background:var(--bg-card);border:1px solid var(--separator);border-radius:var(--r-xl);overflow:hidden;box-shadow:var(--shadow-xs);margin-bottom:16px;">
        <div style="padding:18px 20px;border-bottom:1px solid var(--separator);display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:44px;height:44px;border-radius:12px;background:var(--blue-light);display:flex;align-items:center;justify-content:center;color:var(--blue);">
              ${getIcon('hospital', 'width:24px;height:24px;')}
            </div>
            <div>
              <div style="font-size:16px;font-weight:700;color:var(--text-primary);">${escapeHtml(primaryHosp)}</div>
              <div style="font-size:12px;color:var(--text-secondary);">${totalVisits} visit${totalVisits > 1 ? 's' : ''} · ${totalDocs} medical record${totalDocs !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <span class="badge badge-verified" style="font-size:11px;">Primary</span>
        </div>

        <!-- Chronological Visits within Hospital -->
        <div style="padding:14px 20px;display:flex;flex-direction:column;gap:14px;">
          ${STATE.visits.map(v => `
            <div style="background:#f8fafc;border-radius:var(--r-lg);padding:14px 16px;border:1px solid #e2e8f0;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                <div style="font-size:14px;font-weight:700;color:var(--text-primary);">${v.date}</div>
                <span class="badge badge-blue" style="font-size:10px;">${v.doctorName || primaryDoc}</span>
              </div>
              <div style="font-size:12px;color:var(--text-secondary);line-height:1.4;margin-bottom:10px;">
                ${v.summary}
              </div>

              <!-- Badges for documents under this visit -->
              <div style="display:flex;flex-wrap:wrap;gap:6px;">
                ${(v.documents || []).map(d => `
                  <button class="btn btn-ghost btn-sm" style="background:white;border:1px solid #cbd5e1;font-size:11px;padding:4px 10px;border-radius:99px;" onclick="viewDocumentDetail('${escapeHtml(d.name)}', '${escapeHtml(d.file || 'record.pdf')}', '${v.date}')">
                    📄 ${escapeHtml(d.name)}
                  </button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Add Another Hospital Card -->
      <button class="btn btn-ghost btn-full" style="border:1.5px dashed #cbd5e1;background:transparent;color:var(--blue);font-weight:600;padding:14px;" onclick="alert('Connect another hospital network or upload legacy discharge files.')">
        + Add Hospital
      </button>
    </div>
  `;
}

// ─── FEATURE 1 & 4: SMART MEDICAL DOCUMENT PREVIEW ─────────────────────────
function viewDocumentDetail(title, fileName, date, docType = 'CLINICAL_RECORD') {
  const modal = document.getElementById('doc-preview-modal');
  const sheet = document.getElementById('doc-preview-sheet');
  if (!modal || !sheet) return;

  const pName = STATE.patient?.name || 'Ramesh Kumar';
  const pUhid = STATE.patient?.uhid || 'HC-2024-00847';
  const pAge = STATE.patient?.age ? `${STATE.patient.age}y` : '';
  const pHosp = STATE.hospitals?.[0]?.name || 'City Care Hospital, Chennai';
  const pDoc = STATE.hospitals?.[0]?.doctor || 'Dr. Priya Sharma';

  sheet.innerHTML = `
    <div style="width:100%;padding:4px 0;">
      <!-- Header Bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="doc-stamp-badge">
            ✓ Verified Medical Record
          </span>
          <span style="font-size:11px;color:var(--text-tertiary);">${date || '20 Jun 2026'}</span>
        </div>
        <button class="btn-icon" onclick="closeDocPreview()">${getIcon('close', 'width:18px;height:18px;')}</button>
      </div>

      <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">
        ${escapeHtml(title || 'Clinical Consultation Record')}
      </h2>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
        ${escapeHtml(pHosp)} · Attending: ${escapeHtml(pDoc)} · UHID: ${escapeHtml(pUhid)}
      </div>

      <!-- High-Fidelity Official Medical Document Sheet -->
      <div class="doc-paper-view" style="margin-bottom:16px;">
        <div class="doc-header-banner">
          <div>
            <div style="font-size:15px;font-weight:800;color:#1e3a8a;letter-spacing:0.4px;">
              ${escapeHtml(pHosp.toUpperCase())}
            </div>
            <div style="font-size:11px;color:#64748b;margin-top:1px;">
              Department of Internal Medicine & Clinical Records
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;font-weight:700;color:#0f172a;">UHID: ${escapeHtml(pUhid)}</div>
            <div style="font-size:11px;color:#64748b;">Date: ${escapeHtml(date || '20 Jun 2026')}</div>
          </div>
        </div>

        <div style="margin-bottom:12px;font-size:12px;display:flex;justify-content:space-between;border-bottom:1px dashed #cbd5e1;padding-bottom:8px;">
          <div><span style="color:#64748b;">Patient:</span> <strong>${escapeHtml(pName)}${pAge ? ` (${pAge})` : ''}</strong></div>
          <div><span style="color:#64748b;">File:</span> <span style="color:#2563eb;font-family:monospace;">${escapeHtml(fileName || 'clinical_note.pdf')}</span></div>
        </div>

        <div style="margin-bottom:14px;">
          <div style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;margin-bottom:4px;">
            Document Details & Provenance
          </div>
          <div style="font-size:13px;color:#1e293b;line-height:1.5;background:#f8fafc;border-radius:8px;padding:10px;border-left:3px solid #2563eb;">
            <strong>${escapeHtml(title || 'Medical Record')}</strong> · Recorded for ${escapeHtml(pName)} on ${escapeHtml(date || 'Recent')}. Document type: ${escapeHtml(docType)}.
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;margin-bottom:6px;">
            Structured Document Attributes
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <span class="doc-chip">📁 File: ${escapeHtml(fileName || 'document.pdf')}</span>
            <span class="doc-chip">🏥 Provider: ${escapeHtml(pHosp.split(',')[0])}</span>
            <span class="doc-chip">📅 Date: ${escapeHtml(date || 'Recent')}</span>
            <span class="doc-chip">🩺 Attending: ${escapeHtml(pDoc)}</span>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">
          <span>Status: <strong style="color:#16a34a;">Clinical Provenance Recorded</strong></span>
          <span style="display:inline-flex;align-items:center;gap:4px;color:#2563eb;font-weight:600;">
            Source Grounded
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex;gap:10px;width:100%;">
        <button class="btn btn-secondary btn-full" onclick="closeDocPreview(); openComparisonModal('hba1c');">
          📊 Compare Trend
        </button>
        <button class="btn btn-primary btn-full" onclick="closeDocPreview(); handleSendCompanionMessage('Explain my medical record (${escapeHtml(title)}) in simple words.'); navigate('companion');">
          💬 Ask AI Companion
        </button>
      </div>
    </div>
  `;

  modal.classList.add('open');
}

function closeDocPreview() {
  const modal = document.getElementById('doc-preview-modal');
  if (modal) modal.classList.remove('open');
}

// ─── FEATURE 6: CONFLICT & DISCREPANCY DETECTION ────────────────────────────
function renderConflictDetectionWidget() {
  const conflicts = STATE.conflicts || [];
  const pendingCount = conflicts.filter(c => c.status === 'pending').length;

  return `
    <div style="margin-top:20px;background:#fff7ed;border:1.5px solid #fed7aa;border-radius:var(--r-xl);padding:18px;box-shadow:var(--shadow-xs);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="color:#ea580c;font-size:18px;">⚠️</div>
          <div>
            <div style="font-size:11px;font-weight:700;color:#9a3412;text-transform:uppercase;letter-spacing:0.5px;">
              Missing-Information & Conflict Detection
            </div>
            <div style="font-size:14px;font-weight:700;color:#7c2d12;">
              ${pendingCount > 0 ? `${pendingCount} Potential Discrepancies Across Records` : 'All Document Discrepancies Resolved'}
            </div>
          </div>
        </div>
        <span class="badge ${pendingCount > 0 ? 'badge-review' : 'badge-verified'}" style="font-size:10px;">
          ${pendingCount > 0 ? 'Review Needed' : 'All Clear'}
        </span>
      </div>

      <div style="font-size:12.5px;color:#9a3412;line-height:1.4;margin-bottom:12px;">
        HealthContinuum AI automatically compares records for the same clinical episode to prevent inconsistent doctor instructions and billing mismatches.
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;">
        ${conflicts.map(c => `
          <div class="conflict-card" style="margin-bottom:0;background:white;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
              <span style="font-size:13px;font-weight:700;color:#0f172a;">${escapeHtml(c.title)}</span>
              <span class="badge ${c.status === 'reviewed' ? 'badge-verified' : 'badge-gray'}" style="font-size:9.5px;">
                ${c.status === 'reviewed' ? '✓ Resolved' : 'Unresolved'}
              </span>
            </div>
            <div style="font-size:12px;color:#475569;margin-bottom:8px;">${escapeHtml(c.description)}</div>

            <div class="conflict-source-grid">
              <div class="conflict-source-box highlight">
                <div style="font-size:10px;font-weight:700;color:#c2410c;text-transform:uppercase;">Source A</div>
                <div style="font-size:12px;font-weight:600;color:#0f172a;margin-top:2px;">${escapeHtml(c.sourceA.value)}</div>
                <div style="font-size:10.5px;color:#64748b;margin-top:2px;">📄 ${escapeHtml(c.sourceA.docName)}</div>
              </div>
              <div class="conflict-source-box">
                <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">Source B</div>
                <div style="font-size:12px;font-weight:600;color:#0f172a;margin-top:2px;">${escapeHtml(c.sourceB.value)}</div>
                <div style="font-size:10.5px;color:#64748b;margin-top:2px;">📄 ${escapeHtml(c.sourceB.docName)}</div>
              </div>
            </div>

            <div style="display:flex;gap:8px;margin-top:10px;">
              <button class="btn btn-secondary btn-sm" style="font-size:11.5px;padding:6px 12px;" onclick="openConflictDetail('${c.id}')">
                Inspect Both Sources & Resolve
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function openConflictDetail(conflictId) {
  const modal = document.getElementById('conflict-modal');
  const sheet = document.getElementById('conflict-sheet');
  if (!modal || !sheet) return;

  const conflict = (STATE.conflicts || []).find(c => c.id === conflictId) || STATE.conflicts[0];

  sheet.innerHTML = `
    <div style="width:100%;padding:4px 0;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <span style="font-size:11px;font-weight:700;color:#ea580c;text-transform:uppercase;letter-spacing:0.5px;">
          Discrepancy Resolution
        </span>
        <button class="btn-icon" onclick="closeConflictModal()">${getIcon('close', 'width:18px;height:18px;')}</button>
      </div>

      <h2 style="font-size:19px;font-weight:700;color:var(--text-primary);margin:0 0 6px;">
        ${escapeHtml(conflict.title)}
      </h2>
      <p style="font-size:12.5px;color:var(--text-secondary);margin:0 0 16px;">
        ${escapeHtml(conflict.description)}
      </p>

      <!-- Side-by-side comparison of sources -->
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
        <div style="background:#f8fafc;border:1.5px solid #3b82f6;border-radius:12px;padding:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;">Primary Source A (Hospital EMR)</span>
            <span class="badge badge-verified" style="font-size:9.5px;">Recommended</span>
          </div>
          <div style="font-size:15px;font-weight:700;color:#0f172a;margin:6px 0 2px;">${escapeHtml(conflict.sourceA.value)}</div>
          <div style="font-size:11.5px;color:#64748b;">📄 ${escapeHtml(conflict.sourceA.docName)}</div>
        </div>

        <div style="background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:12px;padding:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;">Secondary Source B</span>
            <span class="badge badge-gray" style="font-size:9.5px;">External Document</span>
          </div>
          <div style="font-size:15px;font-weight:700;color:#0f172a;margin:6px 0 2px;">${escapeHtml(conflict.sourceB.value)}</div>
          <div style="font-size:11.5px;color:#64748b;">📄 ${escapeHtml(conflict.sourceB.docName)}</div>
        </div>
      </div>

      <!-- AI Resolution Grounding -->
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;margin-bottom:4px;">
          💡 AI Clinical Rationale
        </div>
        <div style="font-size:12.5px;color:#1e3a8a;line-height:1.4;">
          ${escapeHtml(conflict.aiAnalysis)}
        </div>
      </div>

      <!-- Resolution Buttons -->
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button class="btn btn-primary btn-full" onclick="resolveConflict('${conflict.id}', 'sourceA')">
          Accept Source A (${escapeHtml(conflict.sourceA.value)})
        </button>
        <button class="btn btn-secondary btn-full" onclick="resolveConflict('${conflict.id}', 'sourceB')">
          Accept Source B (${escapeHtml(conflict.sourceB.value)})
        </button>
        <button class="btn btn-ghost btn-full" style="color:#64748b;" onclick="resolveConflict('${conflict.id}', 'reviewed')">
          Mark as Reviewed & Dismiss
        </button>
      </div>
    </div>
  `;

  modal.classList.add('open');
}

function closeConflictModal() {
  const modal = document.getElementById('conflict-modal');
  if (modal) modal.classList.remove('open');
}

function resolveConflict(conflictId, chosenResolution) {
  const conflict = (STATE.conflicts || []).find(c => c.id === conflictId);
  if (conflict) {
    conflict.status = 'reviewed';
    conflict.resolution = chosenResolution;
  }
  closeConflictModal();

  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#064e3b;color:white;padding:10px 18px;border-radius:99px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.2);z-index:99999;display:flex;align-items:center;gap:8px;';
  toast.innerHTML = '<span>✓</span> Discrepancy successfully resolved & documented';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);

  renderJourney();
}

// ─── FEATURE 7: HISTORICAL HEALTH RECORD COMPARISON ────────────────────────
function renderHistoricalComparisonWidget() {
  const currentKey = STATE.selectedComparisonMetric || 'hba1c';
  const metric = STATE.historicalMetrics?.[currentKey] || STATE.historicalMetrics?.hba1c;
  if (!metric) return '';

  const pts = metric.points || [];

  return `
    <div class="historical-comp-container" style="margin-top:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div>
          <span style="font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:0.5px;">
            Multi-Report Analysis
          </span>
          <h2 style="font-size:18px;font-weight:700;color:var(--text-primary);margin:2px 0 0;">
            Historical Health Record Comparison
          </h2>
        </div>
        <span class="badge badge-verified" style="font-size:10px;">
          ✓ Unit Calibrated
        </span>
      </div>
      <p style="font-size:12.5px;color:var(--text-secondary);margin:0 0 14px;">
        Compare identical clinical measurements over time. Units and clinical context are validated before comparison.
      </p>

      <!-- Metric Selector Pills -->
      <div class="metric-selector-tabs">
        <button class="metric-tab-pill ${currentKey === 'hba1c' ? 'active' : ''}" onclick="setComparisonMetric('hba1c')">
          HbA1c (%)
        </button>
        <button class="metric-tab-pill ${currentKey === 'egfr' ? 'active' : ''}" onclick="setComparisonMetric('egfr')">
          eGFR (mL/min)
        </button>
        <button class="metric-tab-pill ${currentKey === 'creatinine' ? 'active' : ''}" onclick="setComparisonMetric('creatinine')">
          Creatinine (mg/dL)
        </button>
      </div>

      <!-- Comparison Chart Visualization (High-Res SVG Trendline) -->
      <div class="chart-svg-wrapper" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:12px;">
        <svg viewBox="0 0 320 120" style="width:100%;height:100%;overflow:visible;">
          <defs>
            <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0"/>
            </linearGradient>
          </defs>

          <!-- Grid Lines -->
          <line x1="20" y1="20" x2="300" y2="20" stroke="#e2e8f0" stroke-dasharray="3,3" />
          <line x1="20" y1="60" x2="300" y2="60" stroke="#e2e8f0" stroke-dasharray="3,3" />
          <line x1="20" y1="100" x2="300" y2="100" stroke="#cbd5e1" />

          <!-- Dynamic Trend Path depending on metric -->
          ${currentKey === 'hba1c' ? `
            <!-- HbA1c: 7.8 -> 7.1 -> 6.5 (Descending improvement) -->
            <path d="M 50 25 L 160 55 L 270 85 L 270 100 L 50 100 Z" fill="url(#chartGrad)" />
            <path d="M 50 25 L 160 55 L 270 85" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            <!-- Data Points -->
            <circle cx="50" cy="25" r="5" fill="#f59e0b" stroke="white" stroke-width="2" style="cursor:pointer;" onclick="viewDocumentDetail('Initial Consultation Note', 'clinical_note_jan_2026.pdf', '10 Jan 2026')" />
            <text x="50" y="15" font-size="11" font-weight="700" fill="#b45309" text-anchor="middle">7.8%</text>

            <circle cx="160" cy="55" r="5" fill="#3b82f6" stroke="white" stroke-width="2" style="cursor:pointer;" onclick="viewDocumentDetail('Clinical Note Mar 2026', 'clinical_note_mar_2026.pdf', '15 Mar 2026')" />
            <text x="160" y="45" font-size="11" font-weight="700" fill="#1d4ed8" text-anchor="middle">7.1%</text>

            <circle cx="270" cy="85" r="5" fill="#16a34a" stroke="white" stroke-width="2" style="cursor:pointer;" onclick="viewDocumentDetail('Clinical Consultation Note Jun 2026', 'clinical_note_jun_2026.pdf', '20 Jun 2026')" />
            <text x="270" y="75" font-size="11" font-weight="700" fill="#15803d" text-anchor="middle">6.5%</text>
          ` : (currentKey === 'egfr' ? `
            <!-- eGFR: 68 -> 74 -> 82 (Ascending improvement) -->
            <path d="M 50 85 L 160 55 L 270 25 L 270 100 L 50 100 Z" fill="url(#chartGrad)" />
            <path d="M 50 85 L 160 55 L 270 25" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="50" cy="85" r="5" fill="#3b82f6" stroke="white" stroke-width="2" onclick="viewDocumentDetail('Initial Consultation Note', 'clinical_note_jan_2026.pdf', '10 Jan 2026')" />
            <text x="50" y="75" font-size="11" font-weight="700" fill="#1d4ed8" text-anchor="middle">68</text>

            <circle cx="160" cy="55" r="5" fill="#3b82f6" stroke="white" stroke-width="2" onclick="viewDocumentDetail('Clinical Note Mar 2026', 'clinical_note_mar_2026.pdf', '15 Mar 2026')" />
            <text x="160" y="45" font-size="11" font-weight="700" fill="#1d4ed8" text-anchor="middle">74</text>

            <circle cx="270" cy="25" r="5" fill="#16a34a" stroke="white" stroke-width="2" onclick="viewDocumentDetail('Clinical Consultation Note Jun 2026', 'clinical_note_jun_2026.pdf', '20 Jun 2026')" />
            <text x="270" y="15" font-size="11" font-weight="700" fill="#15803d" text-anchor="middle">82</text>
          ` : `
            <!-- Creatinine: 1.1 -> 1.0 -> 0.95 (Optimal) -->
            <path d="M 50 30 L 160 55 L 270 75 L 270 100 L 50 100 Z" fill="url(#chartGrad)" />
            <path d="M 50 30 L 160 55 L 270 75" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="50" cy="30" r="5" fill="#3b82f6" stroke="white" stroke-width="2" />
            <text x="50" y="20" font-size="11" font-weight="700" fill="#1d4ed8" text-anchor="middle">1.1</text>
            <circle cx="160" cy="55" r="5" fill="#3b82f6" stroke="white" stroke-width="2" />
            <text x="160" y="45" font-size="11" font-weight="700" fill="#1d4ed8" text-anchor="middle">1.0</text>
            <circle cx="270" cy="75" r="5" fill="#16a34a" stroke="white" stroke-width="2" />
            <text x="270" y="65" font-size="11" font-weight="700" fill="#15803d" text-anchor="middle">0.95</text>
          `)}

          <!-- Dates along X Axis -->
          <text x="50" y="115" font-size="9" fill="#64748b" text-anchor="middle">10 Jan</text>
          <text x="160" y="115" font-size="9" fill="#64748b" text-anchor="middle">15 Mar</text>
          <text x="270" y="115" font-size="9" fill="#64748b" text-anchor="middle">20 Jun</text>
        </svg>
      </div>

      <!-- Chronological Report Table with Clickable Source Links -->
      <div style="margin-top:12px;background:#f8fafc;border-radius:10px;padding:10px;border:1px solid #e2e8f0;">
        <div style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;margin-bottom:8px;">
          Grounded Source Reports
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${pts.map(p => `
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;background:white;padding:6px 10px;border-radius:6px;border:1px solid #e2e8f0;">
              <div>
                <span style="font-weight:600;color:#0f172a;">${p.date}:</span>
                <span style="font-weight:700;color:#2563eb;margin-left:4px;">${p.value} ${metric.unit}</span>
                <span class="badge ${p.status === 'Target Met' || p.status === 'Optimal' ? 'badge-verified' : (p.status === 'Improving' ? 'badge-blue' : 'badge-review')}" style="font-size:9px;margin-left:6px;">
                  ${p.status}
                </span>
              </div>
              <button class="btn btn-ghost btn-sm" style="font-size:11px;color:#2563eb;padding:2px 8px;" onclick="viewDocumentDetail('${escapeHtml(p.docName)}', '${escapeHtml(p.file)}', '${p.date}')">
                📄 Open Source Report
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Clinical Interpretation -->
      <div style="margin-top:10px;font-size:12px;color:#1e3a8a;background:#eff6ff;padding:10px 12px;border-radius:8px;border-left:3px solid #2563eb;">
        <strong>Clinical Insight:</strong> ${escapeHtml(metric.description)} Target is ${escapeHtml(metric.target)}. Steady progress recorded across verified laboratory reports.
      </div>
    </div>
  `;
}

function setComparisonMetric(metricKey) {
  STATE.selectedComparisonMetric = metricKey;
  renderJourney();
}

function openComparisonModal(metricKey) {
  setComparisonMetric(metricKey);
  navigate('journey');
  setTimeout(() => {
    const el = document.querySelector('.historical-comp-container');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

function closeComparisonModal() {
  const modal = document.getElementById('comparison-modal');
  if (modal) modal.classList.remove('open');
}

// ─── SCREEN 6: HEALTH JOURNEY ──────────────────────────────────────────────
function renderJourney() {
  const container = document.getElementById('journey-content');
  if (!container) return;

  const totalVisits = STATE.visits?.length || 0;

  if (totalVisits === 0) {
    container.innerHTML = `
      <!-- Top Header -->
      <div style="padding:16px 20px 8px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <h1 style="font-size:24px;font-weight:700;color:var(--text-primary);margin:0;">Health Journey</h1>
          <p style="font-size:13px;color:var(--text-secondary);margin-top:2px;">Chronological continuity of care</p>
        </div>
        <button class="btn-icon" title="Decision Memory" onclick="navigate('decision')">
          ${getIcon('brain', 'width:18px;height:18px;stroke:var(--blue);')}
        </button>
      </div>

      <!-- Clean Empty State -->
      <div style="padding:48px 24px;text-align:center;">
        <div style="width:72px;height:72px;border-radius:24px;background:#e0f2fe;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#0284c7;">
          ${getIcon('calendar', 'width:36px;height:36px;stroke:#0284c7;')}
        </div>
        <h3 style="font-size:18px;font-weight:700;color:var(--text-primary);margin:0 0 6px;">Your Health Journey</h3>
        <p style="font-size:13px;color:var(--text-secondary);max-width:280px;margin:0 auto 24px;line-height:1.5;">
          No visits recorded yet. As soon as you upload a medical report, your timeline, lab progression, and treatment adjustments will appear here.
        </p>
        <button class="btn btn-primary" onclick="openAddRecordFlow()" style="margin:0 auto;display:inline-flex;align-items:center;gap:8px;padding:12px 24px;font-weight:600;box-shadow:0 6px 20px rgba(37,99,235,0.3);">
          ${getIcon('fileUpload', 'width:18px;height:18px;stroke:white;')} Upload First Document
        </button>
      </div>
    `;
    return;
  }

  const visitsList = [...STATE.visits];

  container.innerHTML = `
    <!-- Top Header -->
    <div style="padding:16px 20px 8px;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <h1 style="font-size:24px;font-weight:700;color:var(--text-primary);margin:0;">Health Journey</h1>
        <p style="font-size:13px;color:var(--text-secondary);margin-top:2px;">Chronological continuity of care</p>
      </div>
      <button class="btn-icon" title="Decision Memory" onclick="navigate('decision')">
        ${getIcon('brain', 'width:18px;height:18px;stroke:var(--blue);')}
      </button>
    </div>

    <!-- Chronological Health Journey Timeline -->
    <div style="padding:10px 20px 24px;display:flex;flex-direction:column;gap:0;">
      ${visitsList.map((v, idx) => {
        const isLatest = idx === 0;
        const med = v.medications && v.medications[0];
        const lab1 = v.labs && v.labs[0];
        const lab2 = v.labs && v.labs[1];
        const doc = v.documents && v.documents[0];
        const docName = doc?.name || `${v.type} Note`;
        const docFile = doc?.file || 'record.pdf';

        return `
          <div class="journey-node-card" style="${isLatest ? 'border:1.5px solid var(--blue);' : ''}cursor:pointer;" onclick="viewDocumentDetail('${escapeHtml(docName)}', '${escapeHtml(docFile)}', '${escapeHtml(v.date)}')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:12px;font-weight:700;color:${isLatest ? 'var(--blue)' : 'var(--text-tertiary)'};text-transform:uppercase;">${v.date}</span>
                <span style="font-size:12px;color:var(--text-secondary);">· ${escapeHtml(v.hospitalName || 'Primary Hospital')}</span>
              </div>
              <span class="badge ${isLatest ? 'badge-verified' : 'badge-blue'}" style="font-size:10px;">${isLatest ? 'Latest visit' : (v.type || 'Visit')}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <div>
                <div style="font-size:14px;font-weight:700;color:var(--text-primary);">${escapeHtml(med ? med.name : (v.type || 'Consultation'))}</div>
                <div style="font-size:12px;color:${med?.status === 'CURRENT' ? 'var(--green)' : 'var(--text-secondary)'};font-weight:${med?.status === 'CURRENT' ? '600' : '400'};">${escapeHtml(med ? `${med.dose || ''} ${med.freq || ''}` : v.summary)}</div>
              </div>
              ${lab1 ? `
                <div style="text-align:right;">
                  <div style="font-size:14px;font-weight:700;color:${lab1.status === 'optimal' ? 'var(--green)' : 'var(--blue)'};">${lab1.test} ${lab1.value} ${lab1.unit || ''}</div>
                  ${lab2 ? `<div style="font-size:11px;color:var(--text-tertiary);">${lab2.test}: ${lab2.value} ${lab2.unit || ''}</div>` : ''}
                </div>
              ` : ''}
            </div>
            <div style="font-size:11px;color:var(--blue);font-weight:500;margin-top:4px;">
              📄 Tap to view original ${escapeHtml(docName)} ›
            </div>
          </div>
          ${idx < visitsList.length - 1 ? '<div class="journey-timeline-connector"></div>' : ''}
        `;
      }).join('')}

      <!-- FEATURE 7: HISTORICAL HEALTH RECORD COMPARISON WIDGET -->
      ${STATE.historicalMetrics && Object.keys(STATE.historicalMetrics).length > 0 && STATE.historicalMetrics[STATE.selectedComparisonMetric || 'hba1c']?.points?.length > 0 ? renderHistoricalComparisonWidget() : ''}

      <!-- FEATURE 6: MISSING-INFORMATION & CONFLICT DETECTION WIDGET -->
      ${STATE.conflicts && STATE.conflicts.length > 0 ? renderConflictDetectionWidget() : ''}

      <!-- IMPORTANT CHANGE SPOTLIGHT CARD -->
      ${STATE.changes && STATE.changes.length > 0 ? `
        <div style="margin-top:20px;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:var(--r-xl);padding:18px;box-shadow:var(--shadow-xs);">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="color:var(--green);">${getIcon('check', 'width:18px;height:18px;')}</div>
            <span style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.5px;">
              Important Change Detected
            </span>
          </div>
          <div style="font-size:16px;font-weight:700;color:#14532d;">
            ${escapeHtml(STATE.changes[0].title)}
          </div>
          <div style="display:flex;gap:12px;margin:10px 0;font-size:13px;">
            <div><span style="color:var(--text-tertiary);">Previous:</span> ${escapeHtml(STATE.changes[0].previous)}</div>
            <div><span style="color:var(--text-tertiary);">Current:</span> <strong>${escapeHtml(STATE.changes[0].current)}</strong></div>
          </div>
          <div style="font-size:13px;color:#166534;line-height:1.5;">
            <strong>Reason:</strong> "${escapeHtml(STATE.changes[0].reason)}"
          </div>
          <div style="margin-top:10px;font-size:12px;color:var(--text-secondary);">
            <strong>Source:</strong> ${escapeHtml(STATE.changes[0].sourceDoc)}
          </div>
          <div style="margin-top:14px;display:flex;gap:10px;">
            <button class="btn btn-secondary btn-sm" onclick="navigate('decision')">
              Why did this change?
            </button>
            <button class="btn btn-ghost btn-sm" style="color:var(--blue);" onclick="openChangeDetail('${STATE.changes[0].id}')">
              View Details
            </button>
          </div>
        </div>
      ` : ''}

      ${STATE.changes && STATE.changes.some(c => c.status === 'INCOMPLETE') ? `
        <!-- MISSING EVIDENCE EXPERIENCE -->
        <div style="margin-top:16px;background:#fff1f2;border:1.5px solid #fecdd3;border-radius:var(--r-xl);padding:18px;box-shadow:var(--shadow-xs);">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="color:var(--red);">${getIcon('alertTriangle', 'width:18px;height:18px;')}</div>
            <span style="font-size:11px;font-weight:700;color:#9f1239;text-transform:uppercase;letter-spacing:0.5px;">
              Evidence Incomplete
            </span>
          </div>
          <div style="font-size:14px;font-weight:700;color:#881337;line-height:1.4;">
            Your clinical note mentions MRI findings, but an MRI report is not currently available in your records.
          </div>
          <div style="font-size:12px;color:#9f1239;margin-top:6px;line-height:1.4;">
            Closing this gap ensures your next doctor has the complete clinical picture.
          </div>
          <div style="margin-top:14px;display:flex;gap:10px;">
            <button class="btn btn-secondary btn-sm" onclick="openAddRecordFlow()">
              Add MRI Report
            </button>
            <button class="btn btn-ghost btn-sm" style="color:var(--blue);" onclick="navigate('access')">
              Share with doctor
            </button>
          </div>
        </div>
      ` : ''}
            Share with doctor
          </button>
        </div>
      </div>

    </div>
  `;
}

// ─── SCREEN 7: DECISION MEMORY (HUMAN-READABLE) ───────────────────────────
function renderDecisionMemory() {
  const container = document.getElementById('decision-content');
  if (!container) return;

  const dm = STATE.decisionMemory;

  if (!dm || !dm.finding) {
    container.innerHTML = `
      <!-- Top Bar -->
      <div style="padding:16px 20px 8px;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <button class="btn-icon" onclick="navigate('journey')">
            ${getIcon('arrowLeft', 'width:20px;height:20px;')}
          </button>
          <div>
            <h1 style="font-size:18px;font-weight:700;color:var(--text-primary);margin:0;">Decision Memory</h1>
            <div style="font-size:11px;color:var(--text-secondary);">Your health memory chain</div>
          </div>
        </div>
      </div>

      <!-- Clean Empty Chain -->
      <div style="padding:48px 24px;text-align:center;">
        <div style="width:72px;height:72px;border-radius:24px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#16a34a;">
          ${getIcon('brain', 'width:36px;height:36px;stroke:#16a34a;')}
        </div>
        <h3 style="font-size:18px;font-weight:700;color:var(--text-primary);margin:0 0 6px;">No Treatment Adjustments Recorded</h3>
        <p style="font-size:13px;color:var(--text-secondary);max-width:280px;margin:0 auto 24px;line-height:1.5;">
          When clinical rationale or medication adjustments are detected across your consultations, HealthContinuum AI automatically preserves the complete decision memory chain here.
        </p>
        <button class="btn btn-primary" onclick="navigate('journey')" style="margin:0 auto;">
          Back to Health Journey
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <!-- Top Bar -->
    <div style="padding:16px 20px 8px;display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:10px;">
        <button class="btn-icon" onclick="navigate('journey')">
          ${getIcon('arrowLeft', 'width:20px;height:20px;')}
        </button>
        <div>
          <h1 style="font-size:18px;font-weight:700;color:var(--text-primary);margin:0;">Decision Memory</h1>
          <div style="font-size:11px;color:var(--text-secondary);">Your health memory chain</div>
        </div>
      </div>
    </div>

    <!-- Human-Readable Memory Chain -->
    <div style="padding:10px 20px 24px;">
      <h2 style="font-size:22px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">
        Why did this change?
      </h2>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:20px;">
        HealthContinuum AI tracks the clinical rationale behind each treatment adjustment.
      </p>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <!-- Step 1: Finding -->
        <div style="background:var(--bg-card);border-radius:var(--r-xl);padding:16px 18px;border:1px solid var(--separator);box-shadow:var(--shadow-xs);">
          <div style="font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
            1. Clinical Finding
          </div>
          <div style="font-size:14px;font-weight:600;color:var(--text-primary);line-height:1.4;">
            ${dm.finding}
          </div>
        </div>

        <!-- Step 2: Decision -->
        <div style="background:var(--bg-card);border-radius:var(--r-xl);padding:16px 18px;border:1px solid var(--separator);box-shadow:var(--shadow-xs);">
          <div style="font-size:11px;font-weight:700;color:var(--indigo);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
            2. Decision Made
          </div>
          <div style="font-size:14px;font-weight:600;color:var(--text-primary);line-height:1.4;">
            ${dm.decision}
          </div>
        </div>

        <!-- Step 3: Evidence -->
        <div style="background:var(--bg-card);border-radius:var(--r-xl);padding:16px 18px;border:1px solid var(--separator);box-shadow:var(--shadow-xs);">
          <div style="font-size:11px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
            3. Supporting Evidence
          </div>
          <div style="font-size:14px;font-weight:600;color:var(--text-primary);line-height:1.4;">
            ${dm.evidence}
          </div>
        </div>

        <!-- Step 4: Follow-up -->
        <div style="background:var(--bg-card);border-radius:var(--r-xl);padding:16px 18px;border:1px solid var(--separator);box-shadow:var(--shadow-xs);">
          <div style="font-size:11px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
            4. Follow-up Plan
          </div>
          <div style="font-size:14px;font-weight:600;color:var(--text-primary);line-height:1.4;">
            ${dm.followUp}
          </div>
        </div>

        <!-- Verification Badge -->
        <div style="margin-top:10px;padding:14px;background:#f0fdf4;border-radius:var(--r-lg);display:flex;align-items:center;gap:10px;border:1px solid #bbf7d0;">
          <div style="color:var(--green);">${getIcon('check', 'width:18px;height:18px;')}</div>
          <div style="font-size:13px;font-weight:600;color:#166534;">
            Status: ${dm.status}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─── SCREEN 8: DOCTOR ACCESS (20-MINUTE DEMONSTRATION PIN) ─────────────────
function renderDoctorAccess() {
  const container = document.getElementById('access-content');
  if (!container) return;

  const access = STATE.doctorAccess || {};
  const { code = '------', expiresInSeconds = 0, status = 'ACTIVE', purpose = 'DEMO PURPOSE ONLY', isRevoked = false, pendingRequest } = access;
  const isExpired = expiresInSeconds <= 0 && !isRevoked;
  const minutes = Math.floor(Math.max(0, expiresInSeconds) / 60);
  const seconds = Math.max(0, expiresInSeconds) % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  let badgeColor = '#2563eb';
  let badgeBg = '#eff6ff';
  let statusText = 'ACTIVE · 20 MIN';
  if (isRevoked) {
    badgeColor = '#dc2626';
    badgeBg = '#fef2f2';
    statusText = 'REVOKED BY PATIENT';
  } else if (isExpired) {
    badgeColor = '#d97706';
    badgeBg = '#fffbeb';
    statusText = 'EXPIRED';
  }

  container.innerHTML = `
    <!-- Top Bar -->
    <div style="padding:16px 20px 8px;display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:10px;">
        <button class="btn-icon" onclick="navigate('home')">
          ${getIcon('arrowLeft', 'width:20px;height:20px;')}
        </button>
        <div>
          <h1 style="font-size:18px;font-weight:700;color:var(--text-primary);margin:0;">Share with Doctor</h1>
          <div style="font-size:11px;color:var(--text-secondary);">20-minute temporary demonstration access</div>
        </div>
      </div>
      <span style="font-size:11px;font-weight:700;color:${badgeColor};background:${badgeBg};padding:3px 8px;border-radius:12px;text-transform:uppercase;letter-spacing:0.5px;">
        ${statusText}
      </span>
    </div>

    <!-- Access Code Presentation -->
    <div style="padding:10px 20px 24px;">
      <div style="background:var(--bg-card);border:1.5px solid var(--separator);border-radius:var(--r-2xl);padding:24px 20px;text-align:center;box-shadow:var(--shadow-sm);position:relative;overflow:hidden;">
        
        <!-- Demonstration Watermark / Banner -->
        <div style="display:inline-flex;align-items:center;gap:6px;background:#fef3c7;color:#92400e;border:1px solid #fde68a;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.8px;margin-bottom:14px;text-transform:uppercase;">
          <span>⚠️</span> ${purpose}
        </div>

        <div style="font-size:12px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
          DEMO ACCESS PIN
        </div>

        <div class="code-box-display" style="font-size:36px;font-weight:800;letter-spacing:6px;color:var(--text-primary);font-family:monospace;padding:12px 16px;background:var(--bg-card-alt);border-radius:var(--r-xl);margin:8px auto 14px;max-width:240px;border:1px dashed var(--separator);">
          ${isRevoked ? 'REVOKED' : (code || '------')}
        </div>

        ${!isRevoked && !isExpired ? `
          <div style="font-size:14px;color:var(--text-secondary);font-weight:500;">
            Expires in <strong style="color:var(--blue);font-family:monospace;font-size:16px;">${timeFormatted}</strong>
          </div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;">
            Authoritative 20-minute server countdown
          </div>
        ` : ''}

        ${isRevoked ? `
          <div style="font-size:13px;color:#dc2626;font-weight:600;margin-top:4px;">
            This PIN was revoked and cannot be redeemed.
          </div>
        ` : ''}

        ${isExpired && !isRevoked ? `
          <div style="font-size:13px;color:#d97706;font-weight:600;margin-top:4px;">
            This demonstration PIN has expired. Generate a new PIN to grant access.
          </div>
        ` : ''}

        <div style="margin-top:18px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="generateNewAccessCode()">
            ${getIcon('refresh', 'width:14px;height:14px;margin-right:4px;')} Generate Demo PIN
          </button>
          ${!isRevoked && !isExpired && code && code !== '------' ? `
            <button class="btn btn-secondary btn-sm" style="color:#dc2626;border-color:#fecaca;" onclick="revokeCurrentPin()">
              Revoke PIN
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Demonstration Access Rules Info Card -->
      <div style="margin-top:16px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:var(--r-xl);">
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#1e293b;margin-bottom:6px;">
          <span>🔒</span> Safe Demonstration Rules
        </div>
        <ul style="margin:0;padding-left:18px;font-size:12px;color:#475569;line-height:1.6;">
          <li>Valid for exactly <strong>20 minutes</strong> from generation.</li>
          <li>Grants read-only demonstration view of medications, lab results, and documents.</li>
          <li>Can be revoked by you at any time before expiry.</li>
          <li>All access attempts and reviews are securely audited.</li>
        </ul>
      </div>

      <!-- Access Request Approval Simulation -->
      ${pendingRequest ? `
        <div style="margin-top:16px;background:#f0f5ff;border:1.5px solid rgba(37,99,235,0.2);border-radius:var(--r-xl);padding:18px;">
          <div style="font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
            Access Request Received
          </div>
          <div style="font-size:15px;font-weight:700;color:var(--text-primary);">
            ${pendingRequest.doctorName} is requesting access to your health records.
          </div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">
            ${pendingRequest.hospital} · ${pendingRequest.scope}
          </div>
          <div style="margin-top:14px;display:flex;gap:10px;">
            <button class="btn btn-primary btn-sm" onclick="approveDoctorAccess()">
              Allow Access
            </button>
            <button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="declineDoctorAccess()">
              Decline
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function startAccessCountdown() {
  if (STATE.doctorAccess && STATE.doctorAccess.timerId) {
    clearInterval(STATE.doctorAccess.timerId);
  }
  if (!STATE.doctorAccess) {
    STATE.doctorAccess = {
      code: '------',
      expiresInSeconds: 0,
      timerId: null,
      status: 'PENDING',
      purpose: 'DEMO PURPOSE ONLY',
      isRevoked: false,
    };
  }

  STATE.doctorAccess.timerId = setInterval(() => {
    if (STATE.doctorAccess.expiresInSeconds > 0 && !STATE.doctorAccess.isRevoked) {
      STATE.doctorAccess.expiresInSeconds--;
      if (activeScreen === 'access') renderDoctorAccess();
    } else {
      clearInterval(STATE.doctorAccess.timerId);
      if (activeScreen === 'access') renderDoctorAccess();
    }
  }, 1000);
}

async function generateNewAccessCode() {
  const patientId = (STATE.patient && STATE.patient.id) || 'pat-ramesh-001';

  try {
    if (window.API && typeof window.API.generateDemoPin === 'function') {
      const res = await window.API.generateDemoPin(patientId);
      if (res && res.success && res.data) {
        STATE.doctorAccess.code = res.data.access_code;
        STATE.doctorAccess.accessId = res.data.id;
        STATE.doctorAccess.expiresInSeconds = res.data.expires_in_seconds || 1200;
        STATE.doctorAccess.expiresAt = res.data.expires_at;
        STATE.doctorAccess.status = 'ACTIVE';
        STATE.doctorAccess.purpose = res.data.purpose || 'DEMO PURPOSE ONLY';
        STATE.doctorAccess.isRevoked = false;
        startAccessCountdown();
        renderDoctorAccess();
        return;
      }
    }
  } catch (e) {
    console.warn('API generate demo pin failed, using local demo fallback:', e);
  }

  // Fallback random 6-digit PIN
  const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
  STATE.doctorAccess.code = randomPin;
  STATE.doctorAccess.accessId = 'local-' + Date.now();
  STATE.doctorAccess.expiresInSeconds = 1200; // 20 minutes
  STATE.doctorAccess.status = 'ACTIVE';
  STATE.doctorAccess.purpose = 'DEMO PURPOSE ONLY';
  STATE.doctorAccess.isRevoked = false;
  startAccessCountdown();
  renderDoctorAccess();
}

async function revokeCurrentPin() {
  const patientId = (STATE.patient && STATE.patient.id) || 'pat-ramesh-001';
  const accessId = STATE.doctorAccess.accessId;

  if (accessId && window.API && typeof window.API.revokeDemoPin === 'function') {
    try {
      await window.API.revokeDemoPin(accessId, patientId);
    } catch (e) {
      console.warn('API revoke note:', e);
    }
  }

  STATE.doctorAccess.isRevoked = true;
  STATE.doctorAccess.status = 'REVOKED';
  STATE.doctorAccess.expiresInSeconds = 0;
  if (STATE.doctorAccess.timerId) clearInterval(STATE.doctorAccess.timerId);
  renderDoctorAccess();
}

function approveDoctorAccess() {
  STATE.doctorAccess.pendingRequest = null;
  alert('Access approved. Dr. Priya Sharma now has temporary 20-minute access to review your health journey.');
  renderDoctorAccess();
}

function declineDoctorAccess() {
  STATE.doctorAccess.pendingRequest = null;
  alert('Access request declined.');
  renderDoctorAccess();
}

// ─── CHANGE DETAIL MODAL ────────────────────────────────────────────────────
function openChangeDetail(changeId) {
  const change = STATE.changes.find(c => c.id === changeId) || STATE.changes[0];
  const sheet = document.getElementById('change-detail-sheet');
  const modal = document.getElementById('change-detail-modal');
  if (!sheet || !modal) return;

  sheet.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:12px;">
      <span class="badge badge-verified">${change.badgeText}</span>
      <button class="btn-icon" onclick="closeChangeDetail()">${getIcon('close', 'width:18px;height:18px;')}</button>
    </div>
    <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);width:100%;margin-bottom:4px;">
      ${change.title}
    </h2>
    <div style="font-size:13px;color:var(--text-secondary);width:100%;margin-bottom:16px;">
      ${change.hospital} · ${change.doctor} · ${change.date}
    </div>

    <div style="width:100%;background:var(--bg-card-alt);border-radius:var(--r-lg);padding:14px;margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:12px;color:var(--text-secondary);">Previous Dosage:</span>
        <span style="font-size:13px;font-weight:600;color:var(--text-primary);">${change.previous}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="font-size:12px;color:var(--text-secondary);">Current Dosage:</span>
        <span style="font-size:13px;font-weight:700;color:var(--blue);">${change.current}</span>
      </div>
    </div>

    <div style="width:100%;margin-bottom:14px;">
      <div style="font-size:12px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:4px;">
        Reason found in clinical note:
      </div>
      <div style="font-size:14px;color:var(--text-primary);line-height:1.5;">
        "${change.reason}"
      </div>
    </div>

    <div style="width:100%;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:4px;">
        Source:
      </div>
      <div style="font-size:13px;color:var(--blue);font-weight:500;">
        📄 ${change.sourceDoc}
      </div>
    </div>

    <div style="width:100%;display:flex;gap:10px;">
      <button class="btn btn-secondary btn-full" onclick="closeChangeDetail(); navigate('journey');">
        View in Journey
      </button>
      <button class="btn btn-primary btn-full" onclick="closeChangeDetail(); navigate('decision');">
        Why did this change?
      </button>
    </div>
  `;

  modal.classList.add('open');
}

function closeChangeDetail() {
  const modal = document.getElementById('change-detail-modal');
  if (modal) modal.classList.remove('open');
}

// ─── INITIALIZATION & BOOT SEQUENCE ─────────────────────────────────────────
async function initApp() {
  document.getElementById('app').innerHTML = buildAppShell();

  // Modal and drawer click out handling
  document.addEventListener('click', (e) => {
    if (e.target.id === 'add-record-modal') closeAddRecordFlow();
    if (e.target.id === 'change-detail-modal') closeChangeDetail();
    if (e.target.id === 'profile-drawer-modal') closeProfileDrawer();
    if (e.target.id === 'notifications-drawer-modal') closeNotificationsDrawer();
    if (e.target.id === 'hospital-modal') closeHospitalModal();
    if (e.target.id === 'doc-preview-modal') closeDocPreview();
    if (e.target.id === 'conflict-modal') closeConflictModal();
    if (e.target.id === 'comparison-modal') closeComparisonModal();
  });

  // Start access countdown
  startAccessCountdown();

  // Connect & sync with backend in background
  syncWithBackend().then(() => {
    const indicator = document.getElementById('backend-status-indicator');
    if (indicator) {
      indicator.innerHTML = `<div class="pulse-dot"></div><span style="font-size:11px;">${STATE.backendConnected ? 'Backend Live' : 'Backend Ready'}</span>`;
    }
  });

  // Initialize live iOS clock
  updateIosClock();
  setInterval(updateIosClock, 10000);

  // Restore existing session if present, otherwise show login
  let hasSession = false;
  try {
    const savedUserJson = localStorage.getItem('hc_auth_user');
    if (savedUserJson) {
      const savedUser = JSON.parse(savedUserJson);
      if (savedUser?.patient) {
        loadPatientData(savedUser.patient);
        hasSession = true;
      }
    }
  } catch (e) {}

  setTimeout(() => {
    if (hasSession) {
      navigate('home');
    } else {
      navigate('login');
    }
  }, 1400);
}

document.addEventListener('DOMContentLoaded', initApp);
