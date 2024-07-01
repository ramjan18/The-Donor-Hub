const express = require('express');
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const donor = require("./models/donor");
const { insertMany } = require('./models/donor');
const bloodBank = require ("./models/bloodBank");
const camp=require("./models/campRegistration.js");
const ExpressError = require("./utils/ExpressError.js");
const session = require('express-session');
const flash = require("connect-flash");
const passport=require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/users.js");
const router = express.Router();
const userRouter = require("./routes/user.js");
const {isLoggedIn} = require("./middleware.js");
const { error } = require('console');
const { CLIENT_RENEG_LIMIT } = require('tls');
const dotenv=require("dotenv").config();
const mapboxgl = require("mapbox-gl");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({accessToken : mapToken});
const account_sid=process.env.TWILIO_ACCOUNT_SID;
const authToken=process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(account_sid,authToken);
const TWILIO_NO= process.env.TWILIO_PHONE_NO;



app.set("view engine", "ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname,"/public")));
app.engine("ejs",ejsMate);

const sessionOptions = {
    secret : "mySuperSecret",
    resave : false,
    saveUninitialized : true,
    cookie : {
        expires : Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge : 7 * 24 * 60 * 60 * 1000,
        httpOnly : true,
    }
}

app.use(session(sessionOptions));
app.use(flash());
app.use(methodOverride("_method"));


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    console.log( res.locals.success);
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})



main().then((res)=>{console.log("connection successful")}).catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/test');

  
}

//signup

app.use("/",userRouter);

// router.get("/signup", (req,res) =>{
//     res.render("signup.ejs");
// });

// router.post("/signup",async(req,res)=>{
//     try{
//     let {userName,email,password} = req.body;
//     const newUser = new user({email,userName});
//     const newRegisteredUser = await user.register(newUser,password);
//     console.log(newRegisteredUser);
//     res.redirect("home.ejs");
//     }
//     catch(err){
//         res.send(err);
//     }
// });

// home page

app.get("/",(req,res) =>{
    res.render("home.ejs");
})


// donor page
app.get("/donorPage" ,(req,res)=>{
    res.render("donorPage.ejs");
})

app.get("/donor",isLoggedIn,async(req,res)=>{
   
    const id = req.user._id;
   
   
   const info = await donor.find({owner : id});
   console.log(info);
    res.render("donor.ejs", {info});
});

app.post("/donor",async(req,res,next)=> {
    try{
        const {name,email,contact,age,bloodGroup,address,city,date}=req.body;
        const owner = req.user;
        // console.log (owner);
        const Newdonor =await donor.insertMany({
            name : name,
            email : email,
            contact : contact,
            age : age,
            bloodGroup : bloodGroup,
            address : address,
            city : city,
            lastDate : date,
            owner : owner,
        }) 
    
        // console.log(Newdonor);
        res.redirect("findDonor");
    }
    catch(err){
      next(err);
    }
   
})

//Donor search page

app.get("/findDonor", async (req,res,next)=>{
    // try{
    let {bloodGroup,city}=req.query;
    // console.log(bloodGroup);
    const allDonor =await donor.find({ bloodGroup : bloodGroup, city : {$regex :".*"+city+".*",$options : 'i'}});
    // console.log(req.query.bloodGroup);
    const date1= new Date();
    const date2=new Date("2023-05-13");
    console.log(date2);
    const diff=(date1.getTime() - date2.getTime())/86400000;
    console.log(diff);
    
    res.render("findDonor.ejs", { allDonor,date1 });
    // }catch(err){
    //     next(err);
    // }
});


app.get("/findDonor/:id",async(req,res)=>{
   let {id}= req.params;
   const owner = req.user;
   
   const data =await donor.findById(id);
//    console.log(data);
    res.render("singleDonor.ejs", { data });
});



//sms

let recipient_name,R_address,R_contact_no,donor_id;

app.get("/findDonor/:id/request",async(req,res)=>{
    const {id}= req.params;
    donor_id=id;
    res.render("requestForm.ejs",{id});
    
})
app.post("/findDonor/:id/request",async(req,res)=>{
    
    const {name,address,contact_No}=req.body;
    recipient_name=name;
    R_address=address;
    R_contact_no=contact_No;
    res.redirect(`/findDonor/${donor_id}/request/send`);
})

