import { useState, useCallback } from 'react';

export interface ProposalFormValues {
  price_min: string;
  price_max: string;
  message: string;
  estimated_duration_days: string;
}

export interface ProposalFormErrors {
  price_min: string | null;
  price_max: string | null;
  message: string | null;
  estimated_duration_days: string | null;
}

export interface ProposalFormTouched {
  price_min: boolean;
  price_max: boolean;
  message: boolean;
  estimated_duration_days: boolean;
}

const initialErrors: ProposalFormErrors = {
  price_min: null,
  price_max: null,
  message: null,
  estimated_duration_days: null,
};

const initialTouched: ProposalFormTouched = {
  price_min: false,
  price_max: false,
  message: false,
  estimated_duration_days: false,
};

export function useProposalFormValidation(formValues: ProposalFormValues) {
  const [errors, setErrors] = useState<ProposalFormErrors>(initialErrors);
  const [touched, setTouched] = useState<ProposalFormTouched>(initialTouched);

  const validateField = useCallback((field: keyof ProposalFormValues, values: ProposalFormValues): string | null => {
    switch (field) {
      case 'price_min': {
        if (!values.price_min) {
          return 'Mindestpreis ist erforderlich';
        }
        const val = parseInt(values.price_min);
        if (isNaN(val) || val < 0) {
          return 'Preis darf nicht negativ sein';
        }
        return null;
      }
      case 'price_max': {
        if (!values.price_max) {
          return 'Maximalpreis ist erforderlich';
        }
        const max = parseInt(values.price_max);
        const min = parseInt(values.price_min);
        if (isNaN(max) || max < 0) {
          return 'Preis darf nicht negativ sein';
        }
        if (!isNaN(min) && max < min) {
          return 'Maximalpreis muss >= Mindestpreis sein';
        }
        return null;
      }
      case 'message': {
        if (!values.message) {
          return 'Nachricht ist erforderlich';
        }
        if (values.message.length < 50) {
          return `Noch ${50 - values.message.length} Zeichen erforderlich`;
        }
        if (values.message.length > 2000) {
          return 'Maximal 2000 Zeichen erlaubt';
        }
        return null;
      }
      case 'estimated_duration_days': {
        if (values.estimated_duration_days) {
          const val = parseInt(values.estimated_duration_days);
          if (isNaN(val) || val <= 0) {
            return 'Dauer muss mindestens 1 Tag sein';
          }
        }
        return null;
      }
      default:
        return null;
    }
  }, []);

  const handleBlur = useCallback((field: keyof ProposalFormValues) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formValues);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [formValues, validateField]);

  const validateAll = useCallback((): boolean => {
    const newErrors: ProposalFormErrors = {
      price_min: validateField('price_min', formValues),
      price_max: validateField('price_max', formValues),
      message: validateField('message', formValues),
      estimated_duration_days: validateField('estimated_duration_days', formValues),
    };
    
    setErrors(newErrors);
    setTouched({
      price_min: true,
      price_max: true,
      message: true,
      estimated_duration_days: true,
    });

    return !Object.values(newErrors).some(error => error !== null);
  }, [formValues, validateField]);

  const resetValidation = useCallback(() => {
    setErrors(initialErrors);
    setTouched(initialTouched);
  }, []);

  const isValid = !Object.values(errors).some(error => error !== null);

  return {
    errors,
    touched,
    handleBlur,
    validateAll,
    resetValidation,
    isValid,
  };
}
