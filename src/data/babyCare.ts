// Baby-care reference content: complementary-feeding guidance and the childhood immunization
// schedule. This is GENERAL REFERENCE information for Indian families, not medical advice.
// A pediatrician's guidance and the child's actual prescribed schedule always take precedence.
// Feeding guidance follows WHO/IAP complementary-feeding principles; the vaccine schedule
// combines India's government NIS (free) and the IAP (Indian Academy of Pediatrics) schedule.

export interface FeedingStage {
  /** Inclusive age range in months this stage applies to. */
  fromMonth: number;
  toMonth: number;
  label: string;
  mealsPerDay: string;
  quantity: string;
  consistency: string;
  /** India-appropriate example foods. */
  foods: string[];
  tip: string;
}

export const feedingStages: FeedingStage[] = [
  {
    fromMonth: 6, toMonth: 6,
    label: '6 months — starting solids',
    mealsPerDay: '1–2 meals + breastmilk/formula on demand',
    quantity: 'Start with 1–2 teaspoons, build to 2–3 tablespoons per meal',
    consistency: 'Smooth, runny purées and mashes',
    foods: ['Ragi (finger-millet) porridge', 'Dal water → soft mashed dal-rice', 'Mashed ripe banana', 'Stewed & mashed apple or pear', 'Mashed potato or sweet potato', 'Well-cooked mashed carrot or pumpkin'],
    tip: 'Introduce one new food at a time and wait ~3 days before the next, so you can spot any reaction.',
  },
  {
    fromMonth: 7, toMonth: 8,
    label: '7–8 months — building variety',
    mealsPerDay: '2–3 meals + breastmilk/formula',
    quantity: '3–4 tablespoons, building toward ½ cup per meal',
    consistency: 'Thicker mashes with soft lumps',
    foods: ['Soft khichdi (rice + moong dal)', 'Mashed paneer', 'Plain curd / yogurt', 'Suji (semolina) porridge', 'Mashed seasonal fruits', 'Well-cooked mashed vegetables', 'Soft idli or chapati soaked in dal'],
    tip: 'Offer a few sips of water with meals now that solids are increasing.',
  },
  {
    fromMonth: 9, toMonth: 11,
    label: '9–11 months — soft finger foods',
    mealsPerDay: '3 meals + 1–2 snacks + breastmilk/formula',
    quantity: 'About ½ cup per meal',
    consistency: 'Mashed, minced, and soft finger foods',
    foods: ['Khichdi or dal-rice with a little ghee', 'Small soft idli/dosa pieces', 'Steamed soft vegetable sticks', 'Soft fruit pieces', 'Mashed egg yolk (if non-veg)', 'Ragi or oats porridge', 'Paneer cubes'],
    tip: 'Encourage self-feeding with soft finger foods — it builds coordination. Expect mess; that’s learning.',
  },
  {
    fromMonth: 12, toMonth: 24,
    label: '12 months+ — joining the family table',
    mealsPerDay: '3 meals + 2 snacks — mostly family food',
    quantity: 'About ¾–1 cup per meal',
    consistency: 'Chopped family foods, lightly spiced',
    foods: ['Soft chapati with dal/sabzi', 'Rice & khichdi with vegetables', 'Whole milk & dairy', 'Eggs, soft meats or fish (if non-veg)', 'Cut soft fruits & vegetables', 'Food from the family pot'],
    tip: 'Baby can share most family meals now. Keep it lightly spiced and go easy on added salt and sugar.',
  },
];

/** Universal safety rules shown alongside any feeding stage. */
export const feedingGoldenRules: string[] = [
  'Keep breastfeeding (or formula) alongside solids through the first year and beyond.',
  'No added salt, sugar, or honey before 12 months.',
  'No whole cow’s milk as a main drink before 12 months (small amounts in cooking are fine).',
  'Avoid choking hazards: whole nuts, whole grapes, hard raw vegetables, popcorn.',
  'Always supervise meals. Never prop a bottle or leave baby alone while eating.',
];

export type VaccineSource = 'NIS' | 'IAP' | 'both';

export interface VaccineDose {
  id: string;
  /** Human label for the visit age. */
  ageLabel: string;
  /** Offset from birth in days, used to compute a due date from the baby's birth date. */
  ageDays: number;
  /** Vaccines given at this visit. */
  vaccines: string[];
  /** Which schedule(s) recommend this visit. */
  source: VaccineSource;
  note?: string;
}

// Combined India schedule (NIS = free government vaccines; IAP = Indian Academy of Pediatrics,
// used by most private pediatricians and including optional/paid vaccines). Ages are the
// standard recommended ages; a few weeks' variation is normal — follow your pediatrician.
export const vaccineSchedule: VaccineDose[] = [
  { id: 'birth', ageLabel: 'At birth', ageDays: 0, source: 'both', vaccines: ['BCG', 'OPV-0', 'Hepatitis B-1'] },
  { id: '6w', ageLabel: '6 weeks', ageDays: 42, source: 'both', vaccines: ['DTwP/DTaP-1', 'IPV-1', 'Hep B-2', 'Hib-1', 'Rotavirus-1', 'PCV-1'], note: 'NIS gives this as Pentavalent (DPT+HepB+Hib) + OPV + Rota + fIPV + PCV.' },
  { id: '10w', ageLabel: '10 weeks', ageDays: 70, source: 'both', vaccines: ['DTwP/DTaP-2', 'IPV-2', 'Hib-2', 'Rotavirus-2', 'PCV-2'] },
  { id: '14w', ageLabel: '14 weeks', ageDays: 98, source: 'both', vaccines: ['DTwP/DTaP-3', 'IPV-3', 'Hib-3', 'Rotavirus-3', 'PCV-3'] },
  { id: '6m', ageLabel: '6 months', ageDays: 182, source: 'NIS', vaccines: ['Hep B-3', 'OPV-1'], note: 'IAP: influenza vaccine may also be offered around this age.' },
  { id: '9m', ageLabel: '9 months', ageDays: 273, source: 'both', vaccines: ['MR / MMR-1', 'OPV-2', 'Vitamin A-1'], note: 'JE vaccine is added in endemic districts (NIS).' },
  { id: '9-12m', ageLabel: '9–12 months', ageDays: 300, source: 'IAP', vaccines: ['Typhoid Conjugate (TCV)'] },
  { id: '12m', ageLabel: '12 months', ageDays: 365, source: 'IAP', vaccines: ['Hepatitis A-1'] },
  { id: '15m', ageLabel: '15 months', ageDays: 456, source: 'IAP', vaccines: ['MMR-2', 'Varicella-1', 'PCV booster'] },
  { id: '16-18m', ageLabel: '16–18 months', ageDays: 510, source: 'both', vaccines: ['DTwP/DTaP booster-1', 'IPV booster', 'Hib booster'], note: 'NIS gives DPT booster + MR-2 + OPV booster around 16–24 months.' },
  { id: '18m', ageLabel: '18 months', ageDays: 548, source: 'IAP', vaccines: ['Hepatitis A-2', 'Varicella-2 (or at 4–6 yrs)'] },
];

export const vaccineDisclaimer =
  'This schedule combines India’s government (NIS) and IAP recommendations as a general reference. ' +
  'Your pediatrician and your child’s actual prescription always take precedence. Exact ages and brands vary.';

export const feedingDisclaimer =
  'General guidance based on WHO/IAP complementary-feeding principles. Every baby is different — ' +
  'follow your pediatrician’s advice, especially around allergies or any feeding concerns.';
