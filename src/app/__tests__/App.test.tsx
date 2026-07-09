import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../infrastructure/firebase/authAdapter', () => ({
  subscribeToAuthState: vi.fn((onChange: (user: null) => void) => {
    onChange(null);
    return () => undefined;
  }),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
}));

import { App } from '../App';

describe('App', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('redirects an unauthenticated visitor to the login page by default', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Вхід до системи' })).toBeInTheDocument();
    });
  });
});
