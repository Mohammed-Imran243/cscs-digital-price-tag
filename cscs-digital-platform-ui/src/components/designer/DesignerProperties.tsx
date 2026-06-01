import React, { useEffect, useState } from 'react';
import type { DesignerElement } from '../../hooks/useTemplateDesigner';
import { getFieldNames } from '../../services/templateService';
import { AlignLeft, AlignCenter, AlignRight, ChevronDown, ChevronUp } from 'lucide-react';

interface DesignerPropertiesProps {
  element: DesignerElement | null;
  onUpdate: (id: string, updates: Partial<DesignerElement>) => void;
}

export const DesignerProperties: React.FC<DesignerPropertiesProps> = ({ element, onUpdate }) => {
  const [fields, setFields] = useState<any[]>([]);
  const [isDataOpen, setIsDataOpen] = useState(true);
  const [isBasicOpen, setIsBasicOpen] = useState(true);

  useEffect(() => {
    // Fetch business attributes and map them properly
    getFieldNames('1').then((res: any) => {
      let dataObj = Array.isArray(res) ? res : (res?.data || res);
      let allFields: any[] = [];
      
      if (dataObj && typeof dataObj === 'object' && !Array.isArray(dataObj)) {
        // It's a map like {"1": [...], "6": [...]}
        Object.values(dataObj).forEach((arr: any) => {
          if (Array.isArray(arr)) {
            allFields = [...allFields, ...arr];
          }
        });
      } else if (Array.isArray(dataObj)) {
        allFields = dataObj;
      }
      
      const mappedFields = allFields.map((f: any) => {
        // If it's a string, just map it to code/name
        if (typeof f === 'string') return { fieldCode: f, fieldName: f };
        
        return {
          fieldCode: f.fieldCode || f.name || f.code,
          fieldName: f.fieldName || f.label || f.name || f.fieldCode
        };
      }).filter((f: any) => f.fieldCode); // filter out invalid
      
      setFields(mappedFields);
    }).catch(console.error);
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

  const setAlign = (align: 'left' | 'center' | 'right') => {
    onUpdate(element.id, { align });
  };

  const adjustNumber = (name: string, current: number, delta: number) => {
    onUpdate(element.id, { [name]: current + delta });
  };

  const NumberInput = ({ label, name, value }: { label: string, name: string, value: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <label style={{ fontSize: '14px', color: '#111827' }}>{label} :</label>
      <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: '4px', overflow: 'hidden' }}>
        <button onClick={() => adjustNumber(name, value, -1)} style={{ width: '32px', height: '32px', background: '#fff', border: 'none', borderRight: '1px solid #d1d5db', cursor: 'pointer', fontSize: '16px' }}>-</button>
        <input type="number" name={name} value={value || 0} onChange={handleChange} style={{ width: '60px', height: '32px', border: 'none', textAlign: 'center', fontSize: '14px' }} />
        <button onClick={() => adjustNumber(name, value, 1)} style={{ width: '32px', height: '32px', background: '#fff', border: 'none', borderLeft: '1px solid #d1d5db', cursor: 'pointer', fontSize: '16px' }}>+</button>
      </div>
    </div>
  );

  return (
    <div className="designer-properties" style={{ width: '320px', background: '#fff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      
      {/* Data Section */}
      <div style={{ borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ padding: '16px', fontWeight: 'bold', fontSize: '16px', color: '#904313' }}>
          Data
        </div>
        
        <div 
          onClick={() => setIsDataOpen(!isDataOpen)}
          style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderTop: '1px solid #f3f4f6' }}
        >
          <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#111827' }}>Business attributes</span>
          {isDataOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        
        {isDataOpen && (
          <div style={{ padding: '16px', paddingTop: '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', color: '#111827', width: '120px' }}>Fetch field</label>
              <select 
                name="businessAttribute" 
                value={element.businessAttribute || ''} 
                onChange={handleChange}
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #4f46e5', color: '#4b5563', fontSize: '14px', outline: 'none' }}
              >
                <option value="">Select Field...</option>
                {fields.map((f, i) => (
                  <option key={i} value={f.fieldCode}>{f.fieldName}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <label style={{ fontSize: '14px', color: '#111827', width: '120px', paddingTop: '8px' }}>Example content:</label>
              <textarea 
                name="content" 
                value={element.content || ''} 
                onChange={(e) => onUpdate(element.id, { content: e.target.value })}
                rows={3}
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '14px', resize: 'vertical' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Basic Attributes Section */}
      <div>
        <div 
          onClick={() => setIsBasicOpen(!isBasicOpen)}
          style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#0369a1', borderBottom: '2px solid #0369a1', paddingBottom: '4px' }}>Basic Attributes</span>
          {isBasicOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {isBasicOpen && (
          <div style={{ padding: '16px', paddingTop: '0' }}>
            <NumberInput label="Horizontal" name="x" value={Math.round(element.x)} />
            <NumberInput label="Vertical coordinates" name="y" value={Math.round(element.y)} />
            <NumberInput label="Height" name="height" value={Math.round(element.height)} />
            <NumberInput label="Width" name="width" value={Math.round(element.width)} />
            <NumberInput label="angle" name="rotation" value={Math.round(element.rotation || 0)} />
            
            {['text'].includes(element.type) && (
              <>
                <NumberInput label="Font size" name="fontSize" value={element.fontSize || 14} />
                
                {/* Alignment */}
                <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '16px', overflow: 'hidden' }}>
                  <button onClick={() => setAlign('left')} style={{ flex: 1, height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: element.align === 'left' ? '#e5e7eb' : '#fff', border: 'none', borderRight: '1px solid #d1d5db', cursor: 'pointer' }}><AlignLeft size={18} color="#4b5563" /></button>
                  <button onClick={() => setAlign('center')} style={{ flex: 1, height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: element.align === 'center' ? '#e5e7eb' : '#fff', border: 'none', borderRight: '1px solid #d1d5db', cursor: 'pointer' }}><AlignCenter size={18} color="#4b5563" /></button>
                  <button onClick={() => setAlign('right')} style={{ flex: 1, height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: element.align === 'right' ? '#e5e7eb' : '#fff', border: 'none', cursor: 'pointer' }}><AlignRight size={18} color="#4b5563" /></button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', color: '#111827', width: '120px' }}>Colour :</label>
                  <div style={{ display: 'flex', flex: 1, gap: '8px' }}>
                    <input type="color" name="color" value={element.color || '#000000'} onChange={handleChange} style={{ width: '32px', height: '32px', padding: '0', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }} />
                    <select name="color" value={element.color || '#000000'} onChange={handleChange} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}>
                      <option value="#000000">black</option>
                      <option value="#ff0000">red</option>
                      <option value="#ffff00">yellow</option>
                      <option value="#ffffff">white</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', color: '#111827', width: '120px' }}>Font :</label>
                  <select name="fontFamily" value={element.fontFamily || 'Arial'} onChange={handleChange} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '14px' }}>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                </div>
              </>
            )}

            <NumberInput label="border thickness" name="borderThickness" value={element.borderThickness || 0} />
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', color: '#111827', width: '120px' }}>Border colour :</label>
              <div style={{ display: 'flex', flex: 1, gap: '8px' }}>
                <input type="color" name="borderColor" value={element.borderColor || '#000000'} onChange={handleChange} style={{ width: '32px', height: '32px', padding: '0', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }} />
                <select name="borderColor" value={element.borderColor || '#000000'} onChange={handleChange} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}>
                  <option value="#000000">black</option>
                  <option value="#ff0000">red</option>
                  <option value="#ffff00">yellow</option>
                  <option value="#ffffff">white</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', color: '#111827', width: '120px' }}>background fill color :</label>
              <div style={{ display: 'flex', flex: 1, gap: '8px' }}>
                {element.backgroundColor !== 'transparent' && (
                  <input type="color" name="backgroundColor" value={element.backgroundColor || '#ffffff'} onChange={handleChange} style={{ width: '32px', height: '32px', padding: '0', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }} />
                )}
                <select 
                  name="backgroundColor" 
                  value={element.backgroundColor === 'transparent' ? 'transparent' : (element.backgroundColor || '#ffffff')} 
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdate(element.id, { backgroundColor: val });
                  }} 
                  style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}
                >
                  <option value="transparent">No</option>
                  <option value="#ffffff">white</option>
                  <option value="#000000">black</option>
                  <option value="#ff0000">red</option>
                  <option value="#ffff00">yellow</option>
                </select>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

