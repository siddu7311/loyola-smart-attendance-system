import React from 'react';

interface LoyolaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export const LoyolaLogo: React.FC<LoyolaLogoProps> = ({ 
  size = 'md', 
  className = '',
  showText = true 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Container */}
      <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
        {/* Simple Logo */}
        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-400 shadow-lg relative overflow-hidden flex items-center justify-center">
          {/* Letter L */}
          <div className="text-white font-bold text-2xl font-serif">
            L
          </div>
        </div>
      </div>
      
      {/* Text Labels */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-foreground ${textSizes[size]}`}>
            Loyola Polytechnic
          </span>
          <span className={`text-muted-foreground ${textSizes[size]}`}>
            Smart Attendance
          </span>
        </div>
      )}
    </div>
  );
};

// Alternative: Image-based logo component
export const LoyolaLogoImage: React.FC<LoyolaLogoProps> = ({ 
  size = 'md', 
  className = '',
  showText = true 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image */}
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <img 
          src="/loyola-logo.png" 
          alt="Loyola Polytechnic College Logo"
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to CSS logo if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.parentElement?.querySelector('.fallback-logo');
            if (fallback) {
              (fallback as HTMLElement).style.display = 'block';
            }
          }}
        />
        {/* Fallback CSS Logo */}
        <div className="fallback-logo hidden">
          <LoyolaLogo size={size} showText={false} />
        </div>
      </div>
      
      {/* Text Labels */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-foreground ${textSizes[size]}`}>
            Loyola Polytechnic
          </span>
          <span className={`text-muted-foreground ${textSizes[size]}`}>
            Smart Attendance
          </span>
        </div>
      )}
    </div>
  );
};
