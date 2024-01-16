const { google } = require('googleapis');
global.CONFIG = require("../configs/config");
const { simpleParser } = require('mailparser');
const AWS = require('aws-sdk');
const axios = require('axios');
AWS.config.update({
    accessKeyId: CONFIG.ACCESS_KEY_ID,
    secretAccessKey: CONFIG.SECRET_ACCESS_KEY,
    region: CONFIG.REGION,
})
const s3 = new AWS.S3();
var parseMessage = require('gmail-api-parse-message');

const bucketName = CONFIG.BUCKET_NAME;
var Imap = require('node-imap');
var inspect = require('util').inspect;
const customEmails = ['admin@agamicommunications.com']
const max_LP = 0;

const clientDao = require('../dao/client')
const adminDao = require('../dao/admin')

const commonController = require("../controller/common/common");
const clientController = require("../controller/client")

const constants = require("../helper/utilities/constants")

let tempSocket = null;
module.exports.pollForNewEmails = async (connectedUsers, io) => {
    try {
        // Iterate over the connected users and retrieve their email addresses and OAuth tokens
        if (connectedUsers.size > 0) {
            console.log(`connectUserSize: ${connectedUsers.size}`)

            console.log(`start polling`)
            for (const [userEmail, userData] of connectedUsers) {
                if (userData.authToken) {
                    try {
                        const { authToken, socketId, socket, uid } = userData;
                        const emailFromToken = getEmailFromGoogleAuth(authToken)
                        tempSocket = socketId
                        // Fetch the user's email threads from the lead_emails database
                        const userThreads = emailFromToken? await clientDao.findUserEmailThreads(emailFromToken, uid) :[] ;
                        console.log(`Threads for user >${userEmail}(token mail: ${emailFromToken}): ${userThreads.length}`)

                        // Retrieve the latest emails for each user thread
                        for (const thread of userThreads) {
                            const { threadId, lastPolledAt, userId, leadId } = thread;
                            const oAuth2Client = new google.auth.OAuth2();
                            oAuth2Client.setCredentials({ access_token: authToken });

                            const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

                            // Fetch the emails in the thread since the last polling time
                            const response = await gmail.users.threads.get({
                                userId: 'me',
                                id: threadId,
                            });

                            const messages = response.data.messages || [];


                            // Filter the emails received in the user's inbox since the last polling
                            const newInboxEmails = messages.filter(
                                (email) => email.labelIds.includes('INBOX') &&
                                    email.labelIds.includes('UNREAD') &&
                                    new Date(parseInt(email.internalDate)) > lastPolledAt
                            );


                            // Check if there are any new emails in the user's inbox
                            if (newInboxEmails.length > 0) {
                                console.log(`inside emit new emails`);
                                console.log(`current thread:${thread.threadId}`);
                                console.log("new messages in the thread: ", newInboxEmails);

                                for (const newEmail of newInboxEmails) {
                                    const messageId = newEmail.id;
                                    let sender = newEmail.payload.headers.find((header) => header.name === 'From').value;
                                    let receiver = newEmail.payload.headers.find((header) => header.name === 'To').value;
                                    const emailRegex = /[\w\.-]+@[\w\.-]+/;

                                    const senderMatch = sender.match(emailRegex);
                                    const receiverMatch = receiver.match(emailRegex);

                                    if (senderMatch) {
                                        sender = senderMatch[0];
                                    }
                                    if (receiverMatch) {
                                        receiver = receiverMatch[0];
                                    }

                                    const replyEmailData = {
                                        id: messageId,
                                        leadId,
                                        userId,
                                        threadId: threadId,
                                        sender: sender,
                                        receivers: receiver,
                                        body: '',
                                        subject: '',
                                        lastPolledAt: new Date(),
                                        date: new Date(),
                                    };

                                    const response = await gmail.users.messages.get({
                                        userId: 'me',
                                        id: messageId,
                                        format: 'full', // Request the full format of the message
                                    });

                                    const fullMessage = response.data;

                                    if (fullMessage) {
                                        var parsedMessage = parseMessage(fullMessage);

                                        replyEmailData.subject = parsedMessage.headers.subject;
                                        // extract reply and thread data separately
                                        const latestEmailBody = extractLatestEmailBody(parsedMessage);
                                        // console.log(parsedMessage);
                                        // Emit a custom event to notify the connected user about new emails 
                                        replyEmailData.body = latestEmailBody.reply;
                                        await clientDao.updateLeadEmailDetails(replyEmailData, threadId);
                                        io.to(socketId).emit('newEmails', latestEmailBody, sender);
                                        const emailTLObj = [{ ...replyEmailData }];
                                        console.log(`creating TL for reply`);
                                        await commonController.createTimeLine(emailTLObj, constants.timeLineOperation.REC_EMAIL_REPLY, userId);

                                    }

                                }
                            }

                        }
                    }
                    catch (err) {
                        console.log(err)
                        if (err.response && err.response.status === 401) {
                            // Token expired or authentication issue
                            console.error('Token expired or authentication issue:', error);
                            // Handle token expiration here, e.g., refresh the token and retry
                            if (connectedUsers.has(userEmail)) {
                                const { socketId, socket } = connectedUsers.get(userEmail);
    
                                // Disconnect the socket by its ID
                                socket.disconnect();
    
                                // Remove the userEmail entry from the connectedUsers map
                                connectedUsers.delete(userEmail);
                            }
    
                            io.to(tempSocket).emit('gAuthFailed', { message: 'failed gauth' });
                            tempSocket = null;
        
                        }


                    }

                }
                else if (userData.uid) {
                    console.log(`this uid connected: ${userData.uid}`)
                    ///////////////////
                    const user = await adminDao.getCustomLoginDetails(userData.uid)
                    // console.log(`user:${user}`)
                    //continue with imap fewtch

                }

            }
        }
        else {
            // setTimeout(() => console.log(`no connected users`), 10000)
        }

    } catch (error) {
        console.error('Error polling for new emails:', error);

    }
};
module.exports.pollForNewCustomEmails = async () => {
    customEmails.forEach((email) => {
        // console.log(`polling for user: ${email}`)
        // Customize the IMAP configuration for each email address
        const imap = new Imap({
            user: email,
            password: 'admin@mail2023', // Use the appropriate password for each email
            host: 'mail.agamicommunications.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        });
        function openInbox(cb) {
            imap.openBox('INBOX', true, cb);
        }
        imap.once('ready', function () {
            openInbox(async function (err, box) {
                if (err) throw err;

                const userThreads = await clientDao.findUserEmailThreads(email,null);
                // console.log(`custom user thread length: ${userThreads.length}`)
                // console.log(`Polling for threadID" ${threadId}, last Seq: ${lastPolledSeq} `);
                var f = imap.seq.fetch(`*:*`, {
                    bodies: [''],
                    struct: true,
                });
                f.on('message', function (msg, seqno) {
                    // console.log('Message #%d', seqno);
                    var prefix = '(#' + seqno + ') ';

                    msg.on('body', function (stream, info) {
                        var buffer = '';
                        stream.on('data', function (chunk) {
                            buffer += chunk.toString('utf8');
                        });
                        stream.once('end', async function () {
                            // Process and parse the email content here
                            simpleParser(buffer, async (err, parsed) => {
                                if (err) {
                                    console.error('Error parsing email:', err);
                                    return;
                                }
                                for (const thread of userThreads) {
                                    const { threadId, lastPolledAt, userId, leadId, lastPolledSeq } = thread;
                                    if (parsed.references?.includes(threadId) && parsed.date > lastPolledAt) {
                                        console.log(`this is a new email in thread: ${threadId} \n`)
                                        console.log('Subject:', parsed.subject);
                                        console.log('Body:', parsed.html);
                                        const refs = parsed.references

                                        // Convert refs to a string regardless of whether it's an array or a single value
                                        const referencesString = Array.isArray(refs) ? refs.join(' ') : refs.toString();

                                        // console.log(`refs string: ${referencesString}`);

                                        // const referencesString = refs.join(' ');
                                        // console.log(`refs string: ${referencesString}`)

                                        // console.log(`refs: ${parsed.references}, type: ${typeof(parsed.references)} length:${Object.keys(parsed.references).length}`)
                                        let replyEmailData = {
                                            id: parsed.messageId,
                                            leadId,
                                            userId,
                                            threadId: threadId,
                                            sender: parsed.from.text,
                                            receivers: parsed.to.text,
                                            body: parsed.text,
                                            customBody: parsed.html, // customBody to store replies on custom email
                                            subject: parsed.subject,
                                            lastPolledAt: new Date(),
                                            date: new Date(),
                                            lastPolledSeq: seqno,
                                            attachments: [],
                                            references: referencesString,
                                        };

                                        // Create an array of promises for S3 uploads
                                        const uploadPromises = parsed.attachments.map(async (attachment) => {
                                            console.log(`attc name: ${attachment.filename}`);
                                            const fileContent = attachment.content;
                                            const contentType = attachment.contentType;
                                            const fileName = attachment.filename;

                                            let params = {
                                                Bucket: bucketName,
                                                Key: `${Date.now()}_${fileName}`,
                                                Body: Buffer.from(fileContent), // Convert the base64 content to a buffer
                                                ContentType: contentType,
                                            };

                                            try {
                                                // Upload the file to S3 and push the S3 URL to the array
                                                const data = await s3.upload(params).promise();
                                                console.log('File uploaded successfully. S3 URL:', data.Location);
                                                replyEmailData.attachments.push(data.Location);
                                            } catch (err) {
                                                console.error('Error uploading file to S3:', err);
                                            }
                                        });
                                        await Promise.all(uploadPromises)
                                        console.log('==================================== before')
                                        await clientDao.updateLeadEmailDetails(replyEmailData, threadId);
                                        console.log(`added email`)
                                        // io.to(socketId).emit('newEmails', latestEmailBody, sender);
                                        const emailTLObj = [{ ...replyEmailData }];
                                        console.log(`creating TL for reply`);
                                        await commonController.createTimeLine(emailTLObj, constants.timeLineOperation.REC_EMAIL_REPLY, userId);
                                    }
                                }
                                // console.log(`Parsed entry: ${JSON.stringify(parsed)}`);
                                // Extract the relevant information


                            });
                        });
                    });

                    msg.once('attributes', function (attrs) {
                        // console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
                    });

                    msg.once('end', function () {
                        // console.log(prefix + 'Finished');
                    });
                });

                f.once('error', function (err) {
                    console.log('Fetch error: ' + err);
                });

                f.once('end', function () {
                    // console.log('Done fetching all messages for ' + email + `in thread: ${thread.threadId}`);
                    imap.end();
                });



            });
        });

        imap.once('error', function (err) {
            console.log(err);
        });

        imap.once('end', function () {
            console.log('Connection ended for ' + email);
        });

        imap.connect();
    })
};

const extractLatestEmailBody = (data) => {
    console.log(`data.textHTML : ${data.textHtml}`);
    if (data && data.textHtml) {
        const textHtml = data.textHtml;
        const latestEmailBody = {}

        // Find the index of the different reply divs based on clients
        const index = textHtml.indexOf('<div class="gmail_quote">');

        if (index !== -1) {
            // Slice the textHTML into two parts based on the index of the marker
            latestEmailBody.reply = textHtml.slice(0, index);
            latestEmailBody.rest = textHtml.slice(index);

            return latestEmailBody;
        }
        else {
            const agamiIndex = textHtml.indexOf('<div data-anchor="reply-title">')

            if (agamiIndex !== -1) {
                // Slice the textHTML into two parts based on the index of the marker
                latestEmailBody.reply = textHtml.slice(0, agamiIndex);
                latestEmailBody.rest = textHtml.slice(agamiIndex);

                return latestEmailBody;
            }
            else {
                const outlookIndex = textHtml.indexOf('<div id="appendonsend"></div>')

                if (agamiIndex !== -1) {
                    // Slice the textHTML into two parts based on the index of the marker
                    latestEmailBody.reply = textHtml.slice(0, outlookIndex);
                    latestEmailBody.rest = textHtml.slice(outlookIndex);

                    return latestEmailBody;
                }
            }
        }

    }

    // If the marker is not found, treat the whole textHTML as reply and the rest as empty
    return { reply: data.textHtml, rest: '' };
};

const getEmailFromGoogleAuth = async (authToken) => {
    const USERINFO_URL = 'https://www.googleapis.com/gmail/v1/users/me/profile';

    try {
        const response = await axios.get(USERINFO_URL, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        // If the request is successful, you can retrieve the email from the response.
        const email = response.data.emailAddress;

        return email // Send the email as a JSON response
    } catch (error) {
        console.error('Error verifying Google Auth token:', error);
        return null
    }
}


// module.exports.pollForNewCustomEmails = async () => {
//     customEmails.forEach((email) => {
//         // console.log(`polling for user: ${email}`)
//         // Customize the IMAP configuration for each email address
//         const imap = new Imap({
//             user: email,
//             password: 'admin@mail2023', // Use the appropriate password for each email
//             host: 'mail.agamicommunications.com',
//             port: 993,
//             tls: true,
//             tlsOptions: { rejectUnauthorized: false }
//         });
//         function openInbox(cb) {
//             imap.openBox('INBOX', true, cb);
//         }
//         imap.once('ready', function () {
//             openInbox(async function (err, box) {
//                 if (err) throw err;

//                 const userThreads = await clientDao.findUserEmailThreads(`${email}`);
//                 for (const thread of userThreads) {
//                     const { threadId, lastPolledAt, userId, leadId, lastPolledSeq } = thread;
//                     // console.log(`Polling for threadID" ${threadId}, last Seq: ${lastPolledSeq} `);
//                     var f = imap.seq.fetch(`${lastPolledSeq == 0 ? 1 : lastPolledSeq}:*`, {
//                         bodies: [''],
//                         struct: true,
//                     });
//                     f.on('message', function (msg, seqno) {
//                         // console.log('Message #%d', seqno);
//                         var prefix = '(#' + seqno + ') ';

//                         msg.on('body', function (stream, info) {
//                             var buffer = '';
//                             stream.on('data', function (chunk) {
//                                 buffer += chunk.toString('utf8');
//                             });
//                             stream.once('end', async function () {
//                                 // Process and parse the email content here
//                                 simpleParser(buffer, async (err, parsed) => {
//                                     if (err) {
//                                         console.error('Error parsing email:', err);
//                                         return;
//                                     }

//                                     // console.log(`Parsed entry: ${JSON.stringify(parsed)}`);
//                                     // Extract the relevant information
//                                     if (parsed.references?.includes(threadId) && parsed.date > lastPolledAt) {
//                                         console.log(`this is a new email in thread: ${threadId} \n`)
//                                         console.log('Subject:', parsed.subject);
//                                         console.log('Body:', parsed.html);
//                                         const refs = parsed.references

//                                         // Convert refs to a string regardless of whether it's an array or a single value
//                                         const referencesString = Array.isArray(refs) ? refs.join(' ') : refs.toString();

//                                         // console.log(`refs string: ${referencesString}`);

//                                         // const referencesString = refs.join(' ');
//                                         // console.log(`refs string: ${referencesString}`)

//                                         // console.log(`refs: ${parsed.references}, type: ${typeof(parsed.references)} length:${Object.keys(parsed.references).length}`)
//                                         let replyEmailData = {
//                                             id: parsed.messageId,
//                                             leadId,
//                                             userId,
//                                             threadId: threadId,
//                                             sender: parsed.from.text,
//                                             receivers: parsed.to.text,
//                                             body: parsed.text,
//                                             customBody: parsed.html, // customBody to store replies on custom email
//                                             subject: parsed.subject,
//                                             lastPolledAt: new Date(),
//                                             date: new Date(),
//                                             lastPolledSeq: seqno,
//                                             attachments: [],
//                                             references: referencesString,
//                                         };

//                                         // Create an array of promises for S3 uploads
//                                         const uploadPromises = parsed.attachments.map(async (attachment) => {
//                                             console.log(`attc name: ${attachment.filename}`);
//                                             const fileContent = attachment.content;
//                                             const contentType = attachment.contentType;
//                                             const fileName = attachment.filename;

//                                             let params = {
//                                                 Bucket: bucketName,
//                                                 Key: `${Date.now()}_${fileName}`,
//                                                 Body: Buffer.from(fileContent), // Convert the base64 content to a buffer
//                                                 ContentType: contentType,
//                                             };

//                                             try {
//                                                 // Upload the file to S3 and push the S3 URL to the array
//                                                 const data = await s3.upload(params).promise();
//                                                 console.log('File uploaded successfully. S3 URL:', data.Location);
//                                                 replyEmailData.attachments.push(data.Location);
//                                             } catch (err) {
//                                                 console.error('Error uploading file to S3:', err);
//                                             }
//                                         });
//                                         await Promise.all(uploadPromises)
//                                         console.log('==================================== before')
//                                         await clientDao.updateLeadEmailDetails(replyEmailData, threadId);
//                                         console.log(`added email`)
//                                         // io.to(socketId).emit('newEmails', latestEmailBody, sender);
//                                         const emailTLObj = [{ ...replyEmailData }];
//                                         console.log(`creating TL for reply`);
//                                         await commonController.createTimeLine(emailTLObj, constants.timeLineOperation.REC_EMAIL_REPLY, userId);
//                                     }

//                                 });
//                             });
//                         });

//                         msg.once('attributes', function (attrs) {
//                             // console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
//                         });

//                         msg.once('end', function () {
//                             // console.log(prefix + 'Finished');
//                         });
//                     });

//                     f.once('error', function (err) {
//                         console.log('Fetch error: ' + err);
//                     });

//                     f.once('end', function () {
//                         // console.log('Done fetching all messages for ' + email + `in thread: ${thread.threadId}`);
//                         imap.end();
//                     });

//                 }

//             });
//         });

//         imap.once('error', function (err) {
//             console.log(err);
//         });

//         imap.once('end', function () {
//             console.log('Connection ended for ' + email);
//         });

//         imap.connect();
//     })
// };