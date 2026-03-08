export interface Milestone {
  month: number;
  title: string;
  physical: string[];
  cognitive: string[];
  social: string[];
  parentTip: string;
}

export interface ParentingTip {
  id: string;
  title: string;
  content: string;
  category: 'feeding' | 'sleep' | 'bonding' | 'selfcare' | 'health' | 'development';
  emoji: string;
}

export interface ResourceLink {
  title: string;
  url: string;
  source: string;
  emoji: string;
}

export const milestones: Milestone[] = [
  {
    month: 0,
    title: "Newborn (0-1 month)",
    physical: ["Lifts head briefly when on tummy", "Strong grasp reflex", "Moves arms and legs actively"],
    cognitive: ["Focuses on faces 8-12 inches away", "Recognizes mother's voice", "Startles at loud sounds"],
    social: ["Prefers looking at faces", "Calms when held or hearing familiar voice", "Cries to communicate needs"],
    parentTip: "Skin-to-skin contact is magical. It regulates baby's temperature, heartbeat, and builds bonding."
  },
  {
    month: 1,
    title: "1 Month",
    physical: ["Lifts head briefly during tummy time", "Makes jerky arm movements", "Brings hands near face"],
    cognitive: ["Follows objects briefly with eyes", "Recognizes some sounds", "Begins to focus and look at you"],
    social: ["Begins to smile at people", "Can briefly calm themselves", "Tries to look at parent"],
    parentTip: "Talk to your baby constantly. Narrate what you're doing. They learn language from day one."
  },
  {
    month: 2,
    title: "2 Months",
    physical: ["Holds head up more steadily", "Smoother movements", "Pushes up during tummy time"],
    cognitive: ["Pays attention to faces", "Begins to follow things with eyes", "Recognizes people at a distance"],
    social: ["First real smiles", "Coos and makes gurgling sounds", "Turns head toward sounds"],
    parentTip: "Respond to your baby's coos and smiles. This back-and-forth builds their communication skills."
  },
  {
    month: 3,
    title: "3 Months",
    physical: ["Raises head and chest during tummy time", "Opens and shuts hands", "Brings hand to mouth"],
    cognitive: ["Watches faces intently", "Follows moving objects", "Recognizes familiar objects and people"],
    social: ["Smiles at the sound of your voice", "Begins to babble and imitate sounds", "Enjoys playing with others"],
    parentTip: "Give baby lots of tummy time. Start with short periods and work up. It builds neck and core strength."
  },
  {
    month: 4,
    title: "4 Months",
    physical: ["Holds head steady without support", "Pushes down on legs when feet on hard surface", "May roll from tummy to back"],
    cognitive: ["Reaches for toys with one hand", "Uses eyes and hands together", "Watches faces closely"],
    social: ["Enjoys playing, may cry when play stops", "Copies movements and facial expressions", "Babbles with expression"],
    parentTip: "Place colorful toys just out of reach during tummy time to encourage reaching and rolling."
  },
  {
    month: 5,
    title: "5 Months",
    physical: ["Rolls from front to back", "Sits with support", "Reaches for and grasps objects"],
    cognitive: ["Explores objects by putting them in mouth", "Transfers toys between hands", "Shows curiosity about things out of reach"],
    social: ["Knows familiar faces vs strangers", "Responds to own name", "Loves to look at self in mirror"],
    parentTip: "Read to your baby every day. Board books with high-contrast images are perfect at this age."
  },
  {
    month: 6,
    title: "6 Months",
    physical: ["Rolls in both directions", "Begins to sit without support", "Rocks back and forth on hands and knees"],
    cognitive: ["Brings things to mouth", "Shows curiosity and tries to grab things out of reach", "Passes things from one hand to other"],
    social: ["Responds to other people's emotions", "Enjoys looking at self in mirror", "Strings vowels together (ah, eh, oh)"],
    parentTip: "Around 6 months, you can start introducing solid foods. Begin with single-grain cereals or pureed vegetables."
  },
  {
    month: 7,
    title: "7 Months",
    physical: ["Sits without support", "Supports whole weight on legs", "Uses raking grasp to pull objects closer"],
    cognitive: ["Finds partially hidden objects", "Explores with hands and mouth", "Tracks moving things with eyes easily"],
    social: ["Enjoys social play", "Responds to expressions of emotion", "Babbles chains of consonants (bababa)"],
    parentTip: "Create a safe space for baby to practice sitting and reaching. Remove small objects they could choke on."
  },
  {
    month: 8,
    title: "8 Months",
    physical: ["Gets into sitting position independently", "Pulls to stand", "Crawling may begin"],
    cognitive: ["Looks for hidden objects (object permanence)", "Plays peek-a-boo", "Uses pincer grasp developing"],
    social: ["May be clingy with familiar adults", "Stranger anxiety may appear", "Points at objects"],
    parentTip: "Baby-proof your home now. Get down to baby's eye level and look for hazards you might miss."
  },
  {
    month: 9,
    title: "9 Months",
    physical: ["Crawls well", "Pulls to stand using furniture", "May stand briefly without support"],
    cognitive: ["Understands 'no'", "Uses pincer grasp (thumb and finger)", "Bangs two objects together"],
    social: ["Has favorite toys", "May be afraid of strangers", "Copies sounds and gestures of others"],
    parentTip: "Play 'where did it go?' games. Hide a toy under a blanket and let baby find it. Great for brain development."
  },
  {
    month: 10,
    title: "10 Months",
    physical: ["Cruises along furniture", "Stands for a few seconds unsupported", "Points with index finger"],
    cognitive: ["Explores objects in many ways (shaking, throwing, banging)", "Starts using objects correctly (cup, phone)", "Finds hidden things easily"],
    social: ["Uses simple gestures like shaking head 'no'", "Waves bye-bye", "Says 'mama' and 'dada' with meaning"],
    parentTip: "Encourage walking by holding baby's hands and letting them practice steps. Don't rush it though."
  },
  {
    month: 11,
    title: "11 Months",
    physical: ["Stands alone well", "May take first steps", "Picks up small objects with pincer grasp"],
    cognitive: ["Puts things in and out of containers", "Lets go of objects voluntarily", "Follows simple instructions"],
    social: ["Says 1-3 words besides mama/dada", "Explores everything", "Tests limits and boundaries"],
    parentTip: "Let baby self-feed with finger foods. Messy eating builds fine motor skills and independence."
  },
  {
    month: 12,
    title: "12 Months (1 Year!)",
    physical: ["May walk independently", "Sits down from standing", "Helps with dressing (pushes arm through)"],
    cognitive: ["Follows simple directions like 'pick up the toy'", "Uses objects correctly (cup, brush)", "Tries to imitate words"],
    social: ["Cries when parent leaves", "Has favorite things and people", "Shows fear in some situations"],
    parentTip: "Celebrate this milestone! Your baby is now a toddler. Keep reading, singing, and playing together every day."
  },
];

