
import puppeteer from 'puppeteer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { config } from '../utils/config.js';
import ScrapeModel from './scrapeModel.js';



cloudinary.config({
    cloud_name: config.cloudinary_cloud_name,
    api_key: config.cloudinary_api_key,
    api_secret: config.cloudinary_api_secret,
});



// Helper function to upload screenshot to Cloudinary
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        const readableStream = new Readable();
        readableStream.push(buffer);
        readableStream.push(null);
        readableStream.pipe(stream);
    });
};

export const scrapeWebsite = async (req, res, next) => {
    const { url } = req.body;
    try {

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Go to the specified URL
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Extract title
        const title = await page.title();
        console.log('Title:', title);

        // Extract meta description
        const metaDescription = await page.evaluate(() => {
            const meta = document.querySelector('meta[name="description"]');
            return meta ? meta.getAttribute('content') : null;
        });
        console.log('Meta Description:', metaDescription);

        // Extract social media links
        const socialMediaLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            return links
                .map(link => link.href)
                .filter(href =>
                    href.includes('facebook.com') ||
                    href.includes('twitter.com') ||
                    href.includes('linkedin.com')
                );
        });
        console.log('Social Media Links:', socialMediaLinks);

        const facebook = socialMediaLinks.find(link => link.includes('facebook.com'));
        const twitter = socialMediaLinks.find(link => link.includes('twitter.com'));
        const linkedIn = socialMediaLinks.find(link => link.includes('linkedin.com'));

        // Extract favicon URL
        const faviconUrl = await page.evaluate(() => {
            const linkElements = document.querySelectorAll('link[rel*="icon"]');
            const faviconElement = Array.from(linkElements).find(el => el.getAttribute('href'));
            return faviconElement ? faviconElement.getAttribute('href') : null;
        });
        console.log('Favicon URL:', faviconUrl);

        // Resolve absolute URL for favicon
        const resolvedFaviconUrl = faviconUrl ? new URL(faviconUrl, url).href : null;

        // Extract phone numbers and email addresses
        const contactInfo = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            const phonePattern = /(?:\+?\d{1,3}[ -]?)?(?:\(?\d{2,4}\)?[ -]?)?\d{9,10}/g; // Updated regex for 9-10 digit phone numbers
            const emailPattern = /([\w.-]+@(?=[a-z\d][^.]*\.)[a-z\d.-]*[^.])/g; // Improved regex for email extraction
            const phones = bodyText.match(phonePattern) || [];
            const emails = bodyText.match(emailPattern) || [];
            return {
                phones: [...new Set(phones)], // Remove duplicates
                emails: [...new Set(emails)] // Remove duplicates
            };
        });
        console.log('Contact Info:', contactInfo);

        // Extract addresses

        const addresses = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            const addressPattern = /(\d+\s)?([A-Za-z]+\.?\s){1,5}(Ave|Avenue|St|Street|Rd|Road|Blvd|Boulevard|Ln|Lane|Dr|Drive|Ct|Court|Pl|Place|Way|Pkwy|Parkway|Cres|Crescent|Sq|Square|Circle|Cir|Terr|Terrace|Pz|Plaza|Ste|Suite|Bldg|Building|Floor|Fl|Unit|Apt|Apartment|Rm|Room)\s?(\d{1,5})?((\n)|(\,\s)|(\,\n)|(\s\w{2,3}\s\d{5})|(\n\d{5}))/gim;
            return [...new Set(bodyText.match(addressPattern))];
        });
        console.log('Addresses:', addresses);

        // Take a screenshot
        const screenshotBuffer = await page.screenshot();
        console.log('Screenshot taken');

        // Close the browser
        await browser.close();

        // Upload screenshot to Cloudinary
        const result = await uploadToCloudinary(screenshotBuffer);
        console.log('Screenshot uploaded to Cloudinary:', result.secure_url);

        // Save data to MongoDB
        const newData = new ScrapeModel({
            url,
            title,
            description: metaDescription || '',
            facebook: facebook || '',
            twitter: twitter || '',
            linkedIn: linkedIn || '',
            screenshot: result.secure_url || '',
            favicon: resolvedFaviconUrl || '',
            phoneNumbers: contactInfo.phones,
            emails: contactInfo.emails,
            addresses: addresses
        });

        const savedData = await newData.save();
        console.log('Data saved to MongoDB');

        res.json({
            message: "Scraping completed",
            data: {
                id: savedData._id,
                title,
                description: metaDescription || '',
                screenshot: result.secure_url || '',
                facebook: facebook || '',
                twitter: twitter || '',
                linkedIn: linkedIn || '',
                favicon: resolvedFaviconUrl || '',
                phoneNumbers: contactInfo.phones,
                emails: contactInfo.emails,
                addresses: addresses
            },
        });
    } catch (error) {
        console.error("Scraping error:", error);
        res.status(500).json({ message: "Error scraping the website" });
    }
}



export const getScrapes = async (req, res, next) => {
    try {
        const scrapes = await ScrapeModel.find();
        res.json(scrapes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export const getScrapeById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const scrape = await ScrapeModel.findById(id);

        if (!scrape) {
            return res.status(404).json({ message: 'Cannot find scrape' });
        }

        res.json(scrape)

    } catch (error) {
        return res.status(500).json({ message: err.message });
    }
}

export const deleteScrapes = async (req, res) => {
    try {
        await ScrapeModel.deleteMany({ _id: { $in: req.body.ids } });
        res.json({ message: 'Scrapes deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete scrapes', error: error.message });
    }
};