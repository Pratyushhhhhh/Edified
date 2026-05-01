/*
  seed.js — fills MongoDB with realistic story data for development.

  Run with:  node seed.js

  Each story now has:
  - summary as a [String] array (3 bullet points for the contrast page)
  - imageUrl for the hero image
  - articles with author, imageUrl, biasLabel, biasScore
  - coverSource matching one of the article sources
*/

require("dotenv").config();
const mongoose = require("mongoose");
const Story = require("./models/story");
const connectDB = require("./config/db");

const sampleStories = [
  {
    headline: "India and Pakistan Exchange Fire Along Line of Control",
    summary: [
      // summary[0] — shown as bullet point 1 on contrast page
      "Both armies confirmed exchanges of fire in the Poonch sector early Tuesday, with each side attributing provocation to the other.",
      // summary[1] — bullet point 2
      "Diplomatic channels remain formally open, but three ambassadorial meetings scheduled for the week have been quietly postponed.",
      // summary[2] — bullet point 3
      "The UN Security Council has called an emergency session, with China and the US issuing competing statements on restraint.",
    ],
    category: "world",
    tags: ["India", "Pakistan", "Kashmir", "LoC"],
    // imageUrl — the hero image shown top-left on the contrast page
    imageUrl: "https://images.unsplash.com/photo-1579820010410-c10411aaaa88?w=900&q=80",
    coverSource: "Reuters",
    articles: [
      {
        title: "Indian Army Reports Pakistani Firing Along LoC in Poonch",
        url: "https://reuters.com/india-pakistan-loc-1",
        source: "Reuters",
        author: "Devjyot Ghoshal",
        snippet: "Indian army officials confirmed an exchange of fire in the Poonch sector early Tuesday, with at least two soldiers reported injured.",
        publishedAt: new Date("2025-03-20T06:30:00Z"),
        biasLabel: "center",
        biasScore: 0.0,
        imageUrl: "https://images.unsplash.com/photo-1579820010410-c10411aaaa88?w=600&q=80",
      },
      {
        title: "Pakistan ISPR Denies Initiating Firing, Blames Indian Provocation",
        url: "https://dawn.com/india-pakistan-loc-2",
        source: "Dawn",
        author: "Baqir Sajjad Syed",
        snippet: "Pakistan's military media wing released a statement rejecting Indian claims, saying its forces responded only after unprovoked shelling.",
        publishedAt: new Date("2025-03-20T08:15:00Z"),
        biasLabel: "center-right",
        biasScore: 0.3,
        imageUrl: "",
      },
      {
        title: "UN Calls for Immediate De-escalation on Kashmir Border",
        url: "https://aljazeera.com/india-pakistan-loc-3",
        source: "Al Jazeera",
        author: "Asad Hashim",
        snippet: "A UN spokesperson urged both nuclear-armed neighbours to exercise maximum restraint and return to the Simla Agreement framework.",
        publishedAt: new Date("2025-03-20T11:00:00Z"),
        biasLabel: "center-left",
        biasScore: -0.2,
        imageUrl: "",
      },
      {
        title: "Kashmir Firing: What We Know So Far",
        url: "https://bbc.com/india-pakistan-loc-4",
        source: "BBC News",
        author: "Vikas Pandey",
        snippet: "A factual timeline of Tuesday's events along the Line of Control, drawing on statements from both defence ministries.",
        publishedAt: new Date("2025-03-20T13:30:00Z"),
        biasLabel: "center",
        biasScore: 0.05,
        imageUrl: "",
      },
    ],
  },

  {
    headline: "RBI Holds Repo Rate at 6.5% Amid Inflation Concerns",
    summary: [
      "The Reserve Bank of India's MPC voted 5-1 to hold rates for the sixth consecutive meeting, citing food inflation remaining above the 6% tolerance band.",
      "Governor Das signalled that cuts remain on the table for H2 2025 if monsoon patterns normalise and global commodity prices ease.",
      "Markets rallied on the predictable outcome, with the Sensex closing up 412 points, while bond yields dipped 4 basis points.",
    ],
    category: "business",
    tags: ["RBI", "repo rate", "inflation", "monetary policy", "India"],
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&q=80",
    coverSource: "The Hindu",
    articles: [
      {
        title: "RBI MPC Keeps Repo Rate Unchanged at 6.5%, Stance Unchanged",
        url: "https://thehindu.com/rbi-repo-1",
        source: "The Hindu",
        author: "Radhika Merwin",
        snippet: "Governor Shaktikanta Das said the committee remains resolutely focused on the 4% inflation target, with no immediate pivot in sight.",
        publishedAt: new Date("2025-03-19T10:00:00Z"),
        biasLabel: "center",
        biasScore: 0.0,
        imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80",
      },
      {
        title: "Markets Cheer RBI Status Quo; Sensex Rises 400 Points",
        url: "https://economictimes.com/rbi-repo-2",
        source: "Economic Times",
        author: "Sanam Mirchandani",
        snippet: "Benchmark indices rallied as investors welcomed the predictable policy stance, with rate-sensitive banking stocks leading the charge.",
        publishedAt: new Date("2025-03-19T12:30:00Z"),
        biasLabel: "center-right",
        biasScore: 0.25,
        imageUrl: "",
      },
      {
        title: "Critics Say RBI Is Too Cautious; Rate Cut Needed to Spur Growth",
        url: "https://thewire.com/rbi-repo-3",
        source: "The Wire",
        author: "Puja Mehra",
        snippet: "Several economists argue the central bank is prioritising inflation optics over real growth at a moment when household demand is visibly weak.",
        publishedAt: new Date("2025-03-19T15:00:00Z"),
        biasLabel: "left",
        biasScore: -0.5,
        imageUrl: "",
      },
    ],
  },

  {
    headline: "OpenAI Releases GPT-5 With Multimodal Reasoning Capabilities",
    summary: [
      "GPT-5 launches with native video input, a 1-million token context window, and benchmark scores that surpass all existing public models on MMLU, coding, and graduate-level reasoning.",
      "Several former OpenAI safety researchers have publicly questioned whether internal red-teaming was cut short before release, raising concerns about deployment pace.",
      "Google, Anthropic, and Meta are each expected to respond with model releases within the next 60 days, intensifying what analysts are calling an accelerationist phase in AI development.",
    ],
    category: "technology",
    tags: ["OpenAI", "GPT-5", "AI", "LLM", "safety"],
    imageUrl: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=900&q=80",
    coverSource: "The Verge",
    articles: [
      {
        title: "GPT-5 Is Here: What's New and How to Access It",
        url: "https://theverge.com/gpt5-1",
        source: "The Verge",
        author: "Nilay Patel",
        snippet: "OpenAI's GPT-5 launches today with native video input and a 1M token context window — the biggest capability jump since GPT-4.",
        publishedAt: new Date("2025-03-18T09:00:00Z"),
        biasLabel: "center",
        biasScore: 0.0,
        imageUrl: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80",
      },
      {
        title: "GPT-5 Benchmarks: Dominates on MMLU, Coding, and Math",
        url: "https://techcrunch.com/gpt5-2",
        source: "TechCrunch",
        author: "Kyle Wiggers",
        snippet: "Early evals show GPT-5 outperforming all existing public models across standard benchmarks — a 15-point MMLU jump over GPT-4 Turbo.",
        publishedAt: new Date("2025-03-18T11:00:00Z"),
        biasLabel: "center",
        biasScore: 0.1,
        imageUrl: "",
      },
      {
        title: "AI Safety Researchers Warn GPT-5 Release Was Rushed",
        url: "https://wired.com/gpt5-3",
        source: "Wired",
        author: "Will Knight",
        snippet: "Three former OpenAI employees say internal red-teaming was cut short under commercial pressure, with key adversarial test suites left incomplete.",
        publishedAt: new Date("2025-03-18T16:00:00Z"),
        biasLabel: "center-left",
        biasScore: -0.15,
        imageUrl: "",
      },
      {
        title: "What GPT-5 Means for Every Knowledge Worker",
        url: "https://fortune.com/gpt5-4",
        source: "Fortune",
        author: "Jeremy Kahn",
        snippet: "From lawyers to radiologists, GPT-5's expanded context and reasoning could automate tasks that were considered safe from AI just two years ago.",
        publishedAt: new Date("2025-03-18T18:30:00Z"),
        biasLabel: "center-right",
        biasScore: 0.2,
        imageUrl: "",
      },
    ],
  },
];

const seed = async () => {
  await connectDB();
  await Story.deleteMany({});
  console.log("✓ Cleared existing stories");

  const created = await Story.insertMany(sampleStories);
  console.log(`✓ Seeded ${created.length} stories`);

  // Print the IDs so you can test the contrast endpoint immediately
  created.forEach((s) => {
    console.log(`  /api/contrast/${s._id}  →  "${s.headline.slice(0, 50)}..."`);
  });

  mongoose.disconnect();
  console.log("✓ Done");
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});