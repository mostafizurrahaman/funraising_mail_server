module.exports = {
   apps: [
      {
         name: "replica_server",
         script: "npm run prod:start",
         env: {
            NODE_ENV: "production",
            PORT: 5000,
         },
      },
   ],
};
