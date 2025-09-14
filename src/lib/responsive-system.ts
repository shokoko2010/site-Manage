// Responsive Design System Utilities
// Mobile-first approach with breakpoints and touch-friendly utilities

import * as React from "react"

// Breakpoint Configuration
export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Responsive Container Classes
export const containerClasses = {
  default: 'w-full px-4 sm:px-6 lg:px-8',
  narrow: 'w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto',
  wide: 'w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto',
  full: 'w-full',
} as const;

// Grid System
export const gridClasses = {
  // Standard grids
  cols1: 'grid grid-cols-1',
  cols2: 'grid grid-cols-1 sm:grid-cols-2',
  cols3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  cols4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  cols12: 'grid grid-cols-12',
  
  // Responsive gaps
  gap2: 'gap-2 sm:gap-3 lg:gap-4',
  gap4: 'gap-4 sm:gap-6 lg:gap-8',
  gap6: 'gap-6 sm:gap-8 lg:gap-12',
  
  // Flexbox utilities
  flexCol: 'flex flex-col',
  flexRow: 'flex flex-col sm:flex-row',
  flexColReverse: 'flex flex-col-reverse sm:flex-row',
  flexRowReverse: 'flex flex-col sm:flex-row-reverse',
} as const;

// Typography Scale (Responsive)
export const typographyClasses = {
  // Headings
  h1: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight',
  h2: 'text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight',
  h3: 'text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight',
  h4: 'text-lg sm:text-xl md:text-2xl font-semibold tracking-tight',
  h5: 'text-base sm:text-lg md:text-xl font-semibold tracking-tight',
  h6: 'text-sm sm:text-base md:text-lg font-semibold tracking-tight',
  
  // Body text
  bodyXs: 'text-xs sm:text-sm',
  bodySm: 'text-sm sm:text-base',
  bodyBase: 'text-base sm:text-lg',
  bodyLg: 'text-lg sm:text-xl',
  bodyXl: 'text-xl sm:text-2xl',
  
  // Responsive line heights
  leadingTight: 'leading-tight sm:leading-snug',
  leadingNormal: 'leading-normal sm:leading-relaxed',
  leadingRelaxed: 'leading-relaxed sm:leading-loose',
} as const;

// Spacing Scale (Responsive)
export const spacingClasses = {
  // Padding
  p0: 'p-0',
  p1: 'p-1 sm:p-2',
  p2: 'p-2 sm:p-3 md:p-4',
  p3: 'p-3 sm:p-4 md:p-6 lg:p-8',
  p4: 'p-4 sm:p-6 md:p-8 lg:p-12',
  
  // Margin
  m0: 'm-0',
  m1: 'm-1 sm:m-2',
  m2: 'm-2 sm:m-3 md:m-4',
  m3: 'm-3 sm:m-4 md:m-6 lg:m-8',
  m4: 'm-4 sm:m-6 md:m-8 lg:m-12',
  
  // Gap
  gap0: 'gap-0',
  gap1: 'gap-1 sm:gap-2',
  gap2: 'gap-2 sm:gap-3 md:gap-4',
  gap3: 'gap-3 sm:gap-4 md:gap-6 lg:gap-8',
  gap4: 'gap-4 sm:gap-6 md:gap-8 lg:gap-12',
} as const;

// Touch-Friendly Utilities
export const touchClasses = {
  // Minimum touch targets (44px)
  touchTarget: 'min-h-[44px] min-w-[44px]',
  touchTargetSm: 'min-h-[36px] min-w-[36px]',
  touchTargetLg: 'min-h-[52px] min-w-[52px]',
  
  // Touch-friendly spacing
  touchPadding: 'p-3 sm:p-4',
  touchMargin: 'm-2 sm:m-3',
  touchGap: 'gap-3 sm:gap-4',
  
  // Touch-friendly buttons
  touchButton: 'px-4 py-3 sm:px-6 sm:py-3 text-sm sm:text-base',
  touchButtonSm: 'px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm',
  touchButtonLg: 'px-6 py-4 sm:px-8 sm:py-4 text-base sm:text-lg',
  
  // Touch-friendly inputs
  touchInput: 'px-4 py-3 sm:px-4 sm:py-3 text-sm sm:text-base',
  touchInputSm: 'px-3 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm',
  touchInputLg: 'px-6 py-4 sm:px-6 sm:py-4 text-base sm:text-lg',
} as const;

// Responsive Card Classes
export const cardClasses = {
  base: 'bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200',
  responsive: 'w-full p-4 sm:p-6 lg:p-8',
  compact: 'w-full p-3 sm:p-4',
  spacious: 'w-full p-6 sm:p-8 lg:p-12',
  
  // Grid cards
  gridCard: 'w-full p-4 sm:p-6',
  listCard: 'w-full p-3 sm:p-4',
} as const;

