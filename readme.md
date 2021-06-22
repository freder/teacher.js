# teacher.solar

## about

https://teacher.solar/


## conventions

- this repo uses [git-flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
	- stable / production branch: `master`
	- development / testing branch: `develop`


## setup

```shell
git clone -recursive <this-repo> teacher.solar
cd teacher.solar
npm install

cd src/hydrogen
npm install
```


## config

rename `src/.env-example` to `src/.env` (and edit, if necessary).


## run

- run server: `DEBUG='T.S:*' npm run server`
	- uses https://github.com/visionmedia/debug#readme for logging
- run dev server (client): `npm run dev`
- run hydrogen dev server: `cd src/hydrogen ; npm run start`
	- runs on port 3001 by default

then open `http://localhost:8080`.


## build

```shell
npm run build:prod
```

building hydrogen:

```shell
cd src/hydrogen
npm run build # output will be in src/hydrogen/target
```


## deploy

`TODO`
