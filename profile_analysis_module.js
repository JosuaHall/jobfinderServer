// Importing required modules
require('dotenv').config();
const OpenAI = require('openai');
const MongoClient = require('mongodb').MongoClient;
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Function to get document from MongoDB
async function getDocumentFromDB(userId) {
    const url = process.env.MONGODB_URL;
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

// Updated function for profile analysis
async function analyzeUserProfile(userProfile) {
    // Remove the profileembedding field before constructing the message content
    delete userProfile.profileembedding;

    const promptSections = [
        `Profile Analysis:`,
        `Technical Skills:\n- Discuss the technical skills listed in the profile and evaluate their relevance to the current job market.\n`,
        `Experience:\n- Evaluate the candidate's work experience and its relevance to the job roles they are interested in.\n`,
        `Preferences:\n- Discuss the candidate's job preferences and how well they align with their skills and experience.\n`,
        `Strengths:\n- Identify and discuss the strengths evident in the profile.\n`,
        `Areas for Improvement:\n- Identify and discuss areas where the candidate could improve to increase their job market relevance.\n`
    ];

    const promptContent = promptSections.join('\n');

    const messageContent = `${promptContent}\nProfile Information: ${JSON.stringify(userProfile)}`;

    console.log('Input Text:', messageContent);  // Log the complete message content to check formatting

    try {
        const analysis = await openai.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `
                        You are a highly experienced information technology career advisor. 
                        Provide a detailed analysis on the job seeker's profile to help them 
                        better match with potential job opportunities and enhance their job search.
                        Address the job seeker as "you" without variations.
                    `
                },
                {
                    role: 'user',
                    content: messageContent
                },
                { role: 'assistant', content: "" }  // Empty content as the user message already contains all necessary information
            ],
            model: 'gpt-4'
        });

        console.log('API Response:', analysis);  // Log the entire API response to check for errors or unexpected format
        
        const responseText = analysis.choices[0].message.content.trim();
        const responseSections = responseText.split('\n\n');  // Assuming each section is separated by two newline characters
        
        const structuredResponse = {
            technicalSkills: responseSections[0],
            experience: responseSections[1],
            preferences: responseSections[2],
            strengths: responseSections[3],
            areasForImprovement: responseSections[4]
        };

        console.log(structuredResponse);  // Log the structured response to the console

    } catch (err) {
        console.error(err);  // Log any errors that occur during the process
    }
}


// Export the analyzeUserProfile function
module.exports = {
    analyzeUserProfile,
};

// Example usage:
// (This could be in another file where you import the analyzeUserProfile function and call it with a user profile)
async function main() {
    try {
        const userId = "User3";
        const userProfileDoc = await getDocumentFromDB(userId);
        if (userProfileDoc) {
            await analyzeUserProfile(userProfileDoc);
        } else {
            console.error("User profile not found");
        }
    } catch(err) {
        console.error(err);
    }
}

// Call the main function
main();
