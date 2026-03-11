import React, { createContext, useContext } from 'react';
import { useBillingSettings, type BillingSettings, BILLING_DEFAULTS } from '@/hooks/useBillingSettings';

interface BillingSettingsContextValue {
  settings: BillingSettings;
  isLoading: boolean;
}

const BillingSettingsContext = createContext<BillingSettingsContextValue>({
  settings: BILLING_DEFAULTS,
  isLoading: true,
});

export const BillingSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading } = useBillingSettings();

  return (
    <BillingSettingsContext.Provider value={{
      settings: data ?? BILLING_DEFAULTS,
      isLoading,
    }}>
      {children}
    </BillingSettingsContext.Provider>
  );
};

export const useBillingContext = () => useContext(BillingSettingsContext);
