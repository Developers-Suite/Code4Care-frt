export interface ClinicContact {
  no?: string;
  name: string;
  location: string;  tel: string;}

export interface RegionClinics {
  region: string;
  clinics: ClinicContact[];
}

export const REGIONAL_CLINICS: RegionClinics[] = [
  {
    region: "Greater Accra",
    clinics: [
      { no: "1", name: "Faith Maternity Home", location: "Dome", tel: "249434595" },
      { no: "2", name: "Mighty Clinic", location: "Madina", tel: "503136808" },
      { no: "3", name: "Martin Memorial Hospital", location: "Dzorwulu", tel: "265405710" },
      { no: "4", name: "Selifem Women center", location: "Asofan", tel: "540120401" },
      { no: "5", name: "Foundation Nyame Maternity Home", location: "Olebu Bayere/hospital Junction", tel: "200264463" },
      { no: "6", name: "Amoah Memorial Hospital", location: "Ablekuma", tel: "244636749" },
      { no: "7", name: "Resurrection Maternity Home", location: "Olebu close to Vilcois sch.", tel: "242158332" },
      { no: "10", name: "Giesabi maternity home or clinic", location: "Teshie Manhean", tel: "244766341" },
      { no: "11", name: "Rejyfrans Maternity home and clinic", location: "TEMA", tel: "549710159" },
      { no: "12", name: "Speed medical centre", location: "Gbetsile", tel: "0277438788/0248492527" },
      { no: "13", name: "Darbem Medical Center", location: "Ashaiman", tel: "246058120" },
      { no: "14", name: "Good shepherd hospital.", location: "SCC", tel: "559442788" },
      { no: "15", name: "New weija community clinic.", location: "SCC NEAR DVLA", tel: "0247576321/0592409086" },
      { no: "16", name: "Vine medical centre.", location: "SCC", tel: "540234050" },
      { no: "17", name: "Bortianor community maternity home.", location: "OLD BORTIANOR", tel: "242365598" },
      { no: "18", name: "Tetegu community clinic.", location: "TEGEGU", tel: "545759299" },
      { no: "19", name: "St. Anns maternity home", location: "OLD BORTIANOR", tel: "268418026" },
      { no: "20", name: "Adams family clinic", location: "ODOKOR", tel: "246602875" },
      { no: "21", name: "Sussie’s Maternity", location: "DANSOMAN", tel: "243518442" },
      { no: "22", name: "Madam Catherine Clinic and Maternity", location: "ODOKOR OFFICIAL TOWN", tel: "554139554" },
      { no: "23", name: "Gbegbe Royal Clinic", location: "DANSOMAN", tel: "0554139554/0541605879" },
      { no: "24", name: "Maon medical center", location: "Ablekuma fanmilk", tel: "542920704" },
      { no: "25", name: "SDA hospital", location: "Gbawe CP", tel: "249900997" },
      { no: "26", name: "Medstar clinic", location: "DANSOMAN", tel: "202017710" },
      { no: "26", name: "Zion Clinic", location: "Gbawe", tel: "245947440" },
      { no: "27", name: "St John’s Hospital and Fertility Center", location: "ST. JOHN", tel: "244846335" },
      { no: "28", name: "Dome Community Clinic", location: "DOME", tel: "243584105" },
      { no: "29", name: "Anthon Memorial Hospital", location: "Kotobabi", tel: "249998332" },
      { no: "30", name: "Mercy An’s Maternity Home", location: "NEW TOWN", tel: "540325340" },
      { no: "31", name: "Seaview healthcare centre Ltd", location: "JAMES TOWN", tel: "244271649" },
      { no: "32", name: "Irene Jones Nelson Memorial Clinic", location: "CHORKOR", tel: "245904390" },
      { no: "33", name: "Rahma Maternity Home", location: "TANTRA HILL", tel: "244858857" }
    ]
  },
  {
    region: "Central",
    clinics: [
      { no: "34", name: "N'Adom maternity home", location: "Nyanyano", tel: "244670146" },
      { no: "35", name: "BS TRUST CARE", location: "Buduburam Golden gate hotel", tel: "0243640145" },
      { no: "36", name: "Margo clinic", location: "Krodua", tel: "558045626" },
      { no: "37", name: "Fausty's maternity home", location: "Bawjiase", tel: "242004539" },
      { no: "38", name: "Jikwell Health Centre(Buduburam)", location: "Buduburam", tel: "265045034" },
      { no: "39", name: "Dergewa Maternity home", location: "Swedru SSNIT", tel: "243465983" },
      { no: "40", name: "Ghartey Hospital", location: "Cape Coast", tel: "202650506" },
      { no: "41", name: "Dis Clinic", location: "Cape Coast", tel: "542482338" }
    ]
  },
  {
    region: "Eastern",
    clinics: [
      { no: "42", name: "Lydia Memorial Maternity Home", location: "Somanya", tel: "545172505" },
      { no: "43", name: "Augustina Maternity home", location: "Koforidua-Nkurakan", tel: "240275962" },
      { no: "44", name: "Jubilee Hospital", location: "Akim Oda", tel: "208128103" },
      { no: "45", name: "Devine Victory Hospital", location: "Akim Oda", tel: "243276271" },
      { no: "46", name: "Gomel Clinic", location: "Akyem Sekyere", tel: "204094718" },
      { no: "47", name: "Agnes Maternity Home", location: "Anyinam", tel: "242177900" },
      { no: "48", name: "Yesukurom Medical Center", location: "Anyinam", tel: "240887550" },
      { no: "49", name: "STARROT MEDICAL CENTER", location: "NSUMIA", tel: "546792522" },
      { no: "50", name: "MBA SLY MEDICAL CENTER", location: "CHINTO", tel: "240140812" },
      { no: "51", name: "A&J Clinic", location: "Samsam Junction", tel: "240167394" }
    ]
  },
  {
    region: "Bono / Ahafo",
    clinics: [
      { no: "52", name: "Hannah's maternity home", location: "Odumase", tel: "242215449" },
      { no: "53", name: "Amposah Memorial maternity and health centre", location: "Nsuatre", tel: "203688116" },
      { no: "54", name: "Emis maternity home", location: "Brekum", tel: "545263641" },
      { no: "55", name: "Sunyani Technical university hospital", location: "Sunyani", tel: "548801562" },
      { no: "56", name: "Constance maternity home and clinic", location: "Sunyani", tel: "244739479" },
      { no: "57", name: "Monica's maternity home and clinic", location: "Sunyani", tel: "547238746" },
      { no: "61", name: "Alice Maternity home", location: "Techiman", tel: "243681094" },
      { no: "62", name: "Koranteng memorial home", location: "Techiman Abourso", tel: "244873306" },
      { no: "63", name: "Arms Hospital", location: "Techiman", tel: "244774642" },
      { no: "64", name: "Glory Prince of Peace Maternity Home and clinic", location: "Kintampo", tel: "243189354" },
      { no: "65", name: "Tek Medical clinic", location: "Kintampo", tel: "546825098" },
      { no: "67", name: "Agyenkwa clinic", location: "Jema", tel: "541254871" },
      { no: "68", name: "Agyei Mensah Martenity clinic", location: "Goaso", tel: "024 447 4472" },
      { no: "69", name: "Victoria Anane Maternity Home", location: "Noberkow", tel: "556318933" },
      { no: "70", name: "Marie-Love Clinic", location: "Goaso", tel: "207295707" }
    ]
  },
  {
    region: "Ashanti",
    clinics: [
      { no: "71", name: "New Life Maternity", location: "Oforikrom", tel: "246602892" },
      { no: "72", name: "Unique Care maternity home", location: "Asokwa-Sobolo", tel: "208181427" },
      { no: "73", name: "Awurade Tumi clinic", location: "Kotwi", tel: "548701778" },
      { no: "74", name: "Anyimens clinic", location: "Suame maakro", tel: "242287399" },
      { no: "75", name: "Wesley Methodist clinic", location: "Old Tafo", tel: "24831989" },
      { no: "76", name: "St John's Clinic", location: "Old Tafo", tel: "243281527" },
      { no: "77", name: "Maame Rose Maternity Home", location: "Ahwiah", tel: "242020255" },
      { no: "78", name: "Top care clinic", location: "Pankrono near Tafo municipal", tel: "541990295" },
      { no: "79", name: "Laspa medical clinic", location: "Near Kejetia market", tel: "553980830" },
      { no: "80", name: "Global Evangelical Mission hospital", location: "Apromase", tel: "243337639" },
      { no: "81", name: "Dakopong hospital", location: "Adako Jackie", tel: "244795413" },
      { no: "82", name: "Victory maternity home", location: "Tech-Ayigya", tel: "244567802" },
      { no: "83", name: "Awurade Tumi clinic", location: "Kotwi", tel: "548701778" },
      { no: "84", name: "Gary Marvin hospital", location: "Kotwi", tel: "244386978" },
      { no: "85", name: "Ama Nyame medical centre", location: "Boankra", tel: "241635422" },
      { no: "86", name: "Rev. Walker hospital", location: "Fumesua", tel: "546223613" },
      { no: "87", name: "Boakye Dankwa memorial hospital", location: "Kumasi", tel: "266794362" },
      { no: "88", name: "Antwi's Maternity Home", location: "Abuakwa- Atiwma Koforidua", tel: "0246262435" },
      { no: "91", name: "Kumanining medical hospital", location: "Abrepo payin kumasi adj. Kumasi girls Sch", tel: "244618885" },
      { no: "92", name: "Queen Victoria Home and Maternity", location: "Anloga", tel: "243326651" },
      { no: "93", name: "First care hospital", location: "Odeneho Kwadaso", tel: "244807070" },
      { no: "94", name: "A1 Hospital", location: "Kumasi", tel: "244941591" },
      { no: "95", name: "Stewards Hospital", location: "Konongo", tel: "248237360" },
      { no: "96", name: "HopeCare Specialist Hospital", location: "Konongo", tel: "020967427" }
    ]
  },
  {
    region: "Savannah",
    clinics: [
      { no: "98", name: "Evergreen maternity home", location: "Sawla", tel: "024 405 1747" },
      { no: "99", name: "Holistic Medicare", location: "Buipe", tel: "244786290" }
    ]
  },
  {
    region: "Northern",
    clinics: [
      { no: "100", name: "Ummah Medical Center", location: "Jisonayili Tamale", tel: "547311207" },
      { no: "104", name: "One Heart medical centre", location: "Lamashegu", tel: "240560092" },
      { no: "105", name: "Adas clinic", location: "Aboabo old market", tel: "24602808" },
      { no: "106", name: "Marshal health centre", location: "Katariga", tel: "547656868" },
      { no: "107", name: "Church of Christ health centre", location: "Yendi", tel: "241943779" },
      { no: "108", name: "Amat_zak memorial maternity Home", location: "Kakpagyili", tel: "244948740" }
    ]
  },
  {
    region: "North East Region",
    clinics: [
      { no: "109", name: "TAMAH SPECIALIST HOSP.", location: "WALEWALE", tel: "0550561684" },
      { no: "110", name: "NAMA HEALTH SERVICES", location: "Nalerigu", tel: "0544622351" }
    ]
  },
  {
    region: "Upper West Region",
    clinics: [
      { no: "111", name: "Mama Mary maternity home", location: "Tumu", tel: "0249033468" },
      { no: "112", name: "Virtue hospital", location: "Tumu", tel: "0242758004" },
      { no: "113", name: "Wianipomi Mat. Home", location: "Gwollu", tel: "0540303007" },
      { name: "Progress Maternity Home Nyoli", location: "Nyoli", tel: "0542570258" }
    ]
  },
  {
    region: "Upper East",
    clinics: [
      { no: "114", name: "Wedam clinic", location: "Paga", tel: "208072154" },
      { no: "115", name: "Gossip's Clinic", location: "Zebilla", tel: "0551166103" },
      { no: "116", name: "Faith Clinic", location: "Zebilla", tel: "0248577210" }
    ]
  },
  {
    region: "Western",
    clinics: [
      { no: "117", name: "Pentecost hospital", location: "Tarkwa Main station", tel: "242574729" },
      { no: "118", name: "Ami memorial Hospital", location: "Tarkwa Na about Road", tel: "244377076" },
      { no: "119", name: "Henbaab Clinic", location: "Takoradi", tel: "0203001834" },
      { no: "120", name: "New Crystal Hosptial", location: "Takoradi", tel: "0245213904" }
    ]
  },
  {
    region: "Volta",
    clinics: [
      { no: "121", name: "Supercare Specialist Medical centre", location: "Ho", tel: "0245129431" },
      { no: "122", name: "Emmanuel hospital", location: "Ho", tel: "0592664354" },
      { no: "123", name: "St Patrick's hospital", location: "Kpando", tel: "0206781452" },
      { no: "124", name: "St Paul hospital", location: "Akatsi", tel: "0500197458" },
      { no: "125", name: "Miracle Life Clinic", location: "Ho", tel: "0544715365/0551795938" }
    ]
  },
  {
    region: "Oti",
    clinics: [
      { no: "126", name: "New Life Clinic", location: "Hohoe", tel: "0247089537" },
      { name: "One First Choice Clinic", location: "Kledzo", tel: "0240154737" }
    ]
  }
];
