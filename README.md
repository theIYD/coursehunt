![](https://github.com/theIYD/coursehunt/blob/master/doc/coursehunt.png)

## Coursehunt
A desktop application which allows you to batch download a course from <a href="https://coursehunters.net">coursehunters</a>. Coursehunters is a platform where you can download online courses for free, learn and spread knowledge.

Download - https://github.com/theIYD/coursehunt/releases

## Features
- [x] On a click, batch download the course. The lessons are downloaded one by one without any internal interruptions.
- [x] Get a realtime progress which shows you the download speed in kB/s, time remaining and the size transferred.
- [x] Pause and resume the download at any instant. 
- [ ] On sudden offline, pause the current download.
- [x] If the download is suddenly stopped due to some error, the file is re-downloaded again.

## Build
Clone the github repository and install the dependencies using `yarn`.

```sh
$ git clone https://github.com/theIYD/coursehunt coursehunt
$ cd coursehunt
$ yarn install
```

Next, to start the application,
```sh
$ npm start
```

## Credits
Special thanks to [coursehunters](https://coursehunters.net/) for spreading knowledge by providing free courses from great platforms.

- [Electron](https://electronjs.org)
- [request](https://github.com/request/request)
- [request-progress](https://github.com/IndigoUnited/node-request-progress)
- [cheerio](https://github.com/cheeriojs/cheerio)
- [is-Online](https://github.com/sindresorhus/is-online)

## Contribute
Contributions are always welcomed in the form of issues and pull requests.
Show some love by starring the repository. 🤘✌️

Inspired by https://github.com/alekseylovchikov/ch-download

## License
MIT
