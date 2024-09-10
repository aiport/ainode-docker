const express = require('express');
const wss = require('ws');
const http = require('http');
const config = require('./config');
const app = express();
const os = require('os');
const cors = require('cors');
const server = http.createServer(app);
const ws = new wss.Server({ server });
const path = require('path');
const Docker = require('dockerode');
const chalk = require('chalk');
const deploy = require('./router/routes/serverDockerFunctions')
const info = require('./router/routes/serverInfoFunctions')
const power = require('./router/routes/serverPowerFunctions')
const file = require('./router/routes/serverFileFunctions')
const nodeInfo = require('./router/routes/nodeInfo');
const { exec } = require('child_process');
const fs = require('fs');
let srv;
let portServer = process.env.SPORT | 3000;
app.use(cors({
    origin: '*',
  }));
  app.use(express.urlencoded({ extended: true }));
app.use(express.json());
let appProcess;

if(config.log_file){
    //check if file exists else create a new file
    const logFilePath = path.join(__dirname, config.log_file);
    if(!fs.existsSync(logFilePath)){
        fs.writeFileSync(logFilePath, '', 'utf8');
    }
    const originalConsoleLog = console.log;
    console.log = function (...args) {
        // Write to the log file
        const logMessage = args.join(' ') + '\n';
        
        // Append log message to the file
        fs.appendFileSync(logFilePath, logMessage);
        
        // Call the original console.log to display in the console as well (optional)
        originalConsoleLog.apply(console, args);
      };
}

// Serve static files (CSS)
app.use(express.static('public'));

  function getIPAddress() {
    const interfaces = os.networkInterfaces();
    for (let iface in interfaces) {
      for (let alias of interfaces[iface]) {
        if (alias.family === 'IPv4' && !alias.internal) {
          return alias.address;
        }
      }
    }
    return 'No external IPv4 address found';
  }
process.env.dockerSocket = process.platform === "win32" ? "//./pipe/docker_engine" : "/var/run/docker.sock";
const docker = new Docker({ socketPath: process.env.dockerSocket });
let consolelogo;
if(config.runtime == "build"){
    consolelogo= fs.readFileSync('./assets/logo-build.txt', 'utf8');
}else{
    consolelogo= fs.readFileSync('./assets/logo-console.txt', 'utf8');

}

let isAuthenticated = false;
if(config.runtime == "build"){
    console.log(chalk.red(consolelogo));
}else{
    console.log(chalk.blueBright(consolelogo));
}
app.get('/ping', (req, res) => {
    res.send('pong');
});

function splitString(str) {
    const parts = str.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid format. String should be in the format "string1:string2"');
    }
    const string1 = parts[0].trim();
    const string2 = parts[1].trim();
    return { string1, string2 };
}
//check if docker is running or not.
if(!config.runtime == "build"){
    docker.ping().then(() => {
        console.log('Docker is running');
    }).catch((err) => {
        throw new Error('Docker is not running. Please start Docker and try again');
        process.exit(1);
    });
}
app.use('/server', deploy);
app.use('/server', info);
app.use('/server', power);  
app.use('/server', file);
app.use('/node', nodeInfo);
ws.on('connection', (socket) => {
    console.log('Client connected ');
    socket.on('message', (message) => {
        message = message.toString('utf8');
        //auth:password - cmd
        const [auth, cmd] = message.split('-');
        console.log(auth)
        console.log(cmd.trim())
        console.log(config.secret_key)
        if(auth.trim() === `auth:${config.secret_key}`){
            console.log('Authenticated');
            socket.send('Authenticated');
            if(!cmd) return;
            const { string1, string2 } = splitString(cmd.trim());
            switch(string1){
                case 'start':
                    docker.getContainer(string2).start().then(() => {
                        socket.send(`Container ${string2} started`);
                    }).catch((err) => {
                        socket.send(`Error starting container ${string2}. Reason: ${err.message}`);
                    });
                    break;
                case 'stop':
                    docker.getContainer(string2).stop().then(() => {
                        socket.send(`Container ${string2} stopped`);
                    }).catch((err) => {
                        socket.send(`Error stopping container ${string2}`);
                    });
                    break;
                case 'restart':
                    docker.getContainer(string2).restart().then(() => {
                        socket.send(`Container ${string2} restarted`);
                    }).catch((err) => {
                        socket.send(`Error restarting container ${string2}`);
                    });
                    break;
                case 'kill':
                    docker.getContainer(string2).kill().then(() => {
                        socket.send(`Container ${string2} killed`);
                    }).catch((err) => {
                        socket.send(`Error killing container ${string2}`);
                    });
                    break
                case 'exec':
                    docker.getContainer(string2).exec({ Cmd: [string2] }).then((exec) => {
                        exec.start({ hijack: true, stdin: true }, (err, stream) => {
                            if (err) {
                                socket.send(`Error executing command on container ${string2}`);
                            }
                            stream.on('data', (chunk) => {
                                socket.send(chunk.toString('utf8'));
                            });
                        });
                    }).catch((err) => {
                        socket.send(`Error executing command on container ${string2}`);
                    });
                    break;
                default:
                    console.log('Not a valid action')
            }
        }else{
            socket.send('Not authenticated');
        }
    });
});

