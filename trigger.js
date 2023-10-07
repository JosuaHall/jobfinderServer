exports = async function(changeEvent) {
    // Get the full document from the change event.
    const doc = changeEvent.fullDocument;

    // Define the OpenAI API url and key.
    const url = 'https://api.openai.com/v1/embeddings';
    const openai_key = context.values.get("openAI_value");

    // Combine all the fields into a single string.
    const combinedFields = [
        doc["job_title"],
        doc["job_title_full"],
        doc["job_title_additional_info"],
        doc["job_position_type"],
        doc["job_position_level"],
        doc["years_experience"],
        doc["job_skills"],
        doc["job_location"],
        doc["company_name"],
        doc["company_industry"],
        doc["company_size"]
    ].join(' ');

    try {
        console.log(`Processing document with id: ${doc._id}`);

        // Call OpenAI API to get the embeddings.
        let response = await context.http.post({
            url: url,
            headers: {
                'Authorization': [`Bearer ${openai_key}`],
                'Content-Type': ['application/json']
            },
            body: JSON.stringify({
                input: combinedFields,
                model: "text-embedding-ada-002"
            })
        });

        // Parse the JSON response
        let responseData = EJSON.parse(response.body.text());

        // Check the response status.
        if(response.statusCode === 200) {
            console.log("Successfully received embedding.");

            const embedding = responseData.data[0].embedding;

            // Use the name of your MongoDB Atlas Cluster
            const collection = context.services.get("jobfinderCluster").db("test").collection("jobsample2");

            // Update the document in MongoDB.
            const result = await collection.updateOne(
                { _id: doc._id },
                { $set: { skillsembedding: embedding }}
            );

            if(result.modifiedCount === 1) {
                console.log("Successfully updated the document.");
            } else {
                console.log("Failed to update the document.");
            }
        } else {
            console.log(`Failed to receive embedding. Status code: ${response.statusCode}`);
        }

    } catch(err) {
        console.error(err);
    }
};