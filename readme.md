# teacher.solar

## conventions

- this repo uses [git-flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)


## setup

```shell
npm install
```


## config

rename `src/.env-example` to `src/.env` (and edit, if necessary).


## run

- run server: `DEBUG='T.S:*' node src/server/index.js`
	- uses https://github.com/visionmedia/debug#readme for logging
- run dev server (client): `npm run dev`

then open `http://localhost:8080`. to assume the teacher role, open `http://localhost:8080#admin`.


## build

```shell
npm run build:prod
```


## deploy

`TODO`
