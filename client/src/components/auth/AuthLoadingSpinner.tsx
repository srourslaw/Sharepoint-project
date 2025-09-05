import React from 'react';
import { styled, keyframes } from '@mui/material/styles';

interface AuthLoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const AuthLoadingContainer = styled('div')<{ fullScreen?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  
  ${({ fullScreen }) => fullScreen && `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    z-index: 9999;
  `}
`;

const LoadingContent = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const LoadingSpinner = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SpinnerRing = styled('div')<{ size: 'sm' | 'md' | 'lg' }>`
  display: inline-block;
  position: relative;
  width: ${({ size }) => size === 'sm' ? '24px' : size === 'md' ? '40px' : '56px'};
  height: ${({ size }) => size === 'sm' ? '24px' : size === 'md' ? '40px' : '56px'};
`;

const SpinnerCircle = styled('div')<{ size: 'sm' | 'md' | 'lg'; delay: number }>`
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  border: ${({ size }) => size === 'sm' ? '2px' : '3px'} solid transparent;
  border-top: ${({ size }) => size === 'sm' ? '2px' : '3px'} solid #0078d4;
  border-radius: 50%;
  animation: ${spin} 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  animation-delay: ${({ delay }) => delay}s;
`;

const LoadingMessage = styled('div')<{ size: 'sm' | 'md' | 'lg' }>`
  color: #605e5c;
  font-size: ${({ size }) => size === 'sm' ? '0.8rem' : size === 'lg' ? '1rem' : '0.9rem'};
  font-weight: ${({ size }) => size === 'lg' ? '500' : 'normal'};
  text-align: center;
  max-width: 300px;
  line-height: 1.4;
`;

export const AuthLoadingSpinner: React.FC<AuthLoadingSpinnerProps> = ({
  message = "Loading...",
  size = 'md',
  fullScreen = false,
  className = ""
}) => {
  return (
    <AuthLoadingContainer fullScreen={fullScreen} className={className}>
      <LoadingContent>
        <LoadingSpinner>
          <SpinnerRing size={size}>
            <SpinnerCircle size={size} delay={-0.45} />
            <SpinnerCircle size={size} delay={-0.3} />
            <SpinnerCircle size={size} delay={-0.15} />
            <SpinnerCircle size={size} delay={0} />
          </SpinnerRing>
        </LoadingSpinner>
        
        {message && (
          <LoadingMessage size={size}>
            {message}
          </LoadingMessage>
        )}
      </LoadingContent>
    </AuthLoadingContainer>
  );
};