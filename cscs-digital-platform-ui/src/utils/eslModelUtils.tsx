import type { EslSpecs } from '../types';

export const getEslModelSpecs = (sizeStr: string | number | undefined, modelStr?: string): EslSpecs => {
  let size = String(sizeStr || '').trim();
  const model = String(modelStr || '').trim().toUpperCase();

  // Infer from model if size is not provided or unclear
  if (!size && model) {
    if (model.includes('75') || model.includes('7.5')) size = '7.5';
    else if (model.includes('42') || model.includes('4.2')) size = '4.2';
    else if (model.includes('26') || model.includes('2.6')) size = '2.66';
    else if (model.includes('21') || model.includes('2.1')) size = '2.13';
    else if (model.includes('15') || model.includes('1.5')) size = '1.54';
  }

  // Standard normalize
  if (size.startsWith('1.5') || size.includes('1.54')) {
    return {
      size: '1.54',
      aspectRatio: '1 / 1',
      width: 240,
      height: 240,
      popoverWidth: 240,
      popoverHeight: 240,
      layoutType: 'square',
      fontScale: 0.7
    };
  }
  if (size.startsWith('2.1') || size.includes('2.13')) {
    return {
      size: '2.13',
      aspectRatio: '290 / 140',
      width: 290,
      height: 140,
      popoverWidth: 290,
      popoverHeight: 140,
      layoutType: 'compact',
      fontScale: 0.8
    };
  }
  if (size.startsWith('4.2') || size.includes('4.2')) {
    return {
      size: '4.2',
      aspectRatio: '4 / 3',
      width: 360,
      height: 270,
      popoverWidth: 360,
      popoverHeight: 270,
      layoutType: 'tall',
      fontScale: 1.1
    };
  }
  if (size.startsWith('7.5') || size.includes('7.5')) {
    return {
      size: '7.5',
      aspectRatio: '480 / 288',
      width: 480,
      height: 288,
      popoverWidth: 480,
      popoverHeight: 288,
      layoutType: 'large',
      fontScale: 1.4
    };
  }
  // Default is 2.66"
  return {
    size: '2.66',
    aspectRatio: '380 / 165',
    width: 380,
    height: 165,
    popoverWidth: 380,
    popoverHeight: 165,
    layoutType: 'standard',
    fontScale: 1.0
  };
};

export const inferTemplateSize = (templateAttr: string | undefined): string => {
  const attr = String(templateAttr || '').trim().toUpperCase();
  if (!attr) return '';
  if (attr.includes('7.5') || attr.includes('75') || attr.includes('ZKC75')) return '7.5';
  if (attr.includes('4.2') || attr.includes('42') || attr.includes('ZKC42')) return '4.2';
  if (attr.includes('2.66') || attr.includes('2.6') || attr.includes('26') || attr.includes('ESLC26') || attr.includes('ZKC29')) return '2.66';
  if (attr.includes('2.13') || attr.includes('2.1') || attr.includes('21') || attr.includes('ZKC21')) return '2.13';
  if (attr.includes('1.54') || attr.includes('1.5') || attr.includes('15') || attr.includes('ZKC15')) return '1.54';
  return '';
};

