export interface Helpline {
  name: string;
  number: string;
  description: string;
  available: string;
  type: 'call' | 'text' | 'both';
}

export interface CountryHelplines {
  country: string;
  flag: string;
  code: string;
  helplines: Helpline[];
}

export const helplineData: CountryHelplines[] = [
  {
    country: "India",
    flag: "🇮🇳",
    code: "IN",
    helplines: [
      { name: "Vandrevala Foundation", number: "1860-2662-345", description: "Mental health helpline, multilingual support", available: "24/7", type: "call" },
      { name: "iCall (TISS)", number: "9152987821", description: "Psychosocial helpline by Tata Institute", available: "Mon-Sat, 8am-10pm", type: "call" },
      { name: "NIMHANS", number: "080-46110007", description: "National Institute of Mental Health", available: "24/7", type: "call" },
      { name: "Sneha India", number: "044-24640050", description: "Emotional support and suicide prevention", available: "24/7", type: "call" },
      { name: "Mpower", number: "1800-120-820050", description: "Free mental health helpline", available: "24/7", type: "call" },
    ]
  },
  {
    country: "United States",
    flag: "🇺🇸",
    code: "US",
    helplines: [
      { name: "Postpartum Support International", number: "1-800-944-4773", description: "Perinatal mood and anxiety disorders support", available: "24/7", type: "both" },
      { name: "988 Suicide & Crisis Lifeline", number: "988", description: "Mental health crisis support", available: "24/7", type: "both" },
      { name: "Crisis Text Line", number: "Text HOME to 741741", description: "Free crisis counseling via text", available: "24/7", type: "text" },
      { name: "SAMHSA Helpline", number: "1-800-662-4357", description: "Substance abuse and mental health", available: "24/7", type: "call" },
    ]
  },
  {
    country: "United Kingdom",
    flag: "🇬🇧",
    code: "UK",
    helplines: [
      { name: "PANDAS Foundation", number: "0808 196 1776", description: "Pre and postnatal depression support", available: "Mon-Sun, 11am-10pm", type: "call" },
      { name: "Samaritans", number: "116 123", description: "Emotional support for anyone in distress", available: "24/7", type: "call" },
      { name: "NHS Mental Health", number: "111", description: "NHS urgent mental health support", available: "24/7", type: "call" },
      { name: "Mind Infoline", number: "0300 123 3393", description: "Mental health information and support", available: "Mon-Fri, 9am-6pm", type: "call" },
    ]
  },
  {
    country: "Australia",
    flag: "🇦🇺",
    code: "AU",
    helplines: [
      { name: "PANDA", number: "1300 726 306", description: "Perinatal anxiety and depression helpline", available: "Mon-Fri, 9am-7:30pm", type: "call" },
      { name: "Lifeline", number: "13 11 14", description: "Crisis support and suicide prevention", available: "24/7", type: "both" },
      { name: "Beyond Blue", number: "1300 22 4636", description: "Anxiety, depression, and suicide prevention", available: "24/7", type: "call" },
    ]
  },
  {
    country: "Canada",
    flag: "🇨🇦",
    code: "CA",
    helplines: [
      { name: "Pacific Post Partum Support", number: "604-255-7999", description: "Postpartum depression support", available: "24/7", type: "call" },
      { name: "988 Suicide Crisis Helpline", number: "988", description: "Suicide prevention and crisis support", available: "24/7", type: "both" },
      { name: "Crisis Text Line", number: "Text CONNECT to 686868", description: "Free crisis support via text", available: "24/7", type: "text" },
    ]
  },
  {
    country: "South Africa",
    flag: "🇿🇦",
    code: "ZA",
    helplines: [
      { name: "SADAG", number: "0800 567 567", description: "South African Depression and Anxiety Group", available: "24/7", type: "call" },
      { name: "Lifeline South Africa", number: "0861 322 322", description: "Crisis intervention and counselling", available: "24/7", type: "call" },
    ]
  },
  {
    country: "Kenya",
    flag: "🇰🇪",
    code: "KE",
    helplines: [
      { name: "Befrienders Kenya", number: "+254 722 178 177", description: "Emotional support helpline", available: "24/7", type: "call" },
    ]
  },
  {
    country: "Nigeria",
    flag: "🇳🇬",
    code: "NG",
    helplines: [
      { name: "MANI (Mentally Aware Nigeria)", number: "+234 809 111 6264", description: "Mental health support", available: "24/7", type: "call" },
    ]
  },
  {
    country: "Germany",
    flag: "🇩🇪",
    code: "DE",
    helplines: [
      { name: "Telefonseelsorge", number: "0800 111 0 111", description: "Free crisis and counseling hotline", available: "24/7", type: "call" },
    ]
  },
  {
    country: "France",
    flag: "🇫🇷",
    code: "FR",
    helplines: [
      { name: "SOS Amitie", number: "09 72 39 40 50", description: "Emotional support and crisis helpline", available: "24/7", type: "call" },
    ]
  },
  {
    country: "Brazil",
    flag: "🇧🇷",
    code: "BR",
    helplines: [
      { name: "CVV", number: "188", description: "Centro de Valorização da Vida", available: "24/7", type: "both" },
    ]
  },
  {
    country: "Japan",
    flag: "🇯🇵",
    code: "JP",
    helplines: [
      { name: "TELL Lifeline", number: "03-5774-0992", description: "Mental health support in English/Japanese", available: "24/7", type: "call" },
    ]
  },
  {
    country: "Philippines",
    flag: "🇵🇭",
    code: "PH",
    helplines: [
      { name: "Hopeline", number: "0917-558-4673", description: "Crisis intervention center", available: "24/7", type: "both" },
    ]
  },
  {
    country: "UAE",
    flag: "🇦🇪",
    code: "AE",
    helplines: [
      { name: "Mental Health Helpline", number: "800-HOPE (4673)", description: "Government mental health support", available: "24/7", type: "call" },
    ]
  },
];
