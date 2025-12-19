

if(process.env.NODE_ENV !="production"){
    require('dotenv').config();
}

console.log(process.env.SECRET);
// require('dotenv').config();
require('dotenv').config();
// const Razorpay = require("razorpay");
const bodyParser = require("body-parser"); // if not already present

const express =require("express");
const app=express();
const mongoose=require("mongoose");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const Razorpay = require("razorpay");

const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");

const listingRouter = require("./routes/listing.js")
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");


const paymentRoutes = require('./routes/payment');
app.use(paymentRoutes);


const dbUrl = process.env.ATLASTDB_URL;

main().then(()=>{
    console.log("connected to db");
}).catch((err)=>{
    console.log(err);
})
async function main(){
    await mongoose.connect(dbUrl);
}
app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
app.use(bodyParser.json()); // Required for parsing JSON


const store =MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});


store.on("error",()=>{
    console.log("error in momgo session store", err);
})

const sessionOptions={
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
})


// app.get("/",(req,res)=>{ 
    // res.send("hi ,i am root");
    // res.render("/listings");
// });
app.get("/", (req, res) => {
    res.redirect("/listings");
});


// app.use("/",listingRouter);
app.use("/listings",listingRouter);

app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);


app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found!"));
});


app.use((err,req,res,next)=>{
    let {statusCode=500, message="something went worng!"}=err;
    res.status(statusCode).render("error.ejs",{message});
    
});




const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
app.post("/create-order", async (req, res) => {
    try {
        const options = {
            amount: 50000, // ₹500 in paise
            currency: "INR",
            receipt: "receipt#1",
        };
        const order = await razorpayInstance.orders.create(options);
        res.json(order);
    } catch (err) {
        res.status(500).send("Error creating Razorpay order");
    }
});


app.listen(3000,()=>{
    console.log("server is listening");
});