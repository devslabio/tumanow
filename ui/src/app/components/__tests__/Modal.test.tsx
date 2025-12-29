import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <p>Modal content</p>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when isOpen is true', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render modal when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not show close button when showCloseButton is false', () => {
    render(<Modal {...defaultProps} showCloseButton={false} />);
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />);
    const modalContent = screen.getByText('Test Modal').closest('div')?.parentElement;
    expect(modalContent).toHaveClass('max-w-md');

    rerender(<Modal {...defaultProps} size="md" />);
    const modalContentMd = screen.getByText('Test Modal').closest('div')?.parentElement;
    expect(modalContentMd).toHaveClass('max-w-lg');

    rerender(<Modal {...defaultProps} size="lg" />);
    const modalContentLg = screen.getByText('Test Modal').closest('div')?.parentElement;
    expect(modalContentLg).toHaveClass('max-w-2xl');

    rerender(<Modal {...defaultProps} size="xl" />);
    const modalContentXl = screen.getByText('Test Modal').closest('div')?.parentElement;
    expect(modalContentXl).toHaveClass('max-w-4xl');
  });

  it('renders footer when provided', () => {
    const footer = <button>Save</button>;
    render(<Modal {...defaultProps} footer={footer} />);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
});

