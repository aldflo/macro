import { motion } from "framer-motion";

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  duration = 0.7,
  y = 40,
  blur = true,
  once = true,
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: blur ? "blur(8px)" : "blur(0px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, margin: "-8% 0px" }}
      transition={{ duration, delay, ease: [0.22, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}