import { useState, useMemo } from "react";
import { Search, MapPin, Phone, ShieldCheck, ChevronDown, ChevronUp, Building2 } from "lucide-react";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { REGIONAL_CLINICS, RegionClinics, ClinicContact } from "@/data/regionalClinics";
import { motion } from "motion/react";

export function ReferralSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>(() => {
    // Expand Greater Accra by default if desired, or expand all when searching
    return { "Greater Accra": true };
  });

  const toggleRegion = (regionName: string) => {
    setExpandedRegions((prev) => ({
      ...prev,
      [regionName]: !prev[regionName],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    REGIONAL_CLINICS.forEach((r) => {
      allExpanded[r.region] = true;
    });
    setExpandedRegions(allExpanded);
  };

  const collapseAll = () => {
    setExpandedRegions({});
  };

  // Filter logic: matches name, location, tel or region name
  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return REGIONAL_CLINICS.map((regGroup) => {
      // Region filter
      if (selectedRegion !== "all" && regGroup.region.toLowerCase() !== selectedRegion.toLowerCase()) {
        return null;
      }

      if (!query) {
        return regGroup;
      }

      const matchingClinics = regGroup.clinics.filter((c) => {
        return (
          c.name.toLowerCase().includes(query) ||
          c.location.toLowerCase().includes(query) ||
          c.tel.toLowerCase().includes(query) ||
          regGroup.region.toLowerCase().includes(query)
        );
      });

      if (matchingClinics.length > 0) {
        return {
          ...regGroup,
          clinics: matchingClinics,
        };
      }

      return null;
    }).filter((item): item is RegionClinics => item !== null);
  }, [searchQuery, selectedRegion]);

  const totalClinicsCount = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.clinics.length, 0);
  }, [filteredData]);

  // Clean format for tel link (take first phone number if multiple separated by slash)
  const formatTel = (tel: string) => {
    const firstNum = tel.split("/")[0].trim().replace(/\s+/g, "");
    return firstNum;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Search clinic name, location, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-2xl h-12 pl-11 border-slate-200 bg-white text-slate-800 shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>

        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="rounded-2xl h-12 px-4 border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#BE322D] shadow-sm"
        >
          <option value="all">All Regions ({REGIONAL_CLINICS.length})</option>
          {REGIONAL_CLINICS.map((r) => (
            <option key={r.region} value={r.region}>
              {r.region} ({r.clinics.length})
            </option>
          ))}
        </select>
      </div>

      {/* Summary bar and expand/collapse actions */}
      <div className="flex items-center justify-between text-sm text-slate-500 px-1">
        <span>
          Showing <strong>{totalClinicsCount}</strong> facility contact{totalClinicsCount !== 1 ? "s" : ""} across{" "}
          <strong>{filteredData.length}</strong> region{filteredData.length !== 1 ? "s" : ""}
        </span>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs font-semibold text-[#BE322D] hover:underline"
          >
            Expand All
          </button>
          <span>|</span>
          <button
            onClick={collapseAll}
            className="text-xs font-semibold text-slate-500 hover:underline"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Region Accordions */}
      {filteredData.length === 0 ? (
        <Card className="p-8 text-center border-slate-200 rounded-3xl bg-white">
          <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Clinic Contacts Found</h3>
          <p className="text-sm text-slate-500">
            No clinics matched "{searchQuery}". Try clearing search filters or checking another region.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredData.map((regionGroup) => {
            const isExpanded = searchQuery.trim().length > 0 || !!expandedRegions[regionGroup.region];

            return (
              <Collapsible
                key={regionGroup.region}
                open={isExpanded}
                onOpenChange={() => toggleRegion(regionGroup.region)}
                className="border border-slate-200 rounded-3xl bg-white shadow-sm overflow-hidden"
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full p-5 flex items-center justify-between bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-[#FFF1F1] flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#BE322D]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {regionGroup.region} Region
                        </h3>
                        <p className="text-xs text-slate-500">
                          {regionGroup.clinics.length} facility contact{regionGroup.clinics.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-slate-200 text-slate-600 font-semibold bg-white">
                        {regionGroup.clinics.length}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 bg-white">
                    {regionGroup.clinics.map((clinic: ClinicContact, idx: number) => (
                      <motion.div
                        key={`${clinic.name}-${idx}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-[#F4D6D5] hover:bg-[#FFFDFD] transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                {clinic.no && (
                                  <span className="text-xs font-bold text-slate-400">#{clinic.no}</span>
                                )}
                                <h4 className="font-bold text-slate-900 leading-snug">{clinic.name}</h4>
                              </div>
                              {clinic.location && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                  <MapPin className="w-3.5 h-3.5 text-[#BE322D]" />
                                  <span>{clinic.location}</span>
                                </div>
                              )}
                            </div>
                            <Badge className="bg-[#FFF1F1] text-[#BE322D] hover:bg-[#FDECEC] border-none text-xs px-2.5 py-0.5 rounded-full whitespace-nowrap">
                              Clinic
                            </Badge>
                          </div>

                        </div>

                        <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2 mt-3">
                          <span className="text-sm font-semibold text-slate-800 truncate">{clinic.tel}</span>
                          <Button
                            asChild
                            size="sm"
                            className="rounded-xl h-9 bg-gradient-to-r from-[#BE322D] to-[#F16365] hover:from-[#9F2622] hover:to-[#DD575A] text-white shrink-0"
                          >
                            <a href={`tel:${formatTel(clinic.tel)}`}>
                              <Phone className="w-3.5 h-3.5 mr-1.5" /> Call
                            </a>
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}