import bcrypt from 'bcrypt';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import randomstring from 'randomstring';
import { auth } from '../middleware/auth.js';
import nodemailer from 'nodemailer';

import {
    addToken,
    changePasswordInDB,
    checkString,
    createUser,
    deleteOneString,
    generateHashedPassword,
    getDataFromSessionCollection,
    getUsers,
    updateVerification,
} from '../services/userService.js';
import sendEmail from '../utils/sendEmail.js';
const router = express.Router();

router.use(express.json());

// const API = "http://localhost:3000";
const API = "https://zippy-unicorn-3c6749.netlify.app"

router.get('/', (req, res) => {
  res.send('Welcome to the API!'); // You can modify the response message as needed
});


router.post('/signup', async (req, res) => {
  console.log('Received data:', req.body);
  try {
    const { email, emailVerified, password, userName } = req.body;
    const hashedPassword = await generateHashedPassword(password);
    const userPresentOrNot = await getUsers(email);
    
    if (userPresentOrNot === null) {
      const result = await createUser({
        email: email,
        password: hashedPassword,
        userName: userName,
        emailVerified: emailVerified,
      });

      let token = randomstring.generate();
      const verificationInitiate = await addToken({
        email: email,
        token: token,
        DateTime: new Date()
      });

      const mail = await sendEmail(email, "verification token", `${API}/emailverify/${token}`);

      res.status(200).json({
        message: "Successfully Created",
        verificationInitiate: verificationInitiate,
        ...result,
      });
    } else if (password.length <= 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' });
    } else {
      res.status(400).json({ message: 'User already exists' });
    }
  } catch (error) {
    console.error('Error in signup route:', error);
    res.status(500).json({ error: 'Internal server error' }); // Sending internal server error response
  }
});

router.get('/emailverify/:string', async function(request, response) {
  try {
    const { string } = request.params;

    // Fetch session data using the token
    const sessionData = await getDataFromSessionCollection(string);
    if (!sessionData) {
      return response.status(404).json({ message: 'Invalid verification token' });
    }

    const { randString, email, DateTime } = sessionData;

    // Check if the token has expired
    const expirationTime = 15 * 60 * 1000; // 15 minutes in milliseconds
    const currentTime = new Date().getTime();
    if (currentTime - DateTime.getTime() > expirationTime) {
      // If token is expired, delete the token from the collection
      await deleteOneString(randString);
      return response.status(404).json({ message: 'Verification token has expired' });
    }

    // Find the user in the database by email
    const user = await getUsers(email);
    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    // Update the user's verification status to "yes" in the database
    await updateVerification(email);

    // Remove the verification token from the session collection
    await deleteOneString(randString);

    return response.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({ message: 'Internal Server Error' });
  }
});




// router.get('/emailverify/:string', async function(request, response) {
//   try {
//     const {string } = request.params;
//     const getData = await getDataFromSessionCollection(string);

//     if (getData && getData.value) {
//       const update = await updateVerification(getData.value.email);
//       response.status(200).send({
//         message: "verified successful"
//       });
//     } else {
//       response.status(404).send({
//         message: "invalid credential"
//       });
//     }
//   } catch (error) {
//     console.error("Error:", error);
//     response.status(500).send({
//       message: "Internal Server Error"
//     });
//   }
// });


//below route is to check the email and generate the reset password link and send to mail
router.post('/resetpassword',async function(request, response){
    const data = request.body;
    const getData = await getUsers(data.email);
    if(getData){
      //!create string to reset mail and send to mail.
      const randString = randomstring.generate()
      const verificationInitiate = await addToken({
        email:data.email,
        randString:randString,
        DateTime: new Date()
      });
      
      const mail =await sendEmail(data.email,"Reset Password" , `${API}/pas-reset-completion/${randString}`)  
      response.status(200).send({message:'successfull',mail:mail})
    }else{
      response.status(401).send({message:'invalid credentials'})
    }
    
})
//to get the string and checked wether it is available or not.
router.get('/resetpassword/:string',async function(request, response){
  const {string} =request.params;
  const getResult =await checkString(string);
  if(getResult){
    response.status(200).send({message:"present",email:getResult.email})
  }else{
    response.status(404).send({message:"abscent"})
  }
})

//to reset and password and delete from the database.
router.post('/changepassword/:string',async function(request,response){
  const {string} =request.params;
  const data =request.body;
   const hashedPassword = await generateHashedPassword(data.password)
   const removingfromDb= await deleteOneString(string)
   if(removingfromDb.deletedCount === 1){
     //!changeing password
     const changeInDB = await changePasswordInDB({
       email:data.email,password:hashedPassword
      });
      response.status(200 ).send({message:"successfull"})
    }else{
      response.send({message:"invalid "})
    }
})

//dashboard verification to prevent duplicate tokens and fake users access.
router.get('/verifyToken',auth,async function(request,response){
  // const _id  = request.header("_id");
  // const profile =await getProfilePic(_id)
  response.send({message:'success'})
})


router.post('/login', async function(request, response) {
  const { email, password } = request.body;
  const userFromDB = await getUsers(email);
 
  // Check if the user exists in the database
  if (userFromDB === null) {
    response.status(401).send({ message: "Invalid credentials" });
  } else {
    const myobjectId = userFromDB._id;

    // Check if the user's email is verified
    if (userFromDB.emailVerified === 'yes') {
      const storedDBPassword = userFromDB.password;
      
      // Compare the provided password with the stored password
      const isPasswordCheck = await bcrypt.compare(password, storedDBPassword);

      // Validate the password
      if (isPasswordCheck) {
        // Generate a JWT token upon successful login
        const token = jwt.sign({ foo: userFromDB._id }, process.env.SECURE_KEY);

        // Send success response with token and user details
        response.send({
          message: "Successful login",
          token: token,
          roleId: userFromDB.roleId,
          _id: myobjectId.toString()
        });
      } else {
        // Send error response for invalid credentials
        response.status(401).send({ message: "Invalid credentials" });
      }
    } else {
      // If the email is not verified, initiate email verification process

      // Generate a verification token
      const token = randomstring.generate();
      
      // Store the verification token in the database
      const verificationInitiate = await addToken({
        email: email,
        token: token,
        DateTime: new Date()
      });
      
      // Send an email with the verification token
      const mail = await sendEmail(
        email,
        "Verification Token",
        `${API}/emailverify/${token}`
      );
      
      // Send response indicating verification is pending
      response.status(406).send({ message: "Verification pending" });
    }
  }
});




// Error handling for JSON parsing issues
router.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON parsing error:', err);
    res.status(400).json({ error: 'Invalid JSON' });
  } else {
    next();
  }
});

export default router;