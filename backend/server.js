const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname, '..')));


app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sections', require('./routes/sections'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/reports', require('./routes/reports'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'landing.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});