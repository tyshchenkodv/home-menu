import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import '../../../app/i18n';
import { ForbiddenPage } from '../ForbiddenPage';

describe('ForbiddenPage', () => {
  it('shows the 403 code and navigates home when the button is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/403']}>
        <Routes>
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/" element={<div>home page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '403' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'На головну' }));

    expect(screen.getByText('home page')).toBeInTheDocument();
  });
});
