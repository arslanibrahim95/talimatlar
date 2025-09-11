import React from 'react';
import { cn } from '../../utils/cn';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  className?: string;
}

interface TableHeaderProps extends React.ThHTMLAttributes<HTMLTableHeaderCellElement> {
  className?: string;
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  className?: string;
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableDataCellElement> {
  className?: string;
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
}

interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
}

const Table: React.FC<TableProps> = ({ className, ...props }) => {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
};

const TableHeader: React.FC<TableHeaderProps> = ({ className, ...props }) => {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
};

const TableRow: React.FC<TableRowProps> = ({ className, ...props }) => {
  return (
    <tr
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  );
};

const TableCell: React.FC<TableCellProps> = ({ className, ...props }) => {
  return (
    <td
      className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  );
};

const TableBody: React.FC<TableBodyProps> = ({ className, ...props }) => {
  return (
    <tbody
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
};

const TableHead: React.FC<TableHeadProps> = ({ className, ...props }) => {
  return (
    <thead
      className={cn('', className)}
      {...props}
    />
  );
};

export { Table, TableHeader, TableRow, TableCell, TableBody, TableHead };
