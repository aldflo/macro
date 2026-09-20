import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Parallax({ children, speed = 0.3, className = "" }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 100}%`, `${-speed * 100}%`]);

  return (
    <div ref__={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}