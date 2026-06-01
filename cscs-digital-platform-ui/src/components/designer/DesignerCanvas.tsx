import React, { useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import type { DesignerElement } from '../../hooks/useTemplateDesigner';

interface DesignerCanvasProps {
  elements: DesignerElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<DesignerElement>) => void;
  onDropNewElement: (type: any, x: number, y: number) => void;
}

export const DesignerCanvas: React.FC<DesignerCanvasProps> = ({
  elements,
  selectedId,
  onSelect,
  onUpdate,
  onDropNewElement
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/react-designer');
    if (!type) return;

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      onDropNewElement(type, x, y);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow moving with arrows when an element is selected
      if (!selectedId) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const element = elements.find(el => el.id === selectedId);
        if (!element) return;
        
        let dx = 0, dy = 0;
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        
        onUpdate(selectedId, { x: element.x + dx, y: element.y + dy });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements, onUpdate]);

  const renderElementContent = (el: DesignerElement) => {
    const commonStyles: React.CSSProperties = {
      width: '100%',
      height: '100%',
      transform: `rotate(${el.rotation || 0}deg)`,
      border: el.borderThickness ? `${el.borderThickness}px solid ${el.borderColor || '#000'}` : 'none',
      backgroundColor: el.backgroundColor === 'transparent' ? 'transparent' : (el.backgroundColor || 'transparent'),
      boxSizing: 'border-box'
    };

    switch (el.type) {
      case 'text':
        return (
          <div style={{
            ...commonStyles,
            fontSize: `${el.fontSize}px`, 
            fontFamily: el.fontFamily || 'Arial',
            color: el.color,
            display: 'flex', alignItems: 'center', justifyContent: el.align || 'flex-start',
            overflow: 'hidden', whiteSpace: 'nowrap',
            padding: '0 4px'
          }}>
            {el.businessAttribute ? `[${el.businessAttribute}]` : el.content}
          </div>
        );
      case 'rect':
        return <div style={{ ...commonStyles, border: el.borderThickness ? commonStyles.border : `2px solid ${el.color || '#000'}` }} />;
      case 'rounded_rect':
        return <div style={{ ...commonStyles, border: el.borderThickness ? commonStyles.border : `2px solid ${el.color || '#000'}`, borderRadius: '12px' }} />;
      case 'ellipse':
        return <div style={{ ...commonStyles, border: el.borderThickness ? commonStyles.border : `2px solid ${el.color || '#000'}`, borderRadius: '50%' }} />;
      case 'barcode':
        return (
          <div style={{ ...commonStyles, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: el.backgroundColor !== 'transparent' ? el.backgroundColor : '#f8f9fa' }}>
            <div style={{ flex: 1, width: '80%', borderLeft: '2px solid #000', borderRight: '4px solid #000', margin: '4px 0' }}></div>
            <span style={{ fontSize: '10px' }}>{el.businessAttribute ? `[${el.businessAttribute}]` : '123456789'}</span>
          </div>
        );
      case 'qrcode':
        return (
          <div style={{ ...commonStyles, display: 'flex', alignItems: 'center', justifyContent: 'center', background: el.backgroundColor !== 'transparent' ? el.backgroundColor : '#f8f9fa' }}>
            <div style={{ width: '60%', height: '60%', background: 'repeating-linear-gradient(45deg, #000, #000 2px, #fff 2px, #fff 4px)' }}></div>
          </div>
        );
      case 'image':
        return <div style={{ ...commonStyles, background: el.backgroundColor !== 'transparent' ? el.backgroundColor : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>Image Area</div>;
      default:
        return null;
    }
  };

  return (
    <div 
      style={{ flex: 1, background: '#f3f4f6', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={() => onSelect(null)}
    >
      <div 
        ref={canvasRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ 
          width: '800px', height: '600px', background: '#fff', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grid pattern (optional) */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5, pointerEvents: 'none' }} />

        {elements.filter(el => el.visible).map((el) => (
          <Rnd
            key={el.id}
            size={{ width: el.width, height: el.height }}
            position={{ x: el.x, y: el.y }}
            onDragStart={() => onSelect(el.id)}
            onDragStop={(_e, d) => {
              onUpdate(el.id, { x: d.x, y: d.y });
            }}
            onResizeStop={(_e, _direction, ref, _delta, position) => {
              onUpdate(el.id, {
                width: parseFloat(ref.style.width),
                height: parseFloat(ref.style.height),
                ...position
              });
            }}
            bounds="parent"
            style={{
              zIndex: el.zIndex,
              outline: selectedId === el.id ? '2px solid #3b82f6' : 'none',
              cursor: 'move'
            }}
            enableResizing={selectedId === el.id}
          >
            {renderElementContent(el)}
          </Rnd>
        ))}
      </div>
    </div>
  );
};
