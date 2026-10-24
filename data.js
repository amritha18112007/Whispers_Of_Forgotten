// 1. CLASSES

class World {
  constructor ({
    id,
    name,
    startingLocationId,
    locationIds,
    unlockRequirement = null
  }) {
    Object.assign(this, {
      id,
      name,
      startingLocationId,
      locationIds,
      unlockRequirement
    })
  }
}
class Location {
  constructor ({
    id,
    worldId,
    name,
    firstVisit = [],
    revisit = [],
    npcName = null,
    npcId = null,
    dialogue = [],
    enemyName = null,
    enemyId = null,
    itemName = null,
    itemId = null,
    itemSource = 'search',
    hasCompanion = false,
    companionId = null,
    companionLose = [],
    companionLoseId = null,
    lock = null,
    search = [],
    objective = [],
    enemyReward = [],
    searchReward = [],
    nextObjective = [],
    unlockText = [],
    nextLocationIds = [],
    choiceIds = []
  }) {
    Object.assign(this, {
      id,
      worldId,
      name,
      firstVisit,
      revisit,
      npcName,
      npcId,
      dialogue,
      enemyName,
      enemyId,
      itemName,
      itemId,
      itemSource,
      hasCompanion,
      companionId,
      companionLose,
      companionLoseId,
      lock,
      search,
      objective,
      enemyReward,
      searchReward,
      nextObjective,
      unlockText,
      nextLocationIds,
      choiceIds
    })
  }
}
class Choice {
  constructor ({
    id,
    text,
    type,
    nextLocationId = null,
    requirements = [],
    effects = [],
    lockedText = null,
    locationId = null
  }) {
    Object.assign(this, {
      id,
      text,
      type,
      nextLocationId,
      requirements,
      effects,
      lockedText,
      locationId
    })
  }
}
class Item {
  constructor (data) {
    Object.assign(this, {
      id: data.id,
      name: data.name,
      description: data.description || [],
      type: data.type || 'story',
      effect: data.effect || null,
      lore: data.lore || '',
      purpose: data.purpose || '',
      usageInstructions: data.usageInstructions || '',
      rules: data.rules || 'retained'
    })
  }
}
class Enemy {
  constructor ({
    id,
    name,
    health = null,
    damage = null,
    abilities = [],
    rewardText = []
  }) {
    Object.assign(this, { id, name, health, damage, abilities, rewardText })
  }
}
class Companion {
  constructor ({ id, name, ability = [], recruitmentText = [] }) {
    Object.assign(this, { id, name, ability, recruitmentText })
  }
}
class NPC {
  constructor ({ id, name }) {
    Object.assign(this, { id, name })
  }
}

// 2. WORLD DEFINITIONS

const worldData = {
  elderwood: {
    name: 'Elderwood Forest',
    startingLocationId: 'W1P1',
    locationIds: ['W1P1', 'W1P2', 'W1P3', 'W1P4', 'W1P5', 'W1P6', 'W1P7'],
    unlockRequirement: null
  },
  aranu: {
    name: 'Sands of Aranu',
    startingLocationId: 'W2P1',
    locationIds: ['W2P1', 'W2P2', 'W2P3', 'W2P4', 'W2P5', 'W2P6', 'W2P7'],
    unlockRequirement: { completedWorldId: 'elderwood' }
  },
  frostfell: {
    name: 'Frostfell Peaks',
    startingLocationId: 'W3P1',
    locationIds: ['W3P1', 'W3P2', 'W3P3', 'W3P4', 'W3P5', 'W3P6', 'W3P7'],
    unlockRequirement: { completedWorldId: 'aranu' }
  }
}

// 3. ITEMS - REDESIGNED FOR ACTIVE GAMEPLAY

