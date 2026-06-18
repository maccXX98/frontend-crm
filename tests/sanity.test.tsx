import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

describe('Sanity Test', () => {
  it('should render simple text', () => {
    render(<div>Hola Mundo</div>);
    expect(screen.getByText('Hola Mundo')).toBeInTheDocument();
  });
});
