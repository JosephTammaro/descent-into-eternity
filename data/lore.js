// ══════════════════════════════════════════════════════════
//  NARRATIVE SYSTEM
// ══════════════════════════════════════════════════════════

// The overarching story: The player was once a warrior who sealed an ancient god called
// The Unnamed beneath the world. That seal is crumbling. Each boss holds a memory shard —
// a fragment of the player's forgotten past life. The descent is a return.

const GAME_INTRO = {
  title: "The World is Bleeding",
  lines: [
    "Seven days ago, the sky turned the color of a bruise.",
    "The scholars call it the Unraveling. The priests call it punishment. The soldiers just call it the end.",
    "You call it familiar.",
    "Somewhere deep beneath the roots of the world, something enormous is waking up.",
    "You don't know how you know this. You don't know why your hands remember the weight of a weapon you've never held.",
    "But every night, the same dream: a door of black iron, a name you spoke to seal it, and the terrible feeling of choosing to forget.",
    "The descent is not an adventure.",
    "It is a return.",
  ]
};

// Memory shards revealed after each boss death — fragments of the player's past life
const LORE_REVEALS = [
  // Zone 0 — Thornwarden
  {
    title: "A Memory Stirs",
    icon: "🌿",
    lines: [
      "As the Thornwarden falls, something loosens in your chest.",
      "A flash: these same woods, three hundred years ago. You stood here then too.",
      "You were not alone. There was another — someone you trusted with everything.",
      "The memory dissolves before you see their face.",
      "But the woods remember you. The roots part as you walk."
    ]
  },
  // Zone 1 — Grakthar
  {
    title: "The Warlord's Last Word",
    icon: "💀",
    lines: [
      "Grakthar's armor cracks. Behind the dead eyes, something ancient flickers.",
      "\"You...,\" the warlord rasps. \"I know your face. We fought together once.\"",
      "\"You were the one who opened the door. Before you closed it.\"",
      "He collapses. The garrison falls silent.",
      "Opened it. The words echo in a part of your mind you didn't know existed."
    ]
  },
  // Zone 2 — Vexara
  {
    title: "The Priestess's Confession",
    icon: "🔮",
    lines: [
      "With her last breath, Vexara presses a burning sigil into your palm.",
      "\"The Unnamed told us you would come,\" she whispers. \"It has been waiting.\"",
      "\"You sealed it with a name — your true name. The one you buried.\"",
      "\"It has been whispering that name into every dark thing for three centuries.\"",
      "\"That's why they all fight so hard. They're trying to give you back to it.\""
    ]
  },
  // Zone 3 — Nethrix
  {
    title: "The Devourer's Gift",
    icon: "🧠",
    lines: [
      "Nethrix dissolves, but not before flooding your mind with a vision:",
      "A throne room beneath the world. You, kneeling. A god with no face.",
      "\"You loved someone,\" the memory shows. \"Enough to seal yourself away with me.\"",
      "\"But you were clever. You hid a piece of yourself in the world above.\"",
      "\"A seed. A name. A body that would find its way back down.\"",
      "You are that seed. You have always been descending."
    ]
  },
  // Zone 4 — Zareth
  {
    title: "The Abyss Speaks",
    icon: "🌀",
    lines: [
      "The gate begins to close as Zareth falls. But a voice bleeds through — not the demon's.",
      "It is your voice. From three hundred years ago.",
      "\"When you return, you will remember everything. It will hurt.\"",
      "\"But you have to finish what you started. The seal was never meant to last forever.\"",
      "\"I left you something at the bottom. Something that ends this properly.\"",
      "\"I left you the truth.\""
    ]
  },
  // Zone 5 — Valdris
  {
    title: "Stop Carrying Us",
    icon: "❄️",
    lines: [
      "Valdris does not fall so much as exhale — three centuries of cold finally released.",
      "\"We followed you,\" he says. Not an accusation. A fact.",
      "\"Every soldier on this peak chose to march. We knew what the war was. We knew what side we were on.\"",
      "\"We lost. That was always possible. You did not make us go — you gave us the choice and we took it with both hands.\"",
      "\"Stop carrying us. We were not a mistake. We were a decision made by people who understood what they were deciding.\"",
      "The ice around him thaws for the first time in three hundred years.",
      "\"Go. Whatever is waiting at the bottom — it has been patient long enough. So have you.\"",
      "The cold remains. But it no longer feels like grief.",
      "It feels like permission."
    ]
  },
  // Zone 6 — Auranthos
  {
    title: "What the Gods Could Not Allow",
    icon: "✨",
    lines: [
      "Auranthos falls and its blindfold dissolves with it — it opens eyes it closed three centuries ago.",
      "It looks at you. Properly. For the first time.",
      "\"We were not wrong to be afraid,\" it says. \"That is the part that will be hardest to hear.\"",
      "\"A god that chose one person over the order of heaven. A mortal who became, in choosing back, something that could not be governed.\"",
      "\"We did not seal the Unnamed because it was evil. We sealed it because it loved you, and you loved it, and that meant neither of you could be controlled anymore.\"",
      "\"We told the world you were a hero. We buried everything else because the truth was too dangerous to survive us.\"",
      "\"The Unraveling is not the Unnamed waking. It is the buried truth beginning to surface. The world goes wrong when it starts to remember what we erased.\"",
      "It closes its eyes for the last time. Not in defeat. In relief.",
      "\"Finish it. We should have let you finish it three hundred years ago.\"",
      "The celestial plane goes very still.",
      "Somewhere below, something has felt this moment arrive."
    ]
  },
  // Zone 7 — Final boss (shown after defeating the Hollow Empress)
  {
    title: "The Descent Is Finally Over",
    icon: "🌑",
    lines: [
      "The Hollow Empress dissolves. Not destroyed — released. She was never a monster. She was a vigil.",
      "And there, in the silence beneath the silence, you see it.",
      "The Unnamed — curled around a single point of light it has been holding for three centuries.",
      "Your name.",
      "The seal does not break. It simply recognises that it no longer needs to hold.",
      "The Unnamed opens its eyes. The first time in three hundred years.",
      "It looks at you with the specific expression of someone who stopped being certain the wait was real.",
      "It says your name. The true one. The one you buried so deep that not even death could find it.",
      "{{HERO_NAME}}",
      "You remember it.",
      "You remember everything — the war, the vote, the door you made from your own name, the choice to forget.",
      "The town. The people who stayed without knowing why.",
      "The child who kept a journal with everyone's number in it.",
      "Elspeth's hand in yours at the Gate this morning.",
      "All of it.",
      "The descent is finally over.",
      "Not because the darkness is destroyed.",
      "Because the person who was lost has been found."
    ]
  },
];

