'use client';

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import {
  fadeUpHidden,
  fadeUpVisible,
  fadeInHidden,
  fadeInVisible,
  scaleInHidden,
  scaleInVisible,
  revealTransition,
  staggerContainer,
  staggerItem,
} from './motion';

type RevealVariant = 'fade-up' | 'fade-in' | 'scale-in';

const VARIANTS: Record<RevealVariant, { hidden: object; visible: object }> = {
  'fade-up': { hidden: fadeUpHidden, visible: fadeUpVisible },
  'fade-in': { hidden: fadeInHidden, visible: fadeInVisible },
  'scale-in': { hidden: scaleInHidden, visible: scaleInVisible },
};

type ScrollRevealProps = HTMLMotionProps<'div'> & {
  delay?: number;
  variant?: RevealVariant;
  amount?: number;
};

export function ScrollReveal({
  children,
  delay = 0,
  variant = 'fade-up',
  amount = 0.12,
  className,
  ...rest
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();
  const v = VARIANTS[variant];

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : v.hidden}
      whileInView={reduceMotion ? undefined : v.visible}
      viewport={{ once: true, amount, margin: '-48px 0px' }}
      transition={revealTransition(delay)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerReveal({
  children,
  className,
  amount = 0.1,
}: {
  children: React.ReactNode;
  className?: string;
  amount?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount, margin: '-40px 0px' }}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  className = '',
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}) {
  return (
    <ScrollReveal className={className}>
      <h2 className="font-[family-name:var(--font-space)] text-3xl font-bold sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-3 max-w-2xl text-white/55">{subtitle}</p> : null}
    </ScrollReveal>
  );
}
