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

module.exports = Job = mongoose.model("jobs", JobSchema);

const ProfileSchema = new Schema({
    user_id: {
        type: String,
        required: true,
    },
    street_num: {
        type: Int32,
        required: true,
    },
    street_name: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    zip: {
        type: Int32,
        required: true,
    },
    technical_skills: {
        type: String,
        required: true,
    },
    job_type_pref: {
        type: String,
        required: true,
    },
    target_salary: {
        type: Number,
        required: true,
    },
    yrs_experience: {
        type: Number,
        required: true,
    },
    desired_role: {
        type: String,
        required: true,
    },
    pref_city: {
        type: String,
        required: true,
    },
    pref_state: {
        type: String,
        required: true,
    },
    work_experience: {
        type: String,
        required: true,
    },
    phone_num: {
        type: String,
        required: true,
    },
    dob: {
        type: Date,
        required: true,
    },
});

module.exports = Profile = mongoose.model("profiles", ProfileSchema);