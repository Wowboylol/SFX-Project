const mailjet = require("node-mailjet");
const mjet = mailjet.apiConnect(
);

var sendWelcomeEmail = async (recipientEmail, userData) => {
    try {
        const result = await mjet
            .post("send", {'version': 'v3.1'})
            .request({
                "Messages": [{
                    "From": {
                        "Email": "gac9@sfu.ca",
                        "Name": "SFX Project"
                    },
                    "To": [{
                        "Email": `${recipientEmail}`,
                        "Name": `${userData.firstName} ${userData.lastName}`
                    }],
                    "Subject": "Welcome to Secure File Transfer!",
                    "TextPart": `Dear ${userData.firstName}, welcome to Secure File Transfer! May you transfer securely!`,
                    "HTMLPart": 
                        `
                            <h3>Dear ${userData.firstName}, welcome to <a href=\"sfu.ca\">Secure File transfer</a>!</h3>
                            <br/>
                            Here are your account details:
                            <br />
                            Email: ${userData.email} 
                            <br />
                            Name: ${userData.firstName} ${userData.lastName} \n
                            <br />
                            May you transfer securely!
                        `
                }]
            });
        console.log(result.body);
        console.log("GOOD ZZZ");
        return "GOOD";

    } catch (error) {
        console.log("ERROR");
        return "BAD";
    }
}

var sendTestEmail = async (recipientEmail, userData) => {
    try {
        const result = await mjet
            .post("send", {'version': 'v3.1'})
            .request({
                "Messages": [{
                    "From": {
                        "Email": "gac9@sfu.ca",
                        "Name": "SFX Project"
                    },
                    "To": [{
                        "Email": `${recipientEmail}`,
                        "Name": `${userData.firstName} ${userData.lastName}`
                    }],
                    "Subject": "Welcome to Secure File Transfer!",
                    "TextPart": `Dear ${userData.firstName}, welcome to Secure File Transfer! May you transfer securely!`,
                    "HTMLPart": `<h3>Dear ${userData.firstName}, welcome to <a href=\"sfu.ca\">Secure File transfer</a>!</h3><br />May you transfer securely!`
                }]
            });
        console.log(result.body);
        console.log("GOOD ZZZ");
        return "GOOD";

    } catch (error) {
        console.log("ERROR");
        return "BAD";
    }  
}

module.exports = {
    sendWelcomeEmail,
    sendTestEmail
}