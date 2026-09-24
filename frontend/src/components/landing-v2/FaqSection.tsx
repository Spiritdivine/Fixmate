import React from 'react';
import { FrequentlyAskedQuestions } from '../common/FrequentlyAskedQuestions';

export const FaqSection: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <FrequentlyAskedQuestions className={className} />;
};

export default FaqSection;
