import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Rnd } from 'react-rnd';
import { 
  ChevronLeft, ZoomIn, ZoomOut, Undo, Redo, 
  Copy, ClipboardPaste, Lock,
  Type, Square, Circle, Minus, LayoutGrid, QrCode, Layers, MousePointer2
} from 'lucide-react';
import { addTemplate } from '../services/templateService';
import '../styles/editor.css';

// Element types
export type ElementType = 'text' | 'rect' | 'ellipse' | 'line' | 'barcode' | 'qrcode';

export interface TemplateElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  // Common style props
  color: string;
  backgroundColor: string;
  borderWidth: number;
  borderColor: string;
  // Text specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  isArabic?: boolean;
}

const TemplateEditor: React.FC = () => {
  const { id: _id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Canvas State
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Basic Template settings passed from previous page
  const passedConfig = location.state?.config || {};
  
  // Parse dimensions (e.g. "416*240" -> width 416, height 240)
  const resolutionStr = passedConfig.resolution || '416*240';
  const resParts = resolutionStr.split('*');
  const initWidth = resParts.length === 2 ? parseInt(resParts[0], 10) : 416;
  const initHeight = resParts.length === 2 ? parseInt(resParts[1], 10) : 240;

  const [templateConfig, _setTemplateConfig] = useState({
    name: passedConfig.templateName || 'New Template',
    width: initWidth,
    height: initHeight,
    ...passedConfig
  });

  const selectedElement = elements.find(el => el.id === selectedId);

  const addElement = (type: ElementType) => {
    const newEl: TemplateElement = {
      id: uuidv4(),
      type,
      x: 50,
      y: 50,
      width: type === 'text' || type === 'barcode' ? 100 : 50,
      height: type === 'text' || type === 'line' ? 30 : 50,
      color: '#000000',
      backgroundColor: type === 'text' ? 'transparent' : '#ffffff',
      borderWidth: type === 'rect' || type === 'ellipse' ? 1 : 0,
      borderColor: '#000000',
      text: type === 'text' ? 'Text / نص' : type === 'barcode' ? '123456789' : '',
      fontSize: 14,
      fontFamily: 'Inter',
      textAlign: 'left',
      isArabic: false,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const updateElement = (id: string, props: Partial<TemplateElement>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...props } : el));
  };

  const handleDelete = () => {
    if (selectedId) {
      setElements(elements.filter(el => el.id !== selectedId));
      setSelectedId(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only delete if we aren't typing in an input
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'SELECT' && document.activeElement?.tagName !== 'TEXTAREA') {
          handleDelete();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements]);

  // Toolbar Handlers
  const handleZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(Number(e.target.value));
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const payload = {
        ...templateConfig,
        type: 1, // Basic template
        items: elements // Send the elements as the items array
      };
      
      // If we don't have a templateName, we shouldn't publish
      if (!payload.templateName) {
        alert("Template name is missing. Please create the template from the templates page.");
        return;
      }

      await addTemplate(payload);
      alert("Template successfully published to ZKong cloud!");
      navigate('/templates');
    } catch (err) {
      console.error("Failed to publish template:", err);
      alert("Failed to publish template. Please check logs.");
    } finally {
      setIsPublishing(false);
    }
  };

  // Render specific elements
  const renderElementContent = (el: TemplateElement) => {
    switch (el.type) {
      case 'text':
        return (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start',
            color: el.color,
            fontSize: `${el.fontSize}px`,
            fontFamily: el.fontFamily,
            fontWeight: el.fontWeight,
            direction: el.isArabic ? 'rtl' : 'ltr',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            padding: '2px',
          }}>
            {el.text}
          </div>
        );
      case 'rect':
        return (
          <div style={{
            width: '100%', height: '100%',
            backgroundColor: el.backgroundColor,
            border: `${el.borderWidth}px solid ${el.borderColor}`,
          }} />
        );
      case 'ellipse':
        return (
          <div style={{
            width: '100%', height: '100%',
            backgroundColor: el.backgroundColor,
            border: `${el.borderWidth}px solid ${el.borderColor}`,
            borderRadius: '50%',
          }} />
        );
      case 'line':
        return (
          <div style={{
            width: '100%', height: '100%',
            backgroundColor: 'transparent',
            borderBottom: `${Math.max(1, el.height)}px solid ${el.color}`,
          }} />
        );
      case 'barcode':
        return (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ccc',
            background: '#fff'
          }}>
            <div style={{ width: '80%', height: '60%', background: 'repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px)' }}></div>
            <span style={{ fontSize: '10px' }}>{el.text}</span>
          </div>
        );
      case 'qrcode':
        return (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid #ccc',
            background: '#fff'
          }}>
            <QrCode size={Math.min(el.width, el.height) - 4} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="template-editor-wrapper">
      
      {/* TOP TOOLBAR */}
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={() => navigate(-1)} title="Back">
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontWeight: 600, fontSize: '15px', color: '#0f172a', marginLeft: '8px' }}>
            {templateConfig.name}
          </span>
        </div>
        
        <div className="toolbar-group">
          <button className="toolbar-btn" title="Undo"><Undo size={18} /></button>
          <button className="toolbar-btn" title="Redo"><Redo size={18} /></button>
          <div style={{ width: '1px', height: '24px', background: '#cbd5e1', margin: '0 4px' }} />
          <button className="toolbar-btn" title="Copy"><Copy size={18} /></button>
          <button className="toolbar-btn" title="Paste"><ClipboardPaste size={18} /></button>
          <div style={{ width: '1px', height: '24px', background: '#cbd5e1', margin: '0 4px' }} />
          <button className="toolbar-btn" title="Lock"><Lock size={18} /></button>
          <div style={{ width: '1px', height: '24px', background: '#cbd5e1', margin: '0 4px' }} />
          
          {/* Zoom Controls */}
          <ZoomOut size={16} color="#64748b" />
          <input 
            type="range" 
            min="50" max="300" 
            value={zoom} 
            onChange={handleZoom}
            className="zoom-slider"
          />
          <span style={{ fontSize: '13px', color: '#64748b', minWidth: '40px' }}>{zoom}%</span>
          <ZoomIn size={16} color="#64748b" />
        </div>

        <div className="toolbar-group">
          <button className="toolbar-btn" style={{ padding: '6px 12px', fontSize: '14px' }}>Preview</button>
          <button className="publish-btn" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="editor-workspace">
        
        {/* LEFT SIDEBAR (Components) */}
        <div className="editor-sidebar-left">
          <div className="sidebar-header">Components</div>
          
          <div style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Common components</span>
            <ChevronLeft size={16} style={{ transform: 'rotate(-90deg)' }}/>
          </div>
          <div className="components-grid">
            <div className="component-item" onClick={() => addElement('text')}>
              <Type size={20} />
              <span>Text</span>
            </div>
            <div className="component-item" onClick={() => addElement('rect')}>
              <Square size={20} />
              <span>Rectangle</span>
            </div>
            <div className="component-item" onClick={() => addElement('ellipse')}>
              <Circle size={20} />
              <span>Ellipse</span>
            </div>
            <div className="component-item" onClick={() => addElement('line')}>
              <Minus size={20} />
              <span>Line</span>
            </div>
          </div>

          <div style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Bar code QR code</span>
            <ChevronLeft size={16} style={{ transform: 'rotate(-90deg)' }}/>
          </div>
          <div className="components-grid">
            <div className="component-item" onClick={() => addElement('barcode')}>
              <LayoutGrid size={20} />
              <span>Bar code</span>
            </div>
            <div className="component-item" onClick={() => addElement('qrcode')}>
              <QrCode size={20} />
              <span>QR code</span>
            </div>
          </div>

          <div style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Layer ({elements.length})</span>
            <Layers size={16}/>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Layer List Mockup */}
            {elements.map((el, i) => (
              <div 
                key={el.id}
                onClick={() => setSelectedId(el.id)}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  borderBottom: '1px solid #f1f5f9',
                  background: selectedId === el.id ? '#eff6ff' : '#fff',
                  color: selectedId === el.id ? '#3b82f6' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <MousePointer2 size={14} />
                <span>{el.type.charAt(0).toUpperCase() + el.type.slice(1)} {i + 1}</span>
              </div>
            )).reverse()}
          </div>
        </div>

        {/* CENTER CANVAS */}
        <div className="editor-canvas-area" onClick={() => setSelectedId(null)}>
          <div className="ruler-corner"></div>
          <div className="ruler-h"></div>
          <div className="ruler-v"></div>
          
          <div 
            className="canvas-container"
            style={{
              width: templateConfig.width,
              height: templateConfig.height,
              transform: `scale(${zoom / 100})`,
            }}
            onClick={(e) => e.stopPropagation()} // Prevent unselecting when clicking canvas bg
          >
            {elements.map((el) => (
              <Rnd
                key={el.id}
                bounds="parent"
                size={{ width: el.width, height: el.height }}
                position={{ x: el.x, y: el.y }}
                onDragStart={() => setSelectedId(el.id)}
                onDragStop={(_e, d) => {
                  updateElement(el.id, { x: d.x, y: d.y });
                }}
                onResizeStart={() => setSelectedId(el.id)}
                onResizeStop={(_e, _direction, ref, _delta, position) => {
                  updateElement(el.id, {
                    width: parseFloat(ref.style.width),
                    height: parseFloat(ref.style.height),
                    ...position,
                  });
                }}
                className={`canvas-element ${selectedId === el.id ? 'selected' : ''}`}
                style={{ zIndex: selectedId === el.id ? 10 : 1 }}
              >
                {renderElementContent(el)}
              </Rnd>
            ))}
          </div>
        </div>

        {/* RIGHT SIDEBAR (Data/Properties) */}
        <div className="editor-sidebar-right">
          <div className="sidebar-header">Data Properties</div>
          
          {selectedElement ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div className="property-group">
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '12px', textTransform: 'uppercase' }}>Position & Size</div>
                
                <div className="property-row">
                  <span className="property-label">X</span>
                  <input type="number" className="property-input" value={Math.round(selectedElement.x)} onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })} />
                </div>
                <div className="property-row">
                  <span className="property-label">Y</span>
                  <input type="number" className="property-input" value={Math.round(selectedElement.y)} onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })} />
                </div>
                <div className="property-row">
                  <span className="property-label">Width</span>
                  <input type="number" className="property-input" value={Math.round(selectedElement.width)} onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })} />
                </div>
                <div className="property-row">
                  <span className="property-label">Height</span>
                  <input type="number" className="property-input" value={Math.round(selectedElement.height)} onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })} />
                </div>
              </div>

              {(selectedElement.type === 'text' || selectedElement.type === 'barcode') && (
                <div className="property-group">
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '12px', textTransform: 'uppercase' }}>Content</div>
                  <div style={{ marginBottom: '8px' }}>
                    <span className="property-label" style={{ display: 'block', marginBottom: '4px' }}>Value</span>
                    <input 
                      type="text" 
                      className="property-input" 
                      style={{ width: '100%' }} 
                      value={selectedElement.text || ''} 
                      onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })} 
                      dir={selectedElement.isArabic ? 'rtl' : 'ltr'}
                    />
                  </div>
                  
                  {selectedElement.type === 'text' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                      <input 
                        type="checkbox" 
                        id="isArabic"
                        checked={selectedElement.isArabic || false}
                        onChange={(e) => updateElement(selectedElement.id, { isArabic: e.target.checked })}
                      />
                      <label htmlFor="isArabic" className="property-label" style={{ margin: 0 }}>Right-to-Left (Arabic)</label>
                    </div>
                  )}
                </div>
              )}

              {selectedElement.type === 'text' && (
                <div className="property-group">
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '12px', textTransform: 'uppercase' }}>Typography</div>
                  <div className="property-row">
                    <span className="property-label">Font Size</span>
                    <input type="number" className="property-input" value={selectedElement.fontSize} onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })} />
                  </div>
                  <div className="property-row">
                    <span className="property-label">Color</span>
                    <input type="color" className="property-input" style={{ padding: 0, height: '32px' }} value={selectedElement.color} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} />
                  </div>
                  <div className="property-row">
                    <span className="property-label">Alignment</span>
                    <select className="property-select" value={selectedElement.textAlign} onChange={(e) => updateElement(selectedElement.id, { textAlign: e.target.value as any })}>
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              )}

              {(selectedElement.type === 'rect' || selectedElement.type === 'ellipse' || selectedElement.type === 'line') && (
                <div className="property-group">
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '12px', textTransform: 'uppercase' }}>Appearance</div>
                  
                  {selectedElement.type !== 'line' && (
                    <div className="property-row">
                      <span className="property-label">Background</span>
                      <input type="color" className="property-input" style={{ padding: 0, height: '32px' }} value={selectedElement.backgroundColor} onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })} />
                    </div>
                  )}

                  <div className="property-row">
                    <span className="property-label">{selectedElement.type === 'line' ? 'Line Color' : 'Border Color'}</span>
                    <input type="color" className="property-input" style={{ padding: 0, height: '32px' }} value={selectedElement.type === 'line' ? selectedElement.color : selectedElement.borderColor} onChange={(e) => updateElement(selectedElement.id, { [selectedElement.type === 'line' ? 'color' : 'borderColor']: e.target.value })} />
                  </div>

                  {selectedElement.type !== 'line' && (
                    <div className="property-row">
                      <span className="property-label">Border Width</span>
                      <input type="number" className="property-input" value={selectedElement.borderWidth} onChange={(e) => updateElement(selectedElement.id, { borderWidth: Number(e.target.value) })} />
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Select an element to edit its properties.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
