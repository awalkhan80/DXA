import React from 'react';
import { CapitalInjectionFormData, CapitalInjectionRecord } from '../types';
import { OwnerCapitalInjection } from './OwnerCapitalInjection';

interface CapitalInjectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  capitalInjections: CapitalInjectionRecord[];
  onAddCapital: (data: CapitalInjectionFormData) => void;
  onDeleteCapital: (id: number) => void;
}

export const CapitalInjectionModal: React.FC<CapitalInjectionModalProps> = ({
  isOpen,
  onClose,
  capitalInjections,
  onAddCapital,
  onDeleteCapital
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="max-w-2xl w-full my-auto animate-in fade-in zoom-in-95 duration-150">
        <OwnerCapitalInjection
          capitalInjections={capitalInjections}
          onAddCapital={onAddCapital}
          onDeleteCapital={onDeleteCapital}
          isModal={true}
          onCloseModal={onClose}
        />
      </div>
    </div>
  );
};