const itemData = {
  'rusty-lantern': {
    name: 'Rusty Lantern',
    description: [
      'A sturdy iron lantern recovered from near the village well. When lit, its beam pierces supernatural darkness.'
    ],
    lore: 'Carried by night-watchmen before the whispers fell over Elderwood. Its flame burns with banishing warmth.',
    purpose:
      'Illuminates pitch-black caves and deep forests to reveal hidden paths, and blinds shadow foes in combat.',
    usageInstructions:
      'Use in dark locations to reveal paths, or activate during battle to shatter enemy guard and expose weak points.',
    type: 'tool',
    rules: 'retained'
  },
  'waterlogged-diary-page': {
    name: 'Waterlogged Diary Page',
    description: [
      'A damp, torn diary page detailing the sacred elemental flow required to unlock the Ancient Shrine.'
    ],
    lore: 'Written by an ancient ritualist before the goblin invasion swallowed the lower sanctums.',
    purpose:
      'Provides the elemental sequence required to solve the Ancient Shrine Riddle.',
    usageInstructions:
      'Read in your inventory to decipher the clue, then enter the sequence at the Ancient Shrine.',
    type: 'clue',
    rules: 'retained'
  },
  'iron-key': {
    name: 'Iron Key',
    description: ['A heavy, cold iron key forged with old blacksmith runes.'],
    lore: 'Crafted to secure the sealed passage of the Hidden Cave against wild beasts.',
    purpose:
      'Unlocks the rusted iron grate barring entry into the Hidden Cave.',
    usageInstructions:
      'Select in your inventory and click Use when facing the Hidden Cave grate.',
    type: 'key',
    rules: 'reusable'
  },
  'ancient-symbol-stone': {
    name: 'Ancient Symbol Stone',
    description: ['A smooth river stone etched with glowing geometric runes.'],
    lore: "A sacred key-stone left behind by shrine guardians to seal the king's descent.",
    purpose:
      'Slots into the pedestal at the Ancient Shrine once the riddle is solved to open the way to the Goblin King.',
    usageInstructions:
      'Solve the Shrine Riddle first, then use this stone at the pedestal to open the descent.',
    type: 'key',
    rules: 'reusable'
  },
  'healing-potion': {
    name: 'Healing Potion',
    description: [
      'A glass vial filled with glowing crimson draught smelling of wild mint and mountain springwater.'
    ],
    lore: 'Brewed by forest herbalists to knit flesh and restore lost stamina.',
    purpose: 'Restores 35 health points when wounded in exploration or combat.',
    usageInstructions:
      'Select in inventory or choose Use Item in combat whenever your health is below maximum.',
    type: 'consumable',
    effect: 'heal',
    rules: 'consumed'
  },
  'the-green-crystal': {
    name: 'The Green Crystal',
    description: [
      'A pulsating emerald crystal vibrating with pure, uncorrupted life energy.'
    ],
    lore: 'Recovered from the Goblin King. Houses the pristine heart of Elderwood Forest.',
    purpose:
      'Purifies Elderwood of corruption, permanently raises your vitality (+15 Max HP, +1 ATK), and opens the Desert Gate.',
    usageInstructions:
      'Activate from inventory to cleanse the forest and unlock the journey to the Sands of Aranu.',
    type: 'quest',
    rules: 'retained'
  },
  'ancient-compass': {
    name: 'Ancient Compass',
    description: [
      'A brass navigational device whose celestial needle aligns with subterranean magnetic leylines.'
    ],
    lore: 'Crafted by nomad navigators to guide caravans across shifting sands and track burrowing predators.',
    purpose:
      'Stabilizes your route across the Shifting Dunes and tracks enemy feints during battle (+2 Focus, Evasion).',
    usageInstructions:
      'Use at the Shifting Dunes to chart safe routes, or activate in combat to anticipate enemy attacks.',
    type: 'tool',
    rules: 'retained'
  },
  'carved-stone': {
    name: 'Carved Stone',
    description: [
      'A heavy sandstone tablet bearing ancient pictographs of the sacred desert serpent constellation.'
    ],
    lore: 'Preserves the sacred cipher used by desert architects to seal the temple sanctum.',
    purpose:
      'Reveals the serpent cipher needed to unlock the Forgotten Temple Entrance.',
    usageInstructions:
      'Study in your inventory to record the clue, then enter the sequence at the Temple Gate.',
    type: 'clue',
    rules: 'retained'
  },
  'temple-key': {
    name: 'Temple Key',
    description: ['An ornate golden key shaped like a coiled serpent.'],
    lore: 'Forged to turn the massive tumblers of the Forgotten Temple outer gate.',
    purpose: 'Unlocks the outer stone portal of the Forgotten Temple.',
    usageInstructions:
      'Select in your inventory and click Use at the Forgotten Temple Entrance.',
    type: 'key',
    rules: 'reusable'
  },
  'large-healing-potion': {
    name: 'Large Healing Potion',
    description: [
      'A stout ceramic flask brimming with potent, effervescent restorative draught.'
    ],
    lore: 'Master-crafted elixir intended for veteran explorers facing mortal perils.',
    purpose: 'Restores 70 health points in exploration or battle.',
    usageInstructions:
      'Select in inventory or choose Use Item in combat when critically injured.',
    type: 'consumable',
    effect: 'large-heal',
    rules: 'consumed'
  },
  'ancient-tablet': {
    name: 'Ancient Tablet',
    description: [
      'A heavy stone slab inscribed with ceremonial rites of harmonic crystal attunement.'
    ],
    lore: 'Inscribed by high priests before the cataclysm to safeguard the inner sanctum seals.',
    purpose:
      'Contains the harmonic color frequencies needed to awaken the altar in the Crystal Chamber.',
    usageInstructions:
      'Read in your inventory, then perform the attunement ritual at the Crystal Chamber altar.',
    type: 'clue',
    rules: 'retained'
  },
  'crystal-seal': {
    name: 'Crystal Seal',
    description: ['A crystalline disk engraved with celestial constellations.'],
    lore: 'Materialized from the altar ritual to open the abyssal chasm below.',
    purpose:
      "Unlocks the sealed subterranean chasm leading to the Sand Serpent's Lair.",
    usageInstructions:
      'Select and use at the Crystal Chamber to open the lair.',
    type: 'key',
    rules: 'reusable'
  },
  'the-serpent-crystal': {
    name: 'The Serpent Crystal',
    description: ['A shimmering amber crystal radiating blazing solar heat.'],
    lore: "Extracted from the Sand Serpent's Lair, containing concentrated sunlight of Aranu.",
    purpose:
      'Cleanses the desert corruption, boosts defenses (+15 Max HP, +1 DEF), thaws glacier ice, and unlocks Frostfell Peaks.',
    usageInstructions:
      'Activate from inventory to cleanse Aranu, thaw the Frozen Key, and open the mountain pass.',
    type: 'quest',
    rules: 'retained'
  },
  'frozen-key': {
    name: 'Frozen Key',
    description: [
      'A master-crafted skeleton key trapped inside a solid block of everlasting glacier ice.'
    ],
    lore: 'Encased in frost to prevent intruders from breaching the castle citadel.',
    purpose: 'Once thawed with heat, it unlocks the Abandoned Castle Gate.',
    usageInstructions:
      'Thaw using a heat source (Serpent Crystal, Lantern, or Village Hearth), then use at the Castle Gate.',
    type: 'key',
    rules: 'reusable'
  },
  'ice-rune': {
    name: 'Ice Rune',
    description: ['A glowing blue rune pulsing with freezing cryogenic frost.'],
    lore: 'Carved from the deepest glacier stratum in the Ice Cavern.',
    purpose:
      'Freezes unstable chasms into solid bridges; freezes enemies solid for 2 turns in combat.',
    usageInstructions:
      'Use at the Crystal Hall to freeze the chasm bridge, or activate in combat to freeze your foe.',
    type: 'tool',
    rules: 'retained'
  },
  'ancient-crown': {
    name: 'Ancient Crown',
    description: [
      'A tarnished metallic diadem set with pale, luminescent moonstones.'
    ],
    lore: 'The sovereign crown of the Frost Kings. Its presence commands ancient royal guardians.',
    purpose:
      "Dispels the Crystal Guardian's impenetrable Sovereign Ward and reduces its defense.",
    usageInstructions:
      'Equip or present before or during battle with the Crystal Guardian to shatter its ward.',
    type: 'relic',
    rules: 'retained'
  },
  'crystal-emblem': {
    name: 'Crystal Emblem',
    description: [
      'An insignia forged from starlight silver and cerulean crystal.'
    ],
    lore: 'Emblem of the royal guard, granting access to the sovereign dragon cavern.',
    purpose: "Unlocks the citadel gates leading into the Ice Dragon's Lair.",
    usageInstructions:
      "Select and use at the Frozen Throne Room to open the dragon's lair.",
    type: 'key',
    rules: 'reusable'
  },
  'the-dragon-crystal': {
    name: 'The Dragon Crystal',
    description: [
      'A flawless diamond-like crystal radiating absolute celestial frost and starlight.'
    ],
    lore: 'The final fragment of the shattered crystal of eternity.',
    purpose:
      'Unites all three crystals at the Grand Monolith to banish the whispers and restore the world.',
    usageInstructions:
      'Activate at the Grand Monolith to complete your adventure.',
    type: 'quest',
    rules: 'retained'
  }
}

// 4. LOCATION STORY DATA

