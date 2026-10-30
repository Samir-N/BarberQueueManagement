import React from 'react';
import { Button as MuiButton } from '@mui/material';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

// One shared hover/active feel for every variant
const lift = {
  transform: 'translateY(-1px)',
  boxShadow: '0 4px 10px -2px rgba(15, 23, 42, 0.18)',
};
const press = {
  transform: 'translateY(0px)',
  boxShadow: 'none',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  sx = {},
  ...props
}) => {
  const sizePadding = {
    sm: '8px 18px',
    md: '10px 24px',
    lg: '14px 32px',
  };

  const fontSizes = {
    sm: '0.875rem',
    md: '0.9375rem',
    lg: '1.0625rem',
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#FFC300',
      borderColor: '#FFC300',
      color: '#0F172A',
      '&:hover': { backgroundColor: '#E6B000', borderColor: '#E6B000', ...lift },
      '&:active': press,
    },

    secondary: {
      backgroundColor: '#1e2838',
      borderColor: '#1e2838',
      color: '#FFFFFF',
      '&:hover': { backgroundColor: '#2a3547', borderColor: '#2a3547', ...lift },
      '&:active': press,
    },

    /* Glass: blur + transparent + border. Hover stays neutral (no colour). */
    tertiary: {
      backgroundColor: 'rgba(15, 23, 42, 0.04)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      color: '#0F172A',
      borderColor: 'rgba(15, 23, 42, 0.28)',
      '&:hover': {
        backgroundColor: 'rgba(15, 23, 42, 0.09)',
        borderColor: '#0F172A',
        color: '#0F172A',
        ...lift,
      },
      '&:active': {
        ...press,
        backgroundColor: 'rgba(15, 23, 42, 0.14)',
      },
    },

    /* Confirm */
    success: {
      backgroundColor: '#10B981',
      borderColor: '#10B981',
      color: '#FFFFFF',
      '&:hover': { backgroundColor: '#059669', borderColor: '#059669', ...lift },
      '&:active': press,
    },

    /* Cancel */
    danger: {
      backgroundColor: '#F43F5E',
      borderColor: '#F43F5E',
      color: '#FFFFFF',
      '&:hover': { backgroundColor: '#E11D48', borderColor: '#E11D48', ...lift },
      '&:active': press,
    },
  };

  return (
    <MuiButton
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      disableRipple={false}
      disableElevation
      sx={{
        borderRadius: 0,
        border: '1px solid transparent', // same height for every variant
        fontWeight: 600,
        letterSpacing: '-0.01em',
        textTransform: 'none',
        padding: sizePadding[size] || sizePadding.md,
        fontSize: fontSizes[size] || fontSizes.md,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: `all 0.25s ${EASE}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        '&:focus-visible': {
          outline: '2px solid #0F172A',
          outlineOffset: '2px',
        },
        '&.Mui-disabled': {
          opacity: 0.6,
          backgroundColor: '#E2E8F0',
          borderColor: '#E2E8F0',
          color: '#94A3B8',
          boxShadow: 'none',
          transform: 'none',
          backdropFilter: 'none',
        },
        ...(variantStyles[variant] || variantStyles.primary),
        ...sx,
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

export default Button;