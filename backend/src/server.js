const express = require('express');
const session = require('express-session');
const db = require("./database");
const fs = require('fs');
const formidable = require('formidable');
const path = require('path');
const emailService = require("./email")

const app = express();
const port = 80;

const fileStorage = process.env.FILESTORAGEPATH || "./files";

var options = {
    index: 'index.html',
    dotfiles: 'ignore',
    extensions: ['html','css','json','js']
};

app.use('/', express.static(__dirname + '/build/', options));
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(session({
    secret: 'test',
    resave:false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}));

function isLoggedIn(req,res,next){
    if (req.session.user){
        return next()
    }
    res.redirect('/');
}

app.get("/api/relogin", isLoggedIn, (req, res) => {
    res.status(200).json(req.session.user);
})

app.get('/auth', isLoggedIn, (req,res) => {
    res.redirect('/home');
})

app.post('/api/login', async (req,res) => {
    var email = req.body.email;
    var password = req.body.password;
    
    var user = await db.login(email, password);
    if(!user) {
        console.log("INVALID LOGIN");
        res.status(401).send("Invalid login");
    }
    else if(user) {
        console.log("SUCCESSFUL LOGIN", user);
        req.session.user = {id: user._id, email: email, fname: user.fname, lname: user.lname, key: user.encryption_key };
        req.session.regenerate(function (err) {
            if (err) next(err)
            
            req.session.save(function (err) {
              if (err) return next(err)
            });
        });
        res.status(200).send("Successful login");
    }
});

app.post('/api/register', async(req,res) => {
    try {
        var user = req.body;
        if(!user.email || !user.password) throw new Error(
            "Invalid user data request",
            {
                cause: "Invalid User Data"
            }
        );

        var userExists = await db.userExists(user.email);
        if(userExists) throw new Error(
            `User ${user.email} already exists`,
            {
                cause: "User Exists"
            }
        );
        
        var success = await db.addUser(user.email, user.firstName, user.lastName, user.key, user.password);
        if(!success) throw new Error(`Error adding user ${user.email}`);

        var new_user = await db.userExists(user.email);
        var dir = __dirname + "/files/" + new_user._id;

        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        
        console.log(`User ${user.email} registered`)
        res.status(200).json({ message: `Successfully registered ${user.email}`, ok: true });
    }
    catch(error) {
        console.error(error.message);
        res.status(400).json({message: error.message, cause: error.cause});
    }
});

app.get('/api/profile', (req,res) => {
    console.log("Session user:"+JSON.stringify(req.session.user));
    res.json(req.session.user);
});

app.post('/api/profile', async(req,res) => {
    if(!req.session.user) {
        console.log("User not logged in");
        res.status(400).json({message: 'User not logged in'});
        return;
    }
    var res1 = await db.updateFirstName(req.session.user.id,req.body.fname);
    var res2 = await db.updateLastName(req.session.user.id,req.body.lname);
    var res3 = await db.updateEncryptionKey(req.session.user.id,req.body.key);
    if(res1 || res2 || res3) {
        console.log("User updated");
        res.status(200).json({message: "Profile updated"})
    } else {
        console.log("User update failed");
        res.status(400).json({message: "Profile update failed"});
    }
});

app.post("/api/testemail", async (req, res) => {
    try {
        const recipientEmail = req.body.recipientEmail;
        if(!recipientEmail) throw "No recipient email";
        const userData = req.body.userData;
        if(!userData || !userData.fname || !userData.lname) throw "No valid userData";
        console.log("Initiating email");
        const result = await emailService.sendTestEmail(recipientEmail, userData);
        console.log("Success");
        res.send(result);
    }
    catch(error) {
        res.send(error);
    }
});

app.post("/api/sendwelcomemail", async (req, res) => {
    try {
        console.log("Attempting email");
        console.log(req.body);
        const recipientEmail = req.body.recipientEmail;
        if(!recipientEmail) throw { message:"No recipient email"};
        console.log("passed recipient check");
        const userData = req.body.userData;
        console.log(userData);
        if(!userData || !userData.firstName || !userData.lastName) throw {message: "No valid userData"};
        console.log("Initiating email");
        const result = await emailService.sendWelcomeEmail(recipientEmail, userData);
        console.log("Successful email");
        res.send({message: result});
    }
    catch(error) {
        res.send(error);
    }
});

app.post('/api/logout', (req,res) => {
    req.session.destroy();
    res.status(200).redirect('/');
});

app.get('/api/files', async(req,res) => {
    if(!req.session.user) {
        console.log("User not logged in");
        res.status(400).json({message: 'User not logged in'});
        return;
    }
    var files = await db.getUserFiles(req.session.user.id);
    if(!files) {
        console.log("User does not have any files");
        res.status(400).json({message: 'No files'});
    } else {
        console.log("Sending files");
        res.status(200).json(files);
    }
});

