import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../Input';
import { faUser, faSearch } from '../Icon';

describe('Input Component', () => {
  it('renders input field', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(<Input label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('text-red-600');
  });

  it('displays helper text when no error', () => {
    render(<Input helperText="Enter your email address" />);
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address')).toHaveClass('text-gray-500');
  });

  it('does not show helper text when error is present', () => {
    render(<Input error="Error" helperText="Helper text" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('handles input changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders with icon on left', () => {
    render(<Input icon={faUser} placeholder="Username" />);
    const icons = screen.getAllByTestId('fontawesome-icon');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('renders with icon on right', () => {
    render(<Input icon={faSearch} iconPosition="right" placeholder="Search" />);
    const icons = screen.getAllByTestId('fontawesome-icon');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('applies error styling when error is present', () => {
    render(<Input error="Error message" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('passes through HTML input attributes', () => {
    render(
      <Input
        type="email"
        name="email"
        placeholder="Email"
        required
        disabled
      />
    );
    
    const input = screen.getByPlaceholderText('Email');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
  });

  it('forwards ref correctly', () => {
    const ref = jest.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });
});

