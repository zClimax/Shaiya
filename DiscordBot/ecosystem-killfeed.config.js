module.exports = {
  apps: [{
    name: 'shaiya-killfeed-bot',
    script: 'kill-feed.js',
    watch: false,
    autorestart: true,
    restart_delay: 5000,
    env: {
      NODE_ENV: 'production',
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/killfeed-error.log',
    out_file: './logs/killfeed-output.log',
    merge_logs: true,
    max_memory_restart: '200M'
  }]
};