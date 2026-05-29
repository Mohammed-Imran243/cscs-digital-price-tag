import React, { useState } from 'react';
import { Type, Square, Circle, Image as ImageIcon, Barcode, QrCode, Eye, EyeOff, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { DesignerElement, ElementType } from '../../hooks/useTemplateDesigner';

interface DesignerSidebarProps {
  elements: DesignerElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<DesignerElement>) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
}

export const DesignerSidebar: React.FC<DesignerSidebarProps> = ({
  elements,
  selectedId,
  onSelect,
  onDelete,
  onUpdate,
  onBringToFront,
  onSendToBack
}) => {
  const [tab, setTab] = useState<'components' | 'layers'>('components');

  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('application/react-designer', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const toolList = [
    { type: 'text', icon: Type, label: 'Text' },
    { type: 'rect', icon: Square, label: 'Rectangle' },
    { type: 'ellipse', icon: Circle, label: 'Ellipse' },
    { type: 'image', icon: ImageIcon, label: 'Image' },
    { type: 'barcode', icon: Barcode, label: 'Barcode' },
    { type: 'qrcode', icon: QrCode, label: 'QR Code' },
  ] as const;

  return (
    <div className="designer-sidebar" style={{ width: '250px', background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        <button 
          style={{ flex: 1, padding: '12px', background: tab === 'components' ? '#f3f4f6' : 'transparent', border: 'none', fontWeight: tab === 'components' ? 'bold' : 'normal', cursor: 'pointer' }}
          onClick={() => setTab('components')}
        >
          Components
        </button>
        <button 
          style={{ flex: 1, padding: '12px', background: tab === 'layers' ? '#f3f4f6' : 'transparent', border: 'none', fontWeight: tab === 'layers' ? 'bold' : 'normal', cursor: 'pointer' }}
          onClick={() => setTab('layers')}
        >
          Layers ({elements.length})
        </button>
      </div>

      <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
        {tab === 'components' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {toolList.map(tool => (
              <div
                key={tool.type}
                draggable
                onDragStart={(e) => handleDragStart(e, tool.type)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'grab', background: '#fafafa'
                }}
              >
                <tool.icon size={24} style={{ marginBottom: '8px', color: '#3b82f6' }} />
                <span style={{ fontSize: '12px', color: '#374151' }}>{tool.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {elements.slice().reverse().map(el => (
              <div 
                key={el.id} 
                style={{ 
                  display: 'flex', alignItems: 'center', padding: '8px', 
                  background: selectedId === el.id ? '#e0f2fe' : '#f9fafb',
                  border: `1px solid ${selectedId === el.id ? '#bae6fd' : '#e5e7eb'}`,
                  borderRadius: '4px', cursor: 'pointer'
                }}
                onClick={() => onSelect(el.id)}
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); onUpdate(el.id, { visible: !el.visible }); }}
                  style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#6b7280' }}
                >
                  {el.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <span style={{ flex: 1, fontSize: '13px', marginLeft: '8px', color: '#111827' }}>
                  {el.type.toUpperCase()} {el.content ? `"${el.content.substring(0,10)}"` : ''}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={(e) => { e.stopPropagation(); onBringToFront(el.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#6b7280' }}><ArrowUp size={14}/></button>
                  <button onClick={(e) => { e.stopPropagation(); onSendToBack(el.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#6b7280' }}><ArrowDown size={14}/></button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(el.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#ef4444' }}><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
            {elements.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', marginTop: '20px' }}>No layers yet</div>}
          </div>
        )}
      </div>
    </div>
  );
};
