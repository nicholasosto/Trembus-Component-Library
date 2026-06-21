import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import './Card.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a hover affordance (pair with an interactive child or wrap in a link). */
  interactive?: boolean;
}

function CardRoot({ interactive = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cx('tcl-card', interactive && 'tcl-card--interactive', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

function CardHeader({ className, children, ...rest }: CardSectionProps) {
  return (
    <div className={cx('tcl-card__header', className)} {...rest}>
      {children}
    </div>
  );
}

function CardBody({ className, children, ...rest }: CardSectionProps) {
  return (
    <div className={cx('tcl-card__body', className)} {...rest}>
      {children}
    </div>
  );
}

function CardFooter({ className, children, ...rest }: CardSectionProps) {
  return (
    <div className={cx('tcl-card__footer', className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * `Card` — a raised surface that groups related content into one perceivable
 * unit. Compound API: `<Card><Card.Header/><Card.Body/><Card.Footer/></Card>`.
 */
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
