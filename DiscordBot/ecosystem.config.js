module.exports = {
  apps: [{
    name: 'shaiya-discord-bot',
    script: 'index.js',
    watch: false,
    autorestart: true,
    restart_delay: 5000,
    env: {
      NODE_ENV: 'production',
    },
    // Configuración para mantener registros
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    merge_logs: true,
    max_memory_restart: '200M'
  }]
};