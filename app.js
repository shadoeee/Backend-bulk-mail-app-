import express from 'express';
import usersRouter from './routes/userRouter.js';
import emailRouter from './routes/emailRouter.js';
import cors from 'cors';



const app = express();

// Use express.json middleware for parsing JSON
app.use(express.json());


// Import and use cors middleware for enabling Cross-Origin Resource Sharing
app.use(cors());

// Use usersRouter for '/users' endpoint
app.use('/users', usersRouter);

// Use emailRouter for '/email' endpoint
app.use('/email', emailRouter);

app.get('/', (req, res) => {
  res.send('Welcome to the API!'); // You can modify the response message as needed
});


export default app;
