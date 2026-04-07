module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Core surfaces */
        'dui-bg':              'var(--dui-bg)',
        'dui-surface':         'var(--dui-surface)',
        'dui-surface-secondary': 'var(--dui-surface-secondary)',
        'dui-surface-tertiary':  'var(--dui-surface-tertiary)',
        'dui-surface-card':    'var(--dui-surface-card)',

        /* Brand */
        'dui-primary':         'var(--dui-primary)',
        'dui-accent':          'var(--dui-accent)',
        'dui-accent-2':        'var(--dui-accent-2)',

        /* Text */
        'dui-text-primary':    'var(--dui-text-primary)',
        'dui-text-secondary':  'var(--dui-text-secondary)',
        'dui-text-muted':      'var(--dui-text-muted)',

        /* Borders */
        'dui-border':          'var(--dui-border)',

        /* Semantic */
        'dui-danger':          'var(--dui-danger)',
        'dui-success':         'var(--dui-success)',
        'dui-warning':         'var(--dui-warning)',

        /* Table */
        'dui-table-header':    'var(--dui-table-header-bg)',
        'dui-table-hover':     'var(--dui-table-row-hover)',

        /* Badges */
        'dui-badge-bg':        'var(--dui-badge-bg)',
        'dui-badge-text':      'var(--dui-badge-text)',

        /* Charts */
        'dui-chart-1':         'var(--dui-chart-1)',
        'dui-chart-2':         'var(--dui-chart-2)',
        'dui-chart-3':         'var(--dui-chart-3)',
        'dui-chart-4':         'var(--dui-chart-4)',
        'dui-chart-5':         'var(--dui-chart-5)',
      },
    },
  },
  plugins: [],
};
