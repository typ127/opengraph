import { NODE_CATEGORIES } from './theme';

export const categoryMap = {
  "person": "person", 
  "mutant": "mutant",
  "planet": "planet",
  "robot": "robot",
  "item": "item",
  "entity": "science", 
  "science": "science",
};

export const typeColors = {
  person: NODE_CATEGORIES.person,
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
