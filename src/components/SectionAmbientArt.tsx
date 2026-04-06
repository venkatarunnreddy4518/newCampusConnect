import { motion } from "framer-motion";

export type SectionAmbientVariant = "events" | "clubs" | "scores" | "alerts" | "scorer" | "admin";

const pulseTransition = { duration: 3.8, repeat: Infinity, ease: "easeInOut" } as const;

const nodeBase = "absolute rounded-full border border-foreground/12 bg-background/90 shadow-[0_0_0_10px_hsl(var(--background)_/_0.84)]";

const EventsArt = () => (
  <>
    <motion.div
      animate={{ y: [0, -12, 0], rotate: [0, 3, 0] }}
      transition={{ duration: 9.4, repeat: Infinity, ease: "easeInOut" }}
      className="absolute right-[4%] top-[7%] hidden xl:block"
    >
      <div className="relative h-48 w-48 opacity-70">
        <div className="absolute inset-0 rounded-full border border-dashed border-foreground/12" />
        <div className="absolute inset-6 rounded-full border border-foreground/10" />
        <div className="absolute left-8 top-16 h-px w-28 rotate-[18deg] bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
        <div className="absolute bottom-10 right-10 h-px w-24 -rotate-[22deg] bg-gradient-to-r from-transparent via-foreground/9 to-transparent" />
        <motion.div
          animate={{ x: [0, 16, 0], y: [0, -10, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
          className={`${nodeBase} left-[62%] top-[10%] h-4 w-4`}
        />
      </div>
    </motion.div>

    <motion.div
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 7.8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[11%] left-[5%] hidden xl:block"
    >
      <div className="relative h-32 w-56 rounded-[28px] border border-foreground/10 bg-background/35 backdrop-blur-[2px]">
        <div className="absolute inset-4 rounded-[22px] border border-foreground/8" />
        <div className="absolute left-8 right-8 top-[2.75rem] h-px bg-foreground/10" />
        <div className="absolute left-8 right-14 top-16 h-px bg-foreground/8" />
        <div className="absolute left-8 right-20 top-[5.25rem] h-px bg-foreground/8" />
        <motion.div
          animate={{ x: [0, 22, 0] }}
          transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-10 top-8 h-5 w-10 rounded-full border border-foreground/12 bg-background/90"
        />
      </div>
    </motion.div>
  </>
);

const ClubsArt = () => (
  <>
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 8.6, repeat: Infinity, ease: "easeInOut" }}
      className="absolute right-[5%] top-[12%] hidden xl:block"
    >
      <div className="relative h-52 w-72 opacity-70">
        <div className="absolute left-[16%] top-[24%] h-px w-24 rotate-[18deg] bg-foreground/10" />
        <div className="absolute left-[38%] top-[28%] h-px w-20 -rotate-[12deg] bg-foreground/10" />
        <div className="absolute left-[26%] top-[44%] h-px w-28 rotate-[10deg] bg-foreground/10" />
        <div className="absolute left-[12%] top-[58%] h-px w-20 -rotate-[18deg] bg-foreground/9" />
        {[
          { left: "8%", top: "18%", size: "h-5 w-5" },
          { left: "30%", top: "28%", size: "h-4 w-4" },
          { left: "52%", top: "16%", size: "h-6 w-6" },
          { left: "68%", top: "40%", size: "h-4 w-4" },
          { left: "24%", top: "56%", size: "h-5 w-5" },
          { left: "52%", top: "66%", size: "h-4 w-4" },
        ].map((node, index) => (
          <motion.div
            key={`${node.left}-${node.top}`}
            animate={{ scale: [1, 1.08, 1], opacity: [0.72, 0.95, 0.72] }}
            transition={{ ...pulseTransition, delay: index * 0.35 }}
            className={`${nodeBase} ${node.size}`}
            style={{ left: node.left, top: node.top }}
          />
        ))}
      </div>
    </motion.div>

    <motion.div
      animate={{ y: [0, 9, 0], rotate: [0, -2, 0] }}
      transition={{ duration: 9.2, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[12%] left-[6%] hidden xl:block"
    >
      <div className="relative h-32 w-44 opacity-65">
        <div className="absolute left-0 top-6 h-20 w-20 rounded-[26px] border border-foreground/10 bg-background/40" />
        <div className="absolute left-14 top-0 h-24 w-24 rounded-[30px] border border-foreground/10 bg-background/32" />
        <div className="absolute left-24 top-10 h-[4.5rem] w-[4.5rem] rounded-[24px] border border-foreground/10 bg-background/40" />
        <motion.div
          animate={{ x: [0, 10, 0], y: [0, -8, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className={`${nodeBase} left-[46%] top-[38%] h-4 w-4`}
        />
      </div>
    </motion.div>
  </>
);

const ScoresArt = () => (
  <>
    <motion.div
      animate={{ y: [0, -10, 0], rotate: [0, 1.5, 0] }}
      transition={{ duration: 9.1, repeat: Infinity, ease: "easeInOut" }}
      className="absolute right-[4%] top-[10%] hidden xl:block"
    >
      <div className="relative h-44 w-64 rounded-[34px] border border-foreground/10 bg-background/32 backdrop-blur-[2px]">
        <div className="absolute inset-4 rounded-[26px] border border-foreground/8" />
        <div className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-foreground/10" />
        <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-foreground/10" />
        <div className="absolute left-8 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-foreground/8" />
        <div className="absolute right-8 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-foreground/8" />
        <motion.div
          animate={{ x: [0, 26, 56, 0], y: [0, -10, 8, 0] }}
          transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
          className={`${nodeBase} left-12 top-14 h-4 w-4`}
        />
      </div>
    </motion.div>

    <motion.div
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 7.6, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[13%] left-[6%] hidden xl:block"
    >
      <div className="relative h-28 w-48 opacity-65">
        <div className="absolute inset-x-0 top-6 h-14 rounded-[20px] border border-foreground/10 bg-background/32" />
        <div className="absolute left-6 top-[2.75rem] h-2 w-24 rounded-full bg-foreground/12" />
        <div className="absolute left-6 top-[4.25rem] h-2 w-32 rounded-full bg-foreground/10" />
        <div className="absolute right-6 top-[2.75rem] h-8 w-12 rounded-[14px] border border-foreground/10" />
        <motion.div
          animate={{ width: ["32%", "64%", "42%"] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-6 top-[4.25rem] h-2 rounded-full bg-foreground/14"
        />
      </div>
    </motion.div>
  </>
);

const AlertsArt = () => (
  <>
    <motion.div
      animate={{ scale: [1, 1.05, 1], opacity: [0.65, 0.95, 0.65] }}
      transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
      className="absolute right-[8%] top-[10%] hidden xl:block"
    >
      <div className="relative h-40 w-40 opacity-70">
        <div className="absolute inset-0 rounded-full border border-foreground/10" />
        <div className="absolute inset-5 rounded-full border border-dashed border-foreground/10" />
        <div className="absolute inset-10 rounded-full border border-foreground/8" />
        <motion.div
          animate={{ scale: [1, 1.16, 1], opacity: [0.75, 1, 0.75] }}
          transition={{ ...pulseTransition, delay: 0.6 }}
          className={`${nodeBase} left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2`}
        />
      </div>
    </motion.div>

    <motion.div
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 8.2, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[12%] left-[6%] hidden xl:block"
    >
      <div className="relative h-32 w-64 opacity-72">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            animate={{ x: [0, index === 1 ? 10 : 0, 0] }}
            transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }}
            className="absolute rounded-[22px] border border-foreground/10 bg-background/36 px-4 py-3"
            style={{ left: `${index * 18}px`, top: `${index * 24}px`, width: "190px" }}
          >
            <div className="h-2 w-20 rounded-full bg-foreground/12" />
            <div className="mt-3 h-2 w-28 rounded-full bg-foreground/9" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  </>
);

const ScorerArt = () => (
  <>
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 8.7, repeat: Infinity, ease: "easeInOut" }}
      className="absolute right-[6%] top-[10%] hidden xl:block"
    >
      <div className="relative h-44 w-56 opacity-70">
        <div className="absolute left-1/2 top-0 h-full w-16 -translate-x-1/2 rounded-[32px] border border-foreground/10 bg-background/28" />
        <div className="absolute left-1/2 top-6 h-[calc(100%-3rem)] w-px -translate-x-1/2 bg-foreground/10" />
        <div className="absolute left-1/2 top-10 h-10 w-10 -translate-x-1/2 rounded-full border border-foreground/8" />
        <div className="absolute left-1/2 bottom-10 h-10 w-10 -translate-x-1/2 rounded-full border border-foreground/8" />
        <div className="absolute left-[44%] top-4 h-4 w-px bg-foreground/10" />
        <div className="absolute left-1/2 top-4 h-4 w-px -translate-x-1/2 bg-foreground/10" />
        <div className="absolute left-[56%] top-4 h-4 w-px bg-foreground/10" />
        <div className="absolute left-[44%] bottom-4 h-4 w-px bg-foreground/10" />
        <div className="absolute left-1/2 bottom-4 h-4 w-px -translate-x-1/2 bg-foreground/10" />
        <div className="absolute left-[56%] bottom-4 h-4 w-px bg-foreground/10" />
        <motion.div
          animate={{ x: [0, 14, 0], y: [0, 98, 0] }}
          transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
          className={`${nodeBase} left-[48%] top-8 h-4 w-4`}
        />
      </div>
    </motion.div>

    <motion.div
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[13%] left-[6%] hidden xl:block"
    >
      <div className="relative h-28 w-52 opacity-68">
        <div className="absolute inset-0 rounded-[24px] border border-foreground/10 bg-background/30" />
        <div className="absolute left-6 top-8 h-2 w-16 rounded-full bg-foreground/12" />
        <div className="absolute left-6 top-14 h-2 w-28 rounded-full bg-foreground/9" />
        <div className="absolute left-6 top-20 h-2 w-20 rounded-full bg-foreground/9" />
        <motion.div
          animate={{ width: ["22%", "58%", "36%"] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-6 top-14 h-2 rounded-full bg-foreground/14"
        />
      </div>
    </motion.div>
  </>
);

const AdminArt = () => (
  <>
    <motion.div
      animate={{ y: [0, -8, 0], rotate: [0, 1.4, 0] }}
      transition={{ duration: 8.9, repeat: Infinity, ease: "easeInOut" }}
      className="absolute right-[5%] top-[10%] hidden xl:block"
    >
      <div className="relative h-44 w-64 opacity-72">
        <div className="absolute left-0 top-8 h-28 w-28 rounded-[26px] border border-foreground/10 bg-background/32" />
        <div className="absolute right-0 top-0 h-24 w-32 rounded-[28px] border border-foreground/10 bg-background/28" />
        <div className="absolute right-8 bottom-0 h-24 w-40 rounded-[30px] border border-foreground/10 bg-background/30" />
        <div className="absolute left-8 top-16 h-2 w-12 rounded-full bg-foreground/12" />
        <div className="absolute left-8 top-[5.5rem] h-2 w-16 rounded-full bg-foreground/9" />
        <div className="absolute right-12 top-10 h-px w-16 rotate-[18deg] bg-foreground/10" />
        <div className="absolute right-16 top-[4.5rem] h-px w-12 -rotate-[14deg] bg-foreground/10" />
        <motion.div
          animate={{ x: [0, 18, 0], y: [0, -8, 0] }}
          transition={{ duration: 5.1, repeat: Infinity, ease: "easeInOut" }}
          className={`${nodeBase} right-[18%] top-[26%] h-4 w-4`}
        />
      </div>
    </motion.div>

    <motion.div
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 7.7, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[14%] left-[5%] hidden xl:block"
    >
      <div className="relative h-28 w-44 opacity-68">
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2].map((col) => (
            <motion.div
              key={`${row}-${col}`}
              animate={{ scale: [1, row === col ? 1.08 : 1, 1], opacity: [0.45, 0.9, 0.45] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: (row + col) * 0.28 }}
              className="absolute h-3 w-3 rounded-full border border-foreground/12 bg-background/80"
              style={{ left: `${18 + col * 34}px`, top: `${10 + row * 22}px` }}
            />
          )),
        )}
        <div className="absolute left-8 top-4 h-px w-20 bg-foreground/10" />
        <div className="absolute left-8 top-[6.5rem] h-px w-20 bg-foreground/8" />
        <div className="absolute left-8 top-48 h-px w-20 bg-foreground/8" />
      </div>
    </motion.div>
  </>
);

const SectionAmbientArt = ({ variant }: { variant: SectionAmbientVariant }) => {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
      {variant === "events" && <EventsArt />}
      {variant === "clubs" && <ClubsArt />}
      {variant === "scores" && <ScoresArt />}
      {variant === "alerts" && <AlertsArt />}
      {variant === "scorer" && <ScorerArt />}
      {variant === "admin" && <AdminArt />}
    </div>
  );
};

export default SectionAmbientArt;
