// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock FontAwesome
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: jest.fn((props) => {
    const React = require('react');
    return React.createElement('span', {
      'data-testid': 'fontawesome-icon',
      'data-icon': props.icon?.iconName,
      'data-spin': props.spin,
      'data-pulse': props.pulse,
      'data-flip': props.flip,
      'data-rotation': props.rotation,
      className: props.className,
      'data-size': props.size,
    }, 'Icon');
  }),
}))

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}

