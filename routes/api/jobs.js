const express = require("express");
const router = express.Router();
require("dotenv").config();

const Job = require("../../models/Job");
const Profile = require("../../models/Profile");

const {
  findSimilarDocuments,
  summarizeComparison,
} = require("../../vectorsearch/job_matching_module");

// @route   GET api/jobs/find
// @desc    Get user data
// @access  Private
router.get("/find/:jobTitle?/:city?", (req, res) => {
  const jobTitle = req.params.jobTitle;
  const city = req.params.city;

  let query = {};

  if (jobTitle && city) {
    // If both jobTitle and city are provided, match both
    query.job_title = { $regex: jobTitle, $options: "i" };
    query.job_location = { $regex: new RegExp(city, "i") };
  } else if (jobTitle) {
    // If only jobTitle is provided, match jobTitle and ignore city
    query.job_title = { $regex: jobTitle, $options: "i" };
  } else if (city) {
    // If only city is provided, match city and ignore jobTitle
    query.job_location = { $regex: new RegExp(city, "i") };
  }

  Job.find(query)
    .then((jobs) => res.json(jobs))
    .catch((err) => {
      res.status(400).json(err);
    });
});

// @route   GET api/jobs/get/job/matches
// @desc    Get matching jobs with profile
// @access  Private
router.get("/get/job/matches/:userid", async (req, res) => {
  let result = null;
  let topMatchingJob = null;

  try {
    const userId = req.params.userid;

    // Retrieve user profile document from the database
    const userProfileDoc = await Profile.findOne({ user_id: userId });

    if (userProfileDoc) {
      // Find similar documents based on user profile embedding and years of experience

      const documents = await findSimilarDocuments(
        userProfileDoc.profileembedding,
        userProfileDoc.yrs_experience
      );
      console.log("FOUND SIMILAR DOCUMENTS: -> ", documents);

      if (documents.length > 0) {
        // Get the top matching job
        topMatchingJob = documents[0];

        console.log("USER: -> ", JSON.stringify(userProfileDoc));
        // Remove unnecessary properties like profileembedding
        const userProfileWithoutEmbedding = {
          ...userProfileDoc.toObject({ getters: true, lean: true }),
        };
        if (userProfileWithoutEmbedding.profileembedding) {
          delete userProfileWithoutEmbedding.profileembedding;
        }

        // Summarize the comparison between user profile and the top matching job
        result = await summarizeComparison(
          userProfileWithoutEmbedding,
          topMatchingJob
        );
        console.log("THE RESULT: -> ", result);
      }
    } else {
      console.error("Vector is undefined");
      res.status(400).json({ error: "Vector is undefined" });
      return;
    }

    // Send a success response to the client
    res.status(200).json({ result, job: topMatchingJob });
  } catch (error) {
    console.error(error);
    // Handle errors and send an internal server error response to the client
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
