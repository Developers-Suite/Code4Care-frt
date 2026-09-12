export interface MythBusterItem {
  id: string;
  category: string;
  myth: string;
  fact: string;
  source: string;
}

const englishMyths: MythBusterItem[] = [
  // Pregnancy
  {
    id: "pregnancy-first-time",
    category: "Pregnancy",
    myth: "You cannot get pregnant the first time you have sex",
    fact: "This is false. Pregnancy can happen any time unprotected sex occurs, including the first time.",
    source: "SRH Guide Ghana"
  },
  {
    id: "pregnancy-during-period",
    category: "Pregnancy",
    myth: "You cannot get pregnant during your period",
    fact: "This is false. Pregnancy is still possible because sperm can survive and cycles can vary.",
    source: "World Health Organization"
  },
  {
    id: "pregnancy-spotting-not-pregnant",
    category: "Pregnancy",
    myth: "Spotting or light bleeding means you are not pregnant",
    fact: "This is false. Some people have bleeding or spotting early in pregnancy.",
    source: "American College of Obstetricians and Gynecologists"
  },
  {
    id: "pregnancy-mood-harmful",
    category: "Pregnancy",
    myth: "Being upset during pregnancy harms the baby",
    fact: "This is false. Normal emotions are part of pregnancy and do not harm fetal development.",
    source: "NHS"
  },
  {
    id: "pregnancy-exercise-miscarriage",
    category: "Pregnancy",
    myth: "Exercise during pregnancy causes miscarriage",
    fact: "This is false. Gentle, approved exercise is usually safe and beneficial during pregnancy.",
    source: "Mayo Clinic"
  },
  {
    id: "pregnancy-douching-prevents",
    category: "Pregnancy",
    myth: "Douching or washing after sex prevents pregnancy",
    fact: "This is false. Sperm enter the cervix within seconds after ejaculation; washing or douching does not prevent pregnancy and can increase infection risk.",
    source: "World Health Organization"
  },
  {
    id: "pregnancy-pull-out-100-percent",
    category: "Pregnancy",
    myth: "The withdrawal (pull-out) method is 100% effective against pregnancy",
    fact: "This is false. Pre-ejaculatory fluid can contain active sperm, and timing errors lead to high failure rates without barrier or hormonal contraception.",
    source: "Planned Parenthood"
  },

  // Contraception
  {
    id: "contraception-condoms-only-late",
    category: "Contraception",
    myth: "Condoms are only needed when there is obvious risk",
    fact: "This is false. Condoms are most effective when used consistently and correctly for every sexual encounter.",
    source: "Planned Parenthood"
  },
  {
    id: "contraception-pill-infertility",
    category: "Contraception",
    myth: "The pill causes permanent infertility",
    fact: "This is false. Most people can become pregnant after stopping hormonal contraception.",
    source: "Mayo Clinic"
  },
  {
    id: "contraception-antibiotics-fail",
    category: "Contraception",
    myth: "Certain antibiotics make birth control ineffective",
    fact: "This is mostly false. Most antibiotics do not reduce hormonal contraceptive effectiveness.",
    source: "American Academy of Family Physicians"
  },
  {
    id: "contraception-caffeine-fail",
    category: "Contraception",
    myth: "Caffeine makes hormonal birth control less effective",
    fact: "This is false. Caffeine does not reduce contraceptive protection.",
    source: "Planned Parenthood"
  },
  {
    id: "contraception-age-limit",
    category: "Contraception",
    myth: "Birth control is only for adults over 18",
    fact: "This is false. Minors can access contraception based on local laws and clinic policies.",
    source: "World Health Organization"
  },
  {
    id: "contraception-breaks-needed",
    category: "Contraception",
    myth: "You must take a break from hormonal birth control every year",
    fact: "This is false. There is no medical need for regular breaks from hormonal contraception.",
    source: "Royal College of Obstetricians and Gynaecologists"
  },
  {
    id: "contraception-double-condom",
    category: "Contraception",
    myth: "Using two condoms at once provides double protection",
    fact: "This is false. Using two condoms simultaneously creates friction that increases the risk of both condoms tearing.",
    source: "Centers for Disease Control and Prevention"
  },
  {
    id: "contraception-emergency-abortion",
    category: "Contraception",
    myth: "Emergency contraception (morning-after pill) causes an abortion",
    fact: "This is false. Emergency contraception works by delaying or preventing ovulation; it does not terminate an existing pregnancy.",
    source: "World Health Organization"
  },

  // STIs
  {
    id: "sti-no-symptoms",
    category: "STIs",
    myth: "If you have no symptoms, you do not need STI testing",
    fact: "This is false. Many STIs have no symptoms at first, so testing is still important.",
    source: "Centers for Disease Control and Prevention"
  },
  {
    id: "sti-only-adults",
    category: "STIs",
    myth: "Only adults get STIs",
    fact: "This is false. Anyone who is sexually active can be at risk if they are exposed.",
    source: "World Health Organization"
  },
  {
    id: "sti-monogamy-protection",
    category: "STIs",
    myth: "Monogamy alone prevents STIs",
    fact: "This is false. STIs can be present without infidelity and testing matters regardless.",
    source: "Centers for Disease Control and Prevention"
  },
  {
    id: "sti-visible-symptoms",
    category: "STIs",
    myth: "You can always see or feel STI symptoms",
    fact: "This is false. Many STIs are invisible and asymptomatic for months or years.",
    source: "World Health Organization"
  },
  {
    id: "sti-one-partner-only",
    category: "STIs",
    myth: "Only STIs from multiple partners are serious",
    fact: "This is false. STIs from any partner can affect health and need treatment.",
    source: "Planned Parenthood"
  },
  {
    id: "sti-cure-instant",
    category: "STIs",
    myth: "All STIs can be instantly cured with one pill",
    fact: "This is false. Some STIs require weeks of treatment and follow-up testing.",
    source: "CDC"
  },
  {
    id: "sti-toilet-seats",
    category: "STIs",
    myth: "You can easily catch HIV or STIs from toilet seats or door handles",
    fact: "This is false. Sexually transmitted infections cannot survive long on inanimate surfaces like toilet seats or door handles.",
    source: "Centers for Disease Control and Prevention"
  },
  {
    id: "sti-oral-sex-safe",
    category: "STIs",
    myth: "Oral sex cannot transmit STIs",
    fact: "This is false. Many STIs, including herpes, HPV, gonorrhea, and syphilis, can be transmitted through oral sex.",
    source: "World Health Organization"
  },

  // Puberty
  {
    id: "puberty-bad-sign",
    category: "Puberty",
    myth: "Body odor, acne, and voice changes mean something is wrong",
    fact: "This is false. These are common puberty changes and usually part of normal development.",
    source: "UNICEF"
  },
  {
    id: "puberty-wet-dreams-dangerous",
    category: "Puberty",
    myth: "Wet dreams are always a sign of illness",
    fact: "This is false. Wet dreams can be a normal puberty experience for many young people.",
    source: "NHS"
  },
  {
    id: "puberty-height-stop",
    category: "Puberty",
    myth: "Your height stops growing after puberty starts",
    fact: "This is false. Growth continues for years after puberty begins.",
    source: "American Academy of Pediatrics"
  },
  {
    id: "puberty-period-delay",
    category: "Puberty",
    myth: "You can delay your first period indefinitely",
    fact: "This is false. Periods will eventually begin when the body is developmentally ready.",
    source: "UNICEF"
  },
  {
    id: "puberty-sports-development",
    category: "Puberty",
    myth: "Certain sports prevent normal puberty development",
    fact: "This is false. Sports do not stop puberty; good nutrition supports healthy development.",
    source: "American Medical Association"
  },
  {
    id: "puberty-masturbation-blindness",
    category: "Puberty",
    myth: "Masturbation causes blindness or physical harm",
    fact: "This is false. Masturbation is a normal, harmless form of self-exploration and sexual expression.",
    source: "NHS"
  },

  // Menstrual Health
  {
    id: "menstruation-dirty",
    category: "Menstrual Health",
    myth: "Periods are dirty and people should avoid normal activities",
    fact: "This is false. Menstruation is a normal body process and should not prevent safe participation in daily life.",
    source: "UNFPA"
  },
  {
    id: "menstruation-bathing-harmful",
    category: "Menstrual Health",
    myth: "You should not bathe or wash your hair during your period",
    fact: "This is false. Good hygiene, including bathing, is safe and helpful during menstruation.",
    source: "NHS"
  },
  {
    id: "menstruation-pain-normal",
    category: "Menstrual Health",
    myth: "Severe period pain is always normal",
    fact: "This is false. Severe pain can signal an underlying condition and should be checked.",
    source: "NHS"
  },
  {
    id: "menstruation-cycle-always-regular",
    category: "Menstrual Health",
    myth: "Your period should be exactly the same every month",
    fact: "This is false. Cycle length and flow can vary month to month.",
    source: "American College of Obstetricians and Gynecologists"
  },
  {
    id: "menstruation-no-sports",
    category: "Menstrual Health",
    myth: "You cannot do sports during your period",
    fact: "This is false. Most people can exercise during menstruation with proper protection.",
    source: "World Health Organization"
  },
  {
    id: "menstruation-forever-cycles",
    category: "Menstrual Health",
    myth: "Periods continue indefinitely without change",
    fact: "This is false. Cycles change with age, stress, and hormonal shifts.",
    source: "Mayo Clinic"
  },
  {
    id: "menstruation-tampons-virginity",
    category: "Menstrual Health",
    myth: "Using a tampon breaks virginity or affects the hymen permanently",
    fact: "This is false. Virginity is a social concept, not a medical condition, and tampons do not alter your sexual status.",
    source: "UNICEF"
  },

  // Consent
  {
    id: "consent-silence",
    category: "Consent",
    myth: "If someone does not say no, it means yes",
    fact: "This is false. Consent must be clear, voluntary, and ongoing.",
    source: "RAINN"
  },
  {
    id: "consent-drunk-yes",
    category: "Consent",
    myth: "Someone who is drunk can clearly consent",
    fact: "This is false. Alcohol and drugs can affect judgment and the ability to give real consent.",
    source: "Planned Parenthood"
  },
  {
    id: "consent-regret-rape",
    category: "Consent",
    myth: "Regretting sex after means it was not consensual",
    fact: "This is false. Consent can be real at the time even if someone later regrets it.",
    source: "RAINN"
  },
  {
    id: "consent-nonverbal-okay",
    category: "Consent",
    myth: "Nonverbal cues are as clear as asking",
    fact: "This is false. Clear verbal consent is always safer than assuming.",
    source: "Planned Parenthood"
  },
  {
    id: "consent-past-agreement",
    category: "Consent",
    myth: "If you agreed before, you always will agree",
    fact: "This is false. Consent is needed each time, even in long-term relationships.",
    source: "RAINN"
  },
  {
    id: "consent-religious-exception",
    category: "Consent",
    myth: "Religion overrides the need for consent",
    fact: "This is false. Consent is a universal right regardless of belief.",
    source: "Amnesty International"
  },
  {
    id: "consent-marriage-automatic",
    category: "Consent",
    myth: "Marriage gives automatic consent for sexual activity at any time",
    fact: "This is false. Consent is required for every sexual encounter, even within marriage or long-term partnerships.",
    source: "United Nations Human Rights"
  },

  // Relationships
  {
    id: "relationships-jealousy-love",
    category: "Relationships",
    myth: "Jealousy and control are proof of love",
    fact: "This is false. Respect, trust, and freedom are stronger signs of a healthy relationship.",
    source: "Love Is Respect"
  },
  {
    id: "relationships-checking-phone",
    category: "Relationships",
    myth: "A partner has the right to check your phone any time",
    fact: "This is false. Privacy and boundaries still matter in healthy relationships.",
    source: "Love Is Respect"
  },
  {
    id: "relationships-love-excuse",
    category: "Relationships",
    myth: "Love excuses controlling behavior",
    fact: "This is false. Real love includes respect and healthy boundaries.",
    source: "Love Is Respect"
  },
  {
    id: "relationships-fighting-normal",
    category: "Relationships",
    myth: "Couples who fight do not really love each other",
    fact: "This is false. Some conflict is normal; how you resolve it matters.",
    source: "Psychology Today"
  },
  {
    id: "relationships-obsession-love",
    category: "Relationships",
    myth: "Obsession with your partner is a sign of love",
    fact: "This is false. Healthy love includes independence and trust.",
    source: "TherapyWorks"
  },
  {
    id: "relationships-give-up-friends",
    category: "Relationships",
    myth: "You should give up friendships for a relationship",
    fact: "This is false. Healthy relationships allow time for other important connections.",
    source: "Love Is Respect"
  },

  // Mental Health
  {
    id: "mental-health-strength",
    category: "Mental Health",
    myth: "Asking for emotional support means you are weak",
    fact: "This is false. Reaching out for help is a healthy and brave step.",
    source: "National Alliance on Mental Illness"
  },
  {
    id: "mental-health-mood-fix",
    category: "Mental Health",
    myth: "You can always just ignore anxiety and it will disappear",
    fact: "This is false. Ongoing anxiety often needs support, coping tools, and sometimes professional care.",
    source: "World Health Organization"
  },
  {
    id: "mental-health-meditation-cure",
    category: "Mental Health",
    myth: "Meditation can cure depression alone",
    fact: "This is false. Meditation can help but often works best alongside professional care.",
    source: "National Institute of Mental Health"
  },
  {
    id: "mental-health-positive-thinking",
    category: "Mental Health",
    myth: "Just thinking positive thoughts fixes anxiety",
    fact: "This is false. Anxiety often needs professional support and evidence-based treatment.",
    source: "American Psychological Association"
  },
  {
    id: "mental-health-breakup-recovers",
    category: "Mental Health",
    myth: "You should immediately feel better after a breakup",
    fact: "This is false. Grief from a breakup takes time and support.",
    source: "Psychology Today"
  },

  // Digital Safety
  {
    id: "digital-safety-private-photo",
    category: "Digital Safety",
    myth: "Sending private photos is safe if you trust the person",
    fact: "This is false. Once an image is shared, control over where it goes can be lost.",
    source: "Cyberwise"
  },
  {
    id: "digital-safety-delete-everywhere",
    category: "Digital Safety",
    myth: "Deleting a message always removes it from everywhere",
    fact: "This is false. Screenshots, forwards, and backups can keep content alive.",
    source: "Internet Safety Resources"
  },
  {
    id: "digital-safety-vpn-perfect",
    category: "Digital Safety",
    myth: "A VPN makes you completely anonymous online",
    fact: "This is false. VPNs provide privacy but not complete anonymity.",
    source: "Electronic Frontier Foundation"
  },
  {
    id: "digital-safety-no-track",
    category: "Digital Safety",
    myth: "Nobody can track you if you use private mode",
    fact: "This is false. Private mode only hides history on your device.",
    source: "Mozilla"
  },
  {
    id: "digital-safety-friend-edit",
    category: "Digital Safety",
    myth: "A trusted friend will never share your private messages",
    fact: "This is false. People can be hacked, leave accounts open, or change their mind.",
    source: "Common Sense Media"
  },
  {
    id: "digital-safety-fake-no-harm",
    category: "Digital Safety",
    myth: "Using a fake name online means nothing can harm you",
    fact: "This is false. Digital harm is real even when anonymous.",
    source: "Cyberwise"
  },

  // Health Care
  {
    id: "clinic-home-remedies",
    category: "Health Care",
    myth: "Home remedies can replace a clinic visit for STI or pregnancy concerns",
    fact: "This is false. Professional assessment is safer because it confirms what is happening and guides treatment.",
    source: "World Health Organization"
  },
  {
    id: "clinic-treatment-stop",
    category: "Health Care",
    myth: "You can stop treatment as soon as symptoms improve",
    fact: "This is false. Treatment plans should be completed exactly as instructed by a health professional.",
    source: "Centers for Disease Control and Prevention"
  },
  {
    id: "clinic-appointment-shame",
    category: "Health Care",
    myth: "Health workers will judge you for sexual health visits",
    fact: "This is false. Confidential, judgment-free care is a professional duty.",
    source: "World Health Organization"
  },
  {
    id: "clinic-online-prescription",
    category: "Health Care",
    myth: "Online prescription sellers are as safe as clinics",
    fact: "This is false. Clinic care includes proper assessment and follow-up.",
    source: "FDA"
  },
  {
    id: "clinic-self-diagnosis",
    category: "Health Care",
    myth: "Internet research can replace a clinic diagnosis",
    fact: "This is false. Online information can be inaccurate and dangerous.",
    source: "Mayo Clinic"
  },
  {
    id: "clinic-embarrassment-excuse",
    category: "Health Care",
    myth: "Embarrassment is a good reason to skip health care",
    fact: "This is false. Health is more important than temporary discomfort.",
    source: "World Health Organization"
  }
];

export function getMythBusters(language: string): MythBusterItem[] {
  void language;
  return englishMyths;
}