# Qbit Material WebUI

An alternative Web Interface to the original [qBittorrent Web UI](https://github.com/qbittorrent/qBittorrent). This interface is very slimmed down and contains the following features

* Adding/Deleting torrents
* Bulk edit (pause, resume, delete, prioritize, and more)
* Sorting by different metrics (name, size, date completed, etc.)
* File System Navigation (choose where to save a torrent, create sub-folders, etc.)
* A fully material-themed UI (Light & Dark themes)
* ... and more!

## Demo!
A live demo is available here: https://qbit-material-webui-demo.herokuapp.com/.

![Home Page](/builds/images/home_page.jpg)

## Configuring the App
This app relies on a couple files to work properly. This app is tested with **API v2.2** and higher. Any lower version are not guaranteed to work.

### HTTP Config
Under `src/assets/` there are two files: `http_config.json` and `http_config.prod.json`. During the production build, the former is replaced with the latter file. 

If you wish to configure your endpoints and other data for dev/prod, do so here.

### General Config
Under `src/assets/` there are two files: `config.json` and `config.prod.json`. This will store general configuration, such as the delimeter used when parsing file paths (Unix vs. Windows).

## Running the App -- Development
To install the dependencies, run `npm install` in both the root directory and the `mock_backend/` folder.

### Back-end
1. Navigate to `mock_backend` directory
2. Run `node index.js`

### Front-end:
1. Run `ng serve` for a dev server
2. Navigate to `http://localhost:4200/`
3. Username: `admin`; Password: `password`; This can be changed under `mock_backend/config.json`

**Note**: Sometimes clicking the "Login" button will just refresh the page. If this happens, simply clear your cookies and try again.

The app will automatically reload if you change any of the Angular source code.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Replacing existing qBittorrent Web UI
In order to use this version, first follow the instructions outlined [here (*)](https://github.com/qbittorrent/qBittorrent/wiki/Alternate-WebUI-usage).

Once you've completed that:

1. Build the production app (from build section)
2. Navigate to the `dist/` directory, and copy all files to your clipboard
3. Navigate to wherever you placed the `public`/`private` folder from (*)
4. Replace all the contents of the `private` folder with the contents of `dist/` from the project directoy

Alternatively, you can skip Step 1. and take a production-ready build from the `builds` directory in this project. The latest version is zipped.

## Screenshots
The following are some snippets from the alternate UI. They may (or may not) be outdated. To get the best idea of where the app currently is, consider trying out the live demo above or running the app locally.
