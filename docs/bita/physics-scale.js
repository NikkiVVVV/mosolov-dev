// One scene unit is 4 cm: a 1.06-unit cap is 42.4 mm across.
export const METERS_PER_UNIT=.04;
// User-selected gravity: 95% of terrestrial acceleration at the real cap scale.
export const GRAVITY_SCALE=.95;
export const GRAVITY=9.81/METERS_PER_UNIT*GRAVITY_SCALE;
// Scale launches, impulses and damping together to preserve compact trajectories.
export const PHYSICS_RATE=Math.sqrt(GRAVITY/12);
