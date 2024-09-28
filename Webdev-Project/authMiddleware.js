const fs = require('fs');
const bcrypt = require('bcrypt');
const path = require('path');

const authMiddleware = (req, res, next) => {
    const { username, password } = req.body;

    // Read the users.txt file
    const usersData = fs.readFileSync(path.join(__dirname, 'users.txt'), 'utf8');

    // Split the file into individual user entries
    const users = usersData.split('------------------------------\n').filter(entry => entry.trim());

    // Flag to track if login is successful
    let loginSuccess = false;

    users.forEach(user => {
        const [storedUsername, storedEmail, storedHashedPassword] = user.trim().split('\n').map(line => line.split(': ')[1]);

        // Compare the provided username and password
        if (storedUsername === username && bcrypt.compareSync(password, storedHashedPassword)) {
            loginSuccess = true;
        }
    });

    if (loginSuccess) {
        // Add user data to request object for use in the next middleware/route
        req.user = { username };
        next(); // Proceed to the next middleware/route
    } else {
        res.send(`
            <h1>Login Failed</h1>
            <p>Invalid username or password.</p>
            <p><a href="/login.html">Try Again</a></p>
        `);
    }
};

module.exports = authMiddleware;
