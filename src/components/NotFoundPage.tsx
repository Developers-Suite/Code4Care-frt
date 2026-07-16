import { motion } from "motion/react";
import { ChevronRight, Home, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "./ui/button";

export function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="h-[100dvh] sm:min-h-screen flex items-center justify-center p-0 sm:px-3 sm:py-4 sm:p-4 overflow-hidden sm:overflow-y-auto bg-[#FFF8F8]">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-w-md w-full h-[100dvh] sm:min-h-[680px] sm:h-auto bg-white rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl p-5 sm:p-8 flex flex-col"
      >
        <div className="text-center mb-6">
          <p className="text-sm font-semibold tracking-wide uppercase text-[#BE322D] mb-3">
            {t("common.appName", "Lydia Contact Center")}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            {t("notFound.title", "Page not found")}
          </h1>
          <p className="text-gray-500">
            {t("notFound.subtitle", "The page you were looking for does not exist or may have moved.")}
          </p>
        </div>

        <div className="mb-8 sm:mb-10 flex-1 flex items-center">
          <div className="mx-auto w-full max-w-sm h-64 sm:h-72 rounded-3xl bg-gradient-to-b from-[#FFF1F1] to-white border border-[#F4D6D5] flex items-center justify-center relative overflow-visible">
            <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-[#F4D6D5]/70" />
            <div className="absolute -bottom-5 -right-5 sm:-bottom-8 sm:-right-8 w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-100/70" />
            <div className="relative z-10 flex flex-col items-center text-center px-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#BE322D] to-[#F16365] flex items-center justify-center shadow-lg shadow-[#F5D5D5] mb-4">
                <Home className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <p className="text-5xl sm:text-7xl font-bold tracking-tighter text-gray-900 leading-none">404</p>
              <p className="mt-3 text-sm text-gray-500 max-w-xs">
                {t("notFound.helper", "That path is outside the safe space. Use the button below to return home.")}
              </p>
            </div>
            <Sparkles className="absolute top-4 right-4 sm:top-5 sm:right-5 w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          </div>
        </div>

        <Button onClick={() => navigate("/")} className="w-full h-12 rounded-xl bg-gradient-to-r from-[#BE322D] to-[#F16365] hover:from-[#9F2622] hover:to-[#DD575A] text-base sm:text-lg">
          {t("notFound.cta", "Go Home")}
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
        </Button>
      </motion.div>
    </div>
  );
}