# newman-har-reporter

A custom [postman](https://www.postman.com)/[newman](https://github.com/postmanlabs/newman) reporter that outputs a [HAR](https://en.wikipedia.org/wiki/HAR_(file_format)) file.

## Getting Started

1. Install `newman`
   ```
     npm install -g newman
   ```
2. Install `newman-har-reporter`
   ```
     npm install -g newman-reporter-har
   ```

## Usage

```
newman run <postman-collection> -r har
```

_Note_: If _--reporter-har-export_ parameter is not supplied, the output is written to a "newman" sub-folder and the file will contain the timestamp in its name.

## License
This software is licensed under Apache-2.0. See the [LICENSE.md](LICENSE.md) file for more information.
