import React, { createContext, useContext, useState } from 'react';

export type AppLanguage = 'en' | 'ar' | 'bilingual';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (val: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Centralized dictionary for Chinese API response translations (Lookup complexity: O(1))
const TRANSLATION_MAP: Record<string, { en: string; ar: string }> = {
  // Roles
  '商家超级管理员': {
    en: 'Merchant Super Administrator',
    ar: 'مدير التاجر الأعلى'
  },
  '商家管理员': {
    en: 'Merchant Administrator',
    ar: 'مدير التاجر'
  },
  '系统管理员': {
    en: 'System Administrator',
    ar: 'مدير النظام'
  },
  '超级管理员': {
    en: 'Super Administrator',
    ar: 'مدير النظام الأعلى'
  },
  '商家普通用户': {
    en: 'Merchant Staff',
    ar: 'موظف التاجر'
  },
  '普通用户': {
    en: 'Normal User',
    ar: 'مستخدم عادي'
  },
  '店员': {
    en: 'Store Staff',
    ar: 'موظف متجر'
  },

  // Statuses
  '正常': {
    en: 'Normal',
    ar: 'طبيعي'
  },
  '离线': {
    en: 'Offline',
    ar: 'غير متصل'
  },
  '在线': {
    en: 'Online',
    ar: 'متصل'
  },
  '未绑定': {
    en: 'Unbound',
    ar: 'غير مرتبط'
  },
  '已绑定': {
    en: 'Bound',
    ar: 'مرتبط'
  },
  '启用': {
    en: 'Enabled',
    ar: 'نشط'
  },
  '禁用': {
    en: 'Disabled',
    ar: 'معطل'
  },

  // Device Types & Models
  '电子价签': {
    en: 'ESL Tag',
    ar: 'بطاقة الأسعار الرقمية ESL'
  },
  '基站': {
    en: 'AP Station',
    ar: 'محطة بث AP'
  },

  // Template Categories
  '通用': {
    en: 'General',
    ar: 'عام'
  },
  '生鲜': {
    en: 'Fresh',
    ar: 'طازج'
  },
  '食品': {
    en: 'Food',
    ar: 'طعام'
  },
  '数码': {
    en: 'Digital',
    ar: 'رقمي'
  },
  '母婴': {
    en: 'Maternal & Child',
    ar: 'أمهات وأطفال'
  },
  '百货': {
    en: 'General Merchandise',
    ar: 'سلع متنوعة'
  },
  '促销': {
    en: 'Promotion',
    ar: 'ترويجي'
  },

  // Product Categories
  '生鲜食品': {
    en: 'Fresh Food',
    ar: 'طعام طازج'
  },
  '日用品': {
    en: 'Daily Necessities',
    ar: 'احتياجات يومية'
  },
  '饮料': {
    en: 'Beverages',
    ar: 'مشروبات'
  },
  '零食': {
    en: 'Snacks',
    ar: 'وجبات خفيفة'
  },
  '其他': {
    en: 'Others',
    ar: 'أخرى'
  },
  '默认分类': {
    en: 'Default Category',
    ar: 'تصنيف افتراضي'
  },

  // API Messages / Logging Operations
  '操作成功': {
    en: 'Operation Successful',
    ar: 'تمت العملية بنجاح'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('language') || localStorage.getItem('lang');
    if (saved === 'en') return 'en';
    if (saved === 'ar') return 'ar';
    return 'bilingual'; // default to bilingual format
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    localStorage.setItem('lang', lang);
  };

  // Reusable O(1) translation helper
  const t = (val: any): string => {
    if (val === null || val === undefined) return '';
    const strVal = String(val).trim();
    if (!strVal) return '';

    const translation = TRANSLATION_MAP[strVal];
    if (translation) {
      if (language === 'en') return translation.en;
      if (language === 'ar') return translation.ar;
      return `${translation.en} / ${translation.ar}`;
    }

    return strVal; // Fallback rule: return original value if missing
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
