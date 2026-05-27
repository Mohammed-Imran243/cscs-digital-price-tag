import React from 'react';
import { Building2 } from 'lucide-react';

const Merchants: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Building2 size={28} color="var(--primary-color)" />
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
          Merchants / التجار
        </h2>
      </div>
      <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Building2 size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
        <p style={{ fontSize: '16px', fontWeight: '600' }}>Merchant module coming soon / قريباً</p>
      </div>
    </div>
  );
};

export default Merchants;
