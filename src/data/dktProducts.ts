export interface DKTProduct {
  id: string;
  name: string;
  category: "emergencyPills" | "dailyPills" | "iud" | "injectables" | "implants" | "abortionKits" | "condoms" | "sexGels" | string;
  gender: "male" | "female" | "both";
  description: string;
  uses: string[];
  whereToGet: string[];
  priceRange: string;
  availability: string;
  image?: string;
}

export interface DKTSupportLine {
  region: string;
  location?: string;
  phone: string;
  email?: string;
}

export const dktSupportLines: DKTSupportLine[] = [
  {
    region: "Head Office",
    location: "Dzorwulu, Accra",
    phone: "0302772799",
    email: "info@dktghana.org"
  },
  {
    region: "Volta Region",
    phone: "0501516799"
  },
  {
    region: "Upper West Region",
    phone: "0501516867"
  },
  {
    region: "Western North Region",
    phone: "0501516913"
  },
  {
    region: "Bono Region",
    phone: "0501516883"
  },
  {
    region: "Northern Sector",
    phone: "0501336328"
  },
  {
    region: "Bono East Region",
    phone: "0505156874"
  },
  {
    region: "Eastern Region",
    phone: "0501336311"
  },
  {
    region: "Accra West / Central",
    phone: "0501336326"
  },
  {
    region: "Western Region",
    phone: "0501336327"
  },
  {
    region: "Ashanti Region",
    phone: "0501336329"
  },
  {
    region: "Northern / Upper West / Upper East",
    phone: "0501336308"
  },
  {
    region: "Accra West",
    phone: "0501336304"
  },
  {
    region: "Eastern / Volta",
    phone: "0501336306"
  },
  {
    region: "Accra East",
    phone: "0501336327"
  },
  {
    region: "Central / Western",
    phone: "0501336310"
  }
];