export const parentingTips: ParentingTip[] = [
  {
    id: "feed1",
    title: "Breastfeeding Basics",
    content: "Feed on demand, roughly every 2-3 hours for newborns. Look for hunger cues: rooting, lip smacking, bringing hands to mouth. A good latch should feel like a tug, not a pinch. If it hurts, break the latch and try again. Seek help from a lactation consultant if needed.",
    category: "feeding",
    emoji: "🤱"
  },
  {
    id: "feed2",
    title: "Formula Feeding Tips",
    content: "Formula is a perfectly healthy option. Follow package instructions exactly for mixing. Never microwave bottles. Hold baby semi-upright and pace the feeding. Discard unused formula after 1 hour at room temperature.",
    category: "feeding",
    emoji: "🍼"
  },
  {
    id: "feed3",
    title: "Starting Solids (6+ months)",
    content: "Start with single-ingredient purees: sweet potato, banana, avocado, rice cereal. Introduce one new food every 3-5 days to watch for allergies. Let baby explore textures. It's normal for them to spit food out at first.",
    category: "feeding",
    emoji: "🥑"
  },
  {
    id: "sleep1",
    title: "Safe Sleep Guidelines",
    content: "Always place baby on their back to sleep. Use a firm, flat mattress with a fitted sheet. Keep the crib free of blankets, pillows, bumpers, and toys. Room-sharing (not bed-sharing) is recommended for the first 6-12 months.",
    category: "sleep",
    emoji: "😴"
  },
  {
    id: "sleep2",
    title: "Newborn Sleep Patterns",
    content: "Newborns sleep 14-17 hours per day in short stretches. Day-night confusion is normal and usually resolves by 6-8 weeks. Keep nights dark and quiet, days bright and active to help establish circadian rhythm.",
    category: "sleep",
    emoji: "🌙"
  },
  {
    id: "sleep3",
    title: "Building a Bedtime Routine",
    content: "Start a consistent bedtime routine around 6-8 weeks: warm bath, massage, pajamas, feeding, lullaby, and into the crib drowsy but awake. Consistency is key. The routine signals to baby that sleep is coming.",
    category: "sleep",
    emoji: "🛁"
  },
  {
    id: "bond1",
    title: "Skin-to-Skin Contact",
    content: "Skin-to-skin contact regulates baby's heart rate, breathing, and temperature. It promotes bonding and breastfeeding success. Both parents can do it. Try to do it daily, especially in the first few weeks.",
    category: "bonding",
    emoji: "💕"
  },
  {
    id: "bond2",
    title: "Baby Massage",
    content: "Gentle massage after bath time promotes bonding and relaxation. Use natural oil (coconut or olive). Stroke gently from head to toe. Talk or sing softly while massaging. Follow baby's cues and stop if they seem uncomfortable.",
    category: "bonding",
    emoji: "👐"
  },
  {
    id: "bond3",
    title: "Talk, Sing, and Read",
    content: "Narrate your day to baby. Sing lullabies and nursery rhymes. Read board books from birth. Babies learn language from hearing words, even before they can understand them. Your voice is their favorite sound.",
    category: "bonding",
    emoji: "📖"
  },
  {
    id: "self1",
    title: "Postpartum Recovery",
    content: "Physical recovery takes 6-8 weeks minimum. Rest when baby rests. Accept help from family and friends. Eat nutritious meals. Stay hydrated. Gentle walking is good when you feel ready. Don't rush back to pre-pregnancy routines.",
    category: "selfcare",
    emoji: "🌸"
  },
  {
    id: "self2",
    title: "Recognizing Postpartum Depression",
    content: "Baby blues (mood swings, crying, anxiety) are normal for 2 weeks after birth. If feelings persist beyond 2 weeks, intensify, or include thoughts of harming yourself or baby, please reach out to a healthcare provider immediately. You are not alone.",
    category: "selfcare",
    emoji: "🫂"
  },
  {
    id: "self3",
    title: "Building Your Support System",
    content: "Join a new mothers' group (online or local). Accept offers of help with meals, cleaning, or watching the baby. Communicate your needs to your partner. It truly takes a village. Don't hesitate to ask for professional help.",
    category: "selfcare",
    emoji: "🤝"
  },
  {
    id: "health1",
    title: "When to Call the Doctor",
    content: "Call immediately for: fever above 100.4F (38C) in babies under 3 months, difficulty breathing, refusing to eat, excessive crying or lethargy, rash with fever, fewer than 6 wet diapers in 24 hours, or any concern that worries you.",
    category: "health",
    emoji: "🏥"
  },
  {
    id: "health2",
    title: "Vaccination Schedule",
    content: "Vaccinations protect your baby from serious diseases. Follow the schedule recommended by your pediatrician. Common vaccines in the first year: Hepatitis B, DTaP, Polio, Hib, PCV, Rotavirus, Flu. Keep a record of all vaccinations.",
    category: "health",
    emoji: "💉"
  },
  {
    id: "health3",
    title: "Tummy Time is Essential",
    content: "Start tummy time from day one, just a few minutes at a time. It builds neck, shoulder, and core muscles needed for rolling, sitting, and crawling. Place colorful toys in front for motivation. Always supervise tummy time.",
    category: "development",
    emoji: "👶"
  },
  {
    id: "dev1",
    title: "Encouraging Motor Skills",
    content: "Let baby play on the floor with age-appropriate toys. Avoid keeping them in bouncers or seats for too long. Give them safe objects to grasp, shake, and explore. Follow their lead and make play fun, not forced.",
    category: "development",
    emoji: "🧸"
  },
];

