const express = require('express');
const router = express.Router();
const Docker = require('dockerode');
process.env.dockerSocket = process.platform === "win32" ? "//./pipe/docker_engine" : "/var/run/docker.sock";
const docker = new Docker({socketPath: process.env.dockerSocket});
const rateLimit = require('express-rate-limit');
const FileLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 requests per minute
    message: 'Too many requests, please try again after a minute.'
});
router.get('api/all',FileLimiter, async (req, res) => {
    const auth = req.headers.authorization;
    if(!auth == `Bearer ${config.secret_key}`) return res.status(401).json({ message: `Unauthorized`})
    docker.listContainers({all: true}, (err, containers) => {
        if(err) return res.status(500).json({error: err});
        res.json(containers);
    });
});

router.get('api/server/:id',FileLimiter, async (req, res) => {
    const auth = req.headers.authorization;
    if(!auth == `Bearer ${config.secret_key}`) return res.status(401).json({ message: `Unauthorized`})
    const id = req.params.id;
    docker.getContainer(id).inspect((err, container) => {
        if(err) return res.status(500).json({error: err});
        res.json(container);
    });
});

router.get('api/server/:id/ports',FileLimiter, async (req, res) => {
    const auth = req.headers.authorization;
    if(!auth == `Bearer ${config.secret_key}`) return res.status(401).json({ message: `Unauthorized`})
    const id = req.params.id;
    docker.getContainer(id).inspect((err, container) => {
        if(err) return res.status(500).json({error: err});
        res.json(container.NetworkSettings.Ports);
    });
});

module.exports = router;