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
      backgroundColor: '#1e2838',
      color: '#FFFFFF',
      '&:hover': {
        backgroundColor: '#222a36',
        transform: 'translateY(-1.5px)',
      },
      '&:active': {
        transform: 'translateY(0px)',
      },
    },
    tertiary: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      color: '#0F172A',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        color: '#0F172A',
        transform: 'translateY(-1.5px)',
        boxShadow: '0 6px 15px -3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      },
      '&:active': {
        transform: 'translateY(0px)',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
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
        borderRadius: '8px',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        textTransform: 'none',
        padding: sizePadding[size] || sizePadding.md,
        fontSize: fontSizes[size] || fontSizes.md,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: disabled ? 'not-allowed' : 'pointer',

        '&:focus-visible': {
          outline: '2px solid #FFC300',
          outlineOffset: '2px',
        },

        '&.Mui-disabled': {
          opacity: 0.6,
          backgroundColor: '#E2E8F0',
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