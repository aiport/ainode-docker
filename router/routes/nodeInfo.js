const express = require('express');
const chalk = require('chalk');
const router = express.Router();
const config = require('../../config.json')

router.get('/get', (req, res) => {
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