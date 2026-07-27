import { describe, expect, it } from 'vitest';
import { mapZefixCompanyToProfile, type ZefixCompany } from './zefix';
import { normalizeUid, uidDigits, isValidUid } from './validationHelpers';
import { legalFormFromZefix, getLegalFormLabel } from '@/config/legalForms';

const company = (overrides: Partial<ZefixCompany> = {}): ZefixCompany => ({
  uid: 'CHE-105.805.017',
  name: 'Muster Handwerk GmbH',
  legalFormId: 6,
  legalFormName: 'Gesellschaft mit beschränkter Haftung (GmbH)',
  status: 'ACTIVE',
  isActive: true,
  legalSeat: 'Zürich',
  street: 'Musterstrasse 1',
  zip: '8000',
  city: 'Zürich',
  chid: 'CH-020.4.061.234-5',
  ehraid: 1234567,
  registryUrl: null,
  fetchedAt: '2026-07-27T00:00:00.000Z',
  ...overrides,
});

describe('normalizeUid', () => {
  it('canonicalizes every common UID spelling', () => {
    for (const input of ['CHE-105.805.017', 'che105805017', 'CHE 105 805 017', '105805017']) {
      expect(normalizeUid(input)).toBe('CHE-105.805.017');
    }
  });

  it('leaves incomplete input intact apart from the prefix', () => {
    expect(normalizeUid('che-105.805')).toBe('CHE-105.805');
    expect(normalizeUid('   ')).toBeNull();
    expect(normalizeUid(null)).toBeNull();
  });

  it('recognizes complete UIDs only', () => {
    expect(uidDigits('CHE-105.805.017')).toBe('105805017');
    expect(isValidUid('CHE-105.805')).toBe(false);
  });
});

describe('legalFormFromZefix', () => {
  it('maps the Zefix legal form name', () => {
    expect(legalFormFromZefix('Aktiengesellschaft')).toBe('ag');
    expect(legalFormFromZefix('Gesellschaft mit beschränkter Haftung')).toBe('gmbh');
    expect(legalFormFromZefix('Einzelunternehmen')).toBe('einzelfirma');
    expect(legalFormFromZefix('Genossenschaft')).toBe('genossenschaft');
  });

  it('prefers the compound form over the plain one it contains', () => {
    expect(legalFormFromZefix('Kommanditaktiengesellschaft')).toBe('kommanditgesellschaft');
    expect(legalFormFromZefix('Kollektivgesellschaft')).toBe('kollektivgesellschaft');
  });

  it('falls back to the company name suffix', () => {
    expect(legalFormFromZefix(null, 'Muster Handwerk GmbH')).toBe('gmbh');
    expect(legalFormFromZefix(null, 'Muster Bau AG')).toBe('ag');
    expect(legalFormFromZefix(null, 'Muster Handwerk')).toBeNull();
  });

  it('labels every option', () => {
    expect(getLegalFormLabel('gmbh')).toBe('GmbH');
    expect(getLegalFormLabel(null)).toBe('');
  });
});

describe('mapZefixCompanyToProfile', () => {
  it('maps a Zefix record onto profile columns', () => {
    expect(mapZefixCompanyToProfile(company())).toEqual({
      company_name: 'Muster Handwerk GmbH',
      company_legal_form: 'gmbh',
      uid_number: 'CHE-105.805.017',
      business_address: 'Musterstrasse 1',
      business_zip: '8000',
      business_city: 'Zürich',
      business_canton: 'ZH',
    });
  });

  it('derives the canton from the postal code and tolerates missing data', () => {
    const mapped = mapZefixCompanyToProfile(
      company({ uid: null, legalFormName: null, street: null, zip: '3000', city: 'Bern' }),
    );

    expect(mapped.business_canton).toBe('BE');
    expect(mapped.uid_number).toBeNull();
    expect(mapped.business_address).toBeNull();
    // Legal form still recoverable from the company name.
    expect(mapped.company_legal_form).toBe('gmbh');
  });

  it('leaves the canton empty when there is no postal code', () => {
    expect(mapZefixCompanyToProfile(company({ zip: null })).business_canton).toBeNull();
  });
});
