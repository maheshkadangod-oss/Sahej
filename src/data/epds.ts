// Edinburgh Postnatal Depression Scale (EPDS)
// Developed by Cox, Holden, and Sagovsky (1987)
// Validated, widely used by obstetricians and mental health professionals.
// Public domain. No licensing required.
//
// IMPORTANT: This is a screening tool, NOT a diagnosis.
// Results are private to the user and stored only on-device.

export interface EPDSOption {
  label: string;
  score: 0 | 1 | 2 | 3;
}

export interface EPDSQuestion {
  id: number;
  prompt: string;
  // Some questions have reversed scoring (happy items); the 'reversed' flag
  // is informational only — score values already reflect reversed logic.
  reversed?: boolean;
  options: [EPDSOption, EPDSOption, EPDSOption, EPDSOption];
}

export const epdsIntro = `In the past 7 days, how have you been feeling? Choose the answer that comes closest to how you have felt — not just today, but over the whole week.`;

export const epdsQuestions: EPDSQuestion[] = [
  {
    id: 1,
    prompt: "I have been able to laugh and see the funny side of things.",
    reversed: true,
    options: [
      { label: "As much as I always could", score: 0 },
      { label: "Not quite so much now", score: 1 },
      { label: "Definitely not so much now", score: 2 },
      { label: "Not at all", score: 3 },
    ],
  },
  {
    id: 2,
    prompt: "I have looked forward with enjoyment to things.",
    reversed: true,
    options: [
      { label: "As much as I ever did", score: 0 },
      { label: "Rather less than I used to", score: 1 },
      { label: "Definitely less than I used to", score: 2 },
      { label: "Hardly at all", score: 3 },
    ],
  },
  {
    id: 3,
    prompt: "I have blamed myself unnecessarily when things went wrong.",
    options: [
      { label: "No, never", score: 0 },
      { label: "Not very often", score: 1 },
      { label: "Yes, some of the time", score: 2 },
      { label: "Yes, most of the time", score: 3 },
    ],
  },
  {
    id: 4,
    prompt: "I have been anxious or worried for no good reason.",
    reversed: true,
    options: [
      { label: "No, not at all", score: 0 },
      { label: "Hardly ever", score: 1 },
      { label: "Yes, sometimes", score: 2 },
      { label: "Yes, very often", score: 3 },
    ],
  },
  {
    id: 5,
    prompt: "I have felt scared or panicky for no very good reason.",
    options: [
      { label: "No, not at all", score: 0 },
      { label: "No, not much", score: 1 },
      { label: "Yes, sometimes", score: 2 },
      { label: "Yes, quite a lot", score: 3 },
    ],
  },
  {
    id: 6,
    prompt: "Things have been getting on top of me.",
    options: [
      { label: "No, I have been coping as well as ever", score: 0 },
      { label: "No, most of the time I have coped quite well", score: 1 },
      { label: "Yes, sometimes I haven't been coping as well as usual", score: 2 },
      { label: "Yes, most of the time I haven't been able to cope at all", score: 3 },
    ],
  },
  {
    id: 7,
    prompt: "I have been so unhappy that I have had difficulty sleeping.",
    options: [
      { label: "No, not at all", score: 0 },
      { label: "Not very often", score: 1 },
      { label: "Yes, sometimes", score: 2 },
      { label: "Yes, most of the time", score: 3 },
    ],
  },
  {
    id: 8,
    prompt: "I have felt sad or miserable.",
    options: [
      { label: "No, not at all", score: 0 },
      { label: "Not very often", score: 1 },
      { label: "Yes, quite often", score: 2 },
      { label: "Yes, most of the time", score: 3 },
    ],
  },
  {
    id: 9,
    prompt: "I have been so unhappy that I have been crying.",
    options: [
      { label: "No, never", score: 0 },
      { label: "Only occasionally", score: 1 },
      { label: "Yes, quite often", score: 2 },
      { label: "Yes, most of the time", score: 3 },
    ],
  },
  {
    id: 10,
    prompt: "The thought of harming myself has occurred to me.",
    options: [
      { label: "Never", score: 0 },
      { label: "Hardly ever", score: 1 },
      { label: "Sometimes", score: 2 },
      { label: "Yes, quite often", score: 3 },
    ],
  },
];

export interface EPDSResult {
  totalScore: number;         // 0–30
  q10Score: number;           // 0–3 (self-harm question)
  category: 'minimal' | 'mild' | 'moderate' | 'high';
  selfHarmFlag: boolean;      // Q10 > 0 — always flag for clinical review
  completedAt: number;
}

export function scoreEPDS(answers: number[]): EPDSResult {
  const totalScore = answers.reduce((sum, a) => sum + (a ?? 0), 0);
  const q10Score = answers[9] ?? 0;

  // EPDS scoring thresholds (widely accepted clinical interpretation):
  //  0–9    minimal depressive symptoms
  // 10–12   mild/possible symptoms — warrants attention
  // 13+     high probability — clinical assessment recommended
  let category: EPDSResult['category'] = 'minimal';
  if (totalScore >= 13) category = 'high';
  else if (totalScore >= 10) category = 'moderate';
  else if (totalScore >= 7) category = 'mild';

  return {
    totalScore,
    q10Score,
    category,
    selfHarmFlag: q10Score > 0,
    completedAt: Date.now(),
  };
}

// Gentle result interpretations — never clinical, never prescriptive.
export function interpretEPDS(result: EPDSResult): {
  title: string;
  body: string;
  tone: 'gentle' | 'watchful' | 'urgent';
} {
  if (result.selfHarmFlag) {
    return {
      title: "Please reach out today",
      body: "You shared that thoughts of harming yourself have come up. These thoughts are more common than you might think — and they are a signal that you deserve support right now. Please call your doctor, a crisis line, or a trusted person today. You are not alone.",
      tone: 'urgent',
    };
  }
  if (result.category === 'high') {
    return {
      title: "You're carrying a lot",
      body: "Your answers suggest you may be experiencing symptoms of postpartum depression. This is a medical condition — not a personal failing — and it is treatable. Please talk to your doctor, midwife, or a mental health professional this week. They will not judge you.",
      tone: 'urgent',
    };
  }
  if (result.category === 'moderate') {
    return {
      title: "Something's getting heavy",
      body: "Your answers suggest mild-to-moderate symptoms that are worth paying attention to. This doesn't mean anything is wrong with you — it means your body and mind are asking for support. Consider talking to your doctor at your next visit, or sooner if it feels right.",
      tone: 'watchful',
    };
  }
  if (result.category === 'mild') {
    return {
      title: "You're in a tender place",
      body: "Your answers show some of the normal ups and downs of early motherhood. Keep noticing how you're feeling. If things get harder, or if this stretches into weeks, consider reaching out to your doctor. There is no prize for waiting.",
      tone: 'gentle',
    };
  }
  return {
    title: "You're doing okay this week",
    body: "Your answers suggest your mood is in a steadier place this week. That's real. Keep checking in with yourself — postpartum emotions shift week to week, and this tool is here whenever you want to check in again.",
    tone: 'gentle',
  };
}
