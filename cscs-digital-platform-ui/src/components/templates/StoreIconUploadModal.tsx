import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { getPreViewPics, addCutStoreIcon } from '../../services/templateService';

interface StoreIconUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  showNotification: (msg: string, type: 'success' | 'error' | 'warning') => void;
  storeId: string;
}

export const StoreIconUploadModal: React.FC<StoreIconUploadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  showNotification,
  storeId
}) => {
  const [describeName, setDescribeName] = useState('');
  const [parseAlgorithm, setParseAlgorithm] = useState<number>(0); // 0: Dithering, 1: Close color processing
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [effectPreviewUrl, setEffectPreviewUrl] = useState<string | null>(null);
  const [originalBase64, setOriginalBase64] = useState<string | null>(null);
  
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const urlsToRevoke = useRef<{ original: string | null, effect: string | null }>({ original: null, effect: null });

  useEffect(() => {
    urlsToRevoke.current = { original: originalPreviewUrl, effect: effectPreviewUrl };
  }, [originalPreviewUrl, effectPreviewUrl]);

  // Revoke object URLs ONLY on unmount to prevent memory leaks and strict-mode double invocation bugs
  useEffect(() => {
    return () => {
      if (urlsToRevoke.current.original) URL.revokeObjectURL(urlsToRevoke.current.original);
      if (urlsToRevoke.current.effect) URL.revokeObjectURL(urlsToRevoke.current.effect);
    };
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      showNotification('Picture format must be JPG or PNG.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size (600KB max)
    if (file.size > 600 * 1024) {
      showNotification('Image size cannot exceed 600 KB.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);

    // Create local object URL for original picture
    if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
    const url = URL.createObjectURL(file);
    setOriginalPreviewUrl(url);

    // Create Base64 for the save payload
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        setOriginalBase64(event.target.result);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Generate Effect Preview when file or processing method changes
  useEffect(() => {
    let active = true;

    const fetchPreview = async () => {
      if (!selectedFile) {
        if (effectPreviewUrl) {
          URL.revokeObjectURL(effectPreviewUrl);
          setEffectPreviewUrl(null);
        }
        return;
      }

      setLoadingPreview(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('parseAlgorithm', String(parseAlgorithm));
        // You may need to append additional params if getPreViewPics requires them

        const blob = await getPreViewPics(formData);
        
        if (!active) return;

        if (blob.type === 'application/json' || blob.type.includes('json')) {
          const text = await blob.text();
          console.error('Preview API returned JSON error:', text);
          throw new Error('Preview API returned an error');
        }

        if (effectPreviewUrl && !effectPreviewUrl.startsWith('data:image')) URL.revokeObjectURL(effectPreviewUrl);
        const newPreviewUrl = URL.createObjectURL(blob);
        setEffectPreviewUrl(newPreviewUrl);

      } catch (err) {
        console.error('Failed to generate preview', err);
        // Fallback to original image if Dragon ESL API cannot generate a preview for store icons
        if (active && selectedFile) {
          setEffectPreviewUrl(URL.createObjectURL(selectedFile));
        } else if (active) {
          showNotification('Failed to generate preview. Check network or file.', 'error');
        }
      } finally {
        if (active) setLoadingPreview(false);
      }
    };

    fetchPreview();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, parseAlgorithm]); // Intentional: we only want to fetch when these change

  const handleDelete = () => {
    setSelectedFile(null);
    setOriginalBase64(null);
    if (originalPreviewUrl) {
      URL.revokeObjectURL(originalPreviewUrl);
      setOriginalPreviewUrl(null);
    }
    if (effectPreviewUrl) {
      URL.revokeObjectURL(effectPreviewUrl);
      setEffectPreviewUrl(null);
    }
  };

  const handleConfirm = async () => {
    if (!describeName.trim()) {
      showNotification('Descriptive name is required.', 'error');
      return;
    }
    if (!selectedFile || !originalBase64) {
      showNotification('Please upload a valid image.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        storeId: storeId ? Number(storeId) : 0,
        describeName: describeName.trim(),
        parseAlgorithm,
        picStr: originalBase64
      };

      await addCutStoreIcon(payload);
      showNotification('Store Icon successfully created.', 'success');
      onConfirm();
      onClose();
    } catch (err: any) {
      console.error('Failed to save store icon', err);
      showNotification(err.message || 'Failed to create store icon.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card" style={{ maxWidth: '800px', width: '90vw' }}>
        <div className="modal-header">
          <h3>Upload Picture / رفع صورة</h3>
          <button className="close-btn" onClick={onClose} disabled={saving}>&times;</button>
        </div>
        
        <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Form Top Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label style={{ width: '120px', textAlign: 'right', fontWeight: 600 }}>
                <span className="required-asterisk" style={{ color: '#ef4444' }}>*</span> descriptive name
              </label>
              <input 
                type="text" 
                value={describeName}
                onChange={e => setDescribeName(e.target.value)}
                className="glass-input" 
                style={{ flex: 1 }}
                disabled={saving}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label style={{ width: '120px', textAlign: 'right', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div><span className="required-asterisk" style={{ color: '#ef4444' }}>*</span> Picture process</div>
                <div>ing method</div>
              </label>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="parseAlgorithm"
                    value={0}
                    checked={parseAlgorithm === 0}
                    onChange={() => setParseAlgorithm(0)}
                    disabled={saving}
                    style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
                  />
                  <span style={{ color: parseAlgorithm === 0 ? '#3b82f6' : 'inherit' }}>Dithering</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="parseAlgorithm"
                    value={1}
                    checked={parseAlgorithm === 1}
                    onChange={() => setParseAlgorithm(1)}
                    disabled={saving}
                    style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
                  />
                  <span>Close color processing</span>
                </label>
              </div>
            </div>
          </div>

          {/* Pictures Section */}
          <div style={{ display: 'flex', gap: '32px', marginTop: '8px' }}>
            
            {/* Original Picture */}
            <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Original Picture</h4>
              <div style={{ 
                width: '100%', 
                height: '240px', 
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                backgroundImage: 'repeating-linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), repeating-linear-gradient(45deg, #ccc 25%, #fff 25%, #fff 75%, #ccc 75%, #ccc)',
                backgroundPosition: '0 0, 10px 10px',
                backgroundSize: '20px 20px',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {originalBase64 && (
                  <img src={originalBase64} alt="Original" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                <input 
                  type="file" 
                  accept=".jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={saving}
                />
                <button type="button" className="btn-link" onClick={() => fileInputRef.current?.click()} style={{ color: '#f59e0b', padding: 0 }} disabled={saving}>
                  Choose
                </button>
                <button type="button" className="btn-link" onClick={handleDelete} style={{ color: '#f59e0b', padding: 0 }} disabled={!selectedFile || saving}>
                  Delete
                </button>
              </div>
            </div>

            {/* Effect Picture */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Effect Picture</h4>
              <div style={{ 
                width: '100%', 
                height: '140px', 
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.05)',
                overflow: 'hidden'
              }}>
                {loadingPreview ? (
                  <span style={{ color: 'var(--text-muted)' }}>Loading...</span>
                ) : effectPreviewUrl ? (
                  <img src={effectPreviewUrl} alt="Effect" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No preview</span>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Explanation</div>
                <div>Pic Format Need Suffix Of Jpg / Png</div>
                <div>Picture Can Be Tailored Online</div>
                <div>3. Whether red or yellow is displayed depends on the characteristics of the screen.</div>
                <div>4. Image size does not exceed 600K</div>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="modal-footer" style={{ justifyContent: 'center', paddingTop: '16px', borderTop: 'none', gap: '16px' }}>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleConfirm}
              disabled={saving || !describeName.trim() || !selectedFile}
              style={{ padding: '8px 32px' }}
            >
              {saving ? 'Saving...' : 'Confirm'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={saving}
              style={{ padding: '8px 32px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
