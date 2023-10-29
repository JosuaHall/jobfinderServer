const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProfileSchema = new Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
  },
  street_num: {
    type: Number,
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
    type: Number,
    required: true,
  },
  technical_skills: {
    type: String,
    required: true,
  },
  job_type_pref: {
    type: String,
    required: false,
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
    required: false,
  },
  pref_state: {
    type: String,
    required: false,
  },
  work_experience: {
    type: String,
    required: true,
  },
  phone_num: {
    type: String,
    required: false,
  },
  dob: {
    type: Date,
    required: false,
  },
  profileembedding: {
    type: Array,
    required: true,
  },
  register_date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Profile = mongoose.model("profiles", ProfileSchema);
