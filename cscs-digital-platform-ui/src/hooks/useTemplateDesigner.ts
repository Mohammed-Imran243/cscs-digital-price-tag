import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type ElementType = 'text' | 'rect' | 'rounded_rect' | 'ellipse' | 'image' | 'barcode' | 'qrcode';

export interface DesignerElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  zIndex: number;
  
  // Specific properties
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  businessAttribute?: string; // Data binding field
  exampleContent?: string;
}

export const useTemplateDesigner = () => {
  const [elements, setElements] = useState<DesignerElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addElement = useCallback((type: ElementType, x: number = 0, y: number = 0) => {
    const newElement: DesignerElement = {
      id: uuidv4(),
      type,
      x,
      y,
      width: type === 'text' ? 100 : 50,
      height: type === 'text' ? 30 : 50,
      rotation: 0,
      visible: true,
      zIndex: elements.length,
      content: type === 'text' ? 'Text' : undefined,
      fontSize: type === 'text' ? 14 : undefined,
      color: '#000000',
    };
    setElements(prev => [...prev, newElement]);
    setSelectedId(newElement.id);
  }, [elements.length]);

  const updateElement = useCallback((id: string, updates: Partial<DesignerElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const bringToFront = useCallback((id: string) => {
    setElements(prev => {
      const maxZ = Math.max(...prev.map(e => e.zIndex), 0);
      return prev.map(el => el.id === id ? { ...el, zIndex: maxZ + 1 } : el);
    });
  }, []);

  const sendToBack = useCallback((id: string) => {
    setElements(prev => {
      const minZ = Math.min(...prev.map(e => e.zIndex), 0);
      return prev.map(el => el.id === id ? { ...el, zIndex: minZ - 1 } : el);
    });
  }, []);

  return {
    elements,
    setElements,
    selectedId,
    setSelectedId,
    addElement,
    updateElement,
    deleteElement,
    bringToFront,
    sendToBack
  };
};
