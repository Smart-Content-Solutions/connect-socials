import React from "react";
import { motion } from "framer-motion";

interface SectionHeadingProps {
  badge?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  goldTitle?: boolean;
}

export default function SectionHeading({
  badge,
  title,
  subtitle,
  centered = true,
  goldTitle = false
}: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={centered ? "text-center" : ""}
    >
      {badge && (
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase mb-4 bg-[#E1C37A]/10 text-[#E1C37A] border border-[#E1C37A]/20">
          {badge}
        </span>
      )}
      <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight ${goldTitle ? 'gold-text' : 'text-white'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-[#A9AAAC] max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}