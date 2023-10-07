// Importing required modules
const axios = require('axios');
const MongoClient = require('mongodb').MongoClient;

// Function to get embeddings from OpenAI API
async function getEmbedding(query) {
    // Define the OpenAI API url and key.
    const url = 'https://api.openai.com/v1/embeddings';
    const openai_key = ''; // Replace with your OpenAI key.
    
    // Call OpenAI API to get the embeddings.
    // Axios is used to make HTTP requests
    let response = await axios.post(url, {
        input: query,
        model: "text-embedding-ada-002"
    }, {
        headers: {
            'Authorization': `Bearer ${openai_key}`,
            'Content-Type': 'application/json'
        }
    });
    
    // Check if the request was successful
    if(response.status === 200) {
        // Return the embedding from the response
        return response.data.data[0].embedding;
    } else {
        // Throw an error if the request was not successful
        throw new Error(`Failed to get embedding. Status code: ${response.status}`);
    }
}

// Function to find similar documents in MongoDB
async function findSimilarDocuments(embedding) {
    const url = ''; // Replace with your MongoDB url.
    const client = new MongoClient(url);
    
    try {
        // Connect to the MongoDB client
        await client.connect();
        
        // Get the database and collection
        const db = client.db('test'); // Replace with your database name.
        const collection = db.collection('jobsample2'); // Replace with your collection name.
        
        // Query for similar documents using the embedding
        const cursor = await collection.aggregate([
            {
                $search: {
                  index: "default",
                  knnBeta: {
                    vector: embedding,
                    path: "skillsembedding",
                    k: 5
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
                "years_experience": 4,
                "job_skills": 1,
                "job_location": 1,
                "number_of_applicants": 1,
                "company_name": 1,
                "company_industry": 1,
                "company_size": 1,
                //"skillsembedding": 1,
                "score": { $meta: "searchScore" }
              }
            }
              
        ]);

        // Convert the cursor to an array of documents
        const documents = await cursor.toArray();
        
        // Return the documents
        return documents;
    } catch(err) {
        // Log any errors
        console.error(err);
    } finally {
        // Close the MongoDB client
        await client.close();
    }
}

// Main function to get embeddings and find similar documents
async function main() {
    const query = 'r, scala, powershell, c++, java, python, tableau, sql, powerbi, c'; // Replace with your query.
    
    try {
        // Get the embedding for the query
        const embedding = await getEmbedding(query);
        // Find similar documents using the embedding
        const documents = await findSimilarDocuments(embedding);
        
        // Log the documents
        console.log(documents);
    } catch(err) {
        // Log any errors
        console.error(err);
    }
}

// Call the main function
main();
