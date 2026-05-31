import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import AdbTab from './AdbTab';

describe('AdbTab', () => {
  it('renders adb terminal console correctly', () => {
    render(<AdbTab />);
    expect(screen.getByText('GNU/Linux Terminal - Sentinel ADB Bridge')).toBeInTheDocument();
  });
});
