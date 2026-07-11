import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../infrastructure/firebase/authAdapter', () => ({
  subscribeToAuthState: vi.fn((onChange: (user: null) => void) => {
    onChange(null);
    return () => undefined;
  }),
  signInWithEmailAndPassword: vi.fn(),
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
      expect(screen.getByText('Домашнє меню')).toBeInTheDocument();
    });
  });

  it('renders the 404 page for an unknown path', async () => {
    window.location.hash = '#/some/unknown/path';

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    });
  });
});
