import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

export interface MultiStepProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  progress: number;
  className?: string;
  /** Optional: Show completed checkmarks for past steps */
  showCheckmarks?: boolean;
}

/**
 * SSOT component for displaying multi-step form progress.
 * Provides consistent progress indication across all multi-step forms.
 */
export const MultiStepProgress: React.FC<MultiStepProgressProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
  progress,
  className,
  showCheckmarks = false,
}) => {
  return (
    <div className={cn("mb-6 sm:mb-8", className)}>
      {/* Progress header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-medium">
          Schritt {currentStep} von {totalSteps}
        </span>
        <span className="text-xs sm:text-sm text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Step labels */}
      <div className="flex justify-between mt-2 text-[10px] sm:text-xs text-muted-foreground">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;
          
          return (
            <span 
              key={label} 
              className={cn(
                "flex items-center gap-1 transition-colors",
                isCurrent && "text-primary font-medium",
                isCompleted && "text-primary/70"
              )}
            >
              {showCheckmarks && isCompleted && (
                <CheckCircle className="h-3 w-3" />
              )}
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
};
