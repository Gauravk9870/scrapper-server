import app from './src/app.js';
import { config } from "./src/utils/config.js";
import connectDB from "./src/utils/db.js";

const startServer = async () => {
    await connectDB();

    const port = config.port || 3000;

    app.listen(port, () => {
        console.log("Listening on port : ", port);
    });
};

startServer();