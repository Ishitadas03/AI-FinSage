import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface FinSageLogoProps {
  /**
   * Layout format:
   * - 'horizontal': Horizontal lockup (Emblem + Wordmark) — Recommended for Navbars & Topbars
   * - 'full': Stacked emblem + Wordmark + Tagline — Recommended for Splash & Auth hero panels
   * - 'compact': Compact horizontal emblem + Wordmark
   * - 'icon': Standalone Emblem icon — Recommended for Favicons, Avatars, Bottom Nav & tight spaces
   * - 'wordmark': Wordmark only ('FinSage')
   */
  variant?: 'horizontal' | 'full' | 'compact' | 'icon' | 'wordmark';

  /**
   * Background theme compatibility:
   * - 'light': Navy "Fin" + Emerald "Sage" for light backgrounds (default)
   * - 'dark': White "Fin" + Emerald "Sage" for dark backgrounds
   * - 'auto': Uses CSS media queries / dark mode classes
   */
  theme?: 'light' | 'dark' | 'auto';

  /**
   * Explicit height (number in px or CSS string). Default depends on variant.
   */
  height?: number | string;

  /**
   * Explicit width (number in px or CSS string).
   */
  width?: number | string;

  /**
   * Custom CSS class names applied to the container
   */
  className?: string;

  /**
   * Custom image CSS class name
   */
  imageClassName?: string;

  /**
   * When provided, wraps the logo inside a clickable React Router Link
   */
  href?: string;

  /**
   * Image alt text (defaults to "FinSage")
   */
  alt?: string;

  /**
   * Priority loading for above-the-fold brand elements
   */
  priority?: boolean;

  /**
   * Optional click handler
   */
  onClick?: () => void;
}

export const FinSageLogo: React.FC<FinSageLogoProps> = ({
  variant = 'horizontal',
  theme = 'light',
  height,
  width,
  className,
  imageClassName,
  href,
  alt = 'FinSage — Smart Personal Finance Copilot',
  priority = true,
  onClick,
}) => {
  const BRAND_ASSET_VERSION = 'v=5.0.0';

  // Determine asset source based on variant & theme
  const getAssetSrc = (isDark: boolean = false): string => {
    switch (variant) {
      case 'icon':
        return `/images/finsage-emblem.png?${BRAND_ASSET_VERSION}`;
      case 'wordmark':
        return isDark ? `/images/finsage-wordmark-dark.png?${BRAND_ASSET_VERSION}` : `/images/finsage-wordmark.png?${BRAND_ASSET_VERSION}`;
      case 'full':
        return `/images/finsage-logo.png?${BRAND_ASSET_VERSION}`;
      case 'compact':
      case 'horizontal':
      default:
        return isDark ? `/images/finsage-logo-horizontal-dark.png?${BRAND_ASSET_VERSION}` : `/images/finsage-logo-horizontal.png?${BRAND_ASSET_VERSION}`;
    }
  };

  // Default dimensions per variant
  const getDefaultDimensions = () => {
    switch (variant) {
      case 'icon':
        return { height: height ?? 36, width: width ?? 36 };
      case 'wordmark':
        return { height: height ?? 28, width: width ?? 'auto' };
      case 'full':
        return { height: height ?? 140, width: width ?? 'auto' };
      case 'compact':
        return { height: height ?? 32, width: width ?? 'auto' };
      case 'horizontal':
      default:
        return { height: height ?? 38, width: width ?? 'auto' };
    }
  };

  const dims = getDefaultDimensions();
  const formatDim = (val?: number | string) => (typeof val === 'number' ? `${val}px` : val);

  const style: React.CSSProperties = {
    height: formatDim(dims.height),
    width: formatDim(dims.width),
    maxHeight: '100%',
  };

  const renderImage = () => {
    if (theme === 'auto') {
      return (
        <>
          <img
            src={getAssetSrc(false)}
            alt={alt}
            style={style}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={cn('block dark:hidden object-contain select-none', imageClassName)}
          />
          <img
            src={getAssetSrc(true)}
            alt={alt}
            style={style}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={cn('hidden dark:block object-contain select-none', imageClassName)}
          />
        </>
      );
    }

    const isDark = theme === 'dark';
    return (
      <img
        src={getAssetSrc(isDark)}
        alt={alt}
        style={style}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={cn('object-contain select-none', imageClassName)}
      />
    );
  };

  const content = (
    <div
      className={cn('inline-flex items-center justify-center shrink-0 transition-opacity hover:opacity-95', className)}
      onClick={onClick}
    >
      {renderImage()}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="inline-flex items-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
};

export default FinSageLogo;
