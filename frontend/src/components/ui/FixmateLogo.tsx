import React from 'react';

interface ArtifixLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  theme?: 'auto' | 'dark' | 'light';
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 48,
};

export const ArtifixLogoMark: React.FC<{ size?: number | 'sm' | 'md' | 'lg' | 'xl'; className?: string; theme?: 'auto' | 'dark' | 'light' }> = ({
  size = 'md',
  className = '',
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];

  return (
    <img
      src="/brand/artifix-icon-transparent.png"
      alt="Artifix"
      width={pixelSize}
      height={pixelSize}
      className={`shrink-0 object-contain transition-transform duration-200 ${className}`}
    />
  );
};

export const ArtifixLogo: React.FC<ArtifixLogoProps> = ({
  size = 'md',
  className = '',
  showWordmark = true,
  wordmarkClassName = '',
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <ArtifixLogoMark size={size} />

      {/* Wordmark */}
      {showWordmark && (
        <div className={`flex flex-col leading-none ${wordmarkClassName}`}>
          <div className="flex items-center text-stone-900 dark:text-white font-extrabold tracking-tight text-lg">
            <span>Arti</span>
            <span className="text-[#BD5324] dark:text-[#E07A4B]">fix</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Aliases for seamless backward compatibility across the codebase
export const FixmateLogoMark = ArtifixLogoMark;
export const FixmateLogo = ArtifixLogo;
export default ArtifixLogo;
