import { useState } from "react";
import {
  MapPin,
  Navigation,
  Pill,
  ShieldCheck,
  Building2,
  Phone,
  PhoneCall,
  ChevronDown,
  Search,
  X,
} from "lucide-react";

import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

import { useTranslation } from "react-i18next";
import { DKTProducts } from "./DKTProductsDropdown";
import { REGIONAL_CLINICS } from "../data/regionalClinics";

/* -------------------- DATA -------------------- */

const REGIONS = [
  "Greater Accra Region, ghana",
  "Ashanti Region, ghana",
  "Eastern Region, ghana",
  "Volta Region, ghana",
  "Central Region, ghana",
  "Western Region, ghana",
  "Northern Region, ghana",
  "Upper East Region, ghana",
  "Upper West Region, ghana",
  "Bono Region, ghana",
  "Ahafo Region, ghana",
  "Oti Region, ghana",
  "Western North Region, ghana",
  "Bono East Region, ghana",
  "Savannah Region, ghana",
];

const CONTACT_DETAILS = {
  location: "Dzorwulu, Accra",
  email: "info@dktghana.org",
};

/* -------------------- TYPES -------------------- */

type SearchType =
  | "pharmacy near me"
  | "clinic near me"
  | "24 hour pharmacy near me"
  | "family planning clinic near me";

const normalizePhoneNumbers = (phone: string) =>
  phone
    .split("/")
    .map((number) => {
      const digits = number.replace(/\D/g, "");
      return digits ? (digits.startsWith("0") ? digits : `0${digits}`) : number.trim();
    })
    .join(" / ");

/* -------------------- COMPONENT -------------------- */