/**
 * 
 */


// HTML form route
app.get('/', (req, res) => {
    const conf = require('./config.json');
    // Check if config.json already exist
    if(conf.secret_key && conf.port && conf.log_file && conf.runtime && conf.panel_url && conf.server_url){
      return res.status(404).sendFile(path.join(__dirname, '/views/404.html'));
    }
  res.sendFile(path.join(__dirname, '/views/index.html'));
});

app.get('/logs', (req, res) => {
    const conf = require('./config.json');
    if(!conf.log_file){
        return res.status(404).send('Log file not found');
    }
    res.sendFile(path.join(__dirname, '/views/log.html'));
});
app.get('/get-logs', (req, res) => {
    const conf = require('./config.json');
    if(!conf.log_file){
        return res.status(404).send('Log file not found');
    }
    const logFilePath = path.join(__dirname, conf.log_file);
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
          return res.status(500).send('Error reading the file.');
        }
        res.send(data);
      });
});

// Route to handle form submission and create config.json
app.post('/create-config', (req, res) => {
  const configFilePath = path.join(__dirname, 'config.json');
  const conf = require('./config.json');
  // Check if config.json already exist
  if(conf.secret_key && conf.port && conf.log_file && conf.runtime && conf.panel_url && conf.server_url){
    return res.status(404).sendFile(path.join(__dirname, '/views/404.html'));
  }
    const configData = {
      secret_key: req.body.secret_key || 'default_key',
      port: req.body.port || '3000',
      log_file: req.body.log_file || './tmp/log_time.log',
      runtime: req.body.runtime || 'build',
      panel_url: req.body.panel_url || 'http://localhost:3001',
      server_url: req.body.server_url || 'http://localhost:1000'
    };

    // Write the config.json file
    fs.writeFile(configFilePath, JSON.stringify(configData, null, 2), (err) => {
      if (err) {
        return res.status(500).send('Error writing the file.');
      }
      res.send('Config file created successfully!');
    });
});

// 404 Page
app.use((req, res) => {
    const conf = require('./config.json');
    if(conf.secret_key && conf.port && conf.log_file && conf.runtime && conf.panel_url && conf.server_url){
      res.status(404).send('The config has not been created yet. Please create the config file first bu going here: <a href="/">Create Config</a>');
    }else{
        res.status(404).sendFile(path.join(__dirname, '/views/404.html'));
    }
  
});
let isServerOnline = false;

const port = portServer;
    if(config.runtime == "build"){
        srv = server.listen(port,'0.0.0.0', () => {
            console.log(`Server running on http://${getIPAddress()}:${port}`);
        });
    }else{
        setInterval(function (){
            docker.ping().then(() => {
               if(!isServerOnline){
                srv = server.listen(port,'0.0.0.0', () => {
                    console.log('Docker is running');
                    console.log(`Server running on port\n \n You can access it locally on: http://${getIPAddress()}:${port}`);
                    isServerOnline = true;
                });
               }
            }).catch((err) => {
                if(isServerOnline){
                    isServerOnline = false;
                    console.log('Docker is not running or docker has crashed due to some reasons.');
                    console.log('Please restart the Docker and try again');
                    process.exit(1);
                }else{
                    console.log('Docker is not running or docker has crashed due to some reasons.');
                    console.log('Please restart the Docker and try again');
                }
            });
        }, 2000);
    }
      