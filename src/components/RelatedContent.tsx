import React from 'react';
import styled from 'styled-components';
import { MediaItem } from '../types';
import MediaCard from './ui/MediaCard';

interface RelatedContentProps {
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
}

const RelatedContent: React.FC<RelatedContentProps> = ({ items, onItemClick }) => {
  if (!items || items.length === 0) return null;

  return (
    <Container>
      <SectionTitle>Conteúdo Relacionado</SectionTitle>
      <MediaGrid>
        {items.map((item) => (
          <CardWrapper key={item.id} onClick={() => onItemClick(item)}>
            <MediaCard item={item} />
          </CardWrapper>
        ))}
      </MediaGrid>
    </Container>
  );
};

const Container = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xxl};
  padding-top: ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #fff;
`;

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 15px;
  }
`;

const CardWrapper = styled.div`
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  
  &:hover {
    transform: scale(1.05);
  }
`;

export default RelatedContent; 