export function Pharmacy() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mapOpen, setMapOpen] = useState(false);
  const [mapUrl, setMapUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const [activeTab, setActiveTab] = useState<
    "healthcare" | "dkt" | "contacts"
  >("healthcare");
  const [contactSearch, setContactSearch] = useState("");
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const filteredRegions = REGIONAL_CLINICS.map((regionGroup) => {
    const search = contactSearch.trim().toLowerCase();
    const clinics = regionGroup.clinics.filter((clinic) =>
      [
        regionGroup.region,
        clinic.no,
        clinic.name,
        clinic.location,
        clinic.owner,
        normalizePhoneNumbers(clinic.tel),
        clinic.rcr,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search))
    );

    return { ...regionGroup, clinics };
  }).filter((regionGroup) => regionGroup.clinics.length > 0);

  /* -------------------- MAP -------------------- */

  const openRegionSearch = (region: string) => {
    setError(null);
    setActiveQuery(`pharmacies in ${region}`);
    const embed = `https://www.google.com/maps?q=${encodeURIComponent(
      `pharmacies in ${region}`
    )}&output=embed`;
    const external = `https://www.google.com/maps/search/${encodeURIComponent(
      `pharmacies in ${region}`
    )}`;
    setMapUrl(embed);
    setExternalUrl(external);
    setMapOpen(true);
  };

  const openMapSearch = async (query: SearchType | string) => {
    setError(null);
    setLoading(true);
    setActiveQuery(query);

    const build = (lat?: number, lng?: number) => {
      const embed =
        lat && lng
          ? `https://www.google.com/maps?q=${encodeURIComponent(
              query
            )}&ll=${lat},${lng}&z=14&output=embed`
          : `https://www.google.com/maps?q=${encodeURIComponent(
              query
            )}&output=embed`;

      const external =
        lat && lng
          ? `https://www.google.com/maps/search/${encodeURIComponent(
              query
            )}/@${lat},${lng},14z`
          : `https://www.google.com/maps/search/${encodeURIComponent(
              query
            )}`;

      setMapUrl(embed);
      setExternalUrl(external);
      setMapOpen(true);
    };

    if (!navigator.geolocation) {
      setLoading(false);
      build();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        build(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLoading(false);
        build();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  /* -------------------- UI -------------------- */

  return (
    <>
      <div className="h-full overflow-y-auto bg-gradient-to-b from-white via-[#FFF7F7] to-[#F8FAFE]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

          {/* HERO */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FDECEC] border border-[#F7D0CF] px-4 py-2 text-sm font-medium text-[#BE322D] mb-5">
              <ShieldCheck className="w-4 h-4" />
              SRHR Access Ecosystem
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold text-[#241515] mb-3">
              {t("pharmacy.title", "Health Access Hub")}
            </h1>

            <p className="text-[#6D4A49] max-w-2xl mx-auto">
              Locate services, products, and official regional health contacts in one place.
            </p>
          </div>

          {/* TABS */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex rounded-2xl border border-[#F1D5D4] bg-white p-1">

              {[
                { key: "healthcare", label: "Health Care", icon: Navigation },
                { key: "dkt", label: "DKT Products", icon: Pill },
                { key: "contacts", label: "Regional Contacts", icon: PhoneCall },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                    activeTab === tab.key
                      ? "bg-[#BE322D] text-white"
                      : "text-[#6D4A49] hover:text-[#241515]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ---------------- HEALTHCARE ---------------- */}
          {activeTab === "healthcare" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <button
                  onClick={() => openMapSearch("pharmacy near me")}
                  disabled={loading}
                  className="rounded-3xl bg-[#BE322D] p-6 text-white text-left"
                >
                  <Navigation className="w-7 h-7 mb-4" />
                  <h3 className="text-2xl font-bold">Find Pharmacies</h3>
                  <p className="text-white/90 text-sm">
                    Locate nearby pharmacies instantly.
                  </p>
                  <p className="mt-4 text-sm font-semibold text-white/90">
                    {loading ? "Finding nearby..." : "Open interactive map"}
                  </p>
                </button>

                <button
                  onClick={() => openMapSearch("clinic near me")}
                  disabled={loading}
                  className="rounded-3xl bg-white border border-[#F1D5D4] p-6 text-left"
                >
                  <Building2 className="w-7 h-7 text-[#BE322D] mb-4" />
                  <h3 className="text-2xl font-bold">Find Clinics</h3>
                  <p className="text-[#6D4A49] text-sm">
                    Search SRHR clinics near you.
                  </p>
                  <p className="mt-4 text-sm font-semibold text-[#BE322D]">
                    {loading ? "Finding nearby..." : "Open healthcare search"}
                  </p>
                </button>
              </div>

              <Card className="rounded-3xl border-[#F1D5D4] p-6">
                <h3 className="text-xl font-bold mb-4">
                  Browse by Region
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {REGIONS.map((region) => (
                    <button
                      key={region}
                      onClick={() =>
                        openRegionSearch(region)
                      }
                      disabled={loading}
                      className="flex items-center justify-between border rounded-2xl p-3 hover:bg-[#FFF7F7]"
                    >
                      <span className="text-sm">{region}</span>
                      <MapPin className="w-4 h-4 text-[#BE322D]" />
                    </button>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ---------------- DKT ---------------- */}
          {activeTab === "dkt" && <DKTProducts />}

          {/* ---------------- CONTACTS (UPGRADED) ---------------- */}
          {activeTab === "contacts" && (
            <div>
              {/* HEADER */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#FDECEC] flex items-center justify-center">
                  <PhoneCall className="w-6 h-6 text-[#BE322D]" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-[#241515]">
                    Regional Health Contacts
                  </h3>
                  <p className="text-sm text-[#6D4A49]">
                    Search the complete regional clinic and facility contact list.
                  </p>
                </div>
              </div>

              <Card className="p-5 rounded-3xl border-[#F1D5D4] mb-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#BE322D] mb-1">
                      Location
                    </p>
                    <p className="text-sm font-medium text-[#241515]">
                      {CONTACT_DETAILS.location}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#BE322D] mb-1">
                      Email
                    </p>
                    <a
                      href={`mailto:${CONTACT_DETAILS.email}`}
                      className="text-sm font-medium text-[#241515] hover:text-[#BE322D] transition-colors"
                    >
                      {CONTACT_DETAILS.email}
                    </a>
                  </div>
                </div>
              </Card>

              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#BE322D]" />
                <input
                  type="search"
                  value={contactSearch}
                  onChange={(event) => setContactSearch(event.target.value)}
                  placeholder="Search clinic, location, owner, RCR, or phone"
                  aria-label="Search regional clinic contacts"
                  className="w-full rounded-2xl border border-[#F1D5D4] bg-white py-3 pl-11 pr-4 text-sm text-[#241515] outline-none transition placeholder:text-[#9B7B7A] focus:border-[#BE322D] focus:ring-2 focus:ring-[#FDECEC]"
                />
              </div>

              <div className="space-y-3">
                {filteredRegions.map((regionGroup) => {
                  const isExpanded = expandedRegion === regionGroup.region;

                  return (
                    <Card
                      key={regionGroup.region}
                      className="overflow-hidden rounded-3xl border-[#F1D5D4]"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRegion(isExpanded ? null : regionGroup.region)
                        }
                        aria-expanded={isExpanded}
                        className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-[#FFF7F7]"
                      >
                        <span>
                          <span className="block font-bold text-[#241515]">
                            {regionGroup.region}
                          </span>
                          <span className="mt-1 block text-sm text-[#6D4A49]">
                            {regionGroup.clinics.length} facility contact{regionGroup.clinics.length === 1 ? "" : "s"}
                          </span>
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-[#BE322D] transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="space-y-3 border-t border-[#F1D5D4] bg-[#FFFDFD] p-4">
                          {regionGroup.clinics.map((clinic, index) => (
                            <div
                              key={`${clinic.name}-${clinic.tel}-${index}`}
                              className="rounded-2xl border border-[#F1D5D4] bg-white p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#BE322D]">
                                    {clinic.no ? `Facility #${clinic.no}` : "Facility"}
                                  </p>
                                  <h4 className="mt-1 font-bold text-[#241515]">
                                    {clinic.name}
                                  </h4>
                                  <p className="mt-1 text-sm text-[#6D4A49]">
                                    {clinic.location}
                                  </p>
                                </div>
                                <a
                                  href={`tel:${normalizePhoneNumbers(clinic.tel).split(" / ")[0]}`}
                                  className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#BE322D]"
                                >
                                  <Phone className="h-4 w-4" />
                                  Call
                                </a>
                              </div>
                              <div className="mt-4 grid gap-2 text-sm text-[#6D4A49] sm:grid-cols-2">
                                <p><strong className="text-[#241515]">Phone:</strong> {normalizePhoneNumbers(clinic.tel)}</p>
                                {clinic.owner && <p><strong className="text-[#241515]">Owner:</strong> {clinic.owner}</p>}
                                {clinic.rcr && <p><strong className="text-[#241515]">RCR:</strong> {clinic.rcr}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              {filteredRegions.length === 0 && (
                <Card className="rounded-3xl border-[#F1D5D4] p-6 text-center">
                  <p className="font-semibold text-[#241515]">No contacts found</p>
                  <p className="mt-1 text-sm text-[#6D4A49]">
                    Try another clinic, region, or phone number.
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <Card className="mt-6 p-4 bg-red-50 border-red-200">
              <p className="text-red-700 text-sm">{error}</p>
            </Card>
          )}
        </div>
      </div>

      {/* MAP MODAL */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[92vh] p-0">
          <div className="flex flex-col h-full">
            <DialogHeader className="border-b p-4 flex justify-between">
              <DialogTitle>{activeQuery}</DialogTitle>
              <button onClick={() => setMapOpen(false)}>
                <X />
              </button>
            </DialogHeader>

            <iframe src={mapUrl} className="w-full h-full" />

            <a
              href={externalUrl}
              target="_blank"
              className="p-4 bg-[#BE322D] text-white text-center font-semibold"
            >
              Open in Google Maps
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}