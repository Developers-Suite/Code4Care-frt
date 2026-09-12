export interface ClinicContact {
  no?: string;
  name: string;
  location: string;
  owner?: string;
  tel: string;
  rcr?: string;
}

export interface RegionClinics {
  region: string;
  clinics: ClinicContact[];
}

export const REGIONAL_CLINICS: RegionClinics[] = [
  {
    region: "Greater Accra",
    clinics: [
      { no: "1", name: "Faith Maternity Home", location: "Dome", owner: "Christopher Odor", tel: "249434595", rcr: "REJOICE" },
      { no: "2", name: "Mighty Clinic", location: "Madina", owner: "Tagbovi lnnocent", tel: "503136808" },
      { no: "3", name: "Martin Memorial Hospital", location: "Dzorwulu", owner: "Dr. Sowah", tel: "265405710" },
      { no: "4", name: "Selifem Women center", location: "Asofan", owner: "Madam Selina", tel: "540120401", rcr: "PRISCILA" },
      { no: "5", name: "Foundation Nyame Maternity Home", location: "Olebu Bayere/hospital Junction", owner: "Mrs. Vida Akanchey", tel: "200264463" },
      { no: "6", name: "Amoah Memorial Hospital", location: "Ablekuma", owner: "KOFI NYINA AMOAH", tel: "244636749" },
      { no: "7", name: "Resurrection Maternity Home", location: "Olebu close to Vilcois sch.", owner: "Mrs. Anim Charlotte", tel: "242158332" },
      { no: "10", name: "Giesabi maternity home or clinic", location: "Teshie Manhean", owner: "Mrs Dorothy Afriyie Owusu", tel: "244766341", rcr: "Ernestina" },
      { no: "11", name: "Rejyfrans Maternity home and clinic", location: "TEMA", tel: "549710159" },
      { no: "12", name: "Speed medical centre", location: "Gbetsile", owner: "Mad. Doreen/Charity", tel: "0277438788/0248492527" },
      { no: "13", name: "Darbem Medical Center", location: "Ashaiman", owner: "Dr.K P Bempong", tel: "246058120" },
      { no: "14", name: "Good shepherd hospital.", location: "SCC", owner: "ERNESTINA", tel: "559442788", rcr: "LETICIA" },
      { no: "15", name: "New weija community clinic.", location: "SCC NEAR DVLA", owner: "MERCY /DR. FRANCIS IMAH", tel: "0247576321/0592409086" },
      { no: "16", name: "Vine medical centre.", location: "SCC", owner: "MICHAELINA", tel: "540234050" },
      { no: "17", name: "Bortianor community maternity home.", location: "OLD BORTIANOR", owner: "AUNTY ROSE", tel: "242365598" },
      { no: "18", name: "Tetegu community clinic.", location: "TEGEGU", owner: "GODWIN", tel: "545759299" },
      { no: "19", name: "St. Anns maternity home", location: "OLD BORTIANOR", owner: "MADAM ANNA", tel: "268418026" },
      { no: "20", name: "Adams family clinic", location: "ODOKOR", owner: "MR FRED", tel: "246602875", rcr: "YVONNE" },
      { no: "21", name: "Sussie’s Maternity", location: "DANSOMAN", owner: "MADAM SUSSIE", tel: "243518442" },
      { no: "22", name: "Madam Catherine Clinic and Maternity", location: "ODOKOR OFFICIAL TOWN", owner: "MR FREDRICK", tel: "554139554" },
      { no: "23", name: "Gbegbe Royal Clinic", location: "DANSOMAN", owner: "MR WILSON/ENOCH", tel: "0554139554/0541605879" },
      { no: "24", name: "Maon medical center", location: "Ablekuma fanmilk", owner: "Janet Sagoe", tel: "542920704" },
      { no: "25", name: "SDA hospital", location: "Gbawe CP", owner: "Francis Sey", tel: "249900997" },
      { no: "26", name: "Medstar clinic", location: "DANSOMAN", owner: "DR RUTH", tel: "202017710" },
      { no: "26", name: "Zion Clinic", location: "Gbawe", owner: "Rev Edward", tel: "245947440" },
      { no: "27", name: "St John’s Hospital and Fertility Center", location: "ST. JOHN", owner: "LEONORA BOTWE", tel: "244846335", rcr: "Rejoice" },
      { no: "28", name: "Dome Community Clinic", location: "DOME", owner: "CATHERINE", tel: "243584105" },
      { no: "29", name: "Anthon Memorial Hospital", location: "Kotobabi", owner: "GIFTY", tel: "249998332" },
      { no: "30", name: "Mercy An’s Maternity Home", location: "NEW TOWN", owner: "HANNAH", tel: "540325340" },
      { no: "31", name: "Seaview healthcare centre Ltd", location: "JAMES TOWN", owner: "KANOR", tel: "244271649" },
      { no: "32", name: "Irene Jones Nelson Memorial Clinic", location: "CHORKOR", owner: "MERCY", tel: "245904390" },
      { no: "33", name: "Rahma Maternity Home", location: "TANTRA HILL", owner: "SHEILA", tel: "244858857" }
    ]
  },
  {
    region: "Central",
    clinics: [
      { no: "34", name: "N'Adom maternity home", location: "Nyanyano", owner: "Bertha Esi Amoah", tel: "244670146", rcr: "Cris" },
      { no: "35", name: "BS TRUST CARE", location: "Buduburam Golden gate hotel", owner: "Beatrice Odoom", tel: "0243640145" },
      { no: "36", name: "Margo clinic", location: "Krodua", owner: "Beryl", tel: "558045626" },
      { no: "37", name: "Fausty's maternity home", location: "Bawjiase", owner: "Comfort", tel: "242004539" },
      { no: "38", name: "Jikwell Health Centre(Buduburam)", location: "Buduburam", owner: "Fafa Phyllis", tel: "265045034" },
      { no: "39", name: "Dergewa Maternity home", location: "Swedru SSNIT", owner: "Alberta Derge", tel: "243465983", rcr: "Grace Nyame" },
      { no: "40", name: "Ghartey Hospital", location: "Cape Coast", owner: "Dr Ghartey", tel: "202650506" },
      { no: "41", name: "Dis Clinic", location: "Cape Coast", owner: "Otoo Dora", tel: "542482338" }
    ]
  },
  {
    region: "Eastern",
    clinics: [
      { no: "42", name: "Lydia Memorial Maternity Home", location: "Somanya", owner: "Madam Gladys Nyarko", tel: "545172505", rcr: "Farouk" },
      { no: "43", name: "Augustina Maternity home", location: "Koforidua-Nkurakan", owner: "Mad. Augustina", tel: "240275962" },
      { no: "44", name: "Jubilee Hospital", location: "Akim Oda", owner: "Kennedy", tel: "208128103", rcr: "REGINA" },
      { no: "45", name: "Devine Victory Hospital", location: "Akim Oda", owner: "Veronica Okore", tel: "243276271" },
      { no: "46", name: "Gomel Clinic", location: "Akyem Sekyere", owner: "Mr Mensah", tel: "204094718", rcr: "Gifty" },
      { no: "47", name: "Agnes Maternity Home", location: "Anyinam", owner: "Madam Irene", tel: "242177900" },
      { no: "48", name: "Yesukurom Medical Center", location: "Anyinam", owner: "Madam Charity", tel: "240887550" },
      { no: "49", name: "STARROT MEDICAL CENTER", location: "NSUMIA", owner: "DR, WILLIAMS", tel: "546792522", rcr: "CHARITY" },
      { no: "50", name: "MBA SLY MEDICAL CENTER", location: "CHINTO", owner: "DR. SLYVESTER", tel: "240140812" },
      { no: "51", name: "A&J Clinic", location: "Samsam Junction", owner: "Freda", tel: "240167394" }
    ]
  },
  {
    region: "Bono / Ahafo",
    clinics: [
      { no: "52", name: "Hannah's maternity home", location: "Odumase", owner: "HANNAH APPREY", tel: "242215449", rcr: "Duah Jackline" },
      { no: "53", name: "Amposah Memorial maternity and health centre", location: "Nsuatre", owner: "VERONICA GYAN", tel: "203688116" },
      { no: "54", name: "Emis maternity home", location: "Brekum", owner: "EMI REYNOLDS", tel: "545263641" },
      { no: "55", name: "Sunyani Technical university hospital", location: "Sunyani", owner: "Sandra", tel: "548801562" },
      { no: "56", name: "Constance maternity home and clinic", location: "Sunyani", owner: "Constance serwaah- peprah", tel: "244739479", rcr: "Collins" },
      { no: "57", name: "Monica's maternity home and clinic", location: "Sunyani", owner: "Monica kontor mensah", tel: "547238746" },
      { no: "61", name: "Alice Maternity home", location: "Techiman", owner: "Alice Gyamea", tel: "243681094" },
      { no: "62", name: "Koranteng memorial home", location: "Techiman Abourso", owner: "Elizabeth Korsah", tel: "244873306" },
      { no: "63", name: "Arms Hospital", location: "Techiman", owner: "Armstrong Fordjour", tel: "244774642" },
      { no: "64", name: "Glory Prince of Peace Maternity Home and clinic", location: "Kintampo", owner: "Kate Adu", tel: "243189354" },
      { no: "65", name: "Tek Medical clinic", location: "Kintampo", owner: "Dr. Kofi Evans", tel: "546825098" },
      { no: "67", name: "Agyenkwa clinic", location: "Jema", owner: "Dr Emmanuelle", tel: "541254871" },
      { no: "68", name: "Agyei Mensah Martenity clinic", location: "Goaso", owner: "Mrs Owusu Elizabeth", tel: "024 447 4472", rcr: "Richlord Marfo" },
      { no: "69", name: "Victoria Anane Maternity Home", location: "Noberkow", owner: "Victoria Anane Adjei", tel: "556318933" },
      { no: "70", name: "Marie-Love Clinic", location: "Goaso", owner: "Nana Bonsu", tel: "207295707" }
    ]
  },
  {
    region: "Ashanti",
    clinics: [
      { no: "71", name: "New Life Maternity", location: "Oforikrom", owner: "Hajia Razakatu", tel: "246602892", rcr: "Sheilament Adarkwah" },
      { no: "72", name: "Unique Care maternity home", location: "Asokwa-Sobolo", owner: "Peace Fianko", tel: "208181427" },
      { no: "73", name: "Awurade Tumi clinic", location: "Kotwi", owner: "FAUSTINA YAER0", tel: "548701778" },
      { no: "74", name: "Anyimens clinic", location: "Suame maakro", owner: "Anita kwenin", tel: "242287399", rcr: "Ishak" },
      { no: "75", name: "Wesley Methodist clinic", location: "Old Tafo", owner: "Methodist Church", tel: "24831989" },
      { no: "76", name: "St John's Clinic", location: "Old Tafo", owner: "Dr. Sulemana Abdul Latif", tel: "243281527" },
      { no: "77", name: "Maame Rose Maternity Home", location: "Ahwiah", owner: "Comfort Osei", tel: "242020255" },
      { no: "78", name: "Top care clinic", location: "Pankrono near Tafo municipal", owner: "Dr. Bismarck Arhin", tel: "541990295" },
      { no: "79", name: "Laspa medical clinic", location: "Near Kejetia market", owner: "Esther Frimpomaah", tel: "553980830" },
      { no: "80", name: "Global Evangelical Mission hospital", location: "Apromase", owner: "The Global Church", tel: "243337639", rcr: "Jonathan Tornam" },
      { no: "81", name: "Dakopong hospital", location: "Adako Jackie", owner: "Mad. Kate", tel: "244795413" },
      { no: "82", name: "Victory maternity home", location: "Tech-Ayigya", owner: "MRS VICTORIA Agyapong", tel: "244567802" },
      { no: "83", name: "Awurade Tumi clinic", location: "Kotwi", owner: "FAUSTINA YAER0", tel: "548701778", rcr: "Aisha" },
      { no: "84", name: "Gary Marvin hospital", location: "Kotwi", owner: "Dr Frimpong", tel: "244386978" },
      { no: "85", name: "Ama Nyame medical centre", location: "Boankra", owner: "Mavis", tel: "241635422" },
      { no: "86", name: "Rev. Walker hospital", location: "Fumesua", owner: "Musha", tel: "546223613" },
      { no: "87", name: "Boakye Dankwa memorial hospital", location: "Kumasi", owner: "Dr Albert Prempeh", tel: "266794362", rcr: "Mensah DieuDonnie" },
      { no: "88", name: "Antwi's Maternity Home", location: "Abuakwa- Atiwma Koforidua", owner: "Mrs Mary Antwi", tel: "0246262435" },
      { no: "91", name: "Kumanining medical hospital", location: "Abrepo payin kumasi adj. Kumasi girls Sch", owner: "Millie Appiah", tel: "244618885" },
      { no: "92", name: "Queen Victoria Home and Maternity", location: "Anloga", owner: "Victoria Mensah", tel: "243326651", rcr: "Michael Kwame Essel" },
      { no: "93", name: "First care hospital", location: "Odeneho Kwadaso", owner: "Dr Asante Mantey", tel: "244807070" },
      { no: "94", name: "A1 Hospital", location: "Kumasi", owner: "Mad. Esther", tel: "244941591" },
      { no: "95", name: "Stewards Hospital", location: "Konongo", owner: "Esther", tel: "248237360", rcr: "Doris" },
      { no: "96", name: "HopeCare Specialist Hospital", location: "Konongo", owner: "Dr Agyapong", tel: "020967427" }
    ]
  },
  {
    region: "Savannah",
    clinics: [
      { no: "98", name: "Evergreen maternity home", location: "Sawla", owner: "Mr. George Tambro", tel: "024 405 1747", rcr: "John Paul T. Gayire" },
      { no: "99", name: "Holistic Medicare", location: "Buipe", owner: "Julian", tel: "244786290" }
    ]
  },
  {
    region: "Northern",
    clinics: [
      { no: "100", name: "Ummah Medical Center", location: "Jisonayili Tamale", owner: "Mr Abdullah", tel: "547311207", rcr: "Fuseini Abdul Rashid" },
      { no: "104", name: "One Heart medical centre", location: "Lamashegu", owner: "Adjei Shiwebatu", tel: "240560092", rcr: "Alhassan labzorow" },
      { no: "105", name: "Adas clinic", location: "Aboabo old market", owner: "Mahama Felicia", tel: "24602808" },
      { no: "106", name: "Marshal health centre", location: "Katariga", owner: "Nangue Vitalis", tel: "547656868" },
      { no: "107", name: "Church of Christ health centre", location: "Yendi", owner: "Isaac Obeng odei", tel: "241943779" },
      { no: "108", name: "Amat_zak memorial maternity Home", location: "Kakpagyili", owner: "Zakariah Yahatasu", tel: "244948740" }
    ]
  },
  {
    region: "North East Region",
    clinics: [
      { no: "109", name: "TAMAH SPECIALIST HOSP.", location: "WALEWALE", owner: "Sharifa Alhassan (Midwife)", tel: "0550561684", rcr: "BUKARI" },
      { no: "110", name: "NAMA HEALTH SERVICES", location: "Nalerigu", owner: "Ms Latifa", tel: "0544622351" }
    ]
  },
  {
    region: "Upper West Region",
    clinics: [
      { no: "111", name: "Mama Mary maternity home", location: "Tumu", owner: "Mama Mary", tel: "0249033468", rcr: "Kennedy Maakwo" },
      { no: "112", name: "Virtue hospital", location: "Tumu", owner: "Nashiru Abubakari", tel: "0242758004" },
      { no: "113", name: "Wianipomi Mat. Home", location: "Gwollu", owner: "Alidu tinchma Karim", tel: "0540303007" },
      { name: "Progress Maternity Home Nyoli", location: "Nyoli", owner: "Fausta", tel: "0542570258", rcr: "Memuna Mohammed" }
    ]
  },
  {
    region: "Upper East",
    clinics: [
      { no: "114", name: "Wedam clinic", location: "Paga", owner: "Dr Abraham Titigah", tel: "208072154", rcr: "Musah" },
      { no: "115", name: "Gossip's Clinic", location: "Zebilla", owner: "Benjamin Atiah", tel: "0551166103", rcr: "Ayebilla Sampson Atubiga" },
      { no: "116", name: "Faith Clinic", location: "Zebilla", owner: "Vida Akolgo", tel: "0248577210" }
    ]
  },
  {
    region: "Western",
    clinics: [
      { no: "117", name: "Pentecost hospital", location: "Tarkwa Main station", owner: "Rv Dr Suleman Degraft Issaka", tel: "242574729", rcr: "Grace Woode Dick" },
      { no: "118", name: "Ami memorial Hospital", location: "Tarkwa Na about Road", owner: "Hajiaa Selina Yakubu", tel: "244377076" },
      { no: "119", name: "Henbaab Clinic", location: "Takoradi", owner: "Madam Baaba", tel: "0203001834", rcr: "VIDA" },
      { no: "120", name: "New Crystal Hosptial", location: "Takoradi", owner: "Christina Araba Mensah", tel: "0245213904" }
    ]
  },
  {
    region: "Volta",
    clinics: [
      { no: "121", name: "Supercare Specialist Medical centre", location: "Ho", owner: "Gabriella", tel: "0245129431", rcr: "Leonard" },
      { no: "122", name: "Emmanuel hospital", location: "Ho", owner: "Selorm", tel: "0592664354" },
      { no: "123", name: "St Patrick's hospital", location: "Kpando", owner: "Princess Yayra", tel: "0206781452" },
      { no: "124", name: "St Paul hospital", location: "Akatsi", owner: "Hospital manager", tel: "0500197458" },
      { no: "125", name: "Miracle Life Clinic", location: "Ho", owner: "Happy /Bridget", tel: "0544715365/0551795938" }
    ]
  },
  {
    region: "Oti",
    clinics: [
      { no: "126", name: "New Life Clinic", location: "Hohoe", owner: "Kanton Bertha", tel: "0247089537", rcr: "Frank" },
      { name: "One First Choice Clinic", location: "Kledzo", owner: "Isaac", tel: "0240154737" }
    ]
  }
];
