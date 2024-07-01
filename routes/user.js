const express = require('express');
const user = require("../models/users");
const router = express.Router();
const flash = require("connect-flash");
const passport = require('passport');
const { redirectUrl } = require('../middleware');

router.use(flash());

router.get("/signup", (req,res) =>{
    res.render("signup.ejs");
});

router.post("/signup",async(req,res)=>{
    try{
    let {username,email,password} = req.body;
    const newUser = new user({email,username});
    const newRegisteredUser = await user.register(newUser,password);
    console.log(newRegisteredUser);
    req.login(newRegisteredUser , (err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","sign Up successfully");
        res.redirect("/");
    })
    
    
    }
    catch(err){
        req.flash("error",err.message);
        res.redirect("/signup");
        console.log(err);
    }
});

router.get("/login",(req,res) => {
    res.render("login.ejs");
});

router.post("/login",redirectUrl, passport.authenticate("local",{failureRedirect : "/login" , failureFlash : true } ), async(req,res)=>{
    req.flash("success", "Logged in Successfully!");
    let saveRedirectUrl = res.locals.redirectUrl || "/";
    res.redirect(saveRedirectUrl);
});



//logout

router.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
           return next(err);
        }
        req.flash("success","Logged Out Successfully !");
        res.redirect("/");
    })
})


module.exports = router;