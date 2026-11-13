// One scene unit is 4 cm: a 1.06-unit cap is 42.4 mm across.
export const METERS_PER_UNIT=.04;
export const GRAVITY=9.81/METERS_PER_UNIT;
// Retain compact launch paths while correcting their old low-gravity timing.
export const PHYSICS_RATE=Math.sqrt(GRAVITY/12);