export const renderEinkLayout = (
  specs: EslSpecs,
  isComparison: boolean,
  displayTitle: string,
  displayPrice: string,
  displayOriginalPrice: string,
  barcode: string = '',
  storeName: string = 'Al Naseem Store'
) => {
  if (specs.layoutType === 'square') {
    return (
      <div className="bind-eink-canvas animate-fade-in" style={{
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box',
        background: '#ffffff',
        width: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid #000', paddingBottom: '2px', fontSize: '9px', fontWeight: 'bold' }}>
          <span style={{ color: '#e02020' }}>CSCS SQ</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0', gap: '2px' }}>
          <div style={{ fontSize: '8px', background: '#facc15', color: '#000', fontWeight: '900', padding: '1px 4px', borderRadius: '2px' }}>
            PROMO
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', color: '#e02020', gap: '1px' }}>
            <span style={{ fontSize: '26px', fontWeight: '900' }}>{displayPrice}</span>
            <span style={{ fontSize: '8px', fontWeight: 'bold' }}>SAR</span>
          </div>
          {isComparison && (
            <div style={{ fontSize: '11px', color: '#666', textDecoration: 'line-through', fontWeight: 'bold' }}>
              {displayOriginalPrice}
            </div>
          )}
        </div>

        <div style={{
          fontSize: '10px',
          fontWeight: '800',
          color: '#000000',
          textAlign: 'center',
          lineHeight: '1.2',
          maxHeight: '32px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          direction: 'rtl'
        }}>
          {displayTitle}
        </div>
      </div>
    );
  }

  if (specs.layoutType === 'compact') {
    return (
      <div className="bind-eink-canvas animate-fade-in" style={{
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box',
        background: '#ffffff',
        width: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #000', paddingBottom: '2px', fontSize: '10px', fontWeight: 'bold' }}>
          <span style={{ color: '#e02020' }}>CSCS ESL CONNECT APP</span>
          <span style={{ fontSize: '8px', color: '#666' }}>{storeName}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', color: '#e02020' }}>
              <span style={{ fontSize: '24px', fontWeight: '900' }}>{displayPrice}</span>
              <span style={{ fontSize: '9px', fontWeight: 'bold', marginLeft: '2px' }}>SAR</span>
            </div>
            {isComparison && (
              <span style={{ fontSize: '12px', color: '#666', textDecoration: 'line-through', fontWeight: 'bold' }}>
                {displayOriginalPrice}
              </span>
            )}
          </div>
          
          <div style={{ background: '#facc15', color: '#000', fontSize: '9px', fontWeight: '900', padding: '2px 4px', borderRadius: '3px', transform: 'rotate(-3deg)' }}>
            PROMO
          </div>
        </div>

        <div style={{
          fontSize: '11px',
          fontWeight: '800',
          color: '#000',
          textAlign: 'right',
          direction: 'rtl',
          borderTop: '1px dashed #ccc',
          paddingTop: '3px'
        }}>
          {displayTitle}
        </div>
      </div>
    );
  }

  if (specs.layoutType === 'tall') {
    return (
      <div className="bind-eink-canvas animate-fade-in" style={{
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box',
        background: '#ffffff',
        width: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '4px', fontSize: '11px', fontWeight: '800' }}>
          <span style={{ color: '#e02020', fontSize: '13px' }}>CSCS PREMIUM</span>
          <span style={{ color: '#000' }}>{storeName}</span>
        </div>

        <div style={{ background: '#facc15', color: '#000', fontSize: '12px', fontWeight: '900', textAlign: 'center', padding: '3px 0', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          SPECIAL OFFER
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', color: '#e02020' }}>
            <span style={{ fontSize: '36px', fontWeight: '900' }}>{displayPrice}</span>
            <span style={{ fontSize: '12px', fontWeight: '900', marginLeft: '4px' }}>SAR</span>
          </div>
          {isComparison && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '11px', color: '#666' }}>Before:</span>
              <span style={{ fontSize: '16px', color: '#000', textDecoration: 'line-through', fontWeight: 'bold' }}>{displayOriginalPrice}</span>
            </div>
          )}
        </div>

        <div style={{ borderTop: '2px solid #000', paddingTop: '6px' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#000', textAlign: 'right', direction: 'rtl', marginBottom: '4px' }}>
            {displayTitle}
          </div>
          {barcode && (
            <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#555', textAlign: 'left' }}>
              {barcode}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (specs.layoutType === 'large') {
    return (
      <div className="bind-eink-canvas animate-fade-in" style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box',
        background: '#ffffff',
        width: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '4px' }}>
          <div>
            <span style={{ color: '#e02020', fontSize: '16px', fontWeight: '950', letterSpacing: '1px' }}>CSCS MEGA SMART TAG</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: '#333', fontWeight: '700' }}>{storeName}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px', margin: '10px 0', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ background: '#facc15', color: '#000', fontSize: '14px', fontWeight: '900', textAlign: 'center', padding: '6px 10px', borderRadius: '4px', letterSpacing: '1px' }}>
              SUPER OFFER
            </div>
            <div style={{ border: '1px dashed #e02020', padding: '4px', borderRadius: '4px', textAlign: 'center', color: '#e02020', fontSize: '10px', fontWeight: '800' }}>
              ✦ Price Guarantee ✦
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', color: '#e02020' }}>
              <span style={{ fontSize: '48px', fontWeight: '950', lineHeight: '1' }}>{displayPrice}</span>
              <span style={{ fontSize: '14px', fontWeight: '900', marginLeft: '4px' }}>SAR</span>
            </div>
            {isComparison && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>WAS</span>
                <span style={{ fontSize: '18px', color: '#333', textDecoration: 'line-through', fontWeight: '900' }}>{displayOriginalPrice}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: '2px solid #000', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: '1', paddingRight: '12px' }}>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#000', textAlign: 'right', direction: 'rtl', lineHeight: '1.3' }}>
              {displayTitle}
            </div>
          </div>
          {barcode && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', borderLeft: '1.5px solid #ddd', paddingLeft: '12px' }}>
              <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#555', fontWeight: 'bold' }}>{barcode}</div>
              <div style={{ display: 'flex', height: '12px', gap: '1px' }}>
                {[1,3,2,4,1,3,2,1,4,2,3,1].map((w, idx) => (
                  <div key={idx} style={{ background: '#000', width: `${w}px`, height: '100%' }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback to Standard 2.66" layout
  return (
    <div className="bind-eink-canvas animate-fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', boxSizing: 'border-box', background: '#ffffff', minHeight: '200px', width: '100%' }}>
      <div className="bind-eink-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '4px', fontSize: '11px', fontWeight: '800' }}>
        <span className="brand-logo" style={{ color: '#e02020', fontWeight: '900' }}>CSCS ESL CONNECT APP</span>
        <span className="brand-store">{storeName}</span>
      </div>

      <div className="bind-eink-promo-banner" style={{ background: '#facc15', color: '#000', fontSize: '13px', fontWeight: '900', textAlign: 'center', padding: '4px 8px', borderRadius: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
        PROMOTION
      </div>

      {isComparison ? (
        <div className="bind-eink-price-section" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '4px 0', padding: '4px 0', borderBottom: '1px dashed #ccc' }}>
          <div className="bind-eink-main-price" style={{ display: 'flex', alignItems: 'baseline', color: '#e02020' }}>
            <span className="price-currency" style={{ fontSize: '12px', fontWeight: '800', marginRight: '3px' }}>SAR</span>
            <span className="price-value" style={{ fontSize: '32px', fontWeight: '900' }}>{displayPrice}</span>
            <span className="price-tag-now" style={{ fontSize: '9px', background: '#e02020', color: '#fff', padding: '1px 3px', borderRadius: '2px', marginLeft: '4px' }}>Now</span>
          </div>
          
          <div className="bind-eink-original-price" style={{ display: 'flex', alignItems: 'baseline', color: '#666' }}>
            <span className="orig-price-value" style={{ fontSize: '16px', fontWeight: '700', textDecoration: 'line-through' }}>{displayOriginalPrice}</span>
            <span className="price-tag-before" style={{ fontSize: '9px', marginLeft: '3px' }}>Before</span>
          </div>
        </div>
      ) : (
        <div className="bind-eink-price-section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '6px 0', padding: '4px 0', borderBottom: '1px dashed #ccc' }}>
          <div className="bind-eink-main-price" style={{ display: 'flex', alignItems: 'baseline', color: '#e02020' }}>
            <span className="price-currency" style={{ fontSize: '12px', fontWeight: '800', marginRight: '3px' }}>SAR</span>
            <span className="price-value" style={{ fontSize: '36px', fontWeight: '900' }}>{displayPrice}</span>
          </div>
        </div>
      )}

      <div className="bind-eink-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
        <div className="bind-eink-product-title" style={{ fontSize: '14px', fontWeight: '800', color: '#000', textAlign: 'right', direction: 'rtl' }}>
          {displayTitle}
        </div>
        {barcode && (
          <div className="bind-eink-product-barcode font-mono" style={{ fontSize: '10px', color: '#666' }}>
            {barcode}
          </div>
        )}
      </div>
    </div>
  );
};
