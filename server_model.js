const mongoose = require("mongoose")
const Schema = mongoose.Schema

const JobSchema = new Schema({
    job_posting_id: {
        type: Number,
        required: true,
    },
    job_posting_date: {
        type: Date,
        required: true,
    },
    job_title: {
        type: String,
        required: true,
    },
    job_title_full: {
        type: String,
        required: true,
    },
    job_title_additional_info: {
        type: String,
        required: true,
    },
    job_position_type: {
        type: String,
        required: true,
    },
    job_position_level: {
        type: String,
        required: true,
    },
    years_experience: {
        type: Number,
        required: true,
    },
    job_skills: {
        type: String,
        required: true,
    },
    job_location: {
        type: String,
        required: true,
    },
    number_of_applicants: {
        type: Number,
        required: true,
    },
    company_name: {
        type: String,
        required: true,
    },
    company_industry: {
        type: String,
        required: true,
    },
    company_size: {
        type: String,
        required: true,
    },
    jobembedding: {
        type: Array,
        required: true,
    },
})

module.exports = Job = mongoose.model("jobsample2", JobSchema);