app.post('/api/files', async(req,res) => {
    if(!req.session.user) {
        console.log("User not logged in");
        res.status(400).json({message: 'User not logged in'});
        return;
    }

    const userId = req.session.user.id;
    const form = formidable({ multiples: false });

    form.parse(req, async(err, fields, files) => {
        if (err) {
            console.log("File upload failed");
            res.status(400).json({message: 'File upload failed'});
            return;
        }
        var dir = __dirname + "/files/" + userId;

        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }     

        var success = await db.uploadFile(userId, files.upload.originalFilename);
        if(success != null) {
            var oldpath = files.upload.filepath;
            var newpath = __dirname + "/files/" + userId + "/" + success;
        } else {
            console.log("File upload failed");
            res.status(400).json({message: 'File upload failed'});
        }

        fs.cp(oldpath,newpath, async function(err) {
            if(err) {
                console.log("File upload failed");
                res.status(400).json({message: 'File upload failed'});
                return;
            }
            else {
                console.log("File uploaded");
                res.status(200).json({message: 'File uploaded'});
            }
        });
    });
});

app.post('/api/search-user', async(req,res) => {
    var user = await db.userExists(req.body.email);
    if(!user) {
        res.status(400).json({message: 'User does not exist'});
    } else {
        res.status(200).json(user);
    }
});

app.post('/api/share-file', async(req,res) => {
    var recipient = await db.userExists(req.body.email);
    if(!recipient) {
        res.status(400).json({message: 'Recipient email is invalid'});
        return;
    }

    var success = await db.shareFile(req.session.user.id, req.body.file_id, recipient._id, req.session.user.key, recipient.encryption_key);
    if(!success) {
        res.status(400).json({message: 'Error sharing file'});
    } else {
        res.status(200).json({message: 'File shared'});
    }
});

app.get("/api/testdownload", async (req, res) => {
    try {
        res.status(200).download(__dirname + fileStorage + "/1009.png");
    }
    catch(error) {
        console.log(error);
        res.status(400).send(error);
    }
});

//Given a file id, validate and then let client download the file based on the path stored in the database
app.get("/api/download/:fileId", async (req, res) => {
    try {
        console.log("Start request");
        //Determine if file exists in database via file id
        const fileId = req.params.fileId;
        if(!fileId) throw new Error("File ID Invalid");
    
        const file = await db.findFile(fileId);
        if(!file) throw new Error("Could not find file in database");

        //Determine if the file is shared
        const sharedBy = await db.findSharedBy(req.params.fileId);
        var finalFileId = req.params.fileId;
        if(sharedBy != "original" && sharedBy != null) 
        {
            // File is shared if not original and found in database
            finalFileId = await db.findSharedFileId(sharedBy);
            finalFileId = finalFileId.toString();
        }
        
        //Determine if client has permission to that file
        const hasAccess = req.session.user.id == file.user_id;
        if(!hasAccess) throw new Error("User has no access to the file");

        //Determine if there is a file at the path stored in the database
        const filePath = path.join(__dirname, fileStorage, req.session.user.id, finalFileId);
        const fileExists = fs.existsSync(filePath);
        if(!fileExists) throw new Error("File does not exist in file system");

        //Let user download the file
        console.log("Downloading");
        res.status(200).download(filePath);
    }
    catch(error) {
        console.log(error);
        res.status(400).send(error.message || error);
    }
});

app.delete('/api/delete-file', async(req,res) => {
    var user_id = req.session.user.id;
    var file_id = req.body.file_id
    var filePath = __dirname + "/files/" + user_id + "/" + file_id;

    var shared_by = await db.findSharedBy(file_id);
    if(shared_by == "original")
    {
        var result = await db.deleteFile(file_id);
        if(result) {
            fs.unlink(filePath, (err) => {
                if(err) {
                    res.status(400).json({message: "An error has occured, please try again later"});
                }
                else {
                    res.status(200).json({message: "File successfully deleted!"});
                }
            });
        }
        else {
            res.status(400).json({message: "An error has occured, please try again later"});
        }
    }
    else if (shared_by != null)
    {
        var result = await db.deleteFile(file_id);
        if(result) {
            res.status(200).json({message: "File successfully deleted!"});
        }
        else {
            res.status(400).json({message: "An error has occured, please try again later"});
        }
    }
    else {
        res.status(400).json({message: "An error has occured, please try again later"});
    }
});

app.listen(port, () => {
    console.log(`App is running on port ${port}`);
});