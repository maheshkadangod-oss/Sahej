// Quick state actions — surface micro-coping activities based on how she feels right now.
// Kept minimal: 6 core states. Each maps to a short, single-purpose activity.

export type StateActionKind =
  | 'breathing'       // 10-sec visual breathing
  | 'grounding'       // 5-4-3-2-1 grounding
  | 'eyesClosed'      // 30-sec countdown with dim screen
  | 'reassurance'     // static card with reassurance text
  | 'relatable'       // "others have felt this"
  | 'safety'          // put baby down safely
  | 'hydrate';        // drink water

export interface StateAction {
  id: string;
  label: string;        // the button users tap
  emoji: string;
  kind: StateActionKind;
  title: string;        // shown in the action overlay
  body: string;         // shown below the title
  durationSec?: number; // for timed activities
}

export const stateActions: StateAction[] = [
  {
    id: 'overwhelmed',
    label: "I can't handle this",
    emoji: '😮‍💨',
    kind: 'breathing',
    title: 'Pause with me',
    body: 'Breathe in as the circle grows. Breathe out as it shrinks. No words. Just breath.',
    durationSec: 60,
  },
  {
    id: 'tired',
    label: "I'm too tired",
    emoji: '😴',
    kind: 'eyesClosed',
    title: 'Close your eyes',
    body: 'Thirty seconds. Just rest your eyes. I\'ll tell you when to come back.',
    durationSec: 30,
  },
  {
    id: 'anxious',
    label: "My thoughts are racing",
    emoji: '🌀',
    kind: 'grounding',
    title: 'Ground with me',
    body: 'Name one thing you can see. Then one you can hear. Then one you can feel.',
  },
  {
    id: 'lonely',
    label: "I feel alone",
    emoji: '🫂',
    kind: 'relatable',
    title: 'Others have felt this too',
    body: '',  // relatable quote is chosen dynamically from rotating set
  },
  {
    id: 'guilty',
    label: "I feel like a bad mom",
    emoji: '💛',
    kind: 'reassurance',
    title: 'You are enough today',
    body: 'Your baby is loved because you are here. That is not a small thing. That is everything.',
  },
  {
    id: 'irritated',
    label: "I'm about to snap",
    emoji: '🛡️',
    kind: 'safety',
    title: 'Put baby down safely',
    body: 'Place your baby somewhere safe — crib, bassinet, or the floor on a blanket. Step one foot away. Take a breath. You are not a bad mom for needing a pause.',
    durationSec: 60,
  },
];

// Rotating "others have felt this too" quotes — anonymized, pre-written, safe.
export const relatableQuotes: string[] = [
  "I cried in the bathroom today just so my partner wouldn't see.",
  "I miss the person I was before I became a mom. Nobody tells you that's allowed.",
  "I love my baby and I resent him and both are true.",
  "Some days I count the hours until bedtime. That doesn't make me a bad mom.",
  "I pretended I was okay on a walk today. I wasn't.",
  "I googled 'is this postpartum depression' at 3am last night.",
  "I feel disconnected from my baby and I'm terrified to admit it.",
  "I smiled at everyone at the pediatrician today. I cried the whole drive home.",
];
