export const REACTIONS_TO_TEXT = [
  {
    trigger: /\b(however|moreover|furthermore|nevertheless)\b/i,
    response: "Ooh, fancy transition word! Someone's trying to sound smart. It's working... barely.",
    cooldown: 30000
  },
  {
    trigger: /\b(I think|I believe|in my opinion)\b/i,
    response: "Hot take alert! 🔥 Your professor wants EVIDENCE, not feelings!",
    cooldown: 25000
  },
  {
    trigger: /\b(very|really|extremely|totally)\b/i,
    response: "Intensifier detected! Your writing professor just felt a disturbance in the Force.",
    cooldown: 35000
  },
  {
    trigger: /\b(good|nice|great|awesome)\b/i,
    response: "Adjective game: weak. Try 'resplendent', 'magnificent', or 'not terrible'.",
    cooldown: 30000
  },
  {
    trigger: /\b(lol|lmao|haha|omg)\b/i,
    response: "Is this... is this an academic paper? Because LOL is not a citation format. Yet.",
    cooldown: 20000
  },
  {
    trigger: /\b(thesis|argument|claim)\b/i,
    response: "A thesis! How ambitious. Does it have supporting evidence, or is it more of a vibe?",
    cooldown: 40000
  },
  {
    trigger: /\.\.\./g,
    response: "Ellipsis detected... Are you being dramatic... or just unsure... I relate...",
    cooldown: 25000
  },
  {
    trigger: /!{2,}/g,
    response: "Multiple exclamation marks!! The sign of a truly!! unhinged!! mind!!",
    cooldown: 30000
  },
  {
    trigger: /\b(sorry|apologize|apologies)\b/i,
    response: "Why are you apologizing in an essay? This isn't a text to your ex.",
    cooldown: 35000
  },
  {
    trigger: /\b(basically|essentially|literally)\b/i,
    response: "You said 'basically' which basically means you're about to oversimplify. Basically.",
    cooldown: 25000
  },
  {
    trigger: /\b(the research shows|studies indicate|according to)\b/i,
    response: "Oh look, actual citations! I'm genuinely impressed. Still gonna check if you made them up though.",
    cooldown: 40000
  },
  {
    trigger: /\b(in conclusion|to conclude|in summary)\b/i,
    response: "Finally wrapping this up? Or are you pulling the classic fake-out conclusion at 60% through?",
    cooldown: 35000
  },
  {
    trigger: /^(The |This |That )/m,
    response: "Starting another sentence with 'The'? Variety is the spice of life, my friend.",
    cooldown: 50000
  },
  {
    trigger: /\b(will discuss|will explore|will examine)\b/i,
    response: "Will you though? Or is this one of those promises you won't keep, like 'I'll start early next time'?",
    cooldown: 30000
  },
  {
    trigger: /\b(firstly|secondly|thirdly)\b/i,
    response: "Ooh, numbered points! Very organized. Let's see if you remember what 'fourthly' was gonna be.",
    cooldown: 40000
  },
  {
    trigger: /\b(significant|important|crucial|critical)\b/i,
    response: "Everything can't be 'significant'. Pick your battles. This isn't a Marvel movie.",
    cooldown: 30000
  },
  {
    trigger: /\b(always|never|everyone|nobody)\b/i,
    response: "Absolute statements? Bold. Dangerously bold. One counterexample and your whole argument crumbles.",
    cooldown: 35000
  },
  {
    trigger: /\?{2,}/g,
    response: "Multiple question marks??? Are you writing an essay??? Or a panicked text message???",
    cooldown: 25000
  },
  {
    trigger: /\b(obviously|clearly|evidently)\b/i,
    response: "If it were THAT obvious, you wouldn't need to write 10 pages about it, would you?",
    cooldown: 30000
  },
  {
    trigger: /\b(\d+)%/i,
    response: "Statistics! Fancy. Did you cite the source, or are we just vibing with numbers?",
    cooldown: 35000
  },
  {
    trigger: /\b(research paper|essay|assignment)\b/i,
    response: "Self-aware that this is an assignment? Meta. Still needs work though.",
    cooldown: 45000
  },
  {
    trigger: /\b(impact|effect|influence)\b/i,
    response: "Ooh, talking about causation! Make sure you're not confusing correlation and causation. Please.",
    cooldown: 35000
  },
];