const locationData = {
  W1P1: {
    worldId: 'elderwood',
    name: 'Elderwood Village',
    firstVisit: [
      'The scent of woodsmoke drifts through the square, but the usual laughter is gone.',
      'Doors are shut tight even at midday.',
      'An old bell hangs still, its rope frayed as if someone grabbed it in a hurry.'
    ],
    revisit: [
      'The village feels quieter each time you return.',
      'A few villagers peer out from behind curtains before disappearing again.'
    ],
    npcName: 'Worried Village Elder',
    npcId: 'worried-village-elder',
    dialogue: [
      "Three more gone last night... near the old well, I found footprints that weren't human.",
      "Please, if you're heading into the forest, watch the trees. Take the old lantern by the well—the woods have grown dangerously dark."
    ],
    itemName: 'Rusty Lantern',
    itemId: 'rusty-lantern',
    search: [
      'Behind the well, deep claw marks are gouged into the stone, dragging toward the forest.',
      'Hidden beneath a broken wooden cart, you find a Rusty Lantern. Its wick still holds oil!'
    ],
    objective: [
      'Investigate Elderwood Village and recover the lantern near the well.'
    ],
    searchReward: ['Rusty Lantern'],
    nextObjective: ['Travel to the Forest Entrance and illuminate the path.'],
    nextLocationIds: ['W1P2']
  },
  W1P2: {
    worldId: 'elderwood',
    name: 'Forest Entrance',
    firstVisit: [
      'Twisted roots arch over the path like grasping fingers.',
      'The air grows cold the moment you step beneath the canopy, plunging the path into pitch darkness.',
      'Somewhere far off, a low murmur rides the wind, almost like whispering.'
    ],
    revisit: [
      "The whispering seems louder today, though the words still don't make sense.",
      'The trees seem to lean inward, as if listening back.'
    ],
    npcName: 'Forest Ranger',
    npcId: 'forest-ranger',
    dialogue: [
      "I've walked these woods twenty years. Never seen darkness this heavy.",
      "The goblin scout hides in the pitch black ahead. You'll need light to see what you're doing."
    ],
    enemyName: 'Goblin Scout',
    enemyId: 'goblin-scout',
    search: [
      'Carved into a tree trunk, a jagged circle around a triangle, still sticky with fresh sap.',
      "With the lantern's light, you clearly identify the markings as ancient goblin scout trails."
    ],
    objective: [
      'Illuminate the Forest Entrance with the Rusty Lantern and defeat the scout.'
    ],
    enemyReward: ['The forest entrance is secured.'],
    searchReward: ['Goblin trail markers revealed.'],
    nextObjective: [
      'Search the area for clues before continuing deeper into the forest.'
    ],
    nextLocationIds: ['W1P1', 'W1P3', 'W1P4']
  },
  W1P3: {
    worldId: 'elderwood',
    name: 'Crystal River',
    firstVisit: [
      'The river runs unnaturally clear, glowing faintly blue under the shade.',
      'Several stones along the bank are etched with the same jagged symbol.'
    ],
    revisit: [
      "The river's glow flickers, dimmer than before.",
      'Something beneath the forest seems to be draining its light.'
    ],
    npcName: 'Travelling Merchant',
    npcId: 'travelling-merchant',
    dialogue: [
      'Old folks say this river runs from a crystal buried beneath the forest.',
      'I found an old ritual diary page washed up on the bank. It describes how the ancient shrine mechanism works.'
    ],
    enemyName: 'Forest Wolf',
    enemyId: 'forest-wolf',
    itemName: 'Waterlogged Diary Page',
    itemId: 'waterlogged-diary-page',
    hasCompanion: true,
    companionId: 'forest-wolf',
    search: [
      'Wedged between two river stones, you recover a Waterlogged Diary Page.',
      'Its faded ink reveals critical notes on how the elemental dials flow at the Ancient Shrine!'
    ],
    objective: ['Investigate the Crystal River and recover the diary page.'],
    enemyReward: ['The Forest Wolf becomes your companion.'],
    searchReward: ['Waterlogged Diary Page'],
    nextObjective: [
      'Inspect the diary in your pack to learn the shrine sequence.'
    ],
    nextLocationIds: ['W1P2', 'W1P5']
  },
  W1P4: {
    worldId: 'elderwood',
    name: 'Abandoned Cabin',
    firstVisit: [
      "The cabin door hangs half-open, swinging though there's no wind.",
      'Dust coats every surface except a single desk, papers scattered as if someone left in a hurry.'
    ],
    revisit: [
      'Dust has resettled over the desk, but a fresh claw mark now scratches the doorframe.'
    ],
    npcName: 'Old Hermit',
    npcId: 'old-hermit',
    dialogue: [
      "Ah, someone still living, good. I don't leave this cabin, safer that way.",
      'The Iron Key under the floorboards opens the heavy grate in the Hidden Cave. Take it if you plan to face the beasts.'
    ],
    enemyName: 'Corrupted Boar',
    enemyId: 'corrupted-boar',
    itemName: 'Iron Key',
    itemId: 'iron-key',
    search: [
      'Tucked beneath a loose floorboard, you find the heavy Iron Key.',
      'Beside it, a hand-drawn map fragment confirms it opens the sealed grate in the Hidden Cave.'
    ],
    objective: ['Defeat the Corrupted Boar and recover the Iron Key.'],
    enemyReward: ['The cabin becomes safe to search.'],
    searchReward: ['Iron Key'],
    nextObjective: ['Take the Iron Key to unlock the Hidden Cave passage.'],
    nextLocationIds: ['W1P2', 'W1P5']
  },
  W1P5: {
    worldId: 'elderwood',
    name: 'Hidden Cave',
    firstVisit: [
      'The cave mouth is nearly swallowed by hanging vines.',
      'Deeper inside, pitch-black darkness swallows all light and a distant chanting echoes.',
      'A rusted iron grate blocks the narrow inner tunnel, sealed tight.'
    ],
    revisit: [
      'The chanting has grown clearer, guttural words repeating in the subterranean gloom.'
    ],
    enemyName: 'Goblin Warrior',
    enemyId: 'goblin-warrior',
    itemName: 'Ancient Symbol Stone',
    itemId: 'ancient-symbol-stone',
    lock: 'iron-key',
    search: [
      'In the illuminated nook beyond the grate, a glowing stone rests among ancient runes.',
      'You take the Ancient Symbol Stone!'
    ],
    objective: [
      'Unlock the grate with the Iron Key, illuminate the cave, and defeat the warrior.'
    ],
    enemyReward: ['Safe access to the inner cave.'],
    searchReward: ['Ancient Symbol Stone'],
    nextObjective: [
      'Use the lantern to find the Ancient Symbol Stone, then proceed to the Ancient Shrine.'
    ],
    unlockText: [
      'The Iron Key turns with a heavy groan. The rusted grate swings open, revealing a tunnel leading into pitch darkness.'
    ],
    nextLocationIds: ['W1P3', 'W1P4', 'W1P6']
  },
  W1P6: {
    worldId: 'elderwood',
    name: 'Ancient Shrine',
    firstVisit: [
      'Moss-covered steps descend into a forgotten ceremonial chamber.',
      'Faint blue light pulses from cracks in the floor.',
      'An empty pedestal stands at the center, surrounded by three locked elemental dials: Water, Earth, and Fire.',
      'A socket awaits the Ancient Symbol Stone, but the dials are firmly jammed.'
    ],
    revisit: [
      'The shrine hums quietly, waiting for the proper elemental alignment.'
    ],
    enemyName: 'Goblin Shaman',
    enemyId: 'goblin-shaman',
    itemName: 'Healing Potion',
    itemId: 'healing-potion',
    search: [
      'The pedestal dials require the alignment revealed in the Waterlogged Diary Page.',
      'Tucked beside the altar, you find a Healing Potion.'
    ],
    objective: [
      'Defeat the Goblin Shaman and solve the Shrine Riddle using the diary clue.'
    ],
    enemyReward: ['The shrine is cleansed of dark magic.'],
    searchReward: ['Healing Potion'],
    nextObjective: [
      'Solve the Shrine Riddle, socket the Ancient Symbol Stone, and descend to the Goblin King.'
    ],
    nextLocationIds: ['W1P5', 'W1P7']
  },
  W1P7: {
    worldId: 'elderwood',
    name: "Goblin King's Camp",
    firstVisit: [
      'Firelight flickers against crude wooden spikes and banners of stitched hide.',
      'The Goblin King sits upon a throne of bone and root, clutching a radiant green crystal shard.'
    ],
    revisit: [
      'The camp lies in tense silence, the Goblin King watching your every step.'
    ],
    enemyName: 'Goblin King',
    enemyId: 'goblin-king',
    itemName: 'The Green Crystal',
    itemId: 'the-green-crystal',
    itemSource: 'enemy',
    companionLose: [
      'The Forest Wolf lets out one final howl before returning to the woods.',
      'Its duty is complete, but your journey continues.'
    ],
    companionLoseId: 'forest-wolf',
    lock: 'ancient-symbol-stone',
    search: [
      'Scattered around the throne, broken shackles and torn village cloth confirm the villagers escaped.'
    ],
    objective: ['Defeat the Goblin King and recover The Green Crystal.'],
    enemyReward: [
      'World 1 Completed',
      'The Green Crystal is recovered.',
      'Activate it to cleanse Elderwood and unlock the Desert Gate.'
    ],
    searchReward: ["Confirmation of the villagers' safety."],
    nextObjective: [
      'Activate The Green Crystal from your bag to purify the forest.'
    ],
    unlockText: [
      "The Ancient Symbol Stone slots into the pedestal. A subterranean staircase grinds open in the chamber floor, leading down into the Goblin King's Camp."
    ],
    nextLocationIds: ['W1P6']
  },
  W2P1: {
    worldId: 'aranu',
    name: 'Nomad Camp',
    firstVisit: [
      'Tents ripple in the hot wind, their fabric faded by endless sun.',
      'A campfire crackles low despite the midday heat.',
      'A nomad guide watches the horizon, shading her eyes against the blinding glare.'
    ],
    revisit: [
      'The camp stirs quietly around you, nomads packing supplies for the crossing.'
    ],
    npcName: 'Nomad Guide',
    npcId: 'nomad-guide',
    dialogue: [
      'The shifting dunes will swallow you whole without a compass attuned to the leylines.',
      'Find the Ancient Compass buried by the tents before you step into the desert.'
    ],
    enemyName: 'Desert Falcon',
    enemyId: 'desert-falcon',
    itemName: 'Ancient Compass',
    itemId: 'ancient-compass',
    hasCompanion: true,
    companionId: 'desert-falcon',
    search: [
      'Beneath a stack of canvas tents, you uncover the Ancient Compass.',
      'Its needle hums softly, vibrating with the pulse of the subterranean desert leylines!'
    ],
    objective: ['Recover the Ancient Compass and befriend the Desert Falcon.'],
    enemyReward: ['The Desert Falcon becomes your companion.'],
    searchReward: ['Ancient Compass'],
    nextObjective: [
      'Use the Ancient Compass at the Shifting Dunes to calibrate your path.'
    ],
    nextLocationIds: ['W2P2']
  },
  W2P2: {
    worldId: 'aranu',
    name: 'Shifting Dunes',
    firstVisit: [
      'Waves of sand stretch endlessly in every direction, whipped by fierce sandstorms.',
      'Without an attuned compass, every direction looks identical and tracks vanish in seconds.',
      'Half-buried stone fragments jut from the dunes.'
    ],
    revisit: [
      'The dunes shift constantly, but your compass holds the steady course.'
    ],
    npcName: 'Desert Merchant',
    npcId: 'desert-merchant',
    dialogue: [
      'Storms uncovered ruins nobody has seen in a thousand years.',
      'The temple is sealed by a serpent cipher. You will need a carved translation tablet to get inside.'
    ],
    enemyName: 'Sand Scorpion',
    enemyId: 'sand-scorpion',
    itemName: 'Carved Stone',
    itemId: 'carved-stone',
    search: [
      'Half-buried in a dune, you uncover the Carved Stone.',
      'It depicts the sacred Serpent Constellation: Serpent Head, Solar Disc, Coiled Tail.'
    ],
    objective: [
      'Calibrate the dunes with the Ancient Compass, defeat the scorpion, and search for the Carved Stone.'
    ],
    enemyReward: ['The dunes are made safe.'],
    searchReward: ['Carved Stone'],
    nextObjective: [
      'Study the Carved Stone in your bag to prepare for the Forgotten Temple.'
    ],
    nextLocationIds: ['W2P1', 'W2P3', 'W2P4']
  },
  W2P3: {
    worldId: 'aranu',
    name: 'Ancient Marketplace Ruins',
    firstVisit: [
      'Broken archways rise from the sand, their carvings worn smooth by centuries of wind.',
      'Stalls made of stone stand abandoned, half-buried under drifting dunes.'
    ],
    revisit: [
      'The ruins remain silent, though the wind whispers through the broken archways.'
    ],
    enemyName: 'Desert Bandit',
    enemyId: 'desert-bandit',
    itemName: 'Temple Key',
    itemId: 'temple-key',
    search: [
      'Behind a collapsed market stall, you uncover the ornate golden Temple Key.'
    ],
    objective: ['Defeat the Desert Bandit and recover the Temple Key.'],
    enemyReward: ['The marketplace is cleared of bandits.'],
    searchReward: ['Temple Key'],
    nextObjective: [
      'Use the Temple Key to open the Forgotten Temple Entrance.'
    ],
    nextLocationIds: ['W2P2']
  },
  W2P4: {
    worldId: 'aranu',
    name: 'Forgotten Temple Entrance',
    firstVisit: [
      'Two colossal stone pillars rise from the sand, etched with coiled serpents.',
      'A sealed stone door stands between them, featuring rotating circular serpent hieroglyphic dials.',
      'A keyhole sits below the dials.'
    ],
    revisit: [
      'The entrance stands silent, waiting for the proper key and cipher.'
    ],
    enemyName: 'Sand Spirit',
    enemyId: 'sand-spirit',
    itemName: 'Large Healing Potion',
    itemId: 'large-healing-potion',
    lock: 'temple-key',
    search: [
      'The inner portal dials require the serpent cipher found on the Carved Stone.',
      'Near the base of a pillar, you find a Large Healing Potion.'
    ],
    objective: [
      'Unlock the outer door with the Temple Key, defeat the Sand Spirit, and align the serpent glyphs.'
    ],
    enemyReward: ["The Sand Spirit's ward weakens."],
    searchReward: ['Large Healing Potion'],
    nextObjective: [
      'Solve the Temple Glyph cipher to access the Underground Catacombs.'
    ],
    unlockText: [
      'The Temple Key turns with a deep click. The massive stone gate swings open, revealing the inner hieroglyphic door.'
    ],
    nextLocationIds: ['W2P2', 'W2P5']
  },
  W2P5: {
    worldId: 'aranu',
    name: 'Underground Catacombs',
    firstVisit: [
      'The staircase descends into narrow stone corridors filled with centuries of dust.',
      'Carvings depict ancient priests conducting an elemental attunement at an altar of crystals.'
    ],
    revisit: [
      'The catacombs remain dim and still, echoing with distant sand drifts.'
    ],
    enemyName: 'Mummy Guardian',
    enemyId: 'mummy-guardian',
    itemName: 'Ancient Tablet',
    itemId: 'ancient-tablet',
    search: [
      'Inside a cracked stone sarcophagus, you discover the Ancient Tablet.',
      'It preserves the harmonic ritual sequence: Solar Gold, Azure Sky, Crimson Fire!'
    ],
    objective: ['Defeat the Mummy Guardian and recover the Ancient Tablet.'],
    enemyReward: ['The catacomb passage is secured.'],
    searchReward: ['Ancient Tablet'],
    nextObjective: [
      'Study the Ancient Tablet, then proceed to the Crystal Chamber.'
    ],
    nextLocationIds: ['W2P4', 'W2P6']
  },
  W2P6: {
    worldId: 'aranu',
    name: 'Crystal Chamber',
    firstVisit: [
      'A vast chamber opens, walls glittering with embedded desert crystals.',
      'At the center stands a dormant stone altar with three colored harmonic sockets.',
      "A deep chasm bars the descent into the Sand Serpent's Lair."
    ],
    revisit: ['The crystals shimmer with radiant warmth.'],
    enemyName: 'Temple Guardian',
    enemyId: 'temple-guardian',
    itemName: 'Crystal Seal',
    itemId: 'crystal-seal',
    search: [
      'The altar requires the harmonic ritual from the Ancient Tablet to solidify the Crystal Seal.'
    ],
    objective: [
      'Defeat the Temple Guardian and perform the Altar Ritual to obtain the Crystal Seal.'
    ],
    enemyReward: ['The Temple Guardian is vanquished.'],
    searchReward: ['Crystal Seal'],
    nextObjective: ["Use the Crystal Seal to unseal the Sand Serpent's Lair."],
    nextLocationIds: ['W2P5', 'W2P7']
  },
  W2P7: {
    worldId: 'aranu',
    name: "Sand Serpent's Lair",
    firstVisit: [
      'The chamber opens into a subterranean chasm of shifting golden sand.',
      'A colossal Sand Serpent rises, golden scales gleaming with solar fire.'
    ],
    revisit: ['The lair is quiet, the sand settling into deep grooves.'],
    enemyName: 'Sand Serpent',
    enemyId: 'sand-serpent',
    itemName: 'The Serpent Crystal',
    itemId: 'the-serpent-crystal',
    lock: 'crystal-seal',
    companionLose: [
      'The Desert Falcon bows before soaring high into the desert sky.',
      'Its duty is complete, but your journey continues.'
    ],
    companionLoseId: 'desert-falcon',
    search: [
      'At the heart of the lair rests The Serpent Crystal, humming with concentrated solar flame.'
    ],
    objective: ['Defeat the Sand Serpent and recover The Serpent Crystal.'],
    enemyReward: [
      'World 2 Completed',
      'The Serpent Crystal is recovered.',
      'Activate it to cleanse Aranu, thaw the Frozen Key, and open Frostfell Peaks.'
    ],
    searchReward: ['The Serpent Crystal'],
    nextObjective: ['Activate The Serpent Crystal from your bag to proceed.'],
    unlockText: [
      "The Crystal Seal presses into the glowing socket. The chasm floor shudders as tons of sand drain away, opening the passage into the Sand Serpent's Lair."
    ],
    nextLocationIds: ['W2P6']
  },
  W3P1: {
    worldId: 'frostfell',
    name: 'Snowbound Village',
    firstVisit: [
      'Snow blankets rooftops, and smoke curls from stone chimneys into a pale, bitter sky.',
      'Near an abandoned storehouse, a gleaming key is trapped inside a solid block of glacier permafrost.'
    ],
    revisit: ['The village remains quiet beneath falling snow.'],
    npcName: 'Village Healer',
    npcId: 'village-healer',
    dialogue: [
      'The cold has frozen everything solid. That key by the storehouse cannot fit any lock until thawed with flame.',
      'Use the village hearth or an intense heat source to melt the glacier ice.'
    ],
    itemName: 'Frozen Key',
    itemId: 'frozen-key',
    search: [
      'Near the storehouse, you discover the Frozen Key, encased in solid glacier permafrost.'
    ],
    objective: [
      'Investigate the village, recover the Frozen Key, and thaw it using a heat source.'
    ],
    searchReward: ['Frozen Key'],
    nextObjective: [
      'Thaw the Frozen Key at the Village Hearth or with the Serpent Crystal.'
    ],
    nextLocationIds: ['W3P2']
  },
  W3P2: {
    worldId: 'frostfell',
    name: 'Frozen Forest',
    firstVisit: [
      'Snow-laden branches arch over a narrow trail.',
      'The air bites with freezing chill, and glowing eyes watch from between the frost-covered trees.'
    ],
    revisit: ['Fresh wolf tracks cross the packed snow.'],
    enemyName: 'Ice Wolf',
    enemyId: 'ice-wolf',
    hasCompanion: true,
    companionId: 'ice-wolf',
    search: [
      'Claw marks in the ice point toward the Ice Cavern to the north and the Castle Gate to the east.'
    ],
    objective: ['Defeat the Ice Wolf and explore the frozen forest.'],
    enemyReward: ['The Ice Wolf becomes your companion.'],
    nextObjective: [
      'Retrieve the Ice Rune from the Ice Cavern before proceeding to the Castle Gate.'
    ],
    nextLocationIds: ['W3P1', 'W3P3', 'W3P4']
  },
  W3P3: {
    worldId: 'frostfell',
    name: 'Ice Cavern',
    firstVisit: [
      'Vibrant blue ice covers the cavern walls, reflecting pale light in glasslike shards.',
      'At the center rests an ancient frost altar carved from eternal ice.'
    ],
    revisit: ['The cavern glitters with freezing cold.'],
    enemyName: 'Frost Spirit',
    enemyId: 'frost-spirit',
    itemName: 'Ice Rune',
    itemId: 'ice-rune',
    search: [
      'Embedded in the frozen altar, you pry loose the Ice Rune.',
      'It pulses with deep sub-zero power—capable of freezing chasm bridges or freezing foes in battle!'
    ],
    objective: ['Defeat the Frost Spirit and claim the Ice Rune.'],
    enemyReward: ["The frost spirit's bitter chill subsides."],
    searchReward: ['Ice Rune'],
    nextObjective: [
      'Return to the Frozen Forest and unlock the Abandoned Castle Gate.'
    ],
    nextLocationIds: ['W3P2']
  },
  W3P4: {
    worldId: 'frostfell',
    name: 'Abandoned Castle Gate',
    firstVisit: [
      "The castle's towering gates are sealed under thick sheets of frost.",
      'A frozen soldier stands motionless near the entrance, trapped in translucent ice.'
    ],
    revisit: ['The castle gates stand tall against the mountain wind.'],
    enemyName: 'Frozen Soldier',
    enemyId: 'frozen-soldier',
    lock: 'frozen-key',
    search: [
      "The gate's heavy lock requires a thawed key to turn without snapping."
    ],
    objective: [
      'Defeat the Frozen Soldier and unlock the gate with your thawed key.'
    ],
    enemyReward: [
      'The ice surrounding the soldier cracks and shatters.',
      'The soldier regains consciousness and warns of the Sovereign Ward guarding the Throne Room.'
    ],
    nextObjective: ['Proceed into the Crystal Hall.'],
    unlockText: [
      'The thawed key slides into the mechanism and turns smoothly. With a shudder of breaking frost, the heavy gates open.'
    ],
    nextLocationIds: ['W3P2', 'W3P5']
  },
  W3P5: {
    worldId: 'frostfell',
    name: 'Crystal Hall',
    firstVisit: [
      'Tall crystal pillars rise toward the vaulted ceiling.',
      'At the center, an ancient stone pedestal holds the Ancient Crown of the Frost Kings.',
      'Beyond it, a treacherous melting chasm bars passage to the Frozen Throne Room.'
    ],
    revisit: ['The crystal pillars shimmer with starlight.'],
    enemyName: 'Ice Golem',
    enemyId: 'ice-golem',
    itemName: 'Ancient Crown',
    itemId: 'ancient-crown',
    search: [
      'You recover the Ancient Crown from the pedestal. Its royal moonstones gleam with sovereign majesty.'
    ],
    objective: [
      'Defeat the Ice Golem, claim the Ancient Crown, and freeze the chasm with the Ice Rune.'
    ],
    enemyReward: ['The hall is cleared.'],
    searchReward: ['Ancient Crown'],
    nextObjective: [
      'Use the Ice Rune to freeze the chasm bridge, then enter the Throne Room.'
    ],
    nextLocationIds: ['W3P4', 'W3P6']
  },
  W3P6: {
    worldId: 'frostfell',
    name: 'Frozen Throne Room',
    firstVisit: [
      'A vast throne room stretches beneath an arched ceiling of diamond ice.',
      'A frozen throne stands at the center, guarded by the towering Crystal Guardian.',
      'The guardian is wreathed in an impenetrable Sovereign Ward that deflects all mortal blows.'
    ],
    revisit: ['The throne room stands solemn and still.'],
    enemyName: 'Crystal Guardian',
    enemyId: 'crystal-guardian',
    itemName: 'Crystal Emblem',
    itemId: 'crystal-emblem',
    search: [
      "Beside the throne, you discover the Crystal Emblem, key to the Ice Dragon's citadel gates."
    ],
    objective: [
      "Don the Ancient Crown to dispel the Guardian's Sovereign Ward, then defeat it."
    ],
    enemyReward: ['The Crystal Guardian bows in reverence before dissipating.'],
    searchReward: ['Crystal Emblem'],
    nextObjective: ["Use the Crystal Emblem to unlock the Ice Dragon's Lair."],
    nextLocationIds: ['W3P5', 'W3P7']
  },
  W3P7: {
    worldId: 'frostfell',
    name: "Ice Dragon's Lair",
    firstVisit: [
      'The final cavern opens beneath an immense dome of glittering glacier ice.',
      'A colossal Ice Dragon rests coiled among frozen stalagmites, eyes opening like pale stars.'
    ],
    revisit: ['The dragon cavern hums with ancient power.'],
    enemyName: 'Ice Dragon',
    enemyId: 'ice-dragon',
    itemName: 'The Dragon Crystal',
    itemId: 'the-dragon-crystal',
    hasCompanion: true,
    companionId: 'ice-dragon',
    lock: 'crystal-emblem',
    search: [
      'At the heart of the lair rests The Dragon Crystal, pulsing alongside the Grand Monolith of Eternity.'
    ],
    objective: [
      'Defeat the Ice Dragon, claim The Dragon Crystal, and unite all three crystals.'
    ],
    enemyReward: [
      'World 3 Completed',
      'The Dragon Crystal is recovered.',
      'Unite the Three Crystals at the Grand Monolith to finish your adventure!'
    ],
    searchReward: ['The Dragon Crystal'],
    nextObjective: ['Unite the Three Crystals to complete your journey.'],
    unlockText: [
      'The Crystal Emblem fits into the citadel seal. The massive portcullis of dragon bone and ice rises into the ceiling.'
    ],
    nextLocationIds: ['W3P6']
  }
}

