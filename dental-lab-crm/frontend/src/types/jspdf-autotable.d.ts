import { jsPDF } from 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
    getTextDimensions: (
      text: string,
      options?: { maxWidth?: number; fontSize?: number }
    ) => { w: number; h: number };
  }
}

interface UserOptions {
  startY?: number;
  head?: (string | number)[][];
  body?: (string | number)[][];
  theme?: 'striped' | 'grid' | 'plain';
  headStyles?: {
    fillColor?: [number, number, number] | number | string;
    textColor?: [number, number, number] | number | string;
    fontSize?: number;
    fontStyle?: string;
    lineColor?: [number, number, number] | number | string;
    lineWidth?: number;
  };
  bodyStyles?: {
    fontSize?: number;
    textColor?: [number, number, number] | number | string;
  };
  columnStyles?: {
    [key: number]: {
      cellWidth?: number;
      halign?: 'left' | 'center' | 'right';
    };
  };
  margin?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  styles?: {
    cellPadding?: number;
    lineColor?: [number, number, number] | number | string;
    lineWidth?: number;
    fontSize?: number;
    font?: string;
    fontStyle?: string;
    textColor?: [number, number, number] | number | string;
    fillColor?: [number, number, number] | number | string;
  };
  showHead?: 'everyPage' | 'firstPage' | 'never';
  showFoot?: 'everyPage' | 'firstPage' | 'never';
  tableWidth?: 'auto' | 'wrap' | number;
  tableLineColor?: [number, number, number] | number | string;
  tableLineWidth?: number;
}

export {};