// Responsive Form Classes
export const formClasses = {
  container: 'w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto',
  group: 'space-y-4 sm:space-y-6',
  label: 'text-sm font-medium text-foreground mb-1 sm:mb-2 block',
  input: 'w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary',
  inputError: 'w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-destructive rounded-lg focus:ring-2 focus:ring-destructive focus:border-destructive',
  button: 'w-full px-4 py-3 sm:px-6 sm:py-3 text-sm sm:text-base font-medium rounded-lg transition-colors',
  buttonSm: 'px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors',
  buttonLg: 'px-6 py-4 sm:px-8 sm:py-4 text-base sm:text-lg font-medium rounded-lg transition-colors',
} as const;

// Responsive Navigation Classes
export const navClasses = {
  container: 'w-full px-4 sm:px-6 lg:px-8',
  mobileMenu: 'sm:hidden fixed inset-0 bg-background/95 backdrop-blur-sm z-50',
  desktopMenu: 'hidden sm:flex items-center space-x-4 lg:space-x-6',
  mobileButton: 'sm:hidden p-2',
  desktopButton: 'hidden sm:block',
  responsiveNav: 'flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-6',
} as const;

// Responsive Table Classes
export const tableClasses = {
  container: 'w-full overflow-x-auto',
  table: 'w-full min-w-full',
  header: 'bg-muted/50',
  row: 'border-b hover:bg-muted/50 transition-colors',
  cell: 'px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base',
  headerCell: 'px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider',
  compactCell: 'px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm',
  compactHeaderCell: 'px-2 py-1 sm:px-3 sm:py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider',
} as const;

// Responsive Modal Classes
export const modalClasses = {
  container: 'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8',
  overlay: 'fixed inset-0 bg-black/50 backdrop-blur-sm',
  content: 'relative w-full max-w-md sm:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border rounded-xl shadow-xl',
  header: 'sticky top-0 bg-background border-b border-border p-4 sm:p-6',
  body: 'p-4 sm:p-6',
  footer: 'sticky bottom-0 bg-background border-t border-border p-4 sm:p-6',
  closeButton: 'absolute top-2 right-2 sm:top-4 sm:right-4 p-2 rounded-lg hover:bg-muted transition-colors',
} as const;

// Responsive Utility Classes
export const utilityClasses = {
  // Hide/Show
  hideMobile: 'hidden sm:block',
  showMobile: 'sm:hidden',
  hideTablet: 'hidden lg:block',
  showTablet: 'lg:hidden',
  hideDesktop: 'hidden xl:block',
  showDesktop: 'xl:hidden',
  
  // Text alignment
  textAlignLeft: 'text-left sm:text-center lg:text-left',
  textAlignCenter: 'text-center',
  textAlignRight: 'text-right sm:text-center lg:text-right',
  
  // Responsive widths
  fullWidth: 'w-full',
  maxWidthSm: 'max-w-sm',
  maxWidthMd: 'max-w-md',
  maxWidthLg: 'max-w-lg',
  maxWidthXl: 'max-w-xl',
  maxWidth2xl: 'max-w-2xl',
  maxWidthFull: 'max-w-full',
  
  // Responsive heights
  fullHeight: 'h-full',
  minHeightScreen: 'min-h-screen',
  minHeightScreenSm: 'min-h-[50vh]',
  minHeightScreenMd: 'min-h-[75vh]',
  
  // Responsive overflow
  overflowAuto: 'overflow-auto',
  overflowHidden: 'overflow-hidden',
  overflowXAuto: 'overflow-x-auto',
  overflowYAuto: 'overflow-y-auto',
  
  // Responsive positioning
  relative: 'relative',
  absolute: 'absolute',
  fixed: 'fixed',
  sticky: 'sticky',
} as const;

// Responsive Animation Classes
export const animationClasses = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  slideLeft: 'animate-slide-left',
  slideRight: 'animate-slide-right',
  scaleIn: 'animate-scale-in',
  
  // Responsive delays
  delay100: 'delay-100',
  delay200: 'delay-200',
  delay300: 'delay-300',
  delay500: 'delay-500',
  
  // Responsive durations
  durationFast: 'duration-150',
  durationNormal: 'duration-300',
  durationSlow: 'duration-500',
} as const;

// Helper functions for responsive utilities
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Responsive breakpoint checker hook (for client-side)
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState<string>('xs');
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint('xs');
      else if (width < 768) setBreakpoint('sm');
      else if (width < 1024) setBreakpoint('md');
      else if (width < 1280) setBreakpoint('lg');
      else if (width < 1536) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };
    
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  return breakpoint;
};

// Mobile detection hook
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

// Touch detection hook
export const useIsTouch = () => {
  const [isTouch, setIsTouch] = React.useState(false);
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  
  return isTouch;
};

// Export all classes as a single object for convenience
export const responsive = {
  breakpoints,
  container: containerClasses,
  grid: gridClasses,
  typography: typographyClasses,
  spacing: spacingClasses,
  touch: touchClasses,
  card: cardClasses,
  form: formClasses,
  nav: navClasses,
  table: tableClasses,
  modal: modalClasses,
  utility: utilityClasses,
  animation: animationClasses,
  cn,
  useBreakpoint,
  useIsMobile,
  useIsTouch,
} as const;