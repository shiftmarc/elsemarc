/**
 * Frequently asked questions, grouped. Answers state only what is already
 * decided and published elsewhere on the site. Where an answer depends on a
 * policy not yet set, `tbc` describes what needs confirming and the page shows
 * a visible "To be confirmed" placeholder. Before launch, no `tbc` should remain.
 */

export type FaqItem = {
  id: string;
  question: string;
  /** Paragraphs of the answer. May be empty when the whole answer is to be confirmed. */
  answer: string[];
  links?: { label: string; href: string }[];
  /** What the business still needs to decide for this answer. */
  tbc?: string;
};

export type FaqGroup = { id: string; title: string; items: FaqItem[] };

export const faqGroups: FaqGroup[] = [
  {
    id: "process",
    title: "Process",
    items: [
      {
        id: "how-it-works",
        question: "How does it work?",
        answer: [
          "Five steps: choose a design or describe your idea, tell us about your business, receive a clear scope and price, we build your website, then you review, approve and launch.",
        ],
        links: [{ label: "How it works, step by step", href: "/how-it-works" }],
      },
      {
        id: "meetings",
        question: "Do I need to have a call or a meeting?",
        answer: [
          "No. The whole process is designed to be completed online, at your pace. Your brief is written online, any questions we have are sent in writing, and your scope, feedback and approval are all in writing too.",
        ],
      },
      {
        id: "what-you-need",
        question: "What will you need from me?",
        answer: [
          "For a website: your chosen design, business name and category, contact details, any existing website, the pages you want, your logo and brand assets, preferred colours, what content and images you have, whether you own a domain, and any additional requirements.",
          "For custom work: a description of the project, the functionality you need, who will use it, the software it must work with, a budget range and your timeline.",
          "Your progress is saved as you go, so you don’t need everything at once.",
        ],
      },
      {
        id: "commitment",
        question: "Does choosing a design or sending a brief commit me to anything?",
        answer: [
          "No. You receive a written scope and price first, and nothing is built until you approve it. Approving the scope, with a 50% deposit, is what confirms the project.",
        ],
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing and payment",
    items: [
      {
        id: "website-price",
        question: "How much does a website cost?",
        answer: [
          "Websites start from $999 CAD. That includes professional customisation of a selected design, up to five pages, mobile-responsive development, basic SEO, a contact form, five rounds of revisions and deployment assistance.",
        ],
        links: [{ label: "Full pricing", href: "/pricing" }],
      },
      {
        id: "why-from",
        question: "Why “from”? What would make it cost more?",
        answer: [
          "The base price covers everything listed above. Custom features, third-party service charges, domain registration and extensive additional work, such as more than five pages, are not included. Anything outside the base is quoted clearly before you commit.",
        ],
      },
      {
        id: "custom-price",
        question: "How is custom development priced?",
        answer: [
          "Individually. Every custom project starts from a written brief and ends in a written scope with its price. What shapes the price includes how many kinds of user it serves, the number of screens and steps, the software it connects to, and anything involving payments or personal data.",
        ],
        links: [{ label: "Custom development", href: "/custom#pricing" }],
      },
      {
        id: "ongoing-costs",
        question: "Are there any ongoing costs?",
        answer: [
          "An optional website care plan starts from $59 CAD a month, with hosting included. Without the care plan, you pay any hosting costs directly to your hosting provider.",
          "Separately, your domain renews with its registrar, and any third-party services you use, such as a booking or payment provider, charge their own fees.",
        ],
      },
      {
        id: "payment-schedule",
        question: "When and how do I pay?",
        answer: [
          "In two parts: a 50% deposit when you approve the written scope, and the remaining 50% before your site goes live. Both are paid by card through a secure online payment.",
        ],
      },
      {
        id: "refunds",
        question: "What is your refund policy?",
        answer: [
          "Your deposit is fully refundable until design work begins. Once work has begun, the deposit is non-refundable, and the work completed so far is delivered to you.",
        ],
      },
    ],
  },
  {
    id: "design",
    title: "Design",
    items: [
      {
        id: "demos",
        question: "Are the websites in the collection real businesses?",
        answer: [
          "No. They are demonstration concepts for fictional businesses, designed to show what each design can become. They are not client work.",
        ],
        links: [{ label: "The collection", href: "/websites" }],
      },
      {
        id: "customise",
        question: "How much of a design can be changed?",
        answer: [
          "Every website includes professional customisation of the selected design: your name, words, images and colours, set into it with care. Substantial changes beyond that count as additional work and are quoted before you commit.",
        ],
      },
      {
        id: "mobile",
        question: "Will my website work on phones and tablets?",
        answer: ["Yes. Mobile-responsive development is included in every website."],
      },
      {
        id: "exclusive",
        question: "Could another business end up with the same design?",
        answer: [
          "Yes. Designs are not exclusive, so more than one business can start from the same design. Every website is customised with its own name, content, colours and images.",
        ],
      },
      {
        id: "no-fit",
        question: "What if none of the designs suit my business?",
        answer: [
          "Describe what you need instead. Custom work is scoped and priced individually, from a written brief.",
        ],
        links: [{ label: "Describe your idea", href: "/start" }],
      },
    ],
  },
  {
    id: "content",
    title: "Content",
    items: [
      {
        id: "provide-content",
        question: "Do I need to provide the text and images?",
        answer: [
          "The brief asks what content and images you already have, along with your logo and brand assets.",
        ],
        tbc: "Whether writing, editing or sourcing images is offered, and at what cost, when a customer doesn’t have content.",
      },
      {
        id: "content-later",
        question: "Can I send content later?",
        answer: [
          "Yes. Send content whenever it suits you. The typical timeline for a website is counted from when all of your content has been received.",
        ],
      },
    ],
  },
  {
    id: "revisions",
    title: "Revisions",
    items: [
      {
        id: "how-many",
        question: "How many revisions are included?",
        answer: ["Five rounds of revisions are included with every website."],
      },
      {
        id: "what-is-a-round",
        question: "What counts as a round of revisions?",
        answer: [
          "One round is a single, consolidated list of changes within the agreed scope, sent together.",
        ],
      },
      {
        id: "after-revisions",
        question: "What happens if I need more changes after five rounds?",
        answer: ["Additional rounds are quoted on request."],
      },
    ],
  },
  {
    id: "timelines",
    title: "Timelines",
    items: [
      {
        id: "website-time",
        question: "How long does a website take?",
        answer: [
          "A standard website typically takes about 2–3 weeks, counted from the approved scope and all of your content being received.",
        ],
      },
      {
        id: "custom-time",
        question: "How long does custom work take?",
        answer: [
          "It depends on the project. Your written scope sets out the timeline along with the price, before anything begins.",
        ],
      },
      {
        id: "deadline",
        question: "I have a deadline. Can you work to it?",
        answer: [
          "Include it in your brief. How quickly something needs to be ready is one of the things that shapes a custom project, and your scope will say what is possible.",
        ],
      },
    ],
  },
  {
    id: "ownership",
    title: "Ownership and hosting",
    items: [
      {
        id: "who-owns",
        question: "Who owns the website once it’s finished?",
        answer: [
          "Once it is paid in full, you own your content and the finished website, and you are free to move it.",
          "We keep the right to reuse the underlying design and components in other projects.",
        ],
      },
      {
        id: "transfer",
        question: "Can I move my website somewhere else later?",
        answer: [
          "Yes, to another host or another developer. On request, you receive your website’s files and the access you need.",
        ],
      },
      {
        id: "hosting",
        question: "Where is my website hosted, and what does hosting cost?",
        answer: [
          "With the care plan, we host your website and hosting is included in the plan.",
          "Without the care plan, your website is transferred at launch to a hosting account in your name, and you pay any hosting costs directly to that provider.",
        ],
      },
      {
        id: "domain",
        question: "Do I need my own domain?",
        answer: [
          "Domain registration is not included in the website price. If you already own a domain, tell us in your brief.",
        ],
      },
    ],
  },
  {
    id: "after-launch",
    title: "After launch",
    items: [
      {
        id: "changes",
        question: "Can I make changes after my website launches?",
        answer: [
          "The optional care plan covers small changes, along with hosting, updates and monitoring. Larger changes can be quoted separately.",
        ],
        tbc: "Exactly which changes the care plan covers, and its monthly limits.",
      },
      {
        id: "care-plan",
        question: "What does the care plan include?",
        answer: [
          "Hosting, updates, monitoring and small changes, from $59 CAD a month. Specific inclusions and limits will be published before launch.",
        ],
        tbc: "The care plan’s specific inclusions and monthly limits.",
      },
      {
        id: "cancel-care",
        question: "Can I cancel the care plan?",
        answer: [],
        tbc: "Care plan commitment period and cancellation terms.",
      },
      {
        id: "add-features",
        question: "Can I add features later?",
        answer: [
          "Yes. New functionality, such as bookings or payments, is custom development, scoped and priced separately in the same way.",
        ],
        links: [{ label: "Custom development", href: "/custom" }],
      },
    ],
  },
];
