// One scene unit is 4 cm: a 1.06-unit cap is 42.4 mm across.
export const METERS_PER_UNIT=.04;
// A modest gameplay easing requested after the full-scale gravity felt abrupt.
export const GRAVITY_SCALE=.56;
export const GRAVITY=9.81/METERS_PER_UNIT*GRAVITY_SCALE;
// Scale launches, impulses and damping together to preserve compact trajectories.
export const PHYSICS_RATE=Math.sqrt(GRAVITY/12);
