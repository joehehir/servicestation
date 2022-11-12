# ServiceStation/development

ServiceStation development environment.

## Architecture

```mermaid
flowchart LR
    nginx{"nginx<font color=#009e60><br/>TLS</font>"}

    subgraph scope["servicestation"]
        subgraph subgraph_padding[ ]
            style subgraph_padding opacity:0

            router{"servicestation<br/>router"}

            subgraph sw_list[ ]
                style sw_list fill:#f2f2f2,opacity:0.1

                sw_0("servicestation.test/header/"); click sw_0 "https://servicestation.test/header/"
                sw_1("servicestation.test/storage/"); click sw_1 "https://servicestation.test/storage/"
                sw_2("servicestation.test/"); click sw_2 "https://servicestation.test/"
            end
        end
    end

    nginx <--> router
    router <--> sw_0
    router <--> sw_1
    router <--> sw_2

    classDef link-color color:#60a6ff
    class sw_0,sw_1,sw_2 link-color
```

## Installation

1. Install dependencies

* [Docker](https://docs.docker.com/desktop/)
* [mkcert](https://github.com/FiloSottile/mkcert)

2. Configure TLS

```sh
curl -fsSL https://raw.githubusercontent.com/joehehir/lend/master/lend.sh -o lend.sh \
    && /bin/bash lend.sh -v "servicestation-le" "servicestation.test www.servicestation.test"
```

## Running

```sh
docker compose up --build
```

## Development

```sh
# build local development image
docker compose -f ./docker-compose.yml -f ./docker-compose.local.yml up --build -V

# lint servicestation/dist
../src/node_modules/.bin/eslint -c ../src/.eslintrc.js ./servicestation/dist \
    && printf "\n  \033[0;32m%s\033[0m\n\n" "pass"

# test servicestation/dist
export NODE_TLS_REJECT_UNAUTHORIZED=0 \
    ; ../src/node_modules/.bin/_mocha ./servicestation/dist/index.test.js \
    ; export NODE_TLS_REJECT_UNAUTHORIZED=1
```
