/** The purchasing process, shared by the homepage and How it works. */
export const processSteps = [
  {
    title: "Choose a design or describe your idea.",
    detail: "Start from one of our designs, or from a sentence about what you need.",
  },
  {
    title: "Tell us about your business.",
    detail: "A short online brief. Your progress is saved as you go.",
  },
  {
    title: "Receive a clear scope and price.",
    detail: "In writing, with what’s included and what isn’t. No surprises later.",
  },
  {
    title: "We build your website.",
    detail: "Built to the agreed scope. Send content whenever it suits you.",
  },
  {
    title: "Review, approve, and launch.",
    detail: "Request changes, approve when it’s right, and go live.",
  },
] as const;

/**
 * The same five steps in depth, for How it works: what each step looks like
 * when starting from a design, and when starting from custom work.
 * Keep this to what is decided; timelines and payment terms are not yet.
 */
export const processPaths = [
  {
    design:
      "Browse the collection, open each design full screen as a visitor would, and choose the one that suits your business.",
    custom:
      "Describe what you want your website to do, in a sentence or in detail. Pick from common functions, or start from scratch.",
  },
  {
    design:
      "The brief asks for your business name and category, contact details, any existing website, the pages you need, your logo and brand assets, preferred colours, what content and images you have, whether you own a domain, and anything else we should know.",
    custom:
      "The brief asks what you want built, the functionality you need, who will use it, the software it must work with, a budget range and your timeline.",
  },
  {
    design:
      "You receive a written scope and price: from $999 CAD for a customised design of up to five pages, with anything beyond the base listed separately. Approving it, with a 50% deposit, confirms the project.",
    custom:
      "Custom work is priced individually. If anything is unclear, the questions arrive in writing. The scope sets out what will be built, what will not, the price and the timeline. Approving it, with a 50% deposit, confirms the project.",
  },
  {
    design:
      "Your chosen design is customised and developed to the agreed scope, responsive on every screen size. It typically takes about 2–3 weeks, counted from the approved scope and all content being received.",
    custom:
      "Work proceeds in the agreed stages, each ending with something you can try and review before the next begins.",
  },
  {
    design:
      "Request changes, with five rounds of revisions included. Approve when it’s right, pay the remaining 50%, and we assist with deployment.",
    custom:
      "Review each stage, request changes and approve. The remaining 50% is paid before anything goes live.",
  },
] as const;

/** How the process runs without meetings. */
export const inWriting = [
  { title: "Your brief", detail: "Written online, at your pace. Progress is saved as you go." },
  { title: "Our questions", detail: "Sent in writing, answered whenever it suits you." },
  { title: "Your scope and price", detail: "A written document, approved before work begins." },
  { title: "Your feedback", detail: "Revision requests and approval, in writing." },
] as const;
