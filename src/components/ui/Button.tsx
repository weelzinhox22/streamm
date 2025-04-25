import React from 'react';
import styled, { css } from 'styled-components';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const ButtonContainer = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: all ${({ theme }) => theme.transitions.fast};
  border: none;
  cursor: pointer;
  
  ${({ fullWidth }) => fullWidth && css`
    width: 100%;
  `}
  
  ${({ size }) => {
    switch(size) {
      case 'small':
        return css`
          font-size: 0.875rem;
          padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
        `;
      case 'large':
        return css`
          font-size: 1.125rem;
          padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.xl}`};
        `;
      default: // medium
        return css`
          font-size: 1rem;
          padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
        `;
    }
  }}
  
  ${({ variant, theme }) => {
    switch(variant) {
      case 'secondary':
        return css`
          background-color: ${theme.colors.secondary};
          color: ${theme.colors.text};
          
          &:hover, &:focus {
            background-color: ${theme.colors.tertiary};
            box-shadow: ${theme.shadows.hover};
          }
        `;
      case 'tertiary':
        return css`
          background-color: ${theme.colors.tertiary};
          color: ${theme.colors.text};
          
          &:hover, &:focus {
            background-color: ${theme.colors.backgroundLight};
            box-shadow: ${theme.shadows.hover};
          }
        `;
      case 'outline':
        return css`
          background-color: transparent;
          color: ${theme.colors.text};
          border: 2px solid ${theme.colors.primary};
          
          &:hover, &:focus {
            background-color: rgba(229, 9, 20, 0.1);
            box-shadow: ${theme.shadows.hover};
          }
        `;
      case 'text':
        return css`
          background-color: transparent;
          color: ${theme.colors.text};
          padding: ${theme.spacing.xs};
          
          &:hover, &:focus {
            color: ${theme.colors.primary};
            background-color: rgba(255, 255, 255, 0.1);
          }
        `;
      default: // primary
        return css`
          background-color: ${theme.colors.primary};
          color: ${theme.colors.text};
          
          &:hover, &:focus {
            background-color: ${theme.colors.secondary};
            box-shadow: ${theme.shadows.hover};
          }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }
  
  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .icon-left {
    margin-right: ${({ theme }) => theme.spacing.sm};
  }
  
  .icon-right {
    margin-left: ${({ theme }) => theme.spacing.sm};
  }
`;

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  ...props
}) => {
  return (
    <ButtonContainer 
      variant={variant} 
      size={size} 
      fullWidth={fullWidth} 
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="icon icon-left">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="icon icon-right">{icon}</span>}
    </ButtonContainer>
  );
};

export default Button; 