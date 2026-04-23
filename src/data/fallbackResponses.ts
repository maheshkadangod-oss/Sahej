// Offline fallback responses.
// When the AI proxy is unavailable (network issue, rate limit, service down),
// Asha doesn't go silent. Instead she offers a curated menu of supportive messages.
//
// These are pre-written, warm, and never prescriptive — same tone as live Asha.
// No advice. No fixing. Just presence.

export interface FallbackOption {
  id: string;
  label: string;      // What the user taps
  response: string;   // What Asha "says" in return
  topic: 'exhausted' | 'overwhelmed' | 'anxious' | 'lonely' | 'sad' | 'angry' | 'numb' | 'guilty' | 'cant-sleep';
}

export const fallbackIntro =
  "I'm having trouble connecting to my fuller self right now. But I'm still here — and these are things I often say when mothers share what you might be feeling. Tap one if it fits.";

export const fallbackOptions: FallbackOption[] = [
  {
    id: 'exhausted',
    label: "I'm so tired",
    topic: 'exhausted',
    response: "Exhaustion this deep is its own kind of pain — it's not just tiredness, it's a debt your body can't repay on schedule. You don't need to earn rest. You don't need to deserve it. If you can close your eyes for 30 seconds right now, do that. Nothing else needs to happen in this moment.",
  },
  {
    id: 'overwhelmed',
    label: "I can't handle this",
    topic: 'overwhelmed',
    response: "Overwhelm is your nervous system saying 'this is too much' — and it's right. You don't have to solve it. You just have to ride this wave until it settles. One breath in, slower breath out. Put the baby somewhere safe if you need to. Walk to another room for sixty seconds. That's allowed.",
  },
  {
    id: 'anxious',
    label: "My thoughts are racing",
    topic: 'anxious',
    response: "The racing thoughts are not the truth. They're your brain trying to protect you by thinking of every possible wrong outcome. That loop is exhausting. Try this: name one thing you can see, one thing you can hear, one thing you can feel against your skin. Anchoring your senses can break the spiral.",
  },
  {
    id: 'lonely',
    label: "I feel alone",
    topic: 'lonely',
    response: "Loneliness inside motherhood is a specific kind of pain — because you're never physically alone, but you can feel invisible. What you're experiencing is real, and many mothers feel exactly this, right now, tonight. You're not unusual. You're not broken. You're in the quietest stretch of a shared journey.",
  },
  {
    id: 'sad',
    label: "I'm crying and I don't know why",
    topic: 'sad',
    response: "Tears don't need a reason, especially in postpartum. Your body is recalibrating. Your hormones are shifting daily. Sadness can arrive without warning — not because you're failing, but because you're healing. Let the tears come. They are not a sign that something is wrong with you.",
  },
  {
    id: 'angry',
    label: "I'm furious and I don't want to be",
    topic: 'angry',
    response: "Rage in motherhood is not talked about enough — but it's common, and it's a signal, not a flaw. You are running on no sleep, no space, no time to yourself. Anger is what surfaces when your needs haven't been met for too long. Put the baby somewhere safe, step into another room, and let yourself feel it without judging yourself for it.",
  },
  {
    id: 'numb',
    label: "I feel nothing",
    topic: 'numb',
    response: "Numbness is a protection — your system turning down the volume because everything has been too loud for too long. It's not a sign you don't love your baby. It's a sign you haven't had enough of yourself. If you can, place your hand on your chest and just notice the warmth. You're still here.",
  },
  {
    id: 'guilty',
    label: "I feel like a bad mom",
    topic: 'guilty',
    response: "The mothers who worry about being bad mothers are almost always good ones. The worry itself is a sign that you care. You are allowed to be imperfect. You are allowed to want things that aren't about your baby. Your value is not measured in perfect moments — it's in showing up, over and over, the way you already are.",
  },
  {
    id: 'cant-sleep',
    label: "I can't sleep even when baby sleeps",
    topic: 'cant-sleep',
    response: "That inability to sleep even when you could is cruel, and it's common. Your brain is on watch duty — it won't let you rest because some part of you is still listening for the baby. That's not a failure of willpower. Try this: if you're awake at 3am, don't fight the sleep. Read something gentle. Breathe slowly. Sleep will come when your body trusts it's safe.",
  },
];
