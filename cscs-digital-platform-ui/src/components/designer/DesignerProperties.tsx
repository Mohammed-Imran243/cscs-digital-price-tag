import React, { useEffect, useState } from 'react';
import type { DesignerElement } from '../../hooks/useTemplateDesigner';
import { getFieldNames } from '../../services/templateService';

interface DesignerPropertiesProps {
  element: DesignerElement | null;
  onUpdate: (id: string, updates: Partial<DesignerElement>) => void;
}

export const DesignerProperties: React.FC<DesignerPropertiesProps> = ({ element, onUpdate }) => {
  const [fields, setFields] = useState<any[]>([]);

  useEffect(() => {
    // Fetch business attributes (mocked for now, assuming api is there)
    getFieldNames('1').then(setFields).catch(console.error);
  }, []);

  if (!element) {
    return (
      <div style={{ width: '300px', background: '#fff', borderLeft: '1px solid #e5e7eb', padding: '16px', color: '#6b7280', fontSize: '14px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        Select an element to edit its properties
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (type === 'number') {
      finalValue = parseFloat(value) || 0;
    }
    onUpdate(element.id, { [name]: finalValue });
  };

  return (
    <div className="designer-properties" style={{ width: '300px', background: '#fff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold', color: '#111827' }}>
        Properties ({element.type.toUpperCase()})
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Business Attributes Section */}
        {['text', 'barcode', 'qrcode'].includes(element.type) && (
          <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#374151' }}>Business Attributes</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: '#4b5563' }}>Fetch Field</label>
              <select 
                name="businessAttribute" 
                value={element.businessAttribute || ''} 
                onChange={handleChange}
                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}
              >
                <option value="">Static Content</option>
                {fields.map((f: any, i) => (
                  <option key={i} value={f.name || f}>{f.label || f.name || f}</option>
                ))}
              </select>

              {!element.businessAttribute && (
                <>
                  <label style={{ fontSize: '12px', color: '#4b5563', marginTop: '8px' }}>Static Content</label>
                  <input 
                    type="text" 
                    name="content" 
                    value={element.content || ''} 
                    onChange={handleChange}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Layout Properties */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#374151' }}>Layout</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#4b5563', display: 'block', marginBottom: '4px' }}>X</label>
              <input type="number" name="x" value={Math.round(element.x)} onChange={handleChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Y</label>
              <input type="number" name="y" value={Math.round(element.y)} onChange={handleChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Width</label>
              <input type="number" name="width" value={Math.round(element.width)} onChange={handleChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Height</label>
              <input type="number" name="height" value={Math.round(element.height)} onChange={handleChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
            </div>
          </div>
        </div>

        {/* Styling Properties for Text */}
        {element.type === 'text' && (
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#374151' }}>Typography</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Font Size (px)</label>
                <input type="number" name="fontSize" value={element.fontSize || 14} onChange={handleChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="color" name="color" value={element.color || '#000000'} onChange={handleChange} style={{ width: '32px', height: '32px', padding: '0', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }} />
                  <input type="text" name="color" value={element.color || '#000000'} onChange={handleChange} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