// 5. CHOICES AND TRAVEL CONNECTIONS
const choiceData = {}
for (const [locationId, location] of Object.entries(locationData)) {
  for (const nextId of location.nextLocationIds) {
    const next = locationData[nextId]
    if (!next) continue
    const lockedItem = next.lock ? itemData[next.lock] : null
    choiceData[`travel_${locationId}_${nextId}`] = {
      text: `Travel to ${next.name}`,
      type: 'travel',
      nextLocationId: nextId,
      requirements: next.lock ? [{ type: 'hasItem', itemId: next.lock }] : [],
      effects: [],
      lockedText: next.lock
        ? `You need the ${
            lockedItem ? lockedItem.name : next.lock
          } to go there.`
        : null
    }
  }
  if (location.search && location.search.length > 0)
    choiceData[`search_${locationId}`] = {
      text: 'Search the area',
      type: 'search',
      locationId
    }
  if (location.npcName)
    choiceData[`talk_${locationId}`] = {
      text: `Talk to ${location.npcName}`,
      type: 'talk',
      locationId
    }
  if (location.enemyName)
    choiceData[`fight_${locationId}`] = {
      text: `Face ${location.enemyName}`,
      type: 'fight',
      locationId
    }
}

// 6. ENEMIES
const enemyData = {
  'goblin-scout': { name: 'Goblin Scout' },
  'forest-wolf': { name: 'Forest Wolf' },
  'corrupted-boar': { name: 'Corrupted Boar' },
  'goblin-warrior': { name: 'Goblin Warrior' },
  'goblin-shaman': { name: 'Goblin Shaman' },
  'goblin-king': { name: 'Goblin King' },
  'desert-falcon': { name: 'Desert Falcon' },
  'sand-scorpion': { name: 'Sand Scorpion' },
  'desert-bandit': { name: 'Desert Bandit' },
  'sand-spirit': { name: 'Sand Spirit' },
  'mummy-guardian': { name: 'Mummy Guardian' },
  'temple-guardian': { name: 'Temple Guardian' },
  'sand-serpent': { name: 'Sand Serpent' },
  'ice-wolf': { name: 'Ice Wolf' },
  'frost-spirit': { name: 'Frost Spirit' },
  'frozen-soldier': { name: 'Frozen Soldier' },
  'ice-golem': { name: 'Ice Golem' },
  'crystal-guardian': { name: 'Crystal Guardian' },
  'ice-dragon': { name: 'Ice Dragon' }
}

