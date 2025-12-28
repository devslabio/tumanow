'use client';

import { useState } from 'react';
import Icon, { faQuestionCircle, faChevronDown, faChevronUp } from './Icon';
import Card, { CardBody } from './Card';

interface FAQItemProps {
  question: string;
  answer: string;
}

export default function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsOpen(!isOpen)}>
      <CardBody>
        <div className="flex items-start gap-4">
          <Icon icon={faQuestionCircle} className="text-primary mt-1 flex-shrink-0" size="lg" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-gray-900">{question}</h3>
              <Icon 
                icon={isOpen ? faChevronUp : faChevronDown} 
                className="text-gray-400 flex-shrink-0" 
                size="sm" 
              />
            </div>
            {isOpen && (
              <p className="text-base font-medium text-gray-700 mt-3">{answer}</p>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

