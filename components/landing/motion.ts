/** Motion tokens — Emil Kowalski / UI UX Pro Max aligned */

export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

export const DURATION_FAST = 0.16;
export const DURATION_BASE = 0.26;
export const DURATION_SLOW = 0.4;

export const STAGGER_CHILD = 0.05;

export const fadeUpHidden = { opacity: 0, y: 18 };
export const fadeUpVisible = { opacity: 1, y: 0 };

export const fadeInHidden = { opacity: 0 };
export const fadeInVisible = { opacity: 1 };

export const scaleInHidden = { opacity: 0, scale: 0.96 };
export const scaleInVisible = { opacity: 1, scale: 1 };

export function revealTransition(delay = 0, duration = DURATION_BASE) {
  return { duration, delay, ease: EASE_OUT };
}

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: STAGGER_CHILD, delayChildren: 0.04 },
  },
};

export const staggerItem = {
  hidden: fadeUpHidden,
  visible: {
    ...fadeUpVisible,
    transition: { duration: DURATION_BASE, ease: EASE_OUT },
  },
};
