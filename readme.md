# teacher.solar

## about

https://teacher.solar/


## description

the `teacher.solar` web application has the following features:
- [matrix](https://matrix.org/) chat (via an embedded [hydrogen](https://github.com/vector-im/hydrogen-web) client)
- webrtc audio conferencing (using [janus](https://janus.conf.meetecho.com/) + [audiobridge plugin](https://janus.conf.meetecho.com/docs/audiobridge.html))
- synchronization between the client with the _instructor role_ and all other clients via websockets, so that students will always see what the teacher sees:
	- [reveal.js](https://revealjs.com/) presentations
		- connected clients are notified about slide changes, etc.
	- wikipedia pages
		- connected clients are notified about changes (page transitions, jumping to specific sections within the page, etc.)
- recording of teaching sessions (to be replayed at a later time)
	- the links to any opened presentation or wikipedia page are automatically be posted to a matrix room
	- the audio conference is saved to a file
	- relevant events (caused by the presentation / wikipedia module, etc.) are time-stamped and logged to a file on the server

## conventions

- this repo uses [git-flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
	- stable / production branch: `master`
	- development / testing branch: `develop`


## setup

install dependencies:
```shell
git clone -recursive <this-repo> teacher.solar
cd teacher.solar
npm install

cd src/hydrogen
npm install
```


## config

rename `src/.env-example` to `src/.env` and edit according to your needs.


## run

- run server: `DEBUG='T.S:*' npm run server`
	- uses https://github.com/visionmedia/debug for logging
- run webpack dev server (client): `npm run dev`
- run hydrogen dev server: `cd src/hydrogen ; npm run start`
	- runs on port 3001 by default

then open `http://localhost:8080`.


## build

production build:

```shell
npm run build:prod
```

building hydrogen:

```shell
cd src/hydrogen
npm run build # output will be in src/hydrogen/target
```


## deploy

TODO
