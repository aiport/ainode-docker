<div align="center">
<img src="https://avatars.githubusercontent.com/u/168577339?s=200&v=4" align="center">
<br>
<h1><b>AIport</b></h1>

![Docker Image Version](https://img.shields.io/docker/v/nsss651u/ainode)
![Docker Stars](https://img.shields.io/docker/stars/nsss651u/ainode)
![Docker Stars](https://img.shields.io/docker/pulls/nsss651u/ainode)
![Docker Stars](https://img.shields.io/docker/automated/nsss651u/ainode)
![Docker Stars](https://img.shields.io/docker/image-size/nsss651u/ainode)


</div>


# AInode Docker
### A new way to use docker in docker to host your ainode for aiport panel


## Table of Contents

- [Prerequisites](#prerequisites)
- [Installing The Image](#installing-the-image)
- [Running the Container](#running-the-container)
- [Environment Variables](#environment-variables)
- [Connecting to the AI Node Panel](#connecting-to-the-ai-node-panel)
- [Available Routes and Endpoints](#available-routes-and-endpoints)
- [Docker Operations](#docker-operations)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)


## Prerequisites

- **Docker:** Latest version of docker should be installed before using ainode
- **Supported Operating System:** Windows, Linux, Mac OS 
- **Enough Storage:** Atleast 50GB of empty storage and 2GB of ram.

## Installing The Image

Once you have Checked All the Prerequisites and installed docker, open a new terminal and run following commands:


```shell
docker --version
```

The above command will ensure that the docker is properly installed in your system and is running!

Now installing the image:
```shell
docker pull nsss651u/ainode:<latest_tag>
```
⚠️ Change the **latest_tag** to the latest version of the ainode

## Running the Container

Use the following command to make a container

```shell
docker run --privileged -e port=<port> -p <port>:<port> nsss651u/ainode:1.0.1-alpha
```
