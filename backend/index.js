//MongoDB connection
const mongoose = require("mongoose");  
mongoose.connect(process.env.MONGO_ATLAS_STRING);

//Express 
const express = require("express");
const app = express();

//cors
const cors = require("cors");
app.use(cors({ origin: true, credentials: true }));

//Body parser
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World");
});

//  AUTHENTICATION 
const authRoutes = require("./routes/auth.js");
app.use("/auth", authRoutes);

// USER
const userRoutes = require("./routes/user.js");
app.use("/user", userRoutes);

// REQUEST
const requestRoutes = require("./routes/request.js");
app.use("/request", requestRoutes);

//PLANNING
const planningRoutes = require('./routes/planning.js');
app.use("/planning", planningRoutes);

app.listen(8000, () => {
    console.log("Server is running on port 8000");
});