// 7. COMPANIONS
const companionData = {
  'forest-wolf': {
    name: 'Forest Wolf',
    ability: [
      'Helps attack enemies.',
      'Can sniff out hidden items.',
      'Occasionally blocks enemy attacks.'
    ],
    recruitmentText: [
      'Instead of striking the final blow, you offer the wounded wolf a kind smile and food.',
      'After a long silence, it slowly walks to your side.',
      'The Forest Wolf has become your companion.'
    ]
  },
  'desert-falcon': {
    name: 'Desert Falcon',
    ability: [
      'Attacks flying enemies.',
      'Scouts nearby locations.',
      'Finds hidden treasure.'
    ],
    recruitmentText: [
      'The injured falcon struggles to spread its wings.',
      'Instead of attacking again, you carefully bandage its wounded wing.',
      'It lets out a sharp cry before landing on your shoulder.',
      'The Desert Falcon has become your companion.'
    ]
  },
  'ice-wolf': {
    name: 'Ice Wolf',
    ability: [
      'Helps attack enemies.',
      'Can detect hidden paths beneath the snow.',
      'Can freeze enemies for one turn.'
    ],
    recruitmentText: [
      'The Ice Wolf lowers its head, its breath forming a cloud in the freezing air.',
      'After a cautious moment, it steps closer instead of retreating into the forest.',
      'The Ice Wolf has joined you.'
    ]
  },
  'ice-dragon': {
    name: 'Ice Dragon',
    ability: [
      'Deals powerful damage to enemies.',
      'Can freeze enemies with icy attacks.',
      'Can protect the player from incoming damage.'
    ],
    recruitmentText: [
      'The Ice Dragon lowers its head after the battle.',
      'Its icy glow softens, and it acknowledges your strength.',
      'The Ice Dragon joins you as your companion.'
    ]
  }
}

