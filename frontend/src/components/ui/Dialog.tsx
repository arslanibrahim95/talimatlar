import React, { createContext, useContext, useState, ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface DialogContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DialogTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

interface DialogContentProps {
  children: ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: ReactNode;
  className?: string;
}

const Dialog: React.FC<DialogProps> = ({ children, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  
  return (
    <DialogContext.Provider value={{ isOpen, open, close }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger: React.FC<DialogTriggerProps> = ({ children, asChild = false }) => {
  const { open } = useContext(DialogContext)!;
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: open });
  }
  
  return (
    <button onClick={open} type="button">
      {children}
    </button>
  );
};

const DialogContent: React.FC<DialogContentProps> = ({ children, className }) => {
  const { isOpen, close } = useContext(DialogContext)!;
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={close} />
      <div className={cn(
        'relative bg-background p-6 shadow-lg border rounded-lg max-w-md w-full mx-4',
        className
      )}>
        {children}
      </div>
    </div>
  );
};

const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}>
      {children}
    </div>
  );
};

const DialogTitle: React.FC<DialogTitleProps> = ({ children, className }) => {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
      {children}
    </h2>
  );
};

const DialogDescription: React.FC<DialogDescriptionProps> = ({ children, className }) => {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  );
};

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription };
