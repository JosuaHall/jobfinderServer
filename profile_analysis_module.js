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
        "Profile Analysis:",
        "- Analyze the technical skills, experience, and preferences.",
        "- Identify strengths and areas for improvement.",
        "- Provide suggestions to enhance the profile for better job matching and job searching."
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
        console.log(analysis.choices[0].message.content.trim());  // Log the profile analysis to the console
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
