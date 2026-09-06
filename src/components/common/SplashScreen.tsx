import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import logo from "../../assets/images/logo.png";
const SplashScreen = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    showSplash && (
      <AnimatePresence>
        <motion.section
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[999] flex min-h-dvh flex-col bg-secondary px-6 pb-[calc(18px+env(safe-area-inset-bottom))] pt-[calc(24px+env(safe-area-inset-top))] text-white"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="flex flex-1 flex-col items-center justify-center"
          >
            <div className="flex size-36 items-center justify-center rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.16)]">
              <img src={logo} alt="عدل گشت آریا نوین" />
            </div>

            <h1 className="mt-7 text-size-xl font-extrabold">
              عدل گشت آریا نوین
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ delay: 0.35, duration: 0.45 }}
            className="text-center text-size-xs font-bold"
          >
            v 1.2.5
          </motion.p>
        </motion.section>
      </AnimatePresence>
    )
  );
};

export default SplashScreen;