export const dktProducts: DKTProduct[] = [
  // --- EMERGENCY PILLS (Female) ---
  {
    id: "lydia-postpil-1",
    name: "Lydia Postpil (1 Pill)",
    category: "emergencyPills",
    gender: "female",
    description: "Single-dose emergency contraceptive pill for rapid post-unprotected sex protection.",
    uses: ["Emergency pregnancy prevention", "Unprotected intercourse protection", "Contraceptive failure backup"],
    whereToGet: ["Pharmacies nationwide", "DKT partner clinics", "Health centers"],
    priceRange: "GH₵ 10-20",
    availability: "Widely available"
  },
  {
    id: "lydia-postpil-2",
    name: "Lydia Postpil (2 Pills)",
    category: "emergencyPills",
    gender: "female",
    description: "Double-dose emergency contraceptive pill for post-unprotected intercourse prevention.",
    uses: ["Emergency pregnancy prevention", "Flexible dosing backup", "Contraceptive failure protection"],
    whereToGet: ["Pharmacies nationwide", "DKT partner clinics", "Health centers"],
    priceRange: "GH₵ 10-20",
    availability: "Widely available"
  },

  // --- DAILY CONTRACEPTIVE PILLS (Female) ---
  {
    id: "lydia-daily-pills",
    name: "Lydia Daily Contraceptive Pills",
    category: "dailyPills",
    gender: "female",
    description: "Regular daily oral contraceptive pills with added iron for menstrual health.",
    uses: ["Daily pregnancy prevention", "Cycle regulation", "Iron supplementation"],
    whereToGet: ["Pharmacies countrywide", "Family planning clinics", "DKT outlets"],
    priceRange: "GH₵ 8-18 per pack",
    availability: "Continuously available"
  },

  // --- INTRAUTERINE CONTRACEPTIVE DEVICES (IUCD/IUD) (Female) ---
  {
    id: "lydia-safeload-iud",
    name: "Lydia Safeload IUD",
    category: "iud",
    gender: "female",
    description: "A small, non-hormonal, flexible T-shape intrauterine contraceptive device.",
    uses: ["Long-term non-hormonal contraception", "Up to 10-year pregnancy prevention", "Reversible birth control"],
    whereToGet: ["Family planning clinics", "Hospitals", "DKT partner facilities"],
    priceRange: "GH₵ 30-60",
    availability: "Available at trained clinics"
  },
  {
    id: "lydia-sleek-iud",
    name: "Lydia Sleek IUD",
    category: "iud",
    gender: "female",
    description: "A small, non-hormonal, flexible U-shape intrauterine contraceptive device designed for enhanced placement comfort.",
    uses: ["Long-term non-hormonal contraception", "Comfort-focused design", "Reversible birth control"],
    whereToGet: ["Family planning clinics", "Hospitals", "DKT partner facilities"],
    priceRange: "GH₵ 30-60",
    availability: "Available at trained clinics"
  },

  // --- CONTRACEPTIVE INJECTABLES (Female) ---
  {
    id: "lydia-fem-3-injections",
    name: "Lydia FEM 3 Injections",
    category: "injectables",
    gender: "female",
    description: "3-month hormonal contraceptive injection providing long-acting protection.",
    uses: ["3-month pregnancy prevention", "Discreet birth control", "Minimal maintenance contraception"],
    whereToGet: ["Health centers", "Family planning clinics", "DKT service points"],
    priceRange: "GH₵ 15-30 per injection",
    availability: "Available at health facilities"
  },

  // --- IMPLANTS (Female) ---
  {
    id: "levoplant",
    name: "Levoplant",
    category: "implants",
    gender: "female",
    description: "Double-rod contraceptive implant providing up to 3 years of continuous reversible protection.",
    uses: ["Long-acting reversible contraception", "3-year pregnancy prevention", "Low maintenance birth control"],
    whereToGet: ["Implant-trained clinics", "Hospitals", "DKT partner facilities"],
    priceRange: "GH₵ 120-250",
    availability: "Available at trained service points"
  },

  // --- MEDICAL ABORTION PILLS & KITS (Female) ---
  {
    id: "mafem",
    name: "MaFem",
    category: "abortionKits",
    gender: "female",
    description: "Misoprostol-only medication for safe uterine care and medical reproductive management.",
    uses: ["Medical abortion care", "Obstetric and gynecological care"],
    whereToGet: ["Licensed health facilities", "DKT partner clinics", "Pharmacies with prescription"],
    priceRange: "GH₵ 25-50",
    availability: "Available via licensed health providers"
  },
  {
    id: "mm-combi-kit",
    name: "MM Combi Kit",
    category: "abortionKits",
    gender: "female",
    description: "Combined Misoprostol and Mifepristone medication kit for medical pregnancy termination.",
    uses: ["Combined medical abortion", "Clinical reproductive care"],
    whereToGet: ["Licensed health facilities", "Clinical procurement channels", "DKT partner providers"],
    priceRange: "GH₵ 40-80",
    availability: "Available through trained healthcare providers"
  },
  {
    id: "miso-fem",
    name: "Miso-Fem",
    category: "abortionKits",
    gender: "female",
    description: "Misoprostol-only medication formulated for reproductive health procedures.",
    uses: ["Medical abortion care", "Gynecological management"],
    whereToGet: ["Licensed health facilities", "Pharmacies with prescription", "DKT clinics"],
    priceRange: "GH₵ 25-50",
    availability: "Available via licensed health providers"
  },
  {
    id: "ipas-mva-kit",
    name: "Ipas MVA Kit",
    category: "abortionKits",
    gender: "female",
    description: "Manual Vacuum Aspiration (MVA) clinical kit for safe uterine evacuation procedures.",
    uses: ["Clinical uterine evacuation", "Facility-based post-abortion care", "Reproductive healthcare"],
    whereToGet: ["Hospitals", "Licensed clinics", "Clinical procurement channels"],
    priceRange: "Facility procurement pricing",
    availability: "For trained healthcare providers and facilities"
  },

  // --- CONDOMS (Male) ---
  {
    id: "fiesta-extra-thin",
    name: "Fiesta Extra Thin Condom",
    category: "condoms",
    gender: "male",
    description: "Ultra-thin latex condoms engineered for maximum sensitivity and natural feeling.",
    uses: ["Pregnancy prevention", "STI protection", "Enhanced sensitivity"],
    whereToGet: ["Pharmacies nationwide", "Supermarkets", "DKT partner outlets", "Retail shops"],
    priceRange: "GH₵ 3-7 per pack",
    availability: "Widely available"
  },
  {
    id: "fiesta-all-night",
    name: "Fiesta All Night Condom",
    category: "condoms",
    gender: "male",
    description: "Condoms pre-treated with delay lubricant to help prolong intimacy.",
    uses: ["Pregnancy prevention", "STI protection", "Extended endurance"],
    whereToGet: ["Pharmacies", "Supermarkets", "Retail outlets", "DKT partner outlets"],
    priceRange: "GH₵ 4-8 per pack",
    availability: "Widely available"
  },
  {
    id: "fiesta-dotted",
    name: "Fiesta Dotted Condom",
    category: "condoms",
    gender: "male",
    description: "Textured condoms featuring raised dots for heightened stimulation.",
    uses: ["Pregnancy prevention", "STI protection", "Textured stimulation"],
    whereToGet: ["Pharmacies", "Supermarkets", "Retail outlets", "DKT partner outlets"],
    priceRange: "GH₵ 3-7 per pack",
    availability: "Widely available"
  },
  {
    id: "fiesta-classic",
    name: "Fiesta Classic Condom",
    category: "condoms",
    gender: "male",
    description: "Reliable smooth latex condoms for everyday safe sex protection.",
    uses: ["Pregnancy prevention", "STI protection", "Everyday safe sex"],
    whereToGet: ["Pharmacies nationwide", "Supermarkets", "Retail shops", "DKT outlets"],
    priceRange: "GH₵ 2-6 per pack",
    availability: "Widely available"
  },
  {
    id: "fiesta-dumsor",
    name: "Fiesta Dumsor Condom",
    category: "condoms",
    gender: "male",
    description: "Fun glow-in-the-dark condoms designed to light up intimate moments.",
    uses: ["Pregnancy prevention", "STI protection", "Novelty and fun intimacy"],
    whereToGet: ["Pharmacies", "Supermarkets", "DKT partner outlets", "Online platforms"],
    priceRange: "GH₵ 4-8 per pack",
    availability: "Available in major towns"
  },
  {
    id: "fiesta-strawberry",
    name: "Fiesta Strawberry Condom",
    category: "condoms",
    gender: "male",
    description: "Strawberry-flavored and scented lubricated condoms for oral and genital pleasure.",
    uses: ["Pregnancy prevention", "STI protection", "Flavored intimacy"],
    whereToGet: ["Pharmacies nationwide", "Supermarkets", "Retail shops"],
    priceRange: "GH₵ 3-7 per pack",
    availability: "Widely available"
  },
  {
    id: "fiesta-fruity",
    name: "Fiesta Fruity Condom",
    category: "condoms",
    gender: "male",
    description: "Tutti-Frutti multi-flavor condoms adding variety and scent to protection.",
    uses: ["Pregnancy prevention", "STI protection", "Multi-flavor experience"],
    whereToGet: ["Pharmacies", "Supermarkets", "DKT partner outlets"],
    priceRange: "GH₵ 3-7 per pack",
    availability: "Widely available"
  },
  {
    id: "fiesta-party-pack",
    name: "Fiesta Party Pack Condom",
    category: "condoms",
    gender: "male",
    description: "Assorted pack of various Fiesta condom styles for variety and convenience.",
    uses: ["Pregnancy prevention", "STI protection", "Variety pack"],
    whereToGet: ["Major pharmacies", "Supermarkets", "DKT distribution points"],
    priceRange: "GH₵ 10-20 per pack",
    availability: "Available in urban centers"
  },
  {
    id: "fiesta-vibe",
    name: "Fiesta Vibe Condom",
    category: "condoms",
    gender: "male",
    description: "Condom pack bundled with a vibrating ring for enhanced mutual pleasure.",
    uses: ["Pregnancy prevention", "STI protection", "Mutual stimulation"],
    whereToGet: ["Select pharmacies", "DKT partner facilities", "Online stores"],
    priceRange: "GH₵ 15-25 per pack",
    availability: "Available in select locations"
  },
  {
    id: "kiss-classic",
    name: "Kiss Classic Condom",
    category: "condoms",
    gender: "male",
    description: "Affordable and reliable classic lubricated latex condoms.",
    uses: ["Pregnancy prevention", "STI protection", "Accessible safe sex"],
    whereToGet: ["Pharmacies countrywide", "Community shops", "DKT outlets"],
    priceRange: "GH₵ 2-5 per pack",
    availability: "Widely available nationwide"
  },
  {
    id: "kiss-strawberry",
    name: "Kiss Strawberry Condom",
    category: "condoms",
    gender: "male",
    description: "Strawberry-scented lubricated latex condoms for comfortable protection.",
    uses: ["Pregnancy prevention", "STI protection", "Fragrant pleasure"],
    whereToGet: ["Pharmacies countrywide", "Community shops", "Supermarkets"],
    priceRange: "GH₵ 2-5 per pack",
    availability: "Widely available"
  },

  // --- SEX GELS (Both/Couples) ---
  {
    id: "fiesta-strawberry-gel",
    name: "Fiesta Strawberry Gel",
    category: "sexGels",
    gender: "both",
    description: "Strawberry-scented, water-based intimacy lubricant for reduced friction and comfort.",
    uses: ["Enhanced intimacy comfort", "Condom compatibility", "Reduced friction and dryness"],
    whereToGet: ["Pharmacies nationwide", "Supermarkets", "DKT partner outlets"],
    priceRange: "GH₵ 15-30",
    availability: "Widely available"
  },
  {
    id: "kiss-strawberry-gel",
    name: "Kiss Strawberry Gel",
    category: "sexGels",
    gender: "both",
    description: "Strawberry-scented intimate sexual gel lubricant designed for smooth pleasure.",
    uses: ["Enhanced intimacy comfort", "Lubrication", "Condom compatibility"],
    whereToGet: ["Pharmacies nationwide", "Supermarkets", "Community health outlets"],
    priceRange: "GH₵ 10-25",
    availability: "Widely available"
  }
];

export function getDKTProducts(category?: string, gender?: string): DKTProduct[] {
  return dktProducts.filter(product => {
    const matchesCategory = !category || category === "all" || product.category === category;
    const matchesGender = !gender || gender === "all" || product.gender === gender || product.gender === "both";
    return matchesCategory && matchesGender;
  });
}

export function getDKTCategories(): string[] {
  return Array.from(new Set(dktProducts.map(p => p.category)));
}
