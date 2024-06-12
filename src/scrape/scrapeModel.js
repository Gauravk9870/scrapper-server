import mongoose from "mongoose";

const scrapeSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: false,
      default: "",
    },
    description: {
      type: String,
      required: false,
      default: "",
    },
    facebook: {
      type: String,
      required: false,
      default: "",
    },
    twitter: {
      type: String,
      required: false,
      default: "",
    },
    linkedIn: {
      type: String,
      required: false,
      default: "",
    },
    screenshot: {
      type: String,
      required: false,
      default: "",
    },
    favicon: {
      type: String,
      required: false,
      default: "",
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    addresses: {
      type: [String], // Array of strings for multiple physical addresses
      required: false,
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Scrape", scrapeSchema);
