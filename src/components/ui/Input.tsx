import React from 'react';
import { IonItem, IonLabel, IonInput, IonTextarea } from '@ionic/react';

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  type = 'text',
  multiline = false,
  rows = 3,
  disabled = false,
  required = false,
  error,
  onChange,
  className = '',
}) => {
  const getInputClasses = () => {
    const baseClasses = 'input';
    const errorClasses = error ? 'input-error' : '';
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

    return `${baseClasses} ${errorClasses} ${disabledClasses} ${className}`.trim();
  };

  const handleInputChange = (event: CustomEvent) => {
    if (onChange) {
      onChange(event.detail.value || '');
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <IonLabel className="text-body font-semibold text-neutral-800">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </IonLabel>
      )}

      <IonItem className="--background: transparent; --border-color: transparent; --padding-start: 0; --padding-end: 0;">
        {multiline ? (
          <IonTextarea
            className={getInputClasses()}
            placeholder={placeholder}
            value={value}
            rows={rows}
            disabled={disabled}
            onIonInput={handleInputChange}
          />
        ) : (
          <IonInput
            className={getInputClasses()}
            type={type}
            placeholder={placeholder}
            value={value}
            disabled={disabled}
            onIonInput={handleInputChange}
          />
        )}
      </IonItem>

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};
