// Maps an Apple Music genre to how the hero scene moves.
// Last.fm has no audio features, so genre is the best signal for energy and tempo.
export const MOODS = {
  hype: { name: 'hype', bpm: 126, energy: 1 },
  pop: { name: 'pop', bpm: 108, energy: 0.7 },
  chill: { name: 'chill', bpm: 84, energy: 0.4 },
  calm: { name: 'calm', bpm: 64, energy: 0.2 }
};

const RULES = [
  [/rock|metal|punk|hip.?hop|rap|dance|electronic|edm|house|techno|trap|drum|dubstep|hard/i, 'hype'],
  [/classical|soundtrack|score|new age|instrumental|devotional|spiritual|ambient|meditat|piano/i, 'calm'],
  [/r&b|soul|indie|alternative|lo.?fi|singer|jazz|acoustic|folk|country|blues|chill|reggae/i, 'chill'],
  [/pop|latin|k-pop|bollywood|indian|punjabi|world/i, 'pop']
];

export function moodForGenre(genre) {
  const match = RULES.find(([pattern]) => pattern.test(genre || ''));
  return MOODS[match ? match[1] : 'pop'];
}
