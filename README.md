# ServiceStation

ServiceStation is a containerized [service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) execution environment inspired by [Cloudflare Workers](https://workers.cloudflare.com/). [Web API](https://developer.mozilla.org/en-US/docs/Web/API) support is provided as implemented by [Chromium](https://www.chromium.org/Home).

## Usage

```sh
# Dockerfile
FROM joehehir/servicestation

COPY ./dist/. /var/www/

CMD ["servicestation", "--no-sandbox"]
```

The path `/var/www` represents the root registration scope. Service worker scripts must be named `index.js` and organized within directories matching the desired registration scope (e.g. `/var/www/shop/index.js`).

## Example

A development environment with supporting documentation and comprehensive examples is available at: [github.com/joehehir/servicestation/development](https://github.com/joehehir/servicestation/tree/master/development).

## Options

### CLI arguments

[Chromium command line switches](https://peter.sh/experiments/chromium-command-line-switches/) are supported.

### Live reloading

Automatic reloading when script changes are detected can be enabled.

```sh
# environment variables
LIVE_RELOAD=true
NODE_ENV=development
```

### Logging

[Console API](https://developer.mozilla.org/en-US/docs/Web/API/Console_API) and server access logs can be forwarded to `stdout`.

```sh
# console api: cli arguments
"--enable-logging", "--v=0"

# server access: environment variable
ACCESS_LOG=true
```

### Persistence

[Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache) and [Indexed DB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) storage can be persisted by setting the [user data directory](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/user_data_dir.md).

```sh
# cli argument
"--user-data-dir=/home/node/user-data-dir"
```

### Sandbox Chromium

A [seccomp profile](https://docs.docker.com/engine/security/seccomp/) can be specified for the container.

```sh
# docker-compose.yml
services:
  servicestation:
    ...
    security_opt:
      - seccomp=./chrome.json
    command: ["servicestation"]
```
