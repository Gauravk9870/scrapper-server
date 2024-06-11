import express from "express";
import globalErrorHandler from "./middleware/globalErrorHandler.js";
import scrapeRouter from "./scrape/scrapeRouter.js";
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.get("/", (req, res, next) => {
    const health = {
        uptime: process.uptime(),
        message: "OK",
        timestamp: new Date().toLocaleDateString(),
    };

    res.json(health);
});


app.use('/api/scrape', scrapeRouter)

app.use(globalErrorHandler);

export default app;
