import {
  Share2, Globe, Mail, FileText, BarChart3, Users,
  TrendingUp, Link2, Star, Clock, Activity, Bot,
  Database, Sparkles, Target, Eye, Search, PenTool,
  Languages, Megaphone, Brain
} from "lucide-react";


export const PLAN_HIERARCHY = {
  "Starter": 1,
  "Growth": 2,
  "Enterprise": 3
};

export const coreTools = [
  {
    id: "social-automation",
    name: "Social Media Post Automation",
    slug: "social-automation",
    appRoute: "/apps/social-automation",
    category: "Core",
    shortDescription: "Auto schedule and post content across all major platforms.",
    longDescription: "Automatically create, schedule, and publish social media content across Instagram, Facebook, LinkedIn, X, TikTok, and more. Our AI analyzes your audience engagement patterns to post at optimal times, maximizing reach and engagement without manual intervention.",
    mainBenefits: [
      "Save 15+ hours per week on social media management",
      "Post at optimal times based on AI analysis",
      "Maintain consistent brand voice across all platforms",
      "Track engagement and adjust strategy automatically",
      "Never miss a posting schedule again"
    ],
    howItWorks: [
      { step: "Connect", desc: "Link your social media accounts in one click" },
      { step: "Configure", desc: "Set your posting preferences and brand voice" },
      { step: "Automate", desc: "Watch posts go live while you focus on strategy" }
    ],
    planRequired: "Starter",
    status: "LiveTool",
    icon: Share2,
    color: "#E1C37A"
  },
  {
    id: "wordpress-seo",
    name: "WordPress SEO Optimisation and Post",
    slug: "wordpress-seo",
    appRoute: "/apps/wordpress-seo",
    category: "Core",
    shortDescription: "Optimize posts and publish SEO ready content to WordPress.",
    longDescription: "Transform your WordPress workflow with AI-powered SEO optimization. Automatically generate meta titles, descriptions, alt tags, and internal links. Publish perfectly optimized content directly to your WordPress site with one click.",
    mainBenefits: [
      "Boost organic traffic with optimized content",
      "Auto-generate SEO meta tags and descriptions",
      "Smart internal linking suggestions",
      "Real-time SEO scoring before publish",
      "Direct WordPress integration"
    ],
    howItWorks: [
      { step: "Connect", desc: "Link your WordPress site via secure API" },
      { step: "Optimize", desc: "AI analyzes and enhances your content for SEO" },
      { step: "Publish", desc: "Push optimized content live with one click" }
    ],
    planRequired: "Starter",
    status: "LiveTool",
    icon: Globe,
    color: "#21759B"
  },
  {
    id: "email-engine",
    name: "AI Email Marketing Engine",
    slug: "email-engine",
    category: "Core",
    shortDescription: "Generate, schedule, and send AI written campaigns.",
    longDescription: "Create high-converting email campaigns in minutes, not hours. Our AI writes subject lines that get opened, body copy that converts, and sequences that nurture leads into customers. Integrates with all major ESPs.",
    mainBenefits: [
      "2x higher open rates with AI subject lines",
      "Generate entire email sequences in minutes",
      "A/B test variations automatically",
      "Smart send-time optimization",
      "Works with Mailchimp, Klaviyo, and more"
    ],
    howItWorks: [
      { step: "Brief", desc: "Tell the AI your campaign goal and audience" },
      { step: "Generate", desc: "Review AI-written emails and sequences" },
      { step: "Launch", desc: "Schedule and send through your ESP" }
    ],
    planRequired: "Starter",
    status: "LiveTool",
    icon: Mail,
    color: "#FFE01B"
  },
  {
    id: "content-engine",
    name: "Blog and SEO Content Engine",
    slug: "content-engine",
    category: "Core",
    shortDescription: "Long form SEO content that actually ranks.",
    longDescription: "Generate comprehensive, SEO-optimized blog posts and articles that rank on Google. Our AI researches topics, analyzes competitor content, and writes long-form pieces complete with headers, images, and internal links.",
    mainBenefits: [
      "Rank for competitive keywords faster",
      "Generate 2,000+ word articles in minutes",
      "Built-in keyword research and optimization",
      "Automatic image suggestions and alt tags",
      "Content calendar integration"
    ],
    howItWorks: [
      { step: "Research", desc: "AI identifies high-opportunity keywords" },
      { step: "Create", desc: "Generate comprehensive, optimized content" },
      { step: "Publish", desc: "Push to your CMS or download for review" }
    ],
    planRequired: "Starter",
    status: "LiveTool",
    icon: FileText,
    color: "#E1C37A"
  },
  {
    id: "ai-agent",
    name: "AI Agent - Train & Optimize",
    slug: "ai-agent",
    appRoute: "/apps/ai-agent",
    category: "Core",
    shortDescription: "Train AI on your site and optimize posts automatically.",
    longDescription: "Powerful AI agent that learns from your website content and brand voice, then uses that knowledge to enhance your WordPress posts with SEO optimization, image placement, and content improvements. Train once, optimize forever.",
    mainBenefits: [
      "Train AI on your entire website content",
      "Automatic post enhancement with SEO optimization",
      "Smart image placement and alt tag generation",
      "Brand voice consistency across all content",
      "Internal linking suggestions based on site knowledge"
    ],
    howItWorks: [
      { step: "Train", desc: "Connect your site and let AI learn your content" },
      { step: "Optimize", desc: "Select posts and upload images for enhancement" },
      { step: "Review", desc: "Get detailed reports on improvements made" }
    ],
    planRequired: "Starter",
    status: "LiveTool",
    icon: Brain,
    color: "#8B5CF6"
  },
  {

    id: "ads-analytics",
    name: "AI Ads Analytics Tool",
    slug: "ads-analytics",
    category: "Core",
    shortDescription: "See which ads print money and which ads burn it.",
    longDescription: "Get crystal-clear visibility into your ad performance across Google, Meta, TikTok, and more. Our AI identifies winning creatives, flags underperformers, and provides actionable optimization recommendations.",
    mainBenefits: [
      "Unified dashboard for all ad platforms",
      "AI-powered performance insights",
      "Automatic anomaly detection and alerts",
      "Creative performance scoring",
      "Budget allocation recommendations"
    ],
    howItWorks: [
      { step: "Connect", desc: "Link your ad accounts securely" },
      { step: "Analyze", desc: "AI processes performance data in real-time" },
      { step: "Optimize", desc: "Get actionable recommendations daily" }
    ],
    planRequired: "Growth",
    status: "LiveTool",
    icon: BarChart3,
    color: "#F9AB00"
  },
  {
    id: "lead-crm",
    name: "Lead Capture and CRM Automation",
    slug: "lead-crm",
    category: "Core",
    shortDescription: "Capture leads and push them into your CRM automatically.",
    longDescription: "Never lose a lead again. Automatically capture form submissions, chatbot conversations, and social interactions. Enrich lead data with AI and push qualified prospects directly into your CRM with proper tagging and scoring.",
    mainBenefits: [
      "Zero-friction lead capture across channels",
      "Automatic lead enrichment and scoring",
      "Direct CRM integration (HubSpot, Salesforce, etc.)",
      "Smart lead routing and assignment",
      "Real-time lead notifications"
    ],
    howItWorks: [
      { step: "Capture", desc: "Leads flow in from all your channels" },
      { step: "Enrich", desc: "AI adds data and scores each lead" },
      { step: "Route", desc: "Qualified leads hit your CRM instantly" }
    ],
    planRequired: "Growth",
    status: "LiveTool",
    icon: Users,
    color: "#FF7A59"
  },
  {
    id: "performance-reports",
    name: "Weekly or Monthly Performance Reports",
    slug: "performance-reports",
    category: "Core",
    shortDescription: "Clean reports sent on autopilot.",
    longDescription: "Automated performance reports delivered to your inbox. No more spreadsheet wrangling. Get executive summaries, detailed metrics, and trend analysis for all your marketing channels in beautiful, shareable formats.",
    mainBenefits: [
      "Save hours on manual reporting",
      "Executive-ready PDF reports",
      "Custom branding and white-labeling",
      "Automated email delivery to stakeholders",
      "Historical trend analysis"
    ],
    howItWorks: [
      { step: "Configure", desc: "Choose metrics and report frequency" },
      { step: "Brand", desc: "Add your logo and customize styling" },
      { step: "Automate", desc: "Reports arrive in your inbox on schedule" }
    ],
    planRequired: "Growth",
    status: "LiveTool",
    icon: TrendingUp,
    color: "#4285F4"
  },
  {
    id: "backlink-automation",
    name: "Backlink Outreach Automation",
    slug: "backlink-automation",
    category: "Core",
    shortDescription: "Automate outreach campaigns for backlinks.",
    longDescription: "Build high-quality backlinks at scale. Our AI identifies link opportunities, crafts personalized outreach emails, and manages follow-up sequences. Track responses and measure your domain authority growth.",
    mainBenefits: [
      "Find high-DA link opportunities automatically",
      "AI-personalized outreach at scale",
      "Automated follow-up sequences",
      "Response tracking and analytics",
      "Domain authority monitoring"
    ],
    howItWorks: [
      { step: "Discover", desc: "AI finds relevant link opportunities" },
      { step: "Outreach", desc: "Personalized emails sent automatically" },
      { step: "Track", desc: "Monitor responses and acquired links" }
    ],
    planRequired: "Growth",
    status: "LiveTool",
    icon: Link2,
    color: "#FF6B35"
  },
  {
    id: "reviews-reputation",
    name: "Review Generation and Reputation Manager",
    slug: "reviews-reputation",
    category: "Core",
    shortDescription: "Get more reviews and protect your brand's reputation.",
    longDescription: "Proactively collect customer reviews and manage your online reputation. Automated review requests, sentiment monitoring, and instant alerts when negative feedback appears. Respond faster and maintain a stellar rating.",
    mainBenefits: [
      "3x more customer reviews on autopilot",
      "Real-time reputation monitoring",
      "Instant negative review alerts",
      "Response templates and AI suggestions",
      "Multi-platform review aggregation"
    ],
    howItWorks: [
      { step: "Request", desc: "Automated review requests after purchase" },
      { step: "Monitor", desc: "Track reviews across all platforms" },
      { step: "Respond", desc: "Get alerts and respond instantly" }
    ],
    planRequired: "Growth",
    status: "LiveTool",
    icon: Star,
    color: "#00B67A"
  },
  {
    id: "client-onboarding",
    name: "Client Onboarding Automation",
    slug: "client-onboarding",
    category: "Core",
    shortDescription: "Onboard new clients without lifting a finger.",
    longDescription: "Streamline client onboarding with automated workflows. Collect information, send welcome sequences, grant access to tools, and schedule kickoff calls—all triggered the moment a new client signs up.",
    mainBenefits: [
      "Reduce onboarding time by 80%",
      "Consistent experience for every client",
      "Automated document collection",
      "Welcome sequences and training delivery",
      "Calendar integration for kickoff calls"
    ],
    howItWorks: [
      { step: "Trigger", desc: "New client signup starts the workflow" },
      { step: "Collect", desc: "Forms and docs gathered automatically" },
      { step: "Welcome", desc: "Onboarding emails and access granted" }
    ],
    planRequired: "Growth",
    status: "LiveTool",
    icon: Clock,
    color: "#FFFFFF"
  },
  {
    id: "competitor-monitoring",
    name: "Competitor Monitoring and Alerts",
    slug: "competitor-monitoring",
    category: "Core",
    shortDescription: "Get alerts when your competitors move.",
    longDescription: "Stay ahead of the competition with real-time monitoring. Track competitor websites, social accounts, ad campaigns, and content strategies. Get instant alerts when they launch something new so you can respond fast.",
    mainBenefits: [
      "Real-time competitor tracking",
      "Ad campaign monitoring and alerts",
      "Content and SEO change detection",
      "Social media activity tracking",
      "Weekly competitive intelligence reports"
    ],
    howItWorks: [
      { step: "Add", desc: "Enter your competitors to track" },
      { step: "Monitor", desc: "AI watches for changes 24/7" },
      { step: "Alert", desc: "Get notified when they make moves" }
    ],
    planRequired: "Growth",
    status: "LiveTool",
    icon: Activity,
    color: "#5B45BB"
  }
];

