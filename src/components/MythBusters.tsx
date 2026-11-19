import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, X, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { getMythBusters, MythBusterItem } from "@/data/mythBustersData";
import { FeatureAnalyticsService } from "@/services";
import { useApp } from "@/providers/AppProvider";
import { logger } from "@/utils/logger";

const MYTHS_PER_PAGE = 10;

export function MythBusters() {
  const { t, i18n } = useTranslation();
  const { sessionId } = useApp();
  const [selectedMyth, setSelectedMyth] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const activeLanguage = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];

  const myths = useMemo(() => getMythBusters(activeLanguage), [activeLanguage]);
  const totalPages = Math.max(1, Math.ceil(myths.length / MYTHS_PER_PAGE));
  const visibleMyths = useMemo(() => {
    const startIndex = currentPage * MYTHS_PER_PAGE;
    return myths.slice(startIndex, startIndex + MYTHS_PER_PAGE);
  }, [currentPage, myths]);

  useEffect(() => {
    setSelectedMyth(null);
  }, [currentPage, myths]);

  useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(0);
    }
  }, [currentPage, totalPages]);

  const handleCopy = async (text: string, mythItem: MythBusterItem) => {
    navigator.clipboard.writeText(text);
    toast.success(t('common.copied', 'Copied to clipboard!'));

    // Track copy event
    if (sessionId) {
      try {
        await FeatureAnalyticsService.logMythBusterEvent({
          session_id: sessionId,
          myth_id: mythItem.id,
          myth_title: mythItem.myth,
          action: 'fact_copied',
          metadata: { category: mythItem.category },
        });
        logger.info(`Myth fact copied: ${mythItem.id}`);
      } catch (error) {
        logger.error('Failed to log myth copy event', error);
      }
    }
  };

  const handleMythClick = async (mythItem: MythBusterItem) => {
    const isExpanding = selectedMyth !== mythItem.id;
    setSelectedMyth(selectedMyth === mythItem.id ? null : mythItem.id);

    // Track myth view event when expanding
    if (isExpanding && sessionId) {
      try {
        await FeatureAnalyticsService.logMythBusterEvent({
          session_id: sessionId,
          myth_id: mythItem.id,
          myth_title: mythItem.myth,
          action: 'myth_viewed',
          metadata: { category: mythItem.category },
        });
        logger.info(`Myth viewed: ${mythItem.id}`);
      } catch (error) {
        logger.error('Failed to log myth view event', error);
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 bg-gradient-to-b from-white to-[#F8FAFE]">
      <div className="max-w-4xl mx-auto pb-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#BE322D] mb-2">{t('myths.title')}</h1>
          <p className="text-gray-500">{t('myths.subtitle')}</p>
        </div>

        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#E5ECFF] bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-[#36518A]">
            {t("myths.pageLabel", "Page")} {currentPage + 1} {t("myths.pageOf", "of")} {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t("common.previous", "Previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              {t("common.next", "Next")}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleMyths.map((item: MythBusterItem, idx: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                className="p-6 cursor-pointer border-[#F4D6D5] hover:border-[#F16365] transition-all hover:shadow-xl"
                onClick={() => handleMythClick(item)}
              >
                <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary" className="bg-[#FFF1F1] text-[#BE322D] border-none px-3 py-1">
                    {item.category}
                  </Badge>
                    {selectedMyth === item.id && <div className="w-2 h-2 rounded-full bg-[#BE322D]" />}
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <X className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-red-400 tracking-wider mb-1">{t('myths.labels.myth')}</p>
                      <p className="font-medium text-gray-800">{item.myth}</p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedMyth === item.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                          <div className="flex gap-3 items-start p-4 bg-emerald-50 rounded-2xl">
                            <Check className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-1">{t('myths.labels.fact')}</p>
                              <p className="text-gray-900 leading-relaxed">{item.fact}</p>
                              <p className="text-[10px] text-gray-400 mt-3 italic">Source: {item.source}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-[#BE322D] hover:bg-[#FFF1F1] bg-white border border-[#F4D6D5] rounded-xl"
                            onClick={(e) => { e.stopPropagation(); handleCopy(`${item.myth}\nFact: ${item.fact}`, item); }}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            {t('common.copy', 'Copy this Fact')}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}