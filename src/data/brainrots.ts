import type { BrainrotDef } from '../types/game.ts';
import { RARITIES, RARITY_ORDER } from './rarities.ts';

function br(id: string, name: string, rarity: BrainrotDef['rarity'], desc: string): BrainrotDef {
  const r = RARITIES[rarity];
  return {
    id, name, rarity,
    baseIncomePerSec: r.baseIncome,
    stealDifficulty: Math.ceil((RARITY_ORDER.indexOf(rarity) + 1) * 1.2),
    description: desc,
    color: r.color,
  };
}

export const ALL_BRAINROTS: BrainrotDef[] = [
  // Common (12)
  br('c01', 'Skibidi Scout',      'common', 'A basic brainrot that scouts the area.'),
  br('c02', 'Rizz Rat',           'common', 'A rat with unmatched charisma.'),
  br('c03', 'Sigma Slime',        'common', 'A lone wolf slime grinding silently.'),
  br('c04', 'Ohio Orc',           'common', 'Only in Ohio would you find this orc.'),
  br('c05', 'Fanum Tax Frog',     'common', 'Takes a bite of everything.'),
  br('c06', 'Gyatt Ghost',        'common', 'A ghost with surprising proportions.'),
  br('c07', 'Mewing Mouse',       'common', 'Practices jawline exercises daily.'),
  br('c08', 'Sussy Snail',        'common', 'Acts suspicious at all times.'),
  br('c09', 'NPC Newt',           'common', 'Repeats the same line forever.'),
  br('c10', 'Delulu Duck',        'common', 'Lives in its own reality.'),
  br('c11', 'Based Bear',         'common', 'Has all the correct opinions.'),
  br('c12', 'Cap Cat',            'common', 'Everything it says is cap.'),

  // Uncommon (10)
  br('u01', 'Sigma Wolf',         'uncommon', 'A lone wolf on the grindset.'),
  br('u02', 'Skibidi Soldier',    'uncommon', 'A trained skibidi warrior.'),
  br('u03', 'Gyatt Golem',        'uncommon', 'A golem of impressive stature.'),
  br('u04', 'Ohio Ogre',          'uncommon', 'Upgraded from orc to ogre.'),
  br('u05', 'Rizz Lord Jr',       'uncommon', 'Apprentice of the Rizz Lord.'),
  br('u06', 'Fanum Taxer',        'uncommon', 'Professionally takes bites.'),
  br('u07', 'Mewing Monk',        'uncommon', 'Achieved perfect jaw alignment.'),
  br('u08', 'Bussin Beetle',      'uncommon', 'Everything it touches is bussin.'),
  br('u09', 'Vibe Checker',       'uncommon', 'Checks your vibe on arrival.'),
  br('u10', 'Drip Demon',         'uncommon', 'Fashion sense is unmatched.'),

  // Rare (8)
  br('r01', 'Sigma Sentinel',     'rare', 'Guards the grindset with honor.'),
  br('r02', 'Skibidi Captain',    'rare', 'Commands the skibidi battalion.'),
  br('r03', 'Rizz Wizard',        'rare', 'Casts charm spells effortlessly.'),
  br('r04', 'Ohio Overlord',      'rare', 'Rules the weirdest state.'),
  br('r05', 'Gyatt Guardian',     'rare', 'Protects with overwhelming presence.'),
  br('r06', 'Mewing Master',      'rare', 'Peak jawline performance achieved.'),
  br('r07', 'Drip Dragon',        'rare', 'A dragon draped in designer.'),
  br('r08', 'Bussin Baron',       'rare', 'Noble lord of flavor town.'),

  // Epic (6)
  br('e01', 'Sigma King',         'epic', 'Rules the grindset empire.'),
  br('e02', 'Skibidi General',    'epic', 'Supreme commander of all skibidi.'),
  br('e03', 'Rizz Emperor',       'epic', 'No one can resist the charm.'),
  br('e04', 'Ohio Deity',         'epic', 'Transcended Ohio itself.'),
  br('e05', 'Gyatt Titan',        'epic', 'A titan of legendary proportions.'),
  br('e06', 'Fanum Overlord',     'epic', 'Takes the biggest bites known.'),

  // Legendary (4)
  br('l01', 'Sigma Deity',        'legendary', 'Ascended beyond the grindset.'),
  br('l02', 'Skibidi God',        'legendary', 'The ultimate skibidi entity.'),
  br('l03', 'Rizz Overlord',      'legendary', 'Maximum charisma incarnate.'),
  br('l04', 'Ohio Dimension Lord', 'legendary', 'Controls Ohio from another plane.'),

  // Mythic (3)
  br('m01', 'Sigma Multiverse',   'mythic', 'Grinds across all realities.'),
  br('m02', 'Skibidi Omni',       'mythic', 'Omnipresent skibidi energy.'),
  br('m03', 'Rizz Infinity',      'mythic', 'Infinite charm, infinite power.'),

  // God (2)
  br('g01', 'The One Sigma',      'god', 'The single ultimate sigma.'),
  br('g02', 'Skibidi Prime',      'god', 'The origin of all brainrot.'),

  // Secret (1)
  br('s01', 'The Forbidden Rot',  'secret', '???'),
];

export const BRAINROT_MAP = new Map(ALL_BRAINROTS.map(b => [b.id, b]));
