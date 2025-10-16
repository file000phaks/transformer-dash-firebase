const { createServer } = require("./index.cjs");

const app = createServer();
const port = 5005;

app.listen(port, () => console.log(`Server running on http://localhost:${port}/api`));

// Graceful shutdown
// process.on( "SIGTERM", () => {
//   console.log( "🛑 Received SIGTERM, shutting down gracefully" );
//   process.exit( 0 );
// } );

// process.on( "SIGINT", () => {
//   console.log( "🛑 Received SIGINT, shutting down gracefully" );
//   process.exit( 0 );
// } );
