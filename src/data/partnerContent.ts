export interface PartnerSection {
  id: string;
  emoji: string;
  title: string;
  intro: string;
  items: { text: string; detail?: string }[];
}

export const partnerSections: PartnerSection[] = [
  {
    id: 'ppd-signs',
    emoji: '🩺',
    title: 'Recognizing Postpartum Depression',
    intro: 'These signs may appear gradually. If several persist for more than 2 weeks, encourage her to talk to a healthcare provider.',
    items: [
      { text: 'Persistent sadness or feeling "empty"', detail: 'Not just baby blues — lasts beyond 2 weeks postpartum.' },
      { text: 'Withdrawal from baby, partner, or family', detail: 'She may seem distant or uninterested in things she used to enjoy.' },
      { text: 'Difficulty bonding with the baby', detail: 'This is not her fault. PPD can affect bonding — support, not judgment, helps.' },
      { text: 'Extreme fatigue beyond normal sleep deprivation', detail: 'Even after rest, she feels completely drained.' },
      { text: 'Changes in appetite — eating too much or too little' },
      { text: 'Intense irritability, anger, or mood swings' },
      { text: 'Feelings of worthlessness or guilt', detail: '"I\'m not a good enough mother" — this thought pattern is a red flag.' },
      { text: 'Difficulty concentrating or making decisions' },
      { text: 'Anxiety or panic attacks', detail: 'Racing heart, feeling of dread, inability to relax.' },
      { text: 'Thoughts of self-harm or harming the baby', detail: 'This is urgent. Contact a helpline immediately. She needs support, not blame.' },
    ],
  },
  {
    id: 'supporting-her',
    emoji: '💛',
    title: 'How to Support Her Daily',
    intro: 'Small, consistent actions matter more than grand gestures. She needs to feel seen, not fixed.',
    items: [
      { text: 'Take over one feeding or diaper change without being asked', detail: 'Anticipating needs shows you\'re paying attention.' },
      { text: 'Ask "How are you feeling?" and truly listen', detail: 'Don\'t try to solve — just hold space. "That sounds really hard" goes a long way.' },
      { text: 'Handle household tasks without prompting', detail: 'Dishes, laundry, cooking — every task you handle is one less burden.' },
      { text: 'Encourage her to rest or take a break', detail: '"I\'ve got the baby — go take a bath, a nap, or just sit quietly."' },
      { text: 'Protect her sleep when possible', detail: 'Take the early morning shift. Even one extra hour makes a difference.' },
      { text: 'Limit visitors when she\'s overwhelmed', detail: 'Be the gatekeeper. It\'s okay to say "We\'re not up for visitors today."' },
      { text: 'Validate her feelings without minimizing', detail: 'Avoid "at least..." or "other moms manage." Instead: "Your feelings are valid."' },
      { text: 'Bring her water, snacks, and meals regularly', detail: 'Breastfeeding burns 500+ extra calories. She may forget to eat.' },
      { text: 'Compliment her — not just about the baby', detail: '"You\'re doing an amazing job" or "I\'m proud of you" means everything.' },
      { text: 'Be patient with changes in intimacy', detail: 'Recovery takes time. Emotional closeness builds physical comfort.' },
    ],
  },
  {
    id: 'baby-care',
    emoji: '👶',
    title: 'Shared Baby Care Checklist',
    intro: 'Divide and conquer. Sharing responsibilities prevents burnout and helps both parents bond with baby.',
    items: [
      { text: 'Night feedings or bottle prep' },
      { text: 'Morning diaper and outfit change' },
      { text: 'Burping and soothing after feeds' },
      { text: 'Bath time routine' },
      { text: 'Tummy time and play' },
      { text: 'Doctor appointment scheduling and attendance' },
      { text: 'Sterilizing bottles and pump parts' },
      { text: 'Tracking feeding and diaper schedule' },
      { text: 'Bedtime routine (swaddle, story, song)' },
      { text: 'Emergency bag — keep the diaper bag stocked' },
    ],
  },
  {
    id: 'bonding',
    emoji: '👨‍👩‍👧',
    title: 'Family Bonding Activities',
    intro: 'Bonding doesn\'t need to be elaborate. Simple, consistent presence creates lasting connections.',
    items: [
      { text: 'Skin-to-skin time', detail: 'Not just for mom — partners benefit from skin-to-skin too. Baby recognizes your warmth.' },
      { text: 'Read aloud together', detail: 'Baby loves your voice. Even reading the news aloud counts!' },
      { text: 'Gentle walks as a family', detail: 'Fresh air, sunshine, and a change of scenery help everyone\'s mood.' },
      { text: 'Sing or play music together', detail: 'Lullabies, your favorite songs — baby doesn\'t critique your singing.' },
      { text: 'Massage baby together', detail: 'Learn infant massage. It soothes baby and builds your confidence.' },
      { text: 'Take photos and create memories', detail: 'These early days are a blur. Capture moments — even the messy ones.' },
      { text: 'Cook a meal together while baby naps', detail: 'Teamwork in the kitchen. Keep it simple and enjoy the process.' },
      { text: 'Have a "couch date" after baby sleeps', detail: 'Watch a show, share a dessert, just be together. No screens rule optional.' },
    ],
  },
  {
    id: 'partner-selfcare',
    emoji: '🧘‍♂️',
    title: 'Partner Self-Care',
    intro: 'You can\'t pour from an empty cup either. Taking care of yourself is not selfish — it\'s necessary.',
    items: [
      { text: 'Acknowledge your own feelings', detail: 'Partners can experience postnatal depression too. Your feelings are valid.' },
      { text: 'Keep one hobby or outlet alive', detail: 'Even 20 minutes a week of something you enjoy helps maintain identity.' },
      { text: 'Talk to someone — friend, family, or professional', detail: 'You don\'t have to process everything alone.' },
      { text: 'Get outside for fresh air daily', detail: 'A short walk alone clears the mind and recharges energy.' },
      { text: 'Accept help from others', detail: 'When someone offers, say yes. Meals, errands, babysitting — take it all.' },
      { text: 'Set realistic expectations', detail: 'The house won\'t be spotless. Meals won\'t be gourmet. That\'s completely okay.' },
      { text: 'Stay connected with your partner', detail: 'Quick check-ins: "How\'s your day?" Keep the communication flowing.' },
      { text: 'Educate yourself about postpartum changes', detail: 'Understanding what she\'s going through physically and emotionally builds empathy.' },
    ],
  },
];
