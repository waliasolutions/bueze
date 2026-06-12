import { describe, it, expect } from 'vitest';
import { mapProposalsToContacts } from './proposalQueries';

describe('mapProposalsToContacts', () => {
  const contacts = [
    { lead_id: 'lead-1', full_name: 'Anna Muster', email: 'a@x.ch', phone: '+41 79 000 00 01' },
  ];

  it('attaches contact to accepted proposals with an owner', () => {
    const proposals = [
      { lead_id: 'lead-1', status: 'accepted', leads: { owner_id: 'owner-1' } },
    ];
    const out = mapProposalsToContacts(proposals, contacts);
    expect(out[0].client_contact).toEqual({
      full_name: 'Anna Muster',
      email: 'a@x.ch',
      phone: '+41 79 000 00 01',
    });
  });

  it('does NOT attach contact for non-accepted proposals', () => {
    const proposals = [
      { lead_id: 'lead-1', status: 'pending', leads: { owner_id: 'owner-1' } },
    ];
    const out = mapProposalsToContacts(proposals, contacts);
    expect((out[0] as any).client_contact).toBeUndefined();
  });

  it('does NOT attach contact when lead has no owner', () => {
    const proposals = [
      { lead_id: 'lead-1', status: 'accepted', leads: { owner_id: null } },
    ];
    const out = mapProposalsToContacts(proposals, contacts);
    expect((out[0] as any).client_contact).toBeUndefined();
  });

  it('tolerates a missing contact row (null)', () => {
    const proposals = [
      { lead_id: 'lead-99', status: 'accepted', leads: { owner_id: 'owner-x' } },
    ];
    const out = mapProposalsToContacts(proposals, contacts);
    expect(out[0].client_contact).toBeNull();
  });
});
