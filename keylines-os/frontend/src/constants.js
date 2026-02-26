export const categoryMap = {
  "person": "blue", 
  "mutant": "crimson",
  "planet": "green",
  "robot": "deepskyblue",
  "item": "orange",
  "entity": "purple", 
  "science": "purple",
};

export const typeColors = {
  blue: "#1976d2",
  green: "#4caf50",
  crimson: "#dc143c",
  deepskyblue: "#00bfff",
  orange: "#ff9800",
  purple: "#9c27b0",
  other: "#9e9e9e"
};

export const getHexColor = (type) => {
  const category = categoryMap[type?.toLowerCase()] || "other";
  return typeColors[category];
};
