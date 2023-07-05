var md5 = require('md5');
const utils = require('./utils');
const { ObjectId } = require('mongodb');
var mongoose = require('mongoose');
mongoose.connect();

var db = mongoose.connection;
db.on("error", console.error.bind(console,"connection error"));

var Schema = mongoose.Schema;
var userSchema = new Schema({
    email: {type: String},
    fname: {type: String},
    lname: {type: String},
    encryption_key: {type: String},
    password: {type: String, minlength: 5},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now}
});
var fileSchema = new Schema({
    user_id: {type: String, required: true},
    shared_by: {type: String, default: null},
    name: {type: String},
    downloaded: {type: Boolean, default: false},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now}
});

var User = mongoose.model("User", userSchema);
var File = mongoose.model("File", fileSchema);

// ==========================
// |== Database functions ==|
// ==========================

// Login accepts an email and non-hashed password
// Returns a user object if user exists, null otherwise
// Note: The password in user object is hashed
const login = async(email, password) => {
    return await User.findOne({ 'email': email, 'password': md5(password) })
        .then((user) => {
            if (user) {
                console.log("User found!");
                return user;
            }
            else {
                console.log("User not found!");
                return null;
            }
        })
        .catch((err)=>{
            console.log(err);
            return null;
        });
}

// Returns true if user exists already
var userExists = async (email) => {
    return await User.findOne({email: email});
}
var userExistsID = async (id) => {
    var retrievedUser = await User.findById(id)
        .catch((err) => {
            return false;
        });

    if(retrievedUser) {
        console.log("User found!");
        return true;
    }
    else {
        console.log("User not found!");
        return false;
    }
}

// Update user's encryption key by user ID
// Returns true if user's encryption key is updated, false otherwise
var updateEncryptionKey = async(userID, encryption_key) => {
    return await User.updateOne({ _id: userID }, { encryption_key: encryption_key }, { updatedAt: Date.now })
        .then((result) => {
            if (result.modifiedCount > 0) {
                console.log("Encryption key updated!");
                return true;
            }
            else {
                console.log("Encryption key not updated!");
                return false;
            }
        });
}

// Update user's first name by user ID
// Returns true if user's first name is updated, false otherwise
var updateFirstName = async(userID, fname) => {
    return await User.updateOne({ _id: userID }, { fname: fname }, { updatedAt: Date.now })
        .then((result) => {
            if (result.modifiedCount > 0) {
                console.log("First name updated!");
                return true;
            }
            else {
                console.log("First name not updated!");
                return false;
            }
        });
}

// Update user's last name by user ID
// Returns true if user's last name is updated, false otherwise
var updateLastName = async(userID, lname) => {
    return await User.updateOne({ _id: userID }, { lname: lname }, { updatedAt: Date.now })
        .then((result) => {
            if (result.modifiedCount > 0) {
                console.log("Last name updated!");
                return true;
            }
            else {
                console.log("Last name not updated!");
                return false;
            }
        });
}

// This function is for testing purposes only
var addUser = async(email, fname, lname, encryption_key, password) => {
    var newUser = new User({
        email: email,
        fname: fname,
        lname: lname,
        encryption_key: encryption_key,
        password: md5(password)
    });
    
    try {
        if(await userExists(email)) throw new Error("User already exists!");
        await newUser.save();
        return true;
    }
    catch(error) {
        console.log(error);
        return false;
    }
    process.exit();
};

// This function is for testing purposes only
var deleteUser = async(userID) => {
    try {
        await User.findByIdAndDelete(userID);
        console.log("User deleted!");
    }
    catch(err) {
        console.log(err);
    }
    process.exit();
}

// Upload a file entry to the database
// Returns file_id if file entry is uploaded, null otherwise
var uploadFile = async(user_id, name) => {
    var newFile = new File({
        user_id: user_id,
        name: name
    });

    try {
        var success = await newFile.save().then(res => {
            return res._id;
        })
        return success;
    }
    catch(error) {
        console.log(error);
        return null;
    }
}

// Given the file ID, find the file entry
// Returns the file entry object, null otherwise
var findFile = async(file_id) => {
    return await File.findOne({ '_id': file_id })
        .then((file) => {
            if (file) {
                console.log("File found!");
                return file;
            }
            else {
                console.log("No files found for this user!");
                return null;
            }
        })
        .catch((err)=>{
            console.log(err);
            return null;
        }
    );
}

// Given the file ID, delete the file entry
// Returns true if file entry is deleted, false otherwise
var deleteFile = async(file_id) => {
    try {
        await File.findByIdAndDelete(file_id);
        console.log("File deleted!");
        return true;
    }
    catch(err) {
        console.log(err);
        return false;
    }
}

// Given the file owner's ID, file ID and user ID to share to, create a shared file entry
// Returns true if shared file entry is created, false otherwise
var shareFile = async(file_owner_id, file_id, user_id, file_owner_key, user_key) => {
    var fileDetails = await findFile(file_id);
    if(fileDetails == null) return false;

    var infile = "./src/files/" + file_owner_id + "/" + file_id;
    var outfile = "./src/files/" + user_id + "/" + file_id;
    utils.convertkey(file_owner_key, infile, user_key, outfile);

    var newFile = new File({
        user_id: user_id,
        name: fileDetails.name,
        shared_by: file_owner_id
    });
    
    try {
        await newFile.save();
        console.log("File shared!");
        return true;
    }
    catch(error) {
        console.log(error);
        return false;
    }
}

var getUserFiles = async(userID) => {
    return await File.find({user_id: userID})
        .then((files) => {
            if (files) {
                console.log("Files found!");
                return files;
            }
            else {
                console.log("Files not found!");
                return null;
            }
        })
        .catch((err)=>{
            console.log(err);
            return null;
        });
}

// Given the file ID, find the shared_by
// Returns the shared_by, null otherwise
var findSharedBy = async(file_id) => {
    return await File.findOne({ '_id': file_id })
        .then((file) => {
            if (file) {
                console.log("File shared_by found!");
                if(file.shared_by == null) return "original";
                else return file.shared_by;
            }
            else {
                console.log("No file with given id found (shared_by)!");
                return null;
            }
        })
        .catch((err)=>{
            console.log(err);
            return null;
        });
}

// Given the user who shared file, find the original file ID
// Returns the original file ID, null otherwise
var findSharedFileId = async(shared_by) => {
    return await File.findOne({ 'user_id': shared_by, 'shared_by': null })
        .then((file) => {
            if (file) {
                console.log("File shared_by found!");
                return file._id;
            }
            else {
                console.log("No file with given id found (shared_by)!");
                return null;
            }
        });
}

module.exports = { 
    login, 
    updateEncryptionKey, 
    updateFirstName, 
    updateLastName,
    addUser, 
    deleteUser,
    userExists,
    userExistsID,
    uploadFile,
    getUserFiles,
    shareFile,
    deleteFile,
    findFile,
    findSharedBy,
    findSharedFileId
};

// Test runs (to be removed later)
// addUser("test@test.com", "John", "Smith", "test_encryption_key", "test_password");
// deleteUser("64166f92efcd55e7cc68048f");
// uploadFile("test_user_id", "test_file");
// fetchUserFiles("642615c33280fea618ab8db5");