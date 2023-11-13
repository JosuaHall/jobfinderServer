// job_matching_module.js
// Created on: October 10, 2023
// Description: uses vector search technology to find the closes matching job related to
//  user profiles and job entries.
// -> also uses GPT-4 large language modal of OpenAI

// Importing required modules
require("dotenv").config();
const Job = require("../models/Job");
const OpenAI = require("openai");
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Updated Function to find similar documents in MongoDB
async function findSimilarDocuments(vector, yrs_experience) {
  try {
    const cursor = await Job.aggregate([
      {
        $search: {
          index: "default",
          knnBeta: {
            vector: vector,
            path: "jobembedding",
            k: 3,
            filter: {
              compound: {
                must: [
                  {
                    range: {
                      path: "years_experience",
                      lte: yrs_experience,
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          job_posting_id: 1,
          job_posting_date: 1,
          job_title: 1,
          job_title_full: 1,
          job_title_additional_info: 1,
          job_position_type: 1,
          job_position_level: 1,
          years_experience: 1,
          job_skills: 1,
          job_location: 1,
          number_of_applicants: 1,
          company_name: 1,
          company_industry: 1,
          company_size: 1,
          jobembedding: 1,
          score: { $multiply: [{ $meta: "searchScore" }, 100] },
        },
      },
    ]);

    console.log(cursor);

    return cursor;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Generates a detailed analysis and reasoning on the fit between a user profile and a job posting using the GPT-4 model,
 * providing a personalized and structured output to the user, including a match score.
 */
async function summarizeComparison(userProfile, jobDe) {
  // Remove the embedding fields as they are not needed for the comparison.
  // Create a new object without the embedding properties using the spread operator

  // Create a new object without the embedding properties from jobDe
  const jobDetail = { ...jobDe };
  // Remove the embedding property from jobDetail
  if (jobDetail.hasOwnProperty("jobembedding")) {
    delete jobDetail.jobembedding;
  }

  // Adjust the score calculation based on the range of values and format it to two decimal places.
  const matchScore = (
    jobDetail.score <= 1 ? jobDetail.score * 100 : jobDetail.score
  ).toFixed(2);

  // Break down the prompt into an array of strings, each representing a section.
  const promptSections = [
    `Match Score:\n- ${matchScore}%\n`,
    `Technical Skills:\n- Discuss the alignment of technical skills between the profile and job posting.\n`,
    `Experience:\n- Discuss the alignment of experience between the profile and job posting.\n`,
    `Preferences:\n- Discuss the alignment of job preferences between the profile and job posting.\n`,
    `Job Responsibilities:\n- Discuss the alignment of past job responsibilities with the job posting requirements.\n`,
    `Strengths and Alignment:\n- Highlight any areas of particular strength or alignment.\n`,
    `Suggestions for Improvement:\n- Provide suggestions for the user to be better qualified for both the job they matched with and the job they prefer to have.\n`,
    `Conclude with a summary statement on the fit for the role.`,
  ];

  // Join the array into a single string with a newline character in between each section.
  const promptContent = promptSections.join("\n");

  // Concatenate the prompt content with the profile and job information to form the complete message content.
  const messageContent = `${promptContent}\nProfile Information: ${JSON.stringify(
    userProfile
  )}\nJob Information: ${JSON.stringify(jobDetail)}`;

  console.log("Input Text:", messageContent); // Log the complete message content to check formatting

  try {
    // Send the formatted text to GPT-4 to generate a detailed job fitting analysis.
    const summary = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
                        You are a highly experienced information technology related career advisor  
                        analyzing the profile of a tech job seeker in relation to a specific job posting. 
                        Provide a detailed analysis, including suggestions for improvement 
                        to better match the job posting, while addressing the tech job seeker directly.
                        Make sure to discuss the match score in the first part of the analysis. Address
                        the job seeker as "you" without variations.
                    `,
        },
        {
          role: "user",
          content: messageContent,
        },
      ],
      model: "gpt-4",
    });

    console.log("API Response:", summary); // Log the entire API response to check for errors or unexpected format
    const responseText = summary.choices[0].message.content.trim(); // Log the detailed job fitting analysis to the console
    const responseSections = responseText.split("\n\n"); // Each section is separated by two newline characters

    const structuredResponse = {
      matchScore: responseSections[0],
      technicalSkills: responseSections[1],
      experience: responseSections[2],
      preferences: responseSections[3],
      jobResponsibilities: responseSections[4],
      strengthsAndAlignment: responseSections[5],
      suggestionsForImprovement: responseSections[6],
      conclusion: responseSections[7],
    };
    return structuredResponse;
  } catch (err) {
    console.error(err); // Log any errors that occur during the process
  }
}

module.exports = {
  findSimilarDocuments,
  summarizeComparison,
};
