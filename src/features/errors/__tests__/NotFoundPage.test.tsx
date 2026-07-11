import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import '../../../app/i18n';
import { NotFoundPage } from '../NotFoundPage';

describe('NotFoundPage', () => {
  it('shows the 404 code and navigates home when the button is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <Routes>
          <Route path="/unknown" element={<NotFoundPage />} />
          <Route path="/" element={<div>home page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'На головну' }));

    expect(screen.getByText('home page')).toBeInTheDocument();
  });
});
