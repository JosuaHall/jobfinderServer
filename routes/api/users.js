const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const analyzeUserProfile = require("../../vectorsearch/profile_analysis_module");

//User Model
const User = require("../../models/User");
const Profile = require("../../models/Profile");

// @route   Post api/users
// @desc    Register new Users
// @access  Public
router.post("/", (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  //Simple validation
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }
  let regex = new RegExp("[a-z0-9]+@[a-z]+.[a-z]{2,3}");
  if (!regex.test(email)) {
    return res.status(400).json({ msg: "Please enter a valid email address" });
  }
  //check for existing user
  User.findOne({ email }).then((user) => {
    if (user) return res.status(400).json({ msg: "User already exists" });

    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
    });

    //Create salt & hash
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        newUser.save().then((user) => {
          jwt.sign(
            { id: user.id },
            process.env.jwtSecret,
            {
              expiresIn: 3600,
            },
            (err, token) => {
              if (err) throw err;
              res.json({
                token,
                user: {
                  _id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                },
              });
            }
          );
        });
      });
    });
  });
});

function extractAddressParts(address) {
  const match = address.match(/^(\d+)\s*(.*)/);
  if (match) {
    const streetNum = match[1];
    const streetName = match[2].trim();
    return { streetNum, streetName };
  } else {
    // If no number is found, consider the entire address as streetName
    return { streetNum: null, streetName: address.trim() };
  }
}

// @route   POST api/users/create/profile/:userid
// @desc    Register new Profile
// @access  Private
router.post("/create/profile/:userid", (req, res) => {
  const userid = req.params.userid;
  const { personalInfo, jobInfo, workExperience, technicalSkills } = req.body;

  const { streetNum, streetName } = extractAddressParts(personalInfo.street);

  console.log("Street Number:", streetNum);
  console.log("Street Name:", streetName);

  console.log(req.body);

  // Check if required fields are provided
  if (
    !personalInfo.street ||
    !personalInfo.city ||
    !personalInfo.state ||
    !personalInfo.zipCode ||
    !jobInfo.targetSalary ||
    !jobInfo.yearsOfExperience ||
    !jobInfo.desiredRole ||
    !workExperience ||
    !technicalSkills
  ) {
    return res.status(400).json({ msg: "Please provide all required fields." });
  }

  // Create a new Profile instance
  const newProfile = new Profile({
    user_id: userid,
    street_num: streetNum,
    street_name: streetName,
    city: personalInfo.city,
    state: personalInfo.state,
    zip: personalInfo.zipCode,
    technical_skills: technicalSkills,
    target_salary: jobInfo.targetSalary,
    yrs_experience: jobInfo.yearsOfExperience,
    desired_role: jobInfo.desiredRole,
    work_experience: workExperience,
  });

  // Save the new profile to the database
  newProfile
    .save()
    .then((profile) => {
      res.json(profile); // Return the created profile as JSON response
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ msg: "Server Error" }); // Handle server error
    });
});

// @route   PUT api/users/update/profile/:userid
// @desc    Update user profile
// @access  Private
router.put("/update/profile/:userid", (req, res) => {
  const userid = req.params.userid;
  const { personalInfo, jobInfo, workExperience, technicalSkills } = req.body;

  // Check if required fields are provided
  if (
    !personalInfo.street ||
    !personalInfo.city ||
    !personalInfo.state ||
    !personalInfo.zipCode ||
    !jobInfo.targetSalary ||
    !jobInfo.yearsOfExperience ||
    !jobInfo.desiredRole ||
    !workExperience ||
    !technicalSkills
  ) {
    return res.status(400).json({ msg: "Please provide all required fields." });
  }

  // Extract street number and street name from personalInfo.street (if needed)
  const { streetNum, streetName } = extractAddressParts(personalInfo.street);

  // Find the existing profile in the database by user ID
  Profile.findOne({ user_id: userid })
    .then((existingProfile) => {
      if (!existingProfile) {
        return res.status(404).json({ msg: "Profile not found." });
      }

      // Update the existing profile with the new data
      existingProfile.street_num = streetNum;
      existingProfile.street_name = streetName;
      existingProfile.city = personalInfo.city;
      existingProfile.state = personalInfo.state;
      existingProfile.zip = personalInfo.zipCode;
      existingProfile.technical_skills = technicalSkills;
      existingProfile.target_salary = jobInfo.targetSalary;
      existingProfile.yrs_experience = jobInfo.yearsOfExperience;
      existingProfile.desired_role = jobInfo.desiredRole;
      existingProfile.work_experience = workExperience;

      // Save the updated profile to the database
      existingProfile
        .save()
        .then((updatedProfile) => {
          res.json(updatedProfile); // Return the updated profile as JSON response
        })
        .catch((err) => {
          console.error(err);
          res.status(500).json({ msg: "Server Error" }); // Handle server error during update
        });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ msg: "Server Error" }); // Handle server error during database lookup
    });
});

// @route   GET api/users/profile/:userid
// @desc    Get user profile by user ID
// @access  Private
router.get("/profile/:userid", (req, res) => {
  const userid = req.params.userid;

  // Find the profile by user ID in the database
  Profile.findOne({ user_id: userid })
    .then((profile) => {
      if (!profile) {
        return res.status(404).json({ msg: "Profile not found" });
      }
      res.json(profile); // Return the found profile as JSON response
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ msg: "Server Error" }); // Handle server error
    });
});

// @route   GET api/users/get/analysis/:userid
// @desc    Get user profile analysis by user ID
// @access  Private
router.get("/get/analysis/:userid", async (req, res) => {
  try {
    const userid = req.params.userid;

    const profile = await Profile.findOne({ user_id: userid });

    if (!profile) {
      return res.status(404).json({ msg: "Profile not found" });
    }

    const userProfileWithoutEmbedding = {
      ...profile.toObject({ getters: true, lean: true }),
    };
    if (userProfileWithoutEmbedding.profileembedding) {
      delete userProfileWithoutEmbedding.profileembedding;
    }

    console.log("TESTCASE: ", userProfileWithoutEmbedding);

    const response = await analyzeUserProfile(userProfileWithoutEmbedding);
    res.json(response); // Return the analyzed profile as JSON response
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" }); // Handle server error
  }
});

module.exports = router;
