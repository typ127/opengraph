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
  people: "#1976d2",
  planet: "#4caf50",
  mutant: "#dc143c",
  robot: "#00bfff",
  item: "#ff9800",
  science: "#9c27b0",
  other: "#9e9e9e"
};

export const getHexColor = (type) => {
  const category = categoryMap[type?.toLowerCase()] || "other";
  return typeColors[category];
};
