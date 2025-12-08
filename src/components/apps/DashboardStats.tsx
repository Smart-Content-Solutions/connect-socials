import React from "react";
import {
  Eye,
  Heart,
  MessageCircle,
  Share2,
  MousePointer,
} from "lucide-react";

const cards = [
  {
    key: "impressions",
    label: "Impressions",
    icon: Eye,
    color: "#E1C37A",
  },
  {
    key: "engagements",
    label: "Engagements",
    icon: Heart,
    color: "#B6934C",
  },
  {
    key: "likes",
    label: "Total Likes",
    icon: Heart,
    color: "#E4405F",
  },
  {
    key: "comments",
    label: "Comments",
    icon: MessageCircle,
    color: "#1DA1F2",
  },
  {
    key: "shares",
    label: "Shares",
    icon: Share2,
    color: "#6364FF",
  },
  {
    key: "clicks",
    label: "Link Clicks",
    icon: MousePointer,
    color: "#00AB6C",
  },
];

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="rounded-2xl bg-[#1C1C20]/80 border border-white/5 p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${card.color}22` }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: card.color }}
                />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              0
            </div>
            <div className="text-[11px] text-[#A9AAAC]">
              {card.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
