import { motion } from "framer-motion";

export default function GlassCard({ children, className = "", hoverable = false, animate = false, ...props }) {
  if (animate) {
    return (
      <motion.div
        whileHover={hoverable ? { y: -3 } : undefined}
        className={`glass-card ${hoverable ? "hoverable" : ""} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <div className={`glass-card ${hoverable ? "hoverable" : ""} ${className}`} {...props}>
      {children}
    </div>
  );
}
