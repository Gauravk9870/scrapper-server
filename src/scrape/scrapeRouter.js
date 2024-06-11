import express from "express";
import { deleteScrapes, getScrapeById, getScrapes, scrapeWebsite } from "./scrapeController.js";

const scrapeRouter = express.Router()

scrapeRouter.get('/', getScrapes)
scrapeRouter.get('/:id', getScrapeById)
scrapeRouter.post('/', scrapeWebsite)
scrapeRouter.delete('/', deleteScrapes)


export default scrapeRouter