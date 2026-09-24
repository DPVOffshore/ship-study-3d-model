// Camera presets: [camera position, target, forceXray?]
export type View = [[number, number, number], [number, number, number], boolean?];
export const SHIP_VIEWS: Record<string, View> = {
  'Bow three-quarter': [[150, 40, 90], [40, 16, 0]],
  'Stern three-quarter': [[-170, 42, -90], [-55, 16, 0]],
  Profile: [[-4, 18, 250], [-4, 18, 0]],
  Plan: [[-4, 300, 0.1], [-4, 0, 0]],
  'Engine room': [[-52, 12, 38], [-68, 8, 0], true],
  'Midship section': [[60, 12, 0.1], [0, 9, 0], true],
  Bridge: [[-38, 48, 42], [-78, 38, 0]],
  Forecastle: [[64, 34, 28], [82, 20, 0]],
};
export const ENG_VIEWS: Record<string, View> = {
  'Exhaust side': [[3, 6, 17], [-0.8, 5, 0]],
  'Manoeuvring side': [[4, 7, -16], [-0.5, 5, 0]],
  'Running gear': [[2.2, 3.4, 7.5], [1.0, 2.6, 0]],
  'Cylinder top': [[4, 12.5, 5], [1, 9.5, 0]],
  Turbocharger: [[-9, 11, 8], [-5.6, 8.5, 2.6]],
  'Aft end and HPS': [[-11, 6, -8], [-4.6, 4, -1]],
  'Fore end': [[10, 5, 3], [2.5, 4, 0]],
};
export const DEFAULT_VIEW = { ship: 'Bow three-quarter', engine: 'Exhaust side' } as const;