// 8. NPCS
const npcData = {
  'worried-village-elder': { name: 'Worried Village Elder' },
  'forest-ranger': { name: 'Forest Ranger' },
  'travelling-merchant': { name: 'Travelling Merchant' },
  'old-hermit': { name: 'Old Hermit' },
  'nomad-guide': { name: 'Nomad Guide' },
  'desert-merchant': { name: 'Desert Merchant' },
  archaeologist: { name: 'Archaeologist' },
  'wandering-monk': { name: 'Wandering Monk' },
  'lonely-survivor': { name: 'Lonely Survivor' },
  'wandering-hunter': { name: 'Wandering Hunter' },
  'ice-scholar': { name: 'Ice Scholar' },
  'old-castle-keeper': { name: 'Old Castle Keeper' },
  'frozen-spirit': { name: 'Frozen Spirit' },
  'village-healer': { name: 'Village Healer' }
}

// 9. CREATE REGISTRIES
function createRegistry (data, ClassType) {
  return Object.fromEntries(
    Object.entries(data).map(([id, properties]) => [
      id,
      new ClassType({ id, ...properties })
    ])
  )
}
const worlds = createRegistry(worldData, World)
const choices = createRegistry(choiceData, Choice)
const items = createRegistry(itemData, Item)
const enemies = createRegistry(enemyData, Enemy)
const companions = createRegistry(companionData, Companion)
const npcs = createRegistry(npcData, NPC)

