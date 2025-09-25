import React from 'react';

interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
  responsive?: boolean;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols = 1,
  gap = 'md',
  responsive = true,
  className = '',
}) => {
  const getColsClasses = () => {
    if (responsive) {
      return 'grid-responsive';
    }
    
    switch (cols) {
      case 1:
        return 'grid grid-cols-1';
      case 2:
        return 'grid grid-cols-2';
      case 3:
        return 'grid grid-cols-3';
      case 4:
        return 'grid grid-cols-4';
      case 5:
        return 'grid grid-cols-5';
      case 6:
        return 'grid grid-cols-6';
      default:
        return 'grid grid-cols-1';
    }
  };

  const getGapClasses = () => {
    switch (gap) {
      case 'sm':
        return 'gap-3';
      case 'md':
        return 'gap-6';
      case 'lg':
        return 'gap-8';
      default:
        return 'gap-6';
    }
  };

  const gridClasses = `
    ${getColsClasses()}
    ${getGapClasses()}
    ${className}
  `.trim();

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};
