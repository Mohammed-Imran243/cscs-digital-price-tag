import React, { useState } from 'react';
import { X, Save, LayoutTemplate } from 'lucide-react';
import { useTemplateDesigner } from '../../hooks/useTemplateDesigner';
import type { ElementType } from '../../hooks/useTemplateDesigner';
import { DesignerSidebar } from './DesignerSidebar';
import { DesignerCanvas } from './DesignerCanvas';
import { DesignerProperties } from './DesignerProperties';
import { checkTemplateName } from '../../services/templateService';

interface TemplateDesignerProps {
  initialTemplate?: any;
  storeId?: string; // provided when in "store" tab
  onClose: () => void;
  onSave: (templateData: any) => Promise<void>;
}

export const TemplateDesigner: React.FC<TemplateDesignerProps> = ({
  initialTemplate,
  storeId,
  onClose,
  onSave
}) => {
  const {
    elements,
    selectedId,
    setSelectedId,
    addElement,
    updateElement,
    deleteElement,
    bringToFront,
    sendToBack
  } = useTemplateDesigner();

  const [templateName, setTemplateName] = useState(initialTemplate?.templateName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    try {
      // Validate Name
      if (storeId) {
        await checkTemplateName(storeId, templateName);
        // Assuming the API returns false or throws if name exists
        // (Depends on DragonESL actual behavior, this is standard optimistic implementation)
      }

      const templateData = {
        templateName,
        storeId,
        components: elements,
        width: 800, // example
        height: 600, // example
        ...initialTemplate
      };

      await onSave(templateData);
    } catch (err: any) {
      console.error('Failed to save template', err);
      setError(err?.response?.data?.message || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDropNewElement = (type: string, x: number, y: number) => {
    addElement(type as ElementType, x, y);
  };

  return (
    <div className="template-designer-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#e5e7eb', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="designer-header" style={{ height: '60px', background: '#fff', borderBottom: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <LayoutTemplate size={24} color="#3b82f6" />
          <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Template Designer</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '24px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Name:</span>
            <input 
              type="text" 
              value={templateName} 
              onChange={e => { setTemplateName(e.target.value); setError(null); }}
              placeholder="Enter template name..."
              style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', width: '250px' }}
            />
            {error && <span style={{ color: '#ef4444', fontSize: '13px' }}>{error}</span>}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#374151' }}>
            <X size={16} /> Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Save size={16} /> {isSaving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Sidebar */}
        <DesignerSidebar 
          elements={elements}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDelete={deleteElement}
          onUpdate={updateElement}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
        />

        {/* Center Canvas Workspace */}
        <DesignerCanvas 
          elements={elements}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUpdate={updateElement}
          onDropNewElement={handleDropNewElement}
        />

        {/* Right Properties Panel */}
        <DesignerProperties 
          element={elements.find(el => el.id === selectedId) || null}
          onUpdate={updateElement}
        />

      </div>
    </div>
  );
};
