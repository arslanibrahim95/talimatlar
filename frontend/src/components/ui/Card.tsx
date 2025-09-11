import React from 'react';
import { cn } from '../../utils/cn';
import { THEME_COLORS } from '../../constants/colors';
import { COMPONENT_SPACING } from '../../constants/spacing';
import { COMPONENT_TYPOGRAPHY } from '../../constants/typography';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className, ...props }) => (
  <div
    className={cn(
      "rounded-2xl border backdrop-blur-xl shadow-glass transition-all duration-300 hover:shadow-glass-strong hover:scale-[1.01]",
      THEME_COLORS.background.glass,
      className
    )}
    {...props}
  />
);

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader: React.FC<CardHeaderProps> = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col space-y-1.5", COMPONENT_SPACING.card.headerPadding, className)}
    {...props}
  />
);

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle: React.FC<CardTitleProps> = ({ className, ...props }) => (
  <h3
    className={cn(
      COMPONENT_TYPOGRAPHY.card.title,
      className
    )}
    {...props}
  />
);

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription: React.FC<CardDescriptionProps> = ({ className, ...props }) => (
  <p
    className={cn(COMPONENT_TYPOGRAPHY.card.description, THEME_COLORS.text.secondary, className)}
    {...props}
  />
);

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent: React.FC<CardContentProps> = ({ className, ...props }) => (
  <div className={cn(COMPONENT_SPACING.card.contentPadding, className)} {...props} />
);

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter: React.FC<CardFooterProps> = ({ className, ...props }) => (
  <div className={cn("flex items-center", COMPONENT_SPACING.card.footerPadding, className)} {...props} />
);