export const corporateTools = [
  {
    id: "mmm-analytics-edge",
    name: "MMM Analytics Edge",
    slug: "mmm-analytics-edge",
    category: "Corporate",
    shortDescription: "Advanced marketing mix modeling and budget allocation.",
    longDescription: "Enterprise-grade marketing mix modeling that reveals true channel contribution. Optimize budget allocation across all channels with AI-powered incrementality analysis and predictive forecasting.",
    mainBenefits: [
      "True cross-channel attribution",
      "AI-powered budget optimization",
      "Incrementality measurement",
      "Predictive performance forecasting",
      "Executive-ready insights"
    ],
    howItWorks: [
      { step: "Integrate", desc: "Connect all marketing data sources" },
      { step: "Model", desc: "AI builds your custom MMM" },
      { step: "Optimize", desc: "Get budget allocation recommendations" }
    ],
    planRequired: "Enterprise",
    status: "LiveTool",
    icon: BarChart3,
    color: "#E1C37A"
  },
  {
    id: "crm-listrak-attentive",
    name: "Listrak and Attentive CRM",
    slug: "crm-listrak-attentive",
    category: "Corporate",
    shortDescription: "Deep integrations with enterprise CRM providers.",
    longDescription: "Seamless two-way sync with Listrak and Attentive. Push enriched customer data, trigger automated campaigns, and unify your customer view across email and SMS marketing platforms.",
    mainBenefits: [
      "Bi-directional data sync",
      "Unified customer profiles",
      "Automated campaign triggers",
      "Advanced segmentation",
      "Real-time event streaming"
    ],
    howItWorks: [
      { step: "Connect", desc: "Authenticate with your CRM accounts" },
      { step: "Sync", desc: "Data flows both directions automatically" },
      { step: "Activate", desc: "Trigger campaigns from any data point" }
    ],
    planRequired: "Enterprise",
    status: "LiveTool",
    icon: Database,
    color: "#00A4E4"
  },
  {
    id: "bazaarvoice",
    name: "Review Syndication Bazaarvoice",
    slug: "bazaarvoice",
    category: "Corporate",
    shortDescription: "Push reviews across major retail and ecom channels.",
    longDescription: "Syndicate your product reviews across the Bazaarvoice network to major retailers and ecommerce platforms. Increase conversion rates and build trust everywhere your products are sold.",
    mainBenefits: [
      "Reach 6,000+ retail sites",
      "Increase conversion rates by 30%+",
      "Automated review syndication",
      "Review analytics and insights",
      "Compliance and moderation tools"
    ],
    howItWorks: [
      { step: "Integrate", desc: "Connect your Bazaarvoice account" },
      { step: "Syndicate", desc: "Reviews pushed to retail partners" },
      { step: "Measure", desc: "Track impact on conversions" }
    ],
    planRequired: "Enterprise",
    status: "LiveTool",
    icon: Star,
    color: "#003366"
  },
  {
    id: "dynamic-yield",
    name: "Website Personalisation Dynamic Yield",
    slug: "dynamic-yield",
    category: "Corporate",
    shortDescription: "Personalised experiences for every visitor.",
    longDescription: "Deliver hyper-personalized website experiences powered by Dynamic Yield. Show different content, offers, and layouts based on visitor behavior, preferences, and real-time context.",
    mainBenefits: [
      "1:1 personalization at scale",
      "AI-powered content recommendations",
      "A/B and multivariate testing",
      "Real-time behavioral targeting",
      "Unified personalization platform"
    ],
    howItWorks: [
      { step: "Implement", desc: "Add Dynamic Yield to your site" },
      { step: "Configure", desc: "Set personalization rules and segments" },
      { step: "Optimize", desc: "AI learns and improves continuously" }
    ],
    planRequired: "Enterprise",
    status: "LiveTool",
    icon: Sparkles,
    color: "#6B4FBB"
  },
  {
    id: "ai-chatbot-skincare",
    name: "AI Chatbot and Skincare Analysis",
    slug: "ai-chatbot-skincare",
    category: "Corporate",
    shortDescription: "Custom internal AI chatbot and analysis engine.",
    longDescription: "Deploy a custom AI chatbot trained on your brand, products, and processes. Includes specialized skincare analysis capabilities for beauty brands with computer vision and personalized recommendations.",
    mainBenefits: [
      "Custom-trained on your data",
      "24/7 customer support automation",
      "Skincare analysis via photo upload",
      "Personalized product recommendations",
      "Seamless handoff to human agents"
    ],
    howItWorks: [
      { step: "Train", desc: "AI learns your brand and products" },
      { step: "Deploy", desc: "Launch on web, app, or social" },
      { step: "Improve", desc: "Bot gets smarter with every conversation" }
    ],
    planRequired: "Enterprise",
    status: "LiveTool",
    icon: Bot,
    color: "#E1C37A"
  },
  {
    id: "ppc-suite",
    name: "PPC Tools Smec and SEMrush and Google Ads",
    slug: "ppc-suite",
    category: "Corporate",
    shortDescription: "Optimize paid search and shopping campaigns.",
    longDescription: "Enterprise PPC management with deep Smec, SEMrush, and Google Ads integration. AI-powered bid optimization, keyword management, and shopping feed optimization in one unified platform.",
    mainBenefits: [
      "Unified PPC command center",
      "AI bid optimization",
      "Shopping feed management",
      "Competitive keyword intelligence",
      "Automated budget pacing"
    ],
    howItWorks: [
      { step: "Connect", desc: "Link your PPC accounts" },
      { step: "Analyze", desc: "AI audits and identifies opportunities" },
      { step: "Optimize", desc: "Automated improvements roll out" }
    ],
    planRequired: "Enterprise",
    status: "LiveTool",
    icon: Target,
    color: "#FF6B00"
  },
  {
    id: "translations-suite",
    name: "Translations Internal plus WriterAI",
    slug: "translations-suite",
    category: "Corporate",
    shortDescription: "Translate and localize content with AI.",
    longDescription: "Professional-grade translation and localization powered by WriterAI. Maintain brand voice across 40+ languages with context-aware translations, glossary management, and translation memory.",
    mainBenefits: [
      "40+ language support",
      "Brand voice preservation",
      "Translation memory and glossaries",
      "Batch content processing",
      "Human review workflow option"
    ],
    howItWorks: [
      { step: "Upload", desc: "Add content for translation" },
      { step: "Translate", desc: "AI processes with brand context" },
      { step: "Review", desc: "Optional human QA before publish" }
    ],
    planRequired: "Enterprise",
    status: "LiveTool",
    icon: Languages,
    color: "#6366F1"
  },
  {
    id: "social-screaming-frog",
    name: "Social Media Scheduling Screaming Frog",
    slug: "social-screaming-frog",
    category: "Corporate",
    shortDescription: "Historical scheduling and crawling insights.",
    longDescription: "Advanced social scheduling with Screaming Frog integration for technical insights. Analyze historical performance, identify technical issues, and optimize your social content strategy with crawl data.",
    mainBenefits: [
      "Historical performance analysis",
      "Technical SEO insights for social",
      "Content gap identification",
      "Cross-platform scheduling",
      "Link health monitoring"
    ],
    howItWorks: [
      { step: "Crawl", desc: "Analyze your content ecosystem" },
      { step: "Schedule", desc: "Plan posts with data-backed timing" },
      { step: "Monitor", desc: "Track technical and social metrics" }
    ],
    planRequired: "Enterprise",
    status: "LiveTool",
    icon: Search,
    color: "#76B82A"
  },
  {
    id: "contentsquare",
    name: "Site Optimisation and Monitoring ContentSquare",
    slug: "contentsquare",
    category: "Corporate",
    shortDescription: "Deep behavior analytics for UX and CRO.",
    longDescription: "Enterprise behavior analytics powered by ContentSquare. Visualize how users interact with your site, identify friction points, and optimize conversion paths with session replays and heatmaps.",
    mainBenefits: [
      "Visual session replays",
      "AI-powered UX insights",
      "Conversion funnel analysis",
      "Revenue impact measurement",
      "Zone-based heatmaps"
    ],
    howItWorks: [
      { step: "Implement", desc: "Add ContentSquare tracking" },
      { step: "Capture", desc: "Behavior data collected automatically" },
      { step: "Analyze", desc: "AI surfaces optimization opportunities" }
    ],
    planRequired: "Enterprise",
    status: "LiveTool",
    icon: Eye,
    color: "#FF5C35"
  },
  {
    id: "paid-social-suite",
    name: "Paid Social All Major Platforms",
    slug: "paid-social-suite",
    category: "Corporate",
    shortDescription: "Plan, analyze, and optimize paid social across platforms.",
    longDescription: "Unified paid social management across Meta, TikTok, LinkedIn, Pinterest, and Snapchat. AI-powered creative testing, audience optimization, and cross-platform budget allocation.",
    mainBenefits: [
      "All platforms in one dashboard",
      "Cross-platform budget optimization",
      "AI creative performance scoring",
      "Audience insight unification",
      "Automated reporting"
    ],
    howItWorks: [
      { step: "Connect", desc: "Link all paid social accounts" },
      { step: "Unify", desc: "See all data in one view" },
      { step: "Optimize", desc: "AI allocates budget across platforms" }
    ],
    planRequired: "Enterprise",
    status: "LiveTool",
    icon: Megaphone,
    color: "#FF0050"
  }
];

export const allTools = [...coreTools, ...corporateTools];

export const getToolBySlug = (slug) => allTools.find(tool => tool.slug === slug);

export const getToolsByCategory = (category) => allTools.filter(tool => tool.category === category);

export const getToolsByPlan = (plan) => {
  const planLevel = PLAN_HIERARCHY[plan] || 0;
  return allTools.filter(tool => PLAN_HIERARCHY[tool.planRequired] <= planLevel);
};