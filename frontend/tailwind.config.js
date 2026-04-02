module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'dui-primary': 'var(--dui-primary)',
        'dui-surface': 'var(--dui-surface)',
        'dui-surface-secondary': 'var(--dui-surface-secondary)',
        'dui-surface-tertiary': 'var(--dui-surface-tertiary)',
        'dui-text-primary': 'var(--dui-text-primary)',
        'dui-text-secondary': 'var(--dui-text-secondary)',
        'dui-text-muted': 'var(--dui-text-muted)',
        'dui-border': 'var(--dui-border)',
        'dui-danger': 'var(--dui-danger)',
        'dui-success': 'var(--dui-success)',
        'dui-warning': 'var(--dui-warning)',
        'dui-table-header': 'var(--dui-table-header-bg)',
        'dui-badge-bg': 'var(--dui-badge-bg)',
        'dui-badge-text': 'var(--dui-badge-text)',
      },
    },
  },
  plugins: [],
};
