import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { gsap } from 'gsap';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  fullWidth?: boolean;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing.md};
  overflow-y: auto;
  padding-top: 5vh;
`;

const ModalContainer = styled.div<{ fullWidth?: boolean }>`
  background-color: ${({ theme }) => theme.colors.backgroundDark};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.large};
  max-width: ${({ fullWidth }) => fullWidth ? '100%' : '1200px'};
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  z-index: 1001;
  display: flex;
  flex-direction: column;
`;

const Modal: React.FC<ModalProps> = ({ children, onClose, fullWidth }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) {
        onClose();
      }
    };
    
    // Handle escape key to close
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    
    // Scroll to top when modal opens
    window.scrollTo(0, 0);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);
  
  // Animate modal entry
  useEffect(() => {
    if (containerRef.current && overlayRef.current) {
      // Overlay animation
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      
      // Container animation
      gsap.fromTo(
        containerRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', delay: 0.1 }
      );
    }
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <ModalOverlay ref={overlayRef}>
      <ModalContainer ref={containerRef} fullWidth={fullWidth}>
        {children}
      </ModalContainer>
    </ModalOverlay>
  );
};

export default Modal; 