app.get("/findDonor/:id/request/send",async(req,res)=>{
 
    const data= await donor.findById(donor_id);
    console.log(data);
    
    async function sendSMS(){
        let msgOptions = {
    
        from : TWILIO_NO,
        to : "+91"+data.contact,
        body : "Dear "+ data.name + ", We hope this message finds you well . As a valued member of our community, we wanted to reach out to you with an urgent request. There is currently a critical need for blood donation, and your generous contribution could make a life saving difference."
        +" Would you be available to donate blood at "+ R_address + "? Your willingness to help in this time of need would be greatly appriciated. Thank You for your consideration , and please don't hesitate to contact us if you have any questions . Contact Number : " +R_contact_no 
        +" Best regards : " + recipient_name ,
     }
     try{
       const msg = await client.messages.create(msgOptions);
       console.log(msg);
     }catch(error){
       console.error(error);
    }
    }

    sendSMS();
    req.flash("success","Request Sent Successfully");
    res.redirect(`/findDonor/${donor_id}`)
})

//profile

app.get("/profile/:id",isLoggedIn, async(req,res,next)=>{

    
    let {id} = req.params;
    const owner = req.user;
//    console.log(id);
   
   const info = await donor.find({owner : id});
   

   res.render("profile.ejs", { info,owner});
  
//    console.log(data);
//   data.map( async(user)=>{
//     if(user.owner){
//     if(user.owner == id){
//         const info =await donor.find({owner : user.owner});
//         console.log(info);
//        
//    }}
//    else{
//     res.render("donor.ejs");
//    }
// });
   

     
 });


 //update profile

app.get("/profile/:id/edit" ,async (req,res)=>{
    let {id} = req.params;
   
    // console.log(owner);
    const info = await donor.find({owner : id});
    res.render("editDonor.ejs", {info});
});

  
app.put("/profile/:id/edit", async(req,res)=>{
    let {id} = req.params;
    const {name,email,contact,age,bloodGroup,address,city,date}=req.body;
   const data= await donor.findOneAndUpdate({owner : id},{
    name : name,
    email : email,
    contact : contact,
    age : age,
    bloodGroup : bloodGroup,
    address : address,
    city : city,
    lastDate : date,
   });   
//    console.log(data);
console.log(data.lastDate);
res.redirect(`/profile/${id}`);
   
});

app.delete("/profile/:id", async (req,res)=>{
    let {id} = req.params;
    console.log(id);
    const data= await donor.findOneAndDelete({owner : id})
    console.log(data);
    res.redirect(`/profile/${id}`);
})

// blood bank page

app.get("/bloodBank", (req,res) =>{
    res.render("bloodBank.ejs");
})
 
app.get("/bloodBank/bloodBankRegistration",isLoggedIn,(req,res)=> {
    
    res.render("bloodBankRegistration.ejs")
})

app.post("/bloodBank/bloodBankRegistration", async (req,res,next)=>{
    // try{
        console.log(req.body.Address);
        let response = await geocodingClient.forwardGeocode({
            query: req.body.Address ,
            limit : 1,
        }).send();
        console.log(response.body.features[0].geometry);
        // console.log(response.body.features[0].geometry);

        const {bloodBankName,Category,phone_number,email,Licence_No,State,District,City,Address,Pincode}= req.body;
        const owner = req.user;
    const newBloodBank =await bloodBank.insertMany({
        bloodBankName : bloodBankName,
        category:Category,
        phone_number :phone_number,
        email : email,
        licence_No : Licence_No,
        state :State ,
        district :District,
        city :City ,
        address : Address,
        pincode : Pincode,
        geometry : response.body.features[0].geometry,
        owner : owner,
})
res.redirect("/bloodBank/bloodBankSearch");
//    console.log(newBloodBank);
    // }

    // catch(err){
    //     req.flash("error",err);
    //     next("Something went wrong!");
    // }
   
}) 

app.get("/bloodBank/bloodBankSearch", async (req,res,next) =>{
    let {district,city}=req.query;
    const allBanks = await bloodBank.find({district:{$regex :".*"+district+".*",$options : 'i'} , city : {$regex :".*"+city+".*",$options : 'i'}});
    res.render("bloodBankSearch.ejs",{allBanks});
});



