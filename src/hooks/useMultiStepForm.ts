import { useState, useEffect, useCallback } from 'react';

export interface MultiStepFormOptions<TSteps extends string> {
  totalSteps: number;
  stepContent: Record<number, TSteps>;
  stepLabels: string[];
  initialStep?: number;
  onStepChange?: (newStep: number, direction: 'next' | 'prev' | 'direct') => void;
}

export interface MultiStepFormReturn<TSteps extends string> {
  currentStep: number;
  totalSteps: number;
  currentContent: TSteps;
  progress: number;
  stepLabels: string[];
  isFirstStep: boolean;
  isLastStep: boolean;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  setStep: (step: number) => void;
}

/**
 * Scrolls to the top of the page with cross-browser compatibility.
 * Uses requestAnimationFrame to ensure DOM has updated before scrolling.
 */
const scrollToTop = () => {
  // Use requestAnimationFrame to ensure this runs after React has updated the DOM
  requestAnimationFrame(() => {
    // Try multiple scroll methods for cross-browser compatibility
    try {
      // Smooth scroll (modern browsers)
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Fallback for older browsers
      window.scrollTo(0, 0);
    }
    
    // Also reset scroll position on document elements as fallback
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
};

/**
 * SSOT hook for managing multi-step forms.
 * Provides consistent step navigation, progress tracking, and auto-scroll behavior.
 * 
 * @example
 * const { currentStep, currentContent, nextStep, prevStep, progress } = useMultiStepForm({
 *   totalSteps: 3,
 *   stepContent: { 1: 'contact', 2: 'project', 3: 'location' },
 *   stepLabels: ['Kontakt', 'Projekt', 'Standort'],
 * });
 */
export function useMultiStepForm<TSteps extends string>(
  options: MultiStepFormOptions<TSteps>
): MultiStepFormReturn<TSteps> {
  const { totalSteps, stepContent, stepLabels, initialStep = 1, onStepChange } = options;
  
  const [currentStep, setCurrentStep] = useState(initialStep);
  
  // Auto-scroll to top whenever step changes
  useEffect(() => {
    scrollToTop();
  }, [currentStep]);
  
  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const newStep = Math.min(prev + 1, totalSteps);
      if (newStep !== prev) {
        onStepChange?.(newStep, 'next');
      }
      return newStep;
    });
  }, [totalSteps, onStepChange]);
  
  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      const newStep = Math.max(prev - 1, 1);
      if (newStep !== prev) {
        onStepChange?.(newStep, 'prev');
      }
      return newStep;
    });
  }, [onStepChange]);
  
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(prev => {
        if (step !== prev) {
          onStepChange?.(step, 'direct');
        }
        return step;
      });
    }
  }, [totalSteps, onStepChange]);
  
  // Direct setter without scroll (for recovery scenarios)
  const setStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);
  
  const currentContent = stepContent[currentStep] || stepContent[1];
  const progress = totalSteps > 1 ? ((currentStep) / totalSteps) * 100 : 100;
  
  return {
    currentStep,
    totalSteps,
    currentContent,
    progress,
    stepLabels,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps,
    nextStep,
    prevStep,
    goToStep,
    setStep,
  };
}
