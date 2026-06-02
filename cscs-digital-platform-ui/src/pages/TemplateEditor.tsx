import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Rnd } from 'react-rnd';
import { 
  ChevronLeft, ZoomIn, ZoomOut, Undo, Redo, 
  Copy, ClipboardPaste, Lock,
  Type, Square, Circle, Minus, LayoutGrid, QrCode, Layers, MousePointer2, RotateCw, RotateCcw, Maximize, Loader2
} from 'lucide-react';
import { addTemplate, previewTemplate, getFieldNames } from '../services/templateService';
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
  fieldCode?: string;
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

  // Refs for calculating viewport center
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Canvas State
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Preview State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showFullScreenPreview, setShowFullScreenPreview] = useState(false);
  const [fullScreenZoom, setFullScreenZoom] = useState(100);
  const [fullScreenRotation, setFullScreenRotation] = useState(0);
  
  // Notification State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  
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
    let targetX = 50;
    let targetY = 50;
    const width = type === 'text' || type === 'barcode' ? 100 : 50;
    const height = type === 'text' || type === 'line' ? 30 : 50;

    if (canvasAreaRef.current && canvasContainerRef.current) {
      const areaRect = canvasAreaRef.current.getBoundingClientRect();
      const canvasRect = canvasContainerRef.current.getBoundingClientRect();
      
      const viewportCenterX = areaRect.left + areaRect.width / 2;
      const viewportCenterY = areaRect.top + areaRect.height / 2;
      
      let relativeX = (viewportCenterX - canvasRect.left) / (zoom / 100);
      let relativeY = (viewportCenterY - canvasRect.top) / (zoom / 100);
      
      targetX = relativeX - (width / 2);
      targetY = relativeY - (height / 2);
      
      // Clamp to bounds
      targetX = Math.max(0, Math.min(targetX, templateConfig.width - width));
      targetY = Math.max(0, Math.min(targetY, templateConfig.height - height));
    }

    const newEl: TemplateElement = {
      id: uuidv4(),
      type,
      x: targetX,
      y: targetY,
      width,
      height,
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
    // English translation fallback for DragonESL field codes
    const fieldTranslations: Record<string, string> = {
      'itemTitle': 'Product name',
      'shortTitle': 'Product abbreviation',
      'productCode': 'Commodity code',
      'barCode': 'Product barcode',
      'productSku': 'Self-code',
      'unit': 'Unit',
      'price': 'Price',
      'originalPrice': 'Original price',
      'memberPrice': 'Member price',
      'qrCode': 'QR code',
      'nfcUrl': 'NFC URL',
      'proStartTime': 'Promotion start time',
      'proEndTime': 'Promotion end time',
      'updateTime': 'Update time',
      'custFeature1': 'Custom feature 1',
      'custFeature2': 'Custom feature 2',
      'custFeature3': 'Custom feature 3',
      'custFeature4': 'Custom feature 4',
      'custFeature5': 'Custom feature 5',
      'pricetagBarcode': 'Price tag barcode'
    };

    getFieldNames('1').then((res: any) => {
      let dataObj = Array.isArray(res) ? res : (res?.data || res);
      let allFields: any[] = [];
      if (dataObj && typeof dataObj === 'object' && !Array.isArray(dataObj)) {
        Object.values(dataObj).forEach((arr: any) => {
          if (Array.isArray(arr)) allFields = [...allFields, ...arr];
        });
      } else if (Array.isArray(dataObj)) {
        allFields = dataObj;
      }
      
      const mappedFields = allFields.map((f: any) => {
        if (typeof f === 'string') return { fieldCode: f, fieldName: fieldTranslations[f] || f };
        
        const code = f.fieldCode || f.name || f.code;
        return {
          fieldCode: code,
          // Use translation if fieldName is null, otherwise fallback to code
          fieldName: f.fieldName || fieldTranslations[code] || f.label || f.name || code
        };
      }).filter((f: any) => f.fieldCode);
      
      setFields(mappedFields);
    }).catch(console.error);
  }, []);

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

  // Helper to map React frontend payload to DragonESL payload
  const buildDragonEslPayload = (config: any, items: TemplateElement[]) => {
    let payload = { ...config };

    if (payload.storeId && typeof payload.storeId === 'string') {
      payload.storeId = parseInt(payload.storeId, 10);
    }

    if (payload.resolution) {
      const dimensions = payload.resolution.split('*');
      if (dimensions.length === 2) {
        payload.width = parseInt(dimensions[0], 10);
        payload.height = parseInt(dimensions[1], 10);
      }
    }

    if (payload.screenType === 'single') {
      payload.screenType = 0;
    }

    if (!payload.modelId) {
      payload.modelId = '[65]';
    }

    payload.status = payload.status !== undefined ? payload.status : 1;
    payload.color = payload.color !== undefined ? payload.color : 1;
    payload.type = payload.type !== undefined ? payload.type : 1;
    payload.drawLayout = payload.drawLayout !== undefined ? payload.drawLayout : 1;
    payload.itemNum = payload.itemNum !== undefined ? payload.itemNum : 1;
    payload.templateType = payload.templateType !== undefined ? payload.templateType : 1;
    payload.templateSize = payload.templateSize !== undefined ? payload.templateSize : 1;
    payload.hardwareType = payload.hardwareType !== undefined ? payload.hardwareType : 1;
    payload.templateNumber = payload.templateNumber !== undefined ? payload.templateNumber : ' ';
    payload.templateVersion = payload.templateVersion !== undefined ? payload.templateVersion : '1.0';
    payload.agencyId = payload.agencyId !== undefined ? payload.agencyId : 1694577214130;
    payload.sceneNumber = payload.sceneNumber !== undefined ? payload.sceneNumber : 1;
    payload.attrCategory = payload.attrCategory !== undefined ? payload.attrCategory : 'default';
    payload.attrName = payload.attrName !== undefined ? payload.attrName : 'default';
    
    // Fallback if we don't have merchantId or storeId yet
    payload.merchantId = payload.merchantId !== undefined ? payload.merchantId : 1775639851383;
    payload.storeId = payload.storeId && payload.storeId !== '0' && payload.storeId !== 0 ? payload.storeId : 1694602327253;

    let layerCount = 0;
    const templateElements = items.map(source => {
      let typeInt = 1;
      if (source.type === 'text') typeInt = 1;
      else if (source.type === 'barcode') typeInt = 2;
      else if (source.type === 'qrcode') typeInt = 3;
      else if (source.type === 'line') typeInt = 4;
      else if (source.type === 'rect') typeInt = 5;

      let align = 0;
      if (source.textAlign === 'center') align = 1;
      else if (source.textAlign === 'right') align = 2;

      let fontFam = source.fontFamily || 'Arial';
      if (fontFam === 'Inter' || fontFam === 'Roboto') {
        fontFam = 'Arial';
      }

      const el = {
        type: typeInt,
        marginLeft: source.x,
        marginTop: source.y,
        width: source.width,
        height: source.height,
        content: source.text || '',
        horizontalAlign: align,
        fontSize: source.fontSize || 14,
        fontType: fontFam,
        color: source.color || '#000000',
        borderColor: source.borderColor || '#000000',
        fillColor: '',
        fillinColor: '',
        stroke: '#000000',
        angle: 0,
        barcodeType: 10,
        borderType: 1,
        conRealResult: 1,
        dateFormat: 'YYYY-MM-dd HH:mm:ss',
        decimalSeparator: 'point',
        fieldCode: source.fieldCode || '',
        ifBold: 0,
        ifCondition: 0,
        ifItalic: 0,
        ifStrikeThrough: 0,
        ifUnderline: 0,
        itemOrder: 1, // Fix: Must be 1 to bind to the first (and only) commodity
        layer: layerCount++,
        lineBreak: '',
        lineWeight: source.borderWidth || 0,
        maxLines: 3,
        minFontSize: 12,
        noResourceHide: 0,
        omitStyle: 0,
        postfix: '',
        prefix: '',
        scaleX: 0,
        scaleY: 0,
        screenIndex: 0,
        strokeWidth: 0,
        textAdvanceProperty: 0,
        thousandSeparator: 'comma',
        verticalAlign: 0,
        verticalSpace: 0
      };
      return el;
    });

    return {
      templateBase: payload,
      templateElementAdvancedAttributes: null,
      templateElements: templateElements
    };
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      if (templateConfig) {
        const payload = buildDragonEslPayload(templateConfig, elements);
        console.log("Publishing payload:", payload);
        await addTemplate(payload as any);
        setNotification({ message: 'Template published successfully!', type: 'success' });
        
        setTimeout(() => {
          navigate('/templates');
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to publish template:", err);
      setNotification({ message: 'Failed to publish template. Please check logs.', type: 'error' });
      setIsPublishing(false);
    }
  };

  const [previewBarcode, setPreviewBarcode] = useState('');

  const handlePreview = async () => {
    setIsPreviewing(true);
    setPreviewError(null);
    try {
      if (templateConfig) {
        const payload = buildDragonEslPayload(templateConfig, elements);
        if (previewBarcode.trim()) {
          payload.templateBase.barCode = previewBarcode.trim();
        }
        console.log("Previewing payload:", payload);
        const response = await previewTemplate(payload as any);
        if (response && typeof response === 'string') {
           setPreviewImage(`data:image/png;base64,${response}`);
        } else if (response && response.data) {
           setPreviewImage(`data:image/png;base64,${response.data}`);
        } else {
           setPreviewError("Failed to generate preview image. Invalid response format.");
        }
        setShowPreviewModal(true);
      }
    } catch (err: any) {
      console.error("Failed to preview template:", err);
      const msg = err.response?.data?.message || err.message || "Failed to generate preview.";
      setPreviewError(`Preview Failed: ${msg}. If searching by barcode, ensure the commodity exists in this store.`);
      setShowPreviewModal(true);
    } finally {
      setIsPreviewing(false);
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
            {el.fieldCode ? `[${el.fieldCode}]` : el.text}
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
            <span style={{ fontSize: '10px' }}>{el.fieldCode ? `[${el.fieldCode}]` : el.text}</span>
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
          <button className="toolbar-btn" style={{ padding: '4px' }} onClick={() => setZoom(z => Math.max(50, z - 10))} title="Zoom Out">
            <ZoomOut size={16} color="#64748b" />
          </button>
          <input 
            type="range" 
            min="50" max="300" 
            value={zoom} 
            onChange={handleZoom}
            className="zoom-slider"
          />
          <span style={{ fontSize: '13px', color: '#64748b', minWidth: '40px' }}>{zoom}%</span>
          <button className="toolbar-btn" style={{ padding: '4px' }} onClick={() => setZoom(z => Math.min(300, z + 10))} title="Zoom In">
            <ZoomIn size={16} color="#64748b" />
          </button>
        </div>

        <div className="toolbar-group">
          <button className="toolbar-btn" style={{ padding: '6px 12px', fontSize: '14px' }} onClick={handlePreview} disabled={isPreviewing}>
            {isPreviewing ? 'Generating...' : 'Preview'}
          </button>
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
        <div className="editor-canvas-area" ref={canvasAreaRef} onClick={() => setSelectedId(null)}>
          <div className="ruler-corner"></div>
          <div className="ruler-h"></div>
          <div className="ruler-v"></div>
          
          <div 
            style={{ 
              width: templateConfig.width * (zoom / 100), 
              height: templateConfig.height * (zoom / 100),
              position: 'relative',
              transition: 'width 0.1s, height 0.1s'
            }}
          >
            <div 
              className="canvas-container"
              ref={canvasContainerRef}
              style={{
                width: templateConfig.width,
                height: templateConfig.height,
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0
              }}
              onClick={(e) => e.stopPropagation()} // Prevent unselecting when clicking canvas bg
            >
            {elements.map((el) => (
              <Rnd
                key={el.id}
                bounds="parent"
                scale={zoom / 100}
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
        </div>

        {/* RIGHT SIDEBAR (Data/Properties) */}
        <div className="editor-sidebar-right">
          <div className="sidebar-header">Data Properties</div>
          
          {selectedElement ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {(selectedElement.type === 'text' || selectedElement.type === 'barcode') && (
                <div className="property-group">
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '12px', textTransform: 'uppercase' }}>Content</div>
                  <div style={{ marginBottom: '12px' }}>
                    <span className="property-label" style={{ display: 'block', marginBottom: '4px' }}>Fetch field</span>
                    <select 
                      className="property-select"
                      style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      value={selectedElement.fieldCode || ''}
                      onChange={(e) => updateElement(selectedElement.id, { fieldCode: e.target.value })}
                    >
                      <option value="">Static Content</option>
                      {fields.map((f, i) => (
                        <option key={i} value={f.fieldCode}>{f.fieldName}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span className="property-label" style={{ display: 'block', marginBottom: '4px' }}>Value (Static/Preview)</span>
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

      {/* Toast Notification */}
      {notification && (
        <div className={`toast-notification ${notification.type} glass-card`} style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, padding: '12px 24px', borderRadius: '8px', background: notification.type === 'success' ? '#10b981' : '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          {notification.message}
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content" style={{ width: '600px', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 400 }}>Preview</h3>
              <button onClick={() => setShowPreviewModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
            
            {/* Sub-header toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #e2e8f0', gap: '12px' }}>
              <span style={{ fontSize: '14px' }}>Current view:</span>
              <input 
                type="text" 
                placeholder="Please enter product barcode" 
                value={previewBarcode}
                onChange={e => setPreviewBarcode(e.target.value)}
                style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', flex: 1 }} 
              />
              <button onClick={handlePreview} style={{ padding: '6px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Application</button>
              <button onClick={() => { setShowFullScreenPreview(true); setFullScreenZoom(100); setFullScreenRotation(0); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Zoom In">
                <ZoomIn size={20} color="#333" />
              </button>
              <button onClick={handlePreview} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Refresh">
                <RotateCw size={20} color="#333" />
              </button>
            </div>

            {/* Canvas Area */}
            <div style={{ background: '#f1f5f9', padding: '40px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {isPreviewing && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(241, 245, 249, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <Loader2 size={32} className="animate-spin" color="#3b82f6" />
                </div>
              )}
              {previewError ? (
                <div style={{ color: '#ef4444', textAlign: 'center', maxWidth: '80%' }}>{previewError}</div>
              ) : previewImage ? (
                <div style={{ background: 'white', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', display: 'inline-block' }}>
                  <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px' }} />
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
              <button onClick={() => setShowPreviewModal(false)} style={{ padding: '8px 32px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Image Preview Overlay */}
      {showFullScreenPreview && previewImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Close Button Top Right */}
          <button onClick={() => setShowFullScreenPreview(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <span style={{ fontSize: '32px' }}>&times;</span>
          </button>

          {/* Image Container */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', width: '100%', padding: '40px' }}>
            <img 
              src={previewImage} 
              alt="Full Screen Preview" 
              style={{ 
                transform: `scale(${fullScreenZoom / 100}) rotate(${fullScreenRotation}deg)`,
                transition: 'transform 0.2s ease-in-out',
                maxWidth: '90%',
                maxHeight: '80vh',
                objectFit: 'contain',
                background: 'white',
                padding: '20px'
              }} 
            />
          </div>

          {/* Floating Toolbar Bottom */}
          <div style={{ position: 'absolute', bottom: '40px', background: '#334155', borderRadius: '8px', padding: '12px 24px', display: 'flex', gap: '24px', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
            <button onClick={() => setFullScreenZoom(z => Math.max(50, z - 20))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }} title="Zoom Out">
              <ZoomOut size={24} />
            </button>
            <button onClick={() => setFullScreenZoom(z => Math.min(300, z + 20))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }} title="Zoom In">
              <ZoomIn size={24} />
            </button>
            <button onClick={() => { setFullScreenZoom(100); setFullScreenRotation(0); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }} title="Reset / Full Screen">
              <Maximize size={24} />
            </button>
            <button onClick={() => setFullScreenRotation(r => r - 90)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }} title="Rotate Left">
              <RotateCcw size={24} />
            </button>
            <button onClick={() => setFullScreenRotation(r => r + 90)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }} title="Rotate Right">
              <RotateCw size={24} />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default TemplateEditor;
