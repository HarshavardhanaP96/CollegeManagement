import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/common';

describe('test toolchain', () => {
  it('renders a component and supports jest-dom matchers', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
});
