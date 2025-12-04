import React, { useState } from "react";

/* ================================
   LOGO DATA (✅ FIXED STRUCTURE)
================================ */

const topRowLogos = [
  { name: "Notion", logo: "/icons/notion.svg", url: "https://notion.so" },
  { name: "Slack", logo: "/icons/slack.svg", url: "https://slack.com" },
  { name: "Airtable", logo: "/icons/airtable.svg", url: "https://airtable.com" },
  { name: "Google Calendar", logo: "/icons/google-calendar.svg", url: "https://calendar.google.com" },
  { name: "Outlook", logo: "/icons/outlook.svg", url: "https://outlook.com" },
  { name: "ChatGPT", logo: "/icons/chatgpt.svg", url: "https://chat.openai.com" },
  { name: "PostgreSQL", logo: "/icons/postgresql.svg", url: "https://postgresql.org" },
  { name: "Asana", logo: "/icons/asana.svg", url: "https://asana.com" },
  { name: "Figma", logo: "/icons/figma.svg", url: "https://figma.com" },
  { name: "n8n", logo: "/icons/n8n.svg", url: "https://n8n.io" },
  { name: "Make", logo: "/icons/make.svg", url: "https://make.com" },
  { name: "Zapier", logo: "/icons/zapier.svg", url: "https://zapier.com" },
  { name: "Excel", logo: "/icons/excel.svg", url: "https://microsoft.com/excel" },
  { name: "Discord", logo: "/icons/discord.svg", url: "https://discord.com" },
  { name: "Mailchimp", logo: "/icons/mailchimp.svg", url: "https://mailchimp.com" },
];

const bottomRowLogos = [...topRowLogos];

/* ================================
   SINGLE LOGO TILE
================================ */

function LogoTile({ item }) {
  const [imgError, setImgError] = useState(false);

  if (!item?.logo) return null;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.name}
      className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br from-[#2A2A2C] to-[#1F1F21] border border-[#3B3C3E]/60 flex items-center justify-center transition-transform hover:scale-105"
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
    >
      {!imgError && (
        <img
          src={item.logo}
          alt={item.name}
          className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 object-contain"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      )}
    </a>
  );
}

/* ================================
   SCROLLING ROW
================================ */

function ScrollingRow({ logos, direction = "left", duration = 60 }) {
  return (
    <div className="relative overflow-hidden w-full py-3">
      
      {/* Edge fades */}
      <div
        className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
        style={{
          width: "60px",
          background: "linear-gradient(to right, #1A1A1C 0%, #1A1A1C 20%, transparent 100%)",
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
        style={{
          width: "60px",
          background: "linear-gradient(to left, #1A1A1C 0%, #1A1A1C 20%, transparent 100%)",
        }}
      />

      {/* Track */}
      <div
        className={`flex w-max ${
          direction === "left" ? "animate-scroll-left" : "animate-scroll-right"
        }`}
        style={{ animationDuration: `${duration}s` }}
      >
        {/* Primary Row */}
        <div className="flex gap-5 sm:gap-6 lg:gap-8 pr-8">
          {logos.map((item, index) => (
            <LogoTile key={`${item.name}-main-${index}`} item={item} />
          ))}
        </div>

        {/* Duplicate Row */}
        <div className="flex gap-5 sm:gap-6 lg:gap-8 pr-8" aria-hidden="true">
          {logos.map((item, index) => (
            <LogoTile key={`${item.name}-dup-${index}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================
   MAIN CAROUSEL SECTION
================================ */

export default function LogoCarouselSection() {
  return (
    <>
      {/* Animations */}
      <style>{`
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes scrollRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        .animate-scroll-left {
          animation: scrollLeft linear infinite;
        }

        .animate-scroll-right {
          animation: scrollRight linear infinite;
        }
      `}</style>

      <section className="overflow-hidden w-full bg-[#1A1A1C] py-6">
        <div className="space-y-4">
          <ScrollingRow logos={topRowLogos} direction="left" duration={80} />
          <ScrollingRow logos={bottomRowLogos} direction="right" duration={50} />
        </div>
      </section>
    </>
  );
}
