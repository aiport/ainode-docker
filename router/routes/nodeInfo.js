const express = require('express');
const chalk = require('chalk');
const router = express.Router();
const config = require('../../config.json')
const rateLimit = require('express-rate-limit');
const FileLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 requests per minute
    message: 'Too many requests, please try again after a minute.'
});
router.get('/get',FileLimiter, (req, res) => {
    const headers = req.headers;
    if(!headers.authorization) return res.status(401).json({ error: 'Unauthorized' });
    if(headers.authorization !== `Bearer ${config.secret_key}`) return res.status(401).json({ error: 'Unauthorized' });
    const data = {
        version: 'alpha-1.0',
        isConnectable: true,
    }
    res.status(200).json(data);
});

module.exports = router;