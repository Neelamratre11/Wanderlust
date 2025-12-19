const express =require("express");
const router=express.Router();

const wrapAsync=require("../utils/wrapAsync.js");

const ExpressError=require("../utils/ExpressError.js");
const {listingSchema }=require("../schema.js");
const Listing=require("../models/listing.js");
const {isLoggedIn, isOwner, validateListing}=require("../middleware.js")

const User=require("../models/user.js");
const userRouter=require("../routes/user.js");

const listingController=require("../controllers/listings.js");


const multer  = require('multer');

const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });


router
    .route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        
        upload.single('listing[image]'),
        validateListing,
        wrapAsync(listingController.createListing)
    )
    
    
    //new router
router.get("/new",isLoggedIn,listingController.renderNewForm);

router
    .route("/:id")
    .get(wrapAsync (listingController.showListing))
    .put(
        isLoggedIn,
        isOwner,
        upload.single('listing[image]'),
        validateListing,
        wrapAsync(listingController.updateListing))
    .delete(
            isLoggedIn,
            isOwner,
            wrapAsync(listingController.destoryListing));

router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");

    res.render("listings/show", {
        listing,
        razorpayKey: process.env.RAZORPAY_KEY_ID
    });
});


// edit route
router.get("/:id/edit", 
    isLoggedIn, 
    isOwner,
    wrapAsync(listingController.renderEditForm));

 module.exports = router;




