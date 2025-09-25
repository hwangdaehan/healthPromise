import React from 'react';
import { IonButton } from '@ionic/react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: (e?: any) => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'btn-primary';
      case 'secondary':
        return 'btn-secondary';
      case 'outline':
        return 'btn-outline';
      case 'ghost':
        return 'btn-ghost';
      default:
        return 'btn-primary';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'py-2 px-4 text-sm';
      case 'md':
        return 'py-3 px-6 text-base';
      case 'lg':
        return 'py-4 px-8 text-lg';
      default:
        return 'py-3 px-6 text-base';
    }
  };

  const getFullWidthClass = () => {
    return fullWidth ? 'w-full' : '';
  };

  const getDisabledClass = () => {
    return disabled ? 'opacity-50 cursor-not-allowed' : '';
  };

  const buttonClasses = `
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${getFullWidthClass()}
    ${getDisabledClass()}
    ${className}
  `.trim();

  return (
    <IonButton
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      type={type}
      fill="clear"
    >
      {children}
    </IonButton>
  );
};
