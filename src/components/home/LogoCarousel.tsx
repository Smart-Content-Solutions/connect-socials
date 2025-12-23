import React, { useState } from "react";

// Top Row - Social & Platforms (integrations we use)
const topRowLogos = [
  // Social & community
  { name: "Facebook", url: "https://www.facebook.com/", logo: "https://cdn.simpleicons.org/facebook/1877F2" },
  { name: "Instagram", url: "https://www.instagram.com/", logo: "https://cdn.simpleicons.org/instagram/E4405F" },
  { name: "WhatsApp", url: "https://www.whatsapp.com/", logo: "https://cdn.simpleicons.org/whatsapp/25D366" },
  { name: "TikTok", url: "https://www.tiktok.com/", logo: "https://cdn.simpleicons.org/tiktok/FFFFFF" },
  { name: "YouTube", url: "https://www.youtube.com/", logo: "https://cdn.simpleicons.org/youtube/FF0000" },
  { name: "X", url: "https://x.com/", logo: "https://cdn.simpleicons.org/x/FFFFFF" },
  { name: "Snapchat", url: "https://www.snapchat.com/", logo: "https://cdn.simpleicons.org/snapchat/FFFC00" },
  { name: "LinkedIn", url: "https://www.linkedin.com/", logo: "https://cdn.simpleicons.org/snapchat/FFFC00" },
  { name: "Reddit", url: "https://www.reddit.com/", logo: "https://cdn.simpleicons.org/reddit/FF4500" },
  { name: "Pinterest", url: "https://www.pinterest.com/", logo: "https://cdn.simpleicons.org/pinterest/BD081C" },
  { name: "Twitch", url: "https://www.twitch.tv/", logo: "https://cdn.simpleicons.org/twitch/9146FF" },
  { name: "Discord", url: "https://discord.com/", logo: "https://cdn.simpleicons.org/discord/5865F2" },
  { name: "Rumble", url: "https://rumble.com/", logo: "https://cdn.simpleicons.org/rumble/85C742" },

  // Streaming & media
  { name: "Netflix", url: "https://www.netflix.com/", logo: "https://cdn.simpleicons.org/netflix/E50914" },
  { name: "Spotify", url: "https://www.spotify.com/", logo: "https://cdn.simpleicons.org/spotify/1DB954" },
  { name: "Apple Music", url: "https://music.apple.com/", logo: "https://cdn.simpleicons.org/applemusic/FA243C" },

  // Core tech platforms
  { name: "Google", url: "https://www.google.com/", logo: "https://cdn.simpleicons.org/google/4285F4" },
  { name: "Apple", url: "https://www.apple.com/", logo: "https://cdn.simpleicons.org/apple/FFFFFF" },
  { name: "Microsoft", url: "https://www.microsoft.com/", logo: "https://cdn.simpleicons.org/microsoft/5E5E5E" },
  { name: "Meta", url: "https://about.meta.com/", logo: "https://cdn.simpleicons.org/meta/0082FB" },
  { name: "Amazon", url: "https://www.amazon.com/", logo: "https://cdn.simpleicons.org/amazon/FF9900" },
  { name: "Adobe", url: "https://www.adobe.com/", logo: "https://cdn.simpleicons.org/adobe/FF0000" },
  { name: "Salesforce", url: "https://www.salesforce.com/", logo: "https://cdn.simpleicons.org/salesforce/00A1E0" },
  { name: "IBM", url: "https://www.ibm.com/", logo: "https://cdn.simpleicons.org/ibm/054ADA" },
  { name: "Oracle", url: "https://www.oracle.com/", logo: "https://cdn.simpleicons.org/oracle/F80000" },
  { name: "Samsung", url: "https://www.samsung.com/", logo: "https://cdn.simpleicons.org/samsung/1428A0" },
  { name: "Intel", url: "https://www.intel.com/", logo: "https://cdn.simpleicons.org/intel/0071C5" },
  { name: "NVIDIA", url: "https://www.nvidia.com/", logo: "https://cdn.simpleicons.org/nvidia/76B900" },

  // Commerce, payments, SaaS
  { name: "PayPal", url: "https://www.paypal.com/", logo: "https://cdn.simpleicons.org/paypal/003087" },
  { name: "Shopify", url: "https://www.shopify.com/", logo: "https://cdn.simpleicons.org/shopify/7AB55C" },
  { name: "Stripe", url: "https://stripe.com/", logo: "https://cdn.simpleicons.org/stripe/635BFF" },
  { name: "Slack", url: "https://slack.com/", logo: "https://cdn.simpleicons.org/slack/4A154B" },

  // Google ecosystem, marketing and tools
  { name: "Google Home", url: "https://home.google.com/", logo: "https://cdn.simpleicons.org/googlehome/4285F4" },
  { name: "Google Ads", url: "https://ads.google.com/", logo: "https://cdn.simpleicons.org/googleads/4285F4" },
  { name: "Google Maps", url: "https://maps.google.com/", logo: "https://cdn.simpleicons.org/googlemaps/4285F4" },
  { name: "Google Meet", url: "https://meet.google.com/", logo: "https://cdn.simpleicons.org/googlemeet/00897B" },
  { name: "Google Chrome", url: "https://www.google.com/chrome/", logo: "https://cdn.simpleicons.org/googlechrome/4285F4" },
  { name: "Google Drive", url: "https://drive.google.com/", logo: "https://cdn.simpleicons.org/googledrive/4285F4" },
  { name: "Google Photos", url: "https://photos.google.com/", logo: "https://cdn.simpleicons.org/googlephotos/4285F4" },
  { name: "Google Gemini", url: "https://gemini.google.com/", logo: "https://cdn.simpleicons.org/googlegemini/8E75B2" },

  // Productivity & AI tools
  { name: "Notion", url: "https://www.notion.so/", logo: "https://cdn.simpleicons.org/notion/000000" },
  { name: "OpenAI", url: "https://openai.com/", logo: "https://cdn.simpleicons.org/openai/412991" },
  { name: "Perplexity", url: "https://www.perplexity.ai/", logo: "https://cdn.simpleicons.org/perplexity/1F2933" },
  { name: "Grok", url: "https://grok.com/", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Grok-feb-2025-logo.svg" },
  { name: "n8n", url: "https://n8n.io/", logo: "https://cdn.simpleicons.org/n8n/FFFFFF" },

  // Office 365 apps
  { name: "Microsoft Word", url: "https://www.microsoft.com/microsoft-365/word", logo: "https://cdn.simpleicons.org/microsoftword/2B579A" },
  { name: "Microsoft Excel", url: "https://www.microsoft.com/microsoft-365/excel", logo: "https://cdn.simpleicons.org/microsoftexcel/217346" },
  { name: "Microsoft PowerPoint", url: "https://www.microsoft.com/microsoft-365/powerpoint", logo: "https://cdn.simpleicons.org/microsoftpowerpoint/B7472A" },
  { name: "Microsoft Outlook", url: "https://outlook.live.com/", logo: "https://cdn.simpleicons.org/microsoftoutlook/0078D4" },
  { name: "Microsoft OneDrive", url: "https://onedrive.live.com/", logo: "https://cdn.simpleicons.org/microsoftonedrive/0078D4" },
  { name: "Microsoft OneNote", url: "https://www.onenote.com/", logo: "https://cdn.simpleicons.org/microsoftonenote/7719AA" },
  { name: "Microsoft Teams", url: "https://www.microsoft.com/microsoft-teams/", logo: "https://cdn.simpleicons.org/microsoftteams/6264A7" },
];

// Bottom Row, Global brands & enterprises, no food / drink brands
const bottomRowLogos = [
  // Retail & consumer
  { name: "Walmart", url: "https://www.walmart.com/", logo: "https://cdn.simpleicons.org/walmart/0071CE" },
  { name: "Target", url: "https://www.target.com/", logo: "https://cdn.simpleicons.org/target/CC0000" },
  { name: "IKEA", url: "https://www.ikea.com/", logo: "https://cdn.simpleicons.org/ikea/0058A3" },
  { name: "eBay", url: "https://www.ebay.com/", logo: "https://cdn.simpleicons.org/ebay/E53238" },
  { name: "Alibaba", url: "https://www.alibaba.com/", logo: "https://cdn.simpleicons.org/alibaba/FF6A00" },

  // Automotive
  { name: "Tesla", url: "https://www.tesla.com/", logo: "https://cdn.simpleicons.org/tesla/CC0000" },
  { name: "BMW", url: "https://www.bmw.com/", logo: "https://cdn.simpleicons.org/bmw/0066B1" },
  { name: "Mercedes-Benz", url: "https://www.mercedes-benz.com/", logo: "https://cdn.simpleicons.org/mercedes/00ADEF" },
  { name: "Audi", url: "https://www.audi.com/", logo: "https://cdn.simpleicons.org/audi/BB0A30" },
  { name: "Volkswagen", url: "https://www.volkswagen.com/", logo: "https://cdn.simpleicons.org/volkswagen/151F5D" },
  { name: "Ford", url: "https://www.ford.com/", logo: "https://cdn.simpleicons.org/ford/003478" },
  { name: "Porsche", url: "https://www.porsche.com/", logo: "https://cdn.simpleicons.org/porsche/B12B28" },
  { name: "Ferrari", url: "https://www.ferrari.com/", logo: "https://cdn.simpleicons.org/ferrari/DA291C" },
  { name: "Toyota", url: "https://www.toyota.com/", logo: "https://cdn.simpleicons.org/toyota/EB0A1E" },

  // Sports & lifestyle
  { name: "Nike", url: "https://www.nike.com/", logo: "https://cdn.simpleicons.org/nike/FFFFFF" },
  { name: "Adidas", url: "https://www.adidas.com/", logo: "https://cdn.simpleicons.org/adidas/FFFFFF" },

  // Travel & hospitality
  { name: "Airbnb", url: "https://www.airbnb.com/", logo: "https://cdn.simpleicons.org/airbnb/FF5A5F" },

  // Finance
  { name: "Visa", url: "https://www.visa.com/", logo: "https://cdn.simpleicons.org/visa/1A1F71" },
  { name: "Mastercard", url: "https://www.mastercard.com/", logo: "https://cdn.simpleicons.org/mastercard/EB001B" },

  // Logistics
  { name: "UPS", url: "https://www.ups.com/", logo: "https://cdn.simpleicons.org/ups/351C15" },
  { name: "FedEx", url: "https://www.fedex.com/", logo: "https://cdn.simpleicons.org/fedex/4D148C" },

  // Electronics & industrial
  { name: "LG", url: "https://www.lg.com/", logo: "https://cdn.simpleicons.org/lg/A50034" },
  { name: "Philips", url: "https://www.philips.com/", logo: "https://cdn.simpleicons.org/philips/0B5ED7" },
  { name: "Siemens", url: "https://www.siemens.com/", logo: "https://cdn.simpleicons.org/siemens/009999" },

  // Fashion
  { name: "H&M", url: "https://www.hm.com/", logo: "https://cdn.simpleicons.org/hm/E50010" },
];

// Single Logo Tile component
function LogoTile({ item }) {
  const [imgError, setImgError] = useState(false);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.name}
      className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br from-[#2A2A2C] to-[#1F1F21] border border-[#3B3C3E]/60 flex items-center justify-center"
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
    >
      {!imgError ? (
        <img
          src={item.logo}
          alt={item.name}
          className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 object-contain"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : null}
    </a>
  );
}

// Smooth infinite scrolling row
function ScrollingRow({ logos, direction = "left", duration = 60 }) {
  return (
    <div className="relative overflow-hidden w-full py-3">
      {/* Subtle edge fades - positioned at extreme edges */}
      <div 
        className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
        style={{
          width: '60px',
          background: 'linear-gradient(to right, #1A1A1C 0%, #1A1A1C 20%, transparent 100%)'
        }}
      />
      <div 
        className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
        style={{
          width: '60px',
          background: 'linear-gradient(to left, #1A1A1C 0%, #1A1A1C 20%, transparent 100%)'
        }}
      />

      {/* Track with two copies for seamless loop */}
      <div
        className={`flex w-max ${direction === "left" ? "animate-scroll-left" : "animate-scroll-right"}`}
        style={{ animationDuration: `${duration}s` }}
      >
        <div className="flex gap-5 sm:gap-6 lg:gap-8 pr-5 sm:pr-6 lg:pr-8">
          {logos.map((item, index) => (
            <LogoTile key={`${item.name}-main-${index}`} item={item} />
          ))}
        </div>
        <div className="flex gap-5 sm:gap-6 lg:gap-8 pr-5 sm:pr-6 lg:pr-8" aria-hidden="true">
          {logos.map((item, index) => (
            <LogoTile key={`${item.name}-dup-${index}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Logo Carousel Section
export default function LogoCarouselSection() {
  return (
    <>
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
          animation-name: scrollLeft;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .animate-scroll-right {
          animation-name: scrollRight;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>

      <section className="overflow-hidden w-full">
        <div className="space-y-3 sm:space-y-4">
          <ScrollingRow logos={topRowLogos} direction="left" duration={80} />
          <ScrollingRow logos={bottomRowLogos} direction="right" duration={50} />
        </div>
      </section>
    </>
  );
}
