const fs = require('fs');
let code = fs.readFileSync('src/styles/theme.css', 'utf8');

// 1. Add grid breakpoints and line-clamp utilities
if (!code.includes('/* Enterprise Card Grid Breakpoints */')) {
  const cardStyles = `
/* Enterprise Card Grid Breakpoints */
.products-grid, .stores-grid {
  display: grid;
  gap: var(--space-lg);
  margin: var(--space-xl);
}

/* Base: 5 columns */
@media (min-width: 1920px) {
  .products-grid, .stores-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

/* 4 columns */
@media (min-width: 1440px) and (max-width: 1919px) {
  .products-grid, .stores-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 3 columns */
@media (min-width: 1024px) and (max-width: 1439px) {
  .products-grid, .stores-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 2 columns */
@media (min-width: 768px) and (max-width: 1023px) {
  .products-grid, .stores-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 1 column */
@media (max-width: 767px) {
  .products-grid, .stores-grid {
    grid-template-columns: 1fr;
  }
}

/* Card Rules */
.products-grid .glass-card, .stores-grid .glass-card {
  min-height: 280px;
  display: flex;
  flex-direction: column;
}

/* Line-clamp for long titles to prevent grid breakage */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
`;
  code = code + '\n' + cardStyles;
}

fs.writeFileSync('src/styles/theme.css', code);
