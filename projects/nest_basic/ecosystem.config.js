// const os = require('os');
// const MAX_CPUS = os.cpus().length;
// const MAX_INSTANCES = MAX_CPUS > 3 ? MAX_CPUS - 2 : 1;

module.exports = {
    apps: [
        {
            name: 'nest_basic_setup',
            script: "./dist/main.js",
            exec_mode: 'fork',
            // exec_mode: 'cluster'
            // instances: MAX_INSTANCES,
            env: {
                NODE_ENV: 'production'
            },
            watch: false,
            ignore_watch: ["node_modules", "public", "log", "app", "views"],
            error_file: "~/.pm2/logs/nest_basic_setup-error.log",
            out_file: "~/.pm2/logs/nest_basic_setup-out.log",
        }
    ]
};