const locationsWithChoices = Object.fromEntries(
  Object.entries(locationData).map(([id, data]) => {
    const travelChoiceIds = (data.nextLocationIds || [])
      .filter(nextId => Object.hasOwn(locationData, nextId))
      .map(nextId => `travel_${id}_${nextId}`)
    const actionChoiceIds = []
    if (data.search && data.search.length > 0)
      actionChoiceIds.push(`search_${id}`)
    if (data.npcName) actionChoiceIds.push(`talk_${id}`)
    if (data.enemyName) actionChoiceIds.push(`fight_${id}`)
    return [
      id,
      { ...data, choiceIds: [...actionChoiceIds, ...travelChoiceIds] }
    ]
  })
)
const locations = createRegistry(locationsWithChoices, Location)

// 10. LOOKUP HELPERS
const getLocation = id => locations[id] ?? null
const getWorld = id => worlds[id] ?? null
const getChoice = id => choices[id] ?? null
const getItem = id => items[id] ?? null
const getEnemy = id => enemies[id] ?? null
const getCompanion = id => companions[id] ?? null

// 11. GAME STATE AND PROGRESSION LOGIC
function createGameState () {
  return {
    currentLocationId: worlds.elderwood.startingLocationId,
    inventory: [],
    companions: [],
    completedWorlds: [],
    visited: [],
    unlockedLocks: [],
    unlockedLocations: [],
    illuminatedLocations: [],
    clues: {},
    puzzlesSolved: {},
    dunesCalibrated: false,
    keyThawed: false,
    frostBridgeFrozen: false,
    crownEquipped: false,
    worldPurified: {}
  }
}
const gameState = createGameState()
const hasItem = (itemId, state = gameState) => state.inventory.includes(itemId)

function addItem (itemId, state = gameState) {
  const item = getItem(itemId)
  if (!item) return false
  const alreadyHas = hasItem(itemId, state)
  if (!alreadyHas || item.type === 'consumable') {
    state.inventory.push(itemId)
    if (
      typeof window !== 'undefined' &&
      typeof window.dispatchEvent === 'function'
    ) {
      window.dispatchEvent(
        new CustomEvent('whispers:item-added', {
          detail: { itemId, item }
        })
      )
    }
    return true
  }
  return false
}

function addCompanion (companionId, state = gameState) {
  if (getCompanion(companionId) && !state.companions.includes(companionId))
    state.companions.push(companionId)
}

function removeCompanion (companionId, state = gameState) {
  state.companions = state.companions.filter(id => id !== companionId)
}

function isWorldUnlocked (worldId, state = gameState) {
  const world = getWorld(worldId)
  if (!world) return false
  return (
    !world.unlockRequirement ||
    state.completedWorlds.includes(world.unlockRequirement.completedWorldId)
  )
}

function completeWorld (worldId, state = gameState) {
  if (!state.completedWorlds.includes(worldId))
    state.completedWorlds.push(worldId)
}

// Validates whether the player can enter a given location.
function canEnterLocation (locationId, state = gameState) {
  const location = getLocation(locationId)
  if (!location) return { allowed: false, text: ['Unknown location.'] }
  if (!isWorldUnlocked(location.worldId, state))
    return { allowed: false, text: ['This world is still locked.'] }

  state.unlockedLocations = state.unlockedLocations || []
  state.unlockedLocks = state.unlockedLocks || []
  state.illuminatedLocations = state.illuminatedLocations || []
  state.puzzlesSolved = state.puzzlesSolved || {}
  state.clues = state.clues || {}

  // 1. Mandatory Key/Seal Lock Checks
  if (location.lock) {
    const isUnlocked =
      state.unlockedLocations.includes(locationId) ||
      state.unlockedLocks.includes(location.lock)

    if (!isUnlocked) {
      const item = getItem(location.lock)
      const hasKey = hasItem(location.lock, state)

      if (location.lock === 'frozen-key' && hasKey && !state.keyThawed) {
        return {
          allowed: false,
          text: [
            'The Castle Gate lock is frozen. The Frozen Key is trapped in glacier ice and must be thawed before use.'
          ]
        }
      }

      return {
        allowed: false,
        text: [
          hasKey
            ? `The passage to ${location.name} is locked. Use the ${
                item ? item.name : location.lock
              } from your pack to unlock it.`
            : `You need the ${item ? item.name : location.lock} to unlock ${
                location.name
              }.`
        ]
      }
    }
  }

  // 2. Environmental & Puzzle Progression Requirements
  if (
    (locationId === 'W1P3' || locationId === 'W1P4') &&
    !state.illuminatedLocations.includes('W1P2')
  ) {
    return {
      allowed: false,
      text: [
        'The forest path is pitch-black. You must illuminate the Forest Entrance with the Rusty Lantern before exploring deeper.'
      ]
    }
  }

  if (locationId === 'W1P6' && !state.illuminatedLocations.includes('W1P5')) {
    return {
      allowed: false,
      text: [
        'The subterranean tunnels are pitch-black. You must illuminate the Hidden Cave with the Rusty Lantern to proceed.'
      ]
    }
  }

  if (locationId === 'W1P7' && !state.puzzlesSolved['shrine_riddle']) {
    return {
      allowed: false,
      text: [
        'The pedestal mechanism is locked behind ancient elemental seals. You must solve the Shrine Riddle before the descent opens.'
      ]
    }
  }

  if (
    (locationId === 'W2P3' || locationId === 'W2P4') &&
    !state.dunesCalibrated
  ) {
    return {
      allowed: false,
      text: [
        'Blinding sandstorms and shifting dunes hide the route. You must use the Ancient Compass to calibrate the path.'
      ]
    }
  }

  if (locationId === 'W2P5' && !state.puzzlesSolved['temple_glyphs']) {
    return {
      allowed: false,
      text: [
        'The inner temple portal is sealed by rotating serpent hieroglyphs. Study the Carved Stone and solve the cipher to enter.'
      ]
    }
  }

  if (locationId === 'W2P7' && !state.puzzlesSolved['altar_ritual']) {
    return {
      allowed: false,
      text: [
        'The chasm passage remains sealed. You must perform the Crystal Altar attunement ritual described in the Ancient Tablet.'
      ]
    }
  }

  if (locationId === 'W3P6' && !state.frostBridgeFrozen) {
    return {
      allowed: false,
      text: [
        'A bottomless melting chasm blocks the path to the Throne Room. Use the Ice Rune to freeze a solid bridge across.'
      ]
    }
  }

  return {
    allowed: true,
    text:
      location.lock && !state.visited.includes(locationId)
        ? location.unlockText
        : []
  }
}

