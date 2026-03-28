const express = require('express')
const app = express()
const dotenv = require('dotenv')
dotenv.config()
const connectDB = require('./dbConnection/dbConnection')
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");

const PORT = process.env.PORT || 3000
const MONGO_URI = process.env.MONGO_URI

connectDB(MONGO_URI).then(() => {
    console.log('connected to MongoDB');
})
.catch((error) => {
    console.log(error);
    process.exit(1);
})

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
})