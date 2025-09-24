import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation('common');

  const languages = [
    { code: 'en', label: t('english') },
    { code: 'hi', label: t('hindi') },
    { code: 'pa', label: t('punjabi') }
  ];

  const current = languages.find(l => l.code === i18n.resolvedLanguage) || languages[0];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="outline-light" size="sm">
        {current.label}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {languages.map(lang => (
          <Dropdown.Item key={lang.code} onClick={() => changeLanguage(lang.code)}>
            {lang.label}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default LanguageSwitcher;


