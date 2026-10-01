import React from 'react';
import { Button as MuiButton } from '@mui/material';

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
      color: '#0F172A',
      '&:hover': {
        backgroundColor: '#E6B000',
        transform: 'translateY(-1.5px)',
      },
      '&:active': {
        transform: 'translateY(0px)',
      },
    },
    secondary: {
      backgroundColor: '#0F172A',
      color: '#FFFFFF',
      '&:hover': {
        backgroundColor: '#1E293B',
        transform: 'translateY(-1.5px)',
      },
      '&:active': {
        transform: 'translateY(0px)',
      },
    },
    tertiary: {
      backgroundColor: 'transparent',
      color: '#475569',
      border: '1px solid #E2E8F0',
      '&:hover': {
        color: '#0F172A',
        backgroundColor: '#F8FAFC',
        borderColor: '#CBD5E1',
        transform: 'translateY(-1.5px)',
      },
      '&:active': {
        transform: 'translateY(0px)',
        backgroundColor: '#F1F5F9',
        boxShadow: 'none',
      },
    },
    /* Solid Modern Emerald (Confirm) */
    success: {
      backgroundColor: '#10B981',
      color: '#FFFFFF',
      '&:hover': {
        backgroundColor: '#059669',
        transform: 'translateY(-1.5px)',
      },
      '&:active': {
        transform: 'translateY(0px)',
      },
    },
    /* Solid Modern Rose (Cancel) */
    danger: {
      backgroundColor: '#F43F5E',
      color: '#FFFFFF',
      '&:hover': {
        backgroundColor: '#E11D48',
        transform: 'translateY(-1.5px)',
      },
      '&:active': {
        transform: 'translateY(0px)',
      },
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
        borderRadius: '6px',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        textTransform: 'none',
        padding: sizePadding[size] || sizePadding.md,
        fontSize: fontSizes[size] || fontSizes.md,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: disabled ? 'not-allowed' : 'pointer',

        '&:focus-visible': {
          outline: '2px solid #2563EB',
          outlineOffset: '2px',
        },

        '&.Mui-disabled': {
          opacity: 0.6,
          backgroundColor: '#E2E8F0',
          color: '#94A3B8',
          boxShadow: 'none',
          transform: 'none',
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