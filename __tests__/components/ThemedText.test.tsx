import { render, screen } from '@testing-library/react-native';
import { ThemedText } from '../../components/ThemedText';

// Mock the useThemeColor hook
jest.mock('../../hooks/useThemeColor', () => ({
  useThemeColor: jest.fn(() => '#000000'),
}));

describe('ThemedText', () => {
  it('renders correctly with default props', () => {
    render(<ThemedText>Hello World</ThemedText>);
    const textElement = screen.getByText('Hello World');
    expect(textElement).toBeTruthy();
  });

  it('renders with different text types', () => {
    const { rerender } = render(<ThemedText type="title">Title Text</ThemedText>);
    expect(screen.getByText('Title Text')).toBeTruthy();

    rerender(<ThemedText type="subtitle">Subtitle Text</ThemedText>);
    expect(screen.getByText('Subtitle Text')).toBeTruthy();

    rerender(<ThemedText type="defaultSemiBold">SemiBold Text</ThemedText>);
    expect(screen.getByText('SemiBold Text')).toBeTruthy();

    rerender(<ThemedText type="link">Link Text</ThemedText>);
    expect(screen.getByText('Link Text')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { fontSize: 24 };
    render(<ThemedText style={customStyle}>Custom Style Text</ThemedText>);
    const textElement = screen.getByText('Custom Style Text');
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle)
      ])
    );
  });
}); 