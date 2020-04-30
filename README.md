# wally

![Package](https://github.com/niventc/wally/workflows/Package/badge.svg)

Collaborative post it and white board app, built with React and Express using Typescript.

Demo available: https://wally.azurewebsites.net (state persists until next restart)

## How to run

1. Use the docker image (https://hub.docker.com/r/niventc/wally)
```
docker run -p 8080:8080 -e PORT=8080 -e NEDB_ROOT_DIR=/data -v <LOCALDIRECTORY>:/data niventc/wally:v0.0.12
```
*Configure NEDB_ROOT to point to the mounted directory to persist state between restarts*

2. Download the latest release artifact e.g. https://github.com/niventc/wally/releases/download/v0.0.12/dist.zip
```
node server.js
```
*Will be available by default at http://localhost:5000, configure the port by setting the PORT environment variable*
*Configure NEDB_ROOT to where you want to persist state*

## License
This project is licensed under the terms of the [Apache License 2.0](LICENSE)