app.get("/bloodBank/bloodBankSearch/:id", async (req,res,next) =>{
    let {id}= req.params;
    currUser = req.user;
    
    // console.log(currUser);
    const data =await bloodBank.findById(id);
    // console.log(data.owner)
 //    console.log(data);
     res.render("bankDetail.ejs", { data , currUser,mapboxgl,mapToken });
});

app.get("/bloodBank/bloodBankSearch/:id/edit", async (req,res,next) =>{
    let {id}= req.params;
    
     const data =await bloodBank.findById(id);
     res.render("editBloodBank.ejs" ,{data});

});
 


app.put("/bloodBank/bloodBankSearch/:id/edit", async(req,res)=>{
    let {id} = req.params;
    // console.log(id);
    const {bloodBankName,Category,phone_number,email,Licence_No,State,District,City,Address,Pincode}= req.body;
   const data= await bloodBank.findByIdAndUpdate( id,
    { bloodBankName : bloodBankName,
        category:Category,
        phone_number :phone_number,
        email : email,
        licence_No : Licence_No,
        state :State ,
        district :District,
        city :City ,
        address : Address,
        pincode : Pincode,
      
   });
   
//    console.log(data);
res.redirect(`/bloodBank/bloodBankSearch/${id}`);
   
});

// blood camp


app.get("/bloodCamp", (req,res)=>{
    const obj= new Date();
    console.log(obj);
   res.render("bloodCamp.ejs");
})

app.get("/bloodCampRegistration",isLoggedIn, (req,res)=>{
    res.render("bloodCampRegistration.ejs");
 })

 app.post("/bloodCampRegistration",isLoggedIn,async(req,res)=>{

    // console.log(req.body.address);
        let response = await geocodingClient.forwardGeocode({
            query: req.body.address ,
            limit : 1,
        }).send();
        console.log(response.body.features[0].geometry);

     const {name,address,city,district,contact,date,conductedBy,organisedBy}=req.body;
     const data= await camp.insertMany({
        camp_Name: name,
        address:address,
        city : city,
        district : district,
        contact : contact,
        campDate : date,
        geometry : response.body.features[0].geometry,
        conducted_By : conductedBy,
        organised_By : organisedBy
     });

    const allDonors= await donor.find({});
   console.log(req.body.date);

    allDonors.map((object)=>{
        if(object.city == req.body.city){
            
            async function sendSMS(){
                let msgOptions = {
            
                from : TWILIO_NO,
                to : "+91"+object.contact,
                body : "New Blood Donation Camp in Your City - Join Us to Save Lives! Dear " + object.name +","
                +" We are excited to inform you that a new blood donation camp has been organized in your city , and we would love to see you there!"
                +" Camp Details : - Organizer : "+ req.body.organisedBy + " -Date : " + req.body.date + " -Location : "+req.body.address + ".  Thank you for your support! The Donor Hub Team" ,
             }
             try{
               const msg = await client.messages.create(msgOptions);
               console.log(msg);
             }catch(error){
               console.error(error);
            }
            }
        
            sendSMS();

        }
    });

     req.flash("success", "Registered Successfully");
     res.redirect("/viewBloodCamp");

 })

 app.get("/viewBloodCamp", async(req,res)=>{
    const allCamp = await camp.find({});
    // console.log(data);
    function del(){
        allCamp.map(async(info)=>{
            if(info.campDate < new Date()){
               const deletedcamp=await camp.findByIdAndDelete(info.id);
               console.log(deletedcamp)
            }
        })
    }
    del();

    const {district}=req.query;
   
    const data= await camp.find({district : {$regex :".*"+district+".*",$options : 'i'}});

    res.render("viewBloodCamps.ejs",{data});
 });

 app.get("/viewBloodCamp/:id",async(req,res)=>{
    const {id}=req.params;
    const data=await camp.findById(id);
    res.render("campdetails.ejs",{data});
 });





 //footer

app.get("/learnAboutDonation",(req,res)=>{
    res.render("learnAboutDonation.ejs");
})

app.get("/gallery",(req,res)=>{
    res.render("gallery.ejs");
})


app.get("/aboutUs",(req,res)=>{
    res.render("aboutUs.ejs");
})


// error handling

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found"));
});
app.use((err,req,res,next) =>{
    let {status , message}=err;
    res.render("error.ejs" ,{message});
})
 

app.listen('3000',()=>{
    console.log("app is listening on port 3000");
})