import { NODE_CATEGORIES } from './theme';

export const categoryMap = {
  "person": "people", 
  "mutant": "mutant",
  "planet": "planet",
  "robot": "robot",
  "item": "item",
  "entity": "science", 
  "science": "science",
};

export const typeColors = {
  people: NODE_CATEGORIES.people,
  planet: NODE_CATEGORIES.planet,
  mutant: NODE_CATEGORIES.mutant,
  robot: NODE_CATEGORIES.robot,
  item: NODE_CATEGORIES.item,
  science: NODE_CATEGORIES.science,
  other: NODE_CATEGORIES.other
};

export const getHexColor = (type) => {
  const category = categoryMap[type?.toLowerCase()] || "other";
  return typeColors[category];
};
