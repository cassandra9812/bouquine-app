export const CONDITIONS = ["Comme neuf", "Bon état", "État correct", "Usé"];

export const FORMATS = [
  { value: "Poche (léger)", shippingSuggestion: 4.0 },
  { value: "Format standard / broché", shippingSuggestion: 6.0 },
  { value: "Couverture rigide / grand format", shippingSuggestion: 9.0 },
];

export const PROVINCES = [
  "Québec",
  "Ontario",
  "Colombie-Britannique",
  "Alberta",
  "Manitoba",
  "Saskatchewan",
  "Nouvelle-Écosse",
  "Nouveau-Brunswick",
  "Terre-Neuve-et-Labrador",
  "Île-du-Prince-Édouard",
];

export const MIN_PRICE = 3;

export function suggestedShippingFor(format) {
  return FORMATS.find((f) => f.value === format)?.shippingSuggestion ?? 6.0;
}