export const resourceLinks: ResourceLink[] = [
  { title: "WHO - Infant and Young Child Feeding", url: "https://www.who.int/news-room/fact-sheets/detail/infant-and-young-child-feeding", source: "World Health Organization", emoji: "🌍" },
  { title: "CDC Developmental Milestones", url: "https://www.cdc.gov/ncbddd/actearly/milestones/index.html", source: "CDC", emoji: "📋" },
  { title: "La Leche League - Breastfeeding Support", url: "https://www.llli.org/breastfeeding-info/", source: "La Leche League International", emoji: "🤱" },
  { title: "Postpartum Support International", url: "https://www.postpartum.net/", source: "PSI", emoji: "💜" },
  { title: "Zero to Three - Early Development", url: "https://www.zerotothree.org/", source: "Zero to Three", emoji: "👣" },
  { title: "KellyMom - Evidence-Based Breastfeeding", url: "https://kellymom.com/", source: "KellyMom", emoji: "📚" },
  { title: "Safe Sleep Guidelines - AAP", url: "https://www.aap.org/en/patient-care/safe-sleep/", source: "American Academy of Pediatrics", emoji: "🛏️" },
  { title: "Mental Health & Motherhood - NIMH", url: "https://www.nimh.nih.gov/health/publications/perinatal-depression", source: "NIMH", emoji: "🧠" },
  { title: "Unicef - Early Childhood Development", url: "https://www.unicef.org/early-childhood-development", source: "UNICEF", emoji: "🦋" },
  { title: "Indian Academy of Pediatrics", url: "https://iapindia.org/", source: "IAP", emoji: "🇮🇳" },
];
