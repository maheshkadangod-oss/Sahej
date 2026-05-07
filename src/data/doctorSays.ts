// "What your doctor actually says" — curated answers to the 15 most common
// postpartum anxieties. Written in plain language, based on:
// - WHO postnatal care guidelines (2022)
// - ACOG Optimizing Postpartum Care guidance
// - Indian Academy of Pediatrics breastfeeding guidance
// - Standard pediatric developmental milestones
//
// NOT medical advice for individual cases. Always refer to your own doctor.
// This is meant to replace frantic 3am Googling with something steadier.

export interface DoctorSays {
  id: string;
  category: 'baby-sleep' | 'feeding' | 'baby-cry' | 'mom-body' | 'bonding' | 'milestones' | 'emotions';
  question: string;
  summary: string;    // one-line quick answer
  body: string;       // 2–4 sentence paragraph
  whenToWorry?: string; // the "but call your doctor if..." bit
}

export const doctorSaysIntro =
  "The 3am questions you didn't want to Google. Plain answers, written to sound like a doctor who has time for you.";

export const doctorSays: DoctorSays[] = [
  // --- Baby sleep ---
  {
    id: 'sleep-through',
    category: 'baby-sleep',
    question: "My baby isn't sleeping through the night. Is something wrong?",
    summary: "Nothing is wrong. 'Sleeping through the night' rarely happens before 4–6 months.",
    body: "Newborns have tiny stomachs and need to feed every 2–3 hours, including at night. Most babies don't sleep 6–8 hour stretches until at least 4 months, and often much later. Your baby is not broken. You are not failing.",
    whenToWorry: "Call your doctor if baby is very hard to wake for feeds, missing wet nappies, or sleeping so deeply you're concerned.",
  },
  {
    id: 'sleep-short',
    category: 'baby-sleep',
    question: "My baby only naps 20–40 minutes. Is that enough?",
    summary: "Short naps are normal. Babies cycle through sleep phases quickly.",
    body: "Many babies only manage one sleep cycle (30–45 min) at a time until around 4 months. Total daytime sleep matters more than individual nap length. If they're feeding well, active when awake, and generally content, nap length isn't a problem.",
  },
  {
    id: 'sleep-noise',
    category: 'baby-sleep',
    question: "My baby grunts and makes noise all night. Are they okay?",
    summary: "Yes. Newborns are famously noisy sleepers.",
    body: "Newborns grunt, squirm, make 'pig' noises, and even cry in their sleep. This is normal — their nervous systems are still maturing. If breathing is regular and they're not in distress, they're fine.",
  },

  // --- Feeding ---
  {
    id: 'milk-supply',
    category: 'feeding',
    question: "I'm not producing enough milk. How do I know?",
    summary: "Check wet nappies and weight, not breast feel.",
    body: "Breasts feeling 'empty' is not a reliable sign of low supply — your breasts become efficient at making just what baby needs. The real signs are 6+ wet nappies a day (after day 5), steady weight gain, and baby seeming settled after feeds.",
    whenToWorry: "If baby has fewer wet nappies, isn't gaining weight, or feeds are getting shorter and more frantic, call your paediatrician or a lactation consultant.",
  },
  {
    id: 'cluster-feeding',
    category: 'feeding',
    question: "Baby wants to feed constantly in the evening. Am I doing something wrong?",
    summary: "This is cluster feeding. It's normal and temporary.",
    body: "Most babies cluster-feed in late afternoon/evening — sometimes for hours. It's not a supply issue; it's how they build up for a longer stretch of sleep and boost your supply. It usually eases by 3–4 months.",
  },
  {
    id: 'formula',
    category: 'feeding',
    question: "I'm thinking of switching to formula. Is that okay?",
    summary: "Yes. Fed is best. A healthy mom matters.",
    body: "Formula is safe, nutritionally complete, and has fed generations of healthy babies. The guilt some mothers feel comes from messaging, not medicine. If breastfeeding isn't working for you — for any reason — formula is a good choice. Your mental health and your relationship with your baby matter more than any feeding method.",
  },

  // --- Baby crying ---
  {
    id: 'cry-hours',
    category: 'baby-cry',
    question: "My baby cries for hours and I can't figure out why. What's wrong?",
    summary: "Often nothing. Crying peaks around 6–8 weeks and then eases.",
    body: "Babies cry — sometimes inconsolably — and it peaks around 6–8 weeks. This is called the 'Period of PURPLE Crying' and it's a normal developmental phase. You've checked feed, nappy, warm/cold, burp, cuddle. Sometimes there's no fixable reason. You're not failing.",
    whenToWorry: "A cry that sounds unusually high-pitched or weak, cry with fever, or a baby who suddenly becomes floppy — call your doctor.",
  },
  {
    id: 'put-baby-down',
    category: 'baby-cry',
    question: "Is it okay to put baby down and walk away if I'm overwhelmed?",
    summary: "Yes. A safe bassinet for 5 minutes is always better than a mother at her limit.",
    body: "If you're close to snapping, placing baby in a safe space (crib, bassinet, or a blanket on the floor) and stepping away for 5 minutes is the right call. A crying baby in a safe place for a few minutes is far less harm than a parent who hasn't reset. This is not 'giving up' — this is parenting with wisdom.",
  },

  // --- Mom's body ---
  {
    id: 'body-bleeding',
    category: 'mom-body',
    question: "How long should postpartum bleeding last?",
    summary: "Up to 6 weeks is normal, with gradual decrease.",
    body: "Lochia (postpartum bleeding) starts red and heavy, then becomes pink/brown, then yellow/white over 4–6 weeks. If it's suddenly heavier, bright red again after easing, or has a foul smell, contact your doctor.",
  },
  {
    id: 'body-pain',
    category: 'mom-body',
    question: "Sex hurts after having a baby. Will this get better?",
    summary: "Usually yes, with time and lubrication.",
    body: "Many women have pain with sex for 3–6 months postpartum, especially while breastfeeding (hormones dry tissues). Lubricant helps a lot. Pelvic floor physiotherapy helps if pain persists. You don't have to tolerate ongoing pain — talk to your doctor.",
  },
  {
    id: 'hair-loss',
    category: 'mom-body',
    question: "My hair is falling out in clumps. Am I okay?",
    summary: "Postpartum hair shedding is very normal.",
    body: "During pregnancy, hormones keep hair in the growth phase. Once hormones shift, 2–6 months postpartum, that 'stored' hair sheds all at once. It's normal, it feels alarming, and it regrows. Iron and vitamin D deficiencies can worsen it, so a blood test is reasonable.",
  },

  // --- Bonding ---
  {
    id: 'no-bond',
    category: 'bonding',
    question: "I don't feel bonded to my baby. Is something wrong with me?",
    summary: "This is far more common than you think. And it grows over time.",
    body: "The 'instant love' story is a myth for many mothers. Bonding is a process — it happens through thousands of small moments of feeding, rocking, making eye contact. If you feel numb or disconnected, you're not alone and you're not broken. It usually builds over weeks and months.",
    whenToWorry: "If disconnection persists past 3 months, or you feel no emotion towards your baby at all, this can be a sign of postpartum depression — which is very treatable. Talk to your doctor.",
  },
  {
    id: 'dont-enjoy',
    category: 'bonding',
    question: "I don't enjoy motherhood. Does that make me a bad mom?",
    summary: "No. Motherhood has real hardship and enjoying it always is a myth.",
    body: "Loving your baby and not enjoying motherhood are two different things — and both can be true. The social script says mothers glow. The reality includes exhaustion, loss of self, and mundane drudgery. Feeling this way does not make you a bad mother.",
  },

  // --- Milestones ---
  {
    id: 'milestone-smile',
    category: 'milestones',
    question: "When will my baby smile at me?",
    summary: "Real social smiles usually appear 6–8 weeks.",
    body: "Babies smile in their sleep from birth, but the first intentional social smile (in response to your face or voice) usually appears around 6–8 weeks. If it hasn't by 10–12 weeks, mention it at your next paediatric visit — often it's nothing, but it's worth noting.",
  },

  // --- Emotions ---
  {
    id: 'baby-blues-vs-ppd',
    category: 'emotions',
    question: "Am I having baby blues or postpartum depression?",
    summary: "Blues usually peak around day 5 and ease by 2 weeks. PPD lasts longer.",
    body: "Baby blues: tearfulness, mood swings, sensitivity — in the first 2 weeks, affecting up to 80% of mothers. Postpartum depression: persistent sadness, loss of interest, hopelessness — lasts longer than 2 weeks and interferes with daily life. PPD is treatable and common. The screening tool in Sahej (EPDS) is a gentle way to check where you are.",
  },
];

export const doctorSaysCategories: Array<{ key: DoctorSays['category']; label: string; emoji: string }> = [
  { key: 'baby-sleep', label: 'Baby sleep', emoji: '🌙' },
  { key: 'feeding', label: 'Feeding', emoji: '🍼' },
  { key: 'baby-cry', label: 'Baby crying', emoji: '😢' },
  { key: 'mom-body', label: 'Your body', emoji: '💐' },
  { key: 'bonding', label: 'Bonding', emoji: '💛' },
  { key: 'milestones', label: 'Milestones', emoji: '🌱' },
  { key: 'emotions', label: 'Your emotions', emoji: '🤍' },
];
