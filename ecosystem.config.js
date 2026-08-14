module.exports = {
   apps: [
      {
         name: "replica_server",
         script: "npm run ./dist/server.js",
         env: {
            NODE_ENV: "production",
            PORT: 5000,
         },
      },
   ],
};
