// Importing required modules
require('dotenv').config();

const OpenAI = require('openai');
const MongoClient = require('mongodb').MongoClient;
const openai = new OpenAI(process.env.OPENAI_API_KEY);


// Function to get document from MongoDB
async function getDocumentFromDB(userId) {
    const url = process.env.MONGODB_URL; // Use MongoDB URL from .env file
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        const db = client.db('test');
        const collection = db.collection('profiles');
        const document = await collection.findOne({user_id: userId});
        return document;
    } catch(err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

// Updated Function to find similar documents in MongoDB
async function findSimilarDocuments(vector, yrs_experience) {
    const url = process.env.MONGODB_URL;
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        const db = client.db('test');
        const collection = db.collection('jobs');
        
        const cursor = await collection.aggregate([
            {
                $search: {
                    index: "default",
                    knnBeta: {
                        vector: vector,
                        path: "jobembedding",
                        k: 3,
                        filter: {
                            compound: {
                                must: [{
                                    range: {
                                        path: "years_experience",
                                        lte: yrs_experience
                                    }
                                }]
                            }
                        }
                    }
                }
            },
            {
              "$project": {
                "_id": 1,
                "job_posting_id": 1,
                "job_posting_date": 1,
                "job_title": 1,
                "job_title_full": 1,
                "job_title_additional_info": 1,
                "job_position_type": 1,
                "job_position_level": 1,
                "years_experience": 1,
                "job_skills": 1,
                "job_location": 1,
                "number_of_applicants": 1,
                "company_name": 1,
                "company_industry": 1,
                "company_size": 1,
                "jobembedding": 1,
                "score": { $multiply: [{ $meta: "searchScore" }, 100] }
              }
            }
        ]);

        const documents = await cursor.toArray();
        return documents;
    } catch(err) {
        console.error(err);
    } finally {
        await client.close();
    }
}


// Function to log a user profile from the profiles collection
async function logUserProfile(userId) {
    const url = process.env.MONGODB_URL; // Use MongoDB URL from .env file
    const client = new MongoClient(url);
    
    try {
        // Connect to the MongoDB client
        await client.connect();
        
        // Get the database and collection
        const db = client.db('test'); // Replace with your database name.
        const collection = db.collection('profiles'); // Replace with your collection name.
        
        // Query to get the user profile
        const doc = await collection.findOne({user_id: userId});

        // Define the fields to log
        const fields = [
            "user_id",
            "city",
            "state",
            "technical_skills",
            "job_type_pref",
            "target_salary",
            "yrs_experience",
            "desired_role",
            "pref_city",
            "pref_state",
            "work_experience",
            //"profileembedding",
        ];

        // Log each field on a new line with its name
        for (const field of fields) {
            console.log(`${field}: ${doc[field]}`);
        }
    } catch(err) {
        // Log any errors
        console.error(err);
    } finally {
        // Close the MongoDB client
        await client.close();
    }
}

/**
 * Generates a detailed analysis and reasoning on the fit between a user profile and a job posting using the GPT-4 model,
 * providing a personalized and structured output to the user, including a match score.
 */
async function summarizeComparison(userProfile, jobDetail) {
    // Remove the embedding fields as they are not needed for the comparison.
    delete userProfile.profileembedding;
    delete jobDetail.jobembedding;

    // Adjust the score calculation based on the range of values and format it to two decimal places.
    const matchScore = (jobDetail.score <= 1 ? jobDetail.score * 100 : jobDetail.score).toFixed(2);

    // Break down the prompt into an array of strings, each representing a section.
    const promptSections = [
        `Match Score:\n- ${matchScore}%\n`,
        `Technical Skills:\n- Discuss the alignment of technical skills between the profile and job posting.\n`,
        `Experience:\n- Discuss the alignment of experience between the profile and job posting.\n`,
        `Preferences:\n- Discuss the alignment of job preferences between the profile and job posting.\n`,
        `Job Responsibilities:\n- Discuss the alignment of past job responsibilities with the job posting requirements.\n`,
        `Strengths and Alignment:\n- Highlight any areas of particular strength or alignment.\n`,
        `Suggestions for Improvement:\n- Provide suggestions for the user to be better qualified for both the job they matched with and the job they prefer to have.\n`,
        `Conclude with a summary statement on the fit for the role.`
    ];

    // Join the array into a single string with a newline character in between each section.
    const promptContent = promptSections.join('\n');

    // Concatenate the prompt content with the profile and job information to form the complete message content.
    const messageContent = `${promptContent}\nProfile Information: ${JSON.stringify(userProfile)}\nJob Information: ${JSON.stringify(jobDetail)}`;

    console.log('Input Text:', messageContent);  // Log the complete message content to check formatting

    try {
        // Send the formatted text to GPT-4 to generate a detailed job fitting analysis.
        const summary = await openai.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `
                        You are a highly experienced information technology related career advisor  
                        analyzing the profile of a tech job seeker in relation to a specific job posting. 
                        Provide a detailed analysis, including suggestions for improvement 
                        to better match the job posting, while addressing the tech job seeker directly.
                        Make sure to discuss the match score in the first part of the analysis. Address
                        the job seeker as "you" without variations.
                    `
                },
                {
                    role: 'user',
                    content: messageContent  // Revert to sending messageContent as before
                }
            ],
            model: 'gpt-4'
        });

        console.log('API Response:', summary);  // Log the entire API response to check for errors or unexpected format
        
        // Assume GPT-4 response follows the order of the sections in the prompt
        const responseText = summary.choices[0].message.content.trim();
        const responseSections = responseText.split('\n\n');  // Each section is separated by two newline characters
        
        const structuredResponse = {
            matchScore: responseSections[0],
            technicalSkills: responseSections[1],
            experience: responseSections[2],
            preferences: responseSections[3],
            jobResponsibilities: responseSections[4],
            strengthsAndAlignment: responseSections[5],
            suggestionsForImprovement: responseSections[6],
            conclusion: responseSections[7]
        };

        console.log(structuredResponse);  // Log the structured response to the console

    } catch (err) {
        console.error(err);  // Log any errors that occur during the process
    }
}


// Updated main function
async function main() {
    try {
        const userId = "User3";

        await logUserProfile(userId);
        const userProfileDoc = await getDocumentFromDB(userId);
        
        if(userProfileDoc && userProfileDoc.profileembedding) {
            const documents = await findSimilarDocuments(userProfileDoc.profileembedding, userProfileDoc.yrs_experience);
            console.log(documents);
            
            if(documents.length > 0) {
                const topMatchingJob = documents[0];
                await summarizeComparison(userProfileDoc, topMatchingJob);
            }
        } else {
            console.error("Vector is undefined");
        }
    } catch(err) {
        console.error(err);
    }
}

// Call the main function
main();