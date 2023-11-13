// profile_analysis_module.js
// Created on: October 10, 2023
// Description:
// -> uses GPT-4 large language modal of OpenAI to get a detailed analysis of a provided user document from the database

// Importing required modules
require("dotenv").config();
const OpenAI = require("openai");

const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Updated function for profile analysis
async function analyzeUserProfile(userProfile) {
  const promptSections = [
    `Profile Analysis:`,
    `Technical Skills:\n- Discuss the technical skills listed in the profile and evaluate their relevance to the current job market.\n`,
    `Experience:\n- Evaluate the candidate's work experience and its relevance to the job roles they are interested in.\n`,
    `Preferences:\n- Discuss the candidate's job preferences and how well they align with their skills and experience.\n`,
    `Strengths:\n- Identify and discuss the strengths evident in the profile.\n`,
    `Areas for Improvement:\n- Identify and discuss areas where the candidate could improve to increase their job market relevance.\n`,
  ];

  const promptContent = promptSections.join("\n");

  const messageContent = `${promptContent}\nProfile Information: ${JSON.stringify(
    userProfile
  )}`;

  console.log("Input Text:", messageContent); // Log the complete message content to check formatting
  try {
    const analysis = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
                        You are a highly experienced information technology career advisor. 
                        Provide a detailed analysis on the job seeker's profile to help them 
                        better match with potential job opportunities and enhance their job search.
                        Address the job seeker as "you" without variations.
                    `,
        },
        {
          role: "user",
          content: messageContent,
        },
        { role: "assistant", content: "" }, // Empty content as the user message already contains all necessary information
      ],
      model: "gpt-4",
    });

    console.log("API Response:", analysis); // Log the entire API response to check for errors or unexpected format
    const responseText = analysis.choices[0].message.content.trim();
    const responseSections = responseText.split("\n\n"); // Assuming each section is separated by two newline characters

    const structuredResponse = {
      technicalSkills: responseSections[0],
      experience: responseSections[1],
      preferences: responseSections[2],
      strengths: responseSections[3],
      areasForImprovement: responseSections[4],
    };

    console.log(structuredResponse);

    return structuredResponse; // Log the structured response to the console
  } catch (err) {
    console.error(err); // Log any errors that occur during the process
    return null;
  }
}

// Export the analyzeUserProfile function
module.exports = analyzeUserProfile;
