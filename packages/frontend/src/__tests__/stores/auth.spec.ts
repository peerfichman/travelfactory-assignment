import { setActivePinia, createPinia } from 'pinia';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../stores/auth';

vi.mock('../../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
  },
}));

const mockUser = {
  id: 'u-1',
  name: 'Alice Martin',
  email: 'alice@example.com',
  role: 'Requester' as const,
};
const mockToken = 'mock.jwt.token';

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('login sets user, token and writes localStorage', async () => {
    const { authService } = await import('../../services/auth.service');
    vi.mocked(authService.login).mockResolvedValue({ token: mockToken, user: mockUser });

    const store = useAuthStore();
    await store.login('alice@example.com', 'password123');

    expect(store.token).toBe(mockToken);
    expect(store.user).toEqual(mockUser);
    expect(localStorage.getItem('token')).toBe(mockToken);
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser);
  });

  it('logout clears user, token and removes localStorage entries', async () => {
    const { authService } = await import('../../services/auth.service');
    vi.mocked(authService.login).mockResolvedValue({ token: mockToken, user: mockUser });

    const store = useAuthStore();
    await store.login('alice@example.com', 'password123');
    store.logout();

    expect(store.token).toBeNull();
    expect(store.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('restoreSession reads user from localStorage if token is present', () => {
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));

    const store = useAuthStore();
    store.restoreSession();

    expect(store.user).toEqual(mockUser);
  });

  it('restoreSession does nothing when localStorage has no user', () => {
    localStorage.setItem('token', mockToken);

    const store = useAuthStore();
    store.restoreSession();

    expect(store.user).toBeNull();
  });

  it('isValidator is true only for Validator role', async () => {
    const { authService } = await import('../../services/auth.service');
    const validatorUser = { ...mockUser, role: 'Validator' as const };
    vi.mocked(authService.login).mockResolvedValue({ token: mockToken, user: validatorUser });

    const store = useAuthStore();
    await store.login('carol@example.com', 'password123');

    expect(store.isValidator).toBe(true);
    expect(store.isRequester).toBe(false);
  });

  it('isRequester is true for Requester role', async () => {
    const { authService } = await import('../../services/auth.service');
    vi.mocked(authService.login).mockResolvedValue({ token: mockToken, user: mockUser });

    const store = useAuthStore();
    await store.login('alice@example.com', 'password123');

    expect(store.isRequester).toBe(true);
    expect(store.isValidator).toBe(false);
  });
});
