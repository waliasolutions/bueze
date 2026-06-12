import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase client BEFORE importing the module under test.
const rpcMock = vi.fn();
const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
    from: vi.fn(),
  },
}));

import { acceptProposal, acceptProposalsBatch } from './proposalHelpers';

beforeEach(() => {
  rpcMock.mockReset();
  invokeMock.mockReset();
});

describe('acceptProposal', () => {
  it('calls the atomic RPC and returns success', async () => {
    rpcMock.mockResolvedValueOnce({
      data: { success: true, message: 'Offerte angenommen! Beide Parteien wurden benachrichtigt.' },
      error: null,
    });

    const res = await acceptProposal('prop-1');

    expect(rpcMock).toHaveBeenCalledWith('accept_proposal_atomic', { p_proposal_id: 'prop-1' });
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/angenommen/);
  });

  it('does NOT invoke the send-acceptance-emails edge function (DB trigger is SSOT)', async () => {
    rpcMock.mockResolvedValueOnce({ data: { success: true, message: 'ok' }, error: null });
    await acceptProposal('prop-1');
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('propagates an RPC error as a failed result', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    const res = await acceptProposal('prop-1');
    expect(res.success).toBe(false);
    expect(res.error).toBe('boom');
  });

  it('returns the German "already processed" message verbatim from the RPC', async () => {
    rpcMock.mockResolvedValueOnce({
      data: { success: false, message: 'Diese Offerte wurde bereits bearbeitet.' },
      error: null,
    });
    const res = await acceptProposal('prop-1');
    expect(res.success).toBe(false);
    expect(res.message).toBe('Diese Offerte wurde bereits bearbeitet.');
  });
});

describe('acceptProposalsBatch', () => {
  it('runs all RPCs in parallel and aggregates the result', async () => {
    rpcMock
      .mockResolvedValueOnce({ data: { success: true, message: 'ok' }, error: null })
      .mockResolvedValueOnce({ data: { success: true, message: 'ok' }, error: null });

    const res = await acceptProposalsBatch(['a', 'b']);
    expect(rpcMock).toHaveBeenCalledTimes(2);
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/2/);
  });

  it('reports an empty batch as failure', async () => {
    const res = await acceptProposalsBatch([]);
    expect(res.success).toBe(false);
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
