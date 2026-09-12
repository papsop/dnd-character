import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the home page inside the layout', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /build a character/i })).toBeInTheDocument();
  });

  it('shows the SRD attribution on every page', () => {
    render(<App />);
    expect(screen.getByText(/SRD 5\.2\.1.*CC BY 4\.0/i)).toBeInTheDocument();
  });
});
