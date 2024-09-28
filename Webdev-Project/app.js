const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('./authMiddleware');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser'); 
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser()); 

// Routes for HTML pages

app.get('/', (req, res) => {
    const username = req.cookies.username;

    if (username) {
        res.sendFile(path.join(__dirname, 'public', 'index-loggedin.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});


app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/blogs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blogs.html'));
});

app.get('/contactus', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/registeration', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registeration.html'));
});

app.get('/dashboard', (req, res) => {
    const username = req.cookies.username;

    if (username) {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    } else {
        res.redirect('/login'); // Redirect to login if user is not authenticated
    }
});


app.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.redirect('/');
});

// Route to handle registration form submission
app.post('/register', (req, res) => {
    const { fullName, email, phone, gender, dob, address, medicalHistory, preferredConsultation, comments } = req.body;

    // Create a string with the form data
    const logEntry = `
Full Name: ${fullName}
Email: ${email}
Phone: ${phone}
Gender: ${gender}
Date of Birth: ${dob}
Address: ${address}
Medical History: ${medicalHistory}
Preferred Consultation Method: ${preferredConsultation}
Comments: ${comments}
------------------------------
`;

    // Append the data to a log file
    fs.appendFileSync('logs.txt', logEntry, (err) => {
        if (err) {
            console.error('Failed to write to file', err);
            res.status(500).send('Internal Server Error');
            return;
        }
    });

    // Send a response to the client
    res.send(`
        <h1>Registration Successful</h1>
        <p>Thank you, <strong>${fullName}</strong>, for registering with the Ministry of AYUSH.</p>
        <p>We have received the following details:</p>
        <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Phone:</strong> ${phone}</li>
            <li><strong>Gender:</strong> ${gender}</li>
            <li><strong>Date of Birth:</strong> ${dob}</li>
            <li><strong>Address:</strong> ${address}</li>
            <li><strong>Medical History:</strong> ${medicalHistory}</li>
            <li><strong>Preferred Consultation Method:</strong> ${preferredConsultation}</li>
            <li><strong>Additional Comments:</strong> ${comments}</li>
        </ul>
        <p>We will contact you soon with further information. We will get back to you via e-mail with your registration details!</p>
        <p><a href="/">Back to Home</a></p>
    `);
});

// Route to handle login form submission
app.post('/login', authMiddleware, (req, res) => {
    res.cookie('username', req.user.username, { httpOnly: true });
    res.redirect('/dashboard'); // Redirect to the homepage after successful login
});

// Route to handle user registration
app.post('/registeration', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Simple validation
    if (password !== confirmPassword) {
        return res.send(`
            <h1>Registration Failed</h1>
            <p>Passwords do not match.</p>
            <p><a href="/registeration.html">Try Again</a></p>
        `);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // For now, store the user data in a file (in production, use a database)
    const userEntry = `
Username: ${username}
Email: ${email}
Password: ${hashedPassword}
------------------------------
`;

    fs.appendFileSync('users.txt', userEntry, (err) => {
        if (err) {
            console.error('Failed to write to file', err);
            return res.status(500).send('Internal Server Error');
        }
    });

    // Send a response to the client
    res.send(`
        <h1>Registration Successful</h1>
        <p>Thank you, <strong>${username}</strong>, for registering with VitaCore.</p>
        <p><a href="/login.html">Go to Login</a></p>
    `);
});


app.post('/submit_contact', (req, res) => {
    const { name, email, phone, message } = req.body;

    // Create a string with the form data
    const contactEntry = `
Name: ${name}
Email: ${email}
Phone: ${phone}
Message: ${message}
------------------------------
`;

    // Append the data to a log file
    fs.appendFileSync('contact_logs.txt', contactEntry, (err) => {
        if (err) {
            console.error('Failed to write to file', err);
            res.status(500).send('Internal Server Error');
            return;
        }
    });

    // Send a response to the client
    res.send(`
        <h1>Thank You for Contacting Us</h1>
        <p>We have received your message and will get back to you shortly.</p>
        <p><a href="/">Back to Home</a></p>
    `);
});




const otps = {}; 

// Generate and send OTP
app.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    fs.readFile('users.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read users file', err);
            return res.status(500).send('Internal Server Error');
        }

        if (data.includes(`Email: ${email}`)) {
            const otp = crypto.randomInt(100000, 999999); // Generate a 6-digit OTP
            otps[email] = otp; // Store OTP in memory, should be replaced with database in production

            // Send OTP via email (setup Nodemailer)
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'worldwidemaster4@gmail.com', // Your Gmail address
                    pass: 'gxbvkunsuvexuyko'
                }
            });

            const mailOptions = {
                from: 'worldwidemaster4@gmail.com',
                to: email,
                subject: 'VitaCore Password Reset OTP',
                text: `Your OTP for password reset is: ${otp}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email', error);
                    return res.status(500).send('Error sending email');
                }

                // Redirect to OTP verification page
                res.redirect(`/otp-verification?email=${encodeURIComponent(email)}`);
            });
        } else {
            res.send(`
                <h1>Email Not Found</h1>
                <p>No account found with the email <strong>${email}</strong>. Please check and try again.</p>
                <p><a href="/forgot-password">Try Again</a></p>
            `);
        }
    });
});

// Serve OTP verification page
app.get('/otp-verification', (req, res) => {
    const email = req.query.email;

    res.send(`
        <h1>OTP Sent</h1>
        <p>An OTP has been sent to <strong>${email}</strong>. Please check your email.</p>
        <form action="/verify-otp" method="POST">
            <label for="otp">Enter OTP:</label>
            <input type="text" id="otp" name="otp" required>
            <input type="hidden" name="email" value="${email}">
            <button type="submit">Verify OTP</button>
        </form>
    `);
});

// Verify OTP
app.post('/verify-otp', (req, res) => {
    const { otp, email } = req.body;

    if (otps[email] && otps[email] == otp) {
        // OTP is valid
        delete otps[email]; // Invalidate OTP after use

        // Redirect to reset password page
        res.redirect(`/reset-password?email=${encodeURIComponent(email)}`);
    } else {
        res.send(`
            <h1>Invalid OTP</h1>
            <p>The OTP you entered is incorrect. Please try again.</p>
            <p><a href="/forgot-password">Request a new OTP</a></p>
        `);
    }
});

// Serve reset password page
app.get('/reset-password', (req, res) => {
    const email = req.query.email;

    res.send(`
        <h1>Reset Password</h1>
        <p>OTP has been verified. Please reset your password.</p>
        <form action="/reset-password" method="POST">
            <label for="password">New Password:</label>
            <input type="password" id="password" name="password" required>
            <input type="hidden" name="email" value="${email}">
            <button type="submit">Reset Password</button>
        </form>
    `);
});

// Reset Password
app.post('/reset-password', async (req, res) => {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    fs.readFile('users.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read users file', err);
            return res.status(500).send('Internal Server Error');
        }

        const updatedData = data.replace(new RegExp(`(Email: ${email}\\nPassword: ).*`, 'g'), `$1${hashedPassword}`);

        fs.writeFile('users.txt', updatedData, (err) => {
            if (err) {
                console.error('Failed to update users file', err);
                return res.status(500).send('Internal Server Error');
            }

            res.send(`
                <h1>Password Reset Successful</h1>
                <p>Your password has been reset successfully. You can now <a href="/login">log in</a> with your new password.</p>
            `);
        });
    });
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
