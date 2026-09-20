import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 350, mass: 0.5 };
  const x = useSpring(cursorX, springConfig);
  const y = useSpring(cursorY, springConfig);
  const [variant, setVariant] = useState("default");
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const move = (e) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };
    const over = (e) => {
      const target = e.target;
      if (target.closest("a, button, [data-cursor='hover'], input, textarea, select")) {
        setVariant("hover");
      } else {
        setVariant("default");
      }
    };
    const leave = () => setHidden(true);
    const enter = () => setHidden(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    document.addEventListener("mouseleave", leave);
    document.addEventListener("mouseenter", enter);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      document.removeEventListener("mouseleave", leave);
      document.removeEventListener("mouseenter", enter);
    };
  }, [cursorX, cursorY]);

  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);
  if (isTouch) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999] mix-blend-difference"
      style={{ x, y, opacity: hidden ? 0 : 1 }}
      animate={{
        width: variant === "hover" ? 56 : 32,
        height: variant === "hover" ? 56 : 32,
        borderRadius: variant === "hover" ? 12 : 999,
      }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      <div className="h-full w-full bg-white" />
    </motion.div>
  );
}