import { motion } from "framer-motion";

const variantes = {
  inicial: {
    opacity: 0,
    y: 18,
    scale: 0.992,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  salida: {
    opacity: 0,
    y: -10,
    scale: 0.996,
    filter: "blur(5px)",
  },
};

export default function PageTransition({ children }) {
  return (
    <motion.main
      variants={variantes}
      initial="inicial"
      animate="visible"
      exit="salida"
      transition={{
        duration: 0.46,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ willChange: "transform, opacity, filter" }}
    >
      {children}
    </motion.main>
  );
}
