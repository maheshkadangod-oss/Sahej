// Postpartum medical red flags — conditions where "call your doctor now" is the correct action.
// Sourced from WHO, ACOG (American College of Obstetricians and Gynecologists), and
// RCOG (Royal College of Obstetricians and Gynaecologists) postpartum guidance.
//
// This is not a diagnostic tool. It is a list of well-documented warning signs
// that should prompt immediate medical evaluation.

export interface RedFlag {
  id: string;
  emoji: string;
  title: string;
  detail: string;
  severity: 'now' | 'today'; // "now" = call doctor / ER, "today" = contact within 24h
}

export const redFlagsIntro =
  "Postpartum has real medical emergencies that aren't always talked about. " +
  "If you experience any of the following, please don't wait. " +
  "Your doctor, midwife, or a nurse line will help you — no question is too small.";

export const redFlags: RedFlag[] = [
  {
    id: 'bleeding',
    emoji: '🚨',
    title: 'Heavy bleeding',
    detail: "Soaking a pad in less than an hour, passing clots larger than a golf ball, or a sudden gush of fresh red blood after it had slowed. This can be postpartum haemorrhage.",
    severity: 'now',
  },
  {
    id: 'headache',
    emoji: '🚨',
    title: 'Severe headache with vision changes',
    detail: "Headache that doesn't ease with paracetamol, blurred or double vision, seeing flashing lights, or sensitivity to light. Can be a sign of postpartum preeclampsia.",
    severity: 'now',
  },
  {
    id: 'chest',
    emoji: '🚨',
    title: 'Chest pain or trouble breathing',
    detail: "Sudden shortness of breath, sharp chest pain, or coughing up blood. Postpartum bodies are at higher risk for blood clots that can reach the lungs.",
    severity: 'now',
  },
  {
    id: 'leg',
    emoji: '🚨',
    title: 'One swollen, warm, painful leg',
    detail: "If one leg (usually calf) is significantly more swollen, warm, or painful than the other, this can be a deep vein thrombosis. Do not walk it off.",
    severity: 'now',
  },
  {
    id: 'selfharm',
    emoji: '🚨',
    title: 'Thoughts of harming yourself or baby',
    detail: "If thoughts of harming yourself, your baby, or ending your life have come up, please reach out right now. You are not a bad person. This is a medical emergency and help is available.",
    severity: 'now',
  },
  {
    id: 'fever',
    emoji: '⚠️',
    title: 'Fever above 38°C / 100.4°F',
    detail: "Fever in the first 6 weeks postpartum can indicate an infection — of the uterus, a C-section wound, mastitis in the breast, or a UTI. Get evaluated.",
    severity: 'today',
  },
  {
    id: 'incision',
    emoji: '⚠️',
    title: 'C-section or tear incision looking off',
    detail: "Redness spreading around the incision, warm to touch, fluid leaking, or a foul smell. Infections in the first 2 weeks are common and treatable.",
    severity: 'today',
  },
  {
    id: 'breast',
    emoji: '⚠️',
    title: 'Red, painful, hot breast area',
    detail: "A wedge of red, hot, tender skin on the breast with flu-like symptoms may be mastitis. Keep nursing or pumping on that side, and contact your doctor today.",
    severity: 'today',
  },
  {
    id: 'panic',
    emoji: '⚠️',
    title: 'Sudden intense panic or dissociation',
    detail: "Panic attacks that stop you from functioning, or feeling detached from your body or your baby — especially if new and sudden. These respond well to treatment. Reach out.",
    severity: 'today',
  },
  {
    id: 'notfeeding',
    emoji: '⚠️',
    title: 'Baby not feeding / wet nappies dropping',
    detail: "If baby is refusing feeds, fewer than 6 wet nappies in 24 hours (after day 5), or unusually sleepy and hard to wake, contact your paediatrician or midwife today.",
    severity: 'today',
  },
];

// Helplines for reference (shown at bottom of red flags screen)
export const emergencyRefLines = [
  { country: 'India', label: 'Ambulance', number: '108' },
  { country: 'India', label: 'iCall mental health', number: '9152987821' },
  { country: 'US', label: 'Emergency', number: '911' },
  { country: 'UK', label: 'NHS non-emergency', number: '111' },
];
