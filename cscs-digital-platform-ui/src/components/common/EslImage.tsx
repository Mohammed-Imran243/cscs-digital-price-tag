import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface EslImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  imagePath: string;
}

export const EslImage: React.FC<EslImageProps> = ({ imagePath, ...props }) => {
  const [base64Image, setBase64Image] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchImage = async () => {
      if (!imagePath) {
        setLoading(false);
        setError(true);
        return;
      }

      try {
        setLoading(true);
        // Remove leading slash if any to ensure correct path encoding
        const path = imagePath.replace(/^\//, '');
        const response = await api.get(`/api/dragon/image?path=${encodeURIComponent(path)}`);
        
        if (isMounted && response.data) {
          setBase64Image(response.data);
          setError(false);
        }
      } catch (err) {
        console.error('Failed to load image from backend', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [imagePath]);

  if (loading) {
    return <div className="image-loading-placeholder" style={{ ...props.style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.05)' }}>Loading...</div>;
  }

  if (error || !base64Image) {
    return <div className="image-error-placeholder" style={{ ...props.style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,0,0,0.05)', color: 'red', fontSize: '12px' }}>Image Error</div>;
  }

  return <img src={base64Image} {...props} />;
};