// Call when player defeats enemy
function onEnemyDefeated (locationId, state = gameState) {
  const location = getLocation(locationId)
  if (!location) return
  if (location.itemId && location.itemSource === 'enemy')
    addItem(location.itemId, state)
  if (location.hasCompanion && location.companionId)
    addCompanion(location.companionId, state)
  if (
    location.companionLoseId &&
    state.companions.includes(location.companionLoseId)
  )
    removeCompanion(location.companionLoseId, state)
  const world = getWorld(location.worldId)
  if (world && world.locationIds[world.locationIds.length - 1] === locationId)
    completeWorld(world.id, state)
}

// Call when player searches
function onSearch (locationId, state = gameState) {
  const location = getLocation(locationId)
  if (location && location.itemId && location.itemSource === 'search')
    addItem(location.itemId, state)
}

// 12. VALIDATE GAME DATA
function reachableFrom (startId, avoidId = null) {
  const seen = new Set()
  const queue = [startId]
  while (queue.length) {
    const id = queue.shift()
    if (id === avoidId || seen.has(id) || !locations[id]) continue
    seen.add(id)
    queue.push(...locations[id].nextLocationIds)
  }
  return seen
}
function validateGameData () {
  const errors = []
  const itemLocation = {}
  for (const [locationId, l] of Object.entries(locations))
    if (l.itemId) itemLocation[l.itemId] = locationId
  for (const [worldId, world] of Object.entries(worlds)) {
    const start = locations[world.startingLocationId]
    if (!start)
      errors.push(
        `World "${worldId}" has an unknown starting location: ${world.startingLocationId}`
      )
    else if (start.worldId !== worldId)
      errors.push(
        `World "${worldId}" starts in a location from another world: ${world.startingLocationId}`
      )
    if (
      world.unlockRequirement &&
      !worlds[world.unlockRequirement.completedWorldId]
    )
      errors.push(
        `World "${worldId}" requires unknown world "${world.unlockRequirement.completedWorldId}"`
      )
    for (const locationId of world.locationIds) {
      if (!locations[locationId])
        errors.push(
          `World "${worldId}" references missing location "${locationId}"`
        )
      else if (locations[locationId].worldId !== worldId)
        errors.push(
          `Location "${locationId}" has worldId "${locations[locationId].worldId}" but is listed in world "${worldId}"`
        )
    }
    if (start) {
      const reach = reachableFrom(world.startingLocationId)
      for (const locationId of world.locationIds)
        if (!reach.has(locationId))
          errors.push(
            `Location "${locationId}" can't be reached from the start of "${worldId}"`
          )
    }
  }
  for (const [locationId, l] of Object.entries(locations)) {
    const world = worlds[l.worldId]
    if (!world)
      errors.push(`Location "${locationId}" has unknown worldId "${l.worldId}"`)
    else if (!world.locationIds.includes(locationId))
      errors.push(
        `Location "${locationId}" is missing from its world's locationIds`
      )

    if (l.npcId && !npcs[l.npcId])
      errors.push(
        `Location "${locationId}" references missing NPC "${l.npcId}"`
      )

    if (l.enemyId && !enemies[l.enemyId])
      errors.push(
        `Location "${locationId}" references missing enemy "${l.enemyId}"`
      )

    if (l.itemId && !items[l.itemId])
      errors.push(
        `Location "${locationId}" references missing item "${l.itemId}"`
      )

    if (l.itemId && items[l.itemId] && items[l.itemId].name !== l.itemName)
      errors.push(
        `Location "${locationId}" itemName "${l.itemName}" doesn't match item "${l.itemId}"`
      )

    if (l.companionId && !companions[l.companionId])
      errors.push(
        `Location "${locationId}" references missing companion "${l.companionId}"`
      )

    if (l.hasCompanion && !l.companionId)
      errors.push(
        `Location "${locationId}" has hasCompanion but no companionId`
      )

    if (l.companionLoseId && !companions[l.companionLoseId])
      errors.push(
        `Location "${locationId}" references missing companion "${l.companionLoseId}" to lose`
      )

    if (l.lock && !items[l.lock])
      errors.push(
        `Location "${locationId}" lock "${l.lock}" is not a valid item id`
      )

    for (const destinationId of l.nextLocationIds) {
      if (!locations[destinationId])
        errors.push(
          `Location "${locationId}" connects to missing location "${destinationId}"`
        )
      else if (locations[destinationId].worldId !== l.worldId)
        errors.push(
          `Location "${locationId}" connects to "${destinationId}" in a different world`
        )
    }

    for (const choiceId of l.choiceIds)
      if (!choices[choiceId])
        errors.push(
          `Location "${locationId}" references missing choice "${choiceId}"`
        )
    if (l.lock && world) {
      const itemLoc = itemLocation[l.lock]
      const start = world.startingLocationId
      const reachNoLock = reachableFrom(start, locationId)
      if (!itemLoc)
        errors.push(
          `Lock item "${l.lock}" for "${locationId}" isn't found in any location`
        )
      else if (!reachNoLock.has(itemLoc))
        errors.push(
          `Lock item "${l.lock}" for "${locationId}" can't be reached without entering "${locationId}" (deadlock)`
        )
      const after = world.locationIds.slice(
        world.locationIds.indexOf(locationId) + 1
      )
      for (const laterId of after)
        if (reachNoLock.has(laterId))
          errors.push(
            `Lock bypass: "${laterId}" can be reached without passing the lock at "${locationId}"`
          )
    }
  }
  return errors
}
const dataValidationErrors = validateGameData()
if (typeof console !== 'undefined') {
  if (dataValidationErrors.length > 0)
    console.error('Game data validation errors:', dataValidationErrors)
  else
    console.info(
      `Whispers of the Forgotten data loaded: ${
        Object.keys(worlds).length
      } worlds, ${Object.keys(locations).length} locations.`
    )
}
