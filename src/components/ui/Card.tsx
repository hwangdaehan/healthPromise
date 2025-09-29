import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  variant?: 'default' | 'compact' | 'elevated';
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  variant = 'default',
  className = '',
  onClick,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'card-compact';
      case 'elevated':
        return 'card shadow-strong';
      default:
        return 'card';
    }
  };

  const getClickableClass = () => {
    return onClick ? 'cursor-pointer' : '';
  };

  const cardClasses = `
    ${getVariantClasses()}
    ${getClickableClass()}
    ${className}
  `.trim();

  return (
    <IonCard className={cardClasses} onClick={onClick}>
      {title && (
        <IonCardHeader>
          <IonCardTitle className="text-subheading">{title}</IonCardTitle>
        </IonCardHeader>
      )}
      <IonCardContent className="p-0">{children}</IonCardContent>
    </IonCard>
  );